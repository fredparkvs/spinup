import { Map } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { fetchToolContext } from "@/lib/tools/fetch-tool-context";
import { ToolLayout } from "@/components/tools/tool-layout";
import { CompetitiveLandscape } from "@/components/tools/competitive-landscape";

export default async function CompetitiveLandscapePage({
  params,
}: {
  params: Promise<{ teamId: string }>;
}) {
  const { teamId } = await params;
  const ctx = await fetchToolContext(teamId, "competitive_landscape");
  const supabase = await createClient();

  const { data: artifact } = await supabase
    .from("artifacts")
    .select("id, data, status")
    .eq("team_id", teamId)
    .eq("artifact_type", "competitive_landscape")
    .order("updated_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  return (
    <ToolLayout
      icon={Map}
      title="Competitive Landscape Map"
      description="Identify existing solutions, their weaknesses, and the specific gap your research innovation fills. Include SA-specific context."
      teamId={teamId}
      artifactType="competitive_landscape"
      platformRole={ctx.platformRole}
      currentUserId={ctx.user.id}
      adminNotes={ctx.adminNotes}
      mentorNotes={ctx.mentorNotes}
      promptVpReview
      valueProposition={ctx.team.value_proposition}
      vpUpdatedAt={ctx.team.vp_updated_at}
      artifactId={artifact?.id ?? null}
    >
      <CompetitiveLandscape
        teamId={teamId}
        userId={ctx.user.id}
        isReadOnly={ctx.teamRole === "mentor"}
        existingArtifact={artifact ? { id: artifact.id, data: artifact.data as Record<string, unknown> } : null}
      />
    </ToolLayout>
  );
}
