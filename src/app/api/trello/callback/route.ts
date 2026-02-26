import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

// Trello's "fragment" callback passes the token in the URL hash — we need a page to extract it
// This route renders a small page that reads the fragment and posts it back to our server
export async function GET(request: NextRequest) {
  const teamId = request.nextUrl.searchParams.get("teamId");
  const token = request.nextUrl.searchParams.get("token"); // Posted from the client-side page below

  // If token is present (second leg), save it
  if (token && teamId) {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.redirect(new URL("/sign-in", request.url));
    }

    const apiKey = process.env.TRELLO_API_KEY;
    if (!apiKey) {
      return NextResponse.json({ error: "Trello API key not configured" }, { status: 500 });
    }

    // Get member info from Trello to verify token
    const meRes = await fetch(`https://api.trello.com/1/members/me?key=${apiKey}&token=${token}`);
    if (!meRes.ok) {
      return NextResponse.redirect(new URL(`/teams/${teamId}/settings/trello?error=invalid_token`, request.url));
    }
    const me = await meRes.json() as { id: string };

    // Upsert trello_connections — note: we store token as access_token, no secret for Trello's simplified auth
    await supabase.from("trello_connections").upsert({
      team_id: teamId,
      access_token: token,
      access_token_secret: "", // Trello simplified OAuth doesn't use token secrets
      trello_member_id: me.id,
      connected_at: new Date().toISOString(),
    }, { onConflict: "team_id" });

    return NextResponse.redirect(new URL(`/teams/${teamId}/settings/trello?connected=1`, request.url));
  }

  // First leg: render a page that extracts the token from the URL fragment
  const html = `<!DOCTYPE html>
<html>
<head><title>Connecting Trello...</title></head>
<body>
<p>Connecting your Trello account...</p>
<script>
  const hash = window.location.hash.slice(1);
  const params = new URLSearchParams(hash);
  const token = params.get('token');
  if (token) {
    window.location.href = '/api/trello/callback?teamId=${teamId}&token=' + encodeURIComponent(token);
  } else {
    window.location.href = '/teams/${teamId}/settings/trello?error=no_token';
  }
</script>
</body>
</html>`;

  return new Response(html, { headers: { "Content-Type": "text/html" } });
}
