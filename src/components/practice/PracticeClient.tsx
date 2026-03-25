"use client";

import { useState, useRef, useEffect } from "react";
import { Send, Loader2 } from "lucide-react";
import Image from "next/image";
import Link from "next/link";

// ── Types ──────────────────────────────────────────────────────────────────────
type Question = {
  topic: string;
  question: string;
  choices: string[];
  correctIndex: number;
  explanation: string;
};

type Subject = { id: string; name: string; icon: string; color: string };

type Student = {
  id: string;
  name: string;
  grade: string;
  age: number | null;
  avatar_emoji: string;
  learning_style: string;
};

type SubjectProgress = {
  topicsStruggling: string[];
  topicsMastered: string[];
  sessionCount: number;
};

type PracticeState = "idle" | "loading" | "practice" | "complete";

// ── Subject metadata ───────────────────────────────────────────────────────────
const subjectMeta: Record<string, { emoji: string; color: string; bg: string; border: string }> = {
  Math:        { emoji: "🔢", color: "#4F7CFF", bg: "#EEF3FF", border: "#C7D7FF" },
  Mathematics: { emoji: "🔢", color: "#4F7CFF", bg: "#EEF3FF", border: "#C7D7FF" },
  Reading:     { emoji: "📚", color: "#22C55E", bg: "#EEF8F0", border: "#BBF7D0" },
  Science:     { emoji: "🔬", color: "#8B7FFF", bg: "#F3F0FF", border: "#D5D0FF" },
  Writing:     { emoji: "✏️", color: "#FFC857", bg: "#FFF8EC", border: "#FFE5A0" },
};

function getMeta(name?: string | null) {
  return subjectMeta[name ?? ""] ?? { emoji: "🧠", color: "#4F7CFF", bg: "#EEF3FF", border: "#C7D7FF" };
}

