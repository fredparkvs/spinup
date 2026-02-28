export type Phase = "validate" | "build_minimum" | "sell_iterate";
export type PlatformRole = "admin" | "mentor" | "entrepreneur";
export type TeamMemberRole = "entrepreneur" | "mentor";
export type ArtifactStatus = "draft" | "complete";
export type FundingStatus =
  | "not_started"
  | "preparing"
  | "submitted"
  | "awaiting_decision"
  | "awarded"
  | "rejected";
export type RunwayMode =
  | "pre_funding_pre_revenue"
  | "pre_revenue_funded"
  | "revenue_generating";
export type ComplianceStatus = "not_started" | "in_progress" | "complete";
export type RelationshipStage =
  | "identified"
  | "contacted"
  | "engaged"
  | "active";

// Job Board enums
export type JbRole = "applicant" | "company_member";
export type JbJobType =
  | "paid_internship"
  | "unpaid_internship"
  | "part_time_contractor"
  | "full_time_contractor"
  | "employment";
export type JbWorkMode = "remote" | "hybrid" | "in_person";
export type JbAvailabilityType = "start_date_only" | "date_range";
export type JbOutreachStatus = "sent" | "viewed" | "responded";

export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string;
          email: string;
          full_name: string | null;
          avatar_url: string | null;
          platform_role: PlatformRole;
          onboarding_completed: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id: string;
          email: string;
          full_name?: string | null;
          avatar_url?: string | null;
          platform_role?: PlatformRole;
          onboarding_completed?: boolean;
        };
        Update: {
          full_name?: string | null;
          avatar_url?: string | null;
          platform_role?: PlatformRole;
          onboarding_completed?: boolean;
        };
        Relationships: [];
      };
      teams: {
        Row: {
          id: string;
          name: string;
          institution: string | null;
          operating_name: string | null;
          current_phase: Phase;
          value_proposition: ValueProposition | null;
          vp_updated_at: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          name: string;
          institution?: string | null;
          operating_name?: string | null;
          current_phase?: Phase;
        };
        Update: {
          name?: string;
          institution?: string | null;
          operating_name?: string | null;
          current_phase?: Phase;
          value_proposition?: ValueProposition | null;
          vp_updated_at?: string | null;
        };
        Relationships: [];
      };
      team_members: {
        Row: {
          id: string;
          team_id: string;
          user_id: string;
          role: TeamMemberRole;
          joined_at: string;
        };
        Insert: {
          team_id: string;
          user_id: string;
          role?: TeamMemberRole;
        };
        Update: {
          role?: TeamMemberRole;
        };
        Relationships: [
          {
            foreignKeyName: "team_members_team_id_fkey";
            columns: ["team_id"];
            isOneToOne: false;
            referencedRelation: "teams";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "team_members_user_id_fkey";
            columns: ["user_id"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          }
        ];
      };
      team_invites: {
        Row: {
          id: string;
          team_id: string;
          email: string;
          role: TeamMemberRole;
          invited_by: string;
          accepted: boolean;
          created_at: string;
        };
        Insert: {
          team_id: string;
          email: string;
          role?: TeamMemberRole;
          invited_by: string;
        };
        Update: {
          accepted?: boolean;
        };
        Relationships: [
          {
            foreignKeyName: "team_invites_team_id_fkey";
            columns: ["team_id"];
            isOneToOne: false;
            referencedRelation: "teams";
            referencedColumns: ["id"];
          }
        ];
      };
      artifacts: {
        Row: {
          id: string;
          team_id: string;
          artifact_type: string;
          title: string;
          data: Record<string, unknown>;
          status: ArtifactStatus;
          created_by: string;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          team_id: string;
          artifact_type: string;
          title: string;
          data?: Record<string, unknown>;
          status?: ArtifactStatus;
          created_by: string;
        };
        Update: {
          title?: string;
          data?: Record<string, unknown>;
          status?: ArtifactStatus;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "artifacts_team_id_fkey";
            columns: ["team_id"];
            isOneToOne: false;
            referencedRelation: "teams";
            referencedColumns: ["id"];
          }
        ];
      };
      artifact_exports: {
        Row: {
          id: string;
          artifact_id: string;
          format: "docx" | "txt";
          storage_path: string;
          created_by: string;
          created_at: string;
        };
        Insert: {
          artifact_id: string;
          format: "docx" | "txt";
          storage_path: string;
          created_by: string;
        };
        Update: never;
        Relationships: [
          {
            foreignKeyName: "artifact_exports_artifact_id_fkey";
            columns: ["artifact_id"];
            isOneToOne: false;
            referencedRelation: "artifacts";
            referencedColumns: ["id"];
          }
        ];
      };
      tool_notes: {
        Row: {
          id: string;
          artifact_type: string;
          team_id: string | null;
          created_by: string;
          author_role: "admin" | "mentor";
          note_text: string;
          url: string | null;
          url_label: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          artifact_type: string;
          team_id?: string | null;
          created_by: string;
          author_role: "admin" | "mentor";
          note_text: string;
          url?: string | null;
          url_label?: string | null;
        };
        Update: {
          note_text?: string;
          url?: string | null;
          url_label?: string | null;
          updated_at?: string;
        };
        Relationships: [];
      };
      journal_entries: {
        Row: {
          id: string;
          team_id: string;
          week_start: string;
          what_we_did: string | null;
          what_we_learned: string | null;
          what_changed: string | null;
          blockers: string | null;
          next_week_priority: string | null;
          metrics: Record<string, unknown>;
          created_by: string;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          team_id: string;
          week_start: string;
          what_we_did?: string | null;
          what_we_learned?: string | null;
          what_changed?: string | null;
          blockers?: string | null;
          next_week_priority?: string | null;
          metrics?: Record<string, unknown>;
          created_by: string;
        };
        Update: {
          what_we_did?: string | null;
          what_we_learned?: string | null;
          what_changed?: string | null;
          blockers?: string | null;
          next_week_priority?: string | null;
          metrics?: Record<string, unknown>;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "journal_entries_team_id_fkey";
            columns: ["team_id"];
            isOneToOne: false;
            referencedRelation: "teams";
            referencedColumns: ["id"];
          }
        ];
      };
      funding_tracker_entries: {
        Row: {
          id: string;
          team_id: string;
          funder: string;
          amount_available: number | null;
          stage_fit: string | null;
          eligibility_notes: string | null;
          status: FundingStatus;
          deadline: string | null;
          notes: string | null;
          url: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          team_id: string;
          funder: string;
          amount_available?: number | null;
          stage_fit?: string | null;
          eligibility_notes?: string | null;
          status?: FundingStatus;
          deadline?: string | null;
          notes?: string | null;
          url?: string | null;
        };
        Update: {
          funder?: string;
          amount_available?: number | null;
          stage_fit?: string | null;
          eligibility_notes?: string | null;
          status?: FundingStatus;
          deadline?: string | null;
          notes?: string | null;
          url?: string | null;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "funding_tracker_entries_team_id_fkey";
            columns: ["team_id"];
            isOneToOne: false;
            referencedRelation: "teams";
            referencedColumns: ["id"];
          }
        ];
      };
      advisor_entries: {
        Row: {
          id: string;
          team_id: string;
          name: string;
          expertise: string | null;
          relationship_stage: RelationshipStage;
          how_we_know_them: string | null;
          last_contact: string | null;
          next_action: string | null;
          value_exchanged: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          team_id: string;
          name: string;
          expertise?: string | null;
          relationship_stage?: RelationshipStage;
          how_we_know_them?: string | null;
          last_contact?: string | null;
          next_action?: string | null;
          value_exchanged?: string | null;
        };
        Update: {
          name?: string;
          expertise?: string | null;
          relationship_stage?: RelationshipStage;
          how_we_know_them?: string | null;
          last_contact?: string | null;
          next_action?: string | null;
          value_exchanged?: string | null;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "advisor_entries_team_id_fkey";
            columns: ["team_id"];
            isOneToOne: false;
            referencedRelation: "teams";
            referencedColumns: ["id"];
          }
        ];
      };
      trello_connections: {
        Row: {
          id: string;
          team_id: string;
          access_token: string;
          access_token_secret: string;
          trello_member_id: string;
          board_id: string | null;
          webhook_id: string | null;
          connected_at: string;
          last_synced_at: string | null;
        };
        Insert: {
          team_id: string;
          access_token: string;
          access_token_secret: string;
          trello_member_id: string;
          board_id?: string | null;
        };
        Update: {
          board_id?: string | null;
          webhook_id?: string | null;
          last_synced_at?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: "trello_connections_team_id_fkey";
            columns: ["team_id"];
            isOneToOne: true;
            referencedRelation: "teams";
            referencedColumns: ["id"];
          }
        ];
      };
      trello_card_mappings: {
        Row: {
          id: string;
          team_id: string;
          artifact_id: string;
          trello_card_id: string;
          last_pulled_at: string | null;
          created_at: string;
        };
        Insert: {
          team_id: string;
          artifact_id: string;
          trello_card_id: string;
        };
        Update: {
          last_pulled_at?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: "trello_card_mappings_artifact_id_fkey";
            columns: ["artifact_id"];
            isOneToOne: true;
            referencedRelation: "artifacts";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "trello_card_mappings_team_id_fkey";
            columns: ["team_id"];
            isOneToOne: false;
            referencedRelation: "teams";
            referencedColumns: ["id"];
          }
        ];
      };
      // Job Board tables
      jb_user_roles: {
        Row: {
          id: string;
          user_id: string;
          role: JbRole;
          created_at: string;
        };
        Insert: {
          user_id: string;
          role: JbRole;
        };
        Update: {
          role?: JbRole;
        };
        Relationships: [];
      };
      jb_applicant_profiles: {
        Row: {
          id: string;
          user_id: string;
          anonymous_id: string;
          academics: Record<string, unknown>[];
          software_skills: string[];
          languages: string[];
          location_city: string | null;
          location_country: string | null;
          willing_to_relocate: boolean;
          work_experience: Record<string, unknown>[];
          personality_description: string | null;
          looking_for: string | null;
          is_published: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          user_id: string;
          anonymous_id?: string;
          academics?: Record<string, unknown>[];
          software_skills?: string[];
          languages?: string[];
          location_city?: string | null;
          location_country?: string | null;
          willing_to_relocate?: boolean;
          work_experience?: Record<string, unknown>[];
          personality_description?: string | null;
          looking_for?: string | null;
          is_published?: boolean;
        };
        Update: {
          academics?: Record<string, unknown>[];
          software_skills?: string[];
          languages?: string[];
          location_city?: string | null;
          location_country?: string | null;
          willing_to_relocate?: boolean;
          work_experience?: Record<string, unknown>[];
          personality_description?: string | null;
          looking_for?: string | null;
          is_published?: boolean;
        };
        Relationships: [];
      };
      jb_applicant_preferences: {
        Row: {
          id: string;
          applicant_profile_id: string;
          job_types: JbJobType[];
          availability_type: JbAvailabilityType;
          available_from: string | null;
          available_until: string | null;
          work_modes: JbWorkMode[];
          created_at: string;
          updated_at: string;
        };
        Insert: {
          applicant_profile_id: string;
          job_types?: JbJobType[];
          availability_type?: JbAvailabilityType;
          available_from?: string | null;
          available_until?: string | null;
          work_modes?: JbWorkMode[];
        };
        Update: {
          job_types?: JbJobType[];
          availability_type?: JbAvailabilityType;
          available_from?: string | null;
          available_until?: string | null;
          work_modes?: JbWorkMode[];
        };
        Relationships: [];
      };
      jb_companies: {
        Row: {
          id: string;
          name: string;
          what_we_do: string | null;
          how_we_work: string | null;
          website_url: string | null;
          team_linkedin: Record<string, unknown>[];
          is_verified: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          name: string;
          what_we_do?: string | null;
          how_we_work?: string | null;
          website_url?: string | null;
          team_linkedin?: Record<string, unknown>[];
        };
        Update: {
          name?: string;
          what_we_do?: string | null;
          how_we_work?: string | null;
          website_url?: string | null;
          team_linkedin?: Record<string, unknown>[];
          is_verified?: boolean;
        };
        Relationships: [];
      };
      jb_company_members: {
        Row: {
          id: string;
          company_id: string;
          user_id: string;
          is_owner: boolean;
          joined_at: string;
        };
        Insert: {
          company_id: string;
          user_id: string;
          is_owner?: boolean;
        };
        Update: {
          is_owner?: boolean;
        };
        Relationships: [];
      };
      jb_favourites: {
        Row: {
          id: string;
          company_id: string;
          applicant_profile_id: string;
          favourited_by: string;
          note: string | null;
          created_at: string;
        };
        Insert: {
          company_id: string;
          applicant_profile_id: string;
          favourited_by: string;
          note?: string | null;
        };
        Update: {
          note?: string | null;
        };
        Relationships: [];
      };
      jb_outreach: {
        Row: {
          id: string;
          company_id: string;
          applicant_profile_id: string;
          sent_by: string;
          message: string | null;
          status: JbOutreachStatus;
          sent_at: string;
          viewed_at: string | null;
        };
        Insert: {
          company_id: string;
          applicant_profile_id: string;
          sent_by: string;
          message?: string | null;
        };
        Update: {
          status?: JbOutreachStatus;
          viewed_at?: string | null;
        };
        Relationships: [];
      };
    };
    Views: {
      [_ in never]: never;
    };
    Functions: {
      seed_funding_tracker: {
        Args: { p_team_id: string };
        Returns: undefined;
      };
    };
    Enums: {
      phase: Phase;
      platform_role: PlatformRole;
      team_member_role: TeamMemberRole;
      artifact_status: ArtifactStatus;
      funding_status: FundingStatus;
      runway_mode: RunwayMode;
      compliance_status: ComplianceStatus;
      relationship_stage: RelationshipStage;
      jb_role: JbRole;
      jb_job_type: JbJobType;
      jb_work_mode: JbWorkMode;
      jb_availability_type: JbAvailabilityType;
      jb_outreach_status: JbOutreachStatus;
    };
    CompositeTypes: {
      [_ in never]: never;
    };
  };
}

export interface ValueProposition {
  solution: string;
  customer: string;
  benefit: string;
  how_it_works: string;
  improvement: string;
}
