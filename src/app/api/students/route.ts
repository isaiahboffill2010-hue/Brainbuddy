import { NextResponse } from "next/server";
import { createClient, createServiceClient } from "@/lib/supabase/server";

export async function GET() {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { data: profile } = await supabase
      .from("profiles")
      .select("id")
      .eq("user_id", user.id)
      .single();

    if (!profile) return NextResponse.json([]);

    const { data, error } = await supabase
      .from("parents_students")
      .select("student_id, students(*)")
      .eq("parent_id", profile.id);

    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    const students = data?.map((row) => row.students).filter(Boolean) ?? [];
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
    let { data: profile } = await supabase
      .from("profiles")
      .select("id")
      .eq("user_id", user.id)
      .single();

    if (!profile) {
      const { data: newProfile, error: profileError } = await service
        .from("profiles")
        .insert({
          user_id: user.id,
          role: "parent",
          full_name: user.user_metadata?.full_name ?? user.email?.split("@")[0] ?? "Parent",
          email: user.email,
        })
        .select("id")
        .single();

      if (profileError) return NextResponse.json({ error: "Could not create profile. Make sure the database schema has been set up." }, { status: 500 });
      profile = newProfile;
    }

    // Create the student
    const { data: student, error: studentError } = await service
      .from("students")
      .insert({
        name: body.name,
        age: body.age,
        grade: body.grade,
        avatar_emoji: body.avatar_emoji ?? "🦊",
        learning_style: body.learning_style ?? "visual",
        confidence_level: body.confidence_level ?? 5,
        profile_id: profile.id,
      })
      .select()
      .single();

    if (studentError) return NextResponse.json({ error: studentError.message }, { status: 500 });

    // Link to parent
    await service.from("parents_students").insert({ parent_id: profile.id, student_id: student.id });

    // Seed subject progress rows
    const { data: subjects } = await service.from("subjects").select("id");
    if (subjects && subjects.length > 0) {
      await service.from("student_subject_progress").insert(
        subjects.map((s) => ({ student_id: student.id, subject_id: s.id }))
      );
    }

    // Seed learning preferences
    await service.from("learning_preferences").insert({
      student_id: student.id,
      preferred_style: body.learning_style ?? "visual",
    });

    return NextResponse.json(student, { status: 201 });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : "Server error";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
