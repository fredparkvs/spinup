import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { AppSidebar } from "@/components/app-sidebar";
import type { PlatformRole, TeamMemberRole } from "@/lib/types/database";

interface TeamLayoutProps {
  children: React.ReactNode;
  params: Promise<{ teamId: string }>;
}

export default async function TeamLayout({ children, params }: TeamLayoutProps) {
  const { teamId } = await params;
  const supabase = await createClient();

  // Get current user
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/sign-in");
  }

  // Fetch team record
  const { data: team, error: teamError } = await supabase
    .from("teams")
    .select("id, name, operating_name, current_phase, value_proposition, vp_updated_at")
    .eq("id", teamId)
    .single();

  if (teamError || !team) {
    redirect("/dashboard");
  }

  const adminClient = createAdminClient();

  // Fetch user's team membership and profile in parallel
  // Profile read uses admin client to reliably get platform_role (bypasses JWT forwarding issues)
  const [memberResult, profileResult] = await Promise.all([
    supabase
      .from("team_members")
      .select("role")
      .eq("team_id", teamId)
      .eq("user_id", user.id)
      .single(),
    adminClient
      .from("profiles")
      .select("platform_role")
      .eq("id", user.id)
      .single(),
  ]);

  const platformRole: PlatformRole = profileResult.data?.platform_role ?? "entrepreneur";
  const teamRole: TeamMemberRole | null = memberResult.data?.role ?? null;

  // If user is not a team member and not a platform admin, redirect
  if (!teamRole && platformRole !== "admin") {
    redirect("/dashboard");
  }

  return (
    <div className="flex flex-col h-dvh md:flex-row overflow-hidden">
      <AppSidebar
        teamId={teamId}
        teamName={team.name}
        operatingName={team.operating_name}
        currentPhase={team.current_phase}
        valueProposition={team.value_proposition}
        vpUpdatedAt={team.vp_updated_at}
        teamRole={teamRole}
        platformRole={platformRole}
      />
      <main className="flex-1 overflow-y-auto">
        {children}
      </main>
    </div>
  );
}
