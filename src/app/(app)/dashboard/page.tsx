import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

// /dashboard redirects to the user's first team, or to onboarding/team creation
export default async function DashboardPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/sign-in");

  // Check onboarding
  const { data: profile } = await supabase.from("profiles").select("onboarding_completed, platform_role").eq("id", user.id).single();
  if (!profile?.onboarding_completed) redirect("/onboarding");

  // Find first team membership
  const { data: membership } = await supabase
    .from("team_members")
    .select("team_id")
    .eq("user_id", user.id)
    .order("joined_at", { ascending: true })
    .limit(1)
    .maybeSingle();

  if (membership) {
    redirect(`/teams/${membership.team_id}`);
  }

  // No team yet
  redirect("/team/create");
}
