"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Loader2 } from "lucide-react";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

interface TrelloBoard {
  id: string;
  name: string;
}

export function TrelloBoardSelector({ teamId }: { teamId: string }) {
  const [boards, setBoards] = useState<TrelloBoard[]>([]);
  const [selectedBoard, setSelectedBoard] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const router = useRouter();

  useEffect(() => {
    fetch(`/api/trello/select-board?teamId=${teamId}`)
      .then((r) => r.json())
      .then((d: { boards?: TrelloBoard[] }) => {
        setBoards(d.boards ?? []);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, [teamId]);

  async function handleSave() {
    if (!selectedBoard) return;
    setSaving(true);
    await fetch("/api/trello/select-board", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ teamId, boardId: selectedBoard }),
    });
    setSaving(false);
    router.refresh();
  }

  if (loading) {
    return (
      <div className="rounded-lg border p-4 flex items-center gap-2 text-sm text-muted-foreground">
        <Loader2 className="size-4 animate-spin" />Loading your Trello boards...
      </div>
    );
  }

  if (boards.length === 0) {
    return (
      <div className="rounded-lg border p-4 text-sm text-muted-foreground">
        No Trello boards found. Create a board in Trello first, then come back here.
      </div>
    );
  }

  return (
    <div className="rounded-lg border p-4 space-y-3">
      <p className="text-sm font-medium">Select a Trello board to sync with</p>
      <div className="space-y-1.5">
        <Label>Board</Label>
        <Select value={selectedBoard} onValueChange={setSelectedBoard}>
          <SelectTrigger>
            <SelectValue placeholder="Choose a board..." />
          </SelectTrigger>
          <SelectContent>
            {boards.map((b) => (
              <SelectItem key={b.id} value={b.id}>{b.name}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      <Button onClick={handleSave} disabled={!selectedBoard || saving}>
        {saving ? <><Loader2 className="size-4 animate-spin" />Saving...</> : "Link board"}
      </Button>
    </div>
  );
}
