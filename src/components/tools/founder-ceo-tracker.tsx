"use client";

import { useState } from "react";
import { Save, Loader2, Check, PlusCircle } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";

const SHIFTS = [
  {
    id: "individual_to_leader",
    label: "Individual contributor → Team leader",
    description: "Moving from doing the work yourself to enabling others to do it better than you could.",
    low: "Still doing most of the core work yourself. Bottleneck on execution.",
    high: "Delegate effectively. Team executes without you in the room.",
  },
  {
    id: "expert_to_generalist",
    label: "Domain expert → General executive",
    description: "Shifting from leading with your functional expertise to leading cross-functional teams.",
    low: "Defer heavily to your domain. Struggle with decisions outside your expertise.",
    high: "Comfortable making high-quality decisions across Sales, Product, Finance, and People.",
  },
  {
    id: "builder_to_architect",
    label: "Builder → Systems architect",
    description: "Designing processes, structures and incentives that create leverage — not just building things directly.",
    low: "Company scales with you. Processes are informal or undocumented.",
    high: "You build the systems. The systems build the company.",
  },
  {
    id: "maker_to_fundraiser",
    label: "Maker → Capital allocator",
    description: "Taking responsibility for the balance sheet: fundraising, financial discipline, and capital deployment.",
    low: "Financial management is reactive. Board reporting is informal.",
    high: "Proactive financial governance. You manage burn, allocate capital strategically, and run a board.",
  },
  {
    id: "insider_to_spokesperson",
    label: "Internal operator → External spokesperson",
    description: "Becoming the face of the company to customers, investors, press, and talent.",
    low: "Uncomfortable with external visibility. Avoid investor/media interactions.",
    high: "Confident evangelist. Recruit top talent, close enterprise deals, and manage investors effectively.",
  },
] as const;

type ShiftId = (typeof SHIFTS)[number]["id"];
type ScoreMap = Record<ShiftId, number>;

interface Assessment {
  period: string;
  scores: Partial<ScoreMap>;
  reflections: Record<string, string>;
  focus_area: string;
}

interface FounderCeoData {
  assessments: Assessment[];
}

function parseData(raw: Record<string, unknown>): FounderCeoData {
  return { assessments: (raw.assessments as Assessment[]) ?? [] };
}

function avg(scores: Partial<ScoreMap>): number {
  const vals = Object.values(scores).filter((v): v is number => typeof v === "number" && v > 0);
  if (!vals.length) return 0;
  return Math.round((vals.reduce((s, v) => s + v, 0) / vals.length) * 10) / 10;
}

