import { BookOpenCheck } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { fetchToolContext } from "@/lib/tools/fetch-tool-context";
import { ToolLayout } from "@/components/tools/tool-layout";
import { GtmPlaybook } from "@/components/tools/gtm-playbook";

export default async function GtmPlaybookPage({ params }: { params: Promise<{ teamId: string }> }) {
  const { teamId } = await params;
  const ctx = await fetchToolContext(teamId, "gtm_playbook");
  const supabase = await createClient();
  const { data: artifact } = await supabase.from("artifacts").select("id, data").eq("team_id", teamId).eq("artifact_type", "gtm_playbook").order("updated_at", { ascending: false }).limit(1).maybeSingle();
  return (
    <ToolLayout icon={BookOpenCheck} title="GTM Playbook Builder" description="Document your ideal customer, acquisition channels, qualification criteria, messaging, pricing, and onboarding into a repeatable sales playbook." teamId={teamId} artifactType="gtm_playbook" platformRole={ctx.effectiveRole} currentUserId={ctx.user.id} adminNotes={ctx.adminNotes} mentorNotes={ctx.mentorNotes} artifactId={artifact?.id ?? null}>
      <GtmPlaybook teamId={teamId} userId={ctx.user.id} isReadOnly={ctx.effectiveRole !== "entrepreneur"} existingArtifact={artifact ? { id: artifact.id, data: artifact.data as Record<string, unknown> } : null} />
    </ToolLayout>
  );
}
