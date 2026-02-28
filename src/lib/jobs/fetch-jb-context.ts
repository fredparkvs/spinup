import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { redirect } from "next/navigation";
import type { JbContext, JbRole, AcademicEntry, WorkExperienceEntry } from "./types";

export async function fetchJbContext(): Promise<JbContext> {
  const supabase = await createClient();
  const admin = createAdminClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/sign-in");

  const [rolesResult, profileResult, applicantResult, companyResult] =
    await Promise.all([
      supabase
        .from("jb_user_roles")
        .select("role")
        .eq("user_id", user.id),
      admin
        .from("profiles")
        .select("platform_role")
        .eq("id", user.id)
        .single(),
      supabase
        .from("jb_applicant_profiles")
        .select("*, jb_applicant_preferences(*)")
        .eq("user_id", user.id)
        .maybeSingle(),
      supabase
        .from("jb_company_members")
        .select("company_id, user_id, is_owner, joined_at, jb_companies(*)")
        .eq("user_id", user.id)
        .maybeSingle(),
    ]);

  const jbRoles: JbRole[] =
    rolesResult.data?.map((r: { role: JbRole }) => r.role) ?? [];
  const platformRole = profileResult.data?.platform_role ?? "entrepreneur";

  const applicantProfile = applicantResult.data
    ? {
        id: applicantResult.data.id,
        user_id: applicantResult.data.user_id,
        anonymous_id: applicantResult.data.anonymous_id,
        academics: applicantResult.data.academics as unknown as AcademicEntry[],
        software_skills: applicantResult.data.software_skills,
        languages: applicantResult.data.languages,
        location_city: applicantResult.data.location_city,
        location_country: applicantResult.data.location_country,
        willing_to_relocate: applicantResult.data.willing_to_relocate,
        work_experience: applicantResult.data.work_experience as unknown as WorkExperienceEntry[],
        personality_description: applicantResult.data.personality_description,
        looking_for: applicantResult.data.looking_for,
        is_published: applicantResult.data.is_published,
        created_at: applicantResult.data.created_at,
        updated_at: applicantResult.data.updated_at,
      }
    : null;

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const preferences = (applicantResult.data as any)?.jb_applicant_preferences?.[0] as JbContext["preferences"] ?? null;

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const companyData = companyResult.data as any;
  const companyMembership = companyData?.jb_companies
    ? {
        company_id: companyData.company_id,
        user_id: companyData.user_id,
        is_owner: companyData.is_owner,
        joined_at: companyData.joined_at,
        company: companyData.jb_companies,
      }
    : null;

  return {
    user: { id: user.id, email: user.email ?? "" },
    jbRoles,
    applicantProfile,
    preferences,
    companyMembership,
    platformRole,
  };
}
