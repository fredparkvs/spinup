"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

async function assignMentor(formData: FormData) {
  "use server";
  const supabase = await createClient();
  const mentorId = formData.get("mentorId") as string;
  const teamId = formData.get("teamId") as string;
  if (!mentorId || !teamId) return;
  // Add mentor as team member with role 'mentor' if not already
  await supabase.from("team_members").upsert({ team_id: teamId, user_id: mentorId, role: "mentor" }, { onConflict: "team_id,user_id" });
  revalidatePath("/admin/mentors");
}

async function removeMentorFromTeam(mentorId: string, teamId: string) {
  "use server";
  const supabase = await createClient();
  await supabase.from("team_members").delete().eq("team_id", teamId).eq("user_id", mentorId).eq("role", "mentor");
  revalidatePath("/admin/mentors");
}

export default async function AdminMentorsPage() {
  const supabase = await createClient();

  const [mentorsResult, teamsResult] = await Promise.all([
    supabase.from("profiles").select("id, full_name, email").eq("platform_role", "mentor").order("full_name"),
    supabase.from("teams").select("id, name, operating_name").order("name"),
  ]);

  const mentors = mentorsResult.data ?? [];
  const teams = teamsResult.data ?? [];

  // For each mentor, find their assigned teams
  const mentorTeams: Record<string, { teamId: string; teamName: string }[]> = {};
  if (mentors.length > 0) {
    const { data: assignments } = await supabase
      .from("team_members")
      .select("user_id, team_id, teams(name, operating_name)")
      .in("user_id", mentors.map((m) => m.id))
      .eq("role", "mentor");
    for (const a of assignments ?? []) {
      const t = a.teams as { name: string; operating_name: string | null } | null;
      if (!mentorTeams[a.user_id]) mentorTeams[a.user_id] = [];
      mentorTeams[a.user_id].push({ teamId: a.team_id, teamName: t?.operating_name ?? t?.name ?? a.team_id });
    }
  }

  return (
    <div className="space-y-6">
      <p className="text-sm text-muted-foreground">{mentors.length} mentor{mentors.length !== 1 ? "s" : ""} on the platform. Assign mentors to teams here.</p>

      {mentors.length === 0 && (
        <div className="rounded-lg border border-dashed p-6 text-center text-sm text-muted-foreground">
          No mentors yet. Go to <strong>Users</strong> and change a user&apos;s role to &quot;mentor&quot; first.
        </div>
      )}

      {mentors.map((mentor) => {
        const assigned = mentorTeams[mentor.id] ?? [];
        return (
          <div key={mentor.id} className="rounded-lg border p-4 space-y-3">
            <div>
              <p className="text-sm font-semibold">{mentor.full_name ?? mentor.email}</p>
              {mentor.full_name && <p className="text-xs text-muted-foreground">{mentor.email}</p>}
            </div>

            {assigned.length > 0 && (
              <div className="flex flex-wrap gap-2">
                {assigned.map((t) => {
                  const removeAction = removeMentorFromTeam.bind(null, mentor.id, t.teamId);
                  return (
                    <form key={t.teamId} action={removeAction} className="inline-flex">
                      <Badge variant="secondary" className="text-xs gap-1 cursor-pointer hover:bg-destructive/10 hover:text-destructive">
                        {t.teamName}
                        <button type="submit" className="ml-0.5 hover:text-destructive">×</button>
                      </Badge>
                    </form>
                  );
                })}
              </div>
            )}

            {assigned.length === 0 && (
              <p className="text-xs text-muted-foreground">No teams assigned yet.</p>
            )}

            <Separator />

            <form action={assignMentor} className="flex items-end gap-3">
              <input type="hidden" name="mentorId" value={mentor.id} />
              <div className="flex-1 space-y-1">
                <Label className="text-xs">Assign to team</Label>
                <Select name="teamId">
                  <SelectTrigger className="h-8 text-sm">
                    <SelectValue placeholder="Select a team..." />
                  </SelectTrigger>
                  <SelectContent>
                    {teams.filter((t) => !assigned.find((a) => a.teamId === t.id)).map((t) => (
                      <SelectItem key={t.id} value={t.id}>{t.operating_name ?? t.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <Button type="submit" size="sm">Assign</Button>
            </form>
          </div>
        );
      })}
    </div>
  );
}
