import { redirect } from "next/navigation";
import { fetchJbContext } from "@/lib/jobs/fetch-jb-context";
import { createClient } from "@/lib/supabase/server";
import { ApplicantCard } from "@/components/jobs/applicant-card";
import { Heart } from "lucide-react";
import type { JbApplicantPreferences, AcademicEntry, WorkExperienceEntry } from "@/lib/jobs/types";

export default async function FavouritesPage() {
  const ctx = await fetchJbContext();

  if (!ctx.companyMembership && ctx.platformRole !== "admin") {
    redirect("/jobs");
  }

  const companyId = ctx.companyMembership?.company_id ?? "";
  const supabase = await createClient();

  const { data: favourites } = await supabase
    .from("jb_favourites")
    .select("applicant_profile_id, jb_applicant_profiles(*, jb_applicant_preferences(*))")
    .eq("company_id", companyId)
    .order("created_at", { ascending: false });

  const items = favourites ?? [];

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold tracking-tight">Favourites</h1>
        <p className="text-sm text-muted-foreground">
          {items.length} candidate{items.length !== 1 ? "s" : ""} saved
        </p>
      </div>

      {items.length === 0 ? (
        <div className="text-center py-12">
          <Heart className="size-8 text-muted-foreground mx-auto mb-3" />
          <p className="text-sm text-muted-foreground">No favourites yet.</p>
          <p className="text-xs text-muted-foreground">
            Browse applicants and click the heart icon to save candidates here.
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {items.map((fav) => {
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            const a = (fav as any).jb_applicant_profiles;
            if (!a) return null;
            const prefs: JbApplicantPreferences | null = a.jb_applicant_preferences?.[0] ?? null;
            return (
              <ApplicantCard
                key={a.id}
                profile={{
                  ...a,
                  academics: a.academics as AcademicEntry[],
                  work_experience: a.work_experience as WorkExperienceEntry[],
                }}
                preferences={prefs}
                companyId={companyId}
                isFavourited={true}
              />
            );
          })}
        </div>
      )}
    </div>
  );
}
