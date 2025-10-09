export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[];

export interface Database {
  graphql_public: {
    Tables: Record<never, never>;
    Views: Record<never, never>;
    Functions: {
      graphql: {
        Args: {
          extensions?: Json;
          operationName?: string;
          query?: string;
          variables?: Json;
        };
        Returns: Json;
      };
    };
    Enums: Record<never, never>;
    CompositeTypes: Record<never, never>;
  };
  public: {
    Tables: {
      exercises: {
        Row: {
          created_at: string;
          exercise_type: string;
          id: number;
          instructions: string;
          is_active: boolean;
          muscle_group_id: number;
          muscle_subgroup_id: number | null;
          name: string;
          recommended_rep_range_max: number;
          recommended_rep_range_min: number;
          slug: string;
          updated_at: string;
        };
        Insert: {
          created_at?: string;
          exercise_type: string;
          id?: number;
          instructions: string;
          is_active?: boolean;
          muscle_group_id: number;
          muscle_subgroup_id?: number | null;
          name: string;
          recommended_rep_range_max: number;
          recommended_rep_range_min: number;
          slug: string;
          updated_at?: string;
        };
        Update: {
          created_at?: string;
          exercise_type?: string;
          id?: number;
          instructions?: string;
          is_active?: boolean;
          muscle_group_id?: number;
          muscle_subgroup_id?: number | null;
          name?: string;
          recommended_rep_range_max?: number;
          recommended_rep_range_min?: number;
          slug?: string;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "exercises_muscle_group_id_fkey";
            columns: ["muscle_group_id"];
            isOneToOne: false;
            referencedRelation: "muscle_groups";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "exercises_muscle_subgroup_id_fkey";
            columns: ["muscle_subgroup_id"];
            isOneToOne: false;
            referencedRelation: "muscle_subgroups";
            referencedColumns: ["id"];
          },
        ];
      };
      muscle_groups: {
        Row: {
          created_at: string;
          id: number;
          name: string;
        };
        Insert: {
          created_at?: string;
          id?: number;
          name: string;
        };
        Update: {
          created_at?: string;
          id?: number;
          name?: string;
        };
        Relationships: [];
      };
      muscle_subgroups: {
        Row: {
          created_at: string;
          id: number;
          muscle_group_id: number;
          name: string;
        };
        Insert: {
          created_at?: string;
          id?: number;
          muscle_group_id: number;
          name: string;
        };
        Update: {
          created_at?: string;
          id?: number;
          muscle_group_id?: number;
          name?: string;
        };
        Relationships: [
          {
            foreignKeyName: "muscle_subgroups_muscle_group_id_fkey";
            columns: ["muscle_group_id"];
            isOneToOne: false;
            referencedRelation: "muscle_groups";
            referencedColumns: ["id"];
          },
        ];
      };
      plan_exercises: {
        Row: {
          created_at: string;
          exercise_id: number;
          id: number;
          notes: string | null;
          order_index: number;
          rest_seconds: number;
          target_reps: number;
          target_sets: number;
          updated_at: string;
          workout_plan_id: number;
        };
        Insert: {
          created_at?: string;
          exercise_id: number;
          id?: number;
          notes?: string | null;
          order_index: number;
          rest_seconds: number;
          target_reps: number;
          target_sets: number;
          updated_at?: string;
          workout_plan_id: number;
        };
        Update: {
          created_at?: string;
          exercise_id?: number;
          id?: number;
          notes?: string | null;
          order_index?: number;
          rest_seconds?: number;
          target_reps?: number;
          target_sets?: number;
          updated_at?: string;
          workout_plan_id?: number;
        };
        Relationships: [
          {
            foreignKeyName: "plan_exercises_exercise_id_fkey";
            columns: ["exercise_id"];
            isOneToOne: false;
            referencedRelation: "exercises";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "plan_exercises_workout_plan_id_fkey";
            columns: ["workout_plan_id"];
            isOneToOne: false;
            referencedRelation: "workout_plans";
            referencedColumns: ["id"];
          },
        ];
      };
      session_sets: {
        Row: {
          actual_reps: number | null;
          completed_at: string | null;
          created_at: string;
          id: number;
          notes: string | null;
          plan_exercise_id: number;
          set_number: number;
          status: string;
          target_reps: number;
          updated_at: string;
          weight_kg: number | null;
          workout_session_id: number;
        };
        Insert: {
          actual_reps?: number | null;
          completed_at?: string | null;
          created_at?: string;
          id?: number;
          notes?: string | null;
          plan_exercise_id: number;
          set_number: number;
          status?: string;
          target_reps: number;
          updated_at?: string;
          weight_kg?: number | null;
          workout_session_id: number;
        };
        Update: {
          actual_reps?: number | null;
          completed_at?: string | null;
          created_at?: string;
          id?: number;
          notes?: string | null;
          plan_exercise_id?: number;
          set_number?: number;
          status?: string;
          target_reps?: number;
          updated_at?: string;
          weight_kg?: number | null;
          workout_session_id?: number;
        };
        Relationships: [
          {
            foreignKeyName: "session_sets_plan_exercise_id_fkey";
            columns: ["plan_exercise_id"];
            isOneToOne: false;
            referencedRelation: "plan_exercises";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "session_sets_workout_session_id_fkey";
            columns: ["workout_session_id"];
            isOneToOne: false;
            referencedRelation: "upcoming_workouts";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "session_sets_workout_session_id_fkey";
            columns: ["workout_session_id"];
            isOneToOne: false;
            referencedRelation: "workout_history";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "session_sets_workout_session_id_fkey";
            columns: ["workout_session_id"];
            isOneToOne: false;
            referencedRelation: "workout_sessions";
            referencedColumns: ["id"];
          },
        ];
      };
      users: {
        Row: {
          created_at: string;
          gender: string | null;
          height_cm: number | null;
          id: string;
          injuries_limitations: string | null;
          updated_at: string;
          weight_kg: number | null;
        };
        Insert: {
          created_at?: string;
          gender?: string | null;
          height_cm?: number | null;
          id: string;
          injuries_limitations?: string | null;
          updated_at?: string;
          weight_kg?: number | null;
        };
        Update: {
          created_at?: string;
          gender?: string | null;
          height_cm?: number | null;
          id?: string;
          injuries_limitations?: string | null;
          updated_at?: string;
          weight_kg?: number | null;
        };
        Relationships: [];
      };
      workout_plans: {
        Row: {
          created_at: string;
          id: number;
          is_active: boolean;
          name: string;
          schedule_days: number[] | null;
          schedule_interval_days: number | null;
          schedule_type: string;
          updated_at: string;
          user_id: string;
        };
        Insert: {
          created_at?: string;
          id?: number;
          is_active?: boolean;
          name: string;
          schedule_days?: number[] | null;
          schedule_interval_days?: number | null;
          schedule_type: string;
          updated_at?: string;
          user_id: string;
        };
        Update: {
          created_at?: string;
          id?: number;
          is_active?: boolean;
          name?: string;
          schedule_days?: number[] | null;
          schedule_interval_days?: number | null;
          schedule_type?: string;
          updated_at?: string;
          user_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: "workout_plans_user_id_fkey";
            columns: ["user_id"];
            isOneToOne: false;
            referencedRelation: "users";
            referencedColumns: ["id"];
          },
        ];
      };
      workout_sessions: {
        Row: {
          completed_at: string | null;
          created_at: string;
          id: number;
          notes: string | null;
          scheduled_for: string;
          started_at: string | null;
          status: string;
          updated_at: string;
          user_id: string;
          workout_plan_id: number;
        };
        Insert: {
          completed_at?: string | null;
          created_at?: string;
          id?: number;
          notes?: string | null;
          scheduled_for: string;
          started_at?: string | null;
          status?: string;
          updated_at?: string;
          user_id: string;
          workout_plan_id: number;
        };
        Update: {
          completed_at?: string | null;
          created_at?: string;
          id?: number;
          notes?: string | null;
          scheduled_for?: string;
          started_at?: string | null;
          status?: string;
          updated_at?: string;
          user_id?: string;
          workout_plan_id?: number;
        };
        Relationships: [
          {
            foreignKeyName: "workout_sessions_user_id_fkey";
            columns: ["user_id"];
            isOneToOne: false;
            referencedRelation: "users";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "workout_sessions_workout_plan_id_fkey";
            columns: ["workout_plan_id"];
            isOneToOne: false;
            referencedRelation: "workout_plans";
            referencedColumns: ["id"];
          },
        ];
      };
    };
    Views: {
      exercise_progression: {
        Row: {
          actual_reps: number | null;
          exercise_id: number | null;
          exercise_name: string | null;
          plan_exercise_id: number | null;
          recent_rank: number | null;
          scheduled_for: string | null;
          set_number: number | null;
          status: string | null;
          user_id: string | null;
          weight_kg: number | null;
        };
        Relationships: [
          {
            foreignKeyName: "plan_exercises_exercise_id_fkey";
            columns: ["exercise_id"];
            isOneToOne: false;
            referencedRelation: "exercises";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "session_sets_plan_exercise_id_fkey";
            columns: ["plan_exercise_id"];
            isOneToOne: false;
            referencedRelation: "plan_exercises";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "workout_sessions_user_id_fkey";
            columns: ["user_id"];
            isOneToOne: false;
            referencedRelation: "users";
            referencedColumns: ["id"];
          },
        ];
      };
      upcoming_workouts: {
        Row: {
          exercise_count: number | null;
          id: number | null;
          plan_name: string | null;
          scheduled_for: string | null;
          status: string | null;
          total_sets: number | null;
          user_id: string | null;
        };
        Relationships: [
          {
            foreignKeyName: "workout_sessions_user_id_fkey";
            columns: ["user_id"];
            isOneToOne: false;
            referencedRelation: "users";
            referencedColumns: ["id"];
          },
        ];
      };
      workout_history: {
        Row: {
          completed_at: string | null;
          completed_sets: number | null;
          duration_minutes: number | null;
          id: number | null;
          plan_name: string | null;
          scheduled_for: string | null;
          started_at: string | null;
          status: string | null;
          total_sets: number | null;
          user_id: string | null;
        };
        Relationships: [
          {
            foreignKeyName: "workout_sessions_user_id_fkey";
            columns: ["user_id"];
            isOneToOne: false;
            referencedRelation: "users";
            referencedColumns: ["id"];
          },
        ];
      };
    };
    Functions: {
      delete_old_workout_sessions: {
        Args: Record<PropertyKey, never>;
        Returns: undefined;
      };
      gtrgm_compress: {
        Args: { "": unknown };
        Returns: unknown;
      };
      gtrgm_decompress: {
        Args: { "": unknown };
        Returns: unknown;
      };
      gtrgm_in: {
        Args: { "": unknown };
        Returns: unknown;
      };
      gtrgm_options: {
        Args: { "": unknown };
        Returns: undefined;
      };
      gtrgm_out: {
        Args: { "": unknown };
        Returns: unknown;
      };
      set_limit: {
        Args: { "": number };
        Returns: number;
      };
      show_limit: {
        Args: Record<PropertyKey, never>;
        Returns: number;
      };
      show_trgm: {
        Args: { "": string };
        Returns: string[];
      };
    };
    Enums: Record<never, never>;
    CompositeTypes: Record<never, never>;
  };
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">;

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">];

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R;
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] & DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R;
      }
      ? R
      : never
    : never;

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"] | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I;
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I;
      }
      ? I
      : never
    : never;

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"] | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U;
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U;
      }
      ? U
      : never
    : never;

export type Enums<
  DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"] | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never;

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never;

export const Constants = {
  graphql_public: {
    Enums: {},
  },
  public: {
    Enums: {},
  },
} as const;
