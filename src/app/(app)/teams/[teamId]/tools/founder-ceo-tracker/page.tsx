import { UserCog } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { fetchToolContext } from "@/lib/tools/fetch-tool-context";
import { ToolLayout } from "@/components/tools/tool-layout";
import { FounderCeoTracker } from "@/components/tools/founder-ceo-tracker";

export default async function FounderCeoTrackerPage({ params }: { params: Promise<{ teamId: string }> }) {
  const { teamId } = await params;
  const ctx = await fetchToolContext(teamId, "founder_ceo_tracker");
  const supabase = await createClient();
  const { data: artifact } = await supabase.from("artifacts").select("id, data").eq("team_id", teamId).eq("artifact_type", "founder_ceo_tracker").order("updated_at", { ascending: false }).limit(1).maybeSingle();
  return (
    <ToolLayout icon={UserCog} title="Founder-to-CEO Tracker" description="Track your evolution across five critical identity shifts. The team that got you to PMF is rarely the team that scales you — and that starts with you." teamId={teamId} artifactType="founder_ceo_tracker" platformRole={ctx.effectiveRole} currentUserId={ctx.user.id} adminNotes={ctx.adminNotes} mentorNotes={ctx.mentorNotes} artifactId={artifact?.id ?? null}>
      <FounderCeoTracker teamId={teamId} userId={ctx.user.id} isReadOnly={ctx.effectiveRole !== "entrepreneur"} existingArtifact={artifact ? { id: artifact.id, data: artifact.data as Record<string, unknown> } : null} />
    </ToolLayout>
  );
}
