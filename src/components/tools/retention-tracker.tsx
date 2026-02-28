"use client";

import { useState } from "react";
import { Save, Loader2, Check, PlusCircle, Trash2, AlertCircle } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";

interface CohortEntry {
  cohort_month: string;
  starting_mrr: string;
  current_mrr: string;
  starting_customers: string;
  current_customers: string;
  expansion_mrr: string;
  churned_mrr: string;
  notes: string;
}

interface LeadingIndicator {
  name: string;
  value: string;
  target: string;
  direction: "up" | "down";
}

interface RetentionData {
  cohorts: CohortEntry[];
  leading_indicators: LeadingIndicator[];
  churn_analysis: string;
  retention_initiatives: string;
}

function parseData(raw: Record<string, unknown>): RetentionData {
  return {
    cohorts: (raw.cohorts as CohortEntry[]) ?? [],
    leading_indicators: (raw.leading_indicators as LeadingIndicator[]) ?? [],
    churn_analysis: (raw.churn_analysis as string) ?? "",
    retention_initiatives: (raw.retention_initiatives as string) ?? "",
  };
}

function calcNRR(c: CohortEntry): number | null {
  const start = Number(c.starting_mrr);
  if (!start) return null;
  const end = Number(c.current_mrr);
  return Math.round((end / start) * 100);
}

function calcGRR(c: CohortEntry): number | null {
  const start = Number(c.starting_mrr);
  if (!start) return null;
  const churned = Number(c.churned_mrr) || 0;
  return Math.round(((start - churned) / start) * 100);
}

function calcLogoRetention(c: CohortEntry): number | null {
  const start = Number(c.starting_customers);
  const current = Number(c.current_customers);
  if (!start) return null;
  return Math.round((current / start) * 100);
}

function nrrVariant(n: number): "default" | "secondary" | "destructive" {
  if (n >= 100) return "default";
  if (n >= 85) return "secondary";
  return "destructive";
}

