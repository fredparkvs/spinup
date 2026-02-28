"use client";

import { useState } from "react";
import { Save, Loader2, Check } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import type { ValueProposition } from "@/lib/types/database";

interface PSFData {
  who_has_problem: string;
  what_is_problem: string;
  how_they_solve_now: string;
  why_current_fails: string;
  our_solution: string;
  ten_x_advantage: string;
  evidence_so_far: string;
}

function parseData(raw: Record<string, unknown>, vp: ValueProposition | null): PSFData {
  const vpStatement = vp
    ? `Our product ${vp.solution} helps ${vp.customer} achieve ${vp.benefit} by ${vp.how_it_works}, an improvement of ${vp.improvement} over current options.`
    : "";
  return {
    who_has_problem: (raw.who_has_problem as string) ?? "",
    what_is_problem: (raw.what_is_problem as string) ?? "",
    how_they_solve_now: (raw.how_they_solve_now as string) ?? "",
    why_current_fails: (raw.why_current_fails as string) ?? "",
    our_solution: (raw.our_solution as string) ?? "",
    ten_x_advantage: (raw.ten_x_advantage as string) ?? vpStatement,
    evidence_so_far: (raw.evidence_so_far as string) ?? "",
  };
}

const SECTIONS: { key: keyof PSFData; label: string; placeholder: string; hint?: string }[] = [
  { key: "who_has_problem", label: "Who has the problem?", placeholder: "Describe the specific customer segment experiencing this problem" },
  { key: "what_is_problem", label: "What is the problem?", placeholder: "Describe the specific pain — ideally in words your customers use" },
  { key: "how_they_solve_now", label: "How do they currently solve it?", placeholder: "What workarounds, tools, or approaches do they use today?" },
  { key: "why_current_fails", label: "Why do current solutions fail?", placeholder: "What is the gap or frustration that existing options leave?" },
  { key: "our_solution", label: "Our proposed solution", placeholder: "In one sentence: what does our product do for this customer?" },
  {
    key: "ten_x_advantage",
    label: "The 10x advantage",
    placeholder: 'Our product [solution] helps [customer] achieve [benefit] by [how it works], an improvement of X over current options.',
    hint: "Pre-filled from your value proposition. Edit here to refine.",
  },
  { key: "evidence_so_far", label: "Evidence so far", placeholder: "Customer quotes, number of interviews completed, any early commitments or letters of interest" },
];

export function ProblemSolutionFit({ teamId, userId, isReadOnly, existingArtifact, valueProposition }: {
  teamId: string; userId: string; isReadOnly: boolean;
  existingArtifact: { id: string; data: Record<string, unknown> } | null;
  valueProposition: ValueProposition | null;
}) {
  const [data, setData] = useState<PSFData>(() =>
    parseData(existingArtifact?.data ?? {}, valueProposition)
  );
  const [artifactId, setArtifactId] = useState(existingArtifact?.id ?? null);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const supabase = createClient();

  async function handleSave() {
    setSaving(true);
    if (artifactId) {
      await supabase.from("artifacts").update({
        data: data as unknown as Record<string, unknown>,
        updated_at: new Date().toISOString(),
      }).eq("id", artifactId);
    } else {
      const { data: newArtifact } = await supabase.from("artifacts").insert({
        team_id: teamId, artifact_type: "problem_solution_fit",
        title: "Problem-Solution Fit Canvas",
        data: data as unknown as Record<string, unknown>, created_by: userId,
      }).select("id").single();
      if (newArtifact) setArtifactId(newArtifact.id);
    }
    setSaving(false);
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  }

  function update(field: keyof PSFData, value: string) {
    setData((prev) => ({ ...prev, [field]: value }));
    setSaved(false);
  }

  return (
    <div className="space-y-5">
      {SECTIONS.map(({ key, label, placeholder, hint }) => (
        <div key={key} className="space-y-1.5">
          <Label className="text-sm font-medium">{label}</Label>
          {hint && <p className="text-xs text-muted-foreground">{hint}</p>}
          <Textarea
            placeholder={placeholder}
            value={data[key]}
            onChange={(e) => update(key, e.target.value)}
            disabled={isReadOnly}
            rows={3}
          />
          {key !== "evidence_so_far" && <Separator className="mt-4" />}
        </div>
      ))}

      {!isReadOnly && (
        <Button onClick={handleSave} disabled={saving}>
          {saving ? <><Loader2 className="size-4 animate-spin" />Saving...</> : saved ? <><Check className="size-4" />Saved</> : <><Save className="size-4" />Save Canvas</>}
        </Button>
      )}
    </div>
  );
}
