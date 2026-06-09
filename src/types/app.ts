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

export type ClassLearningContext = {
  className: string;
  subjectName?: string | null;
  currentUnit?: string | null;
  learningGoal?: string | null;
  brainbuddyInstructions?: string | null;
};

export type TutorAssignmentContext = {
  assignmentId: string;
  studentAssignmentId: string;
  title: string;
  subject?: string | null;
  instructions?: string | null;
  totalPoints?: number | null;
  expectedQuestionCount?: number | null;
  worksheetCount?: number;
};

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
  learningStyle: string;
  confidenceLevel: number;
  subjectName: string;
  topicsMastered?: string[];
  topicsStruggling?: string[];
  learningNotes?: string | null;
  interests?: string | null;
  personality?: string | null;
  strugglesWith?: string | null;
  learningDescription?: string | null;
  stuckBehavior?: string | null;
  confusionSupport?: string | null;
  errorFeedback?: string | null;
  teachingPace?: string | null;
  motivation?: string | null;
  teachingAvoid?: string | null;
  classContext?: ClassLearningContext | null;
  assignmentContext?: TutorAssignmentContext | null;
  isFreshSession?: boolean;
};

// Learning style options
export const LEARNING_STYLES = [
  { value: "visual", label: "Visual", emoji: "👁️", description: "I learn best with pictures and diagrams" },
  { value: "auditory", label: "Auditory", emoji: "👂", description: "I learn best by listening and talking" },
  { value: "kinesthetic", label: "Hands-On", emoji: "🤲", description: "I learn best by doing and examples" },
  { value: "reading", label: "Reading", emoji: "📖", description: "I learn best by reading and writing" },
] as const;

export const STUCK_BEHAVIORS = [
  { value: "keeps_trying", label: "Keeps trying", emoji: "💪", description: "Works through hard parts instead of giving up" },
  { value: "guesses_quickly", label: "Guesses quickly", emoji: "🎯", description: "Makes a fast guess when unsure" },
  { value: "gets_frustrated", label: "Gets frustrated", emoji: "😣", description: "Needs calm encouragement when it gets hard" },
  { value: "shuts_down", label: "Shuts down or stops", emoji: "😶", description: "May need a break or a gentler restart" },
  { value: "asks_for_help", label: "Asks for help", emoji: "🙋", description: "Likes asking for help when they don’t understand" },
] as const;

export const CONFUSION_SUPPORT_OPTIONS = [
  { value: "small_hint", label: "Give a small hint first", emoji: "💡", description: "Helps the student move forward without giving it away" },
  { value: "step_by_step", label: "Explain step-by-step", emoji: "🧩", description: "Breaks the idea into easy, clear steps" },
  { value: "show_example", label: "Show an example", emoji: "📘", description: "Uses a model example so the idea clicks" },
  { value: "ask_guiding", label: "Ask guiding questions", emoji: "❓", description: "Helps them think through the answer" },
  { value: "easier_question", label: "Make the question easier", emoji: "🛠️", description: "Gives an easier step before trying again" },
] as const;

export const ERROR_FEEDBACK_OPTIONS = [
  { value: "encourage_first", label: "Encourage first", emoji: "👏", description: "Starts with a positive message before fixing it" },
  { value: "hint_try_again", label: "Give a hint and let them try again", emoji: "🔄", description: "Offers support without solving it right away" },
  { value: "explain_mistake", label: "Explain the mistake", emoji: "📝", description: "Shows why it was wrong and how to fix it" },
  { value: "easier_question", label: "Try an easier question", emoji: "🧠", description: "Builds confidence with a simpler step" },
  { value: "show_answer", label: "Show the correct answer and explain why", emoji: "✅", description: "Gives the answer plus a short explanation" },
] as const;

export const TEACHING_PACE_OPTIONS = [
  { value: "slow_simple", label: "Slow and simple", emoji: "🐢", description: "Takes time and keeps things easy to follow" },
  { value: "normal", label: "Normal pace", emoji: "🚶", description: "A steady pace that feels comfortable" },
  { value: "fast_fewer_details", label: "Faster with fewer details", emoji: "🏃", description: "Moves quicker with shorter explanations" },
  { value: "let_student_choose", label: "Let the student choose during the lesson", emoji: "🎛️", description: "Offers control so the student can slow down or speed up" },
] as const;

export const MOTIVATION_OPTIONS = [
  { value: "praise", label: "Praise and encouragement", emoji: "🌟", description: "Likes kind words and encouragement" },
  { value: "points_rewards", label: "Points or rewards", emoji: "🏅", description: "Gets motivated by collecting points" },
  { value: "challenges", label: "Challenges and levels", emoji: "🏆", description: "Loves unlocking new challenges" },
  { value: "seeing_progress", label: "Seeing progress", emoji: "📈", description: "Likes watching how much they improve" },
  { value: "funny_examples", label: "Funny examples", emoji: "😄", description: "Enjoys humor in learning" },
  { value: "beat_score", label: "Beating their own score", emoji: "🥇", description: "Gets excited by topping their own best" },
] as const;

export const AVOID_OPTIONS = [
  { value: "long_explanations", label: "Long explanations", emoji: "🧠", description: "Short and simple is easier to follow" },
  { value: "hard_words", label: "Hard words", emoji: "📚", description: "Prefers easy language over big words" },
  { value: "too_much_text", label: "Too much text", emoji: "📝", description: "Likes less text and more visuals" },
  { value: "timed_pressure", label: "Timed pressure", emoji: "⏱️", description: "Does better without a timer feeling rushed" },
  { value: "too_many_questions", label: "Too many questions at once", emoji: "📋", description: "Feels better with one thing at a time" },
  { value: "answers_too_fast", label: "Giving answers too fast", emoji: "⚡", description: "Needs time to think before seeing the answer" },
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
