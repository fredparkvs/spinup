import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

const PHASE_LABELS: Record<string, string> = {
  validate: "Validate",
  build_minimum: "Build Minimum",
  sell_iterate: "Sell & Iterate",
};

export default async function AdminTeamsPage() {
  const supabase = await createClient();

  const { data: teams } = await supabase
    .from("teams")
    .select("id, name, institution, operating_name, current_phase, created_at")
    .order("created_at", { ascending: false });

  // For each team, get member count
  const teamIds = (teams ?? []).map((t) => t.id);
  const { data: memberCounts } = await supabase
    .from("team_members")
    .select("team_id")
    .in("team_id", teamIds.length > 0 ? teamIds : [""]);

  const countMap: Record<string, number> = {};
  for (const m of memberCounts ?? []) {
    countMap[m.team_id] = (countMap[m.team_id] ?? 0) + 1;
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <p className="text-sm text-muted-foreground">{teams?.length ?? 0} teams registered</p>
      </div>
      <div className="rounded-lg border overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-muted/50">
            <tr>
              <th className="text-left py-2 px-4 font-medium">Team</th>
              <th className="text-left py-2 px-4 font-medium">Phase</th>
              <th className="text-left py-2 px-4 font-medium">Members</th>
              <th className="text-left py-2 px-4 font-medium">Created</th>
              <th className="w-20" />
            </tr>
          </thead>
          <tbody>
            {(teams ?? []).map((team, idx) => (
              <tr key={team.id} className={`border-t ${idx % 2 === 0 ? "" : "bg-muted/20"}`}>
                <td className="py-2.5 px-4">
                  <p className="font-medium">{team.operating_name ?? team.name}</p>
                  {team.institution && <p className="text-xs text-muted-foreground">{team.institution}</p>}
                </td>
                <td className="py-2.5 px-4">
                  <Badge variant="secondary" className="text-xs">{PHASE_LABELS[team.current_phase] ?? team.current_phase}</Badge>
                </td>
                <td className="py-2.5 px-4 text-muted-foreground">{countMap[team.id] ?? 0}</td>
                <td className="py-2.5 px-4 text-muted-foreground text-xs">{new Date(team.created_at).toLocaleDateString("en-ZA")}</td>
                <td className="py-2.5 px-4">
                  <Button asChild variant="ghost" size="sm">
                    <Link href={`/teams/${team.id}`}>View</Link>
                  </Button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {(teams?.length ?? 0) === 0 && (
          <div className="p-8 text-center text-sm text-muted-foreground">No teams yet.</div>
        )}
      </div>
    </div>
  );
}
