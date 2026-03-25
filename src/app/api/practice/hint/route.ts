import { openai } from "@/lib/openai/client";

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
    // default: hint
    userPrompt = `Give ONE helpful hint for this question without revealing the answer. Be encouraging.

Question: ${question}
Topic: ${topic}
Subject: ${subject}
Student: ${studentName}, ${grade}`;
  }

  const stream = await openai.chat.completions.create({
    model: "gpt-4o-mini",
    messages: [
      {
        role: "system",
        content:
          "You are Cosmo, a friendly AI tutor for kids. Keep responses SHORT and encouraging. No markdown. No LaTeX. Plain sentences only.",
      },
      { role: "user", content: userPrompt },
    ],
    stream: true,
    max_tokens: 300,
    temperature: 0.7,
  });

  const encoder = new TextEncoder();
  const readable = new ReadableStream<Uint8Array>({
    async start(controller) {
      try {
        for await (const chunk of stream) {
          const text = chunk.choices[0]?.delta?.content ?? "";
          if (text) {
            controller.enqueue(encoder.encode(text));
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
