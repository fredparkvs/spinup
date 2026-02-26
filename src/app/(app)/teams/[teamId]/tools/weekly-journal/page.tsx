import { BookOpen } from "lucide-react";
import { fetchToolContext } from "@/lib/tools/fetch-tool-context";
import { ToolLayout } from "@/components/tools/tool-layout";
import { WeeklyJournal } from "@/components/tools/weekly-journal";
import { createClient } from "@/lib/supabase/server";

export default async function WeeklyJournalPage({ params }: { params: Promise<{ teamId: string }> }) {
  const { teamId } = await params;
  const ctx = await fetchToolContext(teamId, "weekly_journal");
  const supabase = await createClient();
  const { data: entries } = await supabase
    .from("journal_entries")
    .select("*")
    .eq("team_id", teamId)
    .order("week_start", { ascending: false })
    .limit(52);
  return (
    <ToolLayout icon={BookOpen} title="Weekly Progress Journal" description="One entry per week. What did you do, what did you learn, what changed? The running log of your startup's story." teamId={teamId} artifactType="weekly_journal" platformRole={ctx.platformRole} currentUserId={ctx.user.id} adminNotes={ctx.adminNotes} mentorNotes={ctx.mentorNotes}>
      <WeeklyJournal
        teamId={teamId}
        userId={ctx.user.id}
        isReadOnly={ctx.teamRole === "mentor"}
        existingEntries={(entries ?? []) as Parameters<typeof WeeklyJournal>[0]["existingEntries"]}
      />
    </ToolLayout>
  );
}
