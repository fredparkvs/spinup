"use client";

import { useState } from "react";
import { Save, Loader2, Check } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";

interface UEData {
  revenue_per_customer: number | "";
  cac: number | "";
  variable_cost_per_customer: number | "";
  churn_rate_pct: number | "";
}

function parseData(raw: Record<string, unknown>): UEData {
  return {
    revenue_per_customer: (raw.revenue_per_customer as number) ?? "",
    cac: (raw.cac as number) ?? "",
    variable_cost_per_customer: (raw.variable_cost_per_customer as number) ?? "",
    churn_rate_pct: (raw.churn_rate_pct as number) ?? "",
  };
}

function fmt(n: number) {
  return `R${n.toLocaleString("en-ZA", { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`;
}

function calcMetrics(d: UEData) {
  const rev = Number(d.revenue_per_customer) || 0;
  const cac = Number(d.cac) || 0;
  const vc = Number(d.variable_cost_per_customer) || 0;
  const churn = Number(d.churn_rate_pct) || 0;
  const grossMargin = rev - vc;
  const grossMarginPct = rev > 0 ? (grossMargin / rev) * 100 : 0;
  const ltv = churn > 0 ? grossMargin / (churn / 100) : null;
  const ltvCac = ltv !== null && cac > 0 ? ltv / cac : null;
  const monthsToRecoverCac = grossMargin > 0 ? cac / grossMargin : null;
  const breakEvenCustomers = grossMargin > 0 && cac > 0 ? Math.ceil(cac / grossMargin) : null;
  return { grossMargin, grossMarginPct, ltv, ltvCac, monthsToRecoverCac, breakEvenCustomers };
}

export function UnitEconomics({ teamId, userId, isReadOnly, existingArtifact }: {
  teamId: string; userId: string; isReadOnly: boolean;
  existingArtifact: { id: string; data: Record<string, unknown> } | null;
}) {
  const [data, setData] = useState<UEData>(() => parseData(existingArtifact?.data ?? {}));
  const [artifactId, setArtifactId] = useState(existingArtifact?.id ?? null);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const supabase = createClient();
  const metrics = calcMetrics(data);

  function update(field: keyof UEData, value: string) {
    setData((prev) => ({ ...prev, [field]: value === "" ? "" : parseFloat(value) }));
    setSaved(false);
  }

  async function handleSave() {
    setSaving(true);
    if (artifactId) {
      await supabase.from("artifacts").update({ data: data as unknown as Record<string, unknown>, updated_at: new Date().toISOString() }).eq("id", artifactId);
    } else {
      const { data: a } = await supabase.from("artifacts").insert({ team_id: teamId, artifact_type: "unit_economics", title: "Unit Economics", data: data as unknown as Record<string, unknown>, created_by: userId }).select("id").single();
      if (a) setArtifactId(a.id);
    }
    setSaving(false);
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  }

  const ltvCacHealth = metrics.ltvCac !== null
    ? metrics.ltvCac >= 3 ? "healthy" : metrics.ltvCac >= 1 ? "marginal" : "unhealthy"
    : null;

  return (
    <div className="space-y-6">
      {/* Inputs */}
      <div className="grid gap-4 sm:grid-cols-2">
        {([
          { key: "revenue_per_customer", label: "Monthly revenue per customer (R)", placeholder: "e.g. 5000" },
          { key: "cac", label: "Cost to acquire a customer (CAC) (R)", placeholder: "e.g. 15000" },
          { key: "variable_cost_per_customer", label: "Variable cost per customer / month (R)", placeholder: "e.g. 1000" },
          { key: "churn_rate_pct", label: "Monthly churn rate (%)", placeholder: "e.g. 5" },
        ] as { key: keyof UEData; label: string; placeholder: string }[]).map(({ key, label, placeholder }) => (
          <div key={key} className="space-y-2">
            <Label className="text-sm">{label}</Label>
            <Input type="number" min="0" placeholder={placeholder} value={data[key]} onChange={(e) => update(key, e.target.value)} disabled={isReadOnly} />
          </div>
        ))}
      </div>

      <Separator />

      {/* Computed outputs */}
      <div>
        <p className="text-sm font-medium mb-3">Calculated Metrics</p>
        <div className="grid gap-3 sm:grid-cols-3">
          <MetricCard label="Gross Margin / customer / month" value={metrics.grossMargin > 0 ? `${fmt(metrics.grossMargin)} (${metrics.grossMarginPct.toFixed(0)}%)` : "—"} />
          <MetricCard label="LTV (Lifetime Value)" value={metrics.ltv !== null ? fmt(metrics.ltv) : "Enter churn rate"} />
          <MetricCard
            label="LTV:CAC Ratio"
            value={metrics.ltvCac !== null ? `${metrics.ltvCac.toFixed(1)}x` : "—"}
            badge={ltvCacHealth ? { label: ltvCacHealth === "healthy" ? "Healthy ≥3x" : ltvCacHealth === "marginal" ? "Marginal 1–3x" : "Unhealthy <1x", variant: ltvCacHealth === "healthy" ? "default" : ltvCacHealth === "marginal" ? "secondary" : "destructive" } : undefined}
          />
          <MetricCard label="Months to recover CAC" value={metrics.monthsToRecoverCac !== null ? `${metrics.monthsToRecoverCac.toFixed(1)} months` : "—"} />
          <MetricCard label="Break-even customers" value={metrics.breakEvenCustomers !== null ? `${metrics.breakEvenCustomers} customers` : "—"} hint="Number of customers needed to recover one CAC" />
        </div>
      </div>

      {!isReadOnly && (
        <Button onClick={handleSave} disabled={saving}>
          {saving ? <><Loader2 className="size-4 animate-spin" />Saving...</> : saved ? <><Check className="size-4" />Saved</> : <><Save className="size-4" />Save</>}
        </Button>
      )}
    </div>
  );
}

function MetricCard({ label, value, hint, badge }: {
  label: string; value: string; hint?: string;
  badge?: { label: string; variant: "default" | "secondary" | "destructive" };
}) {
  return (
    <div className="rounded-lg border bg-muted/20 p-3 space-y-1">
      <p className="text-xs text-muted-foreground">{label}</p>
      <p className="text-lg font-semibold">{value}</p>
      {badge && <Badge variant={badge.variant} className="text-xs">{badge.label}</Badge>}
      {hint && <p className="text-xs text-muted-foreground">{hint}</p>}
    </div>
  );
}
