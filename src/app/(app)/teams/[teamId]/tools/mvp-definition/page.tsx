import { Rocket } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { fetchToolContext } from "@/lib/tools/fetch-tool-context";
import { ToolLayout } from "@/components/tools/tool-layout";
import { MvpDefinition } from "@/components/tools/mvp-definition";

export default async function MvpDefinitionPage({ params }: { params: Promise<{ teamId: string }> }) {
  const { teamId } = await params;
  const ctx = await fetchToolContext(teamId, "mvp_definition");
  const supabase = await createClient();
  const { data: artifact } = await supabase.from("artifacts").select("id, data").eq("team_id", teamId).eq("artifact_type", "mvp_definition").order("updated_at", { ascending: false }).limit(1).maybeSingle();
  return (
    <ToolLayout icon={Rocket} title="MVP Definition" description="Define the absolute minimum product that tests your core value proposition. Be ruthless about what stays out." teamId={teamId} artifactType="mvp_definition" platformRole={ctx.effectiveRole} currentUserId={ctx.user.id} adminNotes={ctx.adminNotes} mentorNotes={ctx.mentorNotes} artifactId={artifact?.id ?? null}>
      <MvpDefinition teamId={teamId} userId={ctx.user.id} isReadOnly={ctx.teamRole === "mentor"} existingArtifact={artifact ? { id: artifact.id, data: artifact.data as Record<string, unknown> } : null} />
    </ToolLayout>
  );
}
