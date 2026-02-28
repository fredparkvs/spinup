import { redirect } from "next/navigation";
import { fetchJbContext } from "@/lib/jobs/fetch-jb-context";
import { ApplicantProfileForm } from "@/components/jobs/applicant-profile-form";

export default async function ApplicantProfilePage() {
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
        <h1 className="text-2xl font-bold tracking-tight">My Profile</h1>
        <p className="text-sm text-muted-foreground">
          Build your anonymous CV. Companies will see this without your name or photo.
        </p>
      </div>
      <ApplicantProfileForm profile={ctx.applicantProfile} />
    </div>
  );
}
