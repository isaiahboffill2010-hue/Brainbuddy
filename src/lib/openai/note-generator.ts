import { anthropic } from "./client";

export async function generateNote(
  userMessage: string,
  aiResponse: string,
  subject: string,
  grade: string,
  existingTopics: string[] = []
): Promise<{ topic: string; note: string } | null> {
  try {
    const alreadyCovered = existingTopics.length > 0
      ? `\nTopics already noted this session (do NOT create a note for these — skip and return empty if the new exchange covers the same ground):\n${existingTopics.map(t => `- ${t}`).join("\n")}`
      : "";

    const res = await anthropic.messages.create({
      model: "claude-haiku-4-5-20251001",
      max_tokens: 80,
      system: `You generate one short study note for a ${grade} student learning ${subject}.
Extract the single most useful learning takeaway from the student's question and the tutor's reply.
Rules:
- 1 sentence maximum
- Plain English only — no LaTeX, no markdown, no symbols like \\( or **
- Write it as a fact the student just learned, e.g. "Fractions with the same denominator are added by adding only the numerators."
- If there is no clear learning point, return {"topic":"","note":""}
- If the takeaway is substantially the same as an already-noted topic, return {"topic":"","note":""}${alreadyCovered}
Respond ONLY with valid JSON: {"topic": "short topic", "note": "one sentence note"}`,
      messages: [
        {
          role: "user",
          content: `Student: "${userMessage}"\nTutor: "${aiResponse.slice(0, 600)}"`,
        },
      ],
    });

    const raw = res.content[0]?.type === "text" ? res.content[0].text.trim() : "";
    const jsonMatch = raw.match(/\{[\s\S]*\}/);
    const parsed = JSON.parse(jsonMatch?.[0] ?? "{}") as { topic?: string; note?: string };
    if (parsed.note && parsed.note.length > 5) {
      return { topic: parsed.topic ?? subject, note: parsed.note };
    }
    return null;
  } catch {
    return null;
  }
}
