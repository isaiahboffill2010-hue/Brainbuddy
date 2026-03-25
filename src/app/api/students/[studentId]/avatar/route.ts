import { NextResponse } from "next/server";
import { createClient, createServiceClient } from "@/lib/supabase/server";

export async function POST(
  req: Request,
  { params }: { params: Promise<{ studentId: string }> }
) {
  try {
    const { studentId } = await params;
    const supabase = await createClient();
    const service = createServiceClient();

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const formData = await req.formData();
    const file = formData.get("file") as File | null;
    if (!file) return NextResponse.json({ error: "No file provided" }, { status: 400 });

    // Only allow images
    if (!file.type.startsWith("image/")) {
      return NextResponse.json({ error: "File must be an image" }, { status: 400 });
    }

    const ext = file.name.split(".").pop()?.toLowerCase() ?? "png";
    const path = `${studentId}/avatar.${ext}`;
    const bytes = await file.arrayBuffer();

    const { error: uploadError } = await service.storage
      .from("avatars")
      .upload(path, bytes, { contentType: file.type, upsert: true });

    if (uploadError) {
      return NextResponse.json({ error: uploadError.message }, { status: 500 });
    }

    const { data: { publicUrl } } = service.storage.from("avatars").getPublicUrl(path);
    // Append cache-bust so the browser loads the new image after re-upload
    const avatarUrl = `${publicUrl}?t=${Date.now()}`;

    const { error: updateError } = await service
      .from("students")
      .update({ avatar_url: avatarUrl, updated_at: new Date().toISOString() })
      .eq("id", studentId);

    if (updateError) {
      return NextResponse.json({ error: updateError.message }, { status: 500 });
    }

    return NextResponse.json({ avatar_url: avatarUrl });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : "Server error";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
