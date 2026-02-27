import { Coins } from "lucide-react";
import { fetchToolContext } from "@/lib/tools/fetch-tool-context";
import { ToolLayout } from "@/components/tools/tool-layout";
import { FundingTracker } from "@/components/tools/funding-tracker";
import { createClient } from "@/lib/supabase/server";

export default async function FundingTrackerPage({ params }: { params: Promise<{ teamId: string }> }) {
  const { teamId } = await params;
  const ctx = await fetchToolContext(teamId, "funding_tracker");
  const supabase = await createClient();
  const { data: entries } = await supabase
    .from("funding_tracker_entries")
    .select("*")
    .eq("team_id", teamId)
    .order("created_at", { ascending: true });
  return (
    <ToolLayout icon={Coins} title="Funding Application Tracker" description="Track your applications to SA grants and funders. Pre-populated with the main sources for research spinouts." teamId={teamId} artifactType="funding_tracker" platformRole={ctx.effectiveRole} currentUserId={ctx.user.id} adminNotes={ctx.adminNotes} mentorNotes={ctx.mentorNotes}>
      <FundingTracker
        teamId={teamId}
        userId={ctx.user.id}
        isReadOnly={ctx.teamRole === "mentor"}
        existingEntries={(entries ?? []) as Parameters<typeof FundingTracker>[0]["existingEntries"]}
      />
    </ToolLayout>
  );
}
