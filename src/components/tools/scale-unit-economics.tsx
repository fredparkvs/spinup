"use client";

import { useState } from "react";
import { Save, Loader2, Check, AlertCircle, PlusCircle, Trash2 } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";

interface ChannelRow {
  name: string;
  cac: string;
  payback_months: string;
}

interface SegmentRow {
  name: string;
  arpa: string;
  gross_margin_pct: string;
  churn_pct: string;
}

interface NrrEntry {
  period: string;
  nrr: string;
  grr: string;
}

interface ScaleUEData {
  channels: ChannelRow[];
  segments: SegmentRow[];
  nrr_history: NrrEntry[];
}

function parseData(raw: Record<string, unknown>): ScaleUEData {
  return {
    channels: (raw.channels as ChannelRow[]) ?? [],
    segments: (raw.segments as SegmentRow[]) ?? [],
    nrr_history: (raw.nrr_history as NrrEntry[]) ?? [],
  };
}

function ltvCacBadge(ratio: number | null) {
  if (ratio === null) return null;
  if (ratio >= 3) return { label: `${ratio.toFixed(1)}x — Healthy ≥3x`, variant: "default" as const };
  if (ratio >= 1) return { label: `${ratio.toFixed(1)}x — Marginal 1–3x`, variant: "secondary" as const };
  return { label: `${ratio.toFixed(1)}x — Unhealthy <1x`, variant: "destructive" as const };
}

function nrrBadge(nrr: number | null) {
  if (nrr === null) return null;
  if (nrr >= 120) return { label: `${nrr}% — Best-in-class`, variant: "default" as const };
  if (nrr >= 100) return { label: `${nrr}% — Healthy`, variant: "default" as const };
  if (nrr >= 90) return { label: `${nrr}% — Below target`, variant: "secondary" as const };
  return { label: `${nrr}% — Needs attention`, variant: "destructive" as const };
}

