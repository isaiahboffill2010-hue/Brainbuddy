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

  async function handleUpdate(data: Partial<Student>) {
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
    <div className="max-w-2xl mx-auto">
      <div className="mb-6">
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
