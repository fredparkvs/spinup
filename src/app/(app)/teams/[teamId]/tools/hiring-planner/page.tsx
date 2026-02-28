import { UsersRound } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { fetchToolContext } from "@/lib/tools/fetch-tool-context";
import { ToolLayout } from "@/components/tools/tool-layout";
import { HiringPlanner } from "@/components/tools/hiring-planner";

export default async function HiringPlannerPage({ params }: { params: Promise<{ teamId: string }> }) {
  const { teamId } = await params;
  const ctx = await fetchToolContext(teamId, "hiring_planner");
  const supabase = await createClient();
  const { data: artifact } = await supabase.from("artifacts").select("id, data").eq("team_id", teamId).eq("artifact_type", "hiring_planner").order("updated_at", { ascending: false }).limit(1).maybeSingle();
  return (
    <ToolLayout icon={UsersRound} title="Hiring & Org Design Planner" description="Plan your headcount growth, identify critical hiring gaps, design your org structure, and build a repeatable recruiting engine." teamId={teamId} artifactType="hiring_planner" platformRole={ctx.effectiveRole} currentUserId={ctx.user.id} adminNotes={ctx.adminNotes} mentorNotes={ctx.mentorNotes} artifactId={artifact?.id ?? null}>
      <HiringPlanner teamId={teamId} userId={ctx.user.id} isReadOnly={ctx.effectiveRole !== "entrepreneur"} existingArtifact={artifact ? { id: artifact.id, data: artifact.data as Record<string, unknown> } : null} />
    </ToolLayout>
  );
}
