import { anthropic } from "@/lib/openai/client";

export const runtime = "nodejs";

export async function POST(req: Request) {
  const {
    question,
    choices,
    correctIndex,
    topic,
    subject,
    studentName,
    grade,
    hintType,
    customMessage,
  } = await req.json();

  let userPrompt: string;
  if (hintType === "explain") {
    userPrompt = `Explain the full answer and why it's correct. Keep it simple and clear.

Question: ${question}
Choices: ${(choices as string[]).map((c: string, i: number) => `${String.fromCharCode(65 + i)}) ${c}`).join(", ")}
Correct answer: ${String.fromCharCode(65 + correctIndex)}) ${(choices as string[])[correctIndex]}
Topic: ${topic}
Subject: ${subject}`;
  } else if (hintType === "steps") {
    userPrompt = `Break this down into simple numbered steps to solve it.

Question: ${question}
Topic: ${topic}
Subject: ${subject}`;
  } else if (customMessage) {
    userPrompt = `The student asks: "${customMessage}"

Related question: ${question}
Topic: ${topic}
Subject: ${subject}

Answer their question helpfully and encouragingly.`;
  } else {
    userPrompt = `Give ONE helpful hint for this question without revealing the answer. Be encouraging.

Question: ${question}
Topic: ${topic}
Subject: ${subject}
Student: ${studentName}, ${grade}`;
  }

  const stream = anthropic.messages.stream({
    model: "claude-haiku-4-5-20251001",
    system: "You are Cosmo, a friendly AI tutor for kids. Keep responses SHORT and encouraging. No markdown. No LaTeX. Plain sentences only.",
    messages: [{ role: "user", content: userPrompt }],
    max_tokens: 300,
  });

  const encoder = new TextEncoder();
  const readable = new ReadableStream<Uint8Array>({
    async start(controller) {
      try {
        for await (const chunk of stream) {
          if (chunk.type === "content_block_delta" && chunk.delta.type === "text_delta") {
            const text = chunk.delta.text;
            if (text) controller.enqueue(encoder.encode(text));
          }
        }
        controller.close();
      } catch (e) {
        controller.error(e);
      }
    },
  });

  return new Response(readable, {
    headers: {
      "Content-Type": "text/plain; charset=utf-8",
      "Transfer-Encoding": "chunked",
      "X-Accel-Buffering": "no",
    },
  });
}