// ── Main component ─────────────────────────────────────────────────────────────
export function PracticeClient({
  student,
  subjects,
  progressBySubject,
  initialSubjectId,
}: {
  student: Student;
  subjects: Subject[];
  progressBySubject: Record<string, SubjectProgress>;
  initialSubjectId?: string;
}) {
  const initialSubject =
    (initialSubjectId ? subjects.find((s) => s.id === initialSubjectId) : null) ??
    subjects[0] ??
    null;

  const [activeSubject, setActiveSubject] = useState<Subject | null>(initialSubject);
  const [practiceState, setPracticeState] = useState<PracticeState>("idle");
  const [questions, setQuestions] = useState<Question[]>([]);
  const [focusTopic, setFocusTopic] = useState("");
  const [currentIdx, setCurrentIdx] = useState(0);
  const [selectedChoice, setSelectedChoice] = useState<number | null>(null);
  const [submitted, setSubmitted] = useState(false);
  const [score, setScore] = useState(0);
  const [cosmoText, setCosmoText] = useState("");
  const [cosmoLoading, setCosmoLoading] = useState(false);
  const [cosmoInput, setCosmoInput] = useState("");

  const cosmoEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    cosmoEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [cosmoText]);

  const currentQuestion = questions[currentIdx] ?? null;
  const progress = activeSubject ? (progressBySubject[activeSubject.id] ?? null) : null;

  // ── Generate questions ────────────────────────────────────────────────────
  async function generateQuestions() {
    if (!activeSubject) return;
    setPracticeState("loading");
    setCosmoText("");
    try {
      const res = await fetch("/api/practice/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ studentId: student.id, subjectId: activeSubject.id }),
      });
      if (!res.ok) throw new Error("Failed to generate");
      const data = await res.json();
      setQuestions(data.questions ?? []);
      setFocusTopic(data.focusTopic ?? "");
      setCurrentIdx(0);
      setSelectedChoice(null);
      setSubmitted(false);
      setScore(0);
      setCosmoText("");
      setPracticeState("practice");
    } catch {
      setPracticeState("idle");
    }
  }

  // ── Cosmo hint ────────────────────────────────────────────────────────────
  async function callCosmo(hintType: string, customMsg?: string) {
    if (!currentQuestion) return;
    setCosmoLoading(true);
    setCosmoText("");
    try {
      const res = await fetch("/api/practice/hint", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          question: currentQuestion.question,
          choices: currentQuestion.choices,
          correctIndex: currentQuestion.correctIndex,
          topic: currentQuestion.topic,
          subject: activeSubject?.name ?? "",
          studentName: student.name,
          grade: student.grade,
          hintType,
          customMessage: customMsg ?? undefined,
        }),
      });
      if (!res.ok || !res.body) throw new Error("Hint failed");

      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let full = "";
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        full += decoder.decode(value, { stream: true });
        setCosmoText(full);
      }
    } catch {
      setCosmoText("Hmm, I had trouble thinking just now. Try again!");
    } finally {
      setCosmoLoading(false);
    }
  }

  function handleSubmit() {
    if (selectedChoice === null) return;
    setSubmitted(true);
    if (selectedChoice === currentQuestion?.correctIndex) {
      setScore((s) => s + 1);
    }
  }

  function handleNext() {
    if (currentIdx + 1 >= questions.length) {
      setPracticeState("complete");
    } else {
      setCurrentIdx((i) => i + 1);
      setSelectedChoice(null);
      setSubmitted(false);
      setCosmoText("");
    }
  }

  function handleTabClick(subject: Subject) {
    setActiveSubject(subject);
    setPracticeState("idle");
    setQuestions([]);
    setFocusTopic("");
    setCurrentIdx(0);
    setSelectedChoice(null);
    setSubmitted(false);
    setScore(0);
    setCosmoText("");
  }

  async function handleCosmoSend() {
    const msg = cosmoInput.trim();
    if (!msg || cosmoLoading) return;
    setCosmoInput("");
    await callCosmo("custom", msg);
  }

  const meta = getMeta(activeSubject?.name);
  const weakTopics = progress?.topicsStruggling ?? [];

  // ── Render ─────────────────────────────────────────────────────────────────
  return (
    <div className="flex gap-4 h-[calc(100vh-120px)] animate-fade-in">

      {/* ── LEFT: Practice area ── */}
      <div className="flex-1 flex flex-col bg-white rounded-3xl border border-[#E8EDF8] shadow-card overflow-hidden">

        {/* Subject tabs */}
        <div className="flex items-center gap-2 px-5 py-3 border-b border-[#E8EDF8] flex-shrink-0 overflow-x-auto">
          {subjects.map((s) => {
            const m = getMeta(s.name);
            const isActive = activeSubject?.id === s.id;
            const subProgress = progressBySubject[s.id];
            const weakCount = subProgress?.topicsStruggling?.length ?? 0;
            return (
              <button
                key={s.id}
                onClick={() => handleTabClick(s)}
                className="flex items-center gap-1.5 rounded-2xl px-4 py-2 text-sm font-semibold flex-shrink-0 transition-all border relative"
                style={{
                  backgroundColor: isActive ? m.color : m.bg,
                  color: isActive ? "#fff" : m.color,
                  borderColor: isActive ? m.color : m.border,
                }}
              >
                <span className="text-base">{m.emoji}</span>
                {s.name}
                {weakCount > 0 && (
                  <span
                    className="ml-1 text-[10px] font-bold rounded-full px-1.5 py-0.5 leading-none"
                    style={{
                      backgroundColor: isActive ? "rgba(255,255,255,0.25)" : "#FFF8EC",
                      color: isActive ? "#fff" : "#F5AD2E",
                    }}
                  >
                    {weakCount}
                  </span>
                )}
              </button>
            );
          })}
        </div>

        {/* Practice content */}
        <div className="flex-1 overflow-y-auto px-6 py-6">

          {/* ── State: idle ── */}
          {practiceState === "idle" && (
            <div className="flex flex-col items-center justify-center h-full text-center space-y-5 py-8">
              <div
                className="h-20 w-20 rounded-3xl flex items-center justify-center text-4xl"
                style={{ backgroundColor: meta.bg }}
              >
                {meta.emoji}
              </div>
              <div className="space-y-1">
                <h2 className="text-xl font-extrabold text-[#1F2A44]">
                  Ready to practice {activeSubject?.name}?
                </h2>
                <p className="text-sm text-[#6B7A9A]">
                  BrainBuddy will build a personalized set of 6 questions just for you.
                </p>
              </div>

              {weakTopics.length > 0 && (
                <div className="space-y-2">
                  <p className="text-xs font-semibold text-[#9AA4BA] uppercase tracking-wider">
                    Focus areas
                  </p>
                  <div className="flex flex-wrap justify-center gap-2">
                    {weakTopics.map((topic) => (
                      <span
                        key={topic}
                        className="text-xs font-semibold rounded-full px-3 py-1 border"
                        style={{ backgroundColor: "#FFF8EC", color: "#F5AD2E", borderColor: "#FFE5A0" }}
                      >
                        {topic}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              <button
                onClick={generateQuestions}
                className="flex items-center gap-2 rounded-2xl px-6 py-3 text-sm font-bold text-white transition-all hover:opacity-90 hover:-translate-y-0.5 shadow-sm"
                style={{ backgroundColor: meta.color }}
              >
                Generate Practice Questions
              </button>
            </div>
          )}

          {/* ── State: loading ── */}
          {practiceState === "loading" && (
            <div className="flex flex-col items-center justify-center h-full text-center space-y-4">
              <Loader2 className="h-10 w-10 animate-spin" style={{ color: meta.color }} />
              <div>
                <p className="text-base font-bold text-[#1F2A44]">
                  BrainBuddy is building your practice set...
                </p>
                <p className="text-sm text-[#9AA4BA] mt-1">Analyzing your weak areas...</p>
              </div>
            </div>
          )}

          {/* ── State: practice ── */}
          {practiceState === "practice" && currentQuestion && (
            <div className="max-w-2xl mx-auto space-y-4">

              {/* Top info bar */}
              <div className="flex items-center justify-between">
                <span
                  className="text-xs font-bold rounded-full px-3 py-1.5 border"
                  style={{ backgroundColor: "#FFF8EC", color: "#F5AD2E", borderColor: "#FFE5A0" }}
                >
                  Focus: {focusTopic}
                </span>
                <span className="text-xs font-semibold text-[#6B7A9A]">
                  {submitted ? "✓" : ""} {score} / {submitted ? currentIdx + 1 : currentIdx} answered
                </span>
              </div>

              {/* Question card */}
              <div className="bg-white rounded-3xl border border-[#E8EDF8] shadow-card p-6 space-y-5">

                {/* Question number + topic */}
                <div className="flex items-center gap-2">
                  <span className="text-xs font-bold rounded-full px-2.5 py-1 bg-[#F7FAFF] border border-[#E8EDF8] text-[#6B7A9A]">
                    Q{currentIdx + 1} of {questions.length}
                  </span>
                  <span
                    className="text-xs font-bold rounded-full px-2.5 py-1 border"
                    style={{ backgroundColor: meta.bg, color: meta.color, borderColor: meta.border }}
                  >
                    {currentQuestion.topic}
                  </span>
                </div>

                {/* Question text */}
                <p className="text-lg font-bold text-[#1F2A44] leading-snug">
                  {currentQuestion.question}
                </p>

                {/* Choices */}
                <div className="space-y-3">
                  {currentQuestion.choices.map((choice, i) => {
                    const isSelected = selectedChoice === i;
                    const isCorrect = i === currentQuestion.correctIndex;
                    const isWrongSelected = submitted && isSelected && !isCorrect;
                    const isRightAnswer = submitted && isCorrect;
                    const isDimmed = submitted && !isSelected && !isCorrect;

                    let bgColor = "#fff";
                    let borderColor = "#E8EDF8";
                    let textColor = "#1F2A44";

                    if (!submitted && isSelected) {
                      bgColor = "#EEF3FF";
                      borderColor = "#4F7CFF";
                    } else if (submitted) {
                      if (isRightAnswer) {
                        bgColor = "#EEF8F0";
                        borderColor = "#22C55E";
                        textColor = "#16A34A";
                      } else if (isWrongSelected) {
                        bgColor = "#FFF0F0";
                        borderColor = "#F87171";
                        textColor = "#F87171";
                      }
                    }

                    return (
                      <button
                        key={i}
                        disabled={submitted}
                        onClick={() => setSelectedChoice(i)}
                        className="w-full flex items-center gap-3 rounded-2xl border px-4 py-3 text-left text-sm font-medium transition-all hover:border-[#4F7CFF]/40 disabled:cursor-default"
                        style={{
                          backgroundColor: bgColor,
                          borderColor,
                          color: textColor,
                          opacity: isDimmed ? 0.45 : 1,
                        }}
                      >
                        <span
                          className="h-6 w-6 rounded-full border flex items-center justify-center text-xs font-bold flex-shrink-0 transition-all"
                          style={{
                            backgroundColor: isRightAnswer
                              ? "#22C55E"
                              : isWrongSelected
                              ? "#F87171"
                              : !submitted && isSelected
                              ? "#4F7CFF"
                              : "#F7FAFF",
                            borderColor: isRightAnswer
                              ? "#22C55E"
                              : isWrongSelected
                              ? "#F87171"
                              : !submitted && isSelected
                              ? "#4F7CFF"
                              : "#E8EDF8",
                            color:
                              isRightAnswer || isWrongSelected || (!submitted && isSelected)
                                ? "#fff"
                                : "#9AA4BA",
                          }}
                        >
                          {isRightAnswer ? "✓" : isWrongSelected ? "✗" : String.fromCharCode(65 + i)}
                        </span>
                        {choice}
                      </button>
                    );
                  })}
                </div>

                {/* Explanation (after submit) */}
                {submitted && (
                  <div
                    className="rounded-2xl border p-4 text-sm text-[#1F2A44] leading-relaxed"
                    style={{ backgroundColor: "#EEF8F0", borderColor: "#BBF7D0" }}
                  >
                    <span className="font-bold text-[#16A34A]">Explanation: </span>
                    {currentQuestion.explanation}
                  </div>
                )}

                {/* Bottom bar */}
                <div className="flex justify-end pt-1">
                  {!submitted && (
                    <button
                      disabled={selectedChoice === null}
                      onClick={handleSubmit}
                      className="rounded-2xl px-6 py-2.5 text-sm font-bold text-white transition-all hover:opacity-90 disabled:opacity-40 disabled:cursor-not-allowed"
                      style={{ backgroundColor: meta.color }}
                    >
                      Submit Answer
                    </button>
                  )}
                  {submitted && currentIdx + 1 < questions.length && (
                    <button
                      onClick={handleNext}
                      className="rounded-2xl px-6 py-2.5 text-sm font-bold text-white transition-all hover:opacity-90"
                      style={{ backgroundColor: meta.color }}
                    >
                      Next Question →
                    </button>
                  )}
                  {submitted && currentIdx + 1 >= questions.length && (
                    <button
                      onClick={() => setPracticeState("complete")}
                      className="rounded-2xl px-6 py-2.5 text-sm font-bold text-white transition-all hover:opacity-90 bg-[#22C55E]"
                    >
                      Practice Complete! 🎉
                    </button>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* ── State: complete ── */}
          {practiceState === "complete" && (
            <div className="flex flex-col items-center justify-center h-full text-center space-y-6 py-8 max-w-md mx-auto">
              <div className="text-6xl">
                {score / questions.length >= 0.8 ? "🏆" : score / questions.length >= 0.5 ? "👍" : "💪"}
              </div>

              <div className="space-y-2">
                <p className="text-3xl font-extrabold text-[#1F2A44]">
                  {score}/{questions.length} correct
                </p>
                {score / questions.length >= 0.8 ? (
                  <p className="text-base font-semibold text-[#22C55E]">Excellent work! 🏆</p>
                ) : score / questions.length >= 0.5 ? (
                  <p className="text-base font-semibold text-[#F5AD2E]">
                    Good progress! A bit more practice will help.
                  </p>
                ) : (
                  <p className="text-base font-semibold text-[#F87171]">
                    Keep practicing! These topics need more work.
                  </p>
                )}
              </div>

              {score / questions.length < 0.5 && weakTopics.length > 0 && (
                <div className="space-y-2 w-full">
                  <p className="text-xs font-semibold text-[#9AA4BA] uppercase tracking-wider">
                    Keep working on
                  </p>
                  <div className="flex flex-wrap justify-center gap-2">
                    {weakTopics.map((topic) => (
                      <span
                        key={topic}
                        className="text-xs font-semibold rounded-full px-3 py-1 border"
                        style={{ backgroundColor: "#FFF8EC", color: "#F5AD2E", borderColor: "#FFE5A0" }}
                      >
                        {topic}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              <div className="flex gap-3">
                <button
                  onClick={generateQuestions}
                  className="rounded-2xl px-5 py-2.5 text-sm font-bold text-white transition-all hover:opacity-90 hover:-translate-y-0.5"
                  style={{ backgroundColor: meta.color }}
                >
                  Practice Again
                </button>
                <Link href="/tutor">
                  <button className="rounded-2xl px-5 py-2.5 text-sm font-bold border border-[#E8EDF8] text-[#6B7A9A] bg-[#F7FAFF] transition-all hover:bg-[#EEF3FF] hover:text-[#4F7CFF] hover:border-[#C7D7FF] hover:-translate-y-0.5">
                    Go to AI Tutor
                  </button>
                </Link>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* ── RIGHT: Cosmo helper ── */}
      <div className="w-[300px] flex-shrink-0 flex flex-col bg-white rounded-3xl border border-[#E8EDF8] shadow-card overflow-hidden">

        {/* Header */}
        <div className="px-4 py-4 border-b border-[#E8EDF8] flex-shrink-0">
          <div className="flex items-center gap-2.5 mb-1">
            <div className="h-9 w-9 rounded-2xl bg-gradient-blue flex items-center justify-center shadow-blue flex-shrink-0 overflow-hidden">
              <Image src="/cosmo-logo.png" alt="Cosmo" width={28} height={28} className="rounded-xl" />
            </div>
            <div>
              <p className="font-bold text-[#1F2A44] text-sm">Cosmo</p>
              <p className="text-[11px] text-[#9AA4BA]">Your study helper</p>
            </div>
            <div className="ml-auto flex items-center gap-1">
              <span className="h-2 w-2 rounded-full bg-[#22C55E] animate-pulse" />
              <span className="text-[10px] text-[#22C55E] font-medium">Ready</span>
            </div>
          </div>
        </div>

        {/* Content area */}
        <div className="flex-1 overflow-y-auto px-4 py-4 flex flex-col gap-3">

          {/* Idle / complete placeholder */}
          {(practiceState === "idle" || practiceState === "complete" || practiceState === "loading") && (
            <div className="flex flex-col items-center justify-center h-full text-center space-y-3 py-8">
              <div className="text-4xl">💪</div>
              <p className="text-sm text-[#9AA4BA] leading-relaxed">
                Start practicing and I&apos;ll help you when you get stuck!
              </p>
            </div>
          )}

          {/* Practice state: action buttons + response */}
          {practiceState === "practice" && currentQuestion && (
            <>
              {/* Hint buttons */}
              <div className="space-y-2 flex-shrink-0">
                {[
                  { label: "💡 Get a Hint", type: "hint" },
                  { label: "📖 Explain Answer", type: "explain", requiresSubmit: true },
                  { label: "🔢 Step by Step", type: "steps" },
                ].map(({ label, type, requiresSubmit }) => {
                  const disabled = cosmoLoading || (requiresSubmit && !submitted);
                  const isActive = cosmoLoading;
                  return (
                    <button
                      key={type}
                      disabled={disabled}
                      onClick={() => callCosmo(type)}
                      className="w-full rounded-2xl py-2.5 text-sm font-semibold border transition-all disabled:opacity-40 disabled:cursor-not-allowed"
                      style={{
                        backgroundColor: isActive ? "#EEF3FF" : "#F7FAFF",
                        borderColor: isActive ? "#C7D7FF" : "#E8EDF8",
                        color: isActive ? "#4F7CFF" : "#6B7A9A",
                      }}
                    >
                      {label}
                    </button>
                  );
                })}
              </div>

              {/* Cosmo response */}
              <div className="flex-1 overflow-y-auto">
                {cosmoLoading && !cosmoText && (
                  <div className="flex items-center gap-2 rounded-2xl bg-[#F7FAFF] border border-[#E8EDF8] px-4 py-3">
                    {[0, 1, 2].map((i) => (
                      <span
                        key={i}
                        className="h-2 w-2 rounded-full bg-[#4F7CFF] animate-bounce"
                        style={{ animationDelay: `${i * 0.15}s` }}
                      />
                    ))}
                  </div>
                )}
                {cosmoText && (
                  <div className="rounded-2xl bg-[#F7FAFF] border border-[#E8EDF8] p-4 text-sm text-[#1F2A44] leading-relaxed">
                    {cosmoText}
                  </div>
                )}
                <div ref={cosmoEndRef} />
              </div>
            </>
          )}
        </div>

        {/* Divider + Ask Cosmo input */}
        {practiceState === "practice" && (
          <div className="flex-shrink-0 border-t border-[#E8EDF8] px-4 py-3">
            <p className="text-[10px] font-semibold text-[#9AA4BA] uppercase tracking-wider mb-2">
              Ask Cosmo
            </p>
            <div className="flex items-end gap-2 bg-[#F7FAFF] border border-[#E8EDF8] rounded-2xl px-3 py-2 focus-within:border-[#4F7CFF]/40 transition-colors">
              <textarea
                value={cosmoInput}
                onChange={(e) => setCosmoInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && !e.shiftKey) {
                    e.preventDefault();
                    handleCosmoSend();
                  }
                }}
                placeholder="Ask Cosmo anything..."
                rows={1}
                disabled={cosmoLoading}
                className="flex-1 bg-transparent resize-none text-sm text-[#1F2A44] placeholder:text-[#C4CDE0] outline-none min-h-[24px] max-h-[80px] py-1 disabled:opacity-50"
                style={{ scrollbarWidth: "none" }}
              />
              <button
                onClick={handleCosmoSend}
                disabled={!cosmoInput.trim() || cosmoLoading}
                className="h-8 w-8 rounded-xl bg-[#4F7CFF] flex items-center justify-center shadow-blue hover:opacity-90 transition-all disabled:opacity-40 disabled:cursor-not-allowed flex-shrink-0"
              >
                {cosmoLoading ? (
                  <Loader2 className="h-3.5 w-3.5 text-white animate-spin" />
                ) : (
                  <Send className="h-3.5 w-3.5 text-white" />
                )}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
