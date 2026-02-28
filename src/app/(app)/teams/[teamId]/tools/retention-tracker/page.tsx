import { Repeat2 } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { fetchToolContext } from "@/lib/tools/fetch-tool-context";
import { ToolLayout } from "@/components/tools/tool-layout";
import { RetentionTracker } from "@/components/tools/retention-tracker";

export default async function RetentionTrackerPage({ params }: { params: Promise<{ teamId: string }> }) {
  const { teamId } = await params;
  const ctx = await fetchToolContext(teamId, "retention_tracker");
  const supabase = await createClient();
  const { data: artifact } = await supabase.from("artifacts").select("id, data").eq("team_id", teamId).eq("artifact_type", "retention_tracker").order("updated_at", { ascending: false }).limit(1).maybeSingle();
  return (
    <ToolLayout icon={Repeat2} title="Revenue Retention Tracker" description="Track NRR, GRR, and logo retention by cohort. Understanding your retention engine is the foundation of predictable growth." teamId={teamId} artifactType="retention_tracker" platformRole={ctx.effectiveRole} currentUserId={ctx.user.id} adminNotes={ctx.adminNotes} mentorNotes={ctx.mentorNotes} artifactId={artifact?.id ?? null}>
      <RetentionTracker teamId={teamId} userId={ctx.user.id} isReadOnly={ctx.effectiveRole !== "entrepreneur"} existingArtifact={artifact ? { id: artifact.id, data: artifact.data as Record<string, unknown> } : null} />
    </ToolLayout>
  );
}
