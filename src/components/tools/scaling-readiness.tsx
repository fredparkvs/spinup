"use client";

import { useState } from "react";
import { Save, Loader2, Check, AlertCircle } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";

const PILLARS = [
  {
    id: "market",
    label: "Market",
    questions: [
      { id: "tam_validated", label: "You have validated a TAM that justifies venture-scale returns" },
      { id: "category_leader", label: "You are establishing clear category leadership in your beachhead segment" },
      { id: "expansion_path", label: "You have a credible adjacent market expansion path" },
    ],
  },
  {
    id: "product",
    label: "Product",
    questions: [
      { id: "pmf_confirmed", label: "Product-market fit is confirmed (Sean Ellis ≥40%, strong retention)" },
      { id: "scalable_infra", label: "Your architecture can handle 10x current load without a rewrite" },
      { id: "core_differentiation", label: "Core differentiation is defensible (IP, network, data moat)" },
    ],
  },
  {
    id: "commercial",
    label: "Commercial Engine",
    questions: [
      { id: "repeatable_sales", label: "You have a repeatable, documented sales motion" },
      { id: "ltv_cac", label: "LTV:CAC ratio is ≥3x with payback under 18 months" },
      { id: "nrr_positive", label: "Net Revenue Retention is above 100% (expansion > churn)" },
    ],
  },
  {
    id: "team",
    label: "Team & Talent",
    questions: [
      { id: "exec_team", label: "Leadership gaps are identified and a hiring plan is in place" },
      { id: "culture_documented", label: "Culture, values and operating norms are documented" },
      { id: "recruiting_engine", label: "You have a repeatable recruiting engine for key roles" },
    ],
  },
  {
    id: "financial",
    label: "Financial",
    questions: [
      { id: "unit_economics", label: "Unit economics are positive and improving quarter-over-quarter" },
      { id: "runway_18m", label: "Current runway exceeds 18 months or you have a funded path" },
      { id: "financial_controls", label: "You have real-time financial reporting and board-level controls" },
    ],
  },
  {
    id: "operations",
    label: "Operations",
    questions: [
      { id: "processes_documented", label: "Core operating processes are documented and owned" },
      { id: "okrs", label: "Company-wide OKRs are set, tracked and reviewed quarterly" },
      { id: "board_governance", label: "Board or advisory structure provides meaningful governance" },
    ],
  },
] as const;

type PillarId = (typeof PILLARS)[number]["id"];
type ScoreMap = Record<string, number>;

function parseData(raw: Record<string, unknown>): ScoreMap {
  return (raw.scores as ScoreMap) ?? {};
}

function pillarScore(pillar: (typeof PILLARS)[number], scores: ScoreMap): number {
  const qs = pillar.questions;
  const total = qs.reduce((sum, q) => sum + (scores[q.id] ?? 0), 0);
  return Math.round((total / (qs.length * 5)) * 100);
}

function overallScore(scores: ScoreMap): number {
  const pillarScores = PILLARS.map((p) => pillarScore(p, scores));
  return Math.round(pillarScores.reduce((s, v) => s + v, 0) / PILLARS.length);
}

function topConstraints(scores: ScoreMap): string[] {
  return PILLARS.map((p) => ({ label: p.label, score: pillarScore(p, scores) }))
    .sort((a, b) => a.score - b.score)
    .slice(0, 3)
    .map((p) => p.label);
}

function readinessLabel(score: number): { label: string; variant: "default" | "secondary" | "destructive" } {
  if (score >= 75) return { label: "Scale Ready", variant: "default" };
  if (score >= 50) return { label: "Getting There", variant: "secondary" };
  return { label: "Not Yet Ready", variant: "destructive" };
}

