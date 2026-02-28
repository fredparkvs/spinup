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

export interface AcademicEntry {
  institution: string;
  degree: string;
  field: string;
  status: "current" | "completed";
  year_start: number;
  year_end: number | null;
}

export interface WorkExperienceEntry {
  company: string;
  role: string;
  description: string;
  start_date: string;
  end_date: string | null;
  current: boolean;
}

export interface LinkedInEntry {
  name: string;
  role: string;
  linkedin_url: string;
}

export interface JbApplicantProfile {
  id: string;
  user_id: string;
  anonymous_id: string;
  academics: AcademicEntry[];
  software_skills: string[];
  languages: string[];
  location_city: string | null;
  location_country: string | null;
  willing_to_relocate: boolean;
  work_experience: WorkExperienceEntry[];
  personality_description: string | null;
  looking_for: string | null;
  is_published: boolean;
  created_at: string;
  updated_at: string;
}

export interface JbApplicantPreferences {
  id: string;
  applicant_profile_id: string;
  job_types: JbJobType[];
  availability_type: JbAvailabilityType;
  available_from: string | null;
  available_until: string | null;
  work_modes: JbWorkMode[];
  created_at: string;
  updated_at: string;
}

export interface JbCompany {
  id: string;
  name: string;
  what_we_do: string | null;
  how_we_work: string | null;
  website_url: string | null;
  team_linkedin: LinkedInEntry[];
  is_verified: boolean;
  created_at: string;
  updated_at: string;
}

export interface JbCompanyMember {
  company_id: string;
  user_id: string;
  is_owner: boolean;
  joined_at: string;
}

export interface JbFavourite {
  id: string;
  company_id: string;
  applicant_profile_id: string;
  favourited_by: string;
  note: string | null;
  created_at: string;
}

export interface JbOutreach {
  id: string;
  company_id: string;
  applicant_profile_id: string;
  sent_by: string;
  message: string | null;
  status: JbOutreachStatus;
  sent_at: string;
  viewed_at: string | null;
}

/** Applicant profile joined with preferences, used in browse/detail views */
export interface JbApplicantWithPreferences extends JbApplicantProfile {
  jb_applicant_preferences: JbApplicantPreferences | null;
}

/** JB context for server components */
export interface JbContext {
  user: { id: string; email: string };
  jbRoles: JbRole[];
  applicantProfile: JbApplicantProfile | null;
  preferences: JbApplicantPreferences | null;
  companyMembership: (JbCompanyMember & { company: JbCompany }) | null;
  platformRole: string;
}
