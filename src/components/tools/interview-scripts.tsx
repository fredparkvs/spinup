"use client";

import { useState } from "react";
import { PlusCircle, ChevronDown, ChevronUp, Trash2, Loader2, Save } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";

interface InterviewLog {
  id: string;
  date: string;
  interviewee: string;
  key_findings: string;
}

interface ScriptData {
  persona: string;
  problem_hypothesis: string;
  interview_logs: InterviewLog[];
  pattern_summary: string;
}

interface Script {
  id: string;
  title: string;
  data: Record<string, unknown>;
  created_at: string;
}

const WARMUP_QUESTIONS = [
  "Tell me a bit about your role and what you do day-to-day.",
  "How long have you been in this role?",
  "What are the main tools or processes you rely on?",
];
const PROBLEM_QUESTIONS = [
  "What's the hardest part of [topic related to your hypothesis]?",
  "Walk me through the last time you dealt with this problem.",
  "How often does this come up, and what do you do when it does?",
  "What have you tried to solve it?",
];
const CURRENT_SOLUTION_QUESTIONS = [
  "What do you currently use to handle this?",
  "What do you like about your current approach?",
  "What do you wish it did differently?",
];
const WRAPUP_QUESTIONS = [
  "Is there anything I should have asked but didn't?",
  "Who else do you think I should speak to about this?",
];

function parseScriptData(raw: Record<string, unknown>): ScriptData {
  return {
    persona: (raw.persona as string) ?? "",
    problem_hypothesis: (raw.problem_hypothesis as string) ?? "",
    interview_logs: (raw.interview_logs as InterviewLog[]) ?? [],
    pattern_summary: (raw.pattern_summary as string) ?? "",
  };
}

