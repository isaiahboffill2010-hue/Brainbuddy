import Link from "next/link";
import Image from "next/image";
import type { Student } from "@/types/app";
import { formatRelativeTime } from "@/lib/utils/format";
import { ArrowRight } from "lucide-react";

interface StudentCardProps {
  student: Student;
  lastActivity?: string | null;
  subjectCount?: number;
}

export function StudentCard({ student, lastActivity, subjectCount = 0 }: StudentCardProps) {
  return (
    <Link href={`/students/${student.id}`}>
      <div className="glass-bright rounded-2xl border border-white/5 p-5 hover:border-primary/30 hover:shadow-card-hover transition-all cursor-pointer group">
        <div className="flex items-start gap-4">
          {/* Avatar */}
          <div className="flex-shrink-0 h-14 w-14 rounded-2xl overflow-hidden bg-gradient-to-br from-primary/20 to-accent/20 border border-primary/20 flex items-center justify-center text-3xl shadow-glow-sm">
            {student.avatar_url ? (
              <Image src={student.avatar_url} alt={student.name} width={56} height={56} className="object-cover w-full h-full" />
            ) : (
              student.avatar_emoji
            )}
          </div>

          <div className="flex-1 min-w-0">
            <div className="flex items-center justify-between gap-2">
              <h3 className="font-semibold truncate group-hover:text-primary transition-colors">
                {student.name}
              </h3>
              <span className="flex-shrink-0 text-xs bg-primary/10 text-primary border border-primary/20 rounded-full px-2.5 py-0.5 font-medium">
                {student.grade}
              </span>
            </div>

            <p className="text-sm text-muted-foreground mt-0.5">Age {student.age}</p>

            <div className="flex items-center gap-3 mt-2 text-xs text-muted-foreground">
              <span>📚 {subjectCount} subjects</span>
              {lastActivity && <span>🕐 {formatRelativeTime(lastActivity)}</span>}
            </div>

            <div className="flex items-center justify-between mt-3">
              <span className="text-xs text-muted-foreground capitalize bg-white/5 rounded-full px-2.5 py-0.5">
                {student.learning_style} learner
              </span>
              <ArrowRight className="h-3.5 w-3.5 text-muted-foreground/40 group-hover:text-primary group-hover:translate-x-0.5 transition-all" />
            </div>
          </div>
        </div>
      </div>
    </Link>
  );
}
