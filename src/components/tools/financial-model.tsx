"use client";

import { useState } from "react";
import { Save, Loader2, Check, Plus, Trash2, Download } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

interface RevenueStream {
  id: string;
  name: string;
  month1: string;
  month3: string;
  month6: string;
  month12: string;
  month18: string;
  month24: string;
  year3: string;
  year4: string;
  year5: string;
}

interface CostItem {
  id: string;
  name: string;
  type: "fixed" | "variable";
  monthly: string;
}

interface FMData {
  revenue_streams: RevenueStream[];
  cost_items: CostItem[];
  growth_rate_pct: string;
  churn_rate_pct: string;
  cac: string;
  hiring_plan: string;
  key_assumptions: string;
  break_even_notes: string;
}

function parseData(raw: Record<string, unknown>): FMData {
  return {
    revenue_streams: (raw.revenue_streams as RevenueStream[]) ?? [
      { id: "1", name: "Primary revenue stream", month1: "", month3: "", month6: "", month12: "", month18: "", month24: "", year3: "", year4: "", year5: "" },
    ],
    cost_items: (raw.cost_items as CostItem[]) ?? [
      { id: "1", name: "Salaries", type: "fixed", monthly: "" },
      { id: "2", name: "Infrastructure / hosting", type: "fixed", monthly: "" },
      { id: "3", name: "Sales & marketing", type: "variable", monthly: "" },
    ],
    growth_rate_pct: (raw.growth_rate_pct as string) ?? "",
    churn_rate_pct: (raw.churn_rate_pct as string) ?? "",
    cac: (raw.cac as string) ?? "",
    hiring_plan: (raw.hiring_plan as string) ?? "",
    key_assumptions: (raw.key_assumptions as string) ?? "",
    break_even_notes: (raw.break_even_notes as string) ?? "",
  };
}

function uid() {
  return Math.random().toString(36).slice(2, 9);
}

function fmt(val: string): string {
  const n = parseFloat(val);
  if (isNaN(n)) return "—";
  return `R ${n.toLocaleString("en-ZA", { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`;
}

function sum(streams: RevenueStream[], key: keyof RevenueStream): number {
  return streams.reduce((acc, s) => acc + (parseFloat(s[key] as string) || 0), 0);
}

function totalCosts(items: CostItem[]): number {
  return items.reduce((acc, c) => acc + (parseFloat(c.monthly) || 0), 0);
}

const MONTHS: { key: keyof RevenueStream; label: string }[] = [
  { key: "month1", label: "M1" },
  { key: "month3", label: "M3" },
  { key: "month6", label: "M6" },
  { key: "month12", label: "M12" },
  { key: "month18", label: "M18" },
  { key: "month24", label: "M24" },
];
const YEARS: { key: keyof RevenueStream; label: string }[] = [
  { key: "year3", label: "Yr 3" },
  { key: "year4", label: "Yr 4" },
  { key: "year5", label: "Yr 5" },
];

