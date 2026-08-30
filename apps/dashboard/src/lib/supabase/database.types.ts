export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export type Database = {
  public: {
    Tables: {
      audit_logs: {
        Row: {
          action: string;
          actor_user_id: string | null;
          created_at: string;
          entity_id: string | null;
          entity_type: string | null;
          id: string;
          metadata: Json;
          organization_id: string | null;
          outcome: string;
          request_id: string | null;
        };
        Insert: {
          action: string;
          actor_user_id?: string | null;
          created_at?: string;
          entity_id?: string | null;
          entity_type?: string | null;
          id?: string;
          metadata?: Json;
          organization_id?: string | null;
          outcome: string;
          request_id?: string | null;
        };
        Update: {
          action?: string;
          actor_user_id?: string | null;
          created_at?: string;
          entity_id?: string | null;
          entity_type?: string | null;
          id?: string;
          metadata?: Json;
          organization_id?: string | null;
          outcome?: string;
          request_id?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: "audit_logs_actor_user_id_fkey";
            columns: ["actor_user_id"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "audit_logs_organization_id_fkey";
            columns: ["organization_id"];
            isOneToOne: false;
            referencedRelation: "organizations";
            referencedColumns: ["id"];
          },
        ];
      };
      crm_activities: {
        Row: {
          activity_type: Database["public"]["Enums"]["crm_activity_type"];
          assigned_membership_id: string;
          company_id: string | null;
          contact_id: string | null;
          created_at: string;
          created_by: string;
          description: string | null;
          id: string;
          lead_id: string | null;
          occurred_at: string;
          opportunity_id: string | null;
          organization_id: string;
          title: string;
        };
        Insert: {
          activity_type: Database["public"]["Enums"]["crm_activity_type"];
          assigned_membership_id: string;
          company_id?: string | null;
          contact_id?: string | null;
          created_at?: string;
          created_by: string;
          description?: string | null;
          id?: string;
          lead_id?: string | null;
          occurred_at: string;
          opportunity_id?: string | null;
          organization_id: string;
          title: string;
        };
        Update: {
          activity_type?: Database["public"]["Enums"]["crm_activity_type"];
          assigned_membership_id?: string;
          company_id?: string | null;
          contact_id?: string | null;
          created_at?: string;
          created_by?: string;
          description?: string | null;
          id?: string;
          lead_id?: string | null;
          occurred_at?: string;
          opportunity_id?: string | null;
          organization_id?: string;
          title?: string;
        };
        Relationships: [
          {
            foreignKeyName: "crm_activities_assignee_fk";
            columns: ["assigned_membership_id", "organization_id"];
            isOneToOne: false;
            referencedRelation: "organization_members";
            referencedColumns: ["id", "organization_id"];
          },
          {
            foreignKeyName: "crm_activities_company_fk";
            columns: ["company_id", "organization_id"];
            isOneToOne: false;
            referencedRelation: "crm_companies";
            referencedColumns: ["id", "organization_id"];
          },
          {
            foreignKeyName: "crm_activities_contact_fk";
            columns: ["contact_id", "organization_id"];
            isOneToOne: false;
            referencedRelation: "crm_contacts";
            referencedColumns: ["id", "organization_id"];
          },
          {
            foreignKeyName: "crm_activities_created_by_fkey";
            columns: ["created_by"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "crm_activities_lead_fk";
            columns: ["lead_id", "organization_id"];
            isOneToOne: false;
            referencedRelation: "leads";
            referencedColumns: ["id", "organization_id"];
          },
          {
            foreignKeyName: "crm_activities_opportunity_fk";
            columns: ["opportunity_id", "organization_id"];
            isOneToOne: false;
            referencedRelation: "opportunities";
            referencedColumns: ["id", "organization_id"];
          },
          {
            foreignKeyName: "crm_activities_organization_id_fkey";
            columns: ["organization_id"];
            isOneToOne: false;
            referencedRelation: "organizations";
            referencedColumns: ["id"];
          },
        ];
      };
      crm_companies: {
        Row: {
          created_at: string;
          created_by: string | null;
          display_name: string;
          email: string | null;
          id: string;
          normalized_name: string;
          notes: string | null;
          organization_id: string;
          phone: string | null;
          source: Database["public"]["Enums"]["crm_source"] | null;
          source_detail: string | null;
          state: Database["public"]["Enums"]["crm_record_state"];
          updated_at: string;
          updated_by: string | null;
          website: string | null;
        };
        Insert: {
          created_at?: string;
          created_by?: string | null;
          display_name: string;
          email?: string | null;
          id?: string;
          normalized_name: string;
          notes?: string | null;
          organization_id: string;
          phone?: string | null;
          source?: Database["public"]["Enums"]["crm_source"] | null;
          source_detail?: string | null;
          state?: Database["public"]["Enums"]["crm_record_state"];
          updated_at?: string;
          updated_by?: string | null;
          website?: string | null;
        };
        Update: {
          created_at?: string;
          created_by?: string | null;
          display_name?: string;
          email?: string | null;
          id?: string;
          normalized_name?: string;
          notes?: string | null;
          organization_id?: string;
          phone?: string | null;
          source?: Database["public"]["Enums"]["crm_source"] | null;
          source_detail?: string | null;
          state?: Database["public"]["Enums"]["crm_record_state"];
          updated_at?: string;
          updated_by?: string | null;
          website?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: "crm_companies_created_by_fkey";
            columns: ["created_by"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "crm_companies_organization_id_fkey";
            columns: ["organization_id"];
            isOneToOne: false;
            referencedRelation: "organizations";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "crm_companies_updated_by_fkey";
            columns: ["updated_by"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
        ];
      };
      crm_contacts: {
        Row: {
          company_id: string | null;
          created_at: string;
          created_by: string | null;
          email: string | null;
          full_name: string;
          id: string;
          is_primary: boolean;
          job_title: string | null;
          organization_id: string;
          phone: string | null;
          state: Database["public"]["Enums"]["crm_record_state"];
          updated_at: string;
          updated_by: string | null;
        };
        Insert: {
          company_id?: string | null;
          created_at?: string;
          created_by?: string | null;
          email?: string | null;
          full_name: string;
          id?: string;
          is_primary?: boolean;
          job_title?: string | null;
          organization_id: string;
          phone?: string | null;
          state?: Database["public"]["Enums"]["crm_record_state"];
          updated_at?: string;
          updated_by?: string | null;
        };
        Update: {
          company_id?: string | null;
          created_at?: string;
          created_by?: string | null;
          email?: string | null;
          full_name?: string;
          id?: string;
          is_primary?: boolean;
          job_title?: string | null;
          organization_id?: string;
          phone?: string | null;
          state?: Database["public"]["Enums"]["crm_record_state"];
          updated_at?: string;
          updated_by?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: "crm_contacts_company_fk";
            columns: ["company_id", "organization_id"];
            isOneToOne: false;
            referencedRelation: "crm_companies";
            referencedColumns: ["id", "organization_id"];
          },
          {
            foreignKeyName: "crm_contacts_created_by_fkey";
            columns: ["created_by"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "crm_contacts_organization_id_fkey";
            columns: ["organization_id"];
            isOneToOne: false;
            referencedRelation: "organizations";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "crm_contacts_updated_by_fkey";
            columns: ["updated_by"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
        ];
      };
      crm_tasks: {
        Row: {
          assigned_membership_id: string;
          cancelled_at: string | null;
          company_id: string | null;
          completed_at: string | null;
          completed_by: string | null;
          contact_id: string | null;
          created_at: string;
          created_by: string;
          description: string | null;
          due_at: string;
          id: string;
          lead_id: string | null;
          opportunity_id: string | null;
          organization_id: string;
          status: Database["public"]["Enums"]["crm_task_status"];
          title: string;
          updated_at: string;
          version: number;
        };
        Insert: {
          assigned_membership_id: string;
          cancelled_at?: string | null;
          company_id?: string | null;
          completed_at?: string | null;
          completed_by?: string | null;
          contact_id?: string | null;
          created_at?: string;
          created_by: string;
          description?: string | null;
          due_at: string;
          id?: string;
          lead_id?: string | null;
          opportunity_id?: string | null;
          organization_id: string;
          status?: Database["public"]["Enums"]["crm_task_status"];
          title: string;
          updated_at?: string;
          version?: number;
        };
        Update: {
          assigned_membership_id?: string;
          cancelled_at?: string | null;
          company_id?: string | null;
          completed_at?: string | null;
          completed_by?: string | null;
          contact_id?: string | null;
          created_at?: string;
          created_by?: string;
          description?: string | null;
          due_at?: string;
          id?: string;
          lead_id?: string | null;
          opportunity_id?: string | null;
          organization_id?: string;
          status?: Database["public"]["Enums"]["crm_task_status"];
          title?: string;
          updated_at?: string;
          version?: number;
        };
        Relationships: [
          {
            foreignKeyName: "crm_tasks_assignee_fk";
            columns: ["assigned_membership_id", "organization_id"];
            isOneToOne: false;
            referencedRelation: "organization_members";
            referencedColumns: ["id", "organization_id"];
          },
          {
            foreignKeyName: "crm_tasks_company_fk";
            columns: ["company_id", "organization_id"];
            isOneToOne: false;
            referencedRelation: "crm_companies";
            referencedColumns: ["id", "organization_id"];
          },
          {
            foreignKeyName: "crm_tasks_completed_by_fkey";
            columns: ["completed_by"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "crm_tasks_contact_fk";
            columns: ["contact_id", "organization_id"];
            isOneToOne: false;
            referencedRelation: "crm_contacts";
            referencedColumns: ["id", "organization_id"];
          },
          {
            foreignKeyName: "crm_tasks_created_by_fkey";
            columns: ["created_by"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "crm_tasks_lead_fk";
            columns: ["lead_id", "organization_id"];
            isOneToOne: false;
            referencedRelation: "leads";
            referencedColumns: ["id", "organization_id"];
          },
          {
            foreignKeyName: "crm_tasks_opportunity_fk";
            columns: ["opportunity_id", "organization_id"];
            isOneToOne: false;
            referencedRelation: "opportunities";
            referencedColumns: ["id", "organization_id"];
          },
          {
            foreignKeyName: "crm_tasks_organization_id_fkey";
            columns: ["organization_id"];
            isOneToOne: false;
            referencedRelation: "organizations";
            referencedColumns: ["id"];
          },
        ];
      };
      leads: {
        Row: {
          archived_at: string | null;
          assigned_membership_id: string | null;
          company: string | null;
          company_id: string | null;
          consent_version: string;
          consented_at: string | null;
          contact_id: string | null;
          created_at: string;
          disqualification_reason: string | null;
          email: string;
          full_name: string;
          id: string;
          internal_updated_at: string;
          internal_updated_by: string | null;
          landing_path: string;
          message: string;
          organization_id: string;
          phone: string | null;
          service_interest: string;
          source: string;
          source_detail: string | null;
          status: string;
          submission_fingerprint: string | null;
          triage_status: Database["public"]["Enums"]["crm_lead_triage_status"];
          utm_campaign: string | null;
          utm_content: string | null;
          utm_medium: string | null;
          utm_source: string | null;
          utm_term: string | null;
          version: number;
        };
        Insert: {
          archived_at?: string | null;
          assigned_membership_id?: string | null;
          company?: string | null;
          company_id?: string | null;
          consent_version?: string;
          consented_at?: string | null;
          contact_id?: string | null;
          created_at?: string;
          disqualification_reason?: string | null;
          email: string;
          full_name: string;
          id?: string;
          internal_updated_at?: string;
          internal_updated_by?: string | null;
          landing_path?: string;
          message: string;
          organization_id: string;
          phone?: string | null;
          service_interest: string;
          source?: string;
          source_detail?: string | null;
          status?: string;
          submission_fingerprint?: string | null;
          triage_status?: Database["public"]["Enums"]["crm_lead_triage_status"];
          utm_campaign?: string | null;
          utm_content?: string | null;
          utm_medium?: string | null;
          utm_source?: string | null;
          utm_term?: string | null;
          version?: number;
        };
        Update: {
          archived_at?: string | null;
          assigned_membership_id?: string | null;
          company?: string | null;
          company_id?: string | null;
          consent_version?: string;
          consented_at?: string | null;
          contact_id?: string | null;
          created_at?: string;
          disqualification_reason?: string | null;
          email?: string;
          full_name?: string;
          id?: string;
          internal_updated_at?: string;
          internal_updated_by?: string | null;
          landing_path?: string;
          message?: string;
          organization_id?: string;
          phone?: string | null;
          service_interest?: string;
          source?: string;
          source_detail?: string | null;
          status?: string;
          submission_fingerprint?: string | null;
          triage_status?: Database["public"]["Enums"]["crm_lead_triage_status"];
          utm_campaign?: string | null;
          utm_content?: string | null;
          utm_medium?: string | null;
          utm_source?: string | null;
          utm_term?: string | null;
          version?: number;
        };
        Relationships: [
          {
            foreignKeyName: "leads_assignee_fk";
            columns: ["assigned_membership_id", "organization_id"];
            isOneToOne: false;
            referencedRelation: "organization_members";
            referencedColumns: ["id", "organization_id"];
          },
          {
            foreignKeyName: "leads_company_fk";
            columns: ["company_id", "organization_id"];
            isOneToOne: false;
            referencedRelation: "crm_companies";
            referencedColumns: ["id", "organization_id"];
          },
          {
            foreignKeyName: "leads_contact_fk";
            columns: ["contact_id", "organization_id"];
            isOneToOne: false;
            referencedRelation: "crm_contacts";
            referencedColumns: ["id", "organization_id"];
          },
          {
            foreignKeyName: "leads_internal_updated_by_fkey";
            columns: ["internal_updated_by"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "leads_organization_id_fkey";
            columns: ["organization_id"];
            isOneToOne: false;
            referencedRelation: "organizations";
            referencedColumns: ["id"];
          },
        ];
      };
      opportunities: {
        Row: {
          archived_at: string | null;
          assigned_membership_id: string | null;
          closed_at: string | null;
          company_id: string | null;
          contact_id: string | null;
          created_at: string;
          created_by: string | null;
          estimated_value: number | null;
          id: string;
          lead_id: string | null;
          loss_reason:
            Database["public"]["Enums"]["opportunity_loss_reason"] | null;
          loss_reason_detail: string | null;
          opened_at: string;
          organization_id: string;
          stage_id: string;
          title: string;
          updated_at: string;
          updated_by: string | null;
          version: number;
        };
        Insert: {
          archived_at?: string | null;
          assigned_membership_id?: string | null;
          closed_at?: string | null;
          company_id?: string | null;
          contact_id?: string | null;
          created_at?: string;
          created_by?: string | null;
          estimated_value?: number | null;
          id?: string;
          lead_id?: string | null;
          loss_reason?:
            Database["public"]["Enums"]["opportunity_loss_reason"] | null;
          loss_reason_detail?: string | null;
          opened_at?: string;
          organization_id: string;
          stage_id: string;
          title: string;
          updated_at?: string;
          updated_by?: string | null;
          version?: number;
        };
        Update: {
          archived_at?: string | null;
          assigned_membership_id?: string | null;
          closed_at?: string | null;
          company_id?: string | null;
          contact_id?: string | null;
          created_at?: string;
          created_by?: string | null;
          estimated_value?: number | null;
          id?: string;
          lead_id?: string | null;
          loss_reason?:
            Database["public"]["Enums"]["opportunity_loss_reason"] | null;
          loss_reason_detail?: string | null;
          opened_at?: string;
          organization_id?: string;
          stage_id?: string;
          title?: string;
          updated_at?: string;
          updated_by?: string | null;
          version?: number;
        };
        Relationships: [
          {
            foreignKeyName: "opportunities_assignee_fk";
            columns: ["assigned_membership_id", "organization_id"];
            isOneToOne: false;
            referencedRelation: "organization_members";
            referencedColumns: ["id", "organization_id"];
          },
          {
            foreignKeyName: "opportunities_company_fk";
            columns: ["company_id", "organization_id"];
            isOneToOne: false;
            referencedRelation: "crm_companies";
            referencedColumns: ["id", "organization_id"];
          },
          {
            foreignKeyName: "opportunities_contact_fk";
            columns: ["contact_id", "organization_id"];
            isOneToOne: false;
            referencedRelation: "crm_contacts";
            referencedColumns: ["id", "organization_id"];
          },
          {
            foreignKeyName: "opportunities_created_by_fkey";
            columns: ["created_by"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "opportunities_lead_fk";
            columns: ["lead_id", "organization_id"];
            isOneToOne: false;
            referencedRelation: "leads";
            referencedColumns: ["id", "organization_id"];
          },
          {
            foreignKeyName: "opportunities_organization_id_fkey";
            columns: ["organization_id"];
            isOneToOne: false;
            referencedRelation: "organizations";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "opportunities_stage_fk";
            columns: ["stage_id", "organization_id"];
            isOneToOne: false;
            referencedRelation: "pipeline_stages";
            referencedColumns: ["id", "organization_id"];
          },
          {
            foreignKeyName: "opportunities_updated_by_fkey";
            columns: ["updated_by"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
        ];
      };
      opportunity_stage_history: {
        Row: {
          changed_by: string | null;
          context: string;
          created_at: string;
          id: string;
          new_stage_id: string;
          opportunity_id: string;
          organization_id: string;
          previous_stage_id: string | null;
        };
        Insert: {
          changed_by?: string | null;
          context?: string;
          created_at?: string;
          id?: string;
          new_stage_id: string;
          opportunity_id: string;
          organization_id: string;
          previous_stage_id?: string | null;
        };
        Update: {
          changed_by?: string | null;
          context?: string;
          created_at?: string;
          id?: string;
          new_stage_id?: string;
          opportunity_id?: string;
          organization_id?: string;
          previous_stage_id?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: "opportunity_history_new_stage_fk";
            columns: ["new_stage_id", "organization_id"];
            isOneToOne: false;
            referencedRelation: "pipeline_stages";
            referencedColumns: ["id", "organization_id"];
          },
          {
            foreignKeyName: "opportunity_history_opportunity_fk";
            columns: ["opportunity_id", "organization_id"];
            isOneToOne: false;
            referencedRelation: "opportunities";
            referencedColumns: ["id", "organization_id"];
          },
          {
            foreignKeyName: "opportunity_history_previous_stage_fk";
            columns: ["previous_stage_id", "organization_id"];
            isOneToOne: false;
            referencedRelation: "pipeline_stages";
            referencedColumns: ["id", "organization_id"];
          },
          {
            foreignKeyName: "opportunity_stage_history_changed_by_fkey";
            columns: ["changed_by"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "opportunity_stage_history_organization_id_fkey";
            columns: ["organization_id"];
            isOneToOne: false;
            referencedRelation: "organizations";
            referencedColumns: ["id"];
          },
        ];
      };
      organization_member_roles: {
        Row: {
          created_at: string;
          membership_id: string;
          organization_id: string;
          role_id: string;
        };
        Insert: {
          created_at?: string;
          membership_id: string;
          organization_id: string;
          role_id: string;
        };
        Update: {
          created_at?: string;
          membership_id?: string;
          organization_id?: string;
          role_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: "organization_member_roles_membership_fk";
            columns: ["membership_id", "organization_id"];
            isOneToOne: false;
            referencedRelation: "organization_members";
            referencedColumns: ["id", "organization_id"];
          },
          {
            foreignKeyName: "organization_member_roles_organization_id_fkey";
            columns: ["organization_id"];
            isOneToOne: false;
            referencedRelation: "organizations";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "organization_member_roles_role_fk";
            columns: ["role_id", "organization_id"];
            isOneToOne: false;
            referencedRelation: "roles";
            referencedColumns: ["id", "organization_id"];
          },
        ];
      };
      organization_members: {
        Row: {
          created_at: string;
          id: string;
          organization_id: string;
          status: Database["public"]["Enums"]["organization_member_status"];
          updated_at: string;
          user_id: string;
        };
        Insert: {
          created_at?: string;
          id?: string;
          organization_id: string;
          status?: Database["public"]["Enums"]["organization_member_status"];
          updated_at?: string;
          user_id: string;
        };
        Update: {
          created_at?: string;
          id?: string;
          organization_id?: string;
          status?: Database["public"]["Enums"]["organization_member_status"];
          updated_at?: string;
          user_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: "organization_members_organization_id_fkey";
            columns: ["organization_id"];
            isOneToOne: false;
            referencedRelation: "organizations";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "organization_members_user_id_fkey";
            columns: ["user_id"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
        ];
      };
      organizations: {
        Row: {
          created_at: string;
          id: string;
          name: string;
          slug: string;
          updated_at: string;
        };
        Insert: {
          created_at?: string;
          id?: string;
          name: string;
          slug: string;
          updated_at?: string;
        };
        Update: {
          created_at?: string;
          id?: string;
          name?: string;
          slug?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      permissions: {
        Row: {
          created_at: string;
          description: string;
          id: string;
          key: string;
        };
        Insert: {
          created_at?: string;
          description: string;
          id?: string;
          key: string;
        };
        Update: {
          created_at?: string;
          description?: string;
          id?: string;
          key?: string;
        };
        Relationships: [];
      };
      pipeline_stages: {
        Row: {
          category: Database["public"]["Enums"]["pipeline_stage_category"];
          created_at: string;
          id: string;
          is_active: boolean;
          name: string;
          organization_id: string;
          position: number;
          updated_at: string;
        };
        Insert: {
          category?: Database["public"]["Enums"]["pipeline_stage_category"];
          created_at?: string;
          id?: string;
          is_active?: boolean;
          name: string;
          organization_id: string;
          position: number;
          updated_at?: string;
        };
        Update: {
          category?: Database["public"]["Enums"]["pipeline_stage_category"];
          created_at?: string;
          id?: string;
          is_active?: boolean;
          name?: string;
          organization_id?: string;
          position?: number;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "pipeline_stages_organization_id_fkey";
            columns: ["organization_id"];
            isOneToOne: false;
            referencedRelation: "organizations";
            referencedColumns: ["id"];
          },
        ];
      };
      profiles: {
        Row: {
          avatar_url: string | null;
          created_at: string;
          full_name: string | null;
          id: string;
          updated_at: string;
        };
        Insert: {
          avatar_url?: string | null;
          created_at?: string;
          full_name?: string | null;
          id: string;
          updated_at?: string;
        };
        Update: {
          avatar_url?: string | null;
          created_at?: string;
          full_name?: string | null;
          id?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      role_permissions: {
        Row: {
          created_at: string;
          permission_id: string;
          role_id: string;
        };
        Insert: {
          created_at?: string;
          permission_id: string;
          role_id: string;
        };
        Update: {
          created_at?: string;
          permission_id?: string;
          role_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: "role_permissions_permission_id_fkey";
            columns: ["permission_id"];
            isOneToOne: false;
            referencedRelation: "permissions";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "role_permissions_role_id_fkey";
            columns: ["role_id"];
            isOneToOne: false;
            referencedRelation: "roles";
            referencedColumns: ["id"];
          },
        ];
      };
      roles: {
        Row: {
          created_at: string;
          description: string;
          id: string;
          is_system: boolean;
          name: string;
          organization_id: string;
          slug: string;
          updated_at: string;
        };
        Insert: {
          created_at?: string;
          description: string;
          id?: string;
          is_system?: boolean;
          name: string;
          organization_id: string;
          slug: string;
          updated_at?: string;
        };
        Update: {
          created_at?: string;
          description?: string;
          id?: string;
          is_system?: boolean;
          name?: string;
          organization_id?: string;
          slug?: string;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "roles_organization_id_fkey";
            columns: ["organization_id"];
            isOneToOne: false;
            referencedRelation: "organizations";
            referencedColumns: ["id"];
          },
        ];
      };
    };
    Views: {
      [_ in never]: never;
    };
    Functions: {
      accept_my_organization_invitation: { Args: never; Returns: string };
      assign_member_role: {
        Args: { target_membership_id: string; target_role_slug: string };
        Returns: undefined;
      };
      create_crm_activity: {
        Args: {
          activity_description: string;
          activity_kind: Database["public"]["Enums"]["crm_activity_type"];
          activity_occurred_at: string;
          activity_title: string;
          target_assigned_membership_id: string;
          target_company_id?: string;
          target_contact_id?: string;
          target_lead_id?: string;
          target_opportunity_id?: string;
        };
        Returns: string;
      };
      create_crm_task: {
        Args: {
          target_assigned_membership_id: string;
          target_company_id?: string;
          target_contact_id?: string;
          target_lead_id?: string;
          target_opportunity_id?: string;
          task_description: string;
          task_due_at: string;
          task_title: string;
        };
        Returns: string;
      };
      create_opportunity_from_lead: {
        Args: {
          opportunity_title?: string;
          opportunity_value?: number;
          target_lead_id: string;
        };
        Returns: string;
      };
      get_my_membership_statuses: {
        Args: never;
        Returns: Database["public"]["Enums"]["organization_member_status"][];
      };
      has_permission: {
        Args: { organization_id?: string; permission_key: string };
        Returns: boolean;
      };
      has_role: {
        Args: { target_organization_id?: string; target_role_slug: string };
        Returns: boolean;
      };
      move_opportunity: {
        Args: {
          expected_version: number;
          target_loss_detail?: string;
          target_loss_reason?: Database["public"]["Enums"]["opportunity_loss_reason"];
          target_opportunity_id: string;
          target_stage_id: string;
        };
        Returns: number;
      };
      record_administrative_audit: {
        Args: {
          event_action: string;
          event_entity_id: string;
          event_entity_type: string;
          event_metadata?: Json;
          target_organization_id: string;
        };
        Returns: string;
      };
      record_audit_event: {
        Args: {
          event_action: string;
          event_entity_id?: string;
          event_entity_type?: string;
          event_metadata?: Json;
          event_outcome: string;
          event_request_id?: string;
        };
        Returns: string;
      };
      remove_member_role: {
        Args: { target_membership_id: string; target_role_slug: string };
        Returns: undefined;
      };
      submit_public_lead: {
        Args: {
          company: string;
          email: string;
          full_name: string;
          landing_path?: string;
          message: string;
          phone: string;
          service_interest: string;
          utm_campaign?: string;
          utm_content?: string;
          utm_medium?: string;
          utm_source?: string;
          utm_term?: string;
        };
        Returns: string;
      };
      transition_crm_task: {
        Args: {
          expected_version: number;
          target_status: Database["public"]["Enums"]["crm_task_status"];
          target_task_id: string;
        };
        Returns: number;
      };
      update_opportunity: {
        Args: {
          expected_version: number;
          opportunity_title: string;
          opportunity_value?: number;
          target_archived?: boolean;
          target_assigned_membership_id?: string;
          target_opportunity_id: string;
        };
        Returns: number;
      };
    };
    Enums: {
      crm_activity_type:
        | "call"
        | "whatsapp"
        | "email"
        | "meeting"
        | "instagram"
        | "note"
        | "other";
      crm_lead_triage_status:
        "new" | "in_review" | "qualified" | "disqualified";
      crm_record_state: "active" | "archived";
      crm_source:
        | "website"
        | "99freelas"
        | "instagram"
        | "pinterest"
        | "tiktok"
        | "whatsapp"
        | "google_maps"
        | "referral"
        | "outbound"
        | "other";
      crm_task_status: "pending" | "completed" | "cancelled";
      opportunity_loss_reason:
        | "price"
        | "no_response"
        | "no_interest"
        | "timing"
        | "competitor"
        | "unmet_need"
        | "other";
      organization_member_status: "invited" | "active" | "suspended";
      pipeline_stage_category: "open" | "won" | "lost";
    };
    CompositeTypes: {
      [_ in never]: never;
    };
  };
};

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">;

type DefaultSchema = DatabaseWithoutInternals[Extract<
  keyof Database,
  "public"
>];

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never) = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R;
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R;
      }
      ? R
      : never
    : never;

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    keyof DefaultSchema["Tables"] | { schema: keyof DatabaseWithoutInternals },
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
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
  DefaultSchemaTableNameOrOptions extends
    keyof DefaultSchema["Tables"] | { schema: keyof DatabaseWithoutInternals },
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
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
  DefaultSchemaEnumNameOrOptions extends
    keyof DefaultSchema["Enums"] | { schema: keyof DatabaseWithoutInternals },
  EnumName extends (DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never) = never,
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
  CompositeTypeName extends (PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never) = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never;

export const Constants = {
  public: {
    Enums: {
      crm_activity_type: [
        "call",
        "whatsapp",
        "email",
        "meeting",
        "instagram",
        "note",
        "other",
      ],
      crm_lead_triage_status: ["new", "in_review", "qualified", "disqualified"],
      crm_record_state: ["active", "archived"],
      crm_source: [
        "website",
        "99freelas",
        "instagram",
        "pinterest",
        "tiktok",
        "whatsapp",
        "google_maps",
        "referral",
        "outbound",
        "other",
      ],
      crm_task_status: ["pending", "completed", "cancelled"],
      opportunity_loss_reason: [
        "price",
        "no_response",
        "no_interest",
        "timing",
        "competitor",
        "unmet_need",
        "other",
      ],
      organization_member_status: ["invited", "active", "suspended"],
      pipeline_stage_category: ["open", "won", "lost"],
    },
  },
} as const;
