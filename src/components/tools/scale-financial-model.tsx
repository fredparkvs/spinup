"use client";

import { useState } from "react";
import { Save, Loader2, Check, AlertCircle, PlusCircle, Trash2 } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";

type Scenario = "conservative" | "base" | "optimistic";

interface ScenarioInputs {
  mrr_current: string;
  mrr_growth_pct_monthly: string;
  gross_margin_pct: string;
  monthly_burn: string;
  cash_on_hand: string;
  new_customers_monthly: string;
}

interface Milestone {
  id: string;
  label: string;
  target_date: string;
  metric: string;
  status: "upcoming" | "on_track" | "achieved";
}

interface FinancialModelData {
  scenarios: Record<Scenario, ScenarioInputs>;
  active_scenario: Scenario;
  milestones: Milestone[];
  assumptions: string;
  risks: string;
}

const DEFAULT_SCENARIO: ScenarioInputs = { mrr_current: "", mrr_growth_pct_monthly: "", gross_margin_pct: "", monthly_burn: "", cash_on_hand: "", new_customers_monthly: "" };

function parseData(raw: Record<string, unknown>): FinancialModelData {
  return {
    scenarios: (raw.scenarios as Record<Scenario, ScenarioInputs>) ?? { conservative: { ...DEFAULT_SCENARIO }, base: { ...DEFAULT_SCENARIO }, optimistic: { ...DEFAULT_SCENARIO } },
    active_scenario: (raw.active_scenario as Scenario) ?? "base",
    milestones: (raw.milestones as Milestone[]) ?? [],
    assumptions: (raw.assumptions as string) ?? "",
    risks: (raw.risks as string) ?? "",
  };
}

function project(inputs: ScenarioInputs, months: number): { mrr: number; burn: number; cash: number; runway: number }[] {
  const current = Number(inputs.mrr_current) || 0;
  const growthRate = (Number(inputs.mrr_growth_pct_monthly) || 0) / 100;
  const gm = (Number(inputs.gross_margin_pct) || 70) / 100;
  const burn = Number(inputs.monthly_burn) || 0;
  let cash = Number(inputs.cash_on_hand) || 0;
  const result = [];
  let mrr = current;
  for (let i = 0; i < months; i++) {
    mrr = mrr * (1 + growthRate);
    const grossProfit = mrr * gm;
    const netBurn = Math.max(0, burn - grossProfit);
    cash = cash - netBurn;
    const runway = netBurn > 0 ? Math.round(cash / netBurn) : 999;
    result.push({ mrr: Math.round(mrr), burn: Math.round(netBurn), cash: Math.round(cash), runway });
  }
  return result;
}

