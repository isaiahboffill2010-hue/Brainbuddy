import type { JoinedClassSummary } from "@/lib/supabase/queries/classes";
import type { StudentNote } from "@/lib/supabase/queries/notes";

export const QUESTIONS_REQUIRED_FOR_MASTERY = 50;

export type MasteryStatus = "Mastered" | "Almost Mastered" | "Practicing" | "Not Started";

export type TopicAttemptStat = {
  topic: string;
  topicKey: string;
  subjectId: string | null;
  subject: string;
  subjectColor: string;
  questionsCompleted: number;
  questionsCorrect: number;
  integrityFlagged: boolean;
  masteryCheckPassed?: boolean | null;
};

export type TopicProgressCard = TopicAttemptStat & {
  status: MasteryStatus;
  accuracyPercentage: number;
  progressPercentage: number;
  nextStep: string;
};

export type Recommendation = {
  title: string;
  detail: string;
  href: string;
};

export type QuizAttemptInput = {
  topic: string | null;
  subjectId: string | null;
  subjectName: string | null;
  subjectColor: string | null;
  isCorrect: boolean;
  integrityFlagged: boolean;
  masteryCheck: boolean;
};

export function normalizeTopicKey(topic: string) {
  return topic.trim().toLowerCase().replace(/\s+/g, " ");
}

function clampPercent(value: number) {
  return Math.max(0, Math.min(100, Math.round(value)));
}

export function accuracyPercent(questionsCorrect: number, questionsCompleted: number) {
  if (questionsCompleted <= 0) return 0;
  return clampPercent((questionsCorrect / questionsCompleted) * 100);
}

export function classifyMastery(stat: {
  questionsCompleted: number;
  questionsCorrect: number;
  integrityFlagged?: boolean;
  masteryCheckRequired?: boolean;
  masteryCheckPassed?: boolean | null;
}): MasteryStatus {
  const completed = stat.questionsCompleted;
  if (completed <= 0) return "Not Started";

  const accuracy = accuracyPercent(stat.questionsCorrect, completed);
  const hasCleanMasteryCheck =
    !stat.integrityFlagged && (!stat.masteryCheckRequired || stat.masteryCheckPassed === true);

  if (completed >= QUESTIONS_REQUIRED_FOR_MASTERY && accuracy >= 80 && hasCleanMasteryCheck) {
    return "Mastered";
  }

  if (
    (completed >= 30 && completed < QUESTIONS_REQUIRED_FOR_MASTERY && accuracy >= 70) ||
    (completed >= QUESTIONS_REQUIRED_FOR_MASTERY && accuracy >= 70 && accuracy < 80)
  ) {
    return "Almost Mastered";
  }

  return "Practicing";
}

function nextStepFor(stat: TopicAttemptStat, status: MasteryStatus) {
  const remaining = Math.max(0, QUESTIONS_REQUIRED_FOR_MASTERY - stat.questionsCompleted);
  const accuracy = accuracyPercent(stat.questionsCorrect, stat.questionsCompleted);

  if (status === "Mastered") {
    return "Keep it fresh with a quick review when this topic comes up again.";
  }

  if (stat.questionsCompleted === 0) {
    return `Complete ${QUESTIONS_REQUIRED_FOR_MASTERY} quiz questions for this exact topic and reach 80% accuracy.`;
  }

  if (stat.integrityFlagged) {
    return "Retake a clean mastery check before this topic can be mastered.";
  }

  if (stat.questionsCompleted < QUESTIONS_REQUIRED_FOR_MASTERY && accuracy < 80) {
    return `Complete ${remaining} more questions and raise accuracy to 80%.`;
  }

  if (stat.questionsCompleted < QUESTIONS_REQUIRED_FOR_MASTERY) {
    return `Complete ${remaining} more questions while keeping 80% accuracy.`;
  }

  return "Raise accuracy to 80% or higher on this exact topic.";
}

export function buildTopicAttemptStats(attempts: QuizAttemptInput[]): TopicAttemptStat[] {
  const byTopic = new Map<string, TopicAttemptStat>();

  for (const attempt of attempts) {
    const topic = attempt.topic?.trim();
    if (!topic) continue;

    const topicKey = normalizeTopicKey(topic);
    const key = `${attempt.subjectId ?? "subject"}:${topicKey}`;
    const existing = byTopic.get(key);

    if (existing) {
      existing.questionsCompleted += 1;
      existing.questionsCorrect += attempt.isCorrect ? 1 : 0;
      existing.integrityFlagged = existing.integrityFlagged || attempt.integrityFlagged;
      existing.masteryCheckPassed =
        existing.masteryCheckPassed ||
        (attempt.masteryCheck && attempt.isCorrect && !attempt.integrityFlagged);
    } else {
      byTopic.set(key, {
        topic,
        topicKey,
        subjectId: attempt.subjectId,
        subject: attempt.subjectName || "Subject",
        subjectColor: attempt.subjectColor || "#4F7CFF",
        questionsCompleted: 1,
        questionsCorrect: attempt.isCorrect ? 1 : 0,
        integrityFlagged: attempt.integrityFlagged,
        masteryCheckPassed: attempt.masteryCheck && attempt.isCorrect && !attempt.integrityFlagged,
      });
    }
  }

  return Array.from(byTopic.values()).sort((a, b) => {
    const aStatus = classifyMastery(a);
    const bStatus = classifyMastery(b);
    if (aStatus !== bStatus) return aStatus.localeCompare(bStatus);
    return b.questionsCompleted - a.questionsCompleted;
  });
}

