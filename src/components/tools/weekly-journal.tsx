"use client";

import { useState } from "react";
import { Save, Loader2, Check, Plus, ChevronDown, ChevronUp } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";

interface MetricEntry {
  label: string;
  value: string;
}

interface JournalEntry {
  id: string;
  week_start: string;
  what_we_did: string;
  what_we_learned: string;
  what_changed: string;
  blockers: string;
  next_week_priority: string;
  metrics: MetricEntry[];
  created_at: string;
}

type JournalEntryDB = {
  id: string;
  team_id: string;
  week_start: string;
  what_we_did: string | null;
  what_we_learned: string | null;
  what_changed: string | null;
  blockers: string | null;
  next_week_priority: string | null;
  metrics: Record<string, unknown> | null;
  created_by: string;
  created_at: string;
  updated_at: string;
};

function getThisMonday(): string {
  const d = new Date();
  const day = d.getDay();
  const diff = d.getDate() - day + (day === 0 ? -6 : 1);
  d.setDate(diff);
  return d.toISOString().split("T")[0];
}

function formatWeek(dateStr: string): string {
  const d = new Date(dateStr + "T00:00:00");
  return d.toLocaleDateString("en-ZA", { day: "numeric", month: "short", year: "numeric" });
}

function metricsToArray(raw: Record<string, unknown> | null): MetricEntry[] {
  if (!raw) return [{ label: "", value: "" }];
  if (Array.isArray(raw)) return raw as MetricEntry[];
  return Object.entries(raw).map(([label, value]) => ({ label, value: String(value) }));
}

function metricsToObject(arr: MetricEntry[]): Record<string, string> {
  return Object.fromEntries(arr.filter((m) => m.label).map((m) => [m.label, m.value]));
}

function emptyEntry(): Omit<JournalEntry, "id" | "created_at"> {
  return {
    week_start: getThisMonday(),
    what_we_did: "",
    what_we_learned: "",
    what_changed: "",
    blockers: "",
    next_week_priority: "",
    metrics: [{ label: "", value: "" }],
  };
}

