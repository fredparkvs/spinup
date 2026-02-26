"use client";

import { useState } from "react";
import { PlusCircle, Trash2, Save, Loader2, Check } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";

interface Competitor {
  id: string;
  name: string;
  strength: string;
  weakness: string;
  our_differentiation: string;
  sa_relevance: string;
}

interface CLData {
  competitors: Competitor[];
}

function parseData(raw: Record<string, unknown>): CLData {
  return {
    competitors: (raw.competitors as Competitor[]) ?? [],
  };
}

export function CompetitiveLandscape({ teamId, userId, isReadOnly, existingArtifact }: {
  teamId: string; userId: string; isReadOnly: boolean;
  existingArtifact: { id: string; data: Record<string, unknown> } | null;
}) {
  const [data, setData] = useState<CLData>(() => parseData(existingArtifact?.data ?? {}));
  const [artifactId, setArtifactId] = useState(existingArtifact?.id ?? null);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const supabase = createClient();

  function addCompetitor() {
    setData((prev) => ({
      competitors: [...prev.competitors, {
        id: crypto.randomUUID(), name: "", strength: "", weakness: "", our_differentiation: "", sa_relevance: "",
      }],
    }));
    setSaved(false);
  }

  function updateCompetitor(id: string, field: keyof Competitor, value: string) {
    setData((prev) => ({
      competitors: prev.competitors.map((c) => c.id === id ? { ...c, [field]: value } : c),
    }));
    setSaved(false);
  }

  function deleteCompetitor(id: string) {
    setData((prev) => ({ competitors: prev.competitors.filter((c) => c.id !== id) }));
    setSaved(false);
  }

  async function handleSave() {
    setSaving(true);
    if (artifactId) {
      await supabase.from("artifacts").update({
        data: data as unknown as Record<string, unknown>, updated_at: new Date().toISOString(),
      }).eq("id", artifactId);
    } else {
      const { data: newArtifact } = await supabase.from("artifacts").insert({
        team_id: teamId, artifact_type: "competitive_landscape", title: "Competitive Landscape Map",
        data: data as unknown as Record<string, unknown>, created_by: userId,
      }).select("id").single();
      if (newArtifact) setArtifactId(newArtifact.id);
    }
    setSaving(false);
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <p className="text-sm text-muted-foreground">
          {data.competitors.length === 0
            ? "No competitors added yet. Include direct competitors and workarounds."
            : `${data.competitors.length} competitor${data.competitors.length !== 1 ? "s" : ""} mapped`}
        </p>
        {!isReadOnly && (
          <Button size="sm" onClick={addCompetitor}>
            <PlusCircle className="size-4" />Add Competitor
          </Button>
        )}
      </div>

      {data.competitors.map((competitor, index) => (
        <div key={competitor.id} className="rounded-lg border p-4 space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Competitor {index + 1}</span>
            {!isReadOnly && (
              <Button size="sm" variant="ghost" onClick={() => deleteCompetitor(competitor.id)} className="text-destructive hover:text-destructive h-7">
                <Trash2 className="size-3" />Remove
              </Button>
            )}
          </div>
          <div className="grid gap-3 sm:grid-cols-2">
            <div className="space-y-1">
              <Label className="text-xs">Competitor / alternative</Label>
              <Input placeholder="Name or description" value={competitor.name} onChange={(e) => updateCompetitor(competitor.id, "name", e.target.value)} disabled={isReadOnly} />
            </div>
            <div className="space-y-1">
              <Label className="text-xs">Their strength</Label>
              <Input placeholder="What they do well" value={competitor.strength} onChange={(e) => updateCompetitor(competitor.id, "strength", e.target.value)} disabled={isReadOnly} />
            </div>
            <div className="space-y-1">
              <Label className="text-xs">Their weakness</Label>
              <Input placeholder="Where they fall short" value={competitor.weakness} onChange={(e) => updateCompetitor(competitor.id, "weakness", e.target.value)} disabled={isReadOnly} />
            </div>
            <div className="space-y-1">
              <Label className="text-xs">Our differentiation</Label>
              <Input placeholder="The specific gap we fill" value={competitor.our_differentiation} onChange={(e) => updateCompetitor(competitor.id, "our_differentiation", e.target.value)} disabled={isReadOnly} />
            </div>
          </div>
          <div className="space-y-1">
            <Label className="text-xs">SA market relevance</Label>
            <Textarea placeholder="Local context: pricing, access, regulation, or ecosystem factors relevant to South Africa" value={competitor.sa_relevance} onChange={(e) => updateCompetitor(competitor.id, "sa_relevance", e.target.value)} disabled={isReadOnly} rows={2} />
          </div>
          {index < data.competitors.length - 1 && <Separator className="mt-2" />}
        </div>
      ))}

      {!isReadOnly && data.competitors.length > 0 && (
        <Button onClick={handleSave} disabled={saving}>
          {saving ? <><Loader2 className="size-4 animate-spin" />Saving...</> : saved ? <><Check className="size-4" />Saved</> : <><Save className="size-4" />Save Map</>}
        </Button>
      )}
    </div>
  );
}