export function ScaleUnitEconomics({
  teamId, userId, isReadOnly, existingArtifact,
}: {
  teamId: string; userId: string; isReadOnly: boolean;
  existingArtifact: { id: string; data: Record<string, unknown> } | null;
}) {
  const [data, setData] = useState<ScaleUEData>(() => parseData(existingArtifact?.data ?? {}));
  const [artifactId, setArtifactId] = useState(existingArtifact?.id ?? null);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [confirmed, setConfirmed] = useState(!!existingArtifact);
  const supabase = createClient();

  function updateChannel(idx: number, field: keyof ChannelRow, value: string) {
    setData((p) => ({ ...p, channels: p.channels.map((c, i) => i === idx ? { ...c, [field]: value } : c) }));
    setSaved(false);
  }
  function addChannel() {
    setData((p) => ({ ...p, channels: [...p.channels, { name: "", cac: "", payback_months: "" }] }));
    setSaved(false);
  }
  function removeChannel(idx: number) {
    setData((p) => ({ ...p, channels: p.channels.filter((_, i) => i !== idx) }));
    setSaved(false);
  }

  function updateSegment(idx: number, field: keyof SegmentRow, value: string) {
    setData((p) => ({ ...p, segments: p.segments.map((s, i) => i === idx ? { ...s, [field]: value } : s) }));
    setSaved(false);
  }
  function addSegment() {
    setData((p) => ({ ...p, segments: [...p.segments, { name: "", arpa: "", gross_margin_pct: "", churn_pct: "" }] }));
    setSaved(false);
  }
  function removeSegment(idx: number) {
    setData((p) => ({ ...p, segments: p.segments.filter((_, i) => i !== idx) }));
    setSaved(false);
  }

  function addNrrEntry() {
    const period = new Date().toISOString().split("T")[0].slice(0, 7);
    setData((p) => ({ ...p, nrr_history: [...p.nrr_history, { period, nrr: "", grr: "" }] }));
    setSaved(false);
  }
  function updateNrr(idx: number, field: keyof NrrEntry, value: string) {
    setData((p) => ({ ...p, nrr_history: p.nrr_history.map((e, i) => i === idx ? { ...e, [field]: value } : e) }));
    setSaved(false);
  }
  function removeNrr(idx: number) {
    setData((p) => ({ ...p, nrr_history: p.nrr_history.filter((_, i) => i !== idx) }));
    setSaved(false);
  }

  async function handleSave() {
    setSaving(true);
    if (artifactId) {
      await supabase.from("artifacts").update({ data: data as unknown as Record<string, unknown>, updated_at: new Date().toISOString() }).eq("id", artifactId);
    } else {
      const { data: a } = await supabase.from("artifacts").insert({ team_id: teamId, artifact_type: "scale_unit_economics", title: "Unit Economics Dashboard", data: data as unknown as Record<string, unknown>, created_by: userId }).select("id").single();
      if (a) setArtifactId(a.id);
    }
    setSaving(false);
    setSaved(true);
    setConfirmed(true);
    setTimeout(() => setSaved(false), 2000);
  }

  const latestNrr = data.nrr_history.length > 0 ? data.nrr_history[data.nrr_history.length - 1] : null;

  return (
    <div className="space-y-6">
      {/* Why */}
      <Card className="border-primary/20 bg-primary/5">
        <CardContent className="pt-4 pb-4">
          <p className="text-sm font-medium mb-1">Why unit economics at scale?</p>
          <p className="text-sm text-muted-foreground">
            At scale, small inefficiencies in unit economics compound quickly. Knowing your CAC by channel, LTV by segment, and Net Revenue Retention tells you where to invest and where to cut. NRR above 100% means you can grow without acquiring a single new customer — that is the hallmark of a healthy SaaS business.
          </p>
        </CardContent>
      </Card>

      {!confirmed && (
        <div className="flex items-start gap-3 rounded-lg border border-amber-300 bg-amber-50 dark:bg-amber-950/30 p-4">
          <AlertCircle className="size-4 mt-0.5 text-amber-600 shrink-0" />
          <p className="text-sm text-amber-800 dark:text-amber-300">
            <span className="font-medium text-amber-900 dark:text-amber-200">Review your data. </span>
            Update all figures to reflect your current actuals. If you are joining fresh, build this from your most recent month.
          </p>
        </div>
      )}

      {/* NRR snapshot */}
      {latestNrr && (
        <div className="flex gap-4 flex-wrap">
          {latestNrr.nrr && (
            <div className="flex items-center gap-2">
              <span className="text-sm text-muted-foreground">NRR:</span>
              <Badge variant={nrrBadge(Number(latestNrr.nrr))?.variant ?? "secondary"}>
                {nrrBadge(Number(latestNrr.nrr))?.label ?? `${latestNrr.nrr}%`}
              </Badge>
            </div>
          )}
          {latestNrr.grr && (
            <div className="flex items-center gap-2">
              <span className="text-sm text-muted-foreground">GRR:</span>
              <Badge variant="secondary">{latestNrr.grr}%</Badge>
            </div>
          )}
        </div>
      )}

      {/* CAC by Channel */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-base">CAC by Acquisition Channel</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {data.channels.length === 0 && <p className="text-sm text-muted-foreground">No channels added yet.</p>}
          {data.channels.map((ch, idx) => (
            <div key={idx} className="grid gap-3 sm:grid-cols-4 items-end border-b pb-3 last:border-0 last:pb-0">
              <div className="space-y-1">
                <Label className="text-xs">Channel</Label>
                <Input placeholder="Outbound SDR" value={ch.name} onChange={(e) => updateChannel(idx, "name", e.target.value)} disabled={isReadOnly} />
              </div>
              <div className="space-y-1">
                <Label className="text-xs">CAC ($)</Label>
                <Input type="number" min="0" placeholder="8000" value={ch.cac} onChange={(e) => updateChannel(idx, "cac", e.target.value)} disabled={isReadOnly} />
              </div>
              <div className="space-y-1">
                <Label className="text-xs">Payback (months)</Label>
                <Input type="number" min="0" placeholder="12" value={ch.payback_months} onChange={(e) => updateChannel(idx, "payback_months", e.target.value)} disabled={isReadOnly} />
              </div>
              <div className="flex items-end gap-2">
                {ch.payback_months && (
                  <Badge variant={Number(ch.payback_months) <= 12 ? "default" : Number(ch.payback_months) <= 18 ? "secondary" : "destructive"} className="text-xs">
                    {Number(ch.payback_months) <= 12 ? "Good" : Number(ch.payback_months) <= 18 ? "Marginal" : "High"}
                  </Badge>
                )}
                {!isReadOnly && (
                  <Button size="sm" variant="ghost" onClick={() => removeChannel(idx)}>
                    <Trash2 className="size-3.5" />
                  </Button>
                )}
              </div>
            </div>
          ))}
          {!isReadOnly && (
            <Button size="sm" variant="outline" onClick={addChannel}>
              <PlusCircle className="size-4" />Add Channel
            </Button>
          )}
        </CardContent>
      </Card>

      {/* LTV by Segment */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-base">LTV by Customer Segment</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {data.segments.length === 0 && <p className="text-sm text-muted-foreground">No segments added yet.</p>}
          {data.segments.map((seg, idx) => {
            const arpa = Number(seg.arpa) || 0;
            const gm = Number(seg.gross_margin_pct) || 0;
            const churn = Number(seg.churn_pct) || 0;
            const ltv = churn > 0 ? (arpa * (gm / 100)) / (churn / 100) : null;
            const bestCac = data.channels.reduce((min, c) => Math.min(min, Number(c.cac) || Infinity), Infinity);
            const ltvCac = ltv !== null && bestCac < Infinity ? ltv / bestCac : null;
            const ltvCacB = ltvCacBadge(ltvCac);
            return (
              <div key={idx} className="rounded-lg border p-3 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">{seg.name || `Segment ${idx + 1}`}</span>
                  <div className="flex items-center gap-2">
                    {ltvCacB && <Badge variant={ltvCacB.variant} className="text-xs">{ltvCacB.label}</Badge>}
                    {!isReadOnly && (
                      <Button size="sm" variant="ghost" onClick={() => removeSegment(idx)}>
                        <Trash2 className="size-3.5" />
                      </Button>
                    )}
                  </div>
                </div>
                <div className="grid gap-3 sm:grid-cols-4">
                  <div className="space-y-1">
                    <Label className="text-xs">Segment name</Label>
                    <Input placeholder="Enterprise" value={seg.name} onChange={(e) => updateSegment(idx, "name", e.target.value)} disabled={isReadOnly} />
                  </div>
                  <div className="space-y-1">
                    <Label className="text-xs">ARPA/month ($)</Label>
                    <Input type="number" min="0" placeholder="5000" value={seg.arpa} onChange={(e) => updateSegment(idx, "arpa", e.target.value)} disabled={isReadOnly} />
                  </div>
                  <div className="space-y-1">
                    <Label className="text-xs">Gross margin (%)</Label>
                    <Input type="number" min="0" max="100" placeholder="70" value={seg.gross_margin_pct} onChange={(e) => updateSegment(idx, "gross_margin_pct", e.target.value)} disabled={isReadOnly} />
                  </div>
                  <div className="space-y-1">
                    <Label className="text-xs">Monthly churn (%)</Label>
                    <Input type="number" min="0" max="100" placeholder="2" value={seg.churn_pct} onChange={(e) => updateSegment(idx, "churn_pct", e.target.value)} disabled={isReadOnly} />
                  </div>
                </div>
                {ltv !== null && (
                  <p className="text-xs text-muted-foreground">LTV: <span className="font-medium text-foreground">${Math.round(ltv).toLocaleString()}</span></p>
                )}
              </div>
            );
          })}
          {!isReadOnly && (
            <Button size="sm" variant="outline" onClick={addSegment}>
              <PlusCircle className="size-4" />Add Segment
            </Button>
          )}
        </CardContent>
      </Card>

      {/* NRR / GRR History */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-base">Net & Gross Revenue Retention</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <p className="text-xs text-muted-foreground">Target: NRR ≥100% (best-in-class ≥120%) · GRR ≥85%</p>
          {data.nrr_history.length === 0 && <p className="text-sm text-muted-foreground">No entries yet. Log your monthly retention figures.</p>}
          {data.nrr_history.map((e, idx) => (
            <div key={idx} className="grid gap-3 sm:grid-cols-4 items-end border-b pb-3 last:border-0 last:pb-0">
              <div className="space-y-1">
                <Label className="text-xs">Period</Label>
                <Input type="month" value={e.period} onChange={(ev) => updateNrr(idx, "period", ev.target.value)} disabled={isReadOnly} />
              </div>
              <div className="space-y-1">
                <Label className="text-xs">NRR (%)</Label>
                <Input type="number" min="0" placeholder="110" value={e.nrr} onChange={(ev) => updateNrr(idx, "nrr", ev.target.value)} disabled={isReadOnly} />
              </div>
              <div className="space-y-1">
                <Label className="text-xs">GRR (%)</Label>
                <Input type="number" min="0" placeholder="90" value={e.grr} onChange={(ev) => updateNrr(idx, "grr", ev.target.value)} disabled={isReadOnly} />
              </div>
              <div className="flex gap-2">
                {e.nrr && <Badge variant={nrrBadge(Number(e.nrr))?.variant ?? "secondary"} className="text-xs">{Number(e.nrr)}%</Badge>}
                {!isReadOnly && (
                  <Button size="sm" variant="ghost" onClick={() => removeNrr(idx)}>
                    <Trash2 className="size-3.5" />
                  </Button>
                )}
              </div>
            </div>
          ))}
          {!isReadOnly && (
            <Button size="sm" variant="outline" onClick={addNrrEntry}>
              <PlusCircle className="size-4" />Log Period
            </Button>
          )}
        </CardContent>
      </Card>

      <Separator />

      {!isReadOnly && (
        <Button onClick={handleSave} disabled={saving}>
          {saving ? <><Loader2 className="size-4 animate-spin" />Saving...</> : saved ? <><Check className="size-4" />Saved</> : <><Save className="size-4" />Save</>}
        </Button>
      )}
    </div>
  );
}
