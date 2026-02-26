import { TrendingDown } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { fetchToolContext } from "@/lib/tools/fetch-tool-context";
import { ToolLayout } from "@/components/tools/tool-layout";
import { RunwayCalculator } from "@/components/tools/runway-calculator";

export default async function RunwayCalculatorPage({ params }: { params: Promise<{ teamId: string }> }) {
  const { teamId } = await params;
  const ctx = await fetchToolContext(teamId, "runway_calculator");
  const supabase = await createClient();
  const { data: artifacts } = await supabase.from("artifacts").select("id, data, created_at").eq("team_id", teamId).eq("artifact_type", "runway_calculator").order("created_at", { ascending: true });
  return (
    <ToolLayout icon={TrendingDown} title="Runway Calculator" description="Track your burn rate, cash on hand, and how long you have left. Runway is time to learn — protect it." teamId={teamId} artifactType="runway_calculator" platformRole={ctx.platformRole} currentUserId={ctx.user.id} adminNotes={ctx.adminNotes} mentorNotes={ctx.mentorNotes}>
      <RunwayCalculator teamId={teamId} userId={ctx.user.id} isReadOnly={ctx.teamRole === "mentor"} snapshots={(artifacts ?? []).map((a) => ({ id: a.id, data: a.data as Record<string, unknown>, created_at: a.created_at }))} />
    </ToolLayout>
  );
}
