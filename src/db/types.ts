export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "13.0.5"
  }
  public: {
    Tables: {
      answers: {
        Row: {
          answer: Database["public"]["Enums"]["answer_option"]
          contest_id: string
          id: string
          participant_id: string
          question_id: string
          round: number
          timestamp: string | null
        }
        Insert: {
          answer: Database["public"]["Enums"]["answer_option"]
          contest_id: string
          id: string
          participant_id: string
          question_id: string
          round: number
          timestamp?: string | null
        }
        Update: {
          answer?: Database["public"]["Enums"]["answer_option"]
          contest_id?: string
          id?: string
          participant_id?: string
          question_id?: string
          round?: number
          timestamp?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "answers_contest_id_fkey"
            columns: ["contest_id"]
            isOneToOne: false
            referencedRelation: "contests"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "answers_participant_id_fkey"
            columns: ["participant_id"]
            isOneToOne: false
            referencedRelation: "participants"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "answers_question_id_fkey"
            columns: ["question_id"]
            isOneToOne: false
            referencedRelation: "questions"
            referencedColumns: ["id"]
          },
        ]
      }
      contests: {
        Row: {
          created_at: string | null
          current_round: number | null
          id: string
          name: string
          price: number | null
          start_time: string
          state: Database["public"]["Enums"]["contest_state"] | null
        }
        Insert: {
          created_at?: string | null
          current_round?: number | null
          id: string
          name: string
          price?: number | null
          start_time: string
          state?: Database["public"]["Enums"]["contest_state"] | null
        }
        Update: {
          created_at?: string | null
          current_round?: number | null
          id?: string
          name?: string
          price?: number | null
          start_time?: string
          state?: Database["public"]["Enums"]["contest_state"] | null
        }
        Relationships: []
      }
      notification_log: {
        Row: {
          contest_id: string | null
          dedupe_key: string
          id: string
          notification_type: string
          round: number | null
          sent_at: string | null
          user_id: string
        }
        Insert: {
          contest_id?: string | null
          dedupe_key: string
          id?: string
          notification_type: string
          round?: number | null
          sent_at?: string | null
          user_id: string
        }
        Update: {
          contest_id?: string | null
          dedupe_key?: string
          id?: string
          notification_type?: string
          round?: number | null
          sent_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "notification_log_contest_id_fkey"
            columns: ["contest_id"]
            isOneToOne: false
            referencedRelation: "contests"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "notification_log_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      participants: {
        Row: {
          contest_id: string
          created_at: string | null
          elimination_round: number | null
          id: string
          registration_status: Database["public"]["Enums"]["registration_status"]
          user_id: string
        }
        Insert: {
          contest_id: string
          created_at?: string | null
          elimination_round?: number | null
          id: string
          registration_status?: Database["public"]["Enums"]["registration_status"]
          user_id: string
        }
        Update: {
          contest_id?: string
          created_at?: string | null
          elimination_round?: number | null
          id?: string
          registration_status?: Database["public"]["Enums"]["registration_status"]
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "participants_contest_id_fkey"
            columns: ["contest_id"]
            isOneToOne: false
            referencedRelation: "contests"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "participants_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      payments: {
        Row: {
          amount_total_cents: number
          contest_id: string
          created_at: string
          currency: string
          id: string
          status: string
          stripe_checkout_session_id: string | null
          stripe_customer_id: string | null
          stripe_payment_intent_id: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          amount_total_cents: number
          contest_id: string
          created_at?: string
          currency?: string
          id?: string
          status: string
          stripe_checkout_session_id?: string | null
          stripe_customer_id?: string | null
          stripe_payment_intent_id?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          amount_total_cents?: number
          contest_id?: string
          created_at?: string
          currency?: string
          id?: string
          status?: string
          stripe_checkout_session_id?: string | null
          stripe_customer_id?: string | null
          stripe_payment_intent_id?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "payments_contest_id_fkey"
            columns: ["contest_id"]
            isOneToOne: false
            referencedRelation: "contests"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "payments_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      questions: {
        Row: {
          contest_id: string
          correct_option: Database["public"]["Enums"]["answer_option"][] | null
          id: string
          options: Json | null
          processing_status:
            | Database["public"]["Enums"]["processing_status"]
            | null
          question: string
          round: number
        }
        Insert: {
          contest_id: string
          correct_option?: Database["public"]["Enums"]["answer_option"][] | null
          id: string
          options?: Json | null
          processing_status?:
            | Database["public"]["Enums"]["processing_status"]
            | null
          question: string
          round: number
        }
        Update: {
          contest_id?: string
          correct_option?: Database["public"]["Enums"]["answer_option"][] | null
          id?: string
          options?: Json | null
          processing_status?:
            | Database["public"]["Enums"]["processing_status"]
            | null
          question?: string
          round?: number
        }
        Relationships: [
          {
            foreignKeyName: "questions_contest_id_fkey"
            columns: ["contest_id"]
            isOneToOne: false
            referencedRelation: "contests"
            referencedColumns: ["id"]
          },
        ]
      }
      users: {
        Row: {
          created_at: string | null
          email: string | null
          expo_push_token: string | null
          has_seen_demo: boolean | null
          id: string
          phone_number: string | null
          push_token_updated_at: string | null
          role: string | null
          updated_at: string | null
          username: string | null
        }
        Insert: {
          created_at?: string | null
          email?: string | null
          expo_push_token?: string | null
          has_seen_demo?: boolean | null
          id?: string
          phone_number?: string | null
          push_token_updated_at?: string | null
          role?: string | null
          updated_at?: string | null
          username?: string | null
        }
        Update: {
          created_at?: string | null
          email?: string | null
          expo_push_token?: string | null
          has_seen_demo?: boolean | null
          id?: string
          phone_number?: string | null
          push_token_updated_at?: string | null
          role?: string | null
          updated_at?: string | null
          username?: string | null
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      check_username_available: {
        Args: { requested_username: string }
        Returns: boolean
      }
      get_answer_distribution: {
        Args: { p_contest_id: string; p_round: number }
        Returns: {
          answer: string
          count: number
        }[]
      }
      is_admin: { Args: never; Returns: boolean }
      slugify: { Args: { text_to_slug: string }; Returns: string }
    }
    Enums: {
      answer_option: "A" | "B" | "C" | "D" | "E" | "F"
      contest_state:
        | "UPCOMING"
        | "LOBBY_OPEN"
        | "ROUND_IN_PROGRESS"
        | "ROUND_CLOSED"
        | "FINISHED"
      processing_status: "PENDING" | "PROCESSING" | "COMPLETE"
      registration_status: "PENDING" | "APPROVED" | "REJECTED"
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {
      answer_option: ["A", "B", "C", "D", "E", "F"],
      contest_state: [
        "UPCOMING",
        "LOBBY_OPEN",
        "ROUND_IN_PROGRESS",
        "ROUND_CLOSED",
        "FINISHED",
      ],
      processing_status: ["PENDING", "PROCESSING", "COMPLETE"],
      registration_status: ["PENDING", "APPROVED", "REJECTED"],
    },
  },
} as const

// Convenience type aliases for our app
export type UserRow = Tables<"users">;
export type ContestRow = Tables<"contests">;
export type ParticipantRow = Tables<"participants">;
export type QuestionRow = Tables<"questions">;
export type AnswerRow = Tables<"answers">;

export type UserInsert = TablesInsert<"users">;
export type ContestInsert = TablesInsert<"contests">;
export type ParticipantInsert = TablesInsert<"participants">;
export type QuestionInsert = TablesInsert<"questions">;
export type AnswerInsert = TablesInsert<"answers">;

export type UserUpdate = TablesUpdate<"users">;
export type ContestUpdate = TablesUpdate<"contests">;
export type ParticipantUpdate = TablesUpdate<"participants">;
export type QuestionUpdate = TablesUpdate<"questions">;
export type AnswerUpdate = TablesUpdate<"answers">;

export type ContestState = Database["public"]["Enums"]["contest_state"];
export type RegistrationStatus = Database["public"]["Enums"]["registration_status"];
