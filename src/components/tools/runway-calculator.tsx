"use client";

import { useState } from "react";
import { Save, Loader2, AlertTriangle } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import type { RunwayMode } from "@/lib/types/database";

interface RunwaySnapshot {
  id: string;
  data: Record<string, unknown>;
  created_at: string;
}

interface RunwayFormData {
  mode: RunwayMode;
  cash_on_hand: number | "";
  monthly_burn: number | "";
  monthly_revenue: number | "";
  revenue_growth_pct: number | "";
  expected_funding_date: string;
  expected_funding_amount: number | "";
}

function parseSnapshot(raw: Record<string, unknown>): RunwayFormData {
  return {
    mode: (raw.mode as RunwayMode) ?? "pre_funding_pre_revenue",
    cash_on_hand: (raw.cash_on_hand as number) ?? "",
    monthly_burn: (raw.monthly_burn as number) ?? "",
    monthly_revenue: (raw.monthly_revenue as number) ?? "",
    revenue_growth_pct: (raw.revenue_growth_pct as number) ?? "",
    expected_funding_date: (raw.expected_funding_date as string) ?? "",
    expected_funding_amount: (raw.expected_funding_amount as number) ?? "",
  };
}

function calcRunway(d: RunwayFormData) {
  const cash = Number(d.cash_on_hand) || 0;
  const burn = Number(d.monthly_burn) || 0;
  const revenue = d.mode === "revenue_generating" ? Number(d.monthly_revenue) || 0 : 0;
  const netBurn = burn - revenue;
  const months = netBurn > 0 ? cash / netBurn : null;
  const endDate = months !== null ? new Date(Date.now() + months * 30 * 24 * 60 * 60 * 1000) : null;

  let withFundingMonths: number | null = null;
  if (d.mode !== "revenue_generating" && d.expected_funding_amount && d.expected_funding_date) {
    const fundingCash = cash + Number(d.expected_funding_amount);
    withFundingMonths = netBurn > 0 ? fundingCash / netBurn : null;
  }

  return { netBurn, months, endDate, withFundingMonths, isDanger: months !== null && months < 3 };
}

const MODE_LABELS: Record<RunwayMode, string> = {
  pre_funding_pre_revenue: "Pre-funding, pre-revenue",
  pre_revenue_funded: "Pre-revenue, funded",
  revenue_generating: "Revenue generating",
};