function fmt(n: number): string {
  if (n >= 1_000_000) return `$${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `$${Math.round(n / 1_000)}k`;
  return `$${n}`;
}

function uid(): string {
  return Math.random().toString(36).slice(2, 9);
}

const SCENARIO_COLORS: Record<Scenario, string> = {
  conservative: "destructive",
  base: "default",
  optimistic: "secondary",
};

export function ScaleFinancialModel({
  teamId, userId, isReadOnly, existingArtifact,
}: {
  teamId: string; userId: string; isReadOnly: boolean;
  existingArtifact: { id: string; data: Record<string, unknown> } | null;
}) {
  const [data, setData] = useState<FinancialModelData>(() => parseData(existingArtifact?.data ?? {}));
  const [artifactId, setArtifactId] = useState(existingArtifact?.id ?? null);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [confirmed, setConfirmed] = useState(!!existingArtifact);
  const supabase = createClient();

  const activeInputs = data.scenarios[data.active_scenario];
  const projection = project(activeInputs, 12);
  const runway = Number(activeInputs.cash_on_hand) && Number(activeInputs.monthly_burn)
    ? Math.round(Number(activeInputs.cash_on_hand) / Number(activeInputs.monthly_burn))
    : null;

  function updateScenario(scenario: Scenario, field: keyof ScenarioInputs, value: string) {
    setData((p) => ({ ...p, scenarios: { ...p.scenarios, [scenario]: { ...p.scenarios[scenario], [field]: value } } }));
    setSaved(false);
  }

  function addMilestone() {
    setData((p) => ({ ...p, milestones: [...p.milestones, { id: uid(), label: "", target_date: "", metric: "", status: "upcoming" }] }));
    setSaved(false);
  }

  function updateMilestone(id: string, field: keyof Milestone, value: string) {
    setData((p) => ({ ...p, milestones: p.milestones.map((m) => m.id === id ? { ...m, [field]: value } : m) }));
    setSaved(false);
  }

  function removeMilestone(id: string) {
    setData((p) => ({ ...p, milestones: p.milestones.filter((m) => m.id !== id) }));
    setSaved(false);
  }

  async function handleSave() {
    setSaving(true);
    if (artifactId) {
      await supabase.from("artifacts").update({ data: data as unknown as Record<string, unknown>, updated_at: new Date().toISOString() }).eq("id", artifactId);
    } else {
      const { data: a } = await supabase.from("artifacts").insert({ team_id: teamId, artifact_type: "scale_financial_model", title: "Growth-Stage Financial Model", data: data as unknown as Record<string, unknown>, created_by: userId }).select("id").single();
      if (a) setArtifactId(a.id);
    }
    setSaving(false);
    setSaved(true);
    setConfirmed(true);
    setTimeout(() => setSaved(false), 2000);
  }

  const FIELDS: { key: keyof ScenarioInputs; label: string; placeholder: string }[] = [
    { key: "mrr_current", label: "Current MRR ($)", placeholder: "e.g. 50000" },
    { key: "mrr_growth_pct_monthly", label: "Monthly MRR growth (%)", placeholder: "e.g. 8" },
    { key: "gross_margin_pct", label: "Gross margin (%)", placeholder: "e.g. 70" },
    { key: "monthly_burn", label: "Monthly gross burn ($)", placeholder: "e.g. 120000" },
    { key: "cash_on_hand", label: "Cash on hand ($)", placeholder: "e.g. 2000000" },
    { key: "new_customers_monthly", label: "New customers / month", placeholder: "e.g. 5" },
  ];

  return (
    <div className="space-y-6">
      <Card className="border-primary/20 bg-primary/5">
        <CardContent className="pt-4 pb-4">
          <p className="text-sm font-medium mb-1">Why financial modelling at scale is different</p>
          <p className="text-sm text-muted-foreground">
            Early-stage models are about survival. Growth-stage models are about capital allocation and optionality. Knowing your runway under different scenarios lets you make strategic bets — when to hire ahead of revenue, when to fundraise, and when to cut. A model you do not maintain is not a model; it is a spreadsheet you ignore when decisions matter most.
          </p>
        </CardContent>
      </Card>

      {!confirmed && (
        <div className="flex items-start gap-3 rounded-lg border border-amber-300 bg-amber-50 dark:bg-amber-950/30 p-4">
          <AlertCircle className="size-4 mt-0.5 text-amber-600 shrink-0" />
          <p className="text-sm text-amber-800 dark:text-amber-300">
            <span className="font-medium text-amber-900 dark:text-amber-200">Enter your current actuals first. </span>
            Use real numbers in your base case, then set conservative and optimistic parameters.
          </p>
        </div>
      )}

      {/* Scenario selector */}
      <div className="flex gap-2 flex-wrap">
        {(["conservative", "base", "optimistic"] as Scenario[]).map((s) => (
          <button
            key={s}
            onClick={() => { setData((p) => ({ ...p, active_scenario: s })); }}
            disabled={isReadOnly && data.active_scenario !== s}
            className={`px-4 py-2 rounded-md text-sm font-medium transition-colors capitalize ${data.active_scenario === s ? "bg-primary text-primary-foreground" : "bg-muted hover:bg-muted/80"}`}
          >
            {s}
          </button>
        ))}
      </div>

      {/* Key metrics snapshot */}
      {activeInputs.mrr_current && (
        <div className="grid gap-3 sm:grid-cols-3">
          <div className="rounded-lg border bg-muted/20 p-3 space-y-1">
            <p className="text-xs text-muted-foreground">Current MRR</p>
            <p className="text-xl font-bold">{fmt(Number(activeInputs.mrr_current))}</p>
          </div>
          <div className="rounded-lg border bg-muted/20 p-3 space-y-1">
            <p className="text-xs text-muted-foreground">MRR in 12 months</p>
            <p className="text-xl font-bold">{projection.length > 0 ? fmt(projection[11].mrr) : "—"}</p>
          </div>
          <div className="rounded-lg border bg-muted/20 p-3 space-y-1">
            <p className="text-xs text-muted-foreground">Current runway</p>
            <p className="text-xl font-bold">{runway !== null ? `${runway} mo` : "—"}</p>
            {runway !== null && (
              <Badge variant={runway >= 18 ? "default" : runway >= 12 ? "secondary" : "destructive"} className="text-xs">
                {runway >= 18 ? "Healthy" : runway >= 12 ? "Manageable" : "Raise now"}
              </Badge>
            )}
          </div>
        </div>
      )}

      {/* Inputs per scenario */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-base capitalize">{data.active_scenario} scenario inputs</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 sm:grid-cols-2">
            {FIELDS.map(({ key, label, placeholder }) => (
              <div key={key} className="space-y-1.5">
                <Label className="text-sm">{label}</Label>
                <Input type="number" min="0" placeholder={placeholder} value={activeInputs[key]} onChange={(e) => updateScenario(data.active_scenario, key, e.target.value)} disabled={isReadOnly} />
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* 12-month projection table */}
      {projection.some((p) => p.mrr > 0) && (
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base">12-month projection ({data.active_scenario})</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full text-xs">
                <thead>
                  <tr className="border-b">
                    <th className="text-left py-2 font-medium text-muted-foreground">Month</th>
                    <th className="text-right py-2 font-medium text-muted-foreground">MRR</th>
                    <th className="text-right py-2 font-medium text-muted-foreground">Net burn</th>
                    <th className="text-right py-2 font-medium text-muted-foreground">Cash</th>
                    <th className="text-right py-2 font-medium text-muted-foreground">Runway</th>
                  </tr>
                </thead>
                <tbody>
                  {projection.map((p, i) => (
                    <tr key={i} className="border-b last:border-0">
                      <td className="py-1.5 text-muted-foreground">M+{i + 1}</td>
                      <td className="py-1.5 text-right font-medium">{fmt(p.mrr)}</td>
                      <td className="py-1.5 text-right">{fmt(p.burn)}</td>
                      <td className={`py-1.5 text-right ${p.cash < 0 ? "text-destructive font-medium" : ""}`}>{fmt(Math.abs(p.cash))}{p.cash < 0 ? " (deficit)" : ""}</td>
                      <td className="py-1.5 text-right">
                        <Badge variant={p.runway >= 18 ? "default" : p.runway >= 12 ? "secondary" : "destructive"} className="text-xs">
                          {p.runway >= 999 ? "∞" : `${p.runway}mo`}
                        </Badge>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Milestones */}
      <Card>
        <CardHeader className="pb-2">
          <div className="flex items-center justify-between">
            <CardTitle className="text-base">Financial milestones</CardTitle>
            {!isReadOnly && (
              <Button size="sm" variant="outline" onClick={addMilestone}>
                <PlusCircle className="size-4" />Add
              </Button>
            )}
          </div>
        </CardHeader>
        <CardContent className="space-y-3">
          {data.milestones.length === 0 && <p className="text-sm text-muted-foreground">No milestones set. Add key targets: ARR milestones, break-even, profitability.</p>}
          {data.milestones.map((m) => (
            <div key={m.id} className="grid gap-3 sm:grid-cols-4 items-end border-b pb-3 last:border-0 last:pb-0">
              <div className="space-y-1 sm:col-span-2">
                <Label className="text-xs">Milestone</Label>
                <Input placeholder="e.g. $1M ARR" value={m.label} onChange={(e) => updateMilestone(m.id, "label", e.target.value)} disabled={isReadOnly} />
              </div>
              <div className="space-y-1">
                <Label className="text-xs">Target date</Label>
                <Input type="month" value={m.target_date} onChange={(e) => updateMilestone(m.id, "target_date", e.target.value)} disabled={isReadOnly} />
              </div>
              <div className="flex items-end gap-2">
                <select
                  className="flex-1 rounded-md border border-input bg-background px-3 py-2 text-xs"
                  value={m.status}
                  onChange={(e) => updateMilestone(m.id, "status", e.target.value)}
                  disabled={isReadOnly}
                >
                  <option value="upcoming">Upcoming</option>
                  <option value="on_track">On track</option>
                  <option value="achieved">Achieved</option>
                </select>
                {!isReadOnly && (
                  <Button size="sm" variant="ghost" onClick={() => removeMilestone(m.id)}>
                    <Trash2 className="size-3.5" />
                  </Button>
                )}
              </div>
            </div>
          ))}
        </CardContent>
      </Card>

      <Separator />

      <div className="space-y-3">
        <div className="space-y-1.5">
          <Label>Key assumptions</Label>
          <Textarea rows={3} placeholder="What are your growth, churn, and hiring assumptions? What drives each scenario?" value={data.assumptions} onChange={(e) => { setData((p) => ({ ...p, assumptions: e.target.value })); setSaved(false); }} disabled={isReadOnly} />
        </div>
        <div className="space-y-1.5">
          <Label>Key financial risks</Label>
          <Textarea rows={3} placeholder="What could break your model? Large customer churn, slower growth, unexpected burn?" value={data.risks} onChange={(e) => { setData((p) => ({ ...p, risks: e.target.value })); setSaved(false); }} disabled={isReadOnly} />
        </div>
      </div>

      {!isReadOnly && (
        <Button onClick={handleSave} disabled={saving}>
          {saving ? <><Loader2 className="size-4 animate-spin" />Saving...</> : saved ? <><Check className="size-4" />Saved</> : <><Save className="size-4" />Save Model</>}
        </Button>
      )}
    </div>
  );
}