export function WeeklyJournal({ teamId, userId, isReadOnly, existingEntries }: {
  teamId: string;
  userId: string;
  isReadOnly: boolean;
  existingEntries: JournalEntryDB[];
}) {
  const [entries, setEntries] = useState<JournalEntry[]>(() =>
    existingEntries.map((e) => ({
      id: e.id,
      week_start: e.week_start,
      what_we_did: e.what_we_did ?? "",
      what_we_learned: e.what_we_learned ?? "",
      what_changed: e.what_changed ?? "",
      blockers: e.blockers ?? "",
      next_week_priority: e.next_week_priority ?? "",
      metrics: metricsToArray(e.metrics),
      created_at: e.created_at,
    }))
  );
  const [form, setForm] = useState(emptyEntry());
  const [savingId, setSavingId] = useState<string | null>(null);
  const [savedId, setSavedId] = useState<string | null>(null);
  const [savingNew, setSavingNew] = useState(false);
  const [savedNew, setSavedNew] = useState(false);
  const [expandedIds, setExpandedIds] = useState<Set<string>>(new Set());
  const [showForm, setShowForm] = useState(existingEntries.length === 0);
  const supabase = createClient();

  function toggleExpand(id: string) {
    setExpandedIds((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  }

  function updateForm(field: keyof typeof form, value: string | MetricEntry[]) {
    setForm((prev) => ({ ...prev, [field]: value }));
  }

  function updateMetric(index: number, field: keyof MetricEntry, value: string) {
    const updated = form.metrics.map((m, i) => i === index ? { ...m, [field]: value } : m);
    updateForm("metrics", updated);
  }

  function addMetric() {
    updateForm("metrics", [...form.metrics, { label: "", value: "" }]);
  }

  function removeMetric(index: number) {
    updateForm("metrics", form.metrics.filter((_, i) => i !== index));
  }

  async function handleSaveNew() {
    setSavingNew(true);
    const { data: newEntry } = await supabase
      .from("journal_entries")
      .insert({
        team_id: teamId,
        week_start: form.week_start,
        what_we_did: form.what_we_did,
        what_we_learned: form.what_we_learned,
        what_changed: form.what_changed,
        blockers: form.blockers,
        next_week_priority: form.next_week_priority,
        metrics: metricsToObject(form.metrics),
        created_by: userId,
      })
      .select("*")
      .single();

    if (newEntry) {
      const entry: JournalEntry = {
        id: newEntry.id,
        week_start: newEntry.week_start,
        what_we_did: newEntry.what_we_did ?? "",
        what_we_learned: newEntry.what_we_learned ?? "",
        what_changed: newEntry.what_changed ?? "",
        blockers: newEntry.blockers ?? "",
        next_week_priority: newEntry.next_week_priority ?? "",
        metrics: metricsToArray(newEntry.metrics as Record<string, unknown> | null),
        created_at: newEntry.created_at,
      };
      setEntries((prev) => [entry, ...prev]);
      setForm(emptyEntry());
      setShowForm(false);
    }
    setSavingNew(false);
    setSavedNew(true);
    setTimeout(() => setSavedNew(false), 2000);
  }

  async function handleUpdateEntry(entry: JournalEntry) {
    setSavingId(entry.id);
    await supabase.from("journal_entries").update({
      what_we_did: entry.what_we_did,
      what_we_learned: entry.what_we_learned,
      what_changed: entry.what_changed,
      blockers: entry.blockers,
      next_week_priority: entry.next_week_priority,
      metrics: metricsToObject(entry.metrics),
      updated_at: new Date().toISOString(),
    }).eq("id", entry.id);
    setSavingId(null);
    setSavedId(entry.id);
    setTimeout(() => setSavedId(null), 2000);
  }

  function updateEntry(id: string, field: keyof JournalEntry, value: string | MetricEntry[]) {
    setEntries((prev) => prev.map((e) => e.id === id ? { ...e, [field]: value } : e));
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Badge variant="secondary">{entries.length} {entries.length === 1 ? "entry" : "entries"}</Badge>
          <p className="text-xs text-muted-foreground">One entry per week. Track what happened, what you learned, and what&apos;s next.</p>
        </div>
        {!isReadOnly && !showForm && (
          <Button size="sm" onClick={() => setShowForm(true)}>
            <Plus className="size-3.5 mr-1" />New entry
          </Button>
        )}
      </div>

      {/* New Entry Form */}
      {!isReadOnly && showForm && (
        <div className="rounded-lg border border-primary/20 bg-primary/5 p-4 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-semibold">New journal entry</h3>
            <Button variant="ghost" size="sm" onClick={() => setShowForm(false)}>Cancel</Button>
          </div>
          <div className="space-y-1.5">
            <Label>Week of (Monday)</Label>
            <Input type="date" value={form.week_start} onChange={(e) => updateForm("week_start", e.target.value)} className="w-48" />
          </div>
          <Separator />
          {[
            { key: "what_we_did" as const, label: "What we did", placeholder: "Key activities, conversations, experiments completed this week" },
            { key: "what_we_learned" as const, label: "What we learned", placeholder: "Insights from customer conversations, experiments, or research" },
            { key: "what_changed" as const, label: "What changed", placeholder: "Any pivots, updated hypotheses, or direction changes" },
            { key: "blockers" as const, label: "Blockers", placeholder: "What is slowing you down or needs to be resolved?" },
            { key: "next_week_priority" as const, label: "Next week's priority", placeholder: "The one most important thing to focus on next week" },
          ].map(({ key, label, placeholder }) => (
            <div key={key} className="space-y-1.5">
              <Label>{label}</Label>
              <Textarea placeholder={placeholder} value={form[key] as string} onChange={(e) => updateForm(key, e.target.value)} rows={2} />
            </div>
          ))}
          <div className="space-y-2">
            <Label>Key metrics this week</Label>
            <p className="text-xs text-muted-foreground">Track the numbers that matter most to your current stage.</p>
            {form.metrics.map((metric, i) => (
              <div key={i} className="flex items-center gap-2">
                <Input placeholder="Metric (e.g. Customer interviews)" value={metric.label} onChange={(e) => updateMetric(i, "label", e.target.value)} className="flex-1" />
                <Input placeholder="Value" value={metric.value} onChange={(e) => updateMetric(i, "value", e.target.value)} className="w-32" />
                {form.metrics.length > 1 && (
                  <Button variant="ghost" size="icon" className="size-8 shrink-0" onClick={() => removeMetric(i)}>×</Button>
                )}
              </div>
            ))}
            <Button variant="outline" size="sm" onClick={addMetric}>
              <Plus className="size-3 mr-1" />Add metric
            </Button>
          </div>
          <Button onClick={handleSaveNew} disabled={savingNew || !form.week_start}>
            {savingNew ? <><Loader2 className="size-4 animate-spin" />Saving...</> : savedNew ? <><Check className="size-4" />Saved</> : <><Save className="size-4" />Save entry</>}
          </Button>
        </div>
      )}

      {/* Entry History */}
      {entries.length === 0 && !showForm && (
        <div className="rounded-lg border border-dashed p-8 text-center">
          <p className="text-sm text-muted-foreground">No journal entries yet.</p>
          <p className="text-xs text-muted-foreground mt-1">Start your first weekly reflection above.</p>
        </div>
      )}

      {entries.map((entry, idx) => (
        <div key={entry.id} className="rounded-lg border">
          <button
            className="w-full flex items-center justify-between p-4 text-left hover:bg-muted/30 transition-colors"
            onClick={() => toggleExpand(entry.id)}
          >
            <div className="flex items-center gap-3">
              <span className="text-sm font-semibold">Week of {formatWeek(entry.week_start)}</span>
              {idx === 0 && <Badge variant="outline" className="text-xs">Latest</Badge>}
            </div>
            {expandedIds.has(entry.id) ? <ChevronUp className="size-4 text-muted-foreground" /> : <ChevronDown className="size-4 text-muted-foreground" />}
          </button>
          {expandedIds.has(entry.id) && (
            <div className="px-4 pb-4 space-y-4 border-t pt-4">
              {[
                { key: "what_we_did" as const, label: "What we did", placeholder: "Key activities this week" },
                { key: "what_we_learned" as const, label: "What we learned", placeholder: "Insights and discoveries" },
                { key: "what_changed" as const, label: "What changed", placeholder: "Pivots or direction changes" },
                { key: "blockers" as const, label: "Blockers", placeholder: "What slowed you down" },
                { key: "next_week_priority" as const, label: "Next week's priority", placeholder: "The one focus for next week" },
              ].map(({ key, label, placeholder }) => (
                <div key={key} className="space-y-1.5">
                  <Label className="text-xs text-muted-foreground">{label}</Label>
                  <Textarea
                    placeholder={placeholder}
                    value={entry[key] as string}
                    onChange={(e) => updateEntry(entry.id, key, e.target.value)}
                    disabled={isReadOnly}
                    rows={2}
                    className="text-sm"
                  />
                </div>
              ))}
              {entry.metrics.filter((m) => m.label || m.value).length > 0 && (
                <div className="space-y-1">
                  <p className="text-xs text-muted-foreground font-medium">Key metrics</p>
                  <div className="flex flex-wrap gap-2">
                    {entry.metrics.filter((m) => m.label || m.value).map((m, i) => (
                      <Badge key={i} variant="secondary" className="text-xs">{m.label}: {m.value}</Badge>
                    ))}
                  </div>
                </div>
              )}
              {!isReadOnly && (
                <Button size="sm" onClick={() => handleUpdateEntry(entry)} disabled={savingId === entry.id}>
                  {savingId === entry.id ? <><Loader2 className="size-3.5 animate-spin" />Saving...</> : savedId === entry.id ? <><Check className="size-3.5" />Saved</> : <><Save className="size-3.5" />Save changes</>}
                </Button>
              )}
            </div>
          )}
        </div>
      ))}
    </div>
  );
}
