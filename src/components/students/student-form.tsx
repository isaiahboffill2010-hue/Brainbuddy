"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { GRADE_OPTIONS, LEARNING_STYLES, AVATAR_EMOJIS, type Student } from "@/types/app";
import { cn } from "@/lib/utils/cn";

interface StudentFormProps {
  initialData?: Partial<Student>;
  onSubmit: (data: {
    name: string;
    age: number;
    grade: string;
    avatar_emoji: string;
    learning_style: "visual" | "auditory" | "kinesthetic" | "reading";
    confidence_level: number;
  }) => Promise<void>;
  submitLabel?: string;
}

export function StudentForm({ initialData, onSubmit, submitLabel = "Save" }: StudentFormProps) {
  const router = useRouter();
  const [name, setName] = useState(initialData?.name ?? "");
  const [age, setAge] = useState(String(initialData?.age ?? ""));
  const [grade, setGrade] = useState(initialData?.grade ?? "");
  const [avatar, setAvatar] = useState(initialData?.avatar_emoji ?? "🦊");
  const [learningStyle, setLearningStyle] = useState<"visual" | "auditory" | "kinesthetic" | "reading">(
    initialData?.learning_style ?? "visual"
  );
  const [confidence, setConfidence] = useState(initialData?.confidence_level ?? 5);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      await onSubmit({
        name,
        age: parseInt(age),
        grade,
        avatar_emoji: avatar,
        learning_style: learningStyle,
        confidence_level: confidence,
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
      setLoading(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {error && (
        <div className="rounded-lg bg-destructive/10 px-4 py-3 text-sm text-destructive border border-destructive/20">
          {error}
        </div>
      )}

      {/* Avatar picker */}
      <div className="space-y-2">
        <Label>Pick an avatar</Label>
        <div className="flex flex-wrap gap-2">
          {AVATAR_EMOJIS.map((emoji) => (
            <button
              key={emoji}
              type="button"
              onClick={() => setAvatar(emoji)}
              className={cn(
                "h-10 w-10 rounded-xl text-2xl flex items-center justify-center transition-all",
                avatar === emoji
                  ? "bg-primary/20 border-2 border-primary scale-110"
                  : "bg-muted border-2 border-transparent hover:border-muted-foreground/30"
              )}
            >
              {emoji}
            </button>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="name">Student name</Label>
          <Input
            id="name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Emma"
            required
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="age">Age</Label>
          <Input
            id="age"
            type="number"
            value={age}
            onChange={(e) => setAge(e.target.value)}
            placeholder="8"
            min={4}
            max={18}
            required
          />
        </div>
      </div>

      <div className="space-y-2">
        <Label>Grade</Label>
        <Select value={grade} onValueChange={setGrade} required>
          <SelectTrigger>
            <SelectValue placeholder="Select grade" />
          </SelectTrigger>
          <SelectContent>
            {GRADE_OPTIONS.map((g) => (
              <SelectItem key={g} value={g}>{g}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Learning style picker */}
      <div className="space-y-3">
        <Label>How does {name || "this student"} learn best?</Label>
        <div className="grid grid-cols-2 gap-3">
          {LEARNING_STYLES.map((style) => (
            <button
              key={style.value}
              type="button"
              onClick={() => setLearningStyle(style.value as typeof learningStyle)}
              className={cn(
                "flex flex-col items-start gap-1 rounded-xl border-2 p-3 text-left transition-all",
                learningStyle === style.value
                  ? "border-primary bg-primary/5"
                  : "border-border hover:border-muted-foreground/30"
              )}
            >
              <span className="text-2xl">{style.emoji}</span>
              <span className="font-medium text-sm">{style.label}</span>
              <span className="text-xs text-muted-foreground leading-tight">{style.description}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Confidence level */}
      <div className="space-y-2">
        <Label>Confidence level: {confidence}/10</Label>
        <p className="text-xs text-muted-foreground">
          How confident is {name || "this student"} about school right now?
        </p>
        <input
          type="range"
          min={1}
          max={10}
          value={confidence}
          onChange={(e) => setConfidence(parseInt(e.target.value))}
          className="w-full accent-violet-600"
        />
        <div className="flex justify-between text-xs text-muted-foreground">
          <span>Needs lots of help</span>
          <span>Very confident</span>
        </div>
      </div>

      <div className="flex gap-3 pt-2">
        <Button type="button" variant="outline" onClick={() => router.back()} className="flex-1">
          Cancel
        </Button>
        <Button type="submit" disabled={loading} className="flex-1">
          {loading ? "Saving..." : submitLabel}
        </Button>
      </div>
    </form>
  );
}
