import { MessageSquare } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { fetchToolContext } from "@/lib/tools/fetch-tool-context";
import { ToolLayout } from "@/components/tools/tool-layout";
import { InterviewScripts } from "@/components/tools/interview-scripts";

export default async function InterviewScriptsPage({
  params,
}: {
  params: Promise<{ teamId: string }>;
}) {
  const { teamId } = await params;
  const ctx = await fetchToolContext(teamId, "interview_scripts");
  const supabase = await createClient();

  const { data: artifacts } = await supabase
    .from("artifacts")
    .select("id, title, data, status, created_at, updated_at")
    .eq("team_id", teamId)
    .eq("artifact_type", "interview_scripts")
    .order("created_at", { ascending: true });

  return (
    <ToolLayout
      icon={MessageSquare}
      title="Customer Interview Scripts"
      description="Generate Mom Test-based interview scripts and log your findings. Aim for 5–7 interviews per persona to detect patterns."
      teamId={teamId}
      artifactType="interview_scripts"
      platformRole={ctx.effectiveRole}
      currentUserId={ctx.user.id}
      adminNotes={ctx.adminNotes}
      mentorNotes={ctx.mentorNotes}
      promptVpReview
      valueProposition={ctx.team.value_proposition}
      vpUpdatedAt={ctx.team.vp_updated_at}
    >
      <InterviewScripts
        teamId={teamId}
        userId={ctx.user.id}
        isReadOnly={ctx.teamRole === "mentor"}
        initialScripts={(artifacts ?? []).map((a) => ({
          id: a.id,
          title: a.title,
          data: a.data as Record<string, unknown>,
          created_at: a.created_at,
        }))}
      />
    </ToolLayout>
  );
}