function ScriptCard({
  script,
  onUpdate,
  onDelete,
  isReadOnly,
}: {
  script: Script & { localData: ScriptData };
  onUpdate: (id: string, data: ScriptData) => void;
  onDelete: (id: string) => void;
  isReadOnly: boolean;
}) {
  const [expanded, setExpanded] = useState(false);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [localData, setLocalData] = useState<ScriptData>(script.localData);
  const supabase = createClient();

  const logCount = localData.interview_logs.length;

  async function handleSave() {
    setSaving(true);
    await supabase.from("artifacts").update({
      title: localData.persona || "Interview Script",
      data: localData as unknown as Record<string, unknown>,
      updated_at: new Date().toISOString(),
    }).eq("id", script.id);
    onUpdate(script.id, localData);
    setSaving(false);
  }

  async function handleDelete() {
    setDeleting(true);
    await supabase.from("artifacts").delete().eq("id", script.id);
    onDelete(script.id);
  }

  function updateField(field: keyof ScriptData, value: unknown) {
    setLocalData((prev) => ({ ...prev, [field]: value }));
  }

  function addLog() {
    const newLog: InterviewLog = { id: crypto.randomUUID(), date: new Date().toISOString().split("T")[0], interviewee: "", key_findings: "" };
    setLocalData((prev) => ({ ...prev, interview_logs: [...prev.interview_logs, newLog] }));
  }

  function updateLog(logId: string, field: keyof InterviewLog, value: string) {
    setLocalData((prev) => ({
      ...prev,
      interview_logs: prev.interview_logs.map((l) => l.id === logId ? { ...l, [field]: value } : l),
    }));
  }

  function deleteLog(logId: string) {
    setLocalData((prev) => ({ ...prev, interview_logs: prev.interview_logs.filter((l) => l.id !== logId) }));
  }

  return (
    <Card>
      <CardHeader className="pb-2 cursor-pointer" onClick={() => setExpanded((v) => !v)}>
        <div className="flex items-start justify-between gap-3">
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium truncate">{localData.persona || "Untitled Script"}</p>
            <p className="text-xs text-muted-foreground mt-0.5">{logCount} interview{logCount !== 1 ? "s" : ""} logged</p>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            {logCount >= 5 && <Badge className="text-xs">Pattern ready</Badge>}
            {expanded ? <ChevronUp className="size-4 text-muted-foreground" /> : <ChevronDown className="size-4 text-muted-foreground" />}
          </div>
        </div>
      </CardHeader>

      {expanded && (
        <CardContent className="space-y-6 pt-0">
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label className="text-xs">Customer persona</Label>
              <Input placeholder="e.g. Operations manager at mid-size manufacturer" value={localData.persona} onChange={(e) => updateField("persona", e.target.value)} disabled={isReadOnly} />
            </div>
            <div className="space-y-2">
              <Label className="text-xs">Core problem hypothesis</Label>
              <Input placeholder="What you think their problem is" value={localData.problem_hypothesis} onChange={(e) => updateField("problem_hypothesis", e.target.value)} disabled={isReadOnly} />
            </div>
          </div>

          <Separator />

          {/* Generated script */}
          <div className="rounded-lg border bg-muted/20 p-4 space-y-4">
            <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Generated Interview Script</p>
            {[
              { title: "Warm-up", questions: WARMUP_QUESTIONS },
              { title: "Problem Exploration", questions: PROBLEM_QUESTIONS },
              { title: "Current Solution Probing", questions: CURRENT_SOLUTION_QUESTIONS },
              { title: "Wrap-up", questions: WRAPUP_QUESTIONS },
            ].map(({ title, questions }) => (
              <div key={title} className="space-y-1">
                <p className="text-xs font-medium">{title}</p>
                {questions.map((q, i) => (
                  <p key={i} className="text-xs text-muted-foreground pl-3">— {q}</p>
                ))}
              </div>
            ))}
          </div>

          <Separator />

          {/* Interview log */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <p className="text-sm font-medium">Interview Log</p>
              {!isReadOnly && (
                <Button size="sm" variant="outline" onClick={addLog}>
                  <PlusCircle className="size-3" />Log Interview
                </Button>
              )}
            </div>
            <p className="text-xs text-muted-foreground">Aim for 5–7 interviews per persona to detect patterns. 15–20 for comprehensive validation.</p>

            {localData.interview_logs.map((log) => (
              <div key={log.id} className="rounded-md border p-3 space-y-2">
                <div className="grid grid-cols-2 gap-2">
                  <div className="space-y-1">
                    <Label className="text-xs">Date</Label>
                    <Input type="date" value={log.date} onChange={(e) => updateLog(log.id, "date", e.target.value)} disabled={isReadOnly} className="text-xs" />
                  </div>
                  <div className="space-y-1">
                    <Label className="text-xs">Interviewee (optional)</Label>
                    <Input placeholder="Name or role" value={log.interviewee} onChange={(e) => updateLog(log.id, "interviewee", e.target.value)} disabled={isReadOnly} className="text-xs" />
                  </div>
                </div>
                <div className="space-y-1">
                  <Label className="text-xs">Key findings</Label>
                  <Textarea placeholder="What did you learn? Any surprises? Did it confirm or challenge your hypothesis?" value={log.key_findings} onChange={(e) => updateLog(log.id, "key_findings", e.target.value)} disabled={isReadOnly} rows={2} className="text-xs" />
                </div>
                {!isReadOnly && (
                  <Button size="sm" variant="ghost" onClick={() => deleteLog(log.id)} className="text-destructive hover:text-destructive h-7">
                    <Trash2 className="size-3" />Remove
                  </Button>
                )}
              </div>
            ))}
          </div>

          {/* Pattern summary — shown after 5+ interviews */}
          {logCount >= 5 && (
            <div className="space-y-2">
              <Label className="text-xs">Pattern Summary (after 5+ interviews)</Label>
              <Textarea
                placeholder="Common themes, surprises, and invalidated assumptions across your interviews..."
                value={localData.pattern_summary}
                onChange={(e) => updateField("pattern_summary", e.target.value)}
                disabled={isReadOnly}
                rows={4}
              />
            </div>
          )}

          {!isReadOnly && (
            <div className="flex gap-2">
              <Button size="sm" onClick={handleSave} disabled={saving}>
                {saving ? <Loader2 className="size-3 animate-spin" /> : <Save className="size-3" />}Save
              </Button>
              <Button size="sm" variant="ghost" onClick={handleDelete} disabled={deleting} className="text-destructive hover:text-destructive">
                {deleting ? <Loader2 className="size-3 animate-spin" /> : <Trash2 className="size-3" />}Delete
              </Button>
            </div>
          )}
        </CardContent>
      )}
    </Card>
  );
}

export function InterviewScripts({ teamId, userId, isReadOnly, initialScripts }: {
  teamId: string; userId: string; isReadOnly: boolean;
  initialScripts: Script[];
}) {
  const [scripts, setScripts] = useState<(Script & { localData: ScriptData })[]>(
    initialScripts.map((s) => ({ ...s, localData: parseScriptData(s.data) }))
  );
  const [adding, setAdding] = useState(false);
  const supabase = createClient();

  async function handleAdd() {
    setAdding(true);
    const emptyData = { persona: "", problem_hypothesis: "", interview_logs: [], pattern_summary: "" };
    const { data } = await supabase.from("artifacts").insert({
      team_id: teamId, artifact_type: "interview_scripts", title: "Interview Script",
      data: emptyData as unknown as Record<string, unknown>, created_by: userId,
    }).select("id, title, data, created_at").single();
    if (data) setScripts((prev) => [...prev, { ...data, localData: emptyData }]);
    setAdding(false);
  }

  function handleUpdate(id: string, data: ScriptData) {
    setScripts((prev) => prev.map((s) => (s.id === id ? { ...s, localData: data } : s)));
  }

  function handleDelete(id: string) {
    setScripts((prev) => prev.filter((s) => s.id !== id));
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <p className="text-sm text-muted-foreground">
          {scripts.length === 0 ? "Create your first interview script." : `${scripts.length} script${scripts.length !== 1 ? "s" : ""}`}
        </p>
        {!isReadOnly && (
          <Button size="sm" onClick={handleAdd} disabled={adding}>
            {adding ? <Loader2 className="size-4 animate-spin" /> : <PlusCircle className="size-4" />}
            New Script
          </Button>
        )}
      </div>
      {scripts.map((s) => (
        <ScriptCard key={s.id} script={s} onUpdate={handleUpdate} onDelete={handleDelete} isReadOnly={isReadOnly} />
      ))}
    </div>
  );
}
