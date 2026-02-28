import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function GET(request: NextRequest) {
  const teamId = request.nextUrl.searchParams.get("teamId");
  if (!teamId) {
    return NextResponse.json({ error: "teamId required" }, { status: 400 });
  }

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.redirect(new URL("/sign-in", request.url));
  }

  // Delete Trello connection
  await supabase.from("trello_connections").delete().eq("team_id", teamId);

  return NextResponse.redirect(new URL(`/teams/${teamId}/settings/trello?disconnected=1`, request.url));
}
