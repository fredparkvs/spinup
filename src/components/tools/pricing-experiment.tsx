"use client";

import { useState } from "react";
import { Save, Loader2, Check } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

interface PEData {
  pricing_hypothesis: string;
  price_point: string;
  experiment_design: string;
  experiment_type: string;
  outcome: string;
  outcome_result: string;
  adjusted_pricing: string;
  pricing_model: string;
}

function parseData(raw: Record<string, unknown>): PEData {
  return {
    pricing_hypothesis: (raw.pricing_hypothesis as string) ?? "",
    price_point: (raw.price_point as string) ?? "",
    experiment_design: (raw.experiment_design as string) ?? "",
    experiment_type: (raw.experiment_type as string) ?? "",
    outcome: (raw.outcome as string) ?? "",
    outcome_result: (raw.outcome_result as string) ?? "",
    adjusted_pricing: (raw.adjusted_pricing as string) ?? "",
    pricing_model: (raw.pricing_model as string) ?? "",
  };
}

export function PricingExperiment({ teamId, userId, isReadOnly, existingArtifact }: {
  teamId: string; userId: string; isReadOnly: boolean;
  existingArtifact: { id: string; data: Record<string, unknown> } | null;
}) {
  const [data, setData] = useState<PEData>(() => parseData(existingArtifact?.data ?? {}));
  const [artifactId, setArtifactId] = useState(existingArtifact?.id ?? null);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const supabase = createClient();

  function update(field: keyof PEData, value: string) {
    setData((prev) => ({ ...prev, [field]: value }));
    setSaved(false);
  }

  async function handleSave() {
    setSaving(true);
    if (artifactId) {
      await supabase.from("artifacts").update({ data: data as unknown as Record<string, unknown>, updated_at: new Date().toISOString() }).eq("id", artifactId);
    } else {
      const { data: a } = await supabase.from("artifacts").insert({ team_id: teamId, artifact_type: "pricing_experiment", title: "Pricing Experiment", data: data as unknown as Record<string, unknown>, created_by: userId }).select("id").single();
      if (a) setArtifactId(a.id);
    }
    setSaving(false);
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  }

  return (
    <div className="space-y-5">
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-2 sm:col-span-2">
          <Label>Pricing hypothesis</Label>
          <p className="text-xs text-muted-foreground">Complete this sentence:</p>
          <div className="flex items-center gap-2">
            <span className="text-sm text-muted-foreground shrink-0">We believe customers will pay</span>
            <Input placeholder="R ___" value={data.price_point} onChange={(e) => update("price_point", e.target.value)} disabled={isReadOnly} className="w-28" />
            <span className="text-sm text-muted-foreground shrink-0">per</span>
            <Input placeholder="month / use / outcome" value={data.pricing_hypothesis} onChange={(e) => update("pricing_hypothesis", e.target.value)} disabled={isReadOnly} />
          </div>
        </div>
      </div>

      <Separator />

      <div className="space-y-2">
        <Label>Experiment design</Label>
        <Select value={data.experiment_type} onValueChange={(v) => update("experiment_type", v)} disabled={isReadOnly}>
          <SelectTrigger><SelectValue placeholder="Choose experiment type..." /></SelectTrigger>
          <SelectContent>
            <SelectItem value="direct_ask">Direct ask (tell them the price, ask if they&apos;d buy)</SelectItem>
            <SelectItem value="anchor_test">Anchor test (show high / medium / low tiers)</SelectItem>
            <SelectItem value="fake_door">Fake door (show pricing page, measure click-through)</SelectItem>
            <SelectItem value="pilot_invoice">Pilot invoice (send actual invoice before building)</SelectItem>
          </SelectContent>
        </Select>
        <Textarea placeholder="Describe exactly how you'll run this experiment..." value={data.experiment_design} onChange={(e) => update("experiment_design", e.target.value)} disabled={isReadOnly} rows={3} />
      </div>

      <Separator />

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-2">
          <Label>Outcome result</Label>
          <Select value={data.outcome_result} onValueChange={(v) => update("outcome_result", v)} disabled={isReadOnly}>
            <SelectTrigger><SelectValue placeholder="Select outcome..." /></SelectTrigger>
            <SelectContent>
              <SelectItem value="confirmed">Confirmed — customers accepted the price</SelectItem>
              <SelectItem value="too_high">Too high — significant resistance</SelectItem>
              <SelectItem value="too_low">Too low — customers expected more</SelectItem>
              <SelectItem value="mixed">Mixed — varied by segment</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-2">
          <Label>Pricing model</Label>
          <Select value={data.pricing_model} onValueChange={(v) => update("pricing_model", v)} disabled={isReadOnly}>
            <SelectTrigger><SelectValue placeholder="Select model..." /></SelectTrigger>
            <SelectContent>
              <SelectItem value="subscription">Subscription (monthly / annual)</SelectItem>
              <SelectItem value="one_time">One-time payment</SelectItem>
              <SelectItem value="usage_based">Usage-based / pay per use</SelectItem>
              <SelectItem value="outcome_based">Outcome-based (share of savings / revenue)</SelectItem>
              <SelectItem value="freemium">Freemium</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="space-y-2">
        <Label>What we learned</Label>
        <Textarea placeholder="What happened? What surprised you? What will you change?" value={data.outcome} onChange={(e) => update("outcome", e.target.value)} disabled={isReadOnly} rows={3} />
      </div>

      <div className="space-y-2">
        <Label>Adjusted pricing hypothesis</Label>
        <Textarea placeholder="What is your revised pricing hypothesis based on these results?" value={data.adjusted_pricing} onChange={(e) => update("adjusted_pricing", e.target.value)} disabled={isReadOnly} rows={2} />
      </div>

      {!isReadOnly && (
        <Button onClick={handleSave} disabled={saving}>
          {saving ? <><Loader2 className="size-4 animate-spin" />Saving...</> : saved ? <><Check className="size-4" />Saved</> : <><Save className="size-4" />Save</>}
        </Button>
      )}
    </div>
  );
}
