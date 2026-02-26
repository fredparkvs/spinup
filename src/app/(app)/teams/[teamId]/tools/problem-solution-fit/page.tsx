import { Puzzle } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { fetchToolContext } from "@/lib/tools/fetch-tool-context";
import { ToolLayout } from "@/components/tools/tool-layout";
import { ProblemSolutionFit } from "@/components/tools/problem-solution-fit";

export default async function ProblemSolutionFitPage({
  params,
}: {
  params: Promise<{ teamId: string }>;
}) {
  const { teamId } = await params;
  const ctx = await fetchToolContext(teamId, "problem_solution_fit");
  const supabase = await createClient();

  const { data: artifact } = await supabase
    .from("artifacts")
    .select("id, data, status")
    .eq("team_id", teamId)
    .eq("artifact_type", "problem_solution_fit")
    .order("updated_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  return (
    <ToolLayout
      icon={Puzzle}
      title="Problem-Solution Fit Canvas"
      description="A lightweight alternative to the Business Model Canvas. Focus on the most critical early question: do you have a real problem worth solving?"
      teamId={teamId}
      artifactType="problem_solution_fit"
      platformRole={ctx.platformRole}
      currentUserId={ctx.user.id}
      adminNotes={ctx.adminNotes}
      mentorNotes={ctx.mentorNotes}
      promptVpReview
      valueProposition={ctx.team.value_proposition}
      vpUpdatedAt={ctx.team.vp_updated_at}
      artifactId={artifact?.id ?? null}
    >
      <ProblemSolutionFit
        teamId={teamId}
        userId={ctx.user.id}
        isReadOnly={ctx.teamRole === "mentor"}
        existingArtifact={artifact ? { id: artifact.id, data: artifact.data as Record<string, unknown> } : null}
        valueProposition={ctx.team.value_proposition}
      />
    </ToolLayout>
  );
}
