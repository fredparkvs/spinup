import { Calculator } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { fetchToolContext } from "@/lib/tools/fetch-tool-context";
import { ToolLayout } from "@/components/tools/tool-layout";
import { UnitEconomics } from "@/components/tools/unit-economics";

export default async function UnitEconomicsPage({ params }: { params: Promise<{ teamId: string }> }) {
  const { teamId } = await params;
  const ctx = await fetchToolContext(teamId, "unit_economics");
  const supabase = await createClient();
  const { data: artifact } = await supabase.from("artifacts").select("id, data").eq("team_id", teamId).eq("artifact_type", "unit_economics").order("updated_at", { ascending: false }).limit(1).maybeSingle();
  return (
    <ToolLayout icon={Calculator} title="Unit Economics Calculator" description="Calculate CAC, LTV, gross margin, and break-even point. Healthy unit economics must precede scaling." teamId={teamId} artifactType="unit_economics" platformRole={ctx.platformRole} currentUserId={ctx.user.id} adminNotes={ctx.adminNotes} mentorNotes={ctx.mentorNotes} artifactId={artifact?.id ?? null}>
      <UnitEconomics teamId={teamId} userId={ctx.user.id} isReadOnly={ctx.teamRole === "mentor"} existingArtifact={artifact ? { id: artifact.id, data: artifact.data as Record<string, unknown> } : null} />
    </ToolLayout>
  );
}
