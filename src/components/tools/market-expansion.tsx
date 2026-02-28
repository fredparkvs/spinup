"use client";

import { useState } from "react";
import { Save, Loader2, Check, PlusCircle, Trash2 } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";

type EntryMode = "direct_sales" | "partnership" | "channel" | "product_led" | "acquisition";
type MarketStatus = "evaluating" | "in_progress" | "launched" | "paused";

interface Market {
  id: string;
  name: string;
  tam_estimate: string;
  accessibility_score: number;
  competition_score: number;
  strategic_fit_score: number;
  entry_mode: EntryMode;
  status: MarketStatus;
  go_decision: string;
  key_risks: string;
  success_metrics: string;
  target_date: string;
  notes: string;
}

interface ExpansionData {
  beachhead_summary: string;
  expansion_thesis: string;
  markets: Market[];
}

function parseData(raw: Record<string, unknown>): ExpansionData {
  return {
    beachhead_summary: (raw.beachhead_summary as string) ?? "",
    expansion_thesis: (raw.expansion_thesis as string) ?? "",
    markets: (raw.markets as Market[]) ?? [],
  };
}

const ENTRY_LABELS: Record<EntryMode, string> = {
  direct_sales: "Direct sales",
  partnership: "Partnership",
  channel: "Channel / reseller",
  product_led: "Product-led growth",
  acquisition: "Acquisition",
};

const STATUS_CONFIG: Record<MarketStatus, { label: string; variant: "default" | "secondary" | "destructive" | "outline" }> = {
  evaluating: { label: "Evaluating", variant: "outline" },
  in_progress: { label: "In progress", variant: "secondary" },
  launched: { label: "Launched", variant: "default" },
  paused: { label: "Paused", variant: "destructive" },
};

function attractiveness(m: Market): number {
  return Math.round(((m.accessibility_score + (6 - m.competition_score) + m.strategic_fit_score) / 15) * 100);
}

function uid(): string {
  return Math.random().toString(36).slice(2, 9);
}

function ScoreButtons({ value, onChange, disabled, label }: {
  value: number; onChange: (v: number) => void; disabled: boolean; label: string;
}) {
  return (
    <div className="space-y-1.5">
      <Label className="text-xs">{label}</Label>
      <div className="flex gap-1.5">
        {[1, 2, 3, 4, 5].map((v) => (
          <button
            key={v}
            disabled={disabled}
            onClick={() => onChange(v)}
            className={`w-8 h-8 rounded-md border text-xs font-medium transition-colors ${value === v ? "bg-primary text-primary-foreground border-primary" : "bg-background hover:bg-accent border-input"} disabled:opacity-50 disabled:cursor-not-allowed`}
          >
            {v}
          </button>
        ))}
      </div>
    </div>
  );
}