export function buildTopicProgressCards(stats: TopicAttemptStat[]): TopicProgressCard[] {
  return stats.map((stat) => {
    const status = classifyMastery(stat);
    return {
      ...stat,
      status,
      accuracyPercentage: accuracyPercent(stat.questionsCorrect, stat.questionsCompleted),
      progressPercentage: clampPercent(
        (Math.min(stat.questionsCompleted, QUESTIONS_REQUIRED_FOR_MASTERY) / QUESTIONS_REQUIRED_FOR_MASTERY) * 100
      ),
      nextStep: nextStepFor(stat, status),
    };
  });
}

export function pickCurrentMasteryPath(input: {
  topicCards: TopicProgressCard[];
  classes: JoinedClassSummary[];
}): TopicProgressCard | null {
  const teacherTopic = input.classes.find((item) => item.currentUnit || item.learningGoal);

  if (teacherTopic) {
    const topic = teacherTopic.currentUnit || teacherTopic.learningGoal || teacherTopic.subjectName || "Class focus";
    const topicKey = normalizeTopicKey(topic);
    const matchingProgress = input.topicCards.find(
      (card) =>
        card.topicKey === topicKey &&
        (!teacherTopic.subjectId || card.subjectId === teacherTopic.subjectId)
    );

    if (matchingProgress) return matchingProgress;

    return {
      topic,
      topicKey,
      subjectId: teacherTopic.subjectId,
      subject: teacherTopic.subjectName || "Class",
      subjectColor: teacherTopic.subjectColor || "#4F7CFF",
      questionsCompleted: 0,
      questionsCorrect: 0,
      integrityFlagged: false,
      masteryCheckPassed: null,
      status: "Not Started",
      accuracyPercentage: 0,
      progressPercentage: 0,
      nextStep: `Start practice for this exact topic. You need ${QUESTIONS_REQUIRED_FOR_MASTERY} completed quiz questions and 80% accuracy to master it.`,
    };
  }

  return input.topicCards.find((card) => card.status !== "Mastered") ?? input.topicCards[0] ?? null;
}

export function buildRecommendations(input: {
  topicCards: TopicProgressCard[];
  classes: JoinedClassSummary[];
  notes: StudentNote[];
}): Recommendation[] {
  const recommendations: Recommendation[] = [];
  const teacherClass = input.classes.find((item) => item.currentUnit || item.learningGoal);
  const needsPractice = input.topicCards.filter((card) => card.status !== "Mastered");
  const recentNote = input.notes.find((note) => note.topic || note.subject);

  if (needsPractice[0]) {
    recommendations.push({
      title: needsPractice[0].topic,
      detail: needsPractice[0].nextStep,
      href: `/subjects?subject=${encodeURIComponent(needsPractice[0].subject)}`,
    });
  }

  if (teacherClass) {
    recommendations.push({
      title: teacherClass.currentUnit || teacherClass.subjectName || "Teacher class focus",
      detail:
        teacherClass.learningGoal ||
        teacherClass.brainbuddyInstructions ||
        "Practice the exact class topic your teacher assigned.",
      href: "/tutor",
    });
  }

  for (const topic of needsPractice.slice(1, 3)) {
    recommendations.push({
      title: topic.topic,
      detail: `Keep practicing ${topic.subject}: ${topic.questionsCompleted}/${QUESTIONS_REQUIRED_FOR_MASTERY} questions completed.`,
      href: `/subjects?subject=${encodeURIComponent(topic.subject)}`,
    });
  }

  if (recentNote && recommendations.length < 3) {
    recommendations.push({
      title: recentNote.topic || recentNote.subject || "Recent notes",
      detail: "Review this recent BrainBuddy note, then answer quiz questions for the exact topic.",
      href: "/notes",
    });
  }

  if (recommendations.length === 0) {
    recommendations.push(
      {
        title: "Start a practice set",
        detail: "Submitted quiz answers are what build mastery progress.",
        href: "/subjects",
      },
      {
        title: "Ask BrainBuddy",
        detail: "Use chat for help, then practice the exact topic in quizzes.",
        href: "/tutor",
      }
    );
  }

  return recommendations.slice(0, 4);
}
