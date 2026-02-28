import { redirect } from "next/navigation";
import { fetchJbContext } from "@/lib/jobs/fetch-jb-context";
import { ApplicantDetail } from "@/components/jobs/applicant-detail";
import { Badge } from "@/components/ui/badge";

export default async function MyProfilePreviewPage() {
  const ctx = await fetchJbContext();

  if (!ctx.jbRoles.includes("applicant") && ctx.platformRole !== "admin") {
    redirect("/jobs");
  }

  if (!ctx.applicantProfile) {
    redirect("/jobs/onboarding");
  }

  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Profile Preview</h1>
          <p className="text-sm text-muted-foreground">
            This is how companies will see your profile
          </p>
        </div>
        <Badge variant={ctx.applicantProfile.is_published ? "default" : "outline"}>
          {ctx.applicantProfile.is_published ? "Published" : "Draft"}
        </Badge>
      </div>
      <ApplicantDetail
        profile={ctx.applicantProfile}
        preferences={ctx.preferences}
      />
    </div>
  );
}
