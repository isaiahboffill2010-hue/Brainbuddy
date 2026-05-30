import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/types/database";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type Client = SupabaseClient<Database, "public", any>;

export type JoinedClassSummary = {
  id: string;
  className: string;
  classCode: string;
  subjectId: string | null;
  subjectName: string | null;
  subjectIcon: string | null;
  subjectColor: string | null;
  gradeLevel: string | null;
  period: string | null;
  currentUnit: string | null;
  learningGoal: string | null;
  brainbuddyInstructions: string | null;
  joinedAt?: string | null;
};

export type TeacherClassWithStudents = JoinedClassSummary & {
  createdAt: string;
  studentCount: number;
  students: {
    id: string;
    name: string;
    grade: string;
    avatarEmoji: string;
    avatarUrl: string | null;
    joinedAt: string | null;
  }[];
};

type RawSubject = { name?: string | null; icon?: string | null; color?: string | null } | null;
type RawClass = {
  id: string;
  class_name: string;
  class_code: string;
  subject_id: string | null;
  grade_level: string | null;
  period: string | null;
  current_unit: string | null;
  learning_goal: string | null;
  brainbuddy_instructions: string | null;
  created_at?: string;
  subjects?: RawSubject;
};

function shapeClass(raw: RawClass, joinedAt?: string | null): JoinedClassSummary {
  return {
    id: raw.id,
    className: raw.class_name,
    classCode: raw.class_code,
    subjectId: raw.subject_id,
    subjectName: raw.subjects?.name ?? null,
    subjectIcon: raw.subjects?.icon ?? null,
    subjectColor: raw.subjects?.color ?? null,
    gradeLevel: raw.grade_level,
    period: raw.period,
    currentUnit: raw.current_unit,
    learningGoal: raw.learning_goal,
    brainbuddyInstructions: raw.brainbuddy_instructions,
    joinedAt,
  };
}

export async function getPrimaryStudentIdForProfile(client: Client, profileId: string) {
  const { data: linkedRows } = await client
    .from("parents_students")
    .select("student_id")
    .eq("parent_id", profileId)
    .limit(1);

  const linkedStudentId = (linkedRows as { student_id: string }[] | null)?.[0]?.student_id;
  if (linkedStudentId) return linkedStudentId;

  const { data: student } = await client
    .from("students")
    .select("id")
    .eq("profile_id", profileId)
    .maybeSingle();

  return (student as { id: string } | null)?.id ?? null;
}

export async function getJoinedClassesForStudent(
  client: Client,
  studentId: string
): Promise<JoinedClassSummary[]> {
  const { data, error } = await client
    .from("class_enrollments")
    .select(
      "joined_at, teacher_classes(id, class_name, class_code, subject_id, grade_level, period, current_unit, learning_goal, brainbuddy_instructions, subjects(name, icon, color))"
    )
    .eq("student_id", studentId)
    .order("joined_at", { ascending: false });

  if (error) throw error;

  return ((data ?? []) as unknown as { joined_at: string | null; teacher_classes: RawClass | null }[])
    .map((row) => (row.teacher_classes ? shapeClass(row.teacher_classes, row.joined_at) : null))
    .filter(Boolean) as JoinedClassSummary[];
}

export async function getClassContextForStudent(
  client: Client,
  studentId: string,
  subjectId?: string
): Promise<JoinedClassSummary | null> {
  const classes = await getJoinedClassesForStudent(client, studentId).catch(() => []);
  if (!classes.length) return null;

  if (subjectId) {
    const subjectMatch = classes.find((item) => item.subjectId === subjectId);
    if (subjectMatch) return subjectMatch;
  }

  return classes[0] ?? null;
}

export async function getTeacherClassesWithStudents(
  client: Client,
  teacherProfileId: string
): Promise<TeacherClassWithStudents[]> {
  const { data: classRows, error } = await client
    .from("teacher_classes")
    .select("*, subjects(name, icon, color)")
    .eq("teacher_profile_id", teacherProfileId)
    .order("created_at", { ascending: false });

  if (error) throw error;

  const classes = ((classRows ?? []) as unknown as RawClass[]).map((row) => ({
    ...shapeClass(row),
    createdAt: row.created_at ?? "",
    studentCount: 0,
    students: [],
  })) as TeacherClassWithStudents[];

  if (!classes.length) return classes;

  const classIds = classes.map((item) => item.id);
  const { data: enrollmentRows } = await client
    .from("class_enrollments")
    .select("class_id, joined_at, students(id, name, grade, avatar_emoji, avatar_url)")
    .in("class_id", classIds)
    .order("joined_at", { ascending: false });

  const byClass = new Map(classes.map((item) => [item.id, item]));

  for (const row of (enrollmentRows ?? []) as unknown as {
    class_id: string;
    joined_at: string | null;
    students: {
      id: string;
      name: string;
      grade: string;
      avatar_emoji: string;
      avatar_url: string | null;
    } | null;
  }[]) {
    const target = byClass.get(row.class_id);
    if (!target || !row.students) continue;

    target.students.push({
      id: row.students.id,
      name: row.students.name,
      grade: row.students.grade,
      avatarEmoji: row.students.avatar_emoji,
      avatarUrl: row.students.avatar_url,
      joinedAt: row.joined_at,
    });
    target.studentCount = target.students.length;
  }

  return classes;
}
