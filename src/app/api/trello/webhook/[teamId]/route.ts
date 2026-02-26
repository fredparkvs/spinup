import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

// Trello sends a HEAD request to verify the webhook URL — respond 200
export async function HEAD() {
  return new NextResponse(null, { status: 200 });
}

// Trello sends POST for each board event
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ teamId: string }> }
) {
  const { teamId } = await params;

  let body: {
    action?: {
      type?: string;
      data?: {
        card?: { id?: string; name?: string };
        list?: { name?: string };
        listAfter?: { name?: string };
      };
    };
  };

  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const action = body?.action;
  if (!action) return NextResponse.json({ ok: true });

  const supabase = await createClient();

  // Only handle card moves (updateCard with listAfter = Done/Complete)
  if (action.type === "updateCard" && action.data?.card?.id) {
    const listName = action.data.listAfter?.name?.toLowerCase() ?? "";
    const isDone = listName.includes("done") || listName.includes("complete") || listName.includes("finished");

    // Find artifact mapped to this card
    const { data: mapping } = await supabase
      .from("trello_card_mappings")
      .select("artifact_id")
      .eq("trello_card_id", action.data.card.id)
      .eq("team_id", teamId)
      .single();

    if (mapping && isDone) {
      await supabase.from("artifacts").update({ status: "complete", updated_at: new Date().toISOString() }).eq("id", mapping.artifact_id);
      await supabase.from("trello_card_mappings").update({ last_pulled_at: new Date().toISOString() }).eq("artifact_id", mapping.artifact_id);
    }

    // Update last_synced_at on connection
    await supabase.from("trello_connections").update({ last_synced_at: new Date().toISOString() }).eq("team_id", teamId);
  }

  return NextResponse.json({ ok: true });
}
