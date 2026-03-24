"use client";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { StudentForm } from "@/components/students/student-form";
import { createClient } from "@/lib/supabase/client";

export default function NewStudentPage() {
  const router = useRouter();

  async function handleCreate(data: {
    name: string;
    age: number;
    grade: string;
    avatar_emoji: string;
    learning_style: "visual" | "auditory" | "kinesthetic" | "reading";
    confidence_level: number;
  }) {
    const res = await fetch("/api/students", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });
    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.error ?? "Failed to create student");
    }
    const student = await res.json();
    router.push(`/students/${student.id}`);
  }

  return (
    <div className="max-w-2xl mx-auto">
      <div className="mb-6">
        <h1 className="text-3xl font-bold">Add a Student</h1>
        <p className="text-muted-foreground mt-1">
          Tell us about your child so Cosmo can personalize their learning experience.
        </p>
      </div>
      <Card>
        <CardHeader>
          <CardTitle>Student Profile</CardTitle>
          <CardDescription>
            This information helps the AI tutor adapt to your child&apos;s needs.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <StudentForm onSubmit={handleCreate} submitLabel="Create Student" />
        </CardContent>
      </Card>
    </div>
  );
}
