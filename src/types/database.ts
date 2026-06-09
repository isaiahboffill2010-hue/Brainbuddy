export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export interface Database {
  public: {
    PostgrestVersion: "12";
    Tables: {
      profiles: {
        Row: {
          id: string;
          user_id: string;
          role: "parent" | "student" | "teacher";
          full_name: string | null;
          email: string | null;
          school_name: string | null;
          avatar_url: string | null;
          plan: "free" | "premium";
          subscription_status: "trial" | "active" | "past_due" | "canceled" | "none";
          messages_used: number;
          snips_used: number;
          quizzes_used: number;
          message_limit: number;
          snip_limit: number;
          quiz_limit: number;
          stripe_customer_id: string | null;
          stripe_subscription_id: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          role: "parent" | "student" | "teacher";
          full_name?: string | null;
          email?: string | null;
          school_name?: string | null;
          avatar_url?: string | null;
          plan?: "free" | "premium";
          subscription_status?: "trial" | "active" | "past_due" | "canceled" | "none";
          messages_used?: number;
          snips_used?: number;
          quizzes_used?: number;
          message_limit?: number;
          snip_limit?: number;
          quiz_limit?: number;
          stripe_customer_id?: string | null;
          stripe_subscription_id?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          full_name?: string | null;
          email?: string | null;
          school_name?: string | null;
          avatar_url?: string | null;
          plan?: "free" | "premium";
          subscription_status?: "trial" | "active" | "past_due" | "canceled" | "none";
          messages_used?: number;
          snips_used?: number;
          quizzes_used?: number;
          message_limit?: number;
          snip_limit?: number;
          quiz_limit?: number;
          stripe_customer_id?: string | null;
          stripe_subscription_id?: string | null;
          updated_at?: string;
        };
        Relationships: [];
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
        Relationships: [];
      };
      students: {
        Row: {
          id: string;
          profile_id: string | null;
          name: string;
          age: number | null;
          grade: string;
          avatar_emoji: string;
          avatar_url: string | null;
          learning_style: string;
          confidence_level: number;
          interests: string | null;
          personality: "curious" | "energetic" | "shy" | "creative" | "funny" | null;
          struggles_with: string | null;
          learning_description: string | null;
          stuck_behavior: string | null;
          confusion_support: string | null;
          error_feedback: string | null;
          teaching_pace: string | null;
          motivation: string | null;
          teaching_avoid: string | null;
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
          avatar_url?: string | null;
          learning_style?: string;
          confidence_level?: number;
          interests?: string | null;
          personality?: "curious" | "energetic" | "shy" | "creative" | "funny" | null;
          struggles_with?: string | null;
          learning_description?: string | null;
          stuck_behavior?: string | null;
          confusion_support?: string | null;
          error_feedback?: string | null;
          teaching_pace?: string | null;
          motivation?: string | null;
          teaching_avoid?: string | null;
        };
        Update: {
          name?: string;
          age?: number | null;
          grade?: string;
          avatar_emoji?: string;
          avatar_url?: string | null;
          learning_style?: string;
          confidence_level?: number;
          interests?: string | null;
          personality?: "curious" | "energetic" | "shy" | "creative" | "funny" | null;
          struggles_with?: string | null;
          learning_description?: string | null;
          updated_at?: string;
        };
        Relationships: [];
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
        Relationships: [];
      };
      teacher_classes: {
        Row: {
          id: string;
          teacher_profile_id: string;
          class_name: string;
          school_level: "Middle School" | "High School" | null;
          grade_level: string | null;
          subject_id: string | null;
          period: string | null;
          current_unit: string | null;
          learning_goal: string | null;
          brainbuddy_instructions: string | null;
          ai_rules: Json;
          class_code: string;
          is_active: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          teacher_profile_id: string;
          class_name: string;
          school_level?: "Middle School" | "High School" | null;
          grade_level?: string | null;
          subject_id?: string | null;
          period?: string | null;
          current_unit?: string | null;
          learning_goal?: string | null;
          brainbuddy_instructions?: string | null;
          ai_rules?: Json;
          class_code: string;
          is_active?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          class_name?: string;
          school_level?: "Middle School" | "High School" | null;
          grade_level?: string | null;
          subject_id?: string | null;
          period?: string | null;
          current_unit?: string | null;
          learning_goal?: string | null;
          brainbuddy_instructions?: string | null;
          ai_rules?: Json;
          class_code?: string;
          is_active?: boolean;
          updated_at?: string;
        };
        Relationships: [];
      };
      class_enrollments: {
        Row: {
          id: string;
          class_id: string;
          student_id: string;
          joined_at: string;
        };
        Insert: {
          id?: string;
          class_id: string;
          student_id: string;
          joined_at?: string;
        };
        Update: {
          joined_at?: string;
        };
        Relationships: [];
      };
      assignments: {
        Row: {
          id: string;
          teacher_id: string;
          class_id: string;
          title: string;
          subject: string;
          grade_level: string | null;
          instructions: string | null;
          teacher_note: string | null;
          source_type: "manual" | "ai_generated" | "uploaded_worksheet";
          help_level: "hints_only" | "explain_then_ask" | "attempt_first" | "practice_mode" | "quiz_mode";
          due_date: string | null;
          total_points: number;
          status: "draft" | "assigned" | "closed" | "archived";
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          teacher_id: string;
          class_id: string;
          title: string;
          subject: string;
          grade_level?: string | null;
          instructions?: string | null;
          teacher_note?: string | null;
          source_type?: "manual" | "ai_generated" | "uploaded_worksheet";
          help_level?: "hints_only" | "explain_then_ask" | "attempt_first" | "practice_mode" | "quiz_mode";
          due_date?: string | null;
          total_points?: number;
          status?: "draft" | "assigned" | "closed" | "archived";
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          title?: string;
          subject?: string;
          grade_level?: string | null;
          instructions?: string | null;
          teacher_note?: string | null;
          source_type?: "manual" | "ai_generated" | "uploaded_worksheet";
          help_level?: "hints_only" | "explain_then_ask" | "attempt_first" | "practice_mode" | "quiz_mode";
          due_date?: string | null;
          total_points?: number;
          status?: "draft" | "assigned" | "closed" | "archived";
          updated_at?: string;
        };
        Relationships: [];
      };
      assignment_questions: {
        Row: {
          id: string;
          assignment_id: string;
          question_number: number;
          question_label: string;
          question_text: string;
          correct_answer: string;
          explanation: string | null;
          points: number;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          assignment_id: string;
          question_number: number;
          question_label: string;
          question_text: string;
          correct_answer: string;
          explanation?: string | null;
          points?: number;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          question_number?: number;
          question_label?: string;
          question_text?: string;
          correct_answer?: string;
          explanation?: string | null;
          points?: number;
          updated_at?: string;
        };
        Relationships: [];
      };
      assignment_worksheets: {
        Row: {
          id: string;
          assignment_id: string;
          page_number: number;
          file_name: string;
          file_url: string;
          storage_path: string;
          file_type: string | null;
          file_size: number;
          created_at: string;
        };
        Insert: {
          id?: string;
          assignment_id: string;
          page_number: number;
          file_name: string;
          file_url: string;
          storage_path: string;
          file_type?: string | null;
          file_size?: number;
          created_at?: string;
        };
        Update: {
          page_number?: number;
          file_name?: string;
          file_url?: string;
          storage_path?: string;
          file_type?: string | null;
          file_size?: number;
        };
        Relationships: [];
      };
      student_assignments: {
        Row: {
          id: string;
          assignment_id: string;
          student_id: string;
          class_id: string;
          status: "assigned" | "in_progress" | "completed" | "reviewed";
          score: number;
          percentage: number;
          total_correct: number;
          total_questions: number;
          missed_questions: Json;
          time_spent_seconds: number;
          ai_summary: string | null;
          started_at: string | null;
          completed_at: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          assignment_id: string;
          student_id: string;
          class_id: string;
          status?: "assigned" | "in_progress" | "completed" | "reviewed";
          score?: number;
          percentage?: number;
          total_correct?: number;
          total_questions?: number;
          missed_questions?: Json;
          time_spent_seconds?: number;
          ai_summary?: string | null;
          started_at?: string | null;
          completed_at?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          status?: "assigned" | "in_progress" | "completed" | "reviewed";
          score?: number;
          percentage?: number;
          total_correct?: number;
          total_questions?: number;
          missed_questions?: Json;
          time_spent_seconds?: number;
          ai_summary?: string | null;
          started_at?: string | null;
          completed_at?: string | null;
          updated_at?: string;
        };
        Relationships: [];
      };
      student_answers: {
        Row: {
          id: string;
          student_assignment_id: string;
          assignment_question_id: string;
          student_answer: string | null;
          is_correct: boolean | null;
          attempts: number;
          hints_used: number;
          time_spent_seconds: number;
          ai_feedback: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          student_assignment_id: string;
          assignment_question_id: string;
          student_answer?: string | null;
          is_correct?: boolean | null;
          attempts?: number;
          hints_used?: number;
          time_spent_seconds?: number;
          ai_feedback?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          student_answer?: string | null;
          is_correct?: boolean | null;
          attempts?: number;
          hints_used?: number;
          time_spent_seconds?: number;
          ai_feedback?: string | null;
          updated_at?: string;
        };
        Relationships: [];
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
        Relationships: [];
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
        Relationships: [];
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
        Relationships: [];
      };
      ai_messages: {
        Row: {
          id: string;
          session_id: string;
          role: "user" | "assistant";
          content: string;
          image_url: string | null;
          worked_example: Json | null;
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
          worked_example?: Json | null;
          explanation_style?: string | null;
          was_helpful?: boolean | null;
        };
        Update: {
          worked_example?: Json | null;
          was_helpful?: boolean | null;
        };
        Relationships: [];
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
        Relationships: [];
      };
      quiz_question_attempts: {
        Row: {
          id: string;
          student_id: string;
          subject_id: string;
          topic: string;
          topic_key: string;
          question_text: string | null;
          selected_index: number;
          correct_index: number;
          is_correct: boolean;
          mastery_check: boolean;
          integrity_flagged: boolean;
          created_at: string;
        };
        Insert: {
          id?: string;
          student_id: string;
          subject_id: string;
          topic: string;
          topic_key: string;
          question_text?: string | null;
          selected_index: number;
          correct_index: number;
          is_correct: boolean;
          mastery_check?: boolean;
          integrity_flagged?: boolean;
          created_at?: string;
        };
        Update: {
          mastery_check?: boolean;
          integrity_flagged?: boolean;
        };
        Relationships: [];
      };
      student_notes: {
        Row: {
          id: string;
          student_id: string;
          session_id: string | null;
          subject: string | null;
          topic: string | null;
          note: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          student_id: string;
          session_id?: string | null;
          subject?: string | null;
          topic?: string | null;
          note: string;
        };
        Update: {
          note?: string;
          topic?: string | null;
        };
        Relationships: [];
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
