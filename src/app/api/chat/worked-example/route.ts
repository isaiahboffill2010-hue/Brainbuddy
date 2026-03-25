import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { openai } from "@/lib/openai/client";
import type OpenAI from "openai";

export const runtime = "nodejs";

/*
 * POST /api/chat/worked-example
 *
 * Analyzes the student's message (+ optional image), detects the concept,
 * generates a fresh similar problem, and returns a fully structured
 * worked-example JSON that the frontend renders as a visual card.
 *
 * Body:
 *   userMessage    string   — what the student typed
 *   imageUrl?      string   — persistent Supabase Storage URL
 *   imageDataUrl?  string   — ephemeral base64 data URL (snip path)
 *   subject        string   — e.g. "Math"
 *   studentName    string
 *   grade          string   — e.g. "4th Grade"
 */
export async function POST(req: Request) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { userMessage, imageUrl, imageDataUrl, subject, studentName, grade } = await req.json();
  if (!userMessage && !imageUrl && !imageDataUrl) {
    return NextResponse.json({ error: "userMessage or image required" }, { status: 400 });
  }

  // ── Build the image content block for GPT vision ───────────────────────────
  const resolvedImage: string | undefined = imageDataUrl ?? imageUrl ?? undefined;

  const systemPrompt = `You are an expert tutor who creates clear, visual worked examples for students.
Your job is to:
1. Identify the exact academic concept in the student's question or image
2. Create a SIMILAR practice problem (different numbers/words, same concept type)
3. Solve it step by step with simple language for a ${grade} student

Rules:
- Write all math in plain text only: use "1/2 + 1/4" NOT LaTeX
- Maximum 5 steps — keep it focused
- Each step must have a short label (3-6 words), a simple explanation, optional math work, and an optional memory tip
- The similar question MUST use completely different numbers than the original
- Keep language friendly and simple — this is for a kid`;

  const userContent: OpenAI.Chat.Completions.ChatCompletionContentPart[] = [];

  if (resolvedImage) {
    userContent.push({
      type: "image_url",
      image_url: { url: resolvedImage, detail: "high" },
    });
  }

  userContent.push({
    type: "text",
    text: `Student: ${studentName}, ${grade}
Subject: ${subject}
${userMessage ? `Student's question: "${userMessage}"` : "The student uploaded an image showing a problem."}

Analyze the concept and return ONLY this JSON (no markdown, no extra text):
{
  "title": "Short title e.g. 'Adding Unlike Fractions'",
  "topic": "Specific topic e.g. 'Fractions with Different Denominators'",
  "subject": "${subject}",
  "similarQuestion": "A fresh similar problem with different numbers",
  "steps": [
    {
      "stepNumber": 1,
      "label": "Short step name (3-6 words)",
      "explanation": "Simple kid-friendly explanation of what we do here",
      "math": "The actual working shown plainly, e.g. 'LCM(4, 6) = 12', or null",
      "hint": "An optional memory tip or shortcut, or null"
    }
  ],
  "finalAnswer": "The final answer stated clearly",
  "keyIdea": "One key takeaway sentence, or null"
}`,
  });

  const completion = await openai.chat.completions.create({
    model: resolvedImage ? "gpt-4o" : "gpt-4o-mini",
    messages: [
      { role: "system", content: systemPrompt },
      { role: "user", content: userContent },
    ],
    response_format: { type: "json_object" },
    temperature: 0.6,
    max_tokens: 1200,
  });

  const raw = completion.choices[0]?.message?.content ?? "{}";
  let parsed: WorkedExampleResponse;
  try {
    parsed = JSON.parse(raw);
  } catch {
    return NextResponse.json({ error: "Failed to parse AI response" }, { status: 500 });
  }

  return NextResponse.json(parsed);
}

// ── Types ─────────────────────────────────────────────────────────────────────
type WorkedExampleResponse = {
  title: string;
  topic: string;
  subject: string;
  similarQuestion: string;
  steps: {
    stepNumber: number;
    label: string;
    explanation: string;
    math: string | null;
    hint: string | null;
  }[];
  finalAnswer: string;
  keyIdea: string | null;
};
