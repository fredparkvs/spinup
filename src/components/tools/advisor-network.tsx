"use client";

import { useState } from "react";
import { Save, Loader2, Check, Plus, Trash2 } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

type RelationshipStage = "identified" | "contacted" | "engaged" | "active";

interface AdvisorEntry {
  id: string;
  name: string;
  expertise: string;
  relationship_stage: RelationshipStage;
  how_we_know: string;
  last_contact: string;
  next_action: string;
  value_exchanged: string;
}

type AdvisorEntryDB = {
  id: string;
  team_id: string;
  name: string;
  expertise: string | null;
  relationship_stage: string;
  how_we_know_them: string | null;
  last_contact: string | null;
  next_action: string | null;
  value_exchanged: string | null;
  created_at: string;
  updated_at: string;
};

const STAGE_LABELS: Record<RelationshipStage, string> = {
  identified: "Identified",
  contacted: "Contacted",
  engaged: "Engaged",
  active: "Active",
};

const STAGE_VARIANTS: Record<RelationshipStage, "secondary" | "outline" | "default"> = {
  identified: "secondary",
  contacted: "outline",
  engaged: "outline",
  active: "default",
};

function uid() {
  return Math.random().toString(36).slice(2, 9);
}

function dbToEntry(e: AdvisorEntryDB): AdvisorEntry {
  return {
    id: e.id,
    name: e.name,
    expertise: e.expertise ?? "",
    relationship_stage: (e.relationship_stage as RelationshipStage) ?? "identified",
    how_we_know: e.how_we_know_them ?? "",
    last_contact: e.last_contact ?? "",
    next_action: e.next_action ?? "",
    value_exchanged: e.value_exchanged ?? "",
  };
}

function emptyEntry(): AdvisorEntry {
  return { id: `new_${uid()}`, name: "", expertise: "", relationship_stage: "identified", how_we_know: "", last_contact: "", next_action: "", value_exchanged: "" };
}

