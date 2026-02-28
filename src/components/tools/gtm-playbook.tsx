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

type Tab = "icp" | "channels" | "qualification" | "messaging" | "pricing" | "onboarding";

interface Channel {
  name: string;
  cac: string;
  monthly_volume: string;
  notes: string;
}

interface IcpData {
  company_size: string;
  industry: string;
  geographies: string;
  buyer_title: string;
  champion_title: string;
  pain_primary: string;
  pain_secondary: string;
  trigger_events: string;
  disqualifiers: string;
}

interface QualData {
  must_have: string;
  nice_to_have: string;
  deal_killers: string;
  qualification_questions: string;
}

interface MessagingData {
  headline: string;
  value_prop_one_liner: string;
  proof_points: string;
  objection_price: string;
  objection_timing: string;
  objection_competitor: string;
  objection_diy: string;
}

interface PricingData {
  model: string;
  entry_price: string;
  expansion_motion: string;
  discount_policy: string;
  packaging_notes: string;
}

interface OnboardingData {
  time_to_value_days: string;
  activation_milestone: string;
  steps: string;
  success_metrics: string;
}

interface GtmData {
  icp: IcpData;
  channels: Channel[];
  qualification: QualData;
  messaging: MessagingData;
  pricing: PricingData;
  onboarding: OnboardingData;
}

const DEFAULT_ICP: IcpData = { company_size: "", industry: "", geographies: "", buyer_title: "", champion_title: "", pain_primary: "", pain_secondary: "", trigger_events: "", disqualifiers: "" };
const DEFAULT_QUAL: QualData = { must_have: "", nice_to_have: "", deal_killers: "", qualification_questions: "" };
const DEFAULT_MSG: MessagingData = { headline: "", value_prop_one_liner: "", proof_points: "", objection_price: "", objection_timing: "", objection_competitor: "", objection_diy: "" };
const DEFAULT_PRICING: PricingData = { model: "", entry_price: "", expansion_motion: "", discount_policy: "", packaging_notes: "" };
const DEFAULT_ONBOARDING: OnboardingData = { time_to_value_days: "", activation_milestone: "", steps: "", success_metrics: "" };

function parseData(raw: Record<string, unknown>): GtmData {
  return {
    icp: (raw.icp as IcpData) ?? DEFAULT_ICP,
    channels: (raw.channels as Channel[]) ?? [],
    qualification: (raw.qualification as QualData) ?? DEFAULT_QUAL,
    messaging: (raw.messaging as MessagingData) ?? DEFAULT_MSG,
    pricing: (raw.pricing as PricingData) ?? DEFAULT_PRICING,
    onboarding: (raw.onboarding as OnboardingData) ?? DEFAULT_ONBOARDING,
  };
}

const TABS: { id: Tab; label: string }[] = [
  { id: "icp", label: "Ideal Customer" },
  { id: "channels", label: "Channels & CAC" },
  { id: "qualification", label: "Qualification" },
  { id: "messaging", label: "Messaging" },
  { id: "pricing", label: "Pricing" },
  { id: "onboarding", label: "Onboarding" },
];

function Field({ label, value, onChange, disabled, multiline, placeholder }: {
  label: string; value: string; onChange: (v: string) => void; disabled: boolean; multiline?: boolean; placeholder?: string;
}) {
  return (
    <div className="space-y-1.5">
      <Label className="text-sm">{label}</Label>
      {multiline
        ? <Textarea rows={3} placeholder={placeholder} value={value} onChange={(e) => onChange(e.target.value)} disabled={disabled} />
        : <Input placeholder={placeholder} value={value} onChange={(e) => onChange(e.target.value)} disabled={disabled} />
      }
    </div>
  );
}

