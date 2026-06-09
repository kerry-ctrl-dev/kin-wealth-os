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
      alerts: {
        Row: {
          date: string
          id: string
          message: string
          severity: Database["public"]["Enums"]["alert_severity"]
          type: string
          user_id: string
        }
        Insert: {
          date?: string
          id?: string
          message: string
          severity?: Database["public"]["Enums"]["alert_severity"]
          type: string
          user_id: string
        }
        Update: {
          date?: string
          id?: string
          message?: string
          severity?: Database["public"]["Enums"]["alert_severity"]
          type?: string
          user_id?: string
        }
        Relationships: []
      }
      assets: {
        Row: {
          category: Database["public"]["Enums"]["asset_category"]
          created_at: string
          id: string
          invested_at: string | null
          liquidity: number
          name: string
          notes: string | null
          payment_method: string | null
          platform: string | null
          purpose: string | null
          source_income_id: string | null
          transaction_code: string | null
          user_id: string
          value: number
        }
        Insert: {
          category: Database["public"]["Enums"]["asset_category"]
          created_at?: string
          id?: string
          invested_at?: string | null
          liquidity?: number
          name: string
          notes?: string | null
          payment_method?: string | null
          platform?: string | null
          purpose?: string | null
          source_income_id?: string | null
          transaction_code?: string | null
          user_id: string
          value: number
        }
        Update: {
          category?: Database["public"]["Enums"]["asset_category"]
          created_at?: string
          id?: string
          invested_at?: string | null
          liquidity?: number
          name?: string
          notes?: string | null
          payment_method?: string | null
          platform?: string | null
          purpose?: string | null
          source_income_id?: string | null
          transaction_code?: string | null
          user_id?: string
          value?: number
        }
        Relationships: [
          {
            foreignKeyName: "assets_source_income_id_fkey"
            columns: ["source_income_id"]
            isOneToOne: false
            referencedRelation: "income"
            referencedColumns: ["id"]
          },
        ]
      }
      budgets: {
        Row: {
          category: string
          created_at: string
          id: string
          monthly_limit: number
          user_id: string
        }
        Insert: {
          category: string
          created_at?: string
          id?: string
          monthly_limit: number
          user_id: string
        }
        Update: {
          category?: string
          created_at?: string
          id?: string
          monthly_limit?: number
          user_id?: string
        }
        Relationships: []
      }
      documents: {
        Row: {
          category: string | null
          created_at: string
          file_path: string
          id: string
          mime_type: string | null
          name: string
          size_bytes: number | null
          user_id: string
        }
        Insert: {
          category?: string | null
          created_at?: string
          file_path: string
          id?: string
          mime_type?: string | null
          name: string
          size_bytes?: number | null
          user_id: string
        }
        Update: {
          category?: string | null
          created_at?: string
          file_path?: string
          id?: string
          mime_type?: string | null
          name?: string
          size_bytes?: number | null
          user_id?: string
        }
        Relationships: []
      }
      expenses: {
        Row: {
          amount: number
          category: string
          created_at: string
          date: string
          id: string
          method: string | null
          notes: string | null
          user_id: string
        }
        Insert: {
          amount: number
          category: string
          created_at?: string
          date?: string
          id?: string
          method?: string | null
          notes?: string | null
          user_id: string
        }
        Update: {
          amount?: number
          category?: string
          created_at?: string
          date?: string
          id?: string
          method?: string | null
          notes?: string | null
          user_id?: string
        }
        Relationships: []
      }
      goals: {
        Row: {
          created_at: string
          current: number
          deadline: string | null
          id: string
          name: string
          target: number
          user_id: string
        }
        Insert: {
          created_at?: string
          current?: number
          deadline?: string | null
          id?: string
          name: string
          target: number
          user_id: string
        }
        Update: {
          created_at?: string
          current?: number
          deadline?: string | null
          id?: string
          name?: string
          target?: number
          user_id?: string
        }
        Relationships: []
      }
      income: {
        Row: {
          amount: number
          created_at: string
          date: string
          id: string
          source: string
          user_id: string
        }
        Insert: {
          amount: number
          created_at?: string
          date?: string
          id?: string
          source: string
          user_id: string
        }
        Update: {
          amount?: number
          created_at?: string
          date?: string
          id?: string
          source?: string
          user_id?: string
        }
        Relationships: []
      }
      profiles: {
        Row: {
          age: number | null
          avatar_url: string | null
          created_at: string
          employment_status: string | null
          full_name: string | null
          id: string
          investment_experience: string | null
          main_goals: string | null
          monthly_income: number | null
          onboarded: boolean
          phone: string | null
          profession: string | null
          risk_level: string | null
          updated_at: string
        }
        Insert: {
          age?: number | null
          avatar_url?: string | null
          created_at?: string
          employment_status?: string | null
          full_name?: string | null
          id: string
          investment_experience?: string | null
          main_goals?: string | null
          monthly_income?: number | null
          onboarded?: boolean
          phone?: string | null
          profession?: string | null
          risk_level?: string | null
          updated_at?: string
        }
        Update: {
          age?: number | null
          avatar_url?: string | null
          created_at?: string
          employment_status?: string | null
          full_name?: string | null
          id?: string
          investment_experience?: string | null
          main_goals?: string | null
          monthly_income?: number | null
          onboarded?: boolean
          phone?: string | null
          profession?: string | null
          risk_level?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      recurring: {
        Row: {
          active: boolean
          amount: number
          created_at: string
          frequency: string
          id: string
          label: string
          next_run: string
          type: string
          user_id: string
        }
        Insert: {
          active?: boolean
          amount: number
          created_at?: string
          frequency: string
          id?: string
          label: string
          next_run: string
          type: string
          user_id: string
        }
        Update: {
          active?: boolean
          amount?: number
          created_at?: string
          frequency?: string
          id?: string
          label?: string
          next_run?: string
          type?: string
          user_id?: string
        }
        Relationships: []
      }
      reminders: {
        Row: {
          completed: boolean
          created_at: string
          frequency: string
          id: string
          kind: string
          next_due: string
          title: string
          user_id: string
        }
        Insert: {
          completed?: boolean
          created_at?: string
          frequency?: string
          id?: string
          kind?: string
          next_due?: string
          title: string
          user_id: string
        }
        Update: {
          completed?: boolean
          created_at?: string
          frequency?: string
          id?: string
          kind?: string
          next_due?: string
          title?: string
          user_id?: string
        }
        Relationships: []
      }
      snapshots: {
        Row: {
          date: string
          id: string
          liquidity_ratio: number
          risk_level: Database["public"]["Enums"]["risk_level"]
          roi: number
          total_assets: number
          user_id: string
        }
        Insert: {
          date?: string
          id?: string
          liquidity_ratio: number
          risk_level: Database["public"]["Enums"]["risk_level"]
          roi: number
          total_assets: number
          user_id: string
        }
        Update: {
          date?: string
          id?: string
          liquidity_ratio?: number
          risk_level?: Database["public"]["Enums"]["risk_level"]
          roi?: number
          total_assets?: number
          user_id?: string
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
      alert_severity: "INFO" | "WARNING" | "DANGER"
      asset_category: "MMF" | "STOCKS" | "REITS" | "CASH" | "REAL_ESTATE"
      risk_level: "LOW" | "MEDIUM" | "HIGH"
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
      alert_severity: ["INFO", "WARNING", "DANGER"],
      asset_category: ["MMF", "STOCKS", "REITS", "CASH", "REAL_ESTATE"],
      risk_level: ["LOW", "MEDIUM", "HIGH"],
    },
  },
} as const
