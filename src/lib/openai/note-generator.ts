import { openai } from "./client";

export async function generateNote(
  userMessage: string,
  aiResponse: string,
  subject: string,
  grade: string
): Promise<{ topic: string; note: string } | null> {
  try {
    const res = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      max_tokens: 80,
      temperature: 0.3,
      response_format: { type: "json_object" },
      messages: [
        {
          role: "system",
          content: `You generate one short study note for a ${grade} student learning ${subject}.
Extract the single most useful learning takeaway from the student's question and the tutor's reply.
Rules:
- 1 sentence maximum
- Plain English only — no LaTeX, no markdown, no symbols like \\( or **
- Write it as a fact the student just learned, e.g. "Fractions with the same denominator are added by adding only the numerators."
- If there is no clear learning point, return {"topic":"","note":""}
Respond ONLY with valid JSON: {"topic": "short topic", "note": "one sentence note"}`,
        },
        {
          role: "user",
          content: `Student: "${userMessage}"\nTutor: "${aiResponse.slice(0, 600)}"`,
        },
      ],
    });

    const raw = res.choices[0]?.message?.content?.trim() ?? "";
    const parsed = JSON.parse(raw) as { topic?: string; note?: string };
    if (parsed.note && parsed.note.length > 5) {
      return { topic: parsed.topic ?? subject, note: parsed.note };
    }
    return null;
  } catch {
    return null;
  }
}