export function GtmPlaybook({
  teamId, userId, isReadOnly, existingArtifact,
}: {
  teamId: string; userId: string; isReadOnly: boolean;
  existingArtifact: { id: string; data: Record<string, unknown> } | null;
}) {
  const [data, setData] = useState<GtmData>(() => parseData(existingArtifact?.data ?? {}));
  const [artifactId, setArtifactId] = useState(existingArtifact?.id ?? null);
  const [activeTab, setActiveTab] = useState<Tab>("icp");
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [confirmed, setConfirmed] = useState(!!existingArtifact);
  const supabase = createClient();

  function updateIcp(field: keyof IcpData, value: string) {
    setData((p) => ({ ...p, icp: { ...p.icp, [field]: value } }));
    setSaved(false);
  }
  function updateQual(field: keyof QualData, value: string) {
    setData((p) => ({ ...p, qualification: { ...p.qualification, [field]: value } }));
    setSaved(false);
  }
  function updateMsg(field: keyof MessagingData, value: string) {
    setData((p) => ({ ...p, messaging: { ...p.messaging, [field]: value } }));
    setSaved(false);
  }
  function updatePricing(field: keyof PricingData, value: string) {
    setData((p) => ({ ...p, pricing: { ...p.pricing, [field]: value } }));
    setSaved(false);
  }
  function updateOnboarding(field: keyof OnboardingData, value: string) {
    setData((p) => ({ ...p, onboarding: { ...p.onboarding, [field]: value } }));
    setSaved(false);
  }
  function addChannel() {
    setData((p) => ({ ...p, channels: [...p.channels, { name: "", cac: "", monthly_volume: "", notes: "" }] }));
    setSaved(false);
  }
  function updateChannel(idx: number, field: keyof Channel, value: string) {
    setData((p) => {
      const channels = p.channels.map((c, i) => i === idx ? { ...c, [field]: value } : c);
      return { ...p, channels };
    });
    setSaved(false);
  }
  function removeChannel(idx: number) {
    setData((p) => ({ ...p, channels: p.channels.filter((_, i) => i !== idx) }));
    setSaved(false);
  }

  async function handleSave() {
    setSaving(true);
    if (artifactId) {
      await supabase.from("artifacts").update({ data: data as unknown as Record<string, unknown>, updated_at: new Date().toISOString() }).eq("id", artifactId);
    } else {
      const { data: a } = await supabase.from("artifacts").insert({ team_id: teamId, artifact_type: "gtm_playbook", title: "GTM Playbook", data: data as unknown as Record<string, unknown>, created_by: userId }).select("id").single();
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
          <p className="text-sm font-medium mb-1">Why a GTM playbook?</p>
          <p className="text-sm text-muted-foreground">
            Scaling sales without a codified playbook means every new rep reinvents the wheel. A GTM playbook documents who you sell to, how you find them, how you qualify and close them, and how you get them to value fast. It is the foundation for predictable, repeatable revenue growth.
          </p>
        </CardContent>
      </Card>

      {/* Data review banner */}
      {!confirmed && (
        <div className="flex items-start gap-3 rounded-lg border border-amber-300 bg-amber-50 dark:bg-amber-950/30 p-4">
          <AlertCircle className="size-4 mt-0.5 text-amber-600 shrink-0" />
          <div className="text-sm">
            <p className="font-medium text-amber-900 dark:text-amber-200">Review and update your GTM data</p>
            <p className="text-amber-800 dark:text-amber-300 mt-0.5">
              Review and confirm each section. If you are joining fresh, fill this in from scratch based on your current go-to-market motion.
            </p>
          </div>
        </div>
      )}

      {/* Tabs */}
      <div className="flex flex-wrap gap-2">
        {TABS.map((t) => (
          <button
            key={t.id}
            onClick={() => setActiveTab(t.id)}
            className={`px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${activeTab === t.id ? "bg-primary text-primary-foreground" : "bg-muted hover:bg-muted/80"}`}
          >
            {t.label}
          </button>
        ))}
      </div>

      <Card>
        <CardContent className="pt-4 space-y-4">
          {activeTab === "icp" && (
            <>
              <CardTitle className="text-base">Ideal Customer Profile</CardTitle>
              <div className="grid gap-4 sm:grid-cols-2">
                <Field label="Company size (employees)" value={data.icp.company_size} onChange={(v) => updateIcp("company_size", v)} disabled={isReadOnly} placeholder="e.g. 50–500" />
                <Field label="Industry / vertical" value={data.icp.industry} onChange={(v) => updateIcp("industry", v)} disabled={isReadOnly} placeholder="e.g. Financial services, Healthcare" />
                <Field label="Geographies" value={data.icp.geographies} onChange={(v) => updateIcp("geographies", v)} disabled={isReadOnly} placeholder="e.g. US, UK, ANZ" />
                <Field label="Economic buyer title" value={data.icp.buyer_title} onChange={(v) => updateIcp("buyer_title", v)} disabled={isReadOnly} placeholder="e.g. CFO, VP Operations" />
                <Field label="Champion / user title" value={data.icp.champion_title} onChange={(v) => updateIcp("champion_title", v)} disabled={isReadOnly} placeholder="e.g. Head of Finance" />
              </div>
              <Field label="Primary pain point" value={data.icp.pain_primary} onChange={(v) => updateIcp("pain_primary", v)} disabled={isReadOnly} multiline placeholder="The #1 problem you solve" />
              <Field label="Secondary pain points" value={data.icp.pain_secondary} onChange={(v) => updateIcp("pain_secondary", v)} disabled={isReadOnly} multiline placeholder="Other pains you address" />
              <Field label="Trigger events (what causes them to buy now?)" value={data.icp.trigger_events} onChange={(v) => updateIcp("trigger_events", v)} disabled={isReadOnly} multiline placeholder="e.g. New regulation, headcount milestone, board pressure" />
              <Field label="Disqualifiers (who you do NOT sell to)" value={data.icp.disqualifiers} onChange={(v) => updateIcp("disqualifiers", v)} disabled={isReadOnly} multiline placeholder="e.g. Bootstrapped, <10 employees, no budget owner" />
            </>
          )}

          {activeTab === "channels" && (
            <>
              <CardTitle className="text-base">Acquisition Channels & CAC</CardTitle>
              {data.channels.length === 0 && (
                <p className="text-sm text-muted-foreground">No channels added yet. Add your acquisition channels below.</p>
              )}
              {data.channels.map((ch, idx) => (
                <div key={idx} className="rounded-lg border p-4 space-y-3">
                  <div className="flex items-center justify-between">
                    <p className="text-sm font-medium">{ch.name || `Channel ${idx + 1}`}</p>
                    {!isReadOnly && (
                      <Button size="sm" variant="ghost" onClick={() => removeChannel(idx)}>
                        <Trash2 className="size-3.5" />
                      </Button>
                    )}
                  </div>
                  <div className="grid gap-3 sm:grid-cols-3">
                    <Field label="Channel name" value={ch.name} onChange={(v) => updateChannel(idx, "name", v)} disabled={isReadOnly} placeholder="e.g. Outbound SDR" />
                    <Field label="Avg CAC ($)" value={ch.cac} onChange={(v) => updateChannel(idx, "cac", v)} disabled={isReadOnly} placeholder="e.g. 8000" />
                    <Field label="Leads/month" value={ch.monthly_volume} onChange={(v) => updateChannel(idx, "monthly_volume", v)} disabled={isReadOnly} placeholder="e.g. 40" />
                  </div>
                  <Field label="Notes" value={ch.notes} onChange={(v) => updateChannel(idx, "notes", v)} disabled={isReadOnly} placeholder="Win rate, payback, observations..." />
                </div>
              ))}
              {!isReadOnly && (
                <Button size="sm" variant="outline" onClick={addChannel}>
                  <PlusCircle className="size-4" />Add Channel
                </Button>
              )}
            </>
          )}

          {activeTab === "qualification" && (
            <>
              <CardTitle className="text-base">Lead Qualification</CardTitle>
              <Field label="Must-have criteria (MEDDIC/BANT must-haves)" value={data.qualification.must_have} onChange={(v) => updateQual("must_have", v)} disabled={isReadOnly} multiline placeholder="They must have X budget, Y pain, Z authority..." />
              <Field label="Nice-to-have criteria" value={data.qualification.nice_to_have} onChange={(v) => updateQual("nice_to_have", v)} disabled={isReadOnly} multiline placeholder="Indicators of faster close or higher ACV" />
              <Field label="Deal killers (immediate disqualification)" value={data.qualification.deal_killers} onChange={(v) => updateQual("deal_killers", v)} disabled={isReadOnly} multiline placeholder="No budget cycle, wrong industry, locked into competitor..." />
              <Field label="Discovery questions to ask" value={data.qualification.qualification_questions} onChange={(v) => updateQual("qualification_questions", v)} disabled={isReadOnly} multiline placeholder="List 5–10 key discovery questions" />
            </>
          )}

          {activeTab === "messaging" && (
            <>
              <CardTitle className="text-base">Messaging & Objection Handling</CardTitle>
              <Field label="Headline (what you do in one line)" value={data.messaging.headline} onChange={(v) => updateMsg("headline", v)} disabled={isReadOnly} placeholder="e.g. The revenue operations platform for mid-market B2B" />
              <Field label="Value proposition (one paragraph)" value={data.messaging.value_prop_one_liner} onChange={(v) => updateMsg("value_prop_one_liner", v)} disabled={isReadOnly} multiline placeholder="For [ICP] who [pain], [Product] is a [category] that [benefit]. Unlike [competitor], [key differentiator]." />
              <Field label="Top 3 proof points / social proof" value={data.messaging.proof_points} onChange={(v) => updateMsg("proof_points", v)} disabled={isReadOnly} multiline placeholder="Customer quotes, case study results, logos, data" />
              <Separator />
              <p className="text-sm font-medium">Objection handling</p>
              <Field label="Price too high" value={data.messaging.objection_price} onChange={(v) => updateMsg("objection_price", v)} disabled={isReadOnly} multiline placeholder="Reframe around ROI / cost of not solving..." />
              <Field label="Bad timing / not a priority" value={data.messaging.objection_timing} onChange={(v) => updateMsg("objection_timing", v)} disabled={isReadOnly} multiline placeholder="What does delay cost them?" />
              <Field label="We use [competitor]" value={data.messaging.objection_competitor} onChange={(v) => updateMsg("objection_competitor", v)} disabled={isReadOnly} multiline placeholder="Key differentiation vs. named competitor" />
              <Field label="We will build it ourselves" value={data.messaging.objection_diy} onChange={(v) => updateMsg("objection_diy", v)} disabled={isReadOnly} multiline placeholder="Cost / risk of build vs. buy analysis" />
            </>
          )}

          {activeTab === "pricing" && (
            <>
              <CardTitle className="text-base">Pricing & Packaging</CardTitle>
              <Field label="Pricing model" value={data.pricing.model} onChange={(v) => updatePricing("model", v)} disabled={isReadOnly} placeholder="e.g. Per seat, usage-based, platform fee + usage" />
              <Field label="Entry price point" value={data.pricing.entry_price} onChange={(v) => updatePricing("entry_price", v)} disabled={isReadOnly} placeholder="e.g. $2,500/mo minimum" />
              <Field label="Expansion motion" value={data.pricing.expansion_motion} onChange={(v) => updatePricing("expansion_motion", v)} disabled={isReadOnly} multiline placeholder="How do customers naturally expand spend? (seats, usage, modules)" />
              <Field label="Discount policy" value={data.pricing.discount_policy} onChange={(v) => updatePricing("discount_policy", v)} disabled={isReadOnly} multiline placeholder="When are discounts allowed? Who approves? Max discount %?" />
              <Field label="Packaging notes" value={data.pricing.packaging_notes} onChange={(v) => updatePricing("packaging_notes", v)} disabled={isReadOnly} multiline placeholder="Tiers, bundles, annual vs. monthly trade-offs" />
            </>
          )}

          {activeTab === "onboarding" && (
            <>
              <CardTitle className="text-base">Customer Onboarding</CardTitle>
              <div className="grid gap-4 sm:grid-cols-2">
                <Field label="Target time-to-value (days)" value={data.onboarding.time_to_value_days} onChange={(v) => updateOnboarding("time_to_value_days", v)} disabled={isReadOnly} placeholder="e.g. 14" />
                <Field label="Activation milestone" value={data.onboarding.activation_milestone} onChange={(v) => updateOnboarding("activation_milestone", v)} disabled={isReadOnly} placeholder="e.g. First report generated" />
              </div>
              <Field label="Onboarding steps (numbered list)" value={data.onboarding.steps} onChange={(v) => updateOnboarding("steps", v)} disabled={isReadOnly} multiline placeholder="1. Kickoff call&#10;2. Data import&#10;3. First workflow live&#10;..." />
              <Field label="Success metrics at 30/60/90 days" value={data.onboarding.success_metrics} onChange={(v) => updateOnboarding("success_metrics", v)} disabled={isReadOnly} multiline placeholder="30d: X active, 60d: Y workflows, 90d: NPS survey sent" />
            </>
          )}
        </CardContent>
      </Card>

      {!isReadOnly && (
        <Button onClick={handleSave} disabled={saving}>
          {saving ? <><Loader2 className="size-4 animate-spin" />Saving...</> : saved ? <><Check className="size-4" />Saved</> : <><Save className="size-4" />Save Playbook</>}
        </Button>
      )}
    </div>
  );
}
