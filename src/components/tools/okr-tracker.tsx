"use client";

import { useState } from "react";
import { Save, Loader2, Check, PlusCircle, Trash2, ChevronDown, ChevronRight } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";

type KrStatus = "on_track" | "at_risk" | "off_track" | "complete";

interface KeyResult {
  id: string;
  description: string;
  metric: string;
  target: string;
  current: string;
  status: KrStatus;
  weekly_update: string;
}

interface Objective {
  id: string;
  title: string;
  owner: string;
  key_results: KeyResult[];
}

interface Quarter {
  label: string;
  objectives: Objective[];
  company_context: string;
}

interface OkrData {
  quarters: Quarter[];
}

function parseData(raw: Record<string, unknown>): OkrData {
  return { quarters: (raw.quarters as Quarter[]) ?? [] };
}

const STATUS_CONFIG: Record<KrStatus, { label: string; variant: "default" | "secondary" | "destructive" | "outline" }> = {
  on_track: { label: "On track", variant: "default" },
  at_risk: { label: "At risk", variant: "secondary" },
  off_track: { label: "Off track", variant: "destructive" },
  complete: { label: "Complete", variant: "outline" },
};

function uid(): string {
  return Math.random().toString(36).slice(2, 9);
}

function progress(q: Quarter): number {
  const krs = q.objectives.flatMap((o) => o.key_results);
  if (!krs.length) return 0;
  const complete = krs.filter((kr) => kr.status === "complete").length;
  const onTrack = krs.filter((kr) => kr.status === "on_track").length;
  return Math.round(((complete + onTrack * 0.5) / krs.length) * 100);
}

