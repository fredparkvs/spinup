import { redirect } from "next/navigation";
import { Suspense } from "react";
import { fetchJbContext } from "@/lib/jobs/fetch-jb-context";
import { createClient } from "@/lib/supabase/server";
import { ApplicantCard } from "@/components/jobs/applicant-card";
import { ApplicantFilters } from "@/components/jobs/applicant-filters";
import { buildApplicantQuery, filterByPreferences } from "@/lib/jobs/filters";
import type { JbJobType, JbWorkMode, JbApplicantPreferences } from "@/lib/jobs/types";

export default async function BrowseApplicantsPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const ctx = await fetchJbContext();

  if (!ctx.companyMembership && ctx.platformRole !== "admin") {
    redirect("/jobs");
  }

  const companyId = ctx.companyMembership?.company_id ?? "";
  const params = await searchParams;

  const supabase = await createClient();

  // Build query
  const filters = {
    skills: typeof params.skills === "string" ? params.skills : undefined,
    location: typeof params.location === "string" ? params.location : undefined,
    jobTypes: (Array.isArray(params.jobType) ? params.jobType : params.jobType ? [params.jobType] : []) as JbJobType[],
    workModes: (Array.isArray(params.workMode) ? params.workMode : params.workMode ? [params.workMode] : []) as JbWorkMode[],
  };

  const query = buildApplicantQuery(supabase, filters);
  const { data: applicants } = await query;

  // Fetch favourites for this company
  const { data: favourites } = await supabase
    .from("jb_favourites")
    .select("applicant_profile_id")
    .eq("company_id", companyId);

  const favouriteIds = new Set(favourites?.map((f: { applicant_profile_id: string }) => f.applicant_profile_id) ?? []);

  // Client-side preference filtering
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const rawApplicants = (applicants ?? []) as any[];
  const filtered = filterByPreferences(rawApplicants, filters);

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold tracking-tight">Browse Applicants</h1>
        <p className="text-sm text-muted-foreground">
          {filtered.length} candidate{filtered.length !== 1 ? "s" : ""} found
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-[240px_1fr] gap-6">
        <Suspense>
          <ApplicantFilters />
        </Suspense>

        <div className="space-y-4">
          {filtered.length === 0 && (
            <p className="text-sm text-muted-foreground py-8 text-center">
              No candidates match your filters.
            </p>
          )}
          {filtered.map((a) => {
            const prefs: JbApplicantPreferences | null = a.jb_applicant_preferences?.[0] ?? null;
            return (
              <ApplicantCard
                key={a.id}
                profile={a}
                preferences={prefs}
                companyId={companyId}
                isFavourited={favouriteIds.has(a.id)}
              />
            );
          })}
        </div>
      </div>
    </div>
  );
}
