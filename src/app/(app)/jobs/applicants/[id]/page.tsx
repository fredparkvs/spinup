import { redirect } from "next/navigation";
import { fetchJbContext } from "@/lib/jobs/fetch-jb-context";
import { createClient } from "@/lib/supabase/server";
import { ApplicantDetail } from "@/components/jobs/applicant-detail";
import { FavouriteButton } from "@/components/jobs/favourite-button";
import { OutreachDialog } from "@/components/jobs/outreach-dialog";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";
import Link from "next/link";
import type { JbApplicantProfile, JbApplicantPreferences, AcademicEntry, WorkExperienceEntry } from "@/lib/jobs/types";

export default async function ApplicantDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const ctx = await fetchJbContext();

  if (!ctx.companyMembership && ctx.platformRole !== "admin") {
    redirect("/jobs");
  }

  const companyId = ctx.companyMembership?.company_id ?? "";
  const supabase = await createClient();

  const { data: applicant } = await supabase
    .from("jb_applicant_profiles")
    .select("*, jb_applicant_preferences(*)")
    .eq("id", id)
    .eq("is_published", true)
    .single();

  if (!applicant) {
    redirect("/jobs/applicants");
  }

  // Check favourite status
  const { data: fav } = await supabase
    .from("jb_favourites")
    .select("id")
    .eq("company_id", companyId)
    .eq("applicant_profile_id", id)
    .maybeSingle();

  const profile: JbApplicantProfile = {
    ...applicant,
    academics: applicant.academics as unknown as AcademicEntry[],
    work_experience: applicant.work_experience as unknown as WorkExperienceEntry[],
  };

  const preferences: JbApplicantPreferences | null =
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (applicant as any).jb_applicant_preferences?.[0] ?? null;

  return (
    <div>
      <Button asChild variant="ghost" size="sm" className="mb-4">
        <Link href="/jobs/applicants">
          <ArrowLeft className="size-3.5" />
          Back to browse
        </Link>
      </Button>

      <ApplicantDetail
        profile={profile}
        preferences={preferences}
        actions={
          <>
            <FavouriteButton
              companyId={companyId}
              applicantProfileId={id}
              isFavourited={!!fav}
            />
            <OutreachDialog
              companyId={companyId}
              applicantProfileId={id}
              anonymousId={profile.anonymous_id}
            />
          </>
        }
      />
    </div>
  );
}
