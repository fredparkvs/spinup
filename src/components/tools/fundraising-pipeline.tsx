"use client";

import { useState } from "react";
import { Save, Loader2, Check, PlusCircle, Trash2, AlertTriangle } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";

type DealStage = "prospect" | "intro" | "meeting" | "diligence" | "term_sheet" | "closed" | "passed";

interface Investor {
  id: string;
  name: string;
  firm: string;
  stage: DealStage;
  check_size: string;
  notes: string;
  last_contact: string;
  next_step: string;
}

interface RoundData {
  round_name: string;
  target_raise: string;
  pre_money_valuation: string;
  use_of_funds: string;
  timeline: string;
}

interface FundraisingData {
  round: RoundData;
  investors: Investor[];
  narrative: string;
  committed_so_far: string;
}

function parseData(raw: Record<string, unknown>): FundraisingData {
  return {
    round: (raw.round as RoundData) ?? { round_name: "", target_raise: "", pre_money_valuation: "", use_of_funds: "", timeline: "" },
    investors: (raw.investors as Investor[]) ?? [],
    narrative: (raw.narrative as string) ?? "",
    committed_so_far: (raw.committed_so_far as string) ?? "",
  };
}

const STAGE_CONFIG: Record<DealStage, { label: string; variant: "default" | "secondary" | "destructive" | "outline" }> = {
  prospect: { label: "Prospect", variant: "outline" },
  intro: { label: "Intro made", variant: "secondary" },
  meeting: { label: "In meetings", variant: "secondary" },
  diligence: { label: "Due diligence", variant: "default" },
  term_sheet: { label: "Term sheet", variant: "default" },
  closed: { label: "Closed", variant: "outline" },
  passed: { label: "Passed", variant: "destructive" },
};

function uid(): string {
  return Math.random().toString(36).slice(2, 9);
}

function dilutionWarning(raise: string, preMoney: string): string | null {
  const r = Number(raise);
  const pre = Number(preMoney);
  if (!r || !pre) return null;
  const dilution = (r / (r + pre)) * 100;
  return `${dilution.toFixed(1)}% dilution at this valuation`;
}

