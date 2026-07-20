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
    PostgrestVersion: "14.5"
  }
  public: {
    Tables: {
      ai_jobs: {
        Row: {
          completed_at: string | null
          created_at: string
          error: string | null
          id: string
          input: Json
          model: string | null
          module: string
          output: string
          output_data: Json | null
          phase: string | null
          project_id: string | null
          prompt: string
          provider: string
          started_at: string | null
          status: Database["public"]["Enums"]["ai_job_status"]
          updated_at: string
          user_id: string
          workspace_id: string
        }
        Insert: {
          completed_at?: string | null
          created_at?: string
          error?: string | null
          id?: string
          input?: Json
          model?: string | null
          module: string
          output?: string
          output_data?: Json | null
          phase?: string | null
          project_id?: string | null
          prompt: string
          provider?: string
          started_at?: string | null
          status?: Database["public"]["Enums"]["ai_job_status"]
          updated_at?: string
          user_id: string
          workspace_id: string
        }
        Update: {
          completed_at?: string | null
          created_at?: string
          error?: string | null
          id?: string
          input?: Json
          model?: string | null
          module?: string
          output?: string
          output_data?: Json | null
          phase?: string | null
          project_id?: string | null
          prompt?: string
          provider?: string
          started_at?: string | null
          status?: Database["public"]["Enums"]["ai_job_status"]
          updated_at?: string
          user_id?: string
          workspace_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "ai_jobs_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ai_jobs_workspace_id_fkey"
            columns: ["workspace_id"]
            isOneToOne: false
            referencedRelation: "workspaces"
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
      kol_project_shortlist: {
        Row: {
          added_at: string
          added_by: string | null
          id: string
          kol_id: string
          match_breakdown: Json | null
          match_score: number | null
          notes: string | null
          project_id: string
          status: string
          updated_at: string
        }
        Insert: {
          added_at?: string
          added_by?: string | null
          id?: string
          kol_id: string
          match_breakdown?: Json | null
          match_score?: number | null
          notes?: string | null
          project_id: string
          status?: string
          updated_at?: string
        }
        Update: {
          added_at?: string
          added_by?: string | null
          id?: string
          kol_id?: string
          match_breakdown?: Json | null
          match_score?: number | null
          notes?: string | null
          project_id?: string
          status?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "kol_project_shortlist_kol_id_fkey"
            columns: ["kol_id"]
            isOneToOne: false
            referencedRelation: "kols"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "kol_project_shortlist_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
        ]
      }
      kol_snapshots: {
        Row: {
          ai_confidence: Json | null
          fetched_at: string
          id: string
          kol_id: string
          raw_json: Json | null
          raw_markdown: string | null
        }
        Insert: {
          ai_confidence?: Json | null
          fetched_at?: string
          id?: string
          kol_id: string
          raw_json?: Json | null
          raw_markdown?: string | null
        }
        Update: {
          ai_confidence?: Json | null
          fetched_at?: string
          id?: string
          kol_id?: string
          raw_json?: Json | null
          raw_markdown?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "kol_snapshots_kol_id_fkey"
            columns: ["kol_id"]
            isOneToOne: false
            referencedRelation: "kols"
            referencedColumns: ["id"]
          },
        ]
      }
      kols: {
        Row: {
          ai_confidence: Json
          audience_profile: Json
          avatar_url: string | null
          bio: string | null
          contact_note: string | null
          contact_public_email: string | null
          content_types: string[]
          created_at: string
          created_by: string | null
          data_source: string
          display_name: string | null
          embedding: string | null
          followers: number | null
          handle: string
          id: string
          last_crawled_at: string | null
          mentioned_brands: string[]
          platform: string
          popularity_score: number | null
          price_band: Json | null
          primary_categories: string[]
          profile_url: string
          tone: string[]
          updated_at: string
          verified_source: string
          workspace_id: string | null
        }
        Insert: {
          ai_confidence?: Json
          audience_profile?: Json
          avatar_url?: string | null
          bio?: string | null
          contact_note?: string | null
          contact_public_email?: string | null
          content_types?: string[]
          created_at?: string
          created_by?: string | null
          data_source?: string
          display_name?: string | null
          embedding?: string | null
          followers?: number | null
          handle: string
          id?: string
          last_crawled_at?: string | null
          mentioned_brands?: string[]
          platform: string
          popularity_score?: number | null
          price_band?: Json | null
          primary_categories?: string[]
          profile_url: string
          tone?: string[]
          updated_at?: string
          verified_source?: string
          workspace_id?: string | null
        }
        Update: {
          ai_confidence?: Json
          audience_profile?: Json
          avatar_url?: string | null
          bio?: string | null
          contact_note?: string | null
          contact_public_email?: string | null
          content_types?: string[]
          created_at?: string
          created_by?: string | null
          data_source?: string
          display_name?: string | null
          embedding?: string | null
          followers?: number | null
          handle?: string
          id?: string
          last_crawled_at?: string | null
          mentioned_brands?: string[]
          platform?: string
          popularity_score?: number | null
          price_band?: Json | null
          primary_categories?: string[]
          profile_url?: string
          tone?: string[]
          updated_at?: string
          verified_source?: string
          workspace_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "kols_workspace_id_fkey"
            columns: ["workspace_id"]
            isOneToOne: false
            referencedRelation: "workspaces"
            referencedColumns: ["id"]
          },
        ]
      }
      platform_snapshots: {
        Row: {
          captured_at: string
          category: string
          created_at: string
          id: string
          metrics: Json
          platform: string
          query: string
          raw_excerpt: string | null
          source_url: string
        }
        Insert: {
          captured_at?: string
          category: string
          created_at?: string
          id?: string
          metrics?: Json
          platform: string
          query: string
          raw_excerpt?: string | null
          source_url: string
        }
        Update: {
          captured_at?: string
          category?: string
          created_at?: string
          id?: string
          metrics?: Json
          platform?: string
          query?: string
          raw_excerpt?: string | null
          source_url?: string
        }
        Relationships: []
      }
      profiles: {
        Row: {
          avatar_url: string | null
          company: string | null
          created_at: string
          email: string | null
          id: string
          name: string | null
          preferred_language: string
          role: string | null
          theme: string
          updated_at: string
        }
        Insert: {
          avatar_url?: string | null
          company?: string | null
          created_at?: string
          email?: string | null
          id: string
          name?: string | null
          preferred_language?: string
          role?: string | null
          theme?: string
          updated_at?: string
        }
        Update: {
          avatar_url?: string | null
          company?: string | null
          created_at?: string
          email?: string | null
          id?: string
          name?: string | null
          preferred_language?: string
          role?: string | null
          theme?: string
          updated_at?: string
        }
        Relationships: []
      }
      project_checklist: {
        Row: {
          checked: boolean
          checked_at: string | null
          checked_by: string | null
          created_at: string
          id: string
          item_key: string
          label: string
          phase_key: string
          project_id: string
          sort_order: number
          updated_at: string
        }
        Insert: {
          checked?: boolean
          checked_at?: string | null
          checked_by?: string | null
          created_at?: string
          id?: string
          item_key: string
          label: string
          phase_key: string
          project_id: string
          sort_order?: number
          updated_at?: string
        }
        Update: {
          checked?: boolean
          checked_at?: string | null
          checked_by?: string | null
          created_at?: string
          id?: string
          item_key?: string
          label?: string
          phase_key?: string
          project_id?: string
          sort_order?: number
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "project_checklist_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
        ]
      }
      projects: {
        Row: {
          archived_at: string | null
          created_at: string
          created_by: string | null
          deleted_at: string | null
          description: string | null
          id: string
          industry: string | null
          initials: string | null
          knowledge_base: Json
          name: string
          owner_name: string | null
          progress: number
          region: string | null
          stage: Database["public"]["Enums"]["project_stage"]
          stage_progress: Json
          summary: string | null
          target_market: string | null
          updated_at: string
          website: string | null
          workspace_id: string
        }
        Insert: {
          archived_at?: string | null
          created_at?: string
          created_by?: string | null
          deleted_at?: string | null
          description?: string | null
          id?: string
          industry?: string | null
          initials?: string | null
          knowledge_base?: Json
          name: string
          owner_name?: string | null
          progress?: number
          region?: string | null
          stage?: Database["public"]["Enums"]["project_stage"]
          stage_progress?: Json
          summary?: string | null
          target_market?: string | null
          updated_at?: string
          website?: string | null
          workspace_id: string
        }
        Update: {
          archived_at?: string | null
          created_at?: string
          created_by?: string | null
          deleted_at?: string | null
          description?: string | null
          id?: string
          industry?: string | null
          initials?: string | null
          knowledge_base?: Json
          name?: string
          owner_name?: string | null
          progress?: number
          region?: string | null
          stage?: Database["public"]["Enums"]["project_stage"]
          stage_progress?: Json
          summary?: string | null
          target_market?: string | null
          updated_at?: string
          website?: string | null
          workspace_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "projects_workspace_id_fkey"
            columns: ["workspace_id"]
            isOneToOne: false
            referencedRelation: "workspaces"
            referencedColumns: ["id"]
          },
        ]
      }
      reports: {
        Row: {
          created_at: string
          generated_by: string | null
          id: string
          payload: Json
          project_id: string
          status: string
          summary: string | null
          title: string
          type: string
          updated_at: string
          workspace_id: string
        }
        Insert: {
          created_at?: string
          generated_by?: string | null
          id?: string
          payload?: Json
          project_id: string
          status?: string
          summary?: string | null
          title: string
          type?: string
          updated_at?: string
          workspace_id: string
        }
        Update: {
          created_at?: string
          generated_by?: string | null
          id?: string
          payload?: Json
          project_id?: string
          status?: string
          summary?: string | null
          title?: string
          type?: string
          updated_at?: string
          workspace_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "reports_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "reports_workspace_id_fkey"
            columns: ["workspace_id"]
            isOneToOne: false
            referencedRelation: "workspaces"
            referencedColumns: ["id"]
          },
        ]
      }
      subscriptions: {
        Row: {
          cancel_at_period_end: boolean | null
          created_at: string
          current_period_end: string | null
          current_period_start: string | null
          environment: string
          id: string
          paddle_customer_id: string
          paddle_subscription_id: string
          price_id: string
          product_id: string
          status: string
          updated_at: string
          user_id: string
          workspace_id: string | null
        }
        Insert: {
          cancel_at_period_end?: boolean | null
          created_at?: string
          current_period_end?: string | null
          current_period_start?: string | null
          environment?: string
          id?: string
          paddle_customer_id: string
          paddle_subscription_id: string
          price_id: string
          product_id: string
          status?: string
          updated_at?: string
          user_id: string
          workspace_id?: string | null
        }
        Update: {
          cancel_at_period_end?: boolean | null
          created_at?: string
          current_period_end?: string | null
          current_period_start?: string | null
          environment?: string
          id?: string
          paddle_customer_id?: string
          paddle_subscription_id?: string
          price_id?: string
          product_id?: string
          status?: string
          updated_at?: string
          user_id?: string
          workspace_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "subscriptions_workspace_id_fkey"
            columns: ["workspace_id"]
            isOneToOne: false
            referencedRelation: "workspaces"
            referencedColumns: ["id"]
          },
        ]
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
      usage_counters: {
        Row: {
          ai_calls: number
          created_at: string
          id: string
          kol_crawls: number
          period_start: string
          projects_created: number
          semrush_calls: number
          updated_at: string
          workspace_id: string
        }
        Insert: {
          ai_calls?: number
          created_at?: string
          id?: string
          kol_crawls?: number
          period_start: string
          projects_created?: number
          semrush_calls?: number
          updated_at?: string
          workspace_id: string
        }
        Update: {
          ai_calls?: number
          created_at?: string
          id?: string
          kol_crawls?: number
          period_start?: string
          projects_created?: number
          semrush_calls?: number
          updated_at?: string
          workspace_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "usage_counters_workspace_id_fkey"
            columns: ["workspace_id"]
            isOneToOne: false
            referencedRelation: "workspaces"
            referencedColumns: ["id"]
          },
        ]
      }
      workspace_members: {
        Row: {
          email: string
          id: string
          invited_at: string
          joined_at: string | null
          name: string | null
          role: Database["public"]["Enums"]["workspace_role"]
          user_id: string | null
          workspace_id: string
        }
        Insert: {
          email: string
          id?: string
          invited_at?: string
          joined_at?: string | null
          name?: string | null
          role?: Database["public"]["Enums"]["workspace_role"]
          user_id?: string | null
          workspace_id: string
        }
        Update: {
          email?: string
          id?: string
          invited_at?: string
          joined_at?: string | null
          name?: string | null
          role?: Database["public"]["Enums"]["workspace_role"]
          user_id?: string | null
          workspace_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "workspace_members_workspace_id_fkey"
            columns: ["workspace_id"]
            isOneToOne: false
            referencedRelation: "workspaces"
            referencedColumns: ["id"]
          },
        ]
      }
      workspaces: {
        Row: {
          created_at: string
          created_by: string | null
          id: string
          logo_url: string | null
          name: string
          plan: string
          region: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          created_by?: string | null
          id?: string
          logo_url?: string | null
          name: string
          plan?: string
          region?: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          created_by?: string | null
          id?: string
          logo_url?: string | null
          name?: string
          plan?: string
          region?: string
          updated_at?: string
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
      email_queue_dispatch: { Args: never; Returns: undefined }
      enqueue_email: {
        Args: { payload: Json; queue_name: string }
        Returns: number
      }
      get_active_plan: {
        Args: { _env?: string; _user_id: string }
        Returns: string
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
      reap_stale_ai_jobs: { Args: never; Returns: number }
    }
    Enums: {
      ai_job_status: "queued" | "running" | "completed" | "failed" | "cancelled"
      project_stage:
        | "research"
        | "consumer"
        | "localization"
        | "launch"
        | "reports"
        | "completed"
      workspace_role: "owner" | "admin" | "editor" | "viewer"
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
      ai_job_status: ["queued", "running", "completed", "failed", "cancelled"],
      project_stage: [
        "research",
        "consumer",
        "localization",
        "launch",
        "reports",
        "completed",
      ],
      workspace_role: ["owner", "admin", "editor", "viewer"],
    },
  },
} as const
