import { BarChart2 } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { fetchToolContext } from "@/lib/tools/fetch-tool-context";
import { ToolLayout } from "@/components/tools/tool-layout";
import { ScaleFinancialModel } from "@/components/tools/scale-financial-model";

export default async function ScaleFinancialModelPage({ params }: { params: Promise<{ teamId: string }> }) {
  const { teamId } = await params;
  const ctx = await fetchToolContext(teamId, "scale_financial_model");
  const supabase = await createClient();
  const { data: artifact } = await supabase.from("artifacts").select("id, data").eq("team_id", teamId).eq("artifact_type", "scale_financial_model").order("updated_at", { ascending: false }).limit(1).maybeSingle();
  return (
    <ToolLayout icon={BarChart2} title="Growth-Stage Financial Model" description="Model three revenue scenarios, track runway, and set financial milestones. Know your numbers before your board or investors ask." teamId={teamId} artifactType="scale_financial_model" platformRole={ctx.effectiveRole} currentUserId={ctx.user.id} adminNotes={ctx.adminNotes} mentorNotes={ctx.mentorNotes} artifactId={artifact?.id ?? null}>
      <ScaleFinancialModel teamId={teamId} userId={ctx.user.id} isReadOnly={ctx.effectiveRole !== "entrepreneur"} existingArtifact={artifact ? { id: artifact.id, data: artifact.data as Record<string, unknown> } : null} />
    </ToolLayout>
  );
}
