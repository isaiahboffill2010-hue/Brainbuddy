import { notFound, redirect } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { getStudent } from "@/lib/supabase/queries/students";
import { getProgressForStudent } from "@/lib/supabase/queries/progress";
import { getSessionsForStudent } from "@/lib/supabase/queries/sessions";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { SubjectIcon } from "@/components/shared/subject-icon";
import { Progress } from "@/components/ui/progress";
import { formatRelativeTime } from "@/lib/utils/format";
import { Settings, ArrowRight } from "lucide-react";

export default async function StudentDetailPage({
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

  const [progress, sessions] = await Promise.all([
    getProgressForStudent(supabase, studentId),
    getSessionsForStudent(supabase, studentId),
  ]);

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-4">
          <div className="h-16 w-16 rounded-2xl bg-gradient-to-br from-violet-100 to-indigo-100 flex items-center justify-center text-4xl border border-violet-200/50">
            {student.avatar_emoji}
          </div>
          <div>
            <h1 className="text-3xl font-bold">{student.name}</h1>
            <div className="flex items-center gap-2 mt-1">
              <Badge variant="secondary">{student.grade}</Badge>
              <span className="text-muted-foreground text-sm">Age {student.age}</span>
              <span className="text-muted-foreground text-sm">·</span>
              <span className="text-muted-foreground text-sm capitalize">{student.learning_style} learner</span>
            </div>
          </div>
        </div>
        <Link href={`/students/${studentId}/settings`}>
          <Button variant="outline" size="sm" className="gap-2">
            <Settings className="h-4 w-4" />
            Edit Profile
          </Button>
        </Link>
      </div>

      {/* Progress by subject */}
      <div>
        <h2 className="text-xl font-semibold mb-4">Subject Progress</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {progress.map((p) => {
            const subject = (p as typeof p & { subjects: { name: string; icon: string; color: string } | null }).subjects;
            const pct = Math.min(100, ((p.level - 1) / 9) * 100);
            return (
              <Card key={p.id}>
                <CardContent className="p-5">
                  <div className="flex items-center gap-3 mb-3">
                    {subject && (
                      <SubjectIcon icon={subject.icon} color={subject.color} size="sm" />
                    )}
                    <div className="flex-1">
                      <div className="flex items-center justify-between">
                        <span className="font-medium">{subject?.name ?? "Subject"}</span>
                        <span className="text-sm text-muted-foreground">Level {p.level}</span>
                      </div>
                    </div>
                  </div>
                  <Progress value={pct} className="h-2 mb-2" />
                  <div className="flex gap-4 text-xs text-muted-foreground">
                    <span>✅ {p.topics_mastered.length} mastered</span>
                    <span>📈 {p.session_count} sessions</span>
                    {p.last_session_at && (
                      <span>🕐 {formatRelativeTime(p.last_session_at)}</span>
                    )}
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      </div>

      {/* Recent sessions */}
      <div>
        <h2 className="text-xl font-semibold mb-4">Recent Sessions</h2>
        {sessions.length === 0 ? (
          <p className="text-muted-foreground text-sm">No sessions yet.</p>
        ) : (
          <div className="space-y-2">
            {sessions.slice(0, 5).map((session) => {
              const subject = (session as typeof session & { subjects: { name: string; icon: string; color: string } | null }).subjects;
              return (
                <Card key={session.id}>
                  <CardContent className="p-4 flex items-center gap-3">
                    <span className="text-xl">{subject?.icon ?? "💬"}</span>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-sm truncate">{session.title ?? "Chat Session"}</p>
                      <p className="text-xs text-muted-foreground">{formatRelativeTime(session.created_at)}</p>
                    </div>
                    {session.learning_notes && (
                      <Badge variant="outline" className="text-xs flex-shrink-0">Has notes</Badge>
                    )}
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
