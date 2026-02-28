import { Users } from "lucide-react";
import { fetchToolContext } from "@/lib/tools/fetch-tool-context";
import { ToolLayout } from "@/components/tools/tool-layout";
import { AdvisorNetwork } from "@/components/tools/advisor-network";
import { createClient } from "@/lib/supabase/server";

export default async function AdvisorNetworkPage({ params }: { params: Promise<{ teamId: string }> }) {
  const { teamId } = await params;
  const ctx = await fetchToolContext(teamId, "advisor_network");
  const supabase = await createClient();
  const { data: entries } = await supabase
    .from("advisor_entries")
    .select("*")
    .eq("team_id", teamId)
    .order("created_at", { ascending: true });
  return (
    <ToolLayout icon={Users} title="Mentor & Advisor Network" description="Track the people who can help you succeed. Warm relationships take time — start building them before you need them." teamId={teamId} artifactType="advisor_network" platformRole={ctx.effectiveRole} currentUserId={ctx.user.id} adminNotes={ctx.adminNotes} mentorNotes={ctx.mentorNotes}>
      <AdvisorNetwork
        teamId={teamId}
        userId={ctx.user.id}
        isReadOnly={ctx.teamRole === "mentor"}
        existingEntries={(entries ?? []) as Parameters<typeof AdvisorNetwork>[0]["existingEntries"]}
      />
    </ToolLayout>
  );
}
