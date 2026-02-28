import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { TrelloBoardSelector } from "@/components/trello-board-selector";

export default async function TrelloSettingsPage({
  params,
  searchParams,
}: {
  params: Promise<{ teamId: string }>;
  searchParams: Promise<{ connected?: string; error?: string }>;
}) {
  const { teamId } = await params;
  const sp = await searchParams;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/sign-in");

  const { data: trello } = await supabase.from("trello_connections").select("board_id, last_synced_at, connected_at, access_token").eq("team_id", teamId).maybeSingle();

  // Just connected — no board selected yet: show board selector
  const justConnected = sp.connected === "1" && trello && !trello.board_id;

  return (
    <div className="space-y-6 max-w-md">
      <div className="space-y-1">
        <h2 className="text-sm font-semibold">Trello integration</h2>
        <p className="text-sm text-muted-foreground">
          Connect your Trello account to sync SpinUp activities with your team board. SpinUp is the source of truth for content; Trello tracks completion status.
        </p>
      </div>

      {sp.error && (
        <div className="rounded-lg border border-destructive bg-destructive/5 p-3 text-sm text-destructive">
          Connection failed. Please try again.
        </div>
      )}

      {trello && !trello.board_id && !justConnected && (
        <div className="rounded-lg border border-amber-200 bg-amber-50 p-3 text-sm text-amber-800">
          Connected to Trello but no board selected yet.
        </div>
      )}

      {justConnected && (
        <TrelloBoardSelector teamId={teamId} />
      )}

      {trello?.board_id ? (
        <div className="rounded-lg border p-4 space-y-3">
          <div className="flex items-center gap-2">
            <div className="size-2 rounded-full bg-green-500" />
            <span className="text-sm font-medium">Connected</span>
            <Badge variant="outline" className="text-xs ml-auto">Board linked</Badge>
          </div>
          {trello.connected_at && (
            <p className="text-xs text-muted-foreground">Connected: {new Date(trello.connected_at).toLocaleDateString("en-ZA")}</p>
          )}
          {trello.last_synced_at && (
            <p className="text-xs text-muted-foreground">Last synced: {new Date(trello.last_synced_at).toLocaleDateString("en-ZA")}</p>
          )}
          <Button asChild variant="outline" size="sm">
            <Link href={`/api/trello/disconnect?teamId=${teamId}`}>Disconnect Trello</Link>
          </Button>
        </div>
      ) : !justConnected && (
        <div className="rounded-lg border border-dashed p-4 space-y-3">
          <div className="flex items-center gap-2">
            <div className="size-2 rounded-full bg-muted-foreground" />
            <span className="text-sm text-muted-foreground">Not connected</span>
          </div>
          <Button asChild>
            <Link href={`/api/trello/connect?teamId=${teamId}`}>Connect Trello</Link>
          </Button>
          <p className="text-xs text-muted-foreground">
            You&apos;ll be redirected to Trello to authorise access. After connecting, select which board to sync with.
          </p>
        </div>
      )}

      <div className="rounded-lg border bg-muted/30 p-3 text-xs text-muted-foreground space-y-1">
        <p className="font-medium text-foreground">How sync works</p>
        <ul className="list-disc list-inside space-y-0.5">
          <li>SpinUp creates a Trello card for each tool you complete</li>
          <li>Marking a card done in Trello updates completion status in SpinUp</li>
          <li>Editing content in SpinUp updates the Trello card description</li>
        </ul>
      </div>
    </div>
  );
}
