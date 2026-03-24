"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { SubjectIcon } from "@/components/shared/subject-icon";
import type { Subject } from "@/types/app";

interface SubjectPickerProps {
  subjects: Subject[];
  studentId: string;
}

export function SubjectPicker({ subjects, studentId }: SubjectPickerProps) {
  const router = useRouter();
  const [selected, setSelected] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleStart() {
    if (!selected) return;
    setLoading(true);
    const subj = subjects.find((s) => s.id === selected);
    const res = await fetch("/api/chat", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        studentId,
        subjectId: selected,
        title: `${subj?.name} Session`,
      }),
    });
    if (res.ok) {
      const session = await res.json();
      router.push(`/chat/${session.id}`);
    }
    setLoading(false);
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Start a session</h1>
        <p className="text-muted-foreground text-sm mt-1">What subject do you need help with today?</p>
      </div>
      <div className="grid grid-cols-2 gap-3">
        {subjects.map((subject) => (
          <button
            key={subject.id}
            onClick={() => setSelected(subject.id)}
            className="text-left"
          >
            <Card
              className={`transition-all cursor-pointer ${
                selected === subject.id
                  ? "border-primary ring-2 ring-primary/20"
                  : "hover:border-primary/30"
              }`}
            >
              <CardContent className="p-4 flex flex-col items-center text-center gap-2">
                <SubjectIcon icon={subject.icon} color={subject.color} size="md" />
                <span className="font-medium">{subject.name}</span>
              </CardContent>
            </Card>
          </button>
        ))}
      </div>
      <Button
        onClick={handleStart}
        disabled={!selected || loading}
        className="w-full"
        size="lg"
      >
        {loading ? "Starting..." : "Start Learning! 🚀"}
      </Button>
    </div>
  );
}