export function FinancialModel({ teamId, userId, isReadOnly, existingArtifact }: {
  teamId: string; userId: string; isReadOnly: boolean;
  existingArtifact: { id: string; data: Record<string, unknown> } | null;
}) {
  const [data, setData] = useState<FMData>(() => parseData(existingArtifact?.data ?? {}));
  const [artifactId, setArtifactId] = useState(existingArtifact?.id ?? null);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const supabase = createClient();

  async function handleSave() {
    setSaving(true);
    if (artifactId) {
      await supabase.from("artifacts").update({ data: data as unknown as Record<string, unknown>, updated_at: new Date().toISOString() }).eq("id", artifactId);
    } else {
      const { data: a } = await supabase.from("artifacts").insert({ team_id: teamId, artifact_type: "financial_model", title: "Financial Model", data: data as unknown as Record<string, unknown>, created_by: userId }).select("id").single();
      if (a) setArtifactId(a.id);
    }
    setSaving(false);
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  }

  function updateStream(id: string, field: keyof RevenueStream, value: string) {
    setData((prev) => ({ ...prev, revenue_streams: prev.revenue_streams.map((s) => s.id === id ? { ...s, [field]: value } : s) }));
    setSaved(false);
  }

  function addStream() {
    setData((prev) => ({ ...prev, revenue_streams: [...prev.revenue_streams, { id: uid(), name: "New stream", month1: "", month3: "", month6: "", month12: "", month18: "", month24: "", year3: "", year4: "", year5: "" }] }));
    setSaved(false);
  }

  function removeStream(id: string) {
    setData((prev) => ({ ...prev, revenue_streams: prev.revenue_streams.filter((s) => s.id !== id) }));
    setSaved(false);
  }

  function updateCost(id: string, field: keyof CostItem, value: string) {
    setData((prev) => ({ ...prev, cost_items: prev.cost_items.map((c) => c.id === id ? { ...c, [field]: value } : c) }));
    setSaved(false);
  }

  function addCost() {
    setData((prev) => ({ ...prev, cost_items: [...prev.cost_items, { id: uid(), name: "New cost", type: "fixed", monthly: "" }] }));
    setSaved(false);
  }

  function removeCost(id: string) {
    setData((prev) => ({ ...prev, cost_items: prev.cost_items.filter((c) => c.id !== id) }));
    setSaved(false);
  }

  function updateField(field: keyof FMData, value: string) {
    setData((prev) => ({ ...prev, [field]: value }));
    setSaved(false);
  }

  const totalCostsMonthly = totalCosts(data.cost_items);
  const rev12 = sum(data.revenue_streams, "month12");
  const rev24 = sum(data.revenue_streams, "month24");
  const grossMargin12 = rev12 - totalCostsMonthly;

  return (
    <div className="space-y-6">
      <Tabs defaultValue="revenue">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="revenue">Revenue</TabsTrigger>
          <TabsTrigger value="costs">Costs</TabsTrigger>
          <TabsTrigger value="assumptions">Assumptions</TabsTrigger>
          <TabsTrigger value="summary">Summary</TabsTrigger>
        </TabsList>

        {/* Revenue Tab */}
        <TabsContent value="revenue" className="space-y-4">
          <div>
            <p className="text-xs text-muted-foreground mb-3">Enter projected monthly revenue (R) per stream at each milestone. Use monthly revenue figures — not cumulative.</p>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b">
                    <th className="text-left py-2 pr-3 font-medium min-w-[160px]">Stream</th>
                    {MONTHS.map((m) => (
                      <th key={m.key} className="text-right py-2 px-1 font-medium min-w-[70px]">{m.label}</th>
                    ))}
                    {YEARS.map((y) => (
                      <th key={y.key} className="text-right py-2 px-1 font-medium min-w-[70px] text-muted-foreground">{y.label}</th>
                    ))}
                    {!isReadOnly && <th className="w-8" />}
                  </tr>
                </thead>
                <tbody>
                  {data.revenue_streams.map((stream) => (
                    <tr key={stream.id} className="border-b last:border-0">
                      <td className="py-1.5 pr-3">
                        <Input
                          value={stream.name}
                          onChange={(e) => updateStream(stream.id, "name", e.target.value)}
                          disabled={isReadOnly}
                          className="h-7 text-sm"
                        />
                      </td>
                      {MONTHS.map((m) => (
                        <td key={m.key} className="py-1.5 px-1">
                          <Input
                            type="number"
                            placeholder="0"
                            value={stream[m.key] as string}
                            onChange={(e) => updateStream(stream.id, m.key, e.target.value)}
                            disabled={isReadOnly}
                            className="h-7 text-sm text-right w-full"
                          />
                        </td>
                      ))}
                      {YEARS.map((y) => (
                        <td key={y.key} className="py-1.5 px-1">
                          <Input
                            type="number"
                            placeholder="0"
                            value={stream[y.key] as string}
                            onChange={(e) => updateStream(stream.id, y.key, e.target.value)}
                            disabled={isReadOnly}
                            className="h-7 text-sm text-right w-full bg-muted/30"
                          />
                        </td>
                      ))}
                      {!isReadOnly && (
                        <td className="py-1.5 pl-1">
                          <Button variant="ghost" size="icon" className="size-7" onClick={() => removeStream(stream.id)} disabled={data.revenue_streams.length === 1}>
                            <Trash2 className="size-3" />
                          </Button>
                        </td>
                      )}
                    </tr>
                  ))}
                  <tr className="font-medium bg-muted/30">
                    <td className="py-2 pr-3 text-sm">Total</td>
                    {MONTHS.map((m) => (
                      <td key={m.key} className="py-2 px-1 text-right text-sm">
                        {fmt(sum(data.revenue_streams, m.key).toString())}
                      </td>
                    ))}
                    {YEARS.map((y) => (
                      <td key={y.key} className="py-2 px-1 text-right text-sm text-muted-foreground">
                        {fmt(sum(data.revenue_streams, y.key).toString())}
                      </td>
                    ))}
                    {!isReadOnly && <td />}
                  </tr>
                </tbody>
              </table>
            </div>
            {!isReadOnly && (
              <Button variant="outline" size="sm" className="mt-3" onClick={addStream}>
                <Plus className="size-3 mr-1" />Add revenue stream
              </Button>
            )}
          </div>
        </TabsContent>

        {/* Costs Tab */}
        <TabsContent value="costs" className="space-y-4">
          <p className="text-xs text-muted-foreground">Enter your current monthly cost structure. Tag each item as fixed or variable.</p>
          <div className="space-y-2">
            {data.cost_items.map((cost) => (
              <div key={cost.id} className="flex items-center gap-2">
                <Input
                  value={cost.name}
                  onChange={(e) => updateCost(cost.id, "name", e.target.value)}
                  disabled={isReadOnly}
                  placeholder="Cost item"
                  className="flex-1"
                />
                <select
                  value={cost.type}
                  onChange={(e) => updateCost(cost.id, "type", e.target.value)}
                  disabled={isReadOnly}
                  className="h-9 rounded-md border border-input bg-background px-3 text-sm"
                >
                  <option value="fixed">Fixed</option>
                  <option value="variable">Variable</option>
                </select>
                <div className="flex items-center gap-1">
                  <span className="text-sm text-muted-foreground shrink-0">R</span>
                  <Input
                    type="number"
                    placeholder="0"
                    value={cost.monthly}
                    onChange={(e) => updateCost(cost.id, "monthly", e.target.value)}
                    disabled={isReadOnly}
                    className="w-28"
                  />
                  <span className="text-xs text-muted-foreground shrink-0">/mo</span>
                </div>
                {!isReadOnly && (
                  <Button variant="ghost" size="icon" className="size-8 shrink-0" onClick={() => removeCost(cost.id)}>
                    <Trash2 className="size-3.5" />
                  </Button>
                )}
              </div>
            ))}
          </div>
          {!isReadOnly && (
            <Button variant="outline" size="sm" onClick={addCost}>
              <Plus className="size-3 mr-1" />Add cost item
            </Button>
          )}
          <Separator />
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium">Total monthly costs</span>
            <span className="text-sm font-bold">{fmt(totalCostsMonthly.toString())}</span>
          </div>
          <div className="flex items-center justify-between text-xs text-muted-foreground">
            <span>Fixed costs</span>
            <span>{fmt(data.cost_items.filter((c) => c.type === "fixed").reduce((a, c) => a + (parseFloat(c.monthly) || 0), 0).toString())}</span>
          </div>
          <div className="flex items-center justify-between text-xs text-muted-foreground">
            <span>Variable costs</span>
            <span>{fmt(data.cost_items.filter((c) => c.type === "variable").reduce((a, c) => a + (parseFloat(c.monthly) || 0), 0).toString())}</span>
          </div>
        </TabsContent>

        {/* Assumptions Tab */}
        <TabsContent value="assumptions" className="space-y-5">
          <div className="grid gap-4 sm:grid-cols-3">
            <div className="space-y-1.5">
              <Label>Monthly growth rate (%)</Label>
              <Input type="number" placeholder="e.g. 10" value={data.growth_rate_pct} onChange={(e) => updateField("growth_rate_pct", e.target.value)} disabled={isReadOnly} />
            </div>
            <div className="space-y-1.5">
              <Label>Monthly churn rate (%)</Label>
              <Input type="number" placeholder="e.g. 5" value={data.churn_rate_pct} onChange={(e) => updateField("churn_rate_pct", e.target.value)} disabled={isReadOnly} />
            </div>
            <div className="space-y-1.5">
              <Label>CAC (R)</Label>
              <Input type="number" placeholder="Cost to acquire a customer" value={data.cac} onChange={(e) => updateField("cac", e.target.value)} disabled={isReadOnly} />
            </div>
          </div>
          <Separator />
          <div className="space-y-1.5">
            <Label>Hiring plan</Label>
            <p className="text-xs text-muted-foreground">Who are you planning to hire and when? Include role, timing, and estimated cost.</p>
            <textarea
              className="w-full min-h-[80px] rounded-md border border-input bg-background px-3 py-2 text-sm resize-y disabled:opacity-50"
              placeholder="e.g. Month 6: Junior developer (R25k/mo); Month 12: Sales rep (R20k/mo + commission)"
              value={data.hiring_plan}
              onChange={(e) => updateField("hiring_plan", e.target.value)}
              disabled={isReadOnly}
              rows={3}
            />
          </div>
          <div className="space-y-1.5">
            <Label>Key assumptions</Label>
            <p className="text-xs text-muted-foreground">What are the critical assumptions that drive these projections? What must be true for these numbers to hold?</p>
            <textarea
              className="w-full min-h-[80px] rounded-md border border-input bg-background px-3 py-2 text-sm resize-y disabled:opacity-50"
              placeholder="e.g. Average deal size R8,000/mo; 30-day sales cycle; 80% gross margin on software; SA market of 5,000 addressable SMEs"
              value={data.key_assumptions}
              onChange={(e) => updateField("key_assumptions", e.target.value)}
              disabled={isReadOnly}
              rows={4}
            />
          </div>
          <div className="space-y-1.5">
            <Label>Break-even analysis</Label>
            <p className="text-xs text-muted-foreground">Based on your projections, when do you reach cash flow break-even? What is the minimum revenue needed?</p>
            <textarea
              className="w-full min-h-[80px] rounded-md border border-input bg-background px-3 py-2 text-sm resize-y disabled:opacity-50"
              placeholder="e.g. We reach break-even at Month 18 with 45 paying customers at R8k/mo average. Monthly burn until then is R180k."
              value={data.break_even_notes}
              onChange={(e) => updateField("break_even_notes", e.target.value)}
              disabled={isReadOnly}
              rows={3}
            />
          </div>
        </TabsContent>

        {/* Summary Tab */}
        <TabsContent value="summary" className="space-y-4">
          <p className="text-xs text-muted-foreground">Computed from your revenue and cost inputs. Fill in the Revenue and Costs tabs to see figures here.</p>
          <div className="grid gap-3 sm:grid-cols-2">
            {[
              { label: "Revenue at Month 12", value: fmt(rev12.toString()), sub: "Monthly run rate" },
              { label: "Revenue at Month 24", value: fmt(rev24.toString()), sub: "Monthly run rate" },
              { label: "Total monthly costs", value: fmt(totalCostsMonthly.toString()), sub: "Current structure" },
              {
                label: "Gross P&L at Month 12",
                value: fmt(grossMargin12.toString()),
                sub: "Revenue minus total costs",
                highlight: grossMargin12 >= 0 ? "positive" : "negative",
              },
            ].map((item) => (
              <div key={item.label} className="rounded-lg border p-4">
                <p className="text-xs text-muted-foreground">{item.label}</p>
                <p className={`text-xl font-bold mt-1 ${item.highlight === "positive" ? "text-green-600" : item.highlight === "negative" ? "text-destructive" : ""}`}>
                  {item.value}
                </p>
                <p className="text-xs text-muted-foreground mt-0.5">{item.sub}</p>
              </div>
            ))}
          </div>
          <Separator />
          <div className="space-y-2">
            <p className="text-sm font-medium">Revenue by stream at Month 24</p>
            {data.revenue_streams.map((s) => {
              const v = parseFloat(s.month24) || 0;
              const total = sum(data.revenue_streams, "month24") || 1;
              return (
                <div key={s.id} className="space-y-1">
                  <div className="flex justify-between text-xs">
                    <span>{s.name}</span>
                    <span>{fmt(v.toString())} ({Math.round((v / total) * 100)}%)</span>
                  </div>
                  <div className="h-1.5 rounded-full bg-muted overflow-hidden">
                    <div className="h-full bg-primary rounded-full" style={{ width: `${Math.round((v / total) * 100)}%` }} />
                  </div>
                </div>
              );
            })}
          </div>
          {data.key_assumptions && (
            <>
              <Separator />
              <div className="space-y-1">
                <p className="text-sm font-medium">Key assumptions</p>
                <p className="text-sm text-muted-foreground whitespace-pre-wrap">{data.key_assumptions}</p>
              </div>
            </>
          )}
          {data.break_even_notes && (
            <>
              <Separator />
              <div className="space-y-1">
                <p className="text-sm font-medium">Break-even</p>
                <p className="text-sm text-muted-foreground whitespace-pre-wrap">{data.break_even_notes}</p>
              </div>
            </>
          )}
          <div className="rounded-lg border border-amber-200 bg-amber-50 p-3 text-xs text-amber-800">
            <strong>Note:</strong> This is a narrative financial model — it generates the content for your financial slides and investor conversations, not a full spreadsheet model. Use Google Sheets or Excel for detailed modelling.
          </div>
        </TabsContent>
      </Tabs>

      <div className="flex items-center gap-3">
        {!isReadOnly && (
          <Button onClick={handleSave} disabled={saving}>
            {saving ? <><Loader2 className="size-4 animate-spin" />Saving...</> : saved ? <><Check className="size-4" />Saved</> : <><Save className="size-4" />Save Financial Model</>}
          </Button>
        )}
        {artifactId && (
          <a
            href={`/api/artifacts/${artifactId}/export`}
            className="inline-flex items-center gap-1.5 rounded-md border border-input bg-background px-3 py-2 text-sm font-medium hover:bg-accent transition-colors"
          >
            <Download className="size-4" />Download .docx
          </a>
        )}
      </div>
    </div>
  );
}
