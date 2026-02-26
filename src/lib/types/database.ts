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
      };
    };
    Views: Record<string, never>;
    Functions: Record<string, never>;
    Enums: {
      phase: Phase;
      platform_role: PlatformRole;
      team_member_role: TeamMemberRole;
      artifact_status: ArtifactStatus;
      funding_status: FundingStatus;
      runway_mode: RunwayMode;
      compliance_status: ComplianceStatus;
      relationship_stage: RelationshipStage;
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
