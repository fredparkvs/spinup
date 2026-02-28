import { ListChecks } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { fetchToolContext } from "@/lib/tools/fetch-tool-context";
import { ToolLayout } from "@/components/tools/tool-layout";
import { OkrTracker } from "@/components/tools/okr-tracker";

export default async function OkrTrackerPage({ params }: { params: Promise<{ teamId: string }> }) {
  const { teamId } = await params;
  const ctx = await fetchToolContext(teamId, "okr_tracker");
  const supabase = await createClient();
  const { data: artifact } = await supabase.from("artifacts").select("id, data").eq("team_id", teamId).eq("artifact_type", "okr_tracker").order("updated_at", { ascending: false }).limit(1).maybeSingle();
  return (
    <ToolLayout icon={ListChecks} title="OKR Planning & Tracking" description="Set quarterly objectives and key results, assign owners, and track weekly progress. OKRs are the operating system of scaling companies." teamId={teamId} artifactType="okr_tracker" platformRole={ctx.effectiveRole} currentUserId={ctx.user.id} adminNotes={ctx.adminNotes} mentorNotes={ctx.mentorNotes} artifactId={artifact?.id ?? null}>
      <OkrTracker teamId={teamId} userId={ctx.user.id} isReadOnly={ctx.effectiveRole !== "entrepreneur"} existingArtifact={artifact ? { id: artifact.id, data: artifact.data as Record<string, unknown> } : null} />
    </ToolLayout>
  );
}
