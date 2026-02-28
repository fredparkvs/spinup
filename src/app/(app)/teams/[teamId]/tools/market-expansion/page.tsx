import { Globe } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { fetchToolContext } from "@/lib/tools/fetch-tool-context";
import { ToolLayout } from "@/components/tools/tool-layout";
import { MarketExpansion } from "@/components/tools/market-expansion";

export default async function MarketExpansionPage({ params }: { params: Promise<{ teamId: string }> }) {
  const { teamId } = await params;
  const ctx = await fetchToolContext(teamId, "market_expansion");
  const supabase = await createClient();
  const { data: artifact } = await supabase.from("artifacts").select("id, data").eq("team_id", teamId).eq("artifact_type", "market_expansion").order("updated_at", { ascending: false }).limit(1).maybeSingle();
  return (
    <ToolLayout icon={Globe} title="Market Expansion Planner" description="Score and prioritise new markets before committing resources. Expansion must be earned — know your criteria before you move." teamId={teamId} artifactType="market_expansion" platformRole={ctx.effectiveRole} currentUserId={ctx.user.id} adminNotes={ctx.adminNotes} mentorNotes={ctx.mentorNotes} artifactId={artifact?.id ?? null}>
      <MarketExpansion teamId={teamId} userId={ctx.user.id} isReadOnly={ctx.effectiveRole !== "entrepreneur"} existingArtifact={artifact ? { id: artifact.id, data: artifact.data as Record<string, unknown> } : null} />
    </ToolLayout>
  );
}
