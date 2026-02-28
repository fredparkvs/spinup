"use client";

import { useState } from "react";
import { PlusCircle, Save, Loader2 } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";

interface PmfEntry {
  id: string;
  data: Record<string, unknown>;
  created_at: string;
}

interface PmfFormData {
  period: string;
  sean_ellis_score: number | "";
  nps: number | "";
  wau: number | "";
  cohort_retention_pct: number | "";
  organic_referrals: number | "";
  feature_adoption_pct: number | "";
  notes: string;
}

function parseEntry(raw: Record<string, unknown>): PmfFormData {
  return {
    period: (raw.period as string) ?? "",
    sean_ellis_score: (raw.sean_ellis_score as number) ?? "",
    nps: (raw.nps as number) ?? "",
    wau: (raw.wau as number) ?? "",
    cohort_retention_pct: (raw.cohort_retention_pct as number) ?? "",
    organic_referrals: (raw.organic_referrals as number) ?? "",
    feature_adoption_pct: (raw.feature_adoption_pct as number) ?? "",
    notes: (raw.notes as string) ?? "",
  };
}

const METRICS = [
  { key: "sean_ellis_score" as const, label: "Sean Ellis Score (%)", hint: "% saying 'very disappointed' — threshold: 40%", threshold: 40, unit: "%" },
  { key: "nps" as const, label: "Net Promoter Score", hint: "Promoters − Detractors. Good: >50", threshold: 50, unit: "" },
  { key: "wau" as const, label: "Weekly Active Users/Customers", hint: "Trend matters more than absolute number", threshold: null, unit: "" },
  { key: "cohort_retention_pct" as const, label: "Month-3 Cohort Retention (%)", hint: "% of month-1 customers still active at month 3", threshold: null, unit: "%" },
  { key: "organic_referrals" as const, label: "Organic Referrals (this period)", hint: "New customers from word-of-mouth", threshold: null, unit: "" },
  { key: "feature_adoption_pct" as const, label: "Core Feature Adoption (%)", hint: "% of users using your core feature", threshold: null, unit: "%" },
];

export function PmfDashboard({ teamId, userId, isReadOnly, entries }: {
  teamId: string; userId: string; isReadOnly: boolean; entries: PmfEntry[];
}) {
  const [form, setForm] = useState<PmfFormData>(() => ({
    period: new Date().toISOString().split("T")[0].slice(0, 7),
    sean_ellis_score: "", nps: "", wau: "", cohort_retention_pct: "", organic_referrals: "", feature_adoption_pct: "", notes: "",
  }));
  const [showForm, setShowForm] = useState(false);
  const [saving, setSaving] = useState(false);
  const supabase = createClient();

  const latestEntry = entries[entries.length - 1];
  const latestData = latestEntry ? parseEntry(latestEntry.data) : null;

  async function handleSave() {
    setSaving(true);
    await supabase.from("artifacts").insert({
      team_id: teamId, artifact_type: "pmf_dashboard",
      title: `PMF — ${form.period}`,
      data: form as unknown as Record<string, unknown>, created_by: userId,
    });
    setSaving(false);
    setShowForm(false);
  }

  const seScore = Number(latestData?.sean_ellis_score) || 0;
  const hasPMF = seScore >= 40;

  return (
    <div className="space-y-6">
      {/* PMF signal */}
      {latestData && (
        <div className={`rounded-lg border p-4 ${hasPMF ? "border-green-300 bg-green-50 dark:bg-green-950/30" : "border-amber-300 bg-amber-50 dark:bg-amber-950/30"}`}>
          <div className="flex items-center gap-3">
            <Badge variant={hasPMF ? "default" : "secondary"} className="text-sm">
              {hasPMF ? "PMF Signal Detected" : "Building Toward PMF"}
            </Badge>
            <span className="text-sm text-muted-foreground">
              Sean Ellis: {seScore}% {hasPMF ? "(≥40% threshold met)" : "(target: 40%)"}
            </span>
          </div>
        </div>
      )}

      {/* Latest metrics */}
      {latestData && (
        <div className="grid gap-3 sm:grid-cols-3">
          {METRICS.map(({ key, label, hint, threshold, unit }) => {
            const value = Number(latestData[key]) || null;
            const meetsThreshold = threshold !== null && value !== null && value >= threshold;
            return (
              <div key={key} className="rounded-lg border bg-muted/20 p-3 space-y-1">
                <p className="text-xs text-muted-foreground">{label}</p>
                <p className="text-lg font-semibold">{value !== null ? `${value}${unit}` : "—"}</p>
                {threshold && <Badge variant={meetsThreshold ? "default" : "secondary"} className="text-xs">Target: {threshold}{unit}</Badge>}
                <p className="text-xs text-muted-foreground">{hint}</p>
              </div>
            );
          })}
        </div>
      )}

      {/* History */}
      {entries.length > 1 && (
        <>
          <Separator />
          <div>
            <p className="text-sm font-medium mb-2">History</p>
            <div className="space-y-1">
              {entries.slice(-8).reverse().map((e) => {
                const d = parseEntry(e.data);
                const se = Number(d.sean_ellis_score) || 0;
                return (
                  <div key={e.id} className="flex items-center justify-between text-xs py-1 border-b last:border-0">
                    <span className="text-muted-foreground">{d.period || new Date(e.created_at).toLocaleDateString("en-ZA")}</span>
                    <span>Sean Ellis: {se > 0 ? `${se}%` : "—"}</span>
                    <span>NPS: {d.nps !== "" ? d.nps : "—"}</span>
                    <Badge variant={se >= 40 ? "default" : "secondary"} className="text-xs">{se >= 40 ? "PMF ✓" : "Building"}</Badge>
                  </div>
                );
              })}
            </div>
          </div>
        </>
      )}

      {/* Add new entry */}
      {!isReadOnly && (
        <>
          <Separator />
          {showForm ? (
            <div className="space-y-4">
              <p className="text-sm font-medium">Add PMF entry</p>
              <div className="space-y-2">
                <Label className="text-xs">Period (month)</Label>
                <Input type="month" value={form.period} onChange={(e) => setForm((p) => ({ ...p, period: e.target.value }))} />
              </div>
              <div className="grid gap-3 sm:grid-cols-2">
                {METRICS.map(({ key, label }) => (
                  <div key={key} className="space-y-1">
                    <Label className="text-xs">{label}</Label>
                    <Input type="number" min="0" value={form[key]} onChange={(e) => setForm((p) => ({ ...p, [key]: e.target.value === "" ? "" : parseFloat(e.target.value) }))} />
                  </div>
                ))}
              </div>
              <div className="space-y-1">
                <Label className="text-xs">Notes</Label>
                <Input placeholder="Any context for this period's numbers" value={form.notes} onChange={(e) => setForm((p) => ({ ...p, notes: e.target.value }))} />
              </div>
              <div className="flex gap-2">
                <Button size="sm" onClick={handleSave} disabled={saving}>
                  {saving ? <Loader2 className="size-3 animate-spin" /> : <Save className="size-3" />}Save Entry
                </Button>
                <Button size="sm" variant="ghost" onClick={() => setShowForm(false)}>Cancel</Button>
              </div>
            </div>
          ) : (
            <Button size="sm" variant="outline" onClick={() => setShowForm(true)}>
              <PlusCircle className="size-4" />Log PMF Metrics
            </Button>
          )}
        </>
      )}
    </div>
  );
}
