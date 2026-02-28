import { redirect } from "next/navigation";
import { fetchJbContext } from "@/lib/jobs/fetch-jb-context";
import { ApplicantPreferencesForm } from "@/components/jobs/applicant-preferences-form";

export default async function PreferencesPage() {
  const ctx = await fetchJbContext();

  if (!ctx.jbRoles.includes("applicant") && ctx.platformRole !== "admin") {
    redirect("/jobs");
  }

  if (!ctx.applicantProfile) {
    redirect("/jobs/onboarding");
  }

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold tracking-tight">Preferences</h1>
        <p className="text-sm text-muted-foreground">
          Tell companies what you&apos;re looking for so they can find you.
        </p>
      </div>
      <ApplicantPreferencesForm
        profileId={ctx.applicantProfile.id}
        preferences={ctx.preferences}
      />
    </div>
  );
}
