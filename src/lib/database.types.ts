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
    PostgrestVersion: "14.1"
  }
  public: {
    Tables: {
      brand_kits: {
        Row: {
          address: string | null
          brand_summary: string | null
          colors: Json | null
          copyright: string | null
          created_at: string
          disclaimers: string | null
          footer: string | null
          icon_logo_url: string | null
          id: string
          kit_name: string
          primary_logo_url: string | null
          socials: Json | null
          tone_of_voice: string | null
          updated_at: string
          user_id: string
          website: string | null
        }
        Insert: {
          address?: string | null
          brand_summary?: string | null
          colors?: Json | null
          copyright?: string | null
          created_at?: string
          disclaimers?: string | null
          footer?: string | null
          icon_logo_url?: string | null
          id?: string
          kit_name?: string
          primary_logo_url?: string | null
          socials?: Json | null
          tone_of_voice?: string | null
          updated_at?: string
          user_id: string
          website?: string | null
        }
        Update: {
          address?: string | null
          brand_summary?: string | null
          colors?: Json | null
          copyright?: string | null
          created_at?: string
          disclaimers?: string | null
          footer?: string | null
          icon_logo_url?: string | null
          id?: string
          kit_name?: string
          primary_logo_url?: string | null
          socials?: Json | null
          tone_of_voice?: string | null
          updated_at?: string
          user_id?: string
          website?: string | null
        }
        Relationships: []
      }
      email_drafts: {
        Row: {
          body_html: string | null
          body_text: string | null
          created_at: string
          delivered_at: string | null
          feedback: string | null
          id: string
          preview_text: string | null
          request_id: string
          status: string | null
          subject_line: string | null
          updated_at: string
          user_id: string
          version: number | null
        }
        Insert: {
          body_html?: string | null
          body_text?: string | null
          created_at?: string
          delivered_at?: string | null
          feedback?: string | null
          id?: string
          preview_text?: string | null
          request_id: string
          status?: string | null
          subject_line?: string | null
          updated_at?: string
          user_id: string
          version?: number | null
        }
        Update: {
          body_html?: string | null
          body_text?: string | null
          created_at?: string
          delivered_at?: string | null
          feedback?: string | null
          id?: string
          preview_text?: string | null
          request_id?: string
          status?: string | null
          subject_line?: string | null
          updated_at?: string
          user_id?: string
          version?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "email_drafts_request_id_fkey"
            columns: ["request_id"]
            isOneToOne: false
            referencedRelation: "email_requests"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "email_drafts_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      email_requests: {
        Row: {
          created_at: string
          deadline: string | null
          goal: string | null
          id: string
          is_rapid_response: boolean | null
          links: string[] | null
          notes: string | null
          status: string | null
          title: string
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          deadline?: string | null
          goal?: string | null
          id?: string
          is_rapid_response?: boolean | null
          links?: string[] | null
          notes?: string | null
          status?: string | null
          title: string
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          deadline?: string | null
          goal?: string | null
          id?: string
          is_rapid_response?: boolean | null
          links?: string[] | null
          notes?: string | null
          status?: string | null
          title?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "email_requests_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          created_at: string
          email: string
          full_name: string | null
          has_rapid_response: boolean | null
          id: string
          onboarding_completed: boolean | null
          organization_name: string | null
          plan: string | null
          platform_tier: string | null
          role: string | null
          stripe_customer_id: string | null
          updated_at: string
          weekly_sends: number | null
        }
        Insert: {
          created_at?: string
          email: string
          full_name?: string | null
          has_rapid_response?: boolean | null
          id: string
          onboarding_completed?: boolean | null
          organization_name?: string | null
          plan?: string | null
          platform_tier?: string | null
          role?: string | null
          stripe_customer_id?: string | null
          updated_at?: string
          weekly_sends?: number | null
        }
        Update: {
          created_at?: string
          email?: string
          full_name?: string | null
          has_rapid_response?: boolean | null
          id?: string
          onboarding_completed?: boolean | null
          organization_name?: string | null
          plan?: string | null
          platform_tier?: string | null
          role?: string | null
          stripe_customer_id?: string | null
          updated_at?: string
          weekly_sends?: number | null
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      [_ in never]: never
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
    Enums: {},
  },
} as const
