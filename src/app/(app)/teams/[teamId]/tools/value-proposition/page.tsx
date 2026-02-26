import { Target } from "lucide-react";
import { fetchToolContext } from "@/lib/tools/fetch-tool-context";
import { ToolLayout } from "@/components/tools/tool-layout";
import { ValuePropositionEditor } from "@/components/tools/value-proposition-editor";

export default async function ValuePropositionPage({
  params,
}: {
  params: Promise<{ teamId: string }>;
}) {
  const { teamId } = await params;
  const ctx = await fetchToolContext(teamId, "value_proposition");

  return (
    <ToolLayout
      icon={Target}
      title="Value Proposition"
      description='Define your 10x advantage: "Our product helps [customer] achieve [benefit] by [how], an improvement of X over current options."'
      teamId={teamId}
      artifactType="value_proposition"
      platformRole={ctx.platformRole}
      currentUserId={ctx.user.id}
      adminNotes={ctx.adminNotes}
      mentorNotes={ctx.mentorNotes}
    >
      <ValuePropositionEditor
        teamId={teamId}
        initialValueProposition={ctx.team.value_proposition}
      />
    </ToolLayout>
  );
}
