-- ============================================================
-- Kids AI Tutor — Full Supabase Schema
-- Run this entire file in the Supabase SQL Editor
-- ============================================================

-- ─────────────────────────────────────────────
-- 1. PROFILES
-- One row per auth.users entry. Stores role.
-- ─────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS profiles (
  id                     UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id                UUID NOT NULL UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
  role                   TEXT NOT NULL CHECK (role IN ('parent', 'student', 'teacher')),
  full_name              TEXT,
  email                  TEXT,
  avatar_url             TEXT,
  plan                   TEXT NOT NULL DEFAULT 'free' CHECK (plan IN ('free', 'premium')),
  subscription_status    TEXT NOT NULL DEFAULT 'trial' CHECK (subscription_status IN ('trial', 'active', 'past_due', 'canceled', 'none')),
  messages_used          INT NOT NULL DEFAULT 0,
  snips_used             INT NOT NULL DEFAULT 0,
  quizzes_used           INT NOT NULL DEFAULT 0,
  message_limit          INT NOT NULL DEFAULT 15,
  snip_limit             INT NOT NULL DEFAULT 1,
  quiz_limit             INT NOT NULL DEFAULT 1,
  stripe_customer_id     TEXT,
  stripe_subscription_id TEXT,
  created_at             TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at             TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Auto-create profile on sign-up
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  INSERT INTO public.profiles (user_id, role, full_name, email)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'role', 'parent'),
    COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.email),
    NEW.email
  );
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION handle_new_user();

