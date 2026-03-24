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
    PostgrestVersion: "14.4"
  }
  public: {
    Tables: {
      activity_log: {
        Row: {
          activity_type: string
          created_at: string
          description: string | null
          id: string
          lead_id: string
          metadata: Json | null
          title: string
          user_id: string
        }
        Insert: {
          activity_type: string
          created_at?: string
          description?: string | null
          id?: string
          lead_id: string
          metadata?: Json | null
          title: string
          user_id: string
        }
        Update: {
          activity_type?: string
          created_at?: string
          description?: string | null
          id?: string
          lead_id?: string
          metadata?: Json | null
          title?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "activity_log_lead_id_fkey"
            columns: ["lead_id"]
            isOneToOne: false
            referencedRelation: "leads"
            referencedColumns: ["id"]
          },
        ]
      }
      call_logs: {
        Row: {
          action_items: Json | null
          ai_summary: Json | null
          created_at: string
          duration_seconds: number
          id: string
          lead_id: string
          next_step: string | null
          notes: string | null
          sentiment: string | null
          status: string
          user_id: string
        }
        Insert: {
          action_items?: Json | null
          ai_summary?: Json | null
          created_at?: string
          duration_seconds?: number
          id?: string
          lead_id: string
          next_step?: string | null
          notes?: string | null
          sentiment?: string | null
          status?: string
          user_id: string
        }
        Update: {
          action_items?: Json | null
          ai_summary?: Json | null
          created_at?: string
          duration_seconds?: number
          id?: string
          lead_id?: string
          next_step?: string | null
          notes?: string | null
          sentiment?: string | null
          status?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "call_logs_lead_id_fkey"
            columns: ["lead_id"]
            isOneToOne: false
            referencedRelation: "leads"
            referencedColumns: ["id"]
          },
        ]
      }
      case_checklist: {
        Row: {
          case_id: string
          completed_at: string | null
          created_at: string
          description: string | null
          due_date: string | null
          id: string
          is_completed: boolean | null
          is_critical: boolean | null
          sort_order: number | null
          title: string
        }
        Insert: {
          case_id: string
          completed_at?: string | null
          created_at?: string
          description?: string | null
          due_date?: string | null
          id?: string
          is_completed?: boolean | null
          is_critical?: boolean | null
          sort_order?: number | null
          title: string
        }
        Update: {
          case_id?: string
          completed_at?: string | null
          created_at?: string
          description?: string | null
          due_date?: string | null
          id?: string
          is_completed?: boolean | null
          is_critical?: boolean | null
          sort_order?: number | null
          title?: string
        }
        Relationships: [
          {
            foreignKeyName: "case_checklist_case_id_fkey"
            columns: ["case_id"]
            isOneToOne: false
            referencedRelation: "client_cases"
            referencedColumns: ["id"]
          },
        ]
      }
      case_reminders: {
        Row: {
          case_id: string
          created_at: string
          description: string | null
          id: string
          is_done: boolean | null
          remind_at: string
          reminder_type: string | null
          title: string
        }
        Insert: {
          case_id: string
          created_at?: string
          description?: string | null
          id?: string
          is_done?: boolean | null
          remind_at: string
          reminder_type?: string | null
          title: string
        }
        Update: {
          case_id?: string
          created_at?: string
          description?: string | null
          id?: string
          is_done?: boolean | null
          remind_at?: string
          reminder_type?: string | null
          title?: string
        }
        Relationships: [
          {
            foreignKeyName: "case_reminders_case_id_fkey"
            columns: ["case_id"]
            isOneToOne: false
            referencedRelation: "client_cases"
            referencedColumns: ["id"]
          },
        ]
      }
      case_timeline: {
        Row: {
          case_id: string
          created_at: string
          created_by: string | null
          description: string | null
          event_type: string
          id: string
          metadata: Json | null
          title: string
        }
        Insert: {
          case_id: string
          created_at?: string
          created_by?: string | null
          description?: string | null
          event_type: string
          id?: string
          metadata?: Json | null
          title: string
        }
        Update: {
          case_id?: string
          created_at?: string
          created_by?: string | null
          description?: string | null
          event_type?: string
          id?: string
          metadata?: Json | null
          title?: string
        }
        Relationships: [
          {
            foreignKeyName: "case_timeline_case_id_fkey"
            columns: ["case_id"]
            isOneToOne: false
            referencedRelation: "client_cases"
            referencedColumns: ["id"]
          },
        ]
      }
      client_cases: {
        Row: {
          consultant_id: string
          created_at: string
          current_stage: string
          id: string
          lead_id: string
          notes_internal: string | null
          stages_completed: string[] | null
          status: string
          target_close_date: string | null
          updated_at: string
        }
        Insert: {
          consultant_id: string
          created_at?: string
          current_stage?: string
          id?: string
          lead_id: string
          notes_internal?: string | null
          stages_completed?: string[] | null
          status?: string
          target_close_date?: string | null
          updated_at?: string
        }
        Update: {
          consultant_id?: string
          created_at?: string
          current_stage?: string
          id?: string
          lead_id?: string
          notes_internal?: string | null
          stages_completed?: string[] | null
          status?: string
          target_close_date?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "client_cases_lead_id_fkey"
            columns: ["lead_id"]
            isOneToOne: false
            referencedRelation: "leads"
            referencedColumns: ["id"]
          },
        ]
      }
      consultant_reviews: {
        Row: {
          comment: string | null
          consultant_id: string
          created_at: string
          id: string
          is_verified: boolean | null
          lead_id: string
          rating: number
          reviewer_name: string
        }
        Insert: {
          comment?: string | null
          consultant_id: string
          created_at?: string
          id?: string
          is_verified?: boolean | null
          lead_id: string
          rating: number
          reviewer_name: string
        }
        Update: {
          comment?: string | null
          consultant_id?: string
          created_at?: string
          id?: string
          is_verified?: boolean | null
          lead_id?: string
          rating?: number
          reviewer_name?: string
        }
        Relationships: [
          {
            foreignKeyName: "consultant_reviews_lead_id_fkey"
            columns: ["lead_id"]
            isOneToOne: false
            referencedRelation: "leads"
            referencedColumns: ["id"]
          },
        ]
      }
      documents: {
        Row: {
          classification: string | null
          consultant_id: string | null
          created_at: string
          extracted_data: Json | null
          file_name: string
          file_path: string
          file_size: number
          file_type: string
          id: string
          lead_id: string | null
          risk_flags: Json | null
          updated_at: string
          uploaded_by: string
        }
        Insert: {
          classification?: string | null
          consultant_id?: string | null
          created_at?: string
          extracted_data?: Json | null
          file_name: string
          file_path: string
          file_size?: number
          file_type: string
          id?: string
          lead_id?: string | null
          risk_flags?: Json | null
          updated_at?: string
          uploaded_by: string
        }
        Update: {
          classification?: string | null
          consultant_id?: string | null
          created_at?: string
          extracted_data?: Json | null
          file_name?: string
          file_path?: string
          file_size?: number
          file_type?: string
          id?: string
          lead_id?: string | null
          risk_flags?: Json | null
          updated_at?: string
          uploaded_by?: string
        }
        Relationships: [
          {
            foreignKeyName: "documents_lead_id_fkey"
            columns: ["lead_id"]
            isOneToOne: false
            referencedRelation: "leads"
            referencedColumns: ["id"]
          },
        ]
      }
      leads: {
        Row: {
          assigned_to: string | null
          client_user_id: string | null
          consultant_id: string
          created_at: string
          email: string | null
          full_name: string
          id: string
          is_marketplace: boolean | null
          last_contact: string | null
          lead_score: number | null
          lead_source: string | null
          marketing_consent: boolean | null
          monthly_income: number | null
          mortgage_amount: number | null
          next_step: string | null
          notes: string | null
          phone: string | null
          property_value: number | null
          sign_token: string | null
          signature_url: string | null
          signed_at: string | null
          status: Database["public"]["Enums"]["lead_status"]
          updated_at: string
        }
        Insert: {
          assigned_to?: string | null
          client_user_id?: string | null
          consultant_id: string
          created_at?: string
          email?: string | null
          full_name: string
          id?: string
          is_marketplace?: boolean | null
          last_contact?: string | null
          lead_score?: number | null
          lead_source?: string | null
          marketing_consent?: boolean | null
          monthly_income?: number | null
          mortgage_amount?: number | null
          next_step?: string | null
          notes?: string | null
          phone?: string | null
          property_value?: number | null
          sign_token?: string | null
          signature_url?: string | null
          signed_at?: string | null
          status?: Database["public"]["Enums"]["lead_status"]
          updated_at?: string
        }
        Update: {
          assigned_to?: string | null
          client_user_id?: string | null
          consultant_id?: string
          created_at?: string
          email?: string | null
          full_name?: string
          id?: string
          is_marketplace?: boolean | null
          last_contact?: string | null
          lead_score?: number | null
          lead_source?: string | null
          marketing_consent?: boolean | null
          monthly_income?: number | null
          mortgage_amount?: number | null
          next_step?: string | null
          notes?: string | null
          phone?: string | null
          property_value?: number | null
          sign_token?: string | null
          signature_url?: string | null
          signed_at?: string | null
          status?: Database["public"]["Enums"]["lead_status"]
          updated_at?: string
        }
        Relationships: []
      }
      notifications: {
        Row: {
          body: string | null
          created_at: string
          id: string
          link: string | null
          read: boolean
          title: string
          type: string
          user_id: string
        }
        Insert: {
          body?: string | null
          created_at?: string
          id?: string
          link?: string | null
          read?: boolean
          title: string
          type?: string
          user_id: string
        }
        Update: {
          body?: string | null
          created_at?: string
          id?: string
          link?: string | null
          read?: boolean
          title?: string
          type?: string
          user_id?: string
        }
        Relationships: []
      }
      profiles: {
        Row: {
          business_type: string
          created_at: string
          email: string | null
          full_name: string | null
          id: string
          lead_count: number
          logo_url: string | null
          phone: string | null
          plan: string
          updated_at: string
          user_id: string
          whatsapp_phone: string | null
        }
        Insert: {
          business_type?: string
          created_at?: string
          email?: string | null
          full_name?: string | null
          id?: string
          lead_count?: number
          logo_url?: string | null
          phone?: string | null
          plan?: string
          updated_at?: string
          user_id: string
          whatsapp_phone?: string | null
        }
        Update: {
          business_type?: string
          created_at?: string
          email?: string | null
          full_name?: string | null
          id?: string
          lead_count?: number
          logo_url?: string | null
          phone?: string | null
          plan?: string
          updated_at?: string
          user_id?: string
          whatsapp_phone?: string | null
        }
        Relationships: []
      }
      team_members: {
        Row: {
          created_at: string
          department: string | null
          id: string
          role: string
          team_id: string
          user_id: string
        }
        Insert: {
          created_at?: string
          department?: string | null
          id?: string
          role?: string
          team_id: string
          user_id: string
        }
        Update: {
          created_at?: string
          department?: string | null
          id?: string
          role?: string
          team_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "team_members_team_id_fkey"
            columns: ["team_id"]
            isOneToOne: false
            referencedRelation: "teams"
            referencedColumns: ["id"]
          },
        ]
      }
      team_messages: {
        Row: {
          content: string
          created_at: string
          id: string
          team_id: string
          user_id: string
        }
        Insert: {
          content: string
          created_at?: string
          id?: string
          team_id: string
          user_id: string
        }
        Update: {
          content?: string
          created_at?: string
          id?: string
          team_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "team_messages_team_id_fkey"
            columns: ["team_id"]
            isOneToOne: false
            referencedRelation: "teams"
            referencedColumns: ["id"]
          },
        ]
      }
      teams: {
        Row: {
          created_at: string
          id: string
          name: string
          owner_id: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          id?: string
          name: string
          owner_id: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          id?: string
          name?: string
          owner_id?: string
          updated_at?: string
        }
        Relationships: []
      }
      user_roles: {
        Row: {
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          id?: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
    }
    Enums: {
      app_role: "consultant" | "client" | "admin"
      lead_status:
        | "new"
        | "contacted"
        | "in_progress"
        | "submitted"
        | "approved"
        | "rejected"
        | "closed"
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
      app_role: ["consultant", "client", "admin"],
      lead_status: [
        "new",
        "contacted",
        "in_progress",
        "submitted",
        "approved",
        "rejected",
        "closed",
      ],
    },
  },
} as const
