"use client";

import { useState } from "react";
import { PlusCircle, ChevronDown, ChevronUp, Trash2, Loader2, Save } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";

interface HypothesisData {
  assumption: string;
  why_we_believe: string;
  experiment_designed: string;
  outcome: string;
  validated: "yes" | "no" | "partially" | "";
  next_action: string;
}

interface Hypothesis {
  id: string;
  data: Record<string, unknown>;
  status: string;
  created_at: string;
}

interface HypothesisTrackerProps {
  teamId: string;
  userId: string;
  isReadOnly: boolean;
  initialHypotheses: Hypothesis[];
}

const EMPTY_DATA: HypothesisData = {
  assumption: "",
  why_we_believe: "",
  experiment_designed: "",
  outcome: "",
  validated: "",
  next_action: "",
};

function parseData(raw: Record<string, unknown>): HypothesisData {
  return {
    assumption: (raw.assumption as string) ?? "",
    why_we_believe: (raw.why_we_believe as string) ?? "",
    experiment_designed: (raw.experiment_designed as string) ?? "",
    outcome: (raw.outcome as string) ?? "",
    validated: (raw.validated as HypothesisData["validated"]) ?? "",
    next_action: (raw.next_action as string) ?? "",
  };
}

const VALIDATED_LABELS: Record<string, { label: string; variant: "default" | "secondary" | "destructive" }> = {
  yes: { label: "Validated", variant: "default" },
  no: { label: "Invalidated", variant: "destructive" },
  partially: { label: "Partially", variant: "secondary" },
};

function HypothesisRow({
  hypothesis,
  onUpdate,
  onDelete,
  isReadOnly,
}: {
  hypothesis: Hypothesis & { localData: HypothesisData };
  onUpdate: (id: string, data: HypothesisData) => void;
  onDelete: (id: string) => void;
  isReadOnly: boolean;
}) {
  const [expanded, setExpanded] = useState(false);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const supabase = createClient();

  const validatedInfo = hypothesis.localData.validated
    ? VALIDATED_LABELS[hypothesis.localData.validated]
    : null;

  async function handleSave() {
    setSaving(true);
    await supabase
      .from("artifacts")
      .update({ data: hypothesis.localData as unknown as Record<string, unknown>, updated_at: new Date().toISOString() })
      .eq("id", hypothesis.id);
    setSaving(false);
  }

  async function handleDelete() {
    setDeleting(true);
    await supabase.from("artifacts").delete().eq("id", hypothesis.id);
    onDelete(hypothesis.id);
  }

  function updateField(field: keyof HypothesisData, value: string) {
    onUpdate(hypothesis.id, { ...hypothesis.localData, [field]: value });
  }

  return (
    <Card>
      <CardHeader className="pb-2 cursor-pointer" onClick={() => setExpanded((v) => !v)}>
        <div className="flex items-start justify-between gap-3">
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium truncate">
              {hypothesis.localData.assumption || "Untitled hypothesis"}
            </p>
            <p className="text-xs text-muted-foreground mt-0.5">
              {new Date(hypothesis.created_at).toLocaleDateString("en-ZA")}
            </p>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            {validatedInfo && (
              <Badge variant={validatedInfo.variant} className="text-xs">
                {validatedInfo.label}
              </Badge>
            )}
            {expanded ? <ChevronUp className="size-4 text-muted-foreground" /> : <ChevronDown className="size-4 text-muted-foreground" />}
          </div>
        </div>
      </CardHeader>

      {expanded && (
        <CardContent className="space-y-4 pt-0">
          <div className="space-y-2">
            <Label className="text-xs">The assumption being tested</Label>
            <Textarea
              placeholder="e.g. SMEs in manufacturing will pay R5,000/month for automated quality control"
              value={hypothesis.localData.assumption}
              onChange={(e) => updateField("assumption", e.target.value)}
              disabled={isReadOnly}
              rows={2}
            />
          </div>
          <div className="space-y-2">
            <Label className="text-xs">Why we believe this</Label>
            <Textarea
              placeholder="Evidence or intuition behind this assumption"
              value={hypothesis.localData.why_we_believe}
              onChange={(e) => updateField("why_we_believe", e.target.value)}
              disabled={isReadOnly}
              rows={2}
            />
          </div>
          <div className="space-y-2">
            <Label className="text-xs">Experiment designed</Label>
            <Textarea
              placeholder="How will you test this? (interview, landing page, pilot, etc.)"
              value={hypothesis.localData.experiment_designed}
              onChange={(e) => updateField("experiment_designed", e.target.value)}
              disabled={isReadOnly}
              rows={2}
            />
          </div>
          <div className="space-y-2">
            <Label className="text-xs">Outcome</Label>
            <Textarea
              placeholder="What actually happened when you tested it?"
              value={hypothesis.localData.outcome}
              onChange={(e) => updateField("outcome", e.target.value)}
              disabled={isReadOnly}
              rows={2}
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label className="text-xs">Validated?</Label>
              <Select
                value={hypothesis.localData.validated}
                onValueChange={(v) => updateField("validated", v)}
                disabled={isReadOnly}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select..." />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="yes">Yes — Validated</SelectItem>
                  <SelectItem value="no">No — Invalidated</SelectItem>
                  <SelectItem value="partially">Partially</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label className="text-xs">Next action</Label>
              <Input
                placeholder="What to do as a result"
                value={hypothesis.localData.next_action}
                onChange={(e) => updateField("next_action", e.target.value)}
                disabled={isReadOnly}
              />
            </div>
          </div>
          {!isReadOnly && (
            <div className="flex gap-2 pt-1">
              <Button size="sm" onClick={handleSave} disabled={saving}>
                {saving ? <Loader2 className="size-3 animate-spin" /> : <Save className="size-3" />}
                Save
              </Button>
              <Button size="sm" variant="ghost" onClick={handleDelete} disabled={deleting} className="text-destructive hover:text-destructive">
                {deleting ? <Loader2 className="size-3 animate-spin" /> : <Trash2 className="size-3" />}
                Delete
              </Button>
            </div>
          )}
        </CardContent>
      )}
    </Card>
  );
}

