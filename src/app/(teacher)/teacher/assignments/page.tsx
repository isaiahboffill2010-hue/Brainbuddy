import { redirect } from "next/navigation";
import { AlertTriangle, ClipboardList, Users } from "lucide-react";
import { createClient, createServiceClient } from "@/lib/supabase/server";
import { TeacherAssignmentDeleteButton } from "@/components/teacher/TeacherAssignmentDeleteButton";

type ClassRow = { class_name: string | null; period: string | null };
type RawClass = ClassRow | ClassRow[] | null;

type RawAssignment = {
  id: string;
  class_id: string;
  title: string;
  total_points: number;
  status: string;
  due_date: string | null;
  created_at: string;
  teacher_classes: RawClass;
};

type StudentRow = { name: string | null; grade: string | null };
type RawStudent = StudentRow | StudentRow[] | null;

type RawStudentResult = {
  id: string;
  assignment_id: string;
  status: string;
  score: number;
  percentage: number;
  total_correct: number;
  total_questions: number;
  missed_questions: unknown;
  ai_summary: string | null;
  students: RawStudent;
};

type MissedQuestion = {
  question?: string;
  reason?: string;
  correctAnswer?: string;
};

function isMissingAssignmentSchema(error: { code?: string; message?: string }) {
  const message = error.message ?? "";
  return error.code === "PGRST205" || message.includes("schema cache") || message.includes("Could not find the table");
}

function firstJoined<T>(value: T | T[] | null): T | null {
  if (Array.isArray(value)) return value[0] ?? null;
  return value;
}

function classLabel(value: RawClass) {
  const classRow = firstJoined(value);
  return classRow?.period || classRow?.class_name || "Class";
}

function studentLabel(value: RawStudent) {
  const student = firstJoined(value);
  return {
    name: student?.name || "Student",
    grade: student?.grade || "",
  };
}

function missedQuestions(value: unknown): MissedQuestion[] {
  return Array.isArray(value) ? (value as MissedQuestion[]) : [];
}