export function RunwayCalculator({ teamId, userId, isReadOnly, snapshots }: {
  teamId: string; userId: string; isReadOnly: boolean;
  snapshots: RunwaySnapshot[];
}) {
  const latestSnapshot = snapshots[snapshots.length - 1];
  const [form, setForm] = useState<RunwayFormData>(() =>
    latestSnapshot ? parseSnapshot(latestSnapshot.data) : {
      mode: "pre_funding_pre_revenue", cash_on_hand: "", monthly_burn: "", monthly_revenue: "",
      revenue_growth_pct: "", expected_funding_date: "", expected_funding_amount: "",
    }
  );
  const [saving, setSaving] = useState(false);
  const supabase = createClient();
  const calc = calcRunway(form);

  function update(field: keyof RunwayFormData, value: unknown) {
    setForm((prev) => ({ ...prev, [field]: value }));
  }

  async function handleSave() {
    setSaving(true);
    await supabase.from("artifacts").insert({
      team_id: teamId, artifact_type: "runway_calculator", title: `Runway — ${new Date().toLocaleDateString("en-ZA")}`,
      data: form as unknown as Record<string, unknown>, created_by: userId,
    });
    setSaving(false);
  }

  return (
    <div className="space-y-6">
      {/* Mode selector */}
      <div className="space-y-2">
        <Label>Current status</Label>
        <Select value={form.mode} onValueChange={(v) => update("mode", v as RunwayMode)} disabled={isReadOnly}>
          <SelectTrigger><SelectValue /></SelectTrigger>
          <SelectContent>
            {(Object.entries(MODE_LABELS) as [RunwayMode, string][]).map(([key, label]) => (
              <SelectItem key={key} value={key}>{label}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-2">
          <Label>Cash on hand (R)</Label>
          <Input type="number" min="0" placeholder="e.g. 500000" value={form.cash_on_hand} onChange={(e) => update("cash_on_hand", e.target.value === "" ? "" : parseFloat(e.target.value))} disabled={isReadOnly} />
        </div>
        <div className="space-y-2">
          <Label>Monthly burn rate (R)</Label>
          <Input type="number" min="0" placeholder="e.g. 50000" value={form.monthly_burn} onChange={(e) => update("monthly_burn", e.target.value === "" ? "" : parseFloat(e.target.value))} disabled={isReadOnly} />
        </div>
        {form.mode === "revenue_generating" && (
          <>
            <div className="space-y-2">
              <Label>Monthly revenue (R)</Label>
              <Input type="number" min="0" placeholder="e.g. 20000" value={form.monthly_revenue} onChange={(e) => update("monthly_revenue", e.target.value === "" ? "" : parseFloat(e.target.value))} disabled={isReadOnly} />
            </div>
            <div className="space-y-2">
              <Label>Expected monthly revenue growth (%)</Label>
              <Input type="number" min="0" max="100" placeholder="e.g. 10" value={form.revenue_growth_pct} onChange={(e) => update("revenue_growth_pct", e.target.value === "" ? "" : parseFloat(e.target.value))} disabled={isReadOnly} />
            </div>
          </>
        )}
        {form.mode !== "revenue_generating" && (
          <>
            <div className="space-y-2">
              <Label>Expected funding date</Label>
              <Input type="date" value={form.expected_funding_date} onChange={(e) => update("expected_funding_date", e.target.value)} disabled={isReadOnly} />
            </div>
            <div className="space-y-2">
              <Label>Expected funding amount (R)</Label>
              <Input type="number" min="0" placeholder="e.g. 2000000" value={form.expected_funding_amount} onChange={(e) => update("expected_funding_amount", e.target.value === "" ? "" : parseFloat(e.target.value))} disabled={isReadOnly} />
            </div>
          </>
        )}
      </div>

      <Separator />

      {/* Results */}
      <div className="grid gap-3 sm:grid-cols-2">
        <div className="rounded-lg border bg-muted/20 p-3 space-y-1">
          <p className="text-xs text-muted-foreground">Net monthly burn</p>
          <p className="text-lg font-semibold">R{calc.netBurn.toLocaleString("en-ZA")}</p>
        </div>
        <div className={`rounded-lg border p-3 space-y-1 ${calc.isDanger ? "border-destructive/50 bg-destructive/5" : "bg-muted/20"}`}>
          <div className="flex items-center gap-2">
            <p className="text-xs text-muted-foreground">Months of runway</p>
            {calc.isDanger && <AlertTriangle className="size-3 text-destructive" />}
          </div>
          <div className="flex items-center gap-2">
            <p className="text-lg font-semibold">{calc.months !== null ? `${calc.months.toFixed(1)} months` : "—"}</p>
            {calc.isDanger && <Badge variant="destructive" className="text-xs">Danger zone</Badge>}
          </div>
          {calc.endDate && <p className="text-xs text-muted-foreground">Runway ends: {calc.endDate.toLocaleDateString("en-ZA", { day: "numeric", month: "long", year: "numeric" })}</p>}
        </div>
        {calc.withFundingMonths !== null && (
          <div className="rounded-lg border bg-muted/20 p-3 space-y-1 sm:col-span-2">
            <p className="text-xs text-muted-foreground">Runway with expected funding</p>
            <p className="text-lg font-semibold">{calc.withFundingMonths.toFixed(1)} months</p>
          </div>
        )}
      </div>

      {/* Snapshot history */}
      {snapshots.length > 0 && (
        <>
          <Separator />
          <div>
            <p className="text-sm font-medium mb-2">Weekly snapshots</p>
            <div className="space-y-1">
              {snapshots.slice(-6).reverse().map((s) => {
                const d = parseSnapshot(s.data);
                const c = calcRunway(d);
                return (
                  <div key={s.id} className="flex items-center justify-between text-xs py-1 border-b last:border-0">
                    <span className="text-muted-foreground">{new Date(s.created_at).toLocaleDateString("en-ZA")}</span>
                    <span>R{(Number(d.cash_on_hand) || 0).toLocaleString("en-ZA")} cash</span>
                    <span className={c.isDanger ? "text-destructive font-medium" : ""}>
                      {c.months !== null ? `${c.months.toFixed(1)}mo runway` : "—"}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        </>
      )}

      {!isReadOnly && (
        <Button onClick={handleSave} disabled={saving}>
          {saving ? <><Loader2 className="size-4 animate-spin" />Saving snapshot...</> : <><Save className="size-4" />Save Weekly Snapshot</>}
        </Button>
      )}
    </div>
  );
}
