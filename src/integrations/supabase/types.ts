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
      academy_modules: {
        Row: {
          created_at: string
          created_by: string
          description: string | null
          duration: string | null
          id: string
          is_published: boolean
          pdf_path: string | null
          quiz_data: Json | null
          sort_order: number
          thumbnail_path: string | null
          title: string
          title_en: string | null
          type: string
          updated_at: string
          video_url: string | null
        }
        Insert: {
          created_at?: string
          created_by: string
          description?: string | null
          duration?: string | null
          id?: string
          is_published?: boolean
          pdf_path?: string | null
          quiz_data?: Json | null
          sort_order?: number
          thumbnail_path?: string | null
          title: string
          title_en?: string | null
          type?: string
          updated_at?: string
          video_url?: string | null
        }
        Update: {
          created_at?: string
          created_by?: string
          description?: string | null
          duration?: string | null
          id?: string
          is_published?: boolean
          pdf_path?: string | null
          quiz_data?: Json | null
          sort_order?: number
          thumbnail_path?: string | null
          title?: string
          title_en?: string | null
          type?: string
          updated_at?: string
          video_url?: string | null
        }
        Relationships: []
      }
      academy_progress: {
        Row: {
          completed_at: string
          id: string
          module_id: string
          user_id: string
        }
        Insert: {
          completed_at?: string
          id?: string
          module_id: string
          user_id: string
        }
        Update: {
          completed_at?: string
          id?: string
          module_id?: string
          user_id?: string
        }
        Relationships: []
      }
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
      advisor_client_sync: {
        Row: {
          advisor_user_id: string
          client_user_id: string
          consent_granted_at: string | null
          created_at: string
          id: string
          revoked_at: string | null
          security_log: Json | null
          status: string
          updated_at: string
        }
        Insert: {
          advisor_user_id: string
          client_user_id: string
          consent_granted_at?: string | null
          created_at?: string
          id?: string
          revoked_at?: string | null
          security_log?: Json | null
          status?: string
          updated_at?: string
        }
        Update: {
          advisor_user_id?: string
          client_user_id?: string
          consent_granted_at?: string | null
          created_at?: string
          id?: string
          revoked_at?: string | null
          security_log?: Json | null
          status?: string
          updated_at?: string
        }
        Relationships: []
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
      email_send_log: {
        Row: {
          created_at: string
          error_message: string | null
          id: string
          message_id: string | null
          metadata: Json | null
          recipient_email: string
          status: string
          template_name: string
        }
        Insert: {
          created_at?: string
          error_message?: string | null
          id?: string
          message_id?: string | null
          metadata?: Json | null
          recipient_email: string
          status: string
          template_name: string
        }
        Update: {
          created_at?: string
          error_message?: string | null
          id?: string
          message_id?: string | null
          metadata?: Json | null
          recipient_email?: string
          status?: string
          template_name?: string
        }
        Relationships: []
      }
      email_send_state: {
        Row: {
          auth_email_ttl_minutes: number
          batch_size: number
          id: number
          retry_after_until: string | null
          send_delay_ms: number
          transactional_email_ttl_minutes: number
          updated_at: string
        }
        Insert: {
          auth_email_ttl_minutes?: number
          batch_size?: number
          id?: number
          retry_after_until?: string | null
          send_delay_ms?: number
          transactional_email_ttl_minutes?: number
          updated_at?: string
        }
        Update: {
          auth_email_ttl_minutes?: number
          batch_size?: number
          id?: number
          retry_after_until?: string | null
          send_delay_ms?: number
          transactional_email_ttl_minutes?: number
          updated_at?: string
        }
        Relationships: []
      }
      email_unsubscribe_tokens: {
        Row: {
          created_at: string
          email: string
          id: string
          token: string
          used_at: string | null
        }
        Insert: {
          created_at?: string
          email: string
          id?: string
          token: string
          used_at?: string | null
        }
        Update: {
          created_at?: string
          email?: string
          id?: string
          token?: string
          used_at?: string | null
        }
        Relationships: []
      }
      insurance_clients: {
        Row: {
          agent_id: string
          birth_date: string | null
          city: string | null
          created_at: string
          email: string | null
          full_name: string
          id: string
          id_number: string | null
          notes: string | null
          phone: string | null
          status: string
          updated_at: string
        }
        Insert: {
          agent_id: string
          birth_date?: string | null
          city?: string | null
          created_at?: string
          email?: string | null
          full_name: string
          id?: string
          id_number?: string | null
          notes?: string | null
          phone?: string | null
          status?: string
          updated_at?: string
        }
        Update: {
          agent_id?: string
          birth_date?: string | null
          city?: string | null
          created_at?: string
          email?: string | null
          full_name?: string
          id?: string
          id_number?: string | null
          notes?: string | null
          phone?: string | null
          status?: string
          updated_at?: string
        }
        Relationships: []
      }
      insurance_policies: {
        Row: {
          agent_id: string
          annual_premium: number | null
          client_id: string
          commission_amount: number | null
          commission_rate: number | null
          coverage_amount: number | null
          created_at: string
          end_date: string | null
          id: string
          insurance_company: string | null
          monthly_premium: number | null
          notes: string | null
          policy_number: string | null
          policy_type: string
          start_date: string | null
          status: string
          updated_at: string
        }
        Insert: {
          agent_id: string
          annual_premium?: number | null
          client_id: string
          commission_amount?: number | null
          commission_rate?: number | null
          coverage_amount?: number | null
          created_at?: string
          end_date?: string | null
          id?: string
          insurance_company?: string | null
          monthly_premium?: number | null
          notes?: string | null
          policy_number?: string | null
          policy_type?: string
          start_date?: string | null
          status?: string
          updated_at?: string
        }
        Update: {
          agent_id?: string
          annual_premium?: number | null
          client_id?: string
          commission_amount?: number | null
          commission_rate?: number | null
          coverage_amount?: number | null
          created_at?: string
          end_date?: string | null
          id?: string
          insurance_company?: string | null
          monthly_premium?: number | null
          notes?: string | null
          policy_number?: string | null
          policy_type?: string
          start_date?: string | null
          status?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "insurance_policies_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "insurance_clients"
            referencedColumns: ["id"]
          },
        ]
      }
      leads: {
        Row: {
          ai_analysis: Json | null
          assigned_to: string | null
          client_user_id: string | null
          consultant_id: string | null
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
          ai_analysis?: Json | null
          assigned_to?: string | null
          client_user_id?: string | null
          consultant_id?: string | null
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
          ai_analysis?: Json | null
          assigned_to?: string | null
          client_user_id?: string | null
          consultant_id?: string | null
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
          profession: string
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
          profession?: string
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
          profession?: string
          updated_at?: string
          user_id?: string
          whatsapp_phone?: string | null
        }
        Relationships: []
      }
      suppressed_emails: {
        Row: {
          created_at: string
          email: string
          id: string
          metadata: Json | null
          reason: string
        }
        Insert: {
          created_at?: string
          email: string
          id?: string
          metadata?: Json | null
          reason: string
        }
        Update: {
          created_at?: string
          email?: string
          id?: string
          metadata?: Json | null
          reason?: string
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
      whatsapp_ai_config: {
        Row: {
          id: string
          persona_mode: string
          system_context: string | null
          updated_at: string
          updated_by: string | null
        }
        Insert: {
          id?: string
          persona_mode?: string
          system_context?: string | null
          updated_at?: string
          updated_by?: string | null
        }
        Update: {
          id?: string
          persona_mode?: string
          system_context?: string | null
          updated_at?: string
          updated_by?: string | null
        }
        Relationships: []
      }
      whatsapp_logs: {
        Row: {
          created_at: string
          direction: string
          from_number: string
          id: string
          message_body: string | null
          message_type: string
          metadata: Json | null
          status: string
          to_number: string | null
        }
        Insert: {
          created_at?: string
          direction?: string
          from_number: string
          id?: string
          message_body?: string | null
          message_type?: string
          metadata?: Json | null
          status?: string
          to_number?: string | null
        }
        Update: {
          created_at?: string
          direction?: string
          from_number?: string
          id?: string
          message_body?: string | null
          message_type?: string
          metadata?: Json | null
          status?: string
          to_number?: string | null
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      delete_email: {
        Args: { message_id: number; queue_name: string }
        Returns: boolean
      }
      enqueue_email: {
        Args: { payload: Json; queue_name: string }
        Returns: number
      }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
      move_to_dlq: {
        Args: {
          dlq_name: string
          message_id: number
          payload: Json
          source_queue: string
        }
        Returns: number
      }
      read_email_batch: {
        Args: { batch_size: number; queue_name: string; vt: number }
        Returns: {
          message: Json
          msg_id: number
          read_ct: number
        }[]
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
