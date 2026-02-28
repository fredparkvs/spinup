import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";

// Step 1: Redirect user to Trello for OAuth 1.0a authorisation
// Trello uses a simplified OAuth 1.0a — request token not needed; go directly to authorize URL
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

  const apiKey = process.env.TRELLO_API_KEY;
  if (!apiKey) {
    return NextResponse.json({ error: "Trello API key not configured" }, { status: 500 });
  }

  const callbackUrl = `${process.env.NEXT_PUBLIC_APP_URL ?? request.nextUrl.origin}/api/trello/callback?teamId=${teamId}`;

  const trelloAuthorizeUrl = new URL("https://trello.com/1/OAuthAuthorizeToken");
  trelloAuthorizeUrl.searchParams.set("key", apiKey);
  trelloAuthorizeUrl.searchParams.set("name", "SpinUp");
  trelloAuthorizeUrl.searchParams.set("expiration", "never");
  trelloAuthorizeUrl.searchParams.set("response_type", "token");
  trelloAuthorizeUrl.searchParams.set("scope", "read,write");
  trelloAuthorizeUrl.searchParams.set("callback_method", "fragment");
  trelloAuthorizeUrl.searchParams.set("return_url", callbackUrl);

  return NextResponse.redirect(trelloAuthorizeUrl.toString());
}
