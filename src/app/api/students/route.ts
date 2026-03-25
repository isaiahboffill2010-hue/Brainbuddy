import { NextResponse } from "next/server";
import { createClient, createServiceClient } from "@/lib/supabase/server";

export async function GET() {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { data: profileData } = await supabase
      .from("profiles")
      .select("id")
      .eq("user_id", user.id)
      .single();
    const profile = profileData as { id: string } | null;

    if (!profile) return NextResponse.json([]);

    const { data, error } = await supabase
      .from("parents_students")
      .select("student_id, students(*)")
      .eq("parent_id", profile.id);

    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const students = (data as unknown as { student_id: string; students: unknown }[])?.map((row) => row.students).filter(Boolean) ?? [];
    return NextResponse.json(students);
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : "Server error";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const supabase = await createClient();
    const service = createServiceClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const body = await req.json();

    // Get or create the parent profile
    let parentProfileId: string | null = null;

    const { data: existingProfileData } = await supabase
      .from("profiles")
      .select("id")
      .eq("user_id", user.id)
      .single();
    const existingProfile = existingProfileData as { id: string } | null;

    if (existingProfile) {
      parentProfileId = existingProfile.id;
    } else {
      const { data: newProfileData, error: profileError } = await service
        .from("profiles")
        .insert({
          user_id: user.id,
          role: "parent",
          full_name: user.user_metadata?.full_name ?? user.email?.split("@")[0] ?? "Parent",
          email: user.email,
        })
        .select("id")
        .single();
      const newProfile = newProfileData as { id: string } | null;

      if (profileError) return NextResponse.json({ error: "Could not create profile. Make sure the database schema has been set up." }, { status: 500 });
      parentProfileId = newProfile?.id ?? null;
    }

    if (!parentProfileId) return NextResponse.json({ error: "Could not resolve parent profile." }, { status: 500 });

    // Create the student — only include extended fields when provided
    // (interests/personality/struggles_with require the ALTER TABLE migration to be run first)
    const studentPayload = {
      name: body.name,
      age: body.age,
      grade: body.grade,
      avatar_emoji: body.avatar_emoji ?? "🦊",
      learning_style: body.learning_style ?? "visual",
      confidence_level: body.confidence_level ?? 5,
      profile_id: parentProfileId,
      ...(body.interests     ? { interests:      body.interests }      : {}),
      ...(body.personality   ? { personality:    body.personality }    : {}),
      ...(body.struggles_with ? { struggles_with: body.struggles_with } : {}),
    };

    const { data: student, error: studentError } = await service
      .from("students")
      .insert(studentPayload)
      .select()
      .single();

    if (studentError) {
      console.error("[students/POST] step=students_insert payload=", JSON.stringify(studentPayload), "error=", studentError);
      return NextResponse.json({ error: `[students_insert] ${studentError.message}` }, { status: 500 });
    }

    // Link to parent
    const { error: linkError } = await service
      .from("parents_students")
      .insert({ parent_id: parentProfileId, student_id: student.id });
    if (linkError) {
      console.error("[students/POST] step=parents_students_insert", linkError);
      return NextResponse.json({ error: `[parents_students] ${linkError.message}` }, { status: 500 });
    }

    // Seed subject progress rows — explicitly provide empty arrays so PostgREST
    // doesn't try to infer defaults for the TEXT[] columns
    const { data: subjects, error: subjectsError } = await service.from("subjects").select("id, name");
    if (subjectsError) console.error("[students/POST] step=subjects_query", subjectsError);
    console.log("[students/POST] subjects fetched:", subjects);

    if (subjects && subjects.length > 0) {
      const { error: progressError } = await service.from("student_subject_progress").insert(
        subjects.map((s) => ({
          student_id: student.id,
          subject_id: s.id,
          topics_mastered: [],
          topics_struggling: [],
        }))
      );
      if (progressError) {
        console.error("[students/POST] step=progress_insert", progressError);
        return NextResponse.json({ error: `[progress_insert] ${progressError.message}` }, { status: 500 });
      }
    }

    // Seed learning preferences
    const { error: prefsError } = await service.from("learning_preferences").insert({
      student_id: student.id,
      preferred_style: body.learning_style ?? "visual",
    });
    if (prefsError) {
      console.error("[students/POST] step=learning_prefs_insert", prefsError);
      return NextResponse.json({ error: `[learning_prefs] ${prefsError.message}` }, { status: 500 });
    }

    // Create intro "Meet Cosmo" session (no subject)
    const { data: introSession } = await service
      .from("ai_sessions")
      .insert({
        student_id: student.id,
        title: "Meet Cosmo 👋",
        is_active: true,
      })
      .select("id")
      .single();

    // Save Cosmo's opening message so the kid sees it right away
    if (introSession) {
      const interestNote = body.interests
        ? ` I heard you're into ${body.interests} — that's so cool!`
        : "";
      const opening =
        `Hi ${student.name}! 👋 I'm Cosmo, your learning buddy!` +
        `${interestNote} I'm here to make school fun and easy for you.` +
        ` What's your favorite thing to do when you're NOT at school? 🌟`;

      await service.from("ai_messages").insert({
        session_id: introSession.id,
        role: "assistant",
        content: opening,
      });
    }

    return NextResponse.json(
      { ...student, introSessionId: introSession?.id ?? null },
      { status: 201 }
    );
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : "Server error";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
