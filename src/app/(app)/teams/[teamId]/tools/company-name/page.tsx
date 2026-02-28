import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { CompanyNameChecker } from "@/components/tools/company-name-checker";

export default async function CompanyNamePage({
  params,
}: {
  params: Promise<{ teamId: string }>;
}) {
  const { teamId } = await params;
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/sign-in");
  }

  // Verify user is a member of this team
  const { data: membership } = await supabase
    .from("team_members")
    .select("id")
    .eq("team_id", teamId)
    .eq("user_id", user.id)
    .single();

  if (!membership) {
    redirect("/team/create");
  }

  // Load existing company_name artifact for this team
  const { data: artifact } = await supabase
    .from("artifacts")
    .select("*")
    .eq("team_id", teamId)
    .eq("artifact_type", "company_name")
    .order("updated_at", { ascending: false })
    .limit(1)
    .single();

  // Load the team's current operating_name
  const { data: team } = await supabase
    .from("teams")
    .select("operating_name")
    .eq("id", teamId)
    .single();

  return (
    <div className="mx-auto w-full max-w-3xl px-4 py-8">
      <CompanyNameChecker
        teamId={teamId}
        userId={user.id}
        existingArtifact={
          artifact
            ? {
                id: artifact.id,
                data: artifact.data as Record<string, unknown>,
                status: artifact.status,
              }
            : null
        }
        currentOperatingName={team?.operating_name ?? null}
      />
    </div>
  );
}