export function RetentionTracker({
  teamId, userId, isReadOnly, existingArtifact,
}: {
  teamId: string; userId: string; isReadOnly: boolean;
  existingArtifact: { id: string; data: Record<string, unknown> } | null;
}) {
  const [data, setData] = useState<RetentionData>(() => parseData(existingArtifact?.data ?? {}));
  const [artifactId, setArtifactId] = useState(existingArtifact?.id ?? null);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [confirmed, setConfirmed] = useState(!!existingArtifact);
  const [expandedCohort, setExpandedCohort] = useState<number | null>(null);
  const supabase = createClient();

  function addCohort() {
    const period = new Date().toISOString().split("T")[0].slice(0, 7);
    setData((p) => ({
      ...p, cohorts: [...p.cohorts, { cohort_month: period, starting_mrr: "", current_mrr: "", starting_customers: "", current_customers: "", expansion_mrr: "", churned_mrr: "", notes: "" }],
    }));
    setExpandedCohort(data.cohorts.length);
    setSaved(false);
  }
  function updateCohort(idx: number, field: keyof CohortEntry, value: string) {
    setData((p) => ({ ...p, cohorts: p.cohorts.map((c, i) => i === idx ? { ...c, [field]: value } : c) }));
    setSaved(false);
  }
  function removeCohort(idx: number) {
    setData((p) => ({ ...p, cohorts: p.cohorts.filter((_, i) => i !== idx) }));
    setSaved(false);
  }

  function addIndicator() {
    setData((p) => ({ ...p, leading_indicators: [...p.leading_indicators, { name: "", value: "", target: "", direction: "up" }] }));
    setSaved(false);
  }
  function updateIndicator(idx: number, field: keyof LeadingIndicator, value: string) {
    setData((p) => ({ ...p, leading_indicators: p.leading_indicators.map((li, i) => i === idx ? { ...li, [field]: value } : li) }));
    setSaved(false);
  }
  function removeIndicator(idx: number) {
    setData((p) => ({ ...p, leading_indicators: p.leading_indicators.filter((_, i) => i !== idx) }));
    setSaved(false);
  }

  async function handleSave() {
    setSaving(true);
    if (artifactId) {
      await supabase.from("artifacts").update({ data: data as unknown as Record<string, unknown>, updated_at: new Date().toISOString() }).eq("id", artifactId);
    } else {
      const { data: a } = await supabase.from("artifacts").insert({ team_id: teamId, artifact_type: "retention_tracker", title: "Revenue Retention Tracker", data: data as unknown as Record<string, unknown>, created_by: userId }).select("id").single();
      if (a) setArtifactId(a.id);
    }
    setSaving(false);
    setSaved(true);
    setConfirmed(true);
    setTimeout(() => setSaved(false), 2000);
  }

  const latestCohort = data.cohorts.length > 0 ? data.cohorts[data.cohorts.length - 1] : null;

  return (
    <div className="space-y-6">
      <Card className="border-primary/20 bg-primary/5">
        <CardContent className="pt-4 pb-4">
          <p className="text-sm font-medium mb-1">Why retention matters more than acquisition at scale</p>
          <p className="text-sm text-muted-foreground">
            Revenue retention is the most important metric in a scaling SaaS business. Net Revenue Retention above 100% means your existing customers expand faster than they churn — you grow without needing a single new customer. Gross Revenue Retention shows your floor: how much revenue you keep before expansion. Track both by cohort to understand the true health of your revenue base.
          </p>
        </CardContent>
      </Card>

      {!confirmed && (
        <div className="flex items-start gap-3 rounded-lg border border-amber-300 bg-amber-50 dark:bg-amber-950/30 p-4">
          <AlertCircle className="size-4 mt-0.5 text-amber-600 shrink-0" />
          <p className="text-sm text-amber-800 dark:text-amber-300">
            <span className="font-medium text-amber-900 dark:text-amber-200">Add your retention data. </span>
            Start with your most recent cohort and work backwards. Actuals only — no projections here.
          </p>
        </div>
      )}

      {/* Latest snapshot */}
      {latestCohort && (
        <div className="grid gap-3 sm:grid-cols-3">
          {[
            { label: "NRR", value: calcNRR(latestCohort), unit: "%", benchmarks: "Target: ≥100%" },
            { label: "GRR", value: calcGRR(latestCohort), unit: "%", benchmarks: "Target: ≥85%" },
            { label: "Logo Retention", value: calcLogoRetention(latestCohort), unit: "%", benchmarks: "Target: ≥90%" },
          ].map(({ label, value, unit, benchmarks }) => (
            <div key={label} className="rounded-lg border bg-muted/20 p-3 space-y-1">
              <p className="text-xs text-muted-foreground">{label}</p>
              {value !== null ? (
                <>
                  <p className="text-2xl font-bold">{value}{unit}</p>
                  <Badge variant={nrrVariant(value)} className="text-xs">{value >= 100 ? "Healthy" : value >= 85 ? "Marginal" : "Needs Work"}</Badge>
                </>
              ) : <p className="text-sm text-muted-foreground">—</p>}
              <p className="text-xs text-muted-foreground">{benchmarks}</p>
            </div>
          ))}
        </div>
      )}

      {/* Cohorts */}
      <Card>
        <CardHeader className="pb-2">
          <div className="flex items-center justify-between">
            <CardTitle className="text-base">Cohort Tracking</CardTitle>
            {!isReadOnly && (
              <Button size="sm" variant="outline" onClick={addCohort}>
                <PlusCircle className="size-4" />Add Cohort
              </Button>
            )}
          </div>
        </CardHeader>
        <CardContent className="space-y-2">
          {data.cohorts.length === 0 && <p className="text-sm text-muted-foreground">No cohorts logged yet.</p>}
          {data.cohorts.map((c, idx) => {
            const nrr = calcNRR(c);
            const grr = calcGRR(c);
            const logoRet = calcLogoRetention(c);
            const isExpanded = expandedCohort === idx;
            return (
              <div key={idx} className="rounded-lg border overflow-hidden">
                <button
                  className="w-full flex items-center justify-between px-4 py-3 text-left hover:bg-muted/50 transition-colors"
                  onClick={() => setExpandedCohort(isExpanded ? null : idx)}
                >
                  <span className="text-sm font-medium">{c.cohort_month || `Cohort ${idx + 1}`}</span>
                  <div className="flex items-center gap-2">
                    {nrr !== null && <Badge variant={nrrVariant(nrr)} className="text-xs">NRR {nrr}%</Badge>}
                    {grr !== null && <Badge variant={nrrVariant(grr)} className="text-xs">GRR {grr}%</Badge>}
                    {logoRet !== null && <Badge variant="secondary" className="text-xs">Logos {logoRet}%</Badge>}
                    {!isReadOnly && (
                      <Button size="sm" variant="ghost" onClick={(e) => { e.stopPropagation(); removeCohort(idx); }}>
                        <Trash2 className="size-3.5" />
                      </Button>
                    )}
                  </div>
                </button>
                {isExpanded && (
                  <div className="px-4 pb-4 space-y-3 border-t bg-muted/20">
                    <div className="grid gap-3 sm:grid-cols-3 pt-3">
                      <div className="space-y-1">
                        <Label className="text-xs">Cohort month</Label>
                        <Input type="month" value={c.cohort_month} onChange={(e) => updateCohort(idx, "cohort_month", e.target.value)} disabled={isReadOnly} />
                      </div>
                      <div className="space-y-1">
                        <Label className="text-xs">Starting MRR ($)</Label>
                        <Input type="number" min="0" value={c.starting_mrr} onChange={(e) => updateCohort(idx, "starting_mrr", e.target.value)} disabled={isReadOnly} />
                      </div>
                      <div className="space-y-1">
                        <Label className="text-xs">Current MRR ($)</Label>
                        <Input type="number" min="0" value={c.current_mrr} onChange={(e) => updateCohort(idx, "current_mrr", e.target.value)} disabled={isReadOnly} />
                      </div>
                      <div className="space-y-1">
                        <Label className="text-xs">Starting customers</Label>
                        <Input type="number" min="0" value={c.starting_customers} onChange={(e) => updateCohort(idx, "starting_customers", e.target.value)} disabled={isReadOnly} />
                      </div>
                      <div className="space-y-1">
                        <Label className="text-xs">Current customers</Label>
                        <Input type="number" min="0" value={c.current_customers} onChange={(e) => updateCohort(idx, "current_customers", e.target.value)} disabled={isReadOnly} />
                      </div>
                      <div className="space-y-1">
                        <Label className="text-xs">Expansion MRR added ($)</Label>
                        <Input type="number" min="0" value={c.expansion_mrr} onChange={(e) => updateCohort(idx, "expansion_mrr", e.target.value)} disabled={isReadOnly} />
                      </div>
                      <div className="space-y-1">
                        <Label className="text-xs">Churned MRR ($)</Label>
                        <Input type="number" min="0" value={c.churned_mrr} onChange={(e) => updateCohort(idx, "churned_mrr", e.target.value)} disabled={isReadOnly} />
                      </div>
                    </div>
                    <div className="space-y-1">
                      <Label className="text-xs">Notes</Label>
                      <Textarea rows={2} value={c.notes} onChange={(e) => updateCohort(idx, "notes", e.target.value)} disabled={isReadOnly} placeholder="What drove expansion or churn in this cohort?" />
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </CardContent>
      </Card>

      {/* Leading indicators */}
      <Card>
        <CardHeader className="pb-2">
          <div className="flex items-center justify-between">
            <CardTitle className="text-base">Leading Indicators of Churn</CardTitle>
            {!isReadOnly && (
              <Button size="sm" variant="outline" onClick={addIndicator}>
                <PlusCircle className="size-4" />Add Indicator
              </Button>
            )}
          </div>
        </CardHeader>
        <CardContent className="space-y-3">
          <p className="text-xs text-muted-foreground">Track the early warning signals before churn happens (e.g. login frequency, support tickets, NPS drops).</p>
          {data.leading_indicators.length === 0 && <p className="text-sm text-muted-foreground">No indicators added yet.</p>}
          {data.leading_indicators.map((li, idx) => (
            <div key={idx} className="grid gap-3 sm:grid-cols-4 items-end border-b pb-3 last:border-0 last:pb-0">
              <div className="space-y-1">
                <Label className="text-xs">Indicator</Label>
                <Input placeholder="Weekly logins" value={li.name} onChange={(e) => updateIndicator(idx, "name", e.target.value)} disabled={isReadOnly} />
              </div>
              <div className="space-y-1">
                <Label className="text-xs">Current value</Label>
                <Input placeholder="3.2/wk" value={li.value} onChange={(e) => updateIndicator(idx, "value", e.target.value)} disabled={isReadOnly} />
              </div>
              <div className="space-y-1">
                <Label className="text-xs">Target / threshold</Label>
                <Input placeholder="≥5/wk" value={li.target} onChange={(e) => updateIndicator(idx, "target", e.target.value)} disabled={isReadOnly} />
              </div>
              <div className="flex gap-2">
                {!isReadOnly && (
                  <Button size="sm" variant="ghost" onClick={() => removeIndicator(idx)}>
                    <Trash2 className="size-3.5" />
                  </Button>
                )}
              </div>
            </div>
          ))}
        </CardContent>
      </Card>

      {/* Analysis */}
      <div className="space-y-3">
        <div className="space-y-1.5">
          <Label>Churn root-cause analysis</Label>
          <Textarea rows={3} placeholder="What are the top 3 reasons customers churn? What patterns do you see?" value={data.churn_analysis} onChange={(e) => { setData((p) => ({ ...p, churn_analysis: e.target.value })); setSaved(false); }} disabled={isReadOnly} />
        </div>
        <div className="space-y-1.5">
          <Label>Retention initiatives underway</Label>
          <Textarea rows={3} placeholder="What are you doing to improve retention? Include owner and timeline." value={data.retention_initiatives} onChange={(e) => { setData((p) => ({ ...p, retention_initiatives: e.target.value })); setSaved(false); }} disabled={isReadOnly} />
        </div>
      </div>

      <Separator />

      {!isReadOnly && (
        <Button onClick={handleSave} disabled={saving}>
          {saving ? <><Loader2 className="size-4 animate-spin" />Saving...</> : saved ? <><Check className="size-4" />Saved</> : <><Save className="size-4" />Save</>}
        </Button>
      )}
    </div>
  );
}
