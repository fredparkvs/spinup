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

type Priority = "critical" | "high" | "medium";
type HireStatus = "open" | "interviewing" | "offer" | "closed";

interface HireRow {
  role: string;
  department: string;
  priority: Priority;
  status: HireStatus;
  target_start: string;
  salary_range: string;
  notes: string;
}

interface HiringData {
  current_headcount: string;
  target_headcount_12m: string;
  hires: HireRow[];
  org_structure_notes: string;
  evp: string;
  onboarding_checklist: string;
}

function parseData(raw: Record<string, unknown>): HiringData {
  return {
    current_headcount: (raw.current_headcount as string) ?? "",
    target_headcount_12m: (raw.target_headcount_12m as string) ?? "",
    hires: (raw.hires as HireRow[]) ?? [],
    org_structure_notes: (raw.org_structure_notes as string) ?? "",
    evp: (raw.evp as string) ?? "",
    onboarding_checklist: (raw.onboarding_checklist as string) ?? "",
  };
}

const PRIORITY_COLORS: Record<Priority, string> = {
  critical: "destructive",
  high: "secondary",
  medium: "outline",
};

const STATUS_LABELS: Record<HireStatus, string> = {
  open: "Open",
  interviewing: "Interviewing",
  offer: "Offer out",
  closed: "Closed",
};

function headcountGuidance(count: number): { stage: string; description: string } {
  if (count < 10) return { stage: "Founding team", description: "Focus on generalists who can wear multiple hats. Culture is set by example — hire for values first." };
  if (count < 30) return { stage: "Early scale", description: "Start specialising. Hire your first functional leads (Head of Sales, Head of Eng). Document everything you do." };
  if (count < 75) return { stage: "Growth", description: "Managers of managers emerge. Implement structured hiring, onboarding, and performance review processes." };
  if (count < 150) return { stage: "Scaling", description: "HR becomes strategic. Compensation bands, career ladders, and retention programs are essential now." };
  return { stage: "Enterprise", description: "Organisational design, culture preservation and leadership development are top-of-mind." };
}

