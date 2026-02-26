import { BarChart3 } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { fetchToolContext } from "@/lib/tools/fetch-tool-context";
import { ToolLayout } from "@/components/tools/tool-layout";
import { FinancialModel } from "@/components/tools/financial-model";

export default async function FinancialModelPage({ params }: { params: Promise<{ teamId: string }> }) {
  const { teamId } = await params;
  const ctx = await fetchToolContext(teamId, "financial_model");
  const supabase = await createClient();
  const { data: artifact } = await supabase.from("artifacts").select("id, data").eq("team_id", teamId).eq("artifact_type", "financial_model").order("updated_at", { ascending: false }).limit(1).maybeSingle();
  return (
    <ToolLayout icon={BarChart3} title="Financial Model" description="24-month revenue projections and cost structure. Builds the narrative for investor conversations and pitch deck financials slide." teamId={teamId} artifactType="financial_model" platformRole={ctx.platformRole} currentUserId={ctx.user.id} adminNotes={ctx.adminNotes} mentorNotes={ctx.mentorNotes} artifactId={artifact?.id ?? null}>
      <FinancialModel teamId={teamId} userId={ctx.user.id} isReadOnly={ctx.teamRole === "mentor"} existingArtifact={artifact ? { id: artifact.id, data: artifact.data as Record<string, unknown> } : null} />
    </ToolLayout>
  );
}
