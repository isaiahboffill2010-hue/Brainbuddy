"use client";

import Image from "next/image";

// ── Types ─────────────────────────────────────────────────────────────────────
export type WorkedExampleStep = {
  stepNumber: number;
  label: string;
  explanation: string;
  math: string | null;
  hint: string | null;
};

export type WorkedExample = {
  title: string;
  topic: string;
  subject: string;
  similarQuestion: string;
  steps: WorkedExampleStep[];
  finalAnswer: string;
  keyIdea: string | null;
};

// ── Subject colours ────────────────────────────────────────────────────────────
const subjectPalette: Record<string, { color: string; bg: string; border: string; emoji: string }> = {
  Math:        { color: "#4F7CFF", bg: "#EEF3FF", border: "#C7D7FF", emoji: "🔢" },
  Mathematics: { color: "#4F7CFF", bg: "#EEF3FF", border: "#C7D7FF", emoji: "🔢" },
  Reading:     { color: "#22C55E", bg: "#EEF8F0", border: "#BBF7D0", emoji: "📚" },
  Science:     { color: "#8B7FFF", bg: "#F3F0FF", border: "#D5D0FF", emoji: "🔬" },
  Writing:     { color: "#FFC857", bg: "#FFF8EC", border: "#FFE5A0", emoji: "✏️" },
};
function getPalette(subject?: string) {
  return subjectPalette[subject ?? ""] ?? { color: "#4F7CFF", bg: "#EEF3FF", border: "#C7D7FF", emoji: "📐" };
}

// ── Step circle colours — cycles through a set ────────────────────────────────
const stepColors = [
  { circle: "#4F7CFF", text: "#fff" },
  { circle: "#8B7FFF", text: "#fff" },
  { circle: "#22C55E", text: "#fff" },
  { circle: "#FFC857", text: "#1F2A44" },
  { circle: "#F87171", text: "#fff" },
];

// ── Component ─────────────────────────────────────────────────────────────────
export function WorkedExampleCard({ example }: { example: WorkedExample }) {
  const pal = getPalette(example.subject);

  return (
    <div
      className="mt-3 rounded-3xl border overflow-hidden shadow-card"
      style={{ borderColor: pal.border }}
    >
      {/* ── Header ── */}
      <div
        className="px-5 py-4 flex items-center gap-3"
        style={{ backgroundColor: pal.bg, borderBottom: `1px solid ${pal.border}` }}
      >
        {/* Cosmo logo */}
        <div className="h-9 w-9 rounded-2xl bg-gradient-to-br from-[#4F7CFF] to-[#8B7FFF] flex items-center justify-center flex-shrink-0 shadow-md overflow-hidden">
          <Image src="/cosmo-logo.png" alt="Cosmo" width={28} height={28} className="rounded-xl" />
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <span
              className="text-[10px] font-bold uppercase tracking-widest rounded-full px-2.5 py-0.5"
              style={{ backgroundColor: pal.color, color: "#fff" }}
            >
              Worked Example
            </span>
            <span className="text-[10px] font-semibold text-[#9AA4BA]">
              {pal.emoji} {example.subject} · {example.topic}
            </span>
          </div>
          <p className="text-sm font-extrabold text-[#1F2A44] mt-0.5 leading-tight">
            {example.title}
          </p>
        </div>
      </div>

      {/* ── Body ── */}
      <div className="bg-white px-5 py-5 space-y-5">

        {/* Similar question */}
        <div>
          <p className="text-[11px] font-bold text-[#9AA4BA] uppercase tracking-wider mb-2">
            Try this similar problem:
          </p>
          <div
            className="rounded-2xl border px-4 py-3"
            style={{ backgroundColor: pal.bg, borderColor: pal.border }}
          >
            <p className="text-base font-bold text-[#1F2A44] leading-snug">
              {example.similarQuestion}
            </p>
          </div>
        </div>

        {/* Steps */}
        <div className="space-y-4">
          {example.steps.map((step, i) => {
            const sc = stepColors[i % stepColors.length];
            return (
              <div key={step.stepNumber} className="flex gap-3">
                {/* Number circle + vertical line */}
                <div className="flex flex-col items-center flex-shrink-0">
                  <div
                    className="h-7 w-7 rounded-full flex items-center justify-center text-xs font-extrabold shadow-sm flex-shrink-0"
                    style={{ backgroundColor: sc.circle, color: sc.text }}
                  >
                    {step.stepNumber}
                  </div>
                  {i < example.steps.length - 1 && (
                    <div className="w-px flex-1 mt-1.5 mb-[-8px]" style={{ backgroundColor: sc.circle + "40", minHeight: "16px" }} />
                  )}
                </div>

                {/* Content */}
                <div className="flex-1 min-w-0 pb-1">
                  <p className="text-sm font-bold text-[#1F2A44] mb-1">{step.label}</p>
                  <p className="text-sm text-[#6B7A9A] leading-relaxed">{step.explanation}</p>

                  {/* Math box */}
                  {step.math && (
                    <div
                      className="mt-2 rounded-xl border px-3.5 py-2 inline-block"
                      style={{ backgroundColor: "#F7FAFF", borderColor: "#E8EDF8" }}
                    >
                      <code className="text-sm font-bold text-[#4F7CFF] font-mono whitespace-pre-wrap">
                        {step.math}
                      </code>
                    </div>
                  )}

                  {/* Hint */}
                  {step.hint && (
                    <div className="mt-2 flex items-start gap-1.5 rounded-xl bg-[#FFF8EC] border border-[#FFE5A0] px-3 py-2">
                      <span className="text-sm flex-shrink-0">💡</span>
                      <p className="text-xs text-[#92600A] leading-relaxed">{step.hint}</p>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>

        {/* Final answer */}
        <div className="rounded-2xl bg-[#EEF8F0] border border-[#BBF7D0] px-5 py-4 flex items-center gap-3">
          <div className="h-9 w-9 rounded-xl bg-[#22C55E] flex items-center justify-center flex-shrink-0 shadow-sm">
            <span className="text-white font-extrabold text-sm">✓</span>
          </div>
          <div>
            <p className="text-[10px] font-bold text-[#16A34A] uppercase tracking-wider">Final Answer</p>
            <p className="text-lg font-extrabold text-[#1F2A44] leading-tight mt-0.5">
              {example.finalAnswer}
            </p>
          </div>
        </div>

        {/* Key idea */}
        {example.keyIdea && (
          <div className="flex items-start gap-2 rounded-2xl bg-[#F3F0FF] border border-[#D5D0FF] px-4 py-3">
            <span className="text-base flex-shrink-0 mt-0.5">🧠</span>
            <p className="text-sm text-[#5B21B6] font-medium leading-relaxed">
              <span className="font-bold">Key idea: </span>{example.keyIdea}
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