export function HiringPlanner({
  teamId, userId, isReadOnly, existingArtifact,
}: {
  teamId: string; userId: string; isReadOnly: boolean;
  existingArtifact: { id: string; data: Record<string, unknown> } | null;
}) {
  const [data, setData] = useState<HiringData>(() => parseData(existingArtifact?.data ?? {}));
  const [artifactId, setArtifactId] = useState(existingArtifact?.id ?? null);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [confirmed, setConfirmed] = useState(!!existingArtifact);
  const supabase = createClient();

  function update(field: keyof HiringData, value: string) {
    setData((p) => ({ ...p, [field]: value }));
    setSaved(false);
  }
  function addHire() {
    setData((p) => ({ ...p, hires: [...p.hires, { role: "", department: "", priority: "high", status: "open", target_start: "", salary_range: "", notes: "" }] }));
    setSaved(false);
  }
  function updateHire(idx: number, field: keyof HireRow, value: string) {
    setData((p) => ({ ...p, hires: p.hires.map((h, i) => i === idx ? { ...h, [field]: value } : h) }));
    setSaved(false);
  }
  function removeHire(idx: number) {
    setData((p) => ({ ...p, hires: p.hires.filter((_, i) => i !== idx) }));
    setSaved(false);
  }

  async function handleSave() {
    setSaving(true);
    if (artifactId) {
      await supabase.from("artifacts").update({ data: data as unknown as Record<string, unknown>, updated_at: new Date().toISOString() }).eq("id", artifactId);
    } else {
      const { data: a } = await supabase.from("artifacts").insert({ team_id: teamId, artifact_type: "hiring_planner", title: "Hiring & Org Design Planner", data: data as unknown as Record<string, unknown>, created_by: userId }).select("id").single();
      if (a) setArtifactId(a.id);
    }
    setSaving(false);
    setSaved(true);
    setConfirmed(true);
    setTimeout(() => setSaved(false), 2000);
  }

  const currentCount = Number(data.current_headcount) || 0;
  const guidance = currentCount > 0 ? headcountGuidance(currentCount) : null;
  const criticalHires = data.hires.filter((h) => h.priority === "critical" && h.status === "open");

  return (
    <div className="space-y-6">
      <Card className="border-primary/20 bg-primary/5">
        <CardContent className="pt-4 pb-4">
          <p className="text-sm font-medium mb-1">Why team design determines scale velocity</p>
          <p className="text-sm text-muted-foreground">
            The team that got you to product-market fit is rarely the team that scales you to $10M ARR. Scaling requires deliberate org design: identifying the roles you need before you feel the pain, building a recruiting engine, and creating an EVP that attracts the talent your growth demands. Poor hiring is the #1 cause of execution breakdown at scale.
          </p>
        </CardContent>
      </Card>

      {!confirmed && (
        <div className="flex items-start gap-3 rounded-lg border border-amber-300 bg-amber-50 dark:bg-amber-950/30 p-4">
          <AlertCircle className="size-4 mt-0.5 text-amber-600 shrink-0" />
          <p className="text-sm text-amber-800 dark:text-amber-300">
            <span className="font-medium text-amber-900 dark:text-amber-200">Start here. </span>
            Enter your current headcount and review your hiring plan. Update or fill in from scratch as needed.
          </p>
        </div>
      )}

      {/* Headcount overview */}
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-1.5">
          <Label>Current headcount</Label>
          <Input type="number" min="1" placeholder="e.g. 18" value={data.current_headcount} onChange={(e) => update("current_headcount", e.target.value)} disabled={isReadOnly} />
        </div>
        <div className="space-y-1.5">
          <Label>Target headcount (12 months)</Label>
          <Input type="number" min="1" placeholder="e.g. 35" value={data.target_headcount_12m} onChange={(e) => update("target_headcount_12m", e.target.value)} disabled={isReadOnly} />
        </div>
      </div>

      {guidance && (
        <div className="rounded-lg border bg-muted/30 p-4">
          <p className="text-sm font-medium mb-1">{guidance.stage} <Badge variant="secondary" className="ml-1 text-xs">{currentCount} people</Badge></p>
          <p className="text-sm text-muted-foreground">{guidance.description}</p>
        </div>
      )}

      {criticalHires.length > 0 && (
        <div className="rounded-lg border border-destructive/40 bg-destructive/5 p-4">
          <p className="text-sm font-medium text-destructive mb-1">Critical open roles ({criticalHires.length})</p>
          <ul className="text-sm text-muted-foreground space-y-0.5">
            {criticalHires.map((h, i) => <li key={i}>• {h.role} {h.department && `— ${h.department}`}</li>)}
          </ul>
        </div>
      )}

      {/* Hire list */}
      <Card>
        <CardHeader className="pb-2">
          <div className="flex items-center justify-between">
            <CardTitle className="text-base">Hiring Pipeline</CardTitle>
            {!isReadOnly && (
              <Button size="sm" variant="outline" onClick={addHire}>
                <PlusCircle className="size-4" />Add Role
              </Button>
            )}
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {data.hires.length === 0 && <p className="text-sm text-muted-foreground">No roles added yet.</p>}
          {data.hires.map((h, idx) => (
            <div key={idx} className="rounded-lg border p-4 space-y-3">
              <div className="flex items-start justify-between gap-2">
                <div className="grid gap-3 sm:grid-cols-2 flex-1">
                  <div className="space-y-1">
                    <Label className="text-xs">Role title</Label>
                    <Input placeholder="VP of Sales" value={h.role} onChange={(e) => updateHire(idx, "role", e.target.value)} disabled={isReadOnly} />
                  </div>
                  <div className="space-y-1">
                    <Label className="text-xs">Department</Label>
                    <Input placeholder="Sales" value={h.department} onChange={(e) => updateHire(idx, "department", e.target.value)} disabled={isReadOnly} />
                  </div>
                  <div className="space-y-1">
                    <Label className="text-xs">Priority</Label>
                    <select
                      className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                      value={h.priority}
                      onChange={(e) => updateHire(idx, "priority", e.target.value)}
                      disabled={isReadOnly}
                    >
                      <option value="critical">Critical</option>
                      <option value="high">High</option>
                      <option value="medium">Medium</option>
                    </select>
                  </div>
                  <div className="space-y-1">
                    <Label className="text-xs">Status</Label>
                    <select
                      className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                      value={h.status}
                      onChange={(e) => updateHire(idx, "status", e.target.value)}
                      disabled={isReadOnly}
                    >
                      {Object.entries(STATUS_LABELS).map(([v, l]) => <option key={v} value={v}>{l}</option>)}
                    </select>
                  </div>
                  <div className="space-y-1">
                    <Label className="text-xs">Target start (month)</Label>
                    <Input type="month" value={h.target_start} onChange={(e) => updateHire(idx, "target_start", e.target.value)} disabled={isReadOnly} />
                  </div>
                  <div className="space-y-1">
                    <Label className="text-xs">Salary range</Label>
                    <Input placeholder="$120k–$150k" value={h.salary_range} onChange={(e) => updateHire(idx, "salary_range", e.target.value)} disabled={isReadOnly} />
                  </div>
                </div>
                {!isReadOnly && (
                  <Button size="sm" variant="ghost" onClick={() => removeHire(idx)} className="shrink-0 mt-5">
                    <Trash2 className="size-3.5" />
                  </Button>
                )}
              </div>
              <div className="space-y-1">
                <Label className="text-xs">Notes / scorecard highlights</Label>
                <Textarea rows={2} value={h.notes} onChange={(e) => updateHire(idx, "notes", e.target.value)} disabled={isReadOnly} placeholder="Must-haves, sourcing strategy, key attributes..." />
              </div>
              <Badge variant={PRIORITY_COLORS[h.priority] as "default" | "secondary" | "destructive" | "outline"} className="text-xs">
                {h.priority.charAt(0).toUpperCase() + h.priority.slice(1)} priority · {STATUS_LABELS[h.status]}
              </Badge>
            </div>
          ))}
        </CardContent>
      </Card>

      <Separator />

      <div className="space-y-3">
        <div className="space-y-1.5">
          <Label>Org structure & reporting lines</Label>
          <Textarea rows={3} placeholder="Describe your current org structure. Who reports to whom? What functional teams exist?" value={data.org_structure_notes} onChange={(e) => update("org_structure_notes", e.target.value)} disabled={isReadOnly} />
        </div>
        <div className="space-y-1.5">
          <Label>Employee value proposition (EVP)</Label>
          <Textarea rows={3} placeholder="Why should exceptional people join your company? Mission, growth opportunity, comp philosophy, culture." value={data.evp} onChange={(e) => update("evp", e.target.value)} disabled={isReadOnly} />
        </div>
        <div className="space-y-1.5">
          <Label>Onboarding checklist (standard for all new hires)</Label>
          <Textarea rows={4} placeholder="Day 1: ...&#10;Week 1: ...&#10;Month 1: ...&#10;30/60/90 day goals template..." value={data.onboarding_checklist} onChange={(e) => update("onboarding_checklist", e.target.value)} disabled={isReadOnly} />
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
