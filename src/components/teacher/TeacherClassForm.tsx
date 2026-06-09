"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2, PlusCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

type SubjectOption = {
  id: string;
  name: string;
};

const SCHOOL_LEVELS = ["Middle School", "High School"] as const;
const PERIODS = Array.from({ length: 8 }, (_, index) => `Period ${index + 1}`);

export function TeacherClassForm({ subjects }: { subjects: SubjectOption[] }) {
  const router = useRouter();
  const [schoolLevel, setSchoolLevel] = useState("");
  const [gradeLevel, setGradeLevel] = useState("");
  const [subjectId, setSubjectId] = useState("");
  const [period, setPeriod] = useState("");
  const [currentUnit, setCurrentUnit] = useState("");
  const [brainbuddyInstructions, setBrainbuddyInstructions] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const res = await fetch("/api/teacher/classes", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          schoolLevel,
          gradeLevel,
          subjectId,
          period,
          currentUnit,
          brainbuddyInstructions,
        }),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error ?? "Could not create class");
      }

      setGradeLevel("");
      setCurrentUnit("");
      setBrainbuddyInstructions("");
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not create class");
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="rounded-3xl border border-white/10 bg-[#1E293B]/80 p-5 shadow-2xl space-y-4">
      <div>
        <h2 className="text-lg font-bold text-white">Add Class</h2>
        <p className="text-sm text-slate-400">Set the class focus BrainBuddy should use for joined students.</p>
      </div>

      {error && (
        <div className="rounded-xl border border-red-500/20 bg-red-500/10 px-3 py-2 text-sm text-red-300">
          {error}
        </div>
      )}

      <div className="grid gap-4 md:grid-cols-2">
        <div className="space-y-2">
          <Label>Subject</Label>
          <Select value={subjectId} onValueChange={setSubjectId}>
            <SelectTrigger>
              <SelectValue placeholder="Choose subject" />
            </SelectTrigger>
            <SelectContent>
              {subjects.map((subject) => (
                <SelectItem key={subject.id} value={subject.id}>{subject.name}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label>School level</Label>
          <Select value={schoolLevel} onValueChange={setSchoolLevel}>
            <SelectTrigger>
              <SelectValue placeholder="Select school level" />
            </SelectTrigger>
            <SelectContent>
              {SCHOOL_LEVELS.map((level) => (
                <SelectItem key={level} value={level}>{level}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label htmlFor="gradeLevel">Grade level</Label>
          <Input id="gradeLevel" value={gradeLevel} onChange={(e) => setGradeLevel(e.target.value)} placeholder="6th Grade" />
        </div>

        <div className="space-y-2">
          <Label>Period</Label>
          <Select value={period} onValueChange={setPeriod}>
            <SelectTrigger>
              <SelectValue placeholder="Select period" />
            </SelectTrigger>
            <SelectContent>
              {PERIODS.map((item) => (
                <SelectItem key={item} value={item}>{item}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label htmlFor="currentUnit">Current unit/topic</Label>
          <Input id="currentUnit" value={currentUnit} onChange={(e) => setCurrentUnit(e.target.value)} placeholder="Fractions" />
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="brainbuddyInstructions">BrainBuddy focus/instructions</Label>
        <Textarea id="brainbuddyInstructions" value={brainbuddyInstructions} onChange={(e) => setBrainbuddyInstructions(e.target.value)} placeholder="Help students study this topic step by step and give hints before final answers." className="min-h-[88px]" />
      </div>

      <Button type="submit" disabled={loading || !period || !subjectId} className="w-full rounded-2xl bg-gradient-brand border-0">
        {loading ? <><Loader2 className="h-4 w-4 animate-spin" /> Creating class...</> : <><PlusCircle className="h-4 w-4" /> Create Class</>}
      </Button>
    </form>
  );
}
