import { ShieldCheck } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { fetchToolContext } from "@/lib/tools/fetch-tool-context";
import { ToolLayout } from "@/components/tools/tool-layout";
import { ComplianceChecklist } from "@/components/tools/compliance-checklist";

export default async function ComplianceChecklistPage({ params }: { params: Promise<{ teamId: string }> }) {
  const { teamId } = await params;
  const ctx = await fetchToolContext(teamId, "compliance_checklist");
  const supabase = await createClient();
  const { data: artifact } = await supabase.from("artifacts").select("id, data").eq("team_id", teamId).eq("artifact_type", "compliance_checklist").order("updated_at", { ascending: false }).limit(1).maybeSingle();
  return (
    <ToolLayout icon={ShieldCheck} title="SA Compliance Checklist" description="The legal and regulatory steps every South African startup needs to complete. Work through these in order — the foundation items unblock everything else." teamId={teamId} artifactType="compliance_checklist" platformRole={ctx.platformRole} currentUserId={ctx.user.id} adminNotes={ctx.adminNotes} mentorNotes={ctx.mentorNotes} artifactId={artifact?.id ?? null}>
      <ComplianceChecklist teamId={teamId} userId={ctx.user.id} isReadOnly={ctx.teamRole === "mentor"} existingArtifact={artifact ? { id: artifact.id, data: artifact.data as Record<string, unknown> } : null} />
    </ToolLayout>
  );
}