export function FundraisingPipeline({
  teamId, userId, isReadOnly, existingArtifact,
}: {
  teamId: string; userId: string; isReadOnly: boolean;
  existingArtifact: { id: string; data: Record<string, unknown> } | null;
}) {
  const [data, setData] = useState<FundraisingData>(() => parseData(existingArtifact?.data ?? {}));
  const [artifactId, setArtifactId] = useState(existingArtifact?.id ?? null);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const supabase = createClient();

  function updateRound(field: keyof RoundData, value: string) {
    setData((p) => ({ ...p, round: { ...p.round, [field]: value } }));
    setSaved(false);
  }

  function addInvestor() {
    setData((p) => ({ ...p, investors: [...p.investors, { id: uid(), name: "", firm: "", stage: "prospect", check_size: "", notes: "", last_contact: "", next_step: "" }] }));
    setSaved(false);
  }

  function updateInvestor(id: string, field: keyof Investor, value: string) {
    setData((p) => ({ ...p, investors: p.investors.map((inv) => inv.id === id ? { ...inv, [field]: value } : inv) }));
    setSaved(false);
  }

  function removeInvestor(id: string) {
    setData((p) => ({ ...p, investors: p.investors.filter((inv) => inv.id !== id) }));
    setSaved(false);
  }

  async function handleSave() {
    setSaving(true);
    if (artifactId) {
      await supabase.from("artifacts").update({ data: data as unknown as Record<string, unknown>, updated_at: new Date().toISOString() }).eq("id", artifactId);
    } else {
      const { data: a } = await supabase.from("artifacts").insert({ team_id: teamId, artifact_type: "fundraising_pipeline", title: "Fundraising Pipeline Manager", data: data as unknown as Record<string, unknown>, created_by: userId }).select("id").single();
      if (a) setArtifactId(a.id);
    }
    setSaving(false);
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  }

  const activeStages: DealStage[] = ["prospect", "intro", "meeting", "diligence", "term_sheet"];
  const pipelineCount = data.investors.filter((i) => activeStages.includes(i.stage)).length;
  const termSheetCount = data.investors.filter((i) => i.stage === "term_sheet").length;
  const committed = Number(data.committed_so_far) || 0;
  const target = Number(data.round.target_raise) || 0;
  const pct = target > 0 ? Math.min(100, Math.round((committed / target) * 100)) : 0;
  const dilution = dilutionWarning(data.round.target_raise, data.round.pre_money_valuation);

  const byStage = (stage: DealStage) => data.investors.filter((i) => i.stage === stage);

  return (
    <div className="space-y-6">
      {/* Warning first */}
      <div className="flex items-start gap-3 rounded-lg border border-amber-300 bg-amber-50 dark:bg-amber-950/30 p-4">
        <AlertTriangle className="size-4 mt-0.5 text-amber-600 shrink-0" />
        <div className="text-sm">
          <p className="font-medium text-amber-900 dark:text-amber-200">Fundraising is expensive — proceed with intention</p>
          <p className="text-amber-800 dark:text-amber-300 mt-0.5">
            VC funding trades equity for capital. Every round dilutes your ownership and introduces alignment expectations from investors. A typical Series A may take 6–9 months and consume the equivalent of a full-time role. Before pursuing external capital, ask: do we truly need it, and is now the right time? Profitable growth with less dilution is often better than fast growth on VC terms.
          </p>
        </div>
      </div>

      <Card className="border-primary/20 bg-primary/5">
        <CardContent className="pt-4 pb-4">
          <p className="text-sm font-medium mb-1">Why structure your fundraising like a sales process</p>
          <p className="text-sm text-muted-foreground">
            Fundraising is a funnel with long lead times. Most founders underestimate how many conversations it takes to close a round and overestimate how much time each conversation takes. Treating your investor pipeline with the same rigour as your sales pipeline — tracking stages, next steps, and momentum — dramatically improves close rates and reduces elapsed time.
          </p>
        </CardContent>
      </Card>

      {/* Round details */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-base">Round details</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-1.5">
              <Label>Round name</Label>
              <Input placeholder="e.g. Series A" value={data.round.round_name} onChange={(e) => updateRound("round_name", e.target.value)} disabled={isReadOnly} />
            </div>
            <div className="space-y-1.5">
              <Label>Target raise ($)</Label>
              <Input type="number" min="0" placeholder="e.g. 5000000" value={data.round.target_raise} onChange={(e) => updateRound("target_raise", e.target.value)} disabled={isReadOnly} />
            </div>
            <div className="space-y-1.5">
              <Label>Pre-money valuation ($)</Label>
              <Input type="number" min="0" placeholder="e.g. 20000000" value={data.round.pre_money_valuation} onChange={(e) => updateRound("pre_money_valuation", e.target.value)} disabled={isReadOnly} />
            </div>
            <div className="space-y-1.5">
              <Label>Target close date</Label>
              <Input type="month" value={data.round.timeline} onChange={(e) => updateRound("timeline", e.target.value)} disabled={isReadOnly} />
            </div>
          </div>
          {dilution && (
            <div className="rounded-lg bg-muted/30 border px-4 py-3">
              <p className="text-sm"><span className="font-medium">Implied dilution:</span> <span className="text-amber-700 dark:text-amber-400">{dilution}</span></p>
              <p className="text-xs text-muted-foreground mt-0.5">This is the ownership stake investors will receive at closing. Your effective dilution including option pool refresh may be higher.</p>
            </div>
          )}
          <div className="space-y-1.5">
            <Label>Use of funds</Label>
            <Textarea rows={3} placeholder="How will this capital be deployed? Hiring, product, sales, international expansion..." value={data.round.use_of_funds} onChange={(e) => updateRound("use_of_funds", e.target.value)} disabled={isReadOnly} />
          </div>
          <div className="space-y-1.5">
            <Label>Committed so far ($)</Label>
            <Input type="number" min="0" placeholder="e.g. 1500000" value={data.committed_so_far} onChange={(e) => { setData((p) => ({ ...p, committed_so_far: e.target.value })); setSaved(false); }} disabled={isReadOnly} />
          </div>
          {target > 0 && (
            <div>
              <div className="flex justify-between text-xs text-muted-foreground mb-1">
                <span>{pct}% committed</span>
                <span>${committed.toLocaleString()} of ${target.toLocaleString()}</span>
              </div>
              <div className="h-2 rounded-full bg-muted overflow-hidden">
                <div className="h-full rounded-full bg-primary transition-all" style={{ width: `${pct}%` }} />
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Snapshot */}
      {data.investors.length > 0 && (
        <div className="flex flex-wrap gap-3">
          <div className="rounded-lg border bg-muted/20 px-4 py-2">
            <p className="text-xs text-muted-foreground">Active pipeline</p>
            <p className="text-xl font-bold">{pipelineCount}</p>
          </div>
          <div className="rounded-lg border bg-muted/20 px-4 py-2">
            <p className="text-xs text-muted-foreground">Term sheets</p>
            <p className="text-xl font-bold">{termSheetCount}</p>
          </div>
          <div className="rounded-lg border bg-muted/20 px-4 py-2">
            <p className="text-xs text-muted-foreground">Passed</p>
            <p className="text-xl font-bold">{byStage("passed").length}</p>
          </div>
        </div>
      )}

      {/* Investor pipeline */}
      <Card>
        <CardHeader className="pb-2">
          <div className="flex items-center justify-between">
            <CardTitle className="text-base">Investor pipeline</CardTitle>
            {!isReadOnly && (
              <Button size="sm" variant="outline" onClick={addInvestor}>
                <PlusCircle className="size-4" />Add Investor
              </Button>
            )}
          </div>
        </CardHeader>
        <CardContent className="space-y-3">
          {data.investors.length === 0 && <p className="text-sm text-muted-foreground">No investors added yet.</p>}
          {data.investors.map((inv) => (
            <div key={inv.id} className="rounded-lg border p-4 space-y-3">
              <div className="flex items-start gap-2">
                <div className="grid gap-3 sm:grid-cols-3 flex-1">
                  <div className="space-y-1">
                    <Label className="text-xs">Investor name</Label>
                    <Input placeholder="Jane Smith" value={inv.name} onChange={(e) => updateInvestor(inv.id, "name", e.target.value)} disabled={isReadOnly} />
                  </div>
                  <div className="space-y-1">
                    <Label className="text-xs">Firm</Label>
                    <Input placeholder="Acme Ventures" value={inv.firm} onChange={(e) => updateInvestor(inv.id, "firm", e.target.value)} disabled={isReadOnly} />
                  </div>
                  <div className="space-y-1">
                    <Label className="text-xs">Check size ($)</Label>
                    <Input type="number" min="0" placeholder="1000000" value={inv.check_size} onChange={(e) => updateInvestor(inv.id, "check_size", e.target.value)} disabled={isReadOnly} />
                  </div>
                  <div className="space-y-1">
                    <Label className="text-xs">Stage</Label>
                    <select
                      className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                      value={inv.stage}
                      onChange={(e) => updateInvestor(inv.id, "stage", e.target.value)}
                      disabled={isReadOnly}
                    >
                      {Object.entries(STAGE_CONFIG).map(([v, cfg]) => <option key={v} value={v}>{cfg.label}</option>)}
                    </select>
                  </div>
                  <div className="space-y-1">
                    <Label className="text-xs">Last contact</Label>
                    <Input type="date" value={inv.last_contact} onChange={(e) => updateInvestor(inv.id, "last_contact", e.target.value)} disabled={isReadOnly} />
                  </div>
                  <div className="space-y-1">
                    <Label className="text-xs">Next step</Label>
                    <Input placeholder="Send deck by Friday" value={inv.next_step} onChange={(e) => updateInvestor(inv.id, "next_step", e.target.value)} disabled={isReadOnly} />
                  </div>
                </div>
                {!isReadOnly && (
                  <Button size="sm" variant="ghost" onClick={() => removeInvestor(inv.id)} className="shrink-0 mt-5">
                    <Trash2 className="size-3.5" />
                  </Button>
                )}
              </div>
              <Textarea rows={2} placeholder="Notes: thesis fit, concerns, relationships, intro source..." value={inv.notes} onChange={(e) => updateInvestor(inv.id, "notes", e.target.value)} disabled={isReadOnly} />
              <Badge variant={STAGE_CONFIG[inv.stage].variant} className="text-xs">{STAGE_CONFIG[inv.stage].label}</Badge>
            </div>
          ))}
        </CardContent>
      </Card>

      {/* Fundraising narrative */}
      <div className="space-y-1.5">
        <Label>Fundraising narrative / pitch summary</Label>
        <Textarea rows={5} placeholder="Summarise your pitch: problem, traction, why now, why you, what you need the capital for, and your vision for the next 18 months." value={data.narrative} onChange={(e) => { setData((p) => ({ ...p, narrative: e.target.value })); setSaved(false); }} disabled={isReadOnly} />
      </div>

      {!isReadOnly && (
        <Button onClick={handleSave} disabled={saving}>
          {saving ? <><Loader2 className="size-4 animate-spin" />Saving...</> : saved ? <><Check className="size-4" />Saved</> : <><Save className="size-4" />Save</>}
        </Button>
      )}
    </div>
  );
}
