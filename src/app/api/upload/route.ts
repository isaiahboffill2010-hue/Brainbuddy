import { NextResponse } from "next/server";
import { createClient, createServiceClient } from "@/lib/supabase/server";
import { createUpload } from "@/lib/supabase/queries/uploads";
import { fetchBillingProfile } from "@/lib/billing";

export async function POST(req: Request) {
  const supabase = await createClient();
  const service = createServiceClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const billingProfile = await fetchBillingProfile(service, user.id);
  const isPremium = billingProfile?.plan === "premium";
  const snipsUsed = billingProfile?.snips_used ?? 0;
  const snipLimit = billingProfile?.snip_limit ?? 1;

  if (!isPremium && snipsUsed >= snipLimit) {
    return NextResponse.json(
      {
        error: "snip_limit_reached",
        message: "You used your free homework snip/upload. Upgrade to BrainBuddy Premium for unlimited homework help and visual explanations.",
      },
      { status: 403 }
    );
  }

  const formData = await req.formData();
  const file = formData.get("file") as File | null;
  const studentId = formData.get("studentId") as string;
  const subjectId = formData.get("subjectId") as string | null;
  const questionText = formData.get("questionText") as string | null;

  if (!file || !studentId) {
    return NextResponse.json({ error: "file and studentId required" }, { status: 400 });
  }

  // Upload to Supabase Storage
  const ext = file.name.split(".").pop() ?? "jpg";
  const path = `${studentId}/${Date.now()}.${ext}`;
  const bytes = await file.arrayBuffer();

  const { error: uploadError } = await service.storage
    .from("homework")
    .upload(path, bytes, { contentType: file.type, upsert: false });

  if (uploadError) {
    return NextResponse.json({ error: uploadError.message }, { status: 500 });
  }

  const { data: { publicUrl } } = service.storage
    .from("homework")
    .getPublicUrl(path);

  // Save to DB
  const upload = await createUpload(service, {
    student_id: studentId,
    subject_id: subjectId ?? undefined,
    image_url: publicUrl,
    question_text: questionText ?? undefined,
    status: "processed",
  });

  if (upload) {
    if (!isPremium) {
      await service.from("profiles").update({ snips_used: snipsUsed + 1 }).eq("user_id", user.id);
    }
  }

  return NextResponse.json(upload, { status: 201 });
}
