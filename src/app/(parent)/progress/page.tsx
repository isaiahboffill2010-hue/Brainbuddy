import Link from "next/link";
import { redirect } from "next/navigation";
import {
  ArrowRight,
  BookOpen,
  CheckCircle2,
  ClipboardList,
  Lightbulb,
  PlusCircle,
  School,
  Sparkles,
  Target,
  Trophy,
} from "lucide-react";
import { createClient, createServiceClient } from "@/lib/supabase/server";
import {
  getJoinedClassesForStudent,
  getPrimaryStudentIdForProfile,
  type JoinedClassSummary,
} from "@/lib/supabase/queries/classes";
import { getAllNotesForStudent, type StudentNote } from "@/lib/supabase/queries/notes";
import {
  QUESTIONS_REQUIRED_FOR_MASTERY,
  buildRecommendations,
  buildTopicAttemptStats,
  buildTopicProgressCards,
  pickCurrentMasteryPath,
  type QuizAttemptInput,
  type TopicProgressCard,
} from "@/lib/progress/mastery";

type StudentProfile = {
  id: string;
  name: string;
  grade: string;
  avatar_emoji: string | null;
};

type RawAttemptRow = {
  topic: string | null;
  subject_id: string | null;
  is_correct: boolean | null;
  integrity_flagged: boolean | null;
  mastery_check: boolean | null;
  subjects?: {
    name: string | null;
    color: string | null;
  } | null;
};

function EmptyStudentState() {
  return (
    <div className="flex flex-col items-center justify-center py-20 text-center space-y-3 animate-fade-in">
      <div className="h-14 w-14 rounded-2xl bg-indigo-500/20 border border-indigo-500/30 flex items-center justify-center">
        <PlusCircle className="h-7 w-7 text-indigo-300" />
      </div>
      <p className="text-lg font-bold text-white">No student added yet</p>
      <p className="text-sm text-slate-400">Add a student profile to start tracking learning progress.</p>
      <Link href="/students/new">
        <button className="flex items-center gap-2 bg-gradient-to-r from-indigo-500 to-purple-500 text-white rounded-2xl px-5 py-2.5 text-sm font-bold shadow-lg shadow-indigo-500/30 hover:opacity-90 transition-all mt-2">
          <PlusCircle className="h-4 w-4" /> Add Student
        </button>
      </Link>
    </div>
  );
}

function ProgressBar({ value, color = "#4F7CFF" }: { value: number; color?: string }) {
  return (
    <div className="h-2.5 w-full rounded-full bg-white/10 overflow-hidden">
      <div
        className="h-full rounded-full transition-all duration-700"
        style={{ width: `${value}%`, backgroundColor: color }}
      />
    </div>
  );
}

function StatBox({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
      <p className="text-xs uppercase tracking-[0.2em] text-slate-500">{label}</p>
      <p className="mt-2 text-lg font-semibold text-white">{value}</p>
    </div>
  );
}

function TopicCard({ topic }: { topic: TopicProgressCard }) {
  return (
    <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="text-base font-bold text-white">{topic.topic}</p>
          <p className="mt-1 text-sm text-slate-400">{topic.subject}</p>
        </div>
        <span
          className="rounded-full border px-3 py-1 text-xs font-bold"
          style={{
            color: topic.subjectColor,
            borderColor: `${topic.subjectColor}55`,
            backgroundColor: `${topic.subjectColor}20`,
          }}
        >
          {topic.status}
        </span>
      </div>

      <div className="mt-4 space-y-3">
        <div className="flex items-center justify-between text-xs text-slate-400">
          <span>Questions completed</span>
          <span className="font-bold text-slate-200">
            {topic.questionsCompleted} / {QUESTIONS_REQUIRED_FOR_MASTERY}
          </span>
        </div>
        <ProgressBar value={topic.progressPercentage} color={topic.subjectColor} />
        <div className="grid grid-cols-2 gap-3">
          <StatBox label="Correct" value={String(topic.questionsCorrect)} />
          <StatBox label="Accuracy" value={`${topic.accuracyPercentage}%`} />
        </div>
      </div>

      <p className="mt-3 text-sm text-slate-300">{topic.nextStep}</p>
    </div>
  );
}

