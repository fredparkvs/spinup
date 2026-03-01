import { Radar } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { fetchToolContext } from "@/lib/tools/fetch-tool-context";
import { ToolLayout } from "@/components/tools/tool-layout";
import { ScalingReadiness } from "@/components/tools/scaling-readiness";

export default async function ScalingReadinessPage({ params }: { params: Promise<{ teamId: string }> }) {
  const { teamId } = await params;
  const ctx = await fetchToolContext(teamId, "scaling_readiness");
  const supabase = await createClient();
  const { data: artifact } = await supabase.from("artifacts").select("id, data").eq("team_id", teamId).eq("artifact_type", "scaling_readiness").order("updated_at", { ascending: false }).limit(1).maybeSingle();
  return (
    <ToolLayout icon={Radar} title="Scaling Readiness Assessment" description="Assess your readiness to scale across six pillars and identify your real constraints before they slow you down." teamId={teamId} artifactType="scaling_readiness" platformRole={ctx.effectiveRole} currentUserId={ctx.user.id} adminNotes={ctx.adminNotes} mentorNotes={ctx.mentorNotes} artifactId={artifact?.id ?? null}>
      <ScalingReadiness teamId={teamId} userId={ctx.user.id} isReadOnly={ctx.effectiveRole !== "entrepreneur"} existingArtifact={artifact ? { id: artifact.id, data: artifact.data as Record<string, unknown> } : null} nextToolHref={`/teams/${teamId}/tools/gtm-playbook`} />
    </ToolLayout>
  );
}
