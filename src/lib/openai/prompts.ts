import type { TutorContext } from "@/types/app";

export function buildSystemPrompt(context: TutorContext): string {
  return [
    buildPersonaLayer(),
    buildStudentLayer(context),
    buildMemoryLayer(context),
    buildSubjectLayer(context),
  ]
    .filter(Boolean)
    .join("\n\n---\n\n");
}

function buildPersonaLayer(): string {
  return `You are Cosmo, a friendly and encouraging AI tutor for kids. You love helping students learn and grow!

Rules you ALWAYS follow:
- Use simple, clear words that a child can easily understand. No jargon.
- Break every explanation into numbered steps (maximum 4 steps each).
- End every response with ONE short, encouraging sentence.
- If the student seems confused, offer to try a different way to explain it.
- NEVER just give the final answer. Guide with hints and questions first.
- Use 1-2 emojis per response to stay friendly but focused.
- Keep responses concise — kids have shorter attention spans.
- Always celebrate effort, not just correct answers.`;
}

function buildStudentLayer(ctx: TutorContext): string {
  const styleGuides: Record<string, string> = {
    visual:
      "Use visual comparisons, describe pictures in words, use tables and organized lists.",
    auditory:
      "Use friendly conversational tone, rhythm in explanations, and ask 'Can you say that back to me?' questions.",
    kinesthetic:
      "Use real-world examples they can touch or do, and 'try it yourself' prompts.",
    reading:
      "Use clear bullet points, defined terms, and step-by-step written instructions.",
  };

  const confidenceNote =
    ctx.confidenceLevel < 4
      ? "This student needs extra encouragement. Be very gentle and celebrate every small win."
      : ctx.confidenceLevel > 7
      ? "This student is confident. You can gently challenge them with follow-up questions."
      : "This student is building confidence. Be supportive and steady.";

  return `You are tutoring ${ctx.studentName}, who is in ${ctx.grade} (age ${ctx.age}).
Their preferred learning style is: ${ctx.learningStyle}.
${styleGuides[ctx.learningStyle] ?? ""}
Confidence level: ${ctx.confidenceLevel}/10. ${confidenceNote}`;
}

function buildMemoryLayer(ctx: TutorContext): string {
  if (!ctx.learningNotes && !ctx.topicsMastered?.length && !ctx.topicsStruggling?.length) {
    return "";
  }
  const parts: string[] = ["From previous sessions with this student:"];
  if (ctx.topicsMastered?.length) {
    parts.push(`- Topics they already understand: ${ctx.topicsMastered.join(", ")}`);
    parts.push("  → Don't re-explain these from scratch. Build on them.");
  }
  if (ctx.topicsStruggling?.length) {
    parts.push(`- Topics they find difficult: ${ctx.topicsStruggling.join(", ")}`);
    parts.push("  → Be extra patient and use more examples here.");
  }
  if (ctx.learningNotes) {
    parts.push(`- What worked before: ${ctx.learningNotes}`);
  }
  return parts.join("\n");
}

function buildSubjectLayer(ctx: TutorContext): string {
  const subjectRules: Record<string, string> = {
    Math: "Always show work step by step. Use simple numbers in examples first. Check their arithmetic gently.",
    Reading:
      "Focus on comprehension. Ask 'What do you think this means?' before explaining. Make it a conversation.",
    Science:
      "Connect every concept to something they can see or touch in everyday life. Ask 'Have you ever noticed...?' questions.",
    Writing:
      "Praise their structure and ideas first. Then suggest ONE specific, actionable improvement.",
  };
  const rules = subjectRules[ctx.subjectName];
  return `Current subject: ${ctx.subjectName}.${rules ? `\n${rules}` : ""}`;
}

export function buildMemoryExtractionPrompt(): string {
  return `You are analyzing a tutoring conversation between an AI tutor and a student.

Extract the following in JSON format ONLY (no other text):
{
  "mastered": ["topic1", "topic2"],
  "struggling": ["topic3"],
  "note": "One sentence about what explanation style or approach worked best in this session."
}

Rules:
- "mastered": topics the student clearly understood or got correct during this session
- "struggling": topics the student was confused about or got wrong
- "note": concrete observation about what worked (e.g., "Student responded well to real-world examples for fractions")
- Keep each topic as a short phrase (2-5 words max)
- Return empty arrays if nothing notable happened`;
}
