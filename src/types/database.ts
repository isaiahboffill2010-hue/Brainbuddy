export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string;
          user_id: string;
          role: "parent" | "student" | "teacher";
          full_name: string | null;
          email: string | null;
          avatar_url: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          role: "parent" | "student" | "teacher";
          full_name?: string | null;
          email?: string | null;
          avatar_url?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          full_name?: string | null;
          email?: string | null;
          avatar_url?: string | null;
          updated_at?: string;
        };
      };
      subjects: {
        Row: {
          id: string;
          name: string;
          icon: string;
          color: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          name: string;
          icon: string;
          color: string;
        };
        Update: {
          name?: string;
          icon?: string;
          color?: string;
        };
      };
      students: {
        Row: {
          id: string;
          profile_id: string | null;
          name: string;
          age: number | null;
          grade: string;
          avatar_emoji: string;
          learning_style: "visual" | "auditory" | "kinesthetic" | "reading";
          confidence_level: number;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          profile_id?: string | null;
          name: string;
          age?: number | null;
          grade: string;
          avatar_emoji?: string;
          learning_style?: "visual" | "auditory" | "kinesthetic" | "reading";
          confidence_level?: number;
        };
        Update: {
          name?: string;
          age?: number | null;
          grade?: string;
          avatar_emoji?: string;
          learning_style?: "visual" | "auditory" | "kinesthetic" | "reading";
          confidence_level?: number;
          updated_at?: string;
        };
      };
      parents_students: {
        Row: {
          parent_id: string;
          student_id: string;
          created_at: string;
        };
        Insert: {
          parent_id: string;
          student_id: string;
        };
        Update: Record<string, never>;
      };
      learning_preferences: {
        Row: {
          id: string;
          student_id: string;
          preferred_style: string;
          pace: "slow" | "normal" | "fast";
          language: string;
          notes: string | null;
          updated_at: string;
        };
        Insert: {
          id?: string;
          student_id: string;
          preferred_style?: string;
          pace?: "slow" | "normal" | "fast";
          language?: string;
          notes?: string | null;
        };
        Update: {
          preferred_style?: string;
          pace?: "slow" | "normal" | "fast";
          language?: string;
          notes?: string | null;
          updated_at?: string;
        };
      };
      homework_uploads: {
        Row: {
          id: string;
          student_id: string;
          subject_id: string | null;
          image_url: string | null;
          question_text: string | null;
          status: "pending" | "processed" | "error";
          created_at: string;
        };
        Insert: {
          id?: string;
          student_id: string;
          subject_id?: string | null;
          image_url?: string | null;
          question_text?: string | null;
          status?: "pending" | "processed" | "error";
        };
        Update: {
          question_text?: string | null;
          status?: "pending" | "processed" | "error";
        };
      };
      ai_sessions: {
        Row: {
          id: string;
          student_id: string;
          subject_id: string | null;
          title: string | null;
          session_summary: string | null;
          learning_notes: string | null;
          is_active: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          student_id: string;
          subject_id?: string | null;
          title?: string | null;
          session_summary?: string | null;
          learning_notes?: string | null;
          is_active?: boolean;
        };
        Update: {
          title?: string | null;
          session_summary?: string | null;
          learning_notes?: string | null;
          is_active?: boolean;
          updated_at?: string;
        };
      };
      ai_messages: {
        Row: {
          id: string;
          session_id: string;
          role: "user" | "assistant";
          content: string;
          image_url: string | null;
          explanation_style: string | null;
          was_helpful: boolean | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          session_id: string;
          role: "user" | "assistant";
          content: string;
          image_url?: string | null;
          explanation_style?: string | null;
          was_helpful?: boolean | null;
        };
        Update: {
          was_helpful?: boolean | null;
        };
      };
      student_subject_progress: {
        Row: {
          id: string;
          student_id: string;
          subject_id: string;
          level: number;
          topics_mastered: string[];
          topics_struggling: string[];
          session_count: number;
          last_session_at: string | null;
          streak_days: number;
          updated_at: string;
        };
        Insert: {
          id?: string;
          student_id: string;
          subject_id: string;
          level?: number;
          topics_mastered?: string[];
          topics_struggling?: string[];
          session_count?: number;
          last_session_at?: string | null;
          streak_days?: number;
        };
        Update: {
          level?: number;
          topics_mastered?: string[];
          topics_struggling?: string[];
          session_count?: number;
          last_session_at?: string | null;
          streak_days?: number;
          updated_at?: string;
        };
      };
    };
    Views: Record<string, never>;
    Functions: {
      is_my_student: {
        Args: { p_student_id: string };
        Returns: boolean;
      };
    };
    Enums: Record<string, never>;
  };
}
