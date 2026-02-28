import { BadgeDollarSign } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { fetchToolContext } from "@/lib/tools/fetch-tool-context";
import { ToolLayout } from "@/components/tools/tool-layout";
import { PricingExperiment } from "@/components/tools/pricing-experiment";

export default async function PricingExperimentPage({ params }: { params: Promise<{ teamId: string }> }) {
  const { teamId } = await params;
  const ctx = await fetchToolContext(teamId, "pricing_experiment");
  const supabase = await createClient();
  const { data: artifact } = await supabase.from("artifacts").select("id, data").eq("team_id", teamId).eq("artifact_type", "pricing_experiment").order("updated_at", { ascending: false }).limit(1).maybeSingle();
  return (
    <ToolLayout icon={BadgeDollarSign} title="Pricing Experiment Framework" description="Test willingness to pay before you launch. Startups that test pricing pre-launch are 2x more likely to achieve profitability within 2 years." teamId={teamId} artifactType="pricing_experiment" platformRole={ctx.effectiveRole} currentUserId={ctx.user.id} adminNotes={ctx.adminNotes} mentorNotes={ctx.mentorNotes} artifactId={artifact?.id ?? null}>
      <PricingExperiment teamId={teamId} userId={ctx.user.id} isReadOnly={ctx.teamRole === "mentor"} existingArtifact={artifact ? { id: artifact.id, data: artifact.data as Record<string, unknown> } : null} />
    </ToolLayout>
  );
}
