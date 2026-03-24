import { notFound, redirect } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { getStudent } from "@/lib/supabase/queries/students";
import { getProgressForStudent } from "@/lib/supabase/queries/progress";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { SubjectIcon } from "@/components/shared/subject-icon";
import { ArrowLeft } from "lucide-react";

export default async function StudentProgressPage({
  params,
}: {
  params: Promise<{ studentId: string }>;
}) {
  const { studentId } = await params;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const student = await getStudent(supabase, studentId).catch(() => null);
  if (!student) notFound();

  const progress = await getProgressForStudent(supabase, studentId);

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <Link href={`/students/${studentId}`}>
          <Button variant="ghost" size="icon"><ArrowLeft className="h-4 w-4" /></Button>
        </Link>
        <div>
          <h1 className="text-2xl font-bold">{student.name}&apos;s Progress</h1>
          <p className="text-muted-foreground text-sm">Detailed subject breakdown</p>
        </div>
      </div>

      <div className="grid gap-4">
        {progress.map((p) => {
          const subject = (p as typeof p & { subjects: { name: string; icon: string; color: string } | null }).subjects;
          const pct = Math.min(100, ((p.level - 1) / 9) * 100);
          return (
            <Card key={p.id}>
              <CardHeader className="pb-3">
                <CardTitle className="flex items-center gap-3 text-base">
                  {subject && <SubjectIcon icon={subject.icon} color={subject.color} size="sm" />}
                  <span>{subject?.name}</span>
                  <Badge variant="outline" className="ml-auto">Level {p.level}</Badge>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <Progress value={pct} className="h-3" />
                <div className="grid grid-cols-3 gap-3 text-center text-sm">
                  <div>
                    <div className="font-bold text-lg">{p.session_count}</div>
                    <div className="text-muted-foreground text-xs">Sessions</div>
                  </div>
                  <div>
                    <div className="font-bold text-lg text-emerald-600">{p.topics_mastered.length}</div>
                    <div className="text-muted-foreground text-xs">Mastered</div>
                  </div>
                  <div>
                    <div className="font-bold text-lg text-amber-600">{p.topics_struggling.length}</div>
                    <div className="text-muted-foreground text-xs">Working on</div>
                  </div>
                </div>
                {p.topics_mastered.length > 0 && (
                  <div>
                    <p className="text-xs font-semibold text-emerald-600 mb-2">✅ Mastered topics</p>
                    <div className="flex flex-wrap gap-1.5">
                      {p.topics_mastered.map((t) => (
                        <span key={t} className="text-xs bg-emerald-50 border border-emerald-200 text-emerald-700 rounded-full px-2.5 py-0.5">
                          {t}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
                {p.topics_struggling.length > 0 && (
                  <div>
                    <p className="text-xs font-semibold text-amber-600 mb-2">📚 Still learning</p>
                    <div className="flex flex-wrap gap-1.5">
                      {p.topics_struggling.map((t) => (
                        <span key={t} className="text-xs bg-amber-50 border border-amber-200 text-amber-700 rounded-full px-2.5 py-0.5">
                          {t}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