function SectionCard({
  icon: Icon,
  title,
  subtitle,
  children,
}: {
  icon: typeof Target;
  title: string;
  subtitle?: string;
  children: React.ReactNode;
}) {
  return (
    <section className="rounded-3xl border border-white/10 bg-[#1E293B]/80 p-6 shadow-2xl">
      <div className="mb-5 flex items-start gap-3">
        <div className="h-10 w-10 rounded-2xl bg-indigo-500/20 border border-indigo-500/30 flex items-center justify-center flex-shrink-0">
          <Icon className="h-5 w-5 text-indigo-300" />
        </div>
        <div>
          <h2 className="text-lg font-bold text-white">{title}</h2>
          {subtitle && <p className="mt-1 text-sm text-slate-400">{subtitle}</p>}
        </div>
      </div>
      {children}
    </section>
  );
}

function EmptyProgressState() {
  return (
    <div className="rounded-2xl border border-dashed border-white/10 bg-white/5 p-6 text-center">
      <p className="text-sm font-semibold text-white">
        Start a quiz or chat with BrainBuddy to build your progress.
      </p>
      <div className="mt-4 flex flex-col justify-center gap-3 sm:flex-row">
        <Link href="/subjects">
          <button className="inline-flex items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-indigo-500 to-purple-500 px-5 py-2.5 text-sm font-bold text-white shadow-lg shadow-indigo-500/20 transition-all hover:opacity-90">
            <ClipboardList className="h-4 w-4" /> Start Practice
          </button>
        </Link>
        <Link href="/tutor">
          <button className="inline-flex items-center justify-center gap-2 rounded-2xl border border-white/10 bg-white/5 px-5 py-2.5 text-sm font-bold text-slate-200 transition-all hover:bg-white/10">
            <Sparkles className="h-4 w-4" /> Ask BrainBuddy
          </button>
        </Link>
      </div>
    </div>
  );
}

function shapeAttempts(rows: RawAttemptRow[]): QuizAttemptInput[] {
  return rows.map((row) => ({
    topic: row.topic,
    subjectId: row.subject_id,
    subjectName: row.subjects?.name ?? null,
    subjectColor: row.subjects?.color ?? null,
    isCorrect: Boolean(row.is_correct),
    integrityFlagged: Boolean(row.integrity_flagged),
    masteryCheck: Boolean(row.mastery_check),
  }));
}