export function HypothesisTracker({ teamId, userId, isReadOnly, initialHypotheses }: HypothesisTrackerProps) {
  const [hypotheses, setHypotheses] = useState<(Hypothesis & { localData: HypothesisData })[]>(
    initialHypotheses.map((h) => ({ ...h, localData: parseData(h.data) }))
  );
  const [adding, setAdding] = useState(false);
  const supabase = createClient();

  async function handleAdd() {
    setAdding(true);
    const { data } = await supabase
      .from("artifacts")
      .insert({
        team_id: teamId,
        artifact_type: "hypothesis_tracker",
        title: "Hypothesis",
        data: EMPTY_DATA as unknown as Record<string, unknown>,
        created_by: userId,
      })
      .select("id, data, status, created_at")
      .single();

    if (data) {
      setHypotheses((prev) => [
        ...prev,
        { ...data, localData: EMPTY_DATA },
      ]);
    }
    setAdding(false);
  }

  function handleUpdate(id: string, data: HypothesisData) {
    setHypotheses((prev) =>
      prev.map((h) => (h.id === id ? { ...h, localData: data } : h))
    );
  }

  function handleDelete(id: string) {
    setHypotheses((prev) => prev.filter((h) => h.id !== id));
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <p className="text-sm text-muted-foreground">
          {hypotheses.length === 0
            ? "No hypotheses yet. Add your first assumption to test."
            : `${hypotheses.length} hypothesis${hypotheses.length !== 1 ? "es" : ""} tracked`}
        </p>
        {!isReadOnly && (
          <Button size="sm" onClick={handleAdd} disabled={adding}>
            {adding ? <Loader2 className="size-4 animate-spin" /> : <PlusCircle className="size-4" />}
            Add Hypothesis
          </Button>
        )}
      </div>

      {hypotheses.map((h) => (
        <HypothesisRow
          key={h.id}
          hypothesis={h}
          onUpdate={handleUpdate}
          onDelete={handleDelete}
          isReadOnly={isReadOnly}
        />
      ))}
    </div>
  );
}
