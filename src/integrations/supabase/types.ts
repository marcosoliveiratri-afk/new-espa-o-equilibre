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
      clinic_cash_expenses: {
        Row: {
          amount: number
          category: string
          created_at: string
          description: string
          expense_date: string
          id: string
          notes: string | null
          payment_method: string | null
          status: string
        }
        Insert: {
          amount: number
          category: string
          created_at?: string
          description: string
          expense_date?: string
          id?: string
          notes?: string | null
          payment_method?: string | null
          status?: string
        }
        Update: {
          amount?: number
          category?: string
          created_at?: string
          description?: string
          expense_date?: string
          id?: string
          notes?: string | null
          payment_method?: string | null
          status?: string
        }
        Relationships: []
      }
      financial_split_settings: {
        Row: {
          clinic_percentage: number
          id: string
          professor_percentage: number
          updated_at: string
        }
        Insert: {
          clinic_percentage?: number
          id?: string
          professor_percentage?: number
          updated_at?: string
        }
        Update: {
          clinic_percentage?: number
          id?: string
          professor_percentage?: number
          updated_at?: string
        }
        Relationships: []
      }
      physical_assessments: {
        Row: {
          assessment_date: string
          created_at: string
          id: string
          next_assessment_date: string | null
          notes: string | null
          status: string
          student_id: string
        }
        Insert: {
          assessment_date: string
          created_at?: string
          id?: string
          next_assessment_date?: string | null
          notes?: string | null
          status?: string
          student_id: string
        }
        Update: {
          assessment_date?: string
          created_at?: string
          id?: string
          next_assessment_date?: string | null
          notes?: string | null
          status?: string
          student_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "physical_assessments_student_id_fkey"
            columns: ["student_id"]
            isOneToOne: false
            referencedRelation: "students"
            referencedColumns: ["id"]
          },
        ]
      }
      plans: {
        Row: {
          created_at: string
          duration_months: number
          id: string
          name: string
        }
        Insert: {
          created_at?: string
          duration_months: number
          id?: string
          name: string
        }
        Update: {
          created_at?: string
          duration_months?: number
          id?: string
          name?: string
        }
        Relationships: []
      }
      private_lesson_students: {
        Row: {
          active: boolean
          created_at: string
          full_name: string
          id: string
          lesson_date: string | null
          lesson_value: number
          notes: string | null
          phone: string | null
          plan_id: string | null
          teacher_id: string | null
          updated_at: string
        }
        Insert: {
          active?: boolean
          created_at?: string
          full_name: string
          id?: string
          lesson_date?: string | null
          lesson_value?: number
          notes?: string | null
          phone?: string | null
          plan_id?: string | null
          teacher_id?: string | null
          updated_at?: string
        }
        Update: {
          active?: boolean
          created_at?: string
          full_name?: string
          id?: string
          lesson_date?: string | null
          lesson_value?: number
          notes?: string | null
          phone?: string | null
          plan_id?: string | null
          teacher_id?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "private_lesson_students_plan_id_fkey"
            columns: ["plan_id"]
            isOneToOne: false
            referencedRelation: "plans"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "private_lesson_students_teacher_id_fkey"
            columns: ["teacher_id"]
            isOneToOne: false
            referencedRelation: "teachers"
            referencedColumns: ["id"]
          },
        ]
      }
      student_audit_log: {
        Row: {
          action: string
          changed_by: string | null
          created_at: string
          details: Json
          id: string
          student_id: string
        }
        Insert: {
          action: string
          changed_by?: string | null
          created_at?: string
          details?: Json
          id?: string
          student_id: string
        }
        Update: {
          action?: string
          changed_by?: string | null
          created_at?: string
          details?: Json
          id?: string
          student_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "student_audit_log_student_id_fkey"
            columns: ["student_id"]
            isOneToOne: false
            referencedRelation: "students"
            referencedColumns: ["id"]
          },
        ]
      }
      student_contracts: {
        Row: {
          attachment_url: string | null
          created_at: string
          end_date: string
          id: string
          renewed_from_id: string | null
          start_date: string
          status: string
          student_id: string
        }
        Insert: {
          attachment_url?: string | null
          created_at?: string
          end_date: string
          id?: string
          renewed_from_id?: string | null
          start_date: string
          status?: string
          student_id: string
        }
        Update: {
          attachment_url?: string | null
          created_at?: string
          end_date?: string
          id?: string
          renewed_from_id?: string | null
          start_date?: string
          status?: string
          student_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "student_contracts_renewed_from_id_fkey"
            columns: ["renewed_from_id"]
            isOneToOne: false
            referencedRelation: "student_contracts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "student_contracts_student_id_fkey"
            columns: ["student_id"]
            isOneToOne: false
            referencedRelation: "students"
            referencedColumns: ["id"]
          },
        ]
      }
      student_payments: {
        Row: {
          amount: number
          created_at: string
          destination: string
          due_date: string
          id: string
          paid_at: string | null
          payment_method: string | null
          plan_id: string | null
          status: string
          student_id: string
        }
        Insert: {
          amount: number
          created_at?: string
          destination: string
          due_date: string
          id?: string
          paid_at?: string | null
          payment_method?: string | null
          plan_id?: string | null
          status?: string
          student_id: string
        }
        Update: {
          amount?: number
          created_at?: string
          destination?: string
          due_date?: string
          id?: string
          paid_at?: string | null
          payment_method?: string | null
          plan_id?: string | null
          status?: string
          student_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "student_payments_plan_id_fkey"
            columns: ["plan_id"]
            isOneToOne: false
            referencedRelation: "student_plans"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "student_payments_student_id_fkey"
            columns: ["student_id"]
            isOneToOne: false
            referencedRelation: "students"
            referencedColumns: ["id"]
          },
        ]
      }
      student_plans: {
        Row: {
          created_at: string
          due_date: string | null
          id: string
          monthly_value: number
          plan_id: string
          start_date: string
          status: string
          student_id: string
          teacher_id: string | null
        }
        Insert: {
          created_at?: string
          due_date?: string | null
          id?: string
          monthly_value: number
          plan_id: string
          start_date: string
          status?: string
          student_id: string
          teacher_id?: string | null
        }
        Update: {
          created_at?: string
          due_date?: string | null
          id?: string
          monthly_value?: number
          plan_id?: string
          start_date?: string
          status?: string
          student_id?: string
          teacher_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "student_plans_plan_id_fkey"
            columns: ["plan_id"]
            isOneToOne: false
            referencedRelation: "plans"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "student_plans_student_id_fkey"
            columns: ["student_id"]
            isOneToOne: false
            referencedRelation: "students"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "student_plans_teacher_id_fkey"
            columns: ["teacher_id"]
            isOneToOne: false
            referencedRelation: "teachers"
            referencedColumns: ["id"]
          },
        ]
      }
      students: {
        Row: {
          active: boolean
          address: string | null
          birth_date: string | null
          cpf: string | null
          created_at: string
          email: string | null
          full_name: string
          id: string
          notes: string | null
          phone: string | null
          photo_url: string | null
          updated_at: string
          whatsapp: string | null
        }
        Insert: {
          active?: boolean
          address?: string | null
          birth_date?: string | null
          cpf?: string | null
          created_at?: string
          email?: string | null
          full_name: string
          id?: string
          notes?: string | null
          phone?: string | null
          photo_url?: string | null
          updated_at?: string
          whatsapp?: string | null
        }
        Update: {
          active?: boolean
          address?: string | null
          birth_date?: string | null
          cpf?: string | null
          created_at?: string
          email?: string | null
          full_name?: string
          id?: string
          notes?: string | null
          phone?: string | null
          photo_url?: string | null
          updated_at?: string
          whatsapp?: string | null
        }
        Relationships: []
      }
      teacher_financial_entries: {
        Row: {
          amount: number
          created_at: string
          description: string
          entry_date: string
          id: string
          status: string
          teacher_id: string
        }
        Insert: {
          amount: number
          created_at?: string
          description: string
          entry_date?: string
          id?: string
          status?: string
          teacher_id: string
        }
        Update: {
          amount?: number
          created_at?: string
          description?: string
          entry_date?: string
          id?: string
          status?: string
          teacher_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "teacher_financial_entries_teacher_id_fkey"
            columns: ["teacher_id"]
            isOneToOne: false
            referencedRelation: "teachers"
            referencedColumns: ["id"]
          },
        ]
      }
      teacher_financial_reports: {
        Row: {
          created_at: string
          id: string
          month: string
          snapshot: Json
          teacher_id: string | null
          teacher_name: string
          total: number
        }
        Insert: {
          created_at?: string
          id?: string
          month: string
          snapshot?: Json
          teacher_id?: string | null
          teacher_name?: string
          total?: number
        }
        Update: {
          created_at?: string
          id?: string
          month?: string
          snapshot?: Json
          teacher_id?: string | null
          teacher_name?: string
          total?: number
        }
        Relationships: []
      }
      teachers: {
        Row: {
          active: boolean
          created_at: string
          email: string | null
          id: string
          name: string
          phone: string | null
        }
        Insert: {
          active?: boolean
          created_at?: string
          email?: string | null
          id?: string
          name: string
          phone?: string | null
        }
        Update: {
          active?: boolean
          created_at?: string
          email?: string | null
          id?: string
          name?: string
          phone?: string | null
        }
        Relationships: []
      }
      trial_classes: {
        Row: {
          class_date: string | null
          created_at: string
          full_name: string
          id: string
          notes: string | null
          phone: string | null
          plan_id: string | null
          status: string
          teacher_id: string | null
        }
        Insert: {
          class_date?: string | null
          created_at?: string
          full_name: string
          id?: string
          notes?: string | null
          phone?: string | null
          plan_id?: string | null
          status?: string
          teacher_id?: string | null
        }
        Update: {
          class_date?: string | null
          created_at?: string
          full_name?: string
          id?: string
          notes?: string | null
          phone?: string | null
          plan_id?: string | null
          status?: string
          teacher_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "trial_classes_plan_id_fkey"
            columns: ["plan_id"]
            isOneToOne: false
            referencedRelation: "plans"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "trial_classes_teacher_id_fkey"
            columns: ["teacher_id"]
            isOneToOne: false
            referencedRelation: "teachers"
            referencedColumns: ["id"]
          },
        ]
      }
      whatsapp_message_templates: {
        Row: {
          active: boolean
          body: string
          id: string
          key: string
          title: string
          updated_at: string
        }
        Insert: {
          active?: boolean
          body: string
          id?: string
          key: string
          title: string
          updated_at?: string
        }
        Update: {
          active?: boolean
          body?: string
          id?: string
          key?: string
          title?: string
          updated_at?: string
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
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never) = never,
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
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
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
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
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
  EnumName extends (DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never) = never,
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
  CompositeTypeName extends (PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never) = never,
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