export function OkrTracker({
  teamId, userId, isReadOnly, existingArtifact,
}: {
  teamId: string; userId: string; isReadOnly: boolean;
  existingArtifact: { id: string; data: Record<string, unknown> } | null;
}) {
  const [data, setData] = useState<OkrData>(() => parseData(existingArtifact?.data ?? {}));
  const [artifactId, setArtifactId] = useState(existingArtifact?.id ?? null);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [activeQuarter, setActiveQuarter] = useState<number>(0);
  const [expandedObjectives, setExpandedObjectives] = useState<Record<string, boolean>>({});
  const supabase = createClient();

  const currentQ = data.quarters[activeQuarter] ?? null;

  function addQuarter() {
    const now = new Date();
    const q = `Q${Math.ceil((now.getMonth() + 1) / 3)} ${now.getFullYear()}`;
    setData((p) => ({ quarters: [...p.quarters, { label: q, objectives: [], company_context: "" }] }));
    setActiveQuarter(data.quarters.length);
    setSaved(false);
  }

  function updateContext(value: string) {
    setData((p) => ({ quarters: p.quarters.map((q, i) => i === activeQuarter ? { ...q, company_context: value } : q) }));
    setSaved(false);
  }

  function addObjective() {
    const obj: Objective = { id: uid(), title: "", owner: "", key_results: [] };
    setData((p) => ({ quarters: p.quarters.map((q, i) => i === activeQuarter ? { ...q, objectives: [...q.objectives, obj] } : q) }));
    setExpandedObjectives((e) => ({ ...e, [obj.id]: true }));
    setSaved(false);
  }

  function updateObjective(objId: string, field: "title" | "owner", value: string) {
    setData((p) => ({
      quarters: p.quarters.map((q, i) =>
        i === activeQuarter ? { ...q, objectives: q.objectives.map((o) => o.id === objId ? { ...o, [field]: value } : o) } : q
      ),
    }));
    setSaved(false);
  }

  function removeObjective(objId: string) {
    setData((p) => ({
      quarters: p.quarters.map((q, i) =>
        i === activeQuarter ? { ...q, objectives: q.objectives.filter((o) => o.id !== objId) } : q
      ),
    }));
    setSaved(false);
  }

  function addKr(objId: string) {
    const kr: KeyResult = { id: uid(), description: "", metric: "", target: "", current: "", status: "on_track", weekly_update: "" };
    setData((p) => ({
      quarters: p.quarters.map((q, i) =>
        i === activeQuarter ? { ...q, objectives: q.objectives.map((o) => o.id === objId ? { ...o, key_results: [...o.key_results, kr] } : o) } : q
      ),
    }));
    setSaved(false);
  }

  function updateKr(objId: string, krId: string, field: keyof KeyResult, value: string) {
    setData((p) => ({
      quarters: p.quarters.map((q, i) =>
        i === activeQuarter ? {
          ...q,
          objectives: q.objectives.map((o) =>
            o.id === objId ? { ...o, key_results: o.key_results.map((kr) => kr.id === krId ? { ...kr, [field]: value } : kr) } : o
          ),
        } : q
      ),
    }));
    setSaved(false);
  }

  function removeKr(objId: string, krId: string) {
    setData((p) => ({
      quarters: p.quarters.map((q, i) =>
        i === activeQuarter ? { ...q, objectives: q.objectives.map((o) => o.id === objId ? { ...o, key_results: o.key_results.filter((kr) => kr.id !== krId) } : o) } : q
      ),
    }));
    setSaved(false);
  }

  async function handleSave() {
    setSaving(true);
    if (artifactId) {
      await supabase.from("artifacts").update({ data: data as unknown as Record<string, unknown>, updated_at: new Date().toISOString() }).eq("id", artifactId);
    } else {
      const { data: a } = await supabase.from("artifacts").insert({ team_id: teamId, artifact_type: "okr_tracker", title: "OKR Planning & Tracking", data: data as unknown as Record<string, unknown>, created_by: userId }).select("id").single();
      if (a) setArtifactId(a.id);
    }
    setSaving(false);
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  }

  return (
    <div className="space-y-6">
      <Card className="border-primary/20 bg-primary/5">
        <CardContent className="pt-4 pb-4">
          <p className="text-sm font-medium mb-1">Why OKRs are the operating system of scaling companies</p>
          <p className="text-sm text-muted-foreground">
            OKRs (Objectives and Key Results) replace heroic individual effort with aligned, measurable team execution. At scale, misalignment kills momentum — different teams optimise for different things and the whole is less than the sum of its parts. Company-wide OKRs set a shared direction, make progress visible, and create accountability without micromanagement.
          </p>
        </CardContent>
      </Card>

      {/* Quarter selector */}
      <div className="flex flex-wrap items-center gap-2">
        {data.quarters.map((q, i) => (
          <button
            key={i}
            onClick={() => setActiveQuarter(i)}
            className={`px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${activeQuarter === i ? "bg-primary text-primary-foreground" : "bg-muted hover:bg-muted/80"}`}
          >
            {q.label}
            {progress(q) > 0 && <Badge variant="secondary" className="ml-1.5 text-xs">{progress(q)}%</Badge>}
          </button>
        ))}
        {!isReadOnly && (
          <Button size="sm" variant="outline" onClick={addQuarter}>
            <PlusCircle className="size-4" />Add Quarter
          </Button>
        )}
      </div>

      {data.quarters.length === 0 && (
        <p className="text-sm text-muted-foreground">No quarters yet. Add your first quarter to get started.</p>
      )}

      {currentQ && (
        <>
          {/* Company context */}
          <div className="space-y-1.5">
            <Label>Company context for {currentQ.label} (optional)</Label>
            <Textarea rows={2} placeholder="What are the top 2–3 company priorities this quarter? What does winning look like?" value={currentQ.company_context} onChange={(e) => updateContext(e.target.value)} disabled={isReadOnly} />
          </div>

          {/* Objectives */}
          <div className="space-y-3">
            {currentQ.objectives.map((obj) => {
              const isExpanded = expandedObjectives[obj.id] !== false;
              const krCount = obj.key_results.length;
              const onTrack = obj.key_results.filter((kr) => kr.status === "on_track" || kr.status === "complete").length;
              return (
                <Card key={obj.id}>
                  <CardHeader className="pb-2">
                    <div className="flex items-start gap-2">
                      <button className="mt-0.5 shrink-0" onClick={() => setExpandedObjectives((e) => ({ ...e, [obj.id]: !isExpanded }))}>
                        {isExpanded ? <ChevronDown className="size-4 text-muted-foreground" /> : <ChevronRight className="size-4 text-muted-foreground" />}
                      </button>
                      <div className="flex-1 space-y-2">
                        <Input
                          placeholder="Objective — e.g. Establish repeatable sales motion"
                          value={obj.title}
                          onChange={(e) => updateObjective(obj.id, "title", e.target.value)}
                          disabled={isReadOnly}
                          className="font-medium"
                        />
                        <div className="flex items-center gap-2">
                          <Input
                            placeholder="Owner"
                            value={obj.owner}
                            onChange={(e) => updateObjective(obj.id, "owner", e.target.value)}
                            disabled={isReadOnly}
                            className="max-w-[180px] text-xs"
                          />
                          {krCount > 0 && <Badge variant="secondary" className="text-xs">{onTrack}/{krCount} KRs on track</Badge>}
                        </div>
                      </div>
                      {!isReadOnly && (
                        <Button size="sm" variant="ghost" onClick={() => removeObjective(obj.id)}>
                          <Trash2 className="size-3.5" />
                        </Button>
                      )}
                    </div>
                  </CardHeader>

                  {isExpanded && (
                    <CardContent className="space-y-3 pt-0">
                      <Separator className="mb-3" />
                      {obj.key_results.map((kr) => (
                        <div key={kr.id} className="rounded-lg border p-3 space-y-2">
                          <div className="flex items-start gap-2">
                            <div className="flex-1 space-y-2">
                              <Input
                                placeholder="Key result description"
                                value={kr.description}
                                onChange={(e) => updateKr(obj.id, kr.id, "description", e.target.value)}
                                disabled={isReadOnly}
                              />
                              <div className="grid gap-2 sm:grid-cols-3">
                                <div className="space-y-1">
                                  <Label className="text-xs">Metric</Label>
                                  <Input placeholder="MRR, NPS, Uptime..." value={kr.metric} onChange={(e) => updateKr(obj.id, kr.id, "metric", e.target.value)} disabled={isReadOnly} />
                                </div>
                                <div className="space-y-1">
                                  <Label className="text-xs">Target</Label>
                                  <Input placeholder="e.g. $500k" value={kr.target} onChange={(e) => updateKr(obj.id, kr.id, "target", e.target.value)} disabled={isReadOnly} />
                                </div>
                                <div className="space-y-1">
                                  <Label className="text-xs">Current</Label>
                                  <Input placeholder="e.g. $320k" value={kr.current} onChange={(e) => updateKr(obj.id, kr.id, "current", e.target.value)} disabled={isReadOnly} />
                                </div>
                              </div>
                              <div className="flex items-center gap-2">
                                <select
                                  className="rounded-md border border-input bg-background px-3 py-1.5 text-xs"
                                  value={kr.status}
                                  onChange={(e) => updateKr(obj.id, kr.id, "status", e.target.value)}
                                  disabled={isReadOnly}
                                >
                                  {Object.entries(STATUS_CONFIG).map(([v, cfg]) => (
                                    <option key={v} value={v}>{cfg.label}</option>
                                  ))}
                                </select>
                                <Badge variant={STATUS_CONFIG[kr.status].variant} className="text-xs">
                                  {STATUS_CONFIG[kr.status].label}
                                </Badge>
                              </div>
                              <Textarea
                                rows={1}
                                placeholder="Weekly update / blocker"
                                value={kr.weekly_update}
                                onChange={(e) => updateKr(obj.id, kr.id, "weekly_update", e.target.value)}
                                disabled={isReadOnly}
                              />
                            </div>
                            {!isReadOnly && (
                              <Button size="sm" variant="ghost" onClick={() => removeKr(obj.id, kr.id)}>
                                <Trash2 className="size-3.5" />
                              </Button>
                            )}
                          </div>
                        </div>
                      ))}
                      {!isReadOnly && (
                        <Button size="sm" variant="outline" onClick={() => addKr(obj.id)}>
                          <PlusCircle className="size-3.5" />Add Key Result
                        </Button>
                      )}
                    </CardContent>
                  )}
                </Card>
              );
            })}
          </div>

          {!isReadOnly && (
            <Button variant="outline" onClick={addObjective}>
              <PlusCircle className="size-4" />Add Objective
            </Button>
          )}
        </>
      )}

      {!isReadOnly && (
        <Button onClick={handleSave} disabled={saving || data.quarters.length === 0}>
          {saving ? <><Loader2 className="size-4 animate-spin" />Saving...</> : saved ? <><Check className="size-4" />Saved</> : <><Save className="size-4" />Save OKRs</>}
        </Button>
      )}
    </div>
  );
}
