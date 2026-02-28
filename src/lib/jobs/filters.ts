import type { SupabaseClient } from "@supabase/supabase-js";
import type { JbJobType, JbWorkMode } from "./types";

export interface ApplicantFilters {
  skills?: string;
  location?: string;
  jobTypes?: JbJobType[];
  workModes?: JbWorkMode[];
  availableFrom?: string;
  availableUntil?: string;
}

/**
 * Build a Supabase query for browsing published applicant profiles.
 * Joins with preferences for filtering.
 */
export function buildApplicantQuery(
  supabase: SupabaseClient,
  filters: ApplicantFilters
) {
  let query = supabase
    .from("jb_applicant_profiles")
    .select("*, jb_applicant_preferences(*)")
    .eq("is_published", true)
    .order("updated_at", { ascending: false });

  if (filters.skills) {
    query = query.contains("software_skills", [filters.skills]);
  }

  if (filters.location) {
    query = query.or(
      `location_city.ilike.%${filters.location}%,location_country.ilike.%${filters.location}%`
    );
  }

  return query;
}

/**
 * Client-side filter applicants by preferences (since Supabase array
 * containment on joined tables is limited).
 */
export function filterByPreferences<
  T extends { jb_applicant_preferences: Array<{ job_types: string[]; work_modes: string[]; available_from: string | null; available_until: string | null }> | null }
>(
  applicants: T[],
  filters: ApplicantFilters
): T[] {
  return applicants.filter((a) => {
    const prefs = a.jb_applicant_preferences?.[0];
    if (!prefs) return true;

    if (filters.jobTypes?.length) {
      const hasMatch = filters.jobTypes.some((jt) =>
        prefs.job_types.includes(jt)
      );
      if (!hasMatch) return false;
    }

    if (filters.workModes?.length) {
      const hasMatch = filters.workModes.some((wm) =>
        prefs.work_modes.includes(wm)
      );
      if (!hasMatch) return false;
    }

    if (filters.availableFrom && prefs.available_from) {
      if (prefs.available_from > filters.availableFrom) return false;
    }

    return true;
  });
}
