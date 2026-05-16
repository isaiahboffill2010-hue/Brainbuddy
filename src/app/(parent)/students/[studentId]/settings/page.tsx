"use client";
import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { StudentForm } from "@/components/students/student-form";
import type { Student } from "@/types/app";

export default function StudentSettingsPage() {
  const params = useParams();
  const router = useRouter();
  const studentId = params.studentId as string;
  const [student, setStudent] = useState<Student | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch(`/api/students/${studentId}`)
      .then((r) => r.json())
      .then((data) => { setStudent(data); setLoading(false); })
      .catch(() => setLoading(false));
  }, [studentId]);

  async function handleUpdate(data: {
    name: string;
    age: number;
    grade: string;
    avatar_emoji: string;
    learning_style: string;
    confidence_level: number;
    interests?: string;
    personality?: string;
    struggles_with?: string;
    stuck_behavior?: string;
    confusion_support?: string;
    error_feedback?: string;
    teaching_pace?: string;
    motivation?: string;
    teaching_avoid?: string;
    learning_description?: string;
    avatarFile?: File;
  }) {
    const { avatarFile, ...rest } = data;
    const res = await fetch(`/api/students/${studentId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(rest),
    });
    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.error ?? "Failed to update");
    }

    if (avatarFile) {
      const fd = new FormData();
      fd.append("file", avatarFile);
      const avatarRes = await fetch(`/api/students/${studentId}/avatar`, {
        method: "POST",
        body: fd,
      });
      if (!avatarRes.ok) {
        const err = await avatarRes.json();
        throw new Error(err.error ?? "Failed to upload avatar");
      }
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