export function MarketExpansion({
  teamId, userId, isReadOnly, existingArtifact,
}: {
  teamId: string; userId: string; isReadOnly: boolean;
  existingArtifact: { id: string; data: Record<string, unknown> } | null;
}) {
  const [data, setData] = useState<ExpansionData>(() => parseData(existingArtifact?.data ?? {}));
  const [artifactId, setArtifactId] = useState(existingArtifact?.id ?? null);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [expandedMarket, setExpandedMarket] = useState<string | null>(null);
  const supabase = createClient();

  function addMarket() {
    const m: Market = { id: uid(), name: "", tam_estimate: "", accessibility_score: 0, competition_score: 0, strategic_fit_score: 0, entry_mode: "direct_sales", status: "evaluating", go_decision: "", key_risks: "", success_metrics: "", target_date: "", notes: "" };
    setData((p) => ({ ...p, markets: [...p.markets, m] }));
    setExpandedMarket(m.id);
    setSaved(false);
  }

  function updateMarket(id: string, field: keyof Market, value: string | number) {
    setData((p) => ({ ...p, markets: p.markets.map((m) => m.id === id ? { ...m, [field]: value } : m) }));
    setSaved(false);
  }

  function removeMarket(id: string) {
    setData((p) => ({ ...p, markets: p.markets.filter((m) => m.id !== id) }));
    setSaved(false);
  }

  async function handleSave() {
    setSaving(true);
    if (artifactId) {
      await supabase.from("artifacts").update({ data: data as unknown as Record<string, unknown>, updated_at: new Date().toISOString() }).eq("id", artifactId);
    } else {
      const { data: a } = await supabase.from("artifacts").insert({ team_id: teamId, artifact_type: "market_expansion", title: "Market Expansion Planner", data: data as unknown as Record<string, unknown>, created_by: userId }).select("id").single();
      if (a) setArtifactId(a.id);
    }
    setSaving(false);
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  }

  const sortedMarkets = [...data.markets].sort((a, b) => attractiveness(b) - attractiveness(a));

  return (
    <div className="space-y-6">
      <Card className="border-primary/20 bg-primary/5">
        <CardContent className="pt-4 pb-4">
          <p className="text-sm font-medium mb-1">Why market expansion must be earned, not rushed</p>
          <p className="text-sm text-muted-foreground">
            Most premature market expansions destroy value instead of creating it. Spreading limited resources across multiple geographies or verticals before dominating your beachhead dilutes focus, increases operational complexity, and often means you win nowhere instead of winning somewhere decisively. The strongest expansion moves are driven by pull — customer demand, inbound from new markets, or a partner that dramatically reduces cost of entry.
          </p>
        </CardContent>
      </Card>

      {/* Beachhead & thesis */}
      <div className="space-y-3">
        <div className="space-y-1.5">
          <Label>Current beachhead market (where you dominate today)</Label>
          <Textarea rows={2} placeholder="Describe your beachhead: who you serve, where, and how you've established dominance there." value={data.beachhead_summary} onChange={(e) => { setData((p) => ({ ...p, beachhead_summary: e.target.value })); setSaved(false); }} disabled={isReadOnly} />
        </div>
        <div className="space-y-1.5">
          <Label>Expansion thesis</Label>
          <Textarea rows={2} placeholder="Why expand now? What market signals or product capabilities make this the right time?" value={data.expansion_thesis} onChange={(e) => { setData((p) => ({ ...p, expansion_thesis: e.target.value })); setSaved(false); }} disabled={isReadOnly} />
        </div>
      </div>

      <Separator />

      {/* Markets */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <div>
            <p className="text-sm font-medium">Market prioritisation</p>
            <p className="text-xs text-muted-foreground">Scored by accessibility, competition level, and strategic fit. Higher score = more attractive.</p>
          </div>
          {!isReadOnly && (
            <Button size="sm" variant="outline" onClick={addMarket}>
              <PlusCircle className="size-4" />Add Market
            </Button>
          )}
        </div>

        {/* Ranked summary */}
        {data.markets.length > 1 && (
          <div className="rounded-lg border mb-4 overflow-hidden">
            <table className="w-full text-xs">
              <thead className="bg-muted/50">
                <tr>
                  <th className="text-left px-3 py-2 font-medium">Market</th>
                  <th className="text-right px-3 py-2 font-medium">Score</th>
                  <th className="text-right px-3 py-2 font-medium">TAM</th>
                  <th className="text-right px-3 py-2 font-medium">Status</th>
                </tr>
              </thead>
              <tbody>
                {sortedMarkets.map((m) => {
                  const score = attractiveness(m);
                  return (
                    <tr key={m.id} className="border-t">
                      <td className="px-3 py-2">{m.name || "—"}</td>
                      <td className="px-3 py-2 text-right">
                        <Badge variant={score >= 70 ? "default" : score >= 50 ? "secondary" : "destructive"} className="text-xs">{score}%</Badge>
                      </td>
                      <td className="px-3 py-2 text-right text-muted-foreground">{m.tam_estimate || "—"}</td>
                      <td className="px-3 py-2 text-right">
                        <Badge variant={STATUS_CONFIG[m.status].variant} className="text-xs">{STATUS_CONFIG[m.status].label}</Badge>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}

        <div className="space-y-3">
          {data.markets.length === 0 && <p className="text-sm text-muted-foreground">No markets added. Add markets you are evaluating or have entered.</p>}
          {data.markets.map((m) => {
            const isExpanded = expandedMarket === m.id;
            const score = attractiveness(m);
            return (
              <Card key={m.id}>
                <CardHeader className="pb-2">
                  <div className="flex items-center gap-2">
                    <button
                      className="flex-1 flex items-center gap-2 text-left"
                      onClick={() => setExpandedMarket(isExpanded ? null : m.id)}
                    >
                      <CardTitle className="text-base">{m.name || "New market"}</CardTitle>
                      {score > 0 && <Badge variant={score >= 70 ? "default" : score >= 50 ? "secondary" : "destructive"} className="text-xs">{score}%</Badge>}
                      <Badge variant={STATUS_CONFIG[m.status].variant} className="text-xs">{STATUS_CONFIG[m.status].label}</Badge>
                    </button>
                    {!isReadOnly && (
                      <Button size="sm" variant="ghost" onClick={() => removeMarket(m.id)}>
                        <Trash2 className="size-3.5" />
                      </Button>
                    )}
                  </div>
                </CardHeader>

                {isExpanded && (
                  <CardContent className="space-y-4 pt-0">
                    <Separator className="mb-3" />
                    <div className="grid gap-4 sm:grid-cols-2">
                      <div className="space-y-1.5">
                        <Label className="text-xs">Market name / segment</Label>
                        <Input placeholder="e.g. UK mid-market SaaS" value={m.name} onChange={(e) => updateMarket(m.id, "name", e.target.value)} disabled={isReadOnly} />
                      </div>
                      <div className="space-y-1.5">
                        <Label className="text-xs">TAM estimate</Label>
                        <Input placeholder="e.g. $2B" value={m.tam_estimate} onChange={(e) => updateMarket(m.id, "tam_estimate", e.target.value)} disabled={isReadOnly} />
                      </div>
                    </div>

                    <div className="grid gap-4 sm:grid-cols-3">
                      <ScoreButtons label="Accessibility (1=hard, 5=easy)" value={m.accessibility_score} onChange={(v) => updateMarket(m.id, "accessibility_score", v)} disabled={isReadOnly} />
                      <ScoreButtons label="Competition (1=intense, 5=weak)" value={m.competition_score} onChange={(v) => updateMarket(m.id, "competition_score", v)} disabled={isReadOnly} />
                      <ScoreButtons label="Strategic fit (1=low, 5=high)" value={m.strategic_fit_score} onChange={(v) => updateMarket(m.id, "strategic_fit_score", v)} disabled={isReadOnly} />
                    </div>

                    <div className="grid gap-4 sm:grid-cols-2">
                      <div className="space-y-1.5">
                        <Label className="text-xs">Entry mode</Label>
                        <select
                          className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                          value={m.entry_mode}
                          onChange={(e) => updateMarket(m.id, "entry_mode", e.target.value)}
                          disabled={isReadOnly}
                        >
                          {Object.entries(ENTRY_LABELS).map(([v, l]) => <option key={v} value={v}>{l}</option>)}
                        </select>
                      </div>
                      <div className="space-y-1.5">
                        <Label className="text-xs">Status</Label>
                        <select
                          className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                          value={m.status}
                          onChange={(e) => updateMarket(m.id, "status", e.target.value)}
                          disabled={isReadOnly}
                        >
                          {Object.entries(STATUS_CONFIG).map(([v, cfg]) => <option key={v} value={v}>{cfg.label}</option>)}
                        </select>
                      </div>
                      <div className="space-y-1.5">
                        <Label className="text-xs">Target entry date</Label>
                        <Input type="month" value={m.target_date} onChange={(e) => updateMarket(m.id, "target_date", e.target.value)} disabled={isReadOnly} />
                      </div>
                    </div>

                    <div className="space-y-1.5">
                      <Label className="text-xs">Go / No-go rationale</Label>
                      <Textarea rows={2} placeholder="Why pursue (or not pursue) this market? What would change your mind?" value={m.go_decision} onChange={(e) => updateMarket(m.id, "go_decision", e.target.value)} disabled={isReadOnly} />
                    </div>
                    <div className="space-y-1.5">
                      <Label className="text-xs">Key risks</Label>
                      <Textarea rows={2} placeholder="Regulatory, competitive, localisation, distribution risks..." value={m.key_risks} onChange={(e) => updateMarket(m.id, "key_risks", e.target.value)} disabled={isReadOnly} />
                    </div>
                    <div className="space-y-1.5">
                      <Label className="text-xs">Success metrics (6-12 month)</Label>
                      <Textarea rows={2} placeholder="What does a successful launch look like? Customers, MRR, partnerships..." value={m.success_metrics} onChange={(e) => updateMarket(m.id, "success_metrics", e.target.value)} disabled={isReadOnly} />
                    </div>
                    <div className="space-y-1.5">
                      <Label className="text-xs">Notes</Label>
                      <Textarea rows={2} value={m.notes} onChange={(e) => updateMarket(m.id, "notes", e.target.value)} disabled={isReadOnly} />
                    </div>
                  </CardContent>
                )}
              </Card>
            );
          })}
        </div>
      </div>

      {!isReadOnly && (
        <Button onClick={handleSave} disabled={saving}>
          {saving ? <><Loader2 className="size-4 animate-spin" />Saving...</> : saved ? <><Check className="size-4" />Saved</> : <><Save className="size-4" />Save Planner</>}
        </Button>
      )}
    </div>
  );
}
