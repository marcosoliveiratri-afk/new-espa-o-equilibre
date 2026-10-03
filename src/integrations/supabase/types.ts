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
          module_id: string | null
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
          module_id?: string | null
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
          module_id?: string | null
          notes?: string | null
          payment_method?: string | null
          status?: string
        }
        Relationships: [
          {
            foreignKeyName: "clinic_cash_expenses_module_id_fkey"
            columns: ["module_id"]
            isOneToOne: false
            referencedRelation: "service_modules"
            referencedColumns: ["id"]
          },
        ]
      }
      financial_split_settings: {
        Row: {
          clinic_percentage: number
          id: string
          module_id: string | null
          professor_percentage: number
          updated_at: string
        }
        Insert: {
          clinic_percentage?: number
          id?: string
          module_id?: string | null
          professor_percentage?: number
          updated_at?: string
        }
        Update: {
          clinic_percentage?: number
          id?: string
          module_id?: string | null
          professor_percentage?: number
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "financial_split_settings_module_id_fkey"
            columns: ["module_id"]
            isOneToOne: false
            referencedRelation: "service_modules"
            referencedColumns: ["id"]
          },
        ]
      }
      oficina_aluno_planos: {
        Row: {
          agreed_value: number
          aluno_id: string
          created_at: string
          destination: string | null
          due_day: number | null
          end_date: string | null
          id: string
          payment_method: string | null
          plano_id: string
          professor_id: string | null
          start_date: string
          status: string
          updated_at: string
        }
        Insert: {
          agreed_value?: number
          aluno_id: string
          created_at?: string
          destination?: string | null
          due_day?: number | null
          end_date?: string | null
          id?: string
          payment_method?: string | null
          plano_id: string
          professor_id?: string | null
          start_date: string
          status?: string
          updated_at?: string
        }
        Update: {
          agreed_value?: number
          aluno_id?: string
          created_at?: string
          destination?: string | null
          due_day?: number | null
          end_date?: string | null
          id?: string
          payment_method?: string | null
          plano_id?: string
          professor_id?: string | null
          start_date?: string
          status?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "oficina_aluno_planos_aluno_id_fkey"
            columns: ["aluno_id"]
            isOneToOne: false
            referencedRelation: "oficina_alunos"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "oficina_aluno_planos_plano_id_fkey"
            columns: ["plano_id"]
            isOneToOne: false
            referencedRelation: "oficina_planos"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "oficina_aluno_planos_professor_id_fkey"
            columns: ["professor_id"]
            isOneToOne: false
            referencedRelation: "oficina_professores"
            referencedColumns: ["id"]
          },
        ]
      }
      oficina_alunos: {
        Row: {
          active: boolean
          address: string | null
          age: number | null
          birth_date: string | null
          cpf: string | null
          created_at: string
          email: string | null
          full_name: string
          id: string
          notes: string | null
          phone: string | null
          responsible_name: string | null
          updated_at: string
          whatsapp: string | null
        }
        Insert: {
          active?: boolean
          address?: string | null
          age?: number | null
          birth_date?: string | null
          cpf?: string | null
          created_at?: string
          email?: string | null
          full_name: string
          id?: string
          notes?: string | null
          phone?: string | null
          responsible_name?: string | null
          updated_at?: string
          whatsapp?: string | null
        }
        Update: {
          active?: boolean
          address?: string | null
          age?: number | null
          birth_date?: string | null
          cpf?: string | null
          created_at?: string
          email?: string | null
          full_name?: string
          id?: string
          notes?: string | null
          phone?: string | null
          responsible_name?: string | null
          updated_at?: string
          whatsapp?: string | null
        }
        Relationships: []
      }
      oficina_aulas: {
        Row: {
          aula_date: string
          created_at: string
          duration_minutes: number
          hourly_rate: number
          id: string
          notes: string | null
          professor_id: string | null
          realized_at: string | null
          start_time: string
          status: string
          teacher_amount: number | null
          teacher_name: string
          turma_id: string
          turma_name: string | null
          updated_at: string
        }
        Insert: {
          aula_date: string
          created_at?: string
          duration_minutes: number
          hourly_rate?: number
          id?: string
          notes?: string | null
          professor_id?: string | null
          realized_at?: string | null
          start_time: string
          status?: string
          teacher_amount?: number | null
          teacher_name: string
          turma_id: string
          turma_name?: string | null
          updated_at?: string
        }
        Update: {
          aula_date?: string
          created_at?: string
          duration_minutes?: number
          hourly_rate?: number
          id?: string
          notes?: string | null
          professor_id?: string | null
          realized_at?: string | null
          start_time?: string
          status?: string
          teacher_amount?: number | null
          teacher_name?: string
          turma_id?: string
          turma_name?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "oficina_aulas_professor_id_fkey"
            columns: ["professor_id"]
            isOneToOne: false
            referencedRelation: "oficina_professores"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "oficina_aulas_turma_id_fkey"
            columns: ["turma_id"]
            isOneToOne: false
            referencedRelation: "oficina_turmas"
            referencedColumns: ["id"]
          },
        ]
      }
      oficina_despesas: {
        Row: {
          amount: number
          category: string | null
          created_at: string
          description: string
          expense_date: string
          id: string
          notes: string | null
          payment_method: string | null
        }
        Insert: {
          amount: number
          category?: string | null
          created_at?: string
          description: string
          expense_date?: string
          id?: string
          notes?: string | null
          payment_method?: string | null
        }
        Update: {
          amount?: number
          category?: string | null
          created_at?: string
          description?: string
          expense_date?: string
          id?: string
          notes?: string | null
          payment_method?: string | null
        }
        Relationships: []
      }
      oficina_fechamentos: {
        Row: {
          closed_at: string | null
          created_at: string
          id: string
          notes: string | null
          reference_month: string
          status: string
          total_despesas: number
          total_professores: number
          total_receitas: number
          updated_at: string
        }
        Insert: {
          closed_at?: string | null
          created_at?: string
          id?: string
          notes?: string | null
          reference_month: string
          status?: string
          total_despesas?: number
          total_professores?: number
          total_receitas?: number
          updated_at?: string
        }
        Update: {
          closed_at?: string | null
          created_at?: string
          id?: string
          notes?: string | null
          reference_month?: string
          status?: string
          total_despesas?: number
          total_professores?: number
          total_receitas?: number
          updated_at?: string
        }
        Relationships: []
      }
      oficina_pagamentos: {
        Row: {
          aluno_plano_id: string
          amount: number
          created_at: string
          destination: string | null
          due_date: string
          id: string
          notes: string | null
          paid_at: string | null
          payment_method: string | null
          status: string
          updated_at: string
        }
        Insert: {
          aluno_plano_id: string
          amount?: number
          created_at?: string
          destination?: string | null
          due_date: string
          id?: string
          notes?: string | null
          paid_at?: string | null
          payment_method?: string | null
          status?: string
          updated_at?: string
        }
        Update: {
          aluno_plano_id?: string
          amount?: number
          created_at?: string
          destination?: string | null
          due_date?: string
          id?: string
          notes?: string | null
          paid_at?: string | null
          payment_method?: string | null
          status?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "oficina_pagamentos_aluno_plano_id_fkey"
            columns: ["aluno_plano_id"]
            isOneToOne: false
            referencedRelation: "oficina_aluno_planos"
            referencedColumns: ["id"]
          },
        ]
      }
      oficina_planos: {
        Row: {
          active: boolean
          created_at: string
          description: string | null
          duration_months: number
          id: string
          monthly_value: number
          name: string
          payment_method: string | null
          total_value: number
          updated_at: string
        }
        Insert: {
          active?: boolean
          created_at?: string
          description?: string | null
          duration_months: number
          id?: string
          monthly_value?: number
          name: string
          payment_method?: string | null
          total_value?: number
          updated_at?: string
        }
        Update: {
          active?: boolean
          created_at?: string
          description?: string | null
          duration_months?: number
          id?: string
          monthly_value?: number
          name?: string
          payment_method?: string | null
          total_value?: number
          updated_at?: string
        }
        Relationships: []
      }
      oficina_professores: {
        Row: {
          active: boolean
          created_at: string
          email: string | null
          id: string
          name: string
          notes: string | null
          phone: string | null
          updated_at: string
        }
        Insert: {
          active?: boolean
          created_at?: string
          email?: string | null
          id?: string
          name: string
          notes?: string | null
          phone?: string | null
          updated_at?: string
        }
        Update: {
          active?: boolean
          created_at?: string
          email?: string | null
          id?: string
          name?: string
          notes?: string | null
          phone?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      oficina_turma_alunos: {
        Row: {
          active: boolean
          aluno_id: string
          joined_at: string
          left_at: string | null
          turma_id: string
        }
        Insert: {
          active?: boolean
          aluno_id: string
          joined_at?: string
          left_at?: string | null
          turma_id: string
        }
        Update: {
          active?: boolean
          aluno_id?: string
          joined_at?: string
          left_at?: string | null
          turma_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "oficina_turma_alunos_aluno_id_fkey"
            columns: ["aluno_id"]
            isOneToOne: false
            referencedRelation: "oficina_alunos"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "oficina_turma_alunos_turma_id_fkey"
            columns: ["turma_id"]
            isOneToOne: false
            referencedRelation: "oficina_turmas"
            referencedColumns: ["id"]
          },
        ]
      }
      oficina_turmas: {
        Row: {
          active: boolean
          created_at: string
          duration_minutes: number
          hourly_rate: number
          id: string
          name: string
          professor_id: string | null
          start_time: string
          teacher_name: string
          updated_at: string
          weekday: number
        }
        Insert: {
          active?: boolean
          created_at?: string
          duration_minutes: number
          hourly_rate?: number
          id?: string
          name: string
          professor_id?: string | null
          start_time: string
          teacher_name: string
          updated_at?: string
          weekday: number
        }
        Update: {
          active?: boolean
          created_at?: string
          duration_minutes?: number
          hourly_rate?: number
          id?: string
          name?: string
          professor_id?: string | null
          start_time?: string
          teacher_name?: string
          updated_at?: string
          weekday?: number
        }
        Relationships: [
          {
            foreignKeyName: "oficina_turmas_professor_id_fkey"
            columns: ["professor_id"]
            isOneToOne: false
            referencedRelation: "oficina_professores"
            referencedColumns: ["id"]
          },
        ]
      }
      physical_assessments: {
        Row: {
          assessment_date: string
          created_at: string
          id: string
          module_id: string | null
          next_assessment_date: string | null
          notes: string | null
          status: string
          student_id: string
        }
        Insert: {
          assessment_date: string
          created_at?: string
          id?: string
          module_id?: string | null
          next_assessment_date?: string | null
          notes?: string | null
          status?: string
          student_id: string
        }
        Update: {
          assessment_date?: string
          created_at?: string
          id?: string
          module_id?: string | null
          next_assessment_date?: string | null
          notes?: string | null
          status?: string
          student_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "physical_assessments_module_id_fkey"
            columns: ["module_id"]
            isOneToOne: false
            referencedRelation: "service_modules"
            referencedColumns: ["id"]
          },
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
          duration_months: number | null
          id: string
          module_id: string | null
          name: string
        }
        Insert: {
          created_at?: string
          duration_months?: number | null
          id?: string
          module_id?: string | null
          name: string
        }
        Update: {
          created_at?: string
          duration_months?: number | null
          id?: string
          module_id?: string | null
          name?: string
        }
        Relationships: [
          {
            foreignKeyName: "plans_module_id_fkey"
            columns: ["module_id"]
            isOneToOne: false
            referencedRelation: "service_modules"
            referencedColumns: ["id"]
          },
        ]
      }
      private_lesson_students: {
        Row: {
          active: boolean
          created_at: string
          destination: string
          full_name: string
          id: string
          lesson_date: string | null
          lesson_value: number
          module_id: string | null
          notes: string | null
          paid: boolean
          paid_at: string | null
          payment_method: string | null
          phone: string | null
          plan_id: string | null
          teacher_id: string | null
          updated_at: string
        }
        Insert: {
          active?: boolean
          created_at?: string
          destination?: string
          full_name: string
          id?: string
          lesson_date?: string | null
          lesson_value?: number
          module_id?: string | null
          notes?: string | null
          paid?: boolean
          paid_at?: string | null
          payment_method?: string | null
          phone?: string | null
          plan_id?: string | null
          teacher_id?: string | null
          updated_at?: string
        }
        Update: {
          active?: boolean
          created_at?: string
          destination?: string
          full_name?: string
          id?: string
          lesson_date?: string | null
          lesson_value?: number
          module_id?: string | null
          notes?: string | null
          paid?: boolean
          paid_at?: string | null
          payment_method?: string | null
          phone?: string | null
          plan_id?: string | null
          teacher_id?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "private_lesson_students_module_id_fkey"
            columns: ["module_id"]
            isOneToOne: false
            referencedRelation: "service_modules"
            referencedColumns: ["id"]
          },
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
      service_modules: {
        Row: {
          active: boolean
          created_at: string
          id: string
          key: string
          name: string
        }
        Insert: {
          active?: boolean
          created_at?: string
          id?: string
          key: string
          name: string
        }
        Update: {
          active?: boolean
          created_at?: string
          id?: string
          key?: string
          name?: string
        }
        Relationships: []
      }
      student_audit_log: {
        Row: {
          action: string
          changed_by: string | null
          created_at: string
          details: Json
          id: string
          module_id: string | null
          student_id: string
        }
        Insert: {
          action: string
          changed_by?: string | null
          created_at?: string
          details?: Json
          id?: string
          module_id?: string | null
          student_id: string
        }
        Update: {
          action?: string
          changed_by?: string | null
          created_at?: string
          details?: Json
          id?: string
          module_id?: string | null
          student_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "student_audit_log_module_id_fkey"
            columns: ["module_id"]
            isOneToOne: false
            referencedRelation: "service_modules"
            referencedColumns: ["id"]
          },
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
          module_id: string | null
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
          module_id?: string | null
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
          module_id?: string | null
          renewed_from_id?: string | null
          start_date?: string
          status?: string
          student_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "student_contracts_module_id_fkey"
            columns: ["module_id"]
            isOneToOne: false
            referencedRelation: "service_modules"
            referencedColumns: ["id"]
          },
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
          module_id: string | null
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
          module_id?: string | null
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
          module_id?: string | null
          paid_at?: string | null
          payment_method?: string | null
          plan_id?: string | null
          status?: string
          student_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "student_payments_module_id_fkey"
            columns: ["module_id"]
            isOneToOne: false
            referencedRelation: "service_modules"
            referencedColumns: ["id"]
          },
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
          module_id: string | null
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
          module_id?: string | null
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
          module_id?: string | null
          monthly_value?: number
          plan_id?: string
          start_date?: string
          status?: string
          student_id?: string
          teacher_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "student_plans_module_id_fkey"
            columns: ["module_id"]
            isOneToOne: false
            referencedRelation: "service_modules"
            referencedColumns: ["id"]
          },
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
          module_id: string | null
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
          module_id?: string | null
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
          module_id?: string | null
          notes?: string | null
          phone?: string | null
          photo_url?: string | null
          updated_at?: string
          whatsapp?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "students_module_id_fkey"
            columns: ["module_id"]
            isOneToOne: false
            referencedRelation: "service_modules"
            referencedColumns: ["id"]
          },
        ]
      }
      teacher_financial_entries: {
        Row: {
          amount: number
          created_at: string
          description: string
          destination: string
          entry_date: string
          id: string
          module_id: string | null
          status: string
          teacher_id: string
        }
        Insert: {
          amount: number
          created_at?: string
          description: string
          destination?: string
          entry_date?: string
          id?: string
          module_id?: string | null
          status?: string
          teacher_id: string
        }
        Update: {
          amount?: number
          created_at?: string
          description?: string
          destination?: string
          entry_date?: string
          id?: string
          module_id?: string | null
          status?: string
          teacher_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "teacher_financial_entries_module_id_fkey"
            columns: ["module_id"]
            isOneToOne: false
            referencedRelation: "service_modules"
            referencedColumns: ["id"]
          },
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
          module_id: string | null
          month: string
          snapshot: Json
          teacher_id: string | null
          teacher_name: string
          total: number
        }
        Insert: {
          created_at?: string
          id?: string
          module_id?: string | null
          month: string
          snapshot?: Json
          teacher_id?: string | null
          teacher_name?: string
          total?: number
        }
        Update: {
          created_at?: string
          id?: string
          module_id?: string | null
          month?: string
          snapshot?: Json
          teacher_id?: string | null
          teacher_name?: string
          total?: number
        }
        Relationships: [
          {
            foreignKeyName: "teacher_financial_reports_module_id_fkey"
            columns: ["module_id"]
            isOneToOne: false
            referencedRelation: "service_modules"
            referencedColumns: ["id"]
          },
        ]
      }
      teachers: {
        Row: {
          active: boolean
          created_at: string
          email: string | null
          id: string
          module_id: string | null
          name: string
          phone: string | null
        }
        Insert: {
          active?: boolean
          created_at?: string
          email?: string | null
          id?: string
          module_id?: string | null
          name: string
          phone?: string | null
        }
        Update: {
          active?: boolean
          created_at?: string
          email?: string | null
          id?: string
          module_id?: string | null
          name?: string
          phone?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "teachers_module_id_fkey"
            columns: ["module_id"]
            isOneToOne: false
            referencedRelation: "service_modules"
            referencedColumns: ["id"]
          },
        ]
      }
      trial_classes: {
        Row: {
          class_date: string | null
          created_at: string
          full_name: string
          id: string
          module_id: string | null
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
          module_id?: string | null
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
          module_id?: string | null
          notes?: string | null
          phone?: string | null
          plan_id?: string | null
          status?: string
          teacher_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "trial_classes_module_id_fkey"
            columns: ["module_id"]
            isOneToOne: false
            referencedRelation: "service_modules"
            referencedColumns: ["id"]
          },
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
          module_id: string | null
          title: string
          updated_at: string
        }
        Insert: {
          active?: boolean
          body: string
          id?: string
          key: string
          module_id?: string | null
          title: string
          updated_at?: string
        }
        Update: {
          active?: boolean
          body?: string
          id?: string
          key?: string
          module_id?: string | null
          title?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "whatsapp_message_templates_module_id_fkey"
            columns: ["module_id"]
            isOneToOne: false
            referencedRelation: "service_modules"
            referencedColumns: ["id"]
          },
        ]
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
