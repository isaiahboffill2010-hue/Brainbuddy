"use client";
import { useState, useRef } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import {
  GRADE_OPTIONS, LEARNING_STYLES, PERSONALITY_OPTIONS, type Student,
} from "@/types/app";
import { cn } from "@/lib/utils/cn";
import { Camera, User } from "lucide-react";

interface StudentFormProps {
  initialData?: Partial<Student>;
  onSubmit: (data: {
    name: string;
    age: number;
    grade: string;
    avatar_emoji: string;
    learning_style: "visual" | "auditory" | "kinesthetic" | "reading";
    confidence_level: number;
    interests?: string;
    personality?: string;
    struggles_with?: string;
    learning_description?: string;
    avatarFile?: File;
  }) => Promise<void>;
  submitLabel?: string;
}

export function StudentForm({ initialData, onSubmit, submitLabel = "Save" }: StudentFormProps) {
  const router = useRouter();
  const [name, setName] = useState(initialData?.name ?? "");
  const [age, setAge] = useState(String(initialData?.age ?? ""));
  const [grade, setGrade] = useState(initialData?.grade ?? "");
  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const [avatarPreview, setAvatarPreview] = useState<string | null>(
    (initialData as any)?.avatar_url ?? null
  );
  const avatarInputRef = useRef<HTMLInputElement>(null);
  const [learningStyle, setLearningStyle] = useState<"visual" | "auditory" | "kinesthetic" | "reading">(
    initialData?.learning_style ?? "visual"
  );
  const [confidence, setConfidence] = useState(initialData?.confidence_level ?? 5);
  const [interests, setInterests] = useState(initialData?.interests ?? "");
  const [personality, setPersonality] = useState<string>(initialData?.personality ?? "");
  const [strugglesWith, setStrugglesWith] = useState(initialData?.struggles_with ?? "");
  const [learningDescription, setLearningDescription] = useState(initialData?.learning_description ?? "");
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
        avatar_emoji: "🦊",
        learning_style: learningStyle,
        confidence_level: confidence,
        interests: interests.trim() || undefined,
        personality: personality || undefined,
        struggles_with: strugglesWith.trim() || undefined,
        learning_description: learningDescription.trim() || undefined,
        avatarFile: avatarFile ?? undefined,
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

      {/* Avatar upload */}
      <div className="space-y-2">
        <Label>Profile Photo</Label>
        <div className="flex items-center gap-5">
          {/* Preview circle */}
          <div className="relative flex-shrink-0">
            <div className="h-24 w-24 rounded-full overflow-hidden bg-[#EEF3FF] border-2 border-[#C7D7FF] flex items-center justify-center">
              {avatarPreview ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={avatarPreview} alt="Avatar preview" className="w-full h-full object-cover" />
              ) : (
                <User className="h-10 w-10 text-[#9AA4BA]" />
              )}
            </div>
            <button
              type="button"
              onClick={() => avatarInputRef.current?.click()}
              className="absolute bottom-0 right-0 h-8 w-8 rounded-full bg-[#4F7CFF] border-2 border-white flex items-center justify-center shadow-md hover:bg-[#3d6be0] transition-colors"
            >
              <Camera className="h-3.5 w-3.5 text-white" />
            </button>
          </div>
          {/* Upload info */}
          <div className="space-y-1.5">
            <p className="text-sm font-medium text-[#1F2A44]">
              {avatarFile ? avatarFile.name : "No photo selected"}
            </p>
            <p className="text-xs text-[#9AA4BA]">JPG, PNG or GIF — max 5MB</p>
            <button
              type="button"
              onClick={() => avatarInputRef.current?.click()}
              className="flex items-center gap-1.5 text-xs font-semibold text-[#4F7CFF] bg-[#EEF3FF] border border-[#C7D7FF] rounded-xl px-3 py-1.5 hover:bg-[#C7D7FF] transition-colors"
            >
              <Camera className="h-3 w-3" /> Upload Photo
            </button>
          </div>
        </div>
        <input
          ref={avatarInputRef}
          type="file"
          accept="image/*"
          className="hidden"
          onChange={(e) => {
            const file = e.target.files?.[0];
            if (!file) return;
            setAvatarFile(file);
            setAvatarPreview(URL.createObjectURL(file));
            e.target.value = "";
          }}
        />
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

      {/* Personality picker */}
      <div className="space-y-3">
        <Label>What best describes {name || "this student"}? <span className="text-muted-foreground text-xs">(optional)</span></Label>
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
          {PERSONALITY_OPTIONS.map((p) => (
            <button
              key={p.value}
              type="button"
              onClick={() => setPersonality(personality === p.value ? "" : p.value)}
              className={cn(
                "flex flex-col items-start gap-1 rounded-xl border-2 p-3 text-left transition-all",
                personality === p.value
                  ? "border-primary bg-primary/5"
                  : "border-border hover:border-muted-foreground/30"
              )}
            >
              <span className="text-2xl">{p.emoji}</span>
              <span className="font-medium text-sm">{p.label}</span>
              <span className="text-xs text-muted-foreground leading-tight">{p.description}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Interests */}
      <div className="space-y-2">
        <Label htmlFor="interests">
          What does {name || "this student"} love? <span className="text-muted-foreground text-xs">(optional)</span>
        </Label>
        <Input
          id="interests"
          value={interests}
          onChange={(e) => setInterests(e.target.value)}
          placeholder="e.g. Minecraft, soccer, drawing, dinosaurs"
        />
        <p className="text-xs text-muted-foreground">
          Cosmo will use these to make examples feel familiar and fun.
        </p>
      </div>

      {/* Struggles with */}
      <div className="space-y-2">
        <Label htmlFor="struggles">
          Anything {name || "this student"} finds tricky at school? <span className="text-muted-foreground text-xs">(optional)</span>
        </Label>
        <Textarea
          id="struggles"
          value={strugglesWith}
          onChange={(e) => setStrugglesWith(e.target.value)}
          placeholder="e.g. word problems, reading long texts, staying focused"
          className="min-h-[60px] resize-none text-sm"
          rows={2}
        />
      </div>

      {/* Learning description — free-text note to Cosmo */}
      <div className="space-y-2 rounded-2xl border-2 border-violet-200 bg-violet-50/60 p-4">
        <div className="flex items-center gap-2 mb-1">
          <span className="text-lg">✏️</span>
          <Label htmlFor="learning_description" className="text-base font-semibold text-violet-900">
            Write a note to Cosmo about how {name || "this student"} learns
          </Label>
        </div>
        <p className="text-xs text-violet-700 leading-relaxed mb-2">
          Describe in your own words how your child understands best, what they find hard, and how you&apos;d like Cosmo to explain things.
          Cosmo reads this before every session and adjusts the way it teaches.
        </p>
        <Textarea
          id="learning_description"
          value={learningDescription}
          onChange={(e) => setLearningDescription(e.target.value)}
          placeholder={`e.g. "${name || "Emma"} needs everything explained in very simple steps — never skip steps. She gets frustrated quickly if she doesn't understand, so Cosmo should always check in. She struggles with reading long text so keep answers short. She learns best through examples from real life. She has dyslexia so avoid large blocks of text."`}
          className="min-h-[100px] resize-none text-sm bg-white border-violet-200 focus:border-violet-400"
          rows={4}
        />
        <p className="text-xs text-violet-600 font-medium">
          💡 The more detail you add, the better Cosmo can adapt to {name || "your child"}&apos;s needs.
        </p>
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
          {loading ? "Setting up Cosmo..." : submitLabel}
        </Button>
      </div>
    </form>
  );
}
