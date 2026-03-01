import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { AppSelectorCard } from "@/components/jobs/app-selector-card";
import { FlaskConical, Briefcase, Rocket } from "lucide-react";

export default async function DashboardPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/sign-in");

  const admin = createAdminClient();

  // Parallel fetch: profile, team count, JB roles
  const [profileResult, teamsResult, jbRolesResult] = await Promise.all([
    supabase
      .from("profiles")
      .select("onboarding_completed, platform_role")
      .eq("id", user.id)
      .single(),
    admin
      .from("team_members")
      .select("team_id", { count: "exact", head: true })
      .eq("user_id", user.id),
    supabase
      .from("jb_user_roles")
      .select("role")
      .eq("user_id", user.id),
  ]);

  const profile = profileResult.data;
  const jbRoles = jbRolesResult.data?.map((r: { role: string }) => r.role) ?? [];

  const teamCount = teamsResult.count ?? 0;
  const hasJbAccess = jbRoles.length > 0;
  const jbDetail = hasJbAccess
    ? `Signed up as ${jbRoles.join(" & ").replace("company_member", "company")}`
    : undefined;

  // Determine app-specific CTA text
  const spinupCta =
    !profile?.onboarding_completed && teamCount === 0
      ? "Get Started"
      : teamCount > 0
      ? "Open"
      : "Get Started";

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-muted/40 px-4 py-12">
      <div className="mb-8 flex flex-col items-center gap-2">
        <h1 className="text-3xl font-bold tracking-tight">SpinUp</h1>
        <p className="text-sm text-muted-foreground">Choose an app to get started</p>
      </div>

      <div className="w-full max-w-md flex flex-col gap-4">
        <AppSelectorCard
          icon={FlaskConical}
          title="SpinUp Tools"
          description="Evidence-based tools for research spinouts"
          status="active"
          href={!profile?.onboarding_completed && teamCount === 0 ? "/onboarding" : "/teams"}
          actionLabel={spinupCta}
          detail={teamCount > 0 ? `${teamCount} team${teamCount !== 1 ? "s" : ""}` : undefined}
        />

        <AppSelectorCard
          icon={Briefcase}
          title="Job Board"
          description="Connect talent with startups — bias-free"
          status="new"
          href={hasJbAccess ? "/jobs" : "/jobs/onboarding"}
          actionLabel={hasJbAccess ? "Open" : "Get Started"}
          detail={jbDetail}
        />

        <AppSelectorCard
          icon={Rocket}
          title="Accelerator"
          description="Structured programmes to scale your venture"
          status="new"
          href="/accelerator"
          actionLabel={teamCount > 0 ? "Open" : "Get Started"}
        />
      </div>
    </div>
  );
}
