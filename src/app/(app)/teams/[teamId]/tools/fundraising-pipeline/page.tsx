import { Handshake } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { fetchToolContext } from "@/lib/tools/fetch-tool-context";
import { ToolLayout } from "@/components/tools/tool-layout";
import { FundraisingPipeline } from "@/components/tools/fundraising-pipeline";

export default async function FundraisingPipelinePage({ params }: { params: Promise<{ teamId: string }> }) {
  const { teamId } = await params;
  const ctx = await fetchToolContext(teamId, "fundraising_pipeline");
  const supabase = await createClient();
  const { data: artifact } = await supabase.from("artifacts").select("id, data").eq("team_id", teamId).eq("artifact_type", "fundraising_pipeline").order("updated_at", { ascending: false }).limit(1).maybeSingle();
  return (
    <ToolLayout icon={Handshake} title="Fundraising Pipeline Manager" description="Manage your investor pipeline like a sales process. Track stages, next steps, and committed capital across your round." teamId={teamId} artifactType="fundraising_pipeline" platformRole={ctx.effectiveRole} currentUserId={ctx.user.id} adminNotes={ctx.adminNotes} mentorNotes={ctx.mentorNotes} artifactId={artifact?.id ?? null}>
      <FundraisingPipeline teamId={teamId} userId={ctx.user.id} isReadOnly={ctx.effectiveRole !== "entrepreneur"} existingArtifact={artifact ? { id: artifact.id, data: artifact.data as Record<string, unknown> } : null} />
    </ToolLayout>
  );
}
