import { redirect } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { getProfile } from "@/lib/supabase/queries/profiles";
import { getStudentsForParent } from "@/lib/supabase/queries/students";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { LEARNING_STYLES } from "@/types/app";

export default async function StudentProfilePage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const profile = await getProfile(supabase, user.id);
  const students = await getStudentsForParent(supabase, profile.id);
  const student = (students as NonNullable<typeof students[number]>[])[0];

  if (!student) {
    return (
      <div className="text-center py-12 space-y-4">
        <div className="text-6xl">🧒</div>
        <p className="text-muted-foreground">No student profile found.</p>
        <Link href="/students/new">
          <Button>Create Profile</Button>
        </Link>
      </div>
    );
  }

  const styleInfo = LEARNING_STYLES.find((s) => s.value === student.learning_style);

  return (
    <div className="space-y-6">
      {/* Avatar hero */}
      <div className="text-center space-y-3 py-6">
        <div className="inline-flex h-24 w-24 items-center justify-center rounded-3xl bg-gradient-to-br from-violet-100 to-indigo-100 text-6xl border-2 border-violet-200/50 mx-auto">
          {student.avatar_emoji}
        </div>
        <div>
          <h1 className="text-2xl font-bold">{student.name}</h1>
          <div className="flex items-center justify-center gap-2 mt-1">
            <Badge variant="secondary">{student.grade}</Badge>
            <span className="text-muted-foreground text-sm">Age {student.age}</span>
          </div>
        </div>
      </div>

      {/* Stats */}
      <Card>
        <CardContent className="p-4 space-y-3">
          <h2 className="font-semibold">Learning Style</h2>
          <div className="flex items-center gap-3 p-3 bg-muted rounded-xl">
            <span className="text-3xl">{styleInfo?.emoji}</span>
            <div>
              <div className="font-medium">{styleInfo?.label} Learner</div>
              <div className="text-sm text-muted-foreground">{styleInfo?.description}</div>
            </div>
          </div>

          <div className="flex items-center justify-between py-2 border-t">
            <span className="text-sm text-muted-foreground">Confidence Level</span>
            <div className="flex items-center gap-2">
              <div className="flex gap-0.5">
                {Array.from({ length: 10 }).map((_, i) => (
                  <div
                    key={i}
                    className={`h-3 w-2 rounded-sm ${
                      i < student.confidence_level
                        ? "bg-primary"
                        : "bg-muted-foreground/20"
                    }`}
                  />
                ))}
              </div>
              <span className="text-sm font-medium">{student.confidence_level}/10</span>
            </div>
          </div>
        </CardContent>
      </Card>

      <Link href={`/students/${student.id}/settings`}>
        <Button variant="outline" className="w-full">Edit Profile</Button>
      </Link>
    </div>
  );
}
