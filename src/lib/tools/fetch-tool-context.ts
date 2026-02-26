import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import type { PlatformRole, TeamMemberRole, ValueProposition } from "@/lib/types/database";

export interface ToolContext {
  user: { id: string; email: string };
  team: {
    id: string;
    name: string;
    operating_name: string | null;
    current_phase: string;
    value_proposition: ValueProposition | null;
    vp_updated_at: string | null;
  };
  platformRole: PlatformRole;
  teamRole: TeamMemberRole | null;
  adminNotes: ToolNote[];
  mentorNotes: ToolNote[];
}

export interface ToolNote {
  id: string;
  note_text: string;
  url: string | null;
  url_label: string | null;
  author_role: "admin" | "mentor";
  created_by: string;
  created_at: string;
}

export async function fetchToolContext(
  teamId: string,
  artifactType: string
): Promise<ToolContext> {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/sign-in");

  const [teamResult, memberResult, profileResult, notesResult] =
    await Promise.all([
      supabase
        .from("teams")
        .select("id, name, operating_name, current_phase, value_proposition, vp_updated_at")
        .eq("id", teamId)
        .single(),
      supabase
        .from("team_members")
        .select("role")
        .eq("team_id", teamId)
        .eq("user_id", user.id)
        .maybeSingle(),
      supabase
        .from("profiles")
        .select("platform_role")
        .eq("id", user.id)
        .single(),
      supabase
        .from("tool_notes")
        .select("id, note_text, url, url_label, author_role, created_by, created_at")
        .eq("artifact_type", artifactType)
        .or(`team_id.is.null,team_id.eq.${teamId}`)
        .order("created_at", { ascending: true }),
    ]);

  if (!teamResult.data) redirect("/dashboard");

  const platformRole: PlatformRole =
    profileResult.data?.platform_role ?? "entrepreneur";
  const teamRole: TeamMemberRole | null =
    memberResult.data?.role ?? null;

  if (!teamRole && platformRole !== "admin") redirect("/dashboard");

  const allNotes = (notesResult.data ?? []) as ToolNote[];
  const adminNotes = allNotes.filter((n) => n.author_role === "admin");
  const mentorNotes = allNotes.filter((n) => n.author_role === "mentor");

  return {
    user: { id: user.id, email: user.email ?? "" },
    team: teamResult.data as ToolContext["team"],
    platformRole,
    teamRole,
    adminNotes,
    mentorNotes,
  };
}