export function ScalingReadiness({
  teamId, userId, isReadOnly, existingArtifact,
}: {
  teamId: string; userId: string; isReadOnly: boolean;
  existingArtifact: { id: string; data: Record<string, unknown> } | null;
}) {
  const [scores, setScores] = useState<ScoreMap>(() => parseData(existingArtifact?.data ?? {}));
  const [artifactId, setArtifactId] = useState(existingArtifact?.id ?? null);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [confirmed, setConfirmed] = useState(!!existingArtifact);
  const supabase = createClient();

  const overall = overallScore(scores);
  const constraints = topConstraints(scores);
  const readiness = readinessLabel(overall);
  const answeredCount = Object.values(scores).filter((v) => v > 0).length;
  const totalQuestions = PILLARS.reduce((acc, p) => acc + p.questions.length, 0);

  function setScore(questionId: string, value: number) {
    setScores((prev) => ({ ...prev, [questionId]: value }));
    setSaved(false);
  }

  async function handleSave() {
    setSaving(true);
    const data = { scores };
    if (artifactId) {
      await supabase.from("artifacts").update({ data, updated_at: new Date().toISOString() }).eq("id", artifactId);
    } else {
      const { data: a } = await supabase.from("artifacts").insert({ team_id: teamId, artifact_type: "scaling_readiness", title: "Scaling Readiness Assessment", data, created_by: userId }).select("id").single();
      if (a) setArtifactId(a.id);
    }
    setSaving(false);
    setSaved(true);
    setConfirmed(true);
    setTimeout(() => setSaved(false), 2000);
  }

  return (
    <div className="space-y-6">
      {/* Why */}
      <Card className="border-primary/20 bg-primary/5">
        <CardContent className="pt-4 pb-4">
          <p className="text-sm font-medium mb-1">Why this assessment?</p>
          <p className="text-sm text-muted-foreground">
            Scaling before you are ready is one of the most common causes of startup failure. Premature scaling burns capital on sales, hiring and infrastructure that your product and processes cannot yet support. This assessment gives you and your mentors an honest picture of where you stand across the six pillars of scaling readiness — so you can focus on your real constraints first.
          </p>
        </CardContent>
      </Card>

      {/* Data review banner */}
      {!confirmed && (
        <div className="flex items-start gap-3 rounded-lg border border-amber-300 bg-amber-50 dark:bg-amber-950/30 p-4">
          <AlertCircle className="size-4 mt-0.5 text-amber-600 shrink-0" />
          <div className="text-sm">
            <p className="font-medium text-amber-900 dark:text-amber-200">Review and complete your assessment</p>
            <p className="text-amber-800 dark:text-amber-300 mt-0.5">
              If you are coming from the incubator, use what you know. If you are joining fresh, fill this in from scratch. Be honest — this is for your benefit.
            </p>
          </div>
        </div>
      )}

      {/* Score overview */}
      {answeredCount > 0 && (
        <div className="flex items-center gap-4 rounded-lg border p-4">
          <div className="text-center min-w-[80px]">
            <p className="text-3xl font-bold">{overall}%</p>
            <p className="text-xs text-muted-foreground">Overall</p>
          </div>
          <div className="flex-1">
            <Badge variant={readiness.variant} className="mb-2">{readiness.label}</Badge>
            {overall < 75 && (
              <p className="text-xs text-muted-foreground">
                Focus areas: <span className="font-medium text-foreground">{constraints.join(", ")}</span>
              </p>
            )}
          </div>
          <p className="text-xs text-muted-foreground">{answeredCount}/{totalQuestions} answered</p>
        </div>
      )}

      {/* Pillars */}
      <div className="space-y-4">
        {PILLARS.map((pillar) => {
          const pScore = pillarScore(pillar, scores);
          const allAnswered = pillar.questions.every((q) => scores[q.id] > 0);
          return (
            <Card key={pillar.id}>
              <CardHeader className="pb-2">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-base">{pillar.label}</CardTitle>
                  {allAnswered && (
                    <Badge variant={pScore >= 75 ? "default" : pScore >= 50 ? "secondary" : "destructive"} className="text-xs">
                      {pScore}%
                    </Badge>
                  )}
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                {pillar.questions.map((q) => (
                  <div key={q.id} className="space-y-2">
                    <Label className="text-sm leading-snug">{q.label}</Label>
                    <div className="flex gap-2 flex-wrap">
                      {[1, 2, 3, 4, 5].map((v) => (
                        <button
                          key={v}
                          disabled={isReadOnly}
                          onClick={() => setScore(q.id, v)}
                          className={`w-9 h-9 rounded-md border text-sm font-medium transition-colors ${
                            scores[q.id] === v
                              ? "bg-primary text-primary-foreground border-primary"
                              : "bg-background hover:bg-accent border-input"
                          } disabled:opacity-50 disabled:cursor-not-allowed`}
                        >
                          {v}
                        </button>
                      ))}
                      <span className="text-xs text-muted-foreground self-center ml-1">
                        {!scores[q.id] ? "Not answered" : scores[q.id] <= 2 ? "Weak" : scores[q.id] === 3 ? "Developing" : scores[q.id] === 4 ? "Strong" : "Excellent"}
                      </span>
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>
          );
        })}
      </div>

      <p className="text-xs text-muted-foreground">1 = Not started · 2 = Early stage · 3 = Developing · 4 = Strong · 5 = Excellent</p>

      {!isReadOnly && (
        <Button onClick={handleSave} disabled={saving || answeredCount === 0}>
          {saving ? <><Loader2 className="size-4 animate-spin" />Saving...</> : saved ? <><Check className="size-4" />Saved</> : <><Save className="size-4" />Save Assessment</>}
        </Button>
      )}
    </div>
  );
}
