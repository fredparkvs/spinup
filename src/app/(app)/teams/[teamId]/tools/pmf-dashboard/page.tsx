import { BarChart3 } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { fetchToolContext } from "@/lib/tools/fetch-tool-context";
import { ToolLayout } from "@/components/tools/tool-layout";
import { PmfDashboard } from "@/components/tools/pmf-dashboard";

export default async function PmfDashboardPage({ params }: { params: Promise<{ teamId: string }> }) {
  const { teamId } = await params;
  const ctx = await fetchToolContext(teamId, "pmf_dashboard");
  const supabase = await createClient();
  const { data: entries } = await supabase.from("artifacts").select("id, data, created_at").eq("team_id", teamId).eq("artifact_type", "pmf_dashboard").order("created_at", { ascending: true });
  return (
    <ToolLayout icon={BarChart3} title="Product-Market Fit Dashboard" description="Track PMF signals over time. The Sean Ellis threshold: 40%+ of users say they'd be 'very disappointed' without your product." teamId={teamId} artifactType="pmf_dashboard" platformRole={ctx.effectiveRole} currentUserId={ctx.user.id} adminNotes={ctx.adminNotes} mentorNotes={ctx.mentorNotes}>
      <PmfDashboard teamId={teamId} userId={ctx.user.id} isReadOnly={ctx.teamRole === "mentor"} entries={(entries ?? []).map((e) => ({ id: e.id, data: e.data as Record<string, unknown>, created_at: e.created_at }))} />
    </ToolLayout>
  );
}