export function FounderCeoTracker({
  teamId, userId, isReadOnly, existingArtifact,
}: {
  teamId: string; userId: string; isReadOnly: boolean;
  existingArtifact: { id: string; data: Record<string, unknown> } | null;
}) {
  const [data, setData] = useState<FounderCeoData>(() => parseData(existingArtifact?.data ?? {}));
  const [artifactId, setArtifactId] = useState(existingArtifact?.id ?? null);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [editingIdx, setEditingIdx] = useState<number | null>(null);
  const supabase = createClient();

  function addAssessment() {
    const period = new Date().toISOString().split("T")[0].slice(0, 7);
    const newAssessment: Assessment = { period, scores: {}, reflections: {}, focus_area: "" };
    const idx = data.assessments.length;
    setData((p) => ({ assessments: [...p.assessments, newAssessment] }));
    setEditingIdx(idx);
  }

  function updateScore(idx: number, shiftId: ShiftId, value: number) {
    setData((p) => ({
      assessments: p.assessments.map((a, i) =>
        i === idx ? { ...a, scores: { ...a.scores, [shiftId]: value } } : a
      ),
    }));
    setSaved(false);
  }

  function updateReflection(idx: number, shiftId: string, value: string) {
    setData((p) => ({
      assessments: p.assessments.map((a, i) =>
        i === idx ? { ...a, reflections: { ...a.reflections, [shiftId]: value } } : a
      ),
    }));
    setSaved(false);
  }

  function updateFocus(idx: number, value: string) {
    setData((p) => ({ assessments: p.assessments.map((a, i) => i === idx ? { ...a, focus_area: value } : a) }));
    setSaved(false);
  }

  async function handleSave() {
    setSaving(true);
    if (artifactId) {
      await supabase.from("artifacts").update({ data: data as unknown as Record<string, unknown>, updated_at: new Date().toISOString() }).eq("id", artifactId);
    } else {
      const { data: a } = await supabase.from("artifacts").insert({ team_id: teamId, artifact_type: "founder_ceo_tracker", title: "Founder-to-CEO Tracker", data: data as unknown as Record<string, unknown>, created_by: userId }).select("id").single();
      if (a) setArtifactId(a.id);
    }
    setSaving(false);
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  }

  const latest = data.assessments.length > 0 ? data.assessments[data.assessments.length - 1] : null;

  return (
    <div className="space-y-6">
      <Card className="border-primary/20 bg-primary/5">
        <CardContent className="pt-4 pb-4">
          <p className="text-sm font-medium mb-1">Why the founder-to-CEO transition is the hardest shift in startups</p>
          <p className="text-sm text-muted-foreground">
            Most founders fail not because their product fails, but because they fail to grow into the CEO role fast enough. The skills that make a great founder — hands-on execution, deep domain expertise, scrappy resourcefulness — can actively undermine a scaling company if not complemented by leadership, delegation, and systems thinking. This tracker helps you and your mentor track your evolution across five critical identity shifts.
          </p>
        </CardContent>
      </Card>

      {/* Latest snapshot */}
      {latest && avg(latest.scores) > 0 && (
        <div className="flex items-center gap-4 rounded-lg border p-4">
          <div className="text-center min-w-[70px]">
            <p className="text-3xl font-bold">{avg(latest.scores)}</p>
            <p className="text-xs text-muted-foreground">/ 5 avg</p>
          </div>
          <div>
            <Badge variant={avg(latest.scores) >= 4 ? "default" : avg(latest.scores) >= 3 ? "secondary" : "destructive"}>
              {avg(latest.scores) >= 4 ? "Strong CEO mindset" : avg(latest.scores) >= 3 ? "Developing" : "Needs focus"}
            </Badge>
            <p className="text-xs text-muted-foreground mt-1">Latest: {latest.period}</p>
          </div>
          {latest.focus_area && (
            <p className="text-sm text-muted-foreground flex-1">Focus: <span className="text-foreground">{latest.focus_area}</span></p>
          )}
        </div>
      )}

      {/* History */}
      {data.assessments.length > 1 && (
        <div>
          <p className="text-sm font-medium mb-2">Assessment history</p>
          <div className="space-y-1">
            {data.assessments.slice().reverse().map((a, i) => {
              const realIdx = data.assessments.length - 1 - i;
              const score = avg(a.scores);
              return (
                <div key={realIdx} className="flex items-center justify-between border-b py-2 last:border-0">
                  <button className="text-sm text-primary hover:underline" onClick={() => setEditingIdx(realIdx)}>
                    {a.period}
                  </button>
                  <div className="flex items-center gap-2">
                    {score > 0 && <Badge variant="secondary" className="text-xs">{score}/5</Badge>}
                    {a.focus_area && <span className="text-xs text-muted-foreground truncate max-w-[200px]">{a.focus_area}</span>}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Assessment form */}
      {editingIdx !== null && data.assessments[editingIdx] && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Assessment — {data.assessments[editingIdx].period}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            {SHIFTS.map((shift) => {
              const score = data.assessments[editingIdx].scores[shift.id] ?? 0;
              return (
                <div key={shift.id} className="space-y-3">
                  <div>
                    <p className="text-sm font-medium">{shift.label}</p>
                    <p className="text-xs text-muted-foreground">{shift.description}</p>
                  </div>
                  <div className="flex items-center gap-2 flex-wrap">
                    {[1, 2, 3, 4, 5].map((v) => (
                      <button
                        key={v}
                        disabled={isReadOnly}
                        onClick={() => updateScore(editingIdx, shift.id, v)}
                        className={`w-9 h-9 rounded-md border text-sm font-medium transition-colors ${score === v ? "bg-primary text-primary-foreground border-primary" : "bg-background hover:bg-accent border-input"} disabled:opacity-50 disabled:cursor-not-allowed`}
                      >
                        {v}
                      </button>
                    ))}
                    {score > 0 && (
                      <span className="text-xs text-muted-foreground">
                        {score <= 2 ? shift.low : shift.high}
                      </span>
                    )}
                  </div>
                  {score > 0 && (
                    <Textarea
                      rows={2}
                      placeholder="What evidence supports this score? What will you do differently?"
                      value={data.assessments[editingIdx].reflections[shift.id] ?? ""}
                      onChange={(e) => updateReflection(editingIdx, shift.id, e.target.value)}
                      disabled={isReadOnly}
                    />
                  )}
                  <Separator />
                </div>
              );
            })}
            <div className="space-y-1.5">
              <Label>Your #1 growth focus this quarter</Label>
              <Textarea
                rows={2}
                placeholder="Which of these shifts will you prioritise? What specific actions will you take?"
                value={data.assessments[editingIdx].focus_area}
                onChange={(e) => updateFocus(editingIdx, e.target.value)}
                disabled={isReadOnly}
              />
            </div>
          </CardContent>
        </Card>
      )}

      <p className="text-xs text-muted-foreground">1 = Founder mindset dominant · 5 = Strong CEO mindset. Assess quarterly with your mentor.</p>

      <div className="flex flex-wrap gap-2">
        {!isReadOnly && (
          <Button variant="outline" onClick={addAssessment}>
            <PlusCircle className="size-4" />New Assessment
          </Button>
        )}
        {!isReadOnly && (
          <Button onClick={handleSave} disabled={saving || data.assessments.length === 0}>
            {saving ? <><Loader2 className="size-4 animate-spin" />Saving...</> : saved ? <><Check className="size-4" />Saved</> : <><Save className="size-4" />Save</>}
          </Button>
        )}
      </div>
    </div>
  );
}
