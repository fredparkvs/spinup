"use client";

import { useState } from "react";
import { Save, Loader2, Check, PlusCircle, Trash2, ChevronDown, ChevronRight, AlertTriangle } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";

type ProcessFrequency = "daily" | "weekly" | "monthly" | "quarterly" | "ad_hoc";

interface ProcessStep {
  id: string;
  description: string;
  owner: string;
}

interface ProcessDoc {
  id: string;
  name: string;
  department: string;
  frequency: ProcessFrequency;
  owner: string;
  steps: ProcessStep[];
  tools: string;
  success_criteria: string;
  last_reviewed: string;
}

interface ProcessDocsData {
  processes: ProcessDoc[];
}

function parseData(raw: Record<string, unknown>): ProcessDocsData {
  return { processes: (raw.processes as ProcessDoc[]) ?? [] };
}

const FREQ_LABELS: Record<ProcessFrequency, string> = {
  daily: "Daily",
  weekly: "Weekly",
  monthly: "Monthly",
  quarterly: "Quarterly",
  ad_hoc: "Ad hoc",
};

function isStale(lastReviewed: string): boolean {
  if (!lastReviewed) return false;
  const d = new Date(lastReviewed);
  const daysSince = (Date.now() - d.getTime()) / (1000 * 60 * 60 * 24);
  return daysSince > 90;
}

function uid(): string {
  return Math.random().toString(36).slice(2, 9);
}