export default async function TeacherAssignmentsPage() {
  const supabase = await createClient();
  const service = createServiceClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/teacher/login");

  const { data: profileData } = await service
    .from("profiles")
    .select("id, role")
    .eq("user_id", user.id)
    .maybeSingle();

  const profile = profileData as { id: string; role: string } | null;
  if (profile?.role !== "teacher") redirect("/dashboard");

  const { data: assignmentRows, error: assignmentError } = await service
    .from("assignments")
    .select("id, class_id, title, total_points, status, due_date, created_at, teacher_classes(class_name, period)")
    .eq("teacher_id", profile.id)
    .order("created_at", { ascending: false });

  if (assignmentError) {
    const setupMessage = isMissingAssignmentSchema(assignmentError)
      ? "Assignment tables need to be set up in Supabase before reports can appear."
      : assignmentError.message;

    return (
      <div className="space-y-6 pb-10 animate-fade-in">
        <Header assignmentCount={0} studentCount={0} />
        <div className="rounded-3xl border border-amber-400/20 bg-amber-400/10 p-5 text-amber-100">
          <div className="flex items-center gap-3">
            <AlertTriangle className="h-5 w-5" />
            <p className="font-semibold">{setupMessage}</p>
          </div>
        </div>
      </div>
    );
  }

  const assignments = (assignmentRows ?? []) as unknown as RawAssignment[];
  const assignmentIds = assignments.map((assignment) => assignment.id);

  let results: RawStudentResult[] = [];
  if (assignmentIds.length > 0) {
    const { data: resultRows, error: resultError } = await service
      .from("student_assignments")
      .select("id, assignment_id, status, score, percentage, total_correct, total_questions, missed_questions, ai_summary, students(name, grade)")
      .in("assignment_id", assignmentIds);

    if (!resultError) {
      results = (resultRows ?? []) as unknown as RawStudentResult[];
    }
  }

  const resultsByAssignment = new Map<string, RawStudentResult[]>();
  for (const result of results) {
    const existing = resultsByAssignment.get(result.assignment_id) ?? [];
    existing.push(result);
    resultsByAssignment.set(result.assignment_id, existing);
  }

  return (
    <div className="space-y-6 pb-10 animate-fade-in">
      <Header assignmentCount={assignments.length} studentCount={results.length} />

      {assignments.length === 0 ? (
        <div className="rounded-3xl border border-dashed border-white/10 bg-[#1E293B]/80 p-8 text-center">
          <ClipboardList className="mx-auto h-10 w-10 text-indigo-300" />
          <p className="mt-3 font-semibold text-white">No assignments yet</p>
          <p className="mt-1 text-sm text-slate-400">Use Add Assignment on a class to create the first one.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {assignments.map((assignment) => {
            const studentResults = resultsByAssignment.get(assignment.id) ?? [];

            return (
              <section key={assignment.id} className="rounded-3xl border border-white/10 bg-[#1E293B]/80 p-5 shadow-2xl">
                <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-[0.18em] text-cyan-300">{classLabel(assignment.teacher_classes)}</p>
                    <h2 className="mt-1 text-xl font-extrabold text-white">{assignment.title}</h2>
                    <p className="mt-1 text-sm text-slate-400">
                      {assignment.total_points} total points
                      {assignment.due_date ? ` - Due ${assignment.due_date}` : ""}
                    </p>
                  </div>
                  <div className="flex flex-wrap items-center gap-2 md:justify-end">
                    <span className="w-fit rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs font-semibold text-slate-200">
                      {assignment.status}
                    </span>
                    <TeacherAssignmentDeleteButton assignmentId={assignment.id} assignmentTitle={assignment.title} />
                  </div>
                </div>

                <div className="mt-4 space-y-3">
                  {studentResults.length === 0 ? (
                    <p className="rounded-2xl border border-dashed border-white/10 bg-white/5 p-4 text-sm text-slate-400">
                      No student results yet.
                    </p>
                  ) : (
                    studentResults.map((result) => {
                      const student = studentLabel(result.students);
                      const missed = missedQuestions(result.missed_questions);

                      return (
                        <article key={result.id} className="rounded-2xl border border-white/10 bg-[#0B1220] p-4">
                          <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
                            <div>
                              <p className="font-bold text-white">{student.name}</p>
                              <p className="text-xs text-slate-400">{student.grade || "Student"} - {result.status}</p>
                            </div>
                            <div className="text-left md:text-right">
                              <p className="text-lg font-extrabold text-white">
                                {result.score}/{assignment.total_points}
                              </p>
                              <p className="text-xs text-slate-400">
                                {result.total_correct}/{result.total_questions} correct - {Math.round(result.percentage)}%
                              </p>
                            </div>
                          </div>

                          {result.ai_summary && (
                            <p className="mt-3 rounded-xl bg-white/5 p-3 text-sm text-slate-200">{result.ai_summary}</p>
                          )}

                          <div className="mt-3">
                            <p className="text-xs font-bold uppercase tracking-[0.16em] text-slate-400">Got wrong</p>
                            {missed.length === 0 ? (
                              <p className="mt-2 text-sm text-slate-400">No missed questions recorded yet.</p>
                            ) : (
                              <div className="mt-2 grid gap-2 md:grid-cols-2">
                                {missed.map((item, index) => (
                                  <div key={`${item.question ?? "question"}-${index}`} className="rounded-xl border border-red-400/10 bg-red-400/5 p-3">
                                    <p className="text-sm font-semibold text-red-100">Question {item.question || index + 1}</p>
                                    {item.reason && <p className="mt-1 text-xs text-red-100/80">{item.reason}</p>}
                                    {item.correctAnswer && <p className="mt-1 text-xs text-slate-300">Correct: {item.correctAnswer}</p>}
                                  </div>
                                ))}
                              </div>
                            )}
                          </div>
                        </article>
                      );
                    })
                  )}
                </div>
              </section>
            );
          })}
        </div>
      )}
    </div>
  );
}

function Header({ assignmentCount, studentCount }: { assignmentCount: number; studentCount: number }) {
  return (
    <>
      <div className="rounded-3xl bg-gradient-to-r from-indigo-600/20 via-purple-600/20 to-cyan-600/20 border border-white/10 p-6 md:p-8 shadow-2xl">
        <p className="text-sm text-slate-300">Teacher reports</p>
        <h1 className="mt-1 text-2xl md:text-3xl font-extrabold text-white">Assignments</h1>
        <p className="mt-2 max-w-2xl text-sm text-slate-300">
          Review assigned work, scores, and the questions students missed.
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        {[
          { label: "Assignments", value: assignmentCount, icon: ClipboardList },
          { label: "Student reports", value: studentCount, icon: Users },
        ].map((stat) => (
          <div key={stat.label} className="rounded-3xl border border-white/10 bg-[#1E293B]/80 p-5 shadow-2xl">
            <div className="h-10 w-10 rounded-2xl bg-gradient-to-r from-indigo-500 to-purple-500 flex items-center justify-center mb-3">
              <stat.icon className="h-5 w-5 text-white" />
            </div>
            <p className="text-3xl font-extrabold text-white">{stat.value}</p>
            <p className="text-sm text-slate-400">{stat.label}</p>
          </div>
        ))}
      </div>
    </>
  );
}