export function AdvisorNetwork({ teamId, userId, isReadOnly, existingEntries }: {
  teamId: string;
  userId: string;
  isReadOnly: boolean;
  existingEntries: AdvisorEntryDB[];
}) {
  const [entries, setEntries] = useState<AdvisorEntry[]>(() => existingEntries.map(dbToEntry));
  const [saving, setSaving] = useState<Record<string, boolean>>({});
  const [saved, setSaved] = useState<Record<string, boolean>>({});
  const supabase = createClient();

  function addEntry() {
    setEntries((prev) => [...prev, emptyEntry()]);
  }

  function updateEntry(id: string, field: keyof AdvisorEntry, value: string) {
    setEntries((prev) => prev.map((e) => e.id === id ? { ...e, [field]: value } : e));
  }

  async function handleSave(entry: AdvisorEntry) {
    setSaving((prev) => ({ ...prev, [entry.id]: true }));
    if (entry.id.startsWith("new_")) {
      const { data: a } = await supabase.from("advisor_entries").insert({
        team_id: teamId,
        name: entry.name,
        expertise: entry.expertise,
        relationship_stage: entry.relationship_stage,
        how_we_know_them: entry.how_we_know,
        last_contact: entry.last_contact || null,
        next_action: entry.next_action,
        value_exchanged: entry.value_exchanged,
      }).select("id").single();
      if (a) {
        setEntries((prev) => prev.map((e) => e.id === entry.id ? { ...e, id: a.id } : e));
      }
    } else {
      await supabase.from("advisor_entries").update({
        name: entry.name,
        expertise: entry.expertise,
        relationship_stage: entry.relationship_stage,
        how_we_know_them: entry.how_we_know,
        last_contact: entry.last_contact || null,
        next_action: entry.next_action,
        value_exchanged: entry.value_exchanged,
        updated_at: new Date().toISOString(),
      }).eq("id", entry.id);
    }
    setSaving((prev) => ({ ...prev, [entry.id]: false }));
    setSaved((prev) => ({ ...prev, [entry.id]: true }));
    setTimeout(() => setSaved((prev) => ({ ...prev, [entry.id]: false })), 2000);
  }

  async function handleDelete(id: string) {
    if (id.startsWith("new_")) {
      setEntries((prev) => prev.filter((e) => e.id !== id));
      return;
    }
    await supabase.from("advisor_entries").delete().eq("id", id);
    setEntries((prev) => prev.filter((e) => e.id !== id));
  }

  const activeCount = entries.filter((e) => e.relationship_stage === "active").length;
  const engagedCount = entries.filter((e) => e.relationship_stage === "engaged").length;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3 flex-wrap">
          <Badge variant="secondary">{entries.length} {entries.length === 1 ? "advisor" : "advisors"}</Badge>
          {activeCount > 0 && <Badge>{activeCount} active</Badge>}
          {engagedCount > 0 && <Badge variant="outline">{engagedCount} engaged</Badge>}
        </div>
        {!isReadOnly && (
          <Button size="sm" onClick={addEntry}>
            <Plus className="size-3.5 mr-1" />Add advisor
          </Button>
        )}
      </div>

      {entries.length === 0 && (
        <div className="rounded-lg border border-dashed p-8 text-center">
          <p className="text-sm text-muted-foreground">No advisors or mentors tracked yet.</p>
          <p className="text-xs text-muted-foreground mt-1">Add people who can help you — domain experts, potential customers, investors, industry veterans.</p>
        </div>
      )}

      {entries.map((entry, idx) => (
        <div key={entry.id}>
          <div className="space-y-4">
            <div className="flex items-start justify-between gap-3">
              <div className="flex items-center gap-2 flex-wrap flex-1">
                {entry.name ? (
                  <p className="text-sm font-semibold">{entry.name}</p>
                ) : (
                  <p className="text-sm text-muted-foreground italic">New advisor</p>
                )}
                <Badge variant={STAGE_VARIANTS[entry.relationship_stage]} className="text-xs">
                  {STAGE_LABELS[entry.relationship_stage]}
                </Badge>
              </div>
              {!isReadOnly && (
                <Button variant="ghost" size="icon" className="size-7 shrink-0" onClick={() => handleDelete(entry.id)}>
                  <Trash2 className="size-3.5" />
                </Button>
              )}
            </div>

            <div className="grid gap-3 sm:grid-cols-2">
              <div className="space-y-1.5">
                <Label className="text-xs">Name</Label>
                <Input value={entry.name} onChange={(e) => updateEntry(entry.id, "name", e.target.value)} disabled={isReadOnly} placeholder="Full name" />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs">Expertise</Label>
                <Input value={entry.expertise} onChange={(e) => updateEntry(entry.id, "expertise", e.target.value)} disabled={isReadOnly} placeholder="What are they useful for?" />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs">Relationship stage</Label>
                <Select value={entry.relationship_stage} onValueChange={(v) => updateEntry(entry.id, "relationship_stage", v)} disabled={isReadOnly}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {(Object.keys(STAGE_LABELS) as RelationshipStage[]).map((s) => (
                      <SelectItem key={s} value={s}>{STAGE_LABELS[s]}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs">Last contact</Label>
                <Input type="date" value={entry.last_contact} onChange={(e) => updateEntry(entry.id, "last_contact", e.target.value)} disabled={isReadOnly} />
              </div>
            </div>

            <div className="grid gap-3 sm:grid-cols-2">
              <div className="space-y-1.5">
                <Label className="text-xs">How we know them</Label>
                <Textarea value={entry.how_we_know} onChange={(e) => updateEntry(entry.id, "how_we_know", e.target.value)} disabled={isReadOnly} placeholder="Context — warm intro, conference, LinkedIn, cold outreach" rows={2} className="text-sm" />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs">Next action</Label>
                <Textarea value={entry.next_action} onChange={(e) => updateEntry(entry.id, "next_action", e.target.value)} disabled={isReadOnly} placeholder="What to ask or discuss next" rows={2} className="text-sm" />
              </div>
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs">Value exchanged</Label>
              <Input value={entry.value_exchanged} onChange={(e) => updateEntry(entry.id, "value_exchanged", e.target.value)} disabled={isReadOnly} placeholder="What have you offered them? (warm intros, updates, equity, cash, coffee)" />
            </div>

            {!isReadOnly && (
              <Button size="sm" onClick={() => handleSave(entry)} disabled={saving[entry.id] || !entry.name}>
                {saving[entry.id] ? <><Loader2 className="size-3.5 animate-spin" />Saving...</> : saved[entry.id] ? <><Check className="size-3.5" />Saved</> : <><Save className="size-3.5" />Save</>}
              </Button>
            )}
          </div>
          {idx < entries.length - 1 && <Separator className="mt-2" />}
        </div>
      ))}
    </div>
  );
}
