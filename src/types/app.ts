import type { Database } from "./database";

// Row types
export type Profile = Database["public"]["Tables"]["profiles"]["Row"];
export type Student = Database["public"]["Tables"]["students"]["Row"];
export type Subject = Database["public"]["Tables"]["subjects"]["Row"];
export type AiSession = Database["public"]["Tables"]["ai_sessions"]["Row"];
export type AiMessage = Database["public"]["Tables"]["ai_messages"]["Row"];
export type HomeworkUpload = Database["public"]["Tables"]["homework_uploads"]["Row"];
export type StudentSubjectProgress = Database["public"]["Tables"]["student_subject_progress"]["Row"];
export type LearningPreference = Database["public"]["Tables"]["learning_preferences"]["Row"];

// Enriched types
export type StudentWithProgress = Student & {
  progress: StudentSubjectProgress[];
  preferences: LearningPreference | null;
};

export type SessionWithMessages = AiSession & {
  messages: AiMessage[];
  subject: Subject | null;
};

// Auth
export type UserRole = "parent" | "student" | "teacher";

// Chat
export type ChatMessage = {
  id: string;
  role: "user" | "assistant";
  content: string;
  imageUrl?: string;
  isStreaming?: boolean;
  createdAt: string;
};

// Tutor context passed to OpenAI
export type TutorContext = {
  studentName: string;
  grade: string;
  age: number;
  learningStyle: "visual" | "auditory" | "kinesthetic" | "reading";
  confidenceLevel: number;
  subjectName: string;
  topicsMastered?: string[];
  topicsStruggling?: string[];
  learningNotes?: string | null;
  interests?: string | null;
  personality?: string | null;
  strugglesWith?: string | null;
};

// Learning style options
export const LEARNING_STYLES = [
  { value: "visual", label: "Visual", emoji: "👁️", description: "I learn best with pictures and diagrams" },
  { value: "auditory", label: "Auditory", emoji: "👂", description: "I learn best by listening and talking" },
  { value: "kinesthetic", label: "Hands-On", emoji: "🤲", description: "I learn best by doing and examples" },
  { value: "reading", label: "Reading", emoji: "📖", description: "I learn best by reading and writing" },
] as const;

// Grade options
export const GRADE_OPTIONS = [
  "Kindergarten", "1st Grade", "2nd Grade", "3rd Grade",
  "4th Grade", "5th Grade", "6th Grade", "7th Grade",
  "8th Grade", "9th Grade", "10th Grade", "11th Grade", "12th Grade",
];

// Personality options
export const PERSONALITY_OPTIONS = [
  { value: "curious",   label: "Curious",   emoji: "🔍", description: "Always asking 'why?'" },
  { value: "energetic", label: "Energetic",  emoji: "⚡", description: "Full of energy, loves action" },
  { value: "creative",  label: "Creative",   emoji: "🎨", description: "Loves to imagine and create" },
  { value: "funny",     label: "Funny",      emoji: "😄", description: "Makes everyone laugh" },
  { value: "shy",       label: "Quiet/Shy",  emoji: "🌸", description: "Thoughtful, prefers one-on-one" },
] as const;

// Avatar emoji options for students
export const AVATAR_EMOJIS = [
  "🦊", "🐼", "🐨", "🦁", "🐯", "🐸", "🐧", "🦄",
  "🐙", "🦋", "🐬", "🐻", "🐺", "🦝", "🐹", "🐰",
];
