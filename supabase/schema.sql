-- ============================================================
-- Kids AI Tutor — Full Supabase Schema
-- Run this entire file in the Supabase SQL Editor
-- ============================================================

-- ─────────────────────────────────────────────
-- 1. PROFILES
-- One row per auth.users entry. Stores role.
-- ─────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS profiles (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     UUID NOT NULL UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
  role        TEXT NOT NULL CHECK (role IN ('parent', 'student', 'teacher')),
  full_name   TEXT,
  email       TEXT,
  avatar_url  TEXT,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
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
  ('Writing', '✏️', '#f59e0b')
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
  learning_style   TEXT NOT NULL DEFAULT 'visual' CHECK (learning_style IN ('visual','auditory','kinesthetic','reading')),
  confidence_level INT NOT NULL DEFAULT 5 CHECK (confidence_level BETWEEN 1 AND 10),
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
  explanation_style TEXT,
  was_helpful       BOOLEAN,
  created_at        TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ─────────────────────────────────────────────
-- 9. STUDENT_SUBJECT_PROGRESS
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

-- ─────────────────────────────────────────────
-- STORAGE BUCKET (run after enabling storage)
-- ─────────────────────────────────────────────
-- INSERT INTO storage.buckets (id, name, public) VALUES ('homework', 'homework', false)
-- ON CONFLICT DO NOTHING;