export function ProcessDocs({
  teamId, userId, isReadOnly, existingArtifact,
}: {
  teamId: string; userId: string; isReadOnly: boolean;
  existingArtifact: { id: string; data: Record<string, unknown> } | null;
}) {
  const [data, setData] = useState<ProcessDocsData>(() => parseData(existingArtifact?.data ?? {}));
  const [artifactId, setArtifactId] = useState(existingArtifact?.id ?? null);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [expanded, setExpanded] = useState<Record<string, boolean>>({});
  const supabase = createClient();

  function addProcess() {
    const p: ProcessDoc = { id: uid(), name: "", department: "", frequency: "weekly", owner: "", steps: [], tools: "", success_criteria: "", last_reviewed: new Date().toISOString().split("T")[0] };
    setData((prev) => ({ processes: [...prev.processes, p] }));
    setExpanded((e) => ({ ...e, [p.id]: true }));
    setSaved(false);
  }

  function updateProcess(id: string, field: keyof ProcessDoc, value: string) {
    setData((prev) => ({ processes: prev.processes.map((p) => p.id === id ? { ...p, [field]: value } : p) }));
    setSaved(false);
  }

  function removeProcess(id: string) {
    setData((prev) => ({ processes: prev.processes.filter((p) => p.id !== id) }));
    setSaved(false);
  }

  function addStep(processId: string) {
    const step: ProcessStep = { id: uid(), description: "", owner: "" };
    setData((prev) => ({ processes: prev.processes.map((p) => p.id === processId ? { ...p, steps: [...p.steps, step] } : p) }));
    setSaved(false);
  }

  function updateStep(processId: string, stepId: string, field: keyof ProcessStep, value: string) {
    setData((prev) => ({
      processes: prev.processes.map((p) =>
        p.id === processId ? { ...p, steps: p.steps.map((s) => s.id === stepId ? { ...s, [field]: value } : s) } : p
      ),
    }));
    setSaved(false);
  }

  function removeStep(processId: string, stepId: string) {
    setData((prev) => ({ processes: prev.processes.map((p) => p.id === processId ? { ...p, steps: p.steps.filter((s) => s.id !== stepId) } : p) }));
    setSaved(false);
  }

  function markReviewed(id: string) {
    updateProcess(id, "last_reviewed", new Date().toISOString().split("T")[0]);
  }

  async function handleSave() {
    setSaving(true);
    if (artifactId) {
      await supabase.from("artifacts").update({ data: data as unknown as Record<string, unknown>, updated_at: new Date().toISOString() }).eq("id", artifactId);
    } else {
      const { data: a } = await supabase.from("artifacts").insert({ team_id: teamId, artifact_type: "process_docs", title: "Process Documentation", data: data as unknown as Record<string, unknown>, created_by: userId }).select("id").single();
      if (a) setArtifactId(a.id);
    }
    setSaving(false);
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  }

  const staleCount = data.processes.filter((p) => isStale(p.last_reviewed)).length;

  return (
    <div className="space-y-6">
      <Card className="border-primary/20 bg-primary/5">
        <CardContent className="pt-4 pb-4">
          <p className="text-sm font-medium mb-1">Why process documentation is the difference between a team and a machine</p>
          <p className="text-sm text-muted-foreground">
            Undocumented processes create single points of failure. When critical knowledge lives only in people&apos;s heads, every departure is a crisis and every new hire takes months to become effective. Documentation is not bureaucracy — it is how fast-growing companies scale quality and speed simultaneously without being held back by the knowledge bottleneck.
          </p>
        </CardContent>
      </Card>

      {staleCount > 0 && (
        <div className="flex items-center gap-3 rounded-lg border border-amber-300 bg-amber-50 dark:bg-amber-950/30 p-4">
          <AlertTriangle className="size-4 text-amber-600 shrink-0" />
          <p className="text-sm text-amber-800 dark:text-amber-300">
            <span className="font-medium text-amber-900 dark:text-amber-200">{staleCount} process{staleCount > 1 ? "es" : ""}</span> not reviewed in 90+ days. Review and update them.
          </p>
        </div>
      )}

      <div className="space-y-3">
        {data.processes.length === 0 && (
          <p className="text-sm text-muted-foreground">No processes documented yet. Start with your most critical, repeated workflows.</p>
        )}
        {data.processes.map((p) => {
          const isExpanded = expanded[p.id] !== false;
          const stale = isStale(p.last_reviewed);
          return (
            <Card key={p.id} className={stale ? "border-amber-300" : undefined}>
              <CardHeader className="pb-2">
                <div className="flex items-start gap-2">
                  <button className="mt-0.5 shrink-0" onClick={() => setExpanded((e) => ({ ...e, [p.id]: !isExpanded }))}>
                    {isExpanded ? <ChevronDown className="size-4 text-muted-foreground" /> : <ChevronRight className="size-4 text-muted-foreground" />}
                  </button>
                  <div className="flex-1">
                    <div className="flex items-center flex-wrap gap-2">
                      <p className="text-sm font-medium">{p.name || "Unnamed process"}</p>
                      {p.department && <Badge variant="outline" className="text-xs">{p.department}</Badge>}
                      <Badge variant="secondary" className="text-xs">{FREQ_LABELS[p.frequency]}</Badge>
                      {stale && <Badge variant="secondary" className="text-xs text-amber-700">Stale — review needed</Badge>}
                    </div>
                    {p.owner && <p className="text-xs text-muted-foreground mt-0.5">Owner: {p.owner}</p>}
                  </div>
                  <div className="flex items-center gap-1">
                    {stale && !isReadOnly && (
                      <Button size="sm" variant="outline" className="text-xs" onClick={() => markReviewed(p.id)}>
                        Mark reviewed
                      </Button>
                    )}
                    {!isReadOnly && (
                      <Button size="sm" variant="ghost" onClick={() => removeProcess(p.id)}>
                        <Trash2 className="size-3.5" />
                      </Button>
                    )}
                  </div>
                </div>
              </CardHeader>

              {isExpanded && (
                <CardContent className="space-y-4 pt-0">
                  <Separator className="mb-3" />
                  <div className="grid gap-4 sm:grid-cols-2">
                    <div className="space-y-1.5">
                      <Label className="text-xs">Process name</Label>
                      <Input placeholder="e.g. Monthly customer health review" value={p.name} onChange={(e) => updateProcess(p.id, "name", e.target.value)} disabled={isReadOnly} />
                    </div>
                    <div className="space-y-1.5">
                      <Label className="text-xs">Department</Label>
                      <Input placeholder="e.g. Customer Success" value={p.department} onChange={(e) => updateProcess(p.id, "department", e.target.value)} disabled={isReadOnly} />
                    </div>
                    <div className="space-y-1.5">
                      <Label className="text-xs">Owner</Label>
                      <Input placeholder="e.g. Head of CS" value={p.owner} onChange={(e) => updateProcess(p.id, "owner", e.target.value)} disabled={isReadOnly} />
                    </div>
                    <div className="space-y-1.5">
                      <Label className="text-xs">Frequency</Label>
                      <select
                        className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                        value={p.frequency}
                        onChange={(e) => updateProcess(p.id, "frequency", e.target.value)}
                        disabled={isReadOnly}
                      >
                        {Object.entries(FREQ_LABELS).map(([v, l]) => <option key={v} value={v}>{l}</option>)}
                      </select>
                    </div>
                    <div className="space-y-1.5">
                      <Label className="text-xs">Tools used</Label>
                      <Input placeholder="e.g. Salesforce, Slack, Notion" value={p.tools} onChange={(e) => updateProcess(p.id, "tools", e.target.value)} disabled={isReadOnly} />
                    </div>
                    <div className="space-y-1.5">
                      <Label className="text-xs">Last reviewed</Label>
                      <Input type="date" value={p.last_reviewed} onChange={(e) => updateProcess(p.id, "last_reviewed", e.target.value)} disabled={isReadOnly} />
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <Label className="text-xs">Success criteria</Label>
                    <Textarea rows={2} placeholder="How do you know this process ran well?" value={p.success_criteria} onChange={(e) => updateProcess(p.id, "success_criteria", e.target.value)} disabled={isReadOnly} />
                  </div>

                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <Label className="text-xs">Steps</Label>
                      {!isReadOnly && (
                        <Button size="sm" variant="outline" onClick={() => addStep(p.id)}>
                          <PlusCircle className="size-3.5" />Add Step
                        </Button>
                      )}
                    </div>
                    <div className="space-y-2">
                      {p.steps.map((step, stepIdx) => (
                        <div key={step.id} className="flex items-center gap-2">
                          <span className="text-xs text-muted-foreground w-5 shrink-0">{stepIdx + 1}.</span>
                          <Input
                            placeholder="Step description"
                            value={step.description}
                            onChange={(e) => updateStep(p.id, step.id, "description", e.target.value)}
                            disabled={isReadOnly}
                          />
                          <Input
                            placeholder="Owner"
                            value={step.owner}
                            onChange={(e) => updateStep(p.id, step.id, "owner", e.target.value)}
                            disabled={isReadOnly}
                            className="max-w-[140px]"
                          />
                          {!isReadOnly && (
                            <Button size="sm" variant="ghost" onClick={() => removeStep(p.id, step.id)}>
                              <Trash2 className="size-3.5" />
                            </Button>
                          )}
                        </div>
                      ))}
                      {p.steps.length === 0 && <p className="text-xs text-muted-foreground">No steps yet.</p>}
                    </div>
                  </div>
                </CardContent>
              )}
            </Card>
          );
        })}
      </div>

      {!isReadOnly && (
        <Button variant="outline" onClick={addProcess}>
          <PlusCircle className="size-4" />Add Process
        </Button>
      )}

      {!isReadOnly && (
        <Button onClick={handleSave} disabled={saving}>
          {saving ? <><Loader2 className="size-4 animate-spin" />Saving...</> : saved ? <><Check className="size-4" />Saved</> : <><Save className="size-4" />Save</>}
        </Button>
      )}
    </div>
  );
}
