import { redirect } from "next/navigation";
import { fetchJbContext } from "@/lib/jobs/fetch-jb-context";
import { CompanyProfileForm } from "@/components/jobs/company-profile-form";

export default async function CompanyProfilePage() {
  const ctx = await fetchJbContext();

  if (!ctx.companyMembership && ctx.platformRole !== "admin") {
    redirect("/jobs");
  }

  if (!ctx.companyMembership) {
    redirect("/jobs/onboarding");
  }

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold tracking-tight">Company Profile</h1>
        <p className="text-sm text-muted-foreground">
          This information is shared with candidates when you reach out to them.
        </p>
      </div>
      <CompanyProfileForm company={ctx.companyMembership.company} />
    </div>
  );
}
