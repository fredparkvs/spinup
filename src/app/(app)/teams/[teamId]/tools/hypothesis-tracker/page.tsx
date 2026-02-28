import { FlaskConical } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { fetchToolContext } from "@/lib/tools/fetch-tool-context";
import { ToolLayout } from "@/components/tools/tool-layout";
import { HypothesisTracker } from "@/components/tools/hypothesis-tracker";

export default async function HypothesisTrackerPage({
  params,
}: {
  params: Promise<{ teamId: string }>;
}) {
  const { teamId } = await params;
  const ctx = await fetchToolContext(teamId, "hypothesis_tracker");
  const supabase = await createClient();

  const { data: artifacts } = await supabase
    .from("artifacts")
    .select("id, title, data, status, created_at, updated_at")
    .eq("team_id", teamId)
    .eq("artifact_type", "hypothesis_tracker")
    .order("created_at", { ascending: true });

  return (
    <ToolLayout
      icon={FlaskConical}
      title="Hypothesis Tracker"
      description="Track and test the core assumptions that underpin your business. Each hypothesis is a belief you must validate with real evidence."
      teamId={teamId}
      artifactType="hypothesis_tracker"
      platformRole={ctx.effectiveRole}
      currentUserId={ctx.user.id}
      adminNotes={ctx.adminNotes}
      mentorNotes={ctx.mentorNotes}
    >
      <HypothesisTracker
        teamId={teamId}
        userId={ctx.user.id}
        isReadOnly={ctx.teamRole === "mentor"}
        initialHypotheses={(artifacts ?? []).map((a) => ({
          id: a.id,
          data: a.data as Record<string, unknown>,
          status: a.status,
          created_at: a.created_at,
        }))}
      />
    </ToolLayout>
  );
}
