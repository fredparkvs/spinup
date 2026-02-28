import { TrendingUp } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { fetchToolContext } from "@/lib/tools/fetch-tool-context";
import { ToolLayout } from "@/components/tools/tool-layout";
import { ScaleUnitEconomics } from "@/components/tools/scale-unit-economics";

export default async function ScaleUnitEconomicsPage({ params }: { params: Promise<{ teamId: string }> }) {
  const { teamId } = await params;
  const ctx = await fetchToolContext(teamId, "scale_unit_economics");
  const supabase = await createClient();
  const { data: artifact } = await supabase.from("artifacts").select("id, data").eq("team_id", teamId).eq("artifact_type", "scale_unit_economics").order("updated_at", { ascending: false }).limit(1).maybeSingle();
  return (
    <ToolLayout icon={TrendingUp} title="Unit Economics Dashboard" description="Track CAC by channel, LTV by segment, and Net Revenue Retention — the core metrics that determine whether your growth is sustainable." teamId={teamId} artifactType="scale_unit_economics" platformRole={ctx.effectiveRole} currentUserId={ctx.user.id} adminNotes={ctx.adminNotes} mentorNotes={ctx.mentorNotes} artifactId={artifact?.id ?? null}>
      <ScaleUnitEconomics teamId={teamId} userId={ctx.user.id} isReadOnly={ctx.effectiveRole !== "entrepreneur"} existingArtifact={artifact ? { id: artifact.id, data: artifact.data as Record<string, unknown> } : null} />
    </ToolLayout>
  );
}