export default async function ProgressPage() {
  const supabase = await createClient();
  const service = createServiceClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: profileRaw } = await supabase
    .from("profiles")
    .select("id")
    .eq("user_id", user.id)
    .maybeSingle();
  const profile = profileRaw as { id: string } | null;

  if (!profile) return <EmptyStudentState />;

  const studentId = await getPrimaryStudentIdForProfile(supabase, profile.id);
  if (!studentId) return <EmptyStudentState />;

  const [studentRes, attemptRows, notes, classes] = await Promise.all([
    supabase
      .from("students")
      .select("id, name, grade, avatar_emoji")
      .eq("id", studentId)
      .maybeSingle(),
    (async () => {
      const { data } = await supabase
        .from("quiz_question_attempts")
        .select("topic, subject_id, is_correct, integrity_flagged, mastery_check, subjects(name, color)")
        .eq("student_id", studentId)
        .order("created_at", { ascending: false });
      return data ?? [];
    })().catch(() => []),
    getAllNotesForStudent(supabase, studentId).catch(() => []),
    getJoinedClassesForStudent(service, studentId).catch(() => []),
  ]);

  const student = studentRes.data as StudentProfile | null;
  if (!student) return <EmptyStudentState />;

  const classTopics = classes as JoinedClassSummary[];
  const studentNotes = notes as StudentNote[];
  const topicCards = buildTopicProgressCards(
    buildTopicAttemptStats(shapeAttempts(attemptRows as unknown as RawAttemptRow[]))
  );
  const masteredTopics = topicCards.filter((topic) => topic.status === "Mastered");
  const practicingTopics = topicCards.filter((topic) => topic.status !== "Mastered");
  const currentPath = pickCurrentMasteryPath({
    topicCards,
    classes: classTopics,
  });
  const recommendations = buildRecommendations({
    topicCards,
    classes: classTopics,
    notes: studentNotes,
  });

  const totalQuestions = topicCards.reduce((sum, topic) => sum + topic.questionsCompleted, 0);
  const totalCorrect = topicCards.reduce((sum, topic) => sum + topic.questionsCorrect, 0);
  const averageAccuracy = totalQuestions > 0 ? Math.round((totalCorrect / totalQuestions) * 100) : 0;
  const hasQuizProgress = topicCards.length > 0;

  return (
    <div className="space-y-6 pb-10 animate-fade-in">
      <div className="relative overflow-hidden rounded-3xl border border-white/10 bg-gradient-to-r from-indigo-600/20 via-purple-600/20 to-cyan-600/20 p-6 shadow-2xl md:p-8">
        <div className="absolute -right-10 -top-10 h-48 w-48 rounded-full bg-purple-500/20 blur-3xl" />
        <div className="absolute -bottom-8 right-1/3 h-32 w-32 rounded-full bg-cyan-500/20 blur-3xl" />
        <div className="relative z-10 flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
          <div className="space-y-3">
            <p className="text-xs font-bold uppercase tracking-[0.25em] text-indigo-300">
              Student progress
            </p>
            <div>
              <h1 className="text-2xl font-extrabold leading-tight text-white md:text-3xl">
                My Learning Progress
              </h1>
              <p className="mt-2 max-w-2xl text-sm text-slate-300">
                See what {student.name} is learning, what is mastered, and what needs more practice.
              </p>
            </div>
            <div className="flex flex-col gap-3 sm:flex-row">
              <Link href="/subjects">
                <button className="inline-flex items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-indigo-500 to-purple-500 px-5 py-2.5 text-sm font-bold text-white shadow-lg shadow-indigo-500/20 transition-all hover:opacity-90">
                  <ClipboardList className="h-4 w-4" /> Start Practice
                </button>
              </Link>
              <Link href="/tutor">
                <button className="inline-flex items-center justify-center gap-2 rounded-2xl border border-white/10 bg-white/10 px-5 py-2.5 text-sm font-bold text-white transition-all hover:bg-white/15">
                  <Sparkles className="h-4 w-4" /> Ask BrainBuddy
                </button>
              </Link>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3 lg:w-[360px]">
            <StatBox label="Completed" value={String(totalQuestions)} />
            <StatBox label="Correct" value={String(totalCorrect)} />
            <StatBox label="Accuracy" value={`${averageAccuracy}%`} />
            <StatBox label="Mastered" value={String(masteredTopics.length)} />
          </div>
        </div>
      </div>

      {!hasQuizProgress && <EmptyProgressState />}

      <SectionCard
        icon={Target}
        title="Current Mastery Path"
        subtitle="The main quiz topic to work on right now."
      >
        {currentPath ? (
          <TopicCard topic={currentPath} />
        ) : (
          <EmptyProgressState />
        )}
      </SectionCard>

      <div className="grid gap-6 xl:grid-cols-2">
        <SectionCard
          icon={Trophy}
          title="Mastered Topics"
          subtitle={`Only topics with ${QUESTIONS_REQUIRED_FOR_MASTERY}+ submitted quiz questions and 80%+ accuracy appear here.`}
        >
          {masteredTopics.length > 0 ? (
            <div className="grid gap-3">
              {masteredTopics.map((topic) => (
                <TopicCard key={`${topic.subjectId}-${topic.topicKey}`} topic={topic} />
              ))}
            </div>
          ) : (
            <p className="rounded-2xl border border-dashed border-white/10 bg-white/5 p-4 text-sm text-slate-400">
              No mastered topics yet.
            </p>
          )}
        </SectionCard>

        <SectionCard
          icon={BookOpen}
          title="Still Practicing"
          subtitle="Submitted quiz topics that have not met the 50-question mastery rule yet."
        >
          {practicingTopics.length > 0 ? (
            <div className="grid gap-3">
              {practicingTopics.map((topic) => (
                <TopicCard key={`${topic.subjectId}-${topic.topicKey}`} topic={topic} />
              ))}
            </div>
          ) : (
            <p className="rounded-2xl border border-dashed border-white/10 bg-white/5 p-4 text-sm text-slate-400">
              No quiz progress yet.
            </p>
          )}
        </SectionCard>
      </div>

      <SectionCard
        icon={School}
        title="Teacher Assigned"
        subtitle="Real class topics from the teacher dashboard. These do not count as mastery by themselves."
      >
        {classTopics.length > 0 ? (
          <div className="grid gap-3 lg:grid-cols-2">
            {classTopics.map((classItem) => (
              <div key={classItem.id} className="rounded-2xl border border-cyan-500/20 bg-cyan-500/10 p-4">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="text-xs font-bold uppercase tracking-[0.2em] text-cyan-300">
                      {classItem.period || classItem.className}
                    </p>
                    <h3 className="mt-2 text-lg font-bold text-white">
                      {classItem.currentUnit || classItem.subjectName || "Class topic"}
                    </h3>
                    <p className="mt-1 text-sm text-slate-400">
                      {[classItem.gradeLevel, classItem.subjectName].filter(Boolean).join(" - ") || "Teacher class"}
                    </p>
                  </div>
                  <span className="rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs font-bold text-cyan-100">
                    {classItem.classCode}
                  </span>
                </div>
                {classItem.learningGoal && (
                  <p className="mt-4 text-sm text-slate-200">{classItem.learningGoal}</p>
                )}
                {classItem.brainbuddyInstructions && (
                  <p className="mt-3 rounded-2xl border border-white/10 bg-white/5 p-3 text-sm text-slate-300">
                    {classItem.brainbuddyInstructions}
                  </p>
                )}
              </div>
            ))}
          </div>
        ) : (
          <p className="rounded-2xl border border-dashed border-white/10 bg-white/5 p-4 text-sm text-slate-400">
            No teacher assigned topics yet. Join a class from the dashboard when your teacher gives you a code.
          </p>
        )}
      </SectionCard>

      <SectionCard
        icon={Lightbulb}
        title="BrainBuddy Recommendations"
        subtitle="Suggestions from real quiz progress, notes, and class focus data."
      >
        <div className="grid gap-3 lg:grid-cols-2">
          {recommendations.map((item) => (
            <Link
              key={`${item.href}-${item.title}`}
              href={item.href}
              className="group rounded-2xl border border-white/10 bg-white/5 p-4 transition-all hover:-translate-y-0.5 hover:bg-white/10"
            >
              <div className="flex items-start gap-3">
                <div className="h-9 w-9 rounded-xl bg-purple-500/20 border border-purple-500/30 flex items-center justify-center flex-shrink-0">
                  <CheckCircle2 className="h-4 w-4 text-purple-300" />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="font-bold text-white">{item.title}</p>
                  <p className="mt-1 text-sm text-slate-400">{item.detail}</p>
                </div>
                <ArrowRight className="h-4 w-4 text-slate-500 transition-colors group-hover:text-purple-300" />
              </div>
            </Link>
          ))}
        </div>
      </SectionCard>
    </div>
  );
}
