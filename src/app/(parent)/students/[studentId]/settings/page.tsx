"use client";
import { useEffect, useRef, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Image from "next/image";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { StudentForm } from "@/components/students/student-form";
import { Button } from "@/components/ui/button";
import type { Student } from "@/types/app";

export default function StudentSettingsPage() {
  const params = useParams();
  const router = useRouter();
  const studentId = params.studentId as string;
  const [student, setStudent] = useState<Student | null>(null);
  const [loading, setLoading] = useState(true);
  const [avatarUploading, setAvatarUploading] = useState(false);
  const [avatarError, setAvatarError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    fetch(`/api/students/${studentId}`)
      .then((r) => r.json())
      .then((data) => { setStudent(data); setLoading(false); })
      .catch(() => setLoading(false));
  }, [studentId]);

  async function handleAvatarUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setAvatarError(null);
    setAvatarUploading(true);
    try {
      const fd = new FormData();
      fd.append("file", file);
      const res = await fetch(`/api/students/${studentId}/avatar`, { method: "POST", body: fd });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error ?? "Upload failed");
      setStudent((prev) => prev ? { ...prev, avatar_url: json.avatar_url } : prev);
    } catch (err) {
      setAvatarError(err instanceof Error ? err.message : "Upload failed");
    } finally {
      setAvatarUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  }

  async function handleUpdate(data: {
    name: string;
    age: number;
    grade: string;
    avatar_emoji: string;
    learning_style: "visual" | "auditory" | "kinesthetic" | "reading";
    confidence_level: number;
    interests?: string;
    personality?: string;
    struggles_with?: string;
  }) {
    const res = await fetch(`/api/students/${studentId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });
    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.error ?? "Failed to update");
    }
    router.push(`/students/${studentId}`);
  }

  if (loading) return <div className="p-8 text-muted-foreground">Loading...</div>;
  if (!student) return <div className="p-8 text-muted-foreground">Student not found.</div>;

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div className="mb-2">
        <h1 className="text-3xl font-bold">Edit {student.name}&apos;s Profile</h1>
        <p className="text-muted-foreground mt-1">Update their learning preferences and details.</p>
      </div>

      {/* Profile photo upload */}
      <Card>
        <CardHeader>
          <CardTitle>Profile Photo</CardTitle>
          <CardDescription>Upload a PNG or JPG photo for {student.name}.</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-5">
            <div className="h-20 w-20 rounded-2xl overflow-hidden bg-gradient-to-br from-primary/20 to-accent/20 border border-primary/20 flex items-center justify-center text-4xl flex-shrink-0">
              {student.avatar_url ? (
                <Image src={student.avatar_url} alt={student.name} width={80} height={80} className="object-cover w-full h-full" />
              ) : (
                student.avatar_emoji
              )}
            </div>
            <div className="space-y-2">
              <input
                ref={fileInputRef}
                type="file"
                accept="image/png,image/jpeg,image/webp"
                className="hidden"
                onChange={handleAvatarUpload}
              />
              <Button
                type="button"
                variant="outline"
                size="sm"
                disabled={avatarUploading}
                onClick={() => fileInputRef.current?.click()}
              >
                {avatarUploading ? "Uploading..." : "Upload Photo"}
              </Button>
              {student.avatar_url && (
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="text-destructive hover:text-destructive"
                  onClick={async () => {
                    await fetch(`/api/students/${studentId}`, {
                      method: "PATCH",
                      headers: { "Content-Type": "application/json" },
                      body: JSON.stringify({ avatar_url: null }),
                    });
                    setStudent((prev) => prev ? { ...prev, avatar_url: null } : prev);
                  }}
                >
                  Remove photo
                </Button>
              )}
              {avatarError && <p className="text-xs text-destructive">{avatarError}</p>}
              <p className="text-xs text-muted-foreground">PNG, JPG or WebP · max 5 MB</p>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Student Profile</CardTitle>
          <CardDescription>Changes take effect on the next tutor session.</CardDescription>
        </CardHeader>
        <CardContent>
          <StudentForm
            initialData={student}
            onSubmit={handleUpdate}
            submitLabel="Save Changes"
          />
        </CardContent>
      </Card>
    </div>
  );
}