-- ─────────────────────────────────────────────
-- 2. SUBJECTS
-- Seeded, not user-created
-- ─────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS subjects (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name       TEXT NOT NULL UNIQUE,
  icon       TEXT NOT NULL,
  color      TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

INSERT INTO subjects (name, icon, color) VALUES
  ('Math',    '🔢', '#6366f1'),
  ('Reading', '📚', '#ec4899'),
  ('Science', '🔬', '#10b981'),
  ('Writing', '✏️', '#f59e0b'),
  ('History', '📜', '#f97316')
ON CONFLICT (name) DO NOTHING;

-- ─────────────────────────────────────────────
-- 3. STUDENTS
-- Created by parents. Linked via parents_students.
-- ─────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS students (
  id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  profile_id       UUID REFERENCES profiles(id) ON DELETE SET NULL,
  name             TEXT NOT NULL,
  age              INT CHECK (age BETWEEN 4 AND 18),
  grade            TEXT NOT NULL,
  avatar_emoji     TEXT NOT NULL DEFAULT '🦊',
  -- Allow either a single style or a comma-separated list of allowed styles
  learning_style   TEXT NOT NULL DEFAULT 'visual' CHECK (
    learning_style ~ '^(visual|auditory|kinesthetic|reading)(,(visual|auditory|kinesthetic|reading))*$'
  ),
  confidence_level INT NOT NULL DEFAULT 5 CHECK (confidence_level BETWEEN 1 AND 10),
  stuck_behavior   TEXT,
  confusion_support TEXT,
  error_feedback   TEXT,
  teaching_pace    TEXT,
  motivation       TEXT,
  teaching_avoid   TEXT,
  created_at       TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at       TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ─────────────────────────────────────────────
-- 4. PARENTS_STUDENTS  (join table)
-- ─────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS parents_students (
  parent_id  UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  student_id UUID NOT NULL REFERENCES students(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  PRIMARY KEY (parent_id, student_id)
);

-- ─────────────────────────────────────────────
-- 5. LEARNING_PREFERENCES
-- Per-student preferences, editable by parent
-- ─────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS learning_preferences (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id      UUID NOT NULL UNIQUE REFERENCES students(id) ON DELETE CASCADE,
  preferred_style TEXT NOT NULL DEFAULT 'visual',
  pace            TEXT NOT NULL DEFAULT 'normal' CHECK (pace IN ('slow','normal','fast')),
  language        TEXT NOT NULL DEFAULT 'en',
  notes           TEXT,
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ─────────────────────────────────────────────
-- 6. HOMEWORK_UPLOADS
-- ─────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS homework_uploads (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id    UUID NOT NULL REFERENCES students(id) ON DELETE CASCADE,
  subject_id    UUID REFERENCES subjects(id),
  image_url     TEXT,
  question_text TEXT,
  status        TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending','processed','error')),
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ─────────────────────────────────────────────
-- 7. AI_SESSIONS
-- One session per subject conversation
-- ─────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS ai_sessions (
  id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id       UUID NOT NULL REFERENCES students(id) ON DELETE CASCADE,
  subject_id       UUID REFERENCES subjects(id),
  title            TEXT,
  session_summary  TEXT,
  learning_notes   TEXT,
  is_active        BOOLEAN NOT NULL DEFAULT TRUE,
  created_at       TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at       TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ─────────────────────────────────────────────
-- 8. AI_MESSAGES
-- ─────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS ai_messages (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id        UUID NOT NULL REFERENCES ai_sessions(id) ON DELETE CASCADE,
  role              TEXT NOT NULL CHECK (role IN ('user','assistant')),
  content           TEXT NOT NULL,
  image_url         TEXT,
  worked_example    JSONB,
  explanation_style TEXT,
  was_helpful       BOOLEAN,
  created_at        TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ─────────────────────────────────────────────
-- 9. STUDENT_NOTES
-- Study notes auto-generated by the tutor after each chat exchange,
-- plus notes the student writes themselves from the My Notes page.
-- ─────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS student_notes (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id  UUID NOT NULL REFERENCES students(id) ON DELETE CASCADE,
  session_id  UUID REFERENCES ai_sessions(id) ON DELETE SET NULL,
  subject     TEXT,
  topic       TEXT,
  note        TEXT NOT NULL,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS student_notes_student_id_idx ON student_notes(student_id);
CREATE INDEX IF NOT EXISTS student_notes_session_id_idx ON student_notes(session_id);

-- ─────────────────────────────────────────────
-- 10. STUDENT_SUBJECT_PROGRESS
-- ─────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS student_subject_progress (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id        UUID NOT NULL REFERENCES students(id) ON DELETE CASCADE,
  subject_id        UUID NOT NULL REFERENCES subjects(id) ON DELETE CASCADE,
  level             INT NOT NULL DEFAULT 1 CHECK (level BETWEEN 1 AND 10),
  topics_mastered   TEXT[] NOT NULL DEFAULT '{}',
  topics_struggling TEXT[] NOT NULL DEFAULT '{}',
  session_count     INT NOT NULL DEFAULT 0,
  last_session_at   TIMESTAMPTZ,
  streak_days       INT NOT NULL DEFAULT 0,
  updated_at        TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (student_id, subject_id)
);

-- ─────────────────────────────────────────────
-- ROW LEVEL SECURITY
-- ─────────────────────────────────────────────

-- Helper function: is this student_id linked to the current user?
CREATE OR REPLACE FUNCTION is_my_student(p_student_id UUID)
RETURNS BOOLEAN LANGUAGE sql SECURITY DEFINER STABLE AS $$
  SELECT EXISTS (
    SELECT 1 FROM parents_students ps
    JOIN profiles p ON p.id = ps.parent_id
    WHERE ps.student_id = p_student_id
      AND p.user_id = auth.uid()
  )
  OR EXISTS (
    SELECT 1 FROM students s
    JOIN profiles p ON p.id = s.profile_id
    WHERE s.id = p_student_id
      AND p.user_id = auth.uid()
  );
$$;

-- PROFILES
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "profiles: owner read"   ON profiles FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "profiles: owner insert" ON profiles FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "profiles: owner update" ON profiles FOR UPDATE USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- SUBJECTS (public read)
ALTER TABLE subjects ENABLE ROW LEVEL SECURITY;
CREATE POLICY "subjects: public read" ON subjects FOR SELECT USING (true);

-- STUDENTS
ALTER TABLE students ENABLE ROW LEVEL SECURITY;

CREATE POLICY "students: parent read" ON students FOR SELECT
  USING (is_my_student(id));

CREATE POLICY "students: parent insert" ON students FOR INSERT
  WITH CHECK (
    profile_id IN (SELECT id FROM profiles WHERE user_id = auth.uid())
  );

CREATE POLICY "students: parent update" ON students FOR UPDATE
  USING (is_my_student(id))
  WITH CHECK (is_my_student(id));

CREATE POLICY "students: parent delete" ON students FOR DELETE
  USING (
    profile_id IN (SELECT id FROM profiles WHERE user_id = auth.uid())
  );

-- PARENTS_STUDENTS
ALTER TABLE parents_students ENABLE ROW LEVEL SECURITY;

CREATE POLICY "parents_students: parent manage" ON parents_students FOR ALL
  USING (parent_id IN (SELECT id FROM profiles WHERE user_id = auth.uid()))
  WITH CHECK (parent_id IN (SELECT id FROM profiles WHERE user_id = auth.uid()));

-- LEARNING_PREFERENCES
ALTER TABLE learning_preferences ENABLE ROW LEVEL SECURITY;

CREATE POLICY "learning_prefs: student or parent read" ON learning_preferences FOR SELECT
  USING (is_my_student(student_id));

CREATE POLICY "learning_prefs: service role only write" ON learning_preferences FOR INSERT
  WITH CHECK (false);

CREATE POLICY "learning_prefs: service role only update" ON learning_preferences FOR UPDATE
  USING (false);

-- HOMEWORK_UPLOADS
ALTER TABLE homework_uploads ENABLE ROW LEVEL SECURITY;

CREATE POLICY "uploads: student or parent read" ON homework_uploads FOR SELECT
  USING (is_my_student(student_id));

CREATE POLICY "uploads: service role only write" ON homework_uploads FOR INSERT
  WITH CHECK (false);

-- AI_SESSIONS
ALTER TABLE ai_sessions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "sessions: student or parent read" ON ai_sessions FOR SELECT
  USING (is_my_student(student_id));

CREATE POLICY "sessions: service role only write" ON ai_sessions FOR INSERT
  WITH CHECK (false);

CREATE POLICY "sessions: service role only update" ON ai_sessions FOR UPDATE
  USING (false);

-- AI_MESSAGES
ALTER TABLE ai_messages ENABLE ROW LEVEL SECURITY;

CREATE POLICY "messages: session owner read" ON ai_messages FOR SELECT
  USING (
    session_id IN (
      SELECT id FROM ai_sessions WHERE is_my_student(student_id)
    )
  );

CREATE POLICY "messages: service role only write" ON ai_messages FOR INSERT
  WITH CHECK (false);

-- STUDENT_SUBJECT_PROGRESS
ALTER TABLE student_subject_progress ENABLE ROW LEVEL SECURITY;

CREATE POLICY "progress: student or parent read" ON student_subject_progress FOR SELECT
  USING (is_my_student(student_id));

CREATE POLICY "progress: service role only write" ON student_subject_progress FOR INSERT
  WITH CHECK (false);

CREATE POLICY "progress: service role only update" ON student_subject_progress FOR UPDATE
  USING (false);

-- QUIZ QUESTION ATTEMPTS
-- Real submitted quiz answers. Mastery is calculated from these rows only.
CREATE TABLE IF NOT EXISTS quiz_question_attempts (
  id                 UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id         UUID NOT NULL REFERENCES students(id) ON DELETE CASCADE,
  subject_id         UUID NOT NULL REFERENCES subjects(id) ON DELETE CASCADE,
  topic              TEXT NOT NULL,
  topic_key          TEXT NOT NULL,
  question_text      TEXT,
  selected_index     INT NOT NULL,
  correct_index      INT NOT NULL,
  is_correct         BOOLEAN NOT NULL DEFAULT FALSE,
  mastery_check      BOOLEAN NOT NULL DEFAULT FALSE,
  integrity_flagged  BOOLEAN NOT NULL DEFAULT FALSE,
  created_at         TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS quiz_attempts_student_topic_idx
  ON quiz_question_attempts(student_id, subject_id, topic_key);

CREATE INDEX IF NOT EXISTS quiz_attempts_student_created_idx
  ON quiz_question_attempts(student_id, created_at DESC);

ALTER TABLE quiz_question_attempts ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "quiz_attempts: student or parent read" ON quiz_question_attempts;
CREATE POLICY "quiz_attempts: student or parent read" ON quiz_question_attempts FOR SELECT
  USING (is_my_student(student_id));

DROP POLICY IF EXISTS "quiz_attempts: service role only write" ON quiz_question_attempts;
CREATE POLICY "quiz_attempts: service role only write" ON quiz_question_attempts FOR INSERT
  WITH CHECK (false);

-- STUDENT_NOTES
ALTER TABLE student_notes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "notes: student or parent read" ON student_notes FOR SELECT
  USING (is_my_student(student_id));

CREATE POLICY "notes: service role only write" ON student_notes FOR INSERT
  WITH CHECK (false);

CREATE POLICY "notes: service role only update" ON student_notes FOR UPDATE
  USING (false);

CREATE POLICY "notes: service role only delete" ON student_notes FOR DELETE
  USING (false);

-- ─────────────────────────────────────────────
-- STUDENT PROFILE EXTENSIONS (run if upgrading)
-- ─────────────────────────────────────────────
ALTER TABLE students
  ADD COLUMN IF NOT EXISTS interests            TEXT,
  ADD COLUMN IF NOT EXISTS personality          TEXT CHECK (personality IN ('curious','energetic','shy','creative','funny')),
  ADD COLUMN IF NOT EXISTS struggles_with       TEXT,
  ADD COLUMN IF NOT EXISTS learning_description TEXT,
  ADD COLUMN IF NOT EXISTS stuck_behavior       TEXT,
  ADD COLUMN IF NOT EXISTS confusion_support    TEXT,
  ADD COLUMN IF NOT EXISTS error_feedback       TEXT,
  ADD COLUMN IF NOT EXISTS teaching_pace        TEXT,
  ADD COLUMN IF NOT EXISTS motivation           TEXT,
  ADD COLUMN IF NOT EXISTS teaching_avoid       TEXT;

-- ─────────────────────────────────────────────
-- STORAGE BUCKET (run after enabling storage)
-- ─────────────────────────────────────────────
INSERT INTO storage.buckets (id, name, public) VALUES ('homework', 'homework', true)
ON CONFLICT (id) DO UPDATE SET public = true;

-- ============================================================
-- TEACHER CLASSROOM MVP (additive)
-- Run this section to add teacher-created classes and student class-code joins.
-- ============================================================

ALTER TABLE profiles
  ADD COLUMN IF NOT EXISTS school_name TEXT;

CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  INSERT INTO public.profiles (user_id, role, full_name, email, school_name)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'role', 'parent'),
    COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.email),
    NEW.email,
    NEW.raw_user_meta_data->>'school_name'
  );
  RETURN NEW;
END;
$$;

CREATE TABLE IF NOT EXISTS teacher_classes (
  id                       UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  teacher_profile_id       UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  class_name               TEXT NOT NULL,
  school_level             TEXT CHECK (school_level IN ('Middle School', 'High School')),
  grade_level              TEXT,
  subject_id               UUID REFERENCES subjects(id) ON DELETE SET NULL,
  period                   TEXT,
  current_unit             TEXT,
  learning_goal            TEXT,
  brainbuddy_instructions  TEXT,
  ai_rules                 JSONB NOT NULL DEFAULT '{}'::jsonb,
  class_code               TEXT NOT NULL UNIQUE,
  is_active                BOOLEAN NOT NULL DEFAULT TRUE,
  created_at               TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at               TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS class_enrollments (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  class_id    UUID NOT NULL REFERENCES teacher_classes(id) ON DELETE CASCADE,
  student_id  UUID NOT NULL REFERENCES students(id) ON DELETE CASCADE,
  joined_at   TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (class_id, student_id)
);

CREATE INDEX IF NOT EXISTS teacher_classes_teacher_profile_id_idx ON teacher_classes(teacher_profile_id);
CREATE INDEX IF NOT EXISTS teacher_classes_class_code_idx ON teacher_classes(class_code);
CREATE INDEX IF NOT EXISTS class_enrollments_class_id_idx ON class_enrollments(class_id);
CREATE INDEX IF NOT EXISTS class_enrollments_student_id_idx ON class_enrollments(student_id);

ALTER TABLE teacher_classes ENABLE ROW LEVEL SECURITY;
ALTER TABLE class_enrollments ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "teacher_classes: owner or joined student read" ON teacher_classes;
CREATE POLICY "teacher_classes: owner or joined student read" ON teacher_classes FOR SELECT
  USING (
    teacher_profile_id IN (SELECT id FROM profiles WHERE user_id = auth.uid())
    OR EXISTS (
      SELECT 1
      FROM class_enrollments ce
      WHERE ce.class_id = teacher_classes.id
        AND is_my_student(ce.student_id)
    )
  );

DROP POLICY IF EXISTS "teacher_classes: teacher insert" ON teacher_classes;
CREATE POLICY "teacher_classes: teacher insert" ON teacher_classes FOR INSERT
  WITH CHECK (
    teacher_profile_id IN (
      SELECT id FROM profiles
      WHERE user_id = auth.uid()
        AND role = 'teacher'
    )
  );

DROP POLICY IF EXISTS "teacher_classes: teacher update" ON teacher_classes;
CREATE POLICY "teacher_classes: teacher update" ON teacher_classes FOR UPDATE
  USING (teacher_profile_id IN (SELECT id FROM profiles WHERE user_id = auth.uid()))
  WITH CHECK (teacher_profile_id IN (SELECT id FROM profiles WHERE user_id = auth.uid()));

DROP POLICY IF EXISTS "class_enrollments: teacher or student read" ON class_enrollments;
CREATE POLICY "class_enrollments: teacher or student read" ON class_enrollments FOR SELECT
  USING (
    is_my_student(student_id)
    OR class_id IN (
      SELECT id FROM teacher_classes
      WHERE teacher_profile_id IN (SELECT id FROM profiles WHERE user_id = auth.uid())
    )
  );

DROP POLICY IF EXISTS "class_enrollments: service role only insert" ON class_enrollments;
CREATE POLICY "class_enrollments: service role only insert" ON class_enrollments FOR INSERT
  WITH CHECK (false);

-- ============================================================
-- TEACHER ASSIGNMENTS (additive)
-- Manual, AI-generated, and worksheet-backed assignments.
-- ============================================================

CREATE TABLE IF NOT EXISTS assignments (
  id             UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  teacher_id     UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  class_id       UUID NOT NULL REFERENCES teacher_classes(id) ON DELETE CASCADE,
  title          TEXT NOT NULL,
  subject        TEXT NOT NULL,
  grade_level    TEXT,
  instructions   TEXT,
  teacher_note   TEXT,
  source_type    TEXT NOT NULL DEFAULT 'manual' CHECK (source_type IN ('manual', 'ai_generated', 'uploaded_worksheet')),
  help_level     TEXT NOT NULL DEFAULT 'attempt_first' CHECK (help_level IN ('hints_only', 'explain_then_ask', 'attempt_first', 'practice_mode', 'quiz_mode')),
  due_date       DATE,
  total_points   INT NOT NULL DEFAULT 0 CHECK (total_points >= 0),
  status         TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'assigned', 'closed', 'archived')),
  created_at     TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at     TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS assignment_questions (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  assignment_id     UUID NOT NULL REFERENCES assignments(id) ON DELETE CASCADE,
  question_number   INT NOT NULL,
  question_label    TEXT NOT NULL,
  question_text     TEXT NOT NULL,
  correct_answer    TEXT NOT NULL,
  explanation       TEXT,
  points            INT NOT NULL DEFAULT 1 CHECK (points >= 0),
  created_at        TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at        TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS assignment_worksheets (
  id             UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  assignment_id  UUID NOT NULL REFERENCES assignments(id) ON DELETE CASCADE,
  page_number    INT NOT NULL,
  file_name      TEXT NOT NULL,
  file_url       TEXT NOT NULL,
  storage_path   TEXT NOT NULL,
  file_type      TEXT,
  file_size      INT NOT NULL DEFAULT 0 CHECK (file_size >= 0),
  created_at     TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS student_assignments (
  id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  assignment_id       UUID NOT NULL REFERENCES assignments(id) ON DELETE CASCADE,
  student_id          UUID NOT NULL REFERENCES students(id) ON DELETE CASCADE,
  class_id            UUID NOT NULL REFERENCES teacher_classes(id) ON DELETE CASCADE,
  status              TEXT NOT NULL DEFAULT 'assigned' CHECK (status IN ('assigned', 'in_progress', 'completed', 'reviewed')),
  score               INT NOT NULL DEFAULT 0 CHECK (score >= 0),
  percentage          NUMERIC(5,2) NOT NULL DEFAULT 0 CHECK (percentage >= 0),
  total_correct       INT NOT NULL DEFAULT 0 CHECK (total_correct >= 0),
  total_questions     INT NOT NULL DEFAULT 0 CHECK (total_questions >= 0),
  missed_questions    JSONB NOT NULL DEFAULT '[]'::jsonb,
  time_spent_seconds  INT NOT NULL DEFAULT 0 CHECK (time_spent_seconds >= 0),
  ai_summary          TEXT,
  started_at          TIMESTAMPTZ,
  completed_at        TIMESTAMPTZ,
  created_at          TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at          TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (assignment_id, student_id)
);

CREATE TABLE IF NOT EXISTS student_answers (
  id                       UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  student_assignment_id    UUID NOT NULL REFERENCES student_assignments(id) ON DELETE CASCADE,
  assignment_question_id   UUID NOT NULL REFERENCES assignment_questions(id) ON DELETE CASCADE,
  student_answer           TEXT,
  is_correct               BOOLEAN,
  attempts                 INT NOT NULL DEFAULT 0 CHECK (attempts >= 0),
  hints_used               INT NOT NULL DEFAULT 0 CHECK (hints_used >= 0),
  time_spent_seconds       INT NOT NULL DEFAULT 0 CHECK (time_spent_seconds >= 0),
  ai_feedback              TEXT,
  created_at               TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at               TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (student_assignment_id, assignment_question_id)
);

CREATE INDEX IF NOT EXISTS assignments_teacher_id_idx ON assignments(teacher_id);
CREATE INDEX IF NOT EXISTS assignments_class_id_idx ON assignments(class_id);
CREATE INDEX IF NOT EXISTS assignments_status_idx ON assignments(status);
CREATE INDEX IF NOT EXISTS assignment_questions_assignment_id_idx ON assignment_questions(assignment_id);
CREATE INDEX IF NOT EXISTS assignment_worksheets_assignment_id_idx ON assignment_worksheets(assignment_id);
CREATE INDEX IF NOT EXISTS student_assignments_assignment_id_idx ON student_assignments(assignment_id);
CREATE INDEX IF NOT EXISTS student_assignments_student_id_idx ON student_assignments(student_id);
CREATE INDEX IF NOT EXISTS student_assignments_class_id_idx ON student_assignments(class_id);
CREATE INDEX IF NOT EXISTS student_answers_student_assignment_id_idx ON student_answers(student_assignment_id);
CREATE INDEX IF NOT EXISTS student_answers_assignment_question_id_idx ON student_answers(assignment_question_id);

ALTER TABLE assignments ENABLE ROW LEVEL SECURITY;
ALTER TABLE assignment_questions ENABLE ROW LEVEL SECURITY;
ALTER TABLE assignment_worksheets ENABLE ROW LEVEL SECURITY;
ALTER TABLE student_assignments ENABLE ROW LEVEL SECURITY;
ALTER TABLE student_answers ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "assignments: teacher or joined student read" ON assignments;
CREATE POLICY "assignments: teacher or joined student read" ON assignments FOR SELECT
  USING (
    teacher_id IN (SELECT id FROM profiles WHERE user_id = auth.uid())
    OR EXISTS (
      SELECT 1
      FROM class_enrollments ce
      WHERE ce.class_id = assignments.class_id
        AND is_my_student(ce.student_id)
    )
  );

DROP POLICY IF EXISTS "assignments: teacher insert" ON assignments;
CREATE POLICY "assignments: teacher insert" ON assignments FOR INSERT
  WITH CHECK (
    teacher_id IN (
      SELECT id FROM profiles
      WHERE user_id = auth.uid()
        AND role = 'teacher'
    )
    AND class_id IN (
      SELECT id FROM teacher_classes
      WHERE teacher_profile_id IN (SELECT id FROM profiles WHERE user_id = auth.uid())
    )
  );

DROP POLICY IF EXISTS "assignments: teacher update" ON assignments;
CREATE POLICY "assignments: teacher update" ON assignments FOR UPDATE
  USING (teacher_id IN (SELECT id FROM profiles WHERE user_id = auth.uid()))
  WITH CHECK (teacher_id IN (SELECT id FROM profiles WHERE user_id = auth.uid()));

DROP POLICY IF EXISTS "assignment_questions: assignment readers read" ON assignment_questions;
CREATE POLICY "assignment_questions: assignment readers read" ON assignment_questions FOR SELECT
  USING (
    assignment_id IN (
      SELECT id FROM assignments
      WHERE teacher_id IN (SELECT id FROM profiles WHERE user_id = auth.uid())
        OR EXISTS (
          SELECT 1
          FROM class_enrollments ce
          WHERE ce.class_id = assignments.class_id
            AND is_my_student(ce.student_id)
        )
    )
  );

DROP POLICY IF EXISTS "assignment_questions: teacher insert" ON assignment_questions;
CREATE POLICY "assignment_questions: teacher insert" ON assignment_questions FOR INSERT
  WITH CHECK (
    assignment_id IN (
      SELECT id FROM assignments
      WHERE teacher_id IN (SELECT id FROM profiles WHERE user_id = auth.uid())
    )
  );

DROP POLICY IF EXISTS "assignment_worksheets: assignment readers read" ON assignment_worksheets;
CREATE POLICY "assignment_worksheets: assignment readers read" ON assignment_worksheets FOR SELECT
  USING (
    assignment_id IN (
      SELECT id FROM assignments
      WHERE teacher_id IN (SELECT id FROM profiles WHERE user_id = auth.uid())
        OR EXISTS (
          SELECT 1
          FROM class_enrollments ce
          WHERE ce.class_id = assignments.class_id
            AND is_my_student(ce.student_id)
        )
    )
  );

DROP POLICY IF EXISTS "assignment_worksheets: teacher insert" ON assignment_worksheets;
CREATE POLICY "assignment_worksheets: teacher insert" ON assignment_worksheets FOR INSERT
  WITH CHECK (
    assignment_id IN (
      SELECT id FROM assignments
      WHERE teacher_id IN (SELECT id FROM profiles WHERE user_id = auth.uid())
    )
  );

DROP POLICY IF EXISTS "student_assignments: teacher or student read" ON student_assignments;
CREATE POLICY "student_assignments: teacher or student read" ON student_assignments FOR SELECT
  USING (
    is_my_student(student_id)
    OR assignment_id IN (
      SELECT id FROM assignments
      WHERE teacher_id IN (SELECT id FROM profiles WHERE user_id = auth.uid())
    )
  );

DROP POLICY IF EXISTS "student_assignments: service role only write" ON student_assignments;
CREATE POLICY "student_assignments: service role only write" ON student_assignments FOR INSERT
  WITH CHECK (false);

DROP POLICY IF EXISTS "student_answers: teacher or student read" ON student_answers;
CREATE POLICY "student_answers: teacher or student read" ON student_answers FOR SELECT
  USING (
    student_assignment_id IN (
      SELECT id FROM student_assignments
      WHERE is_my_student(student_id)
        OR assignment_id IN (
          SELECT id FROM assignments
          WHERE teacher_id IN (SELECT id FROM profiles WHERE user_id = auth.uid())
        )
    )
  );

DROP POLICY IF EXISTS "student_answers: service role only write" ON student_answers;
CREATE POLICY "student_answers: service role only write" ON student_answers FOR INSERT
  WITH CHECK (false);
