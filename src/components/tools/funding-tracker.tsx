"use client";

import { useState } from "react";
import { Save, Loader2, Check, Plus, Trash2, ExternalLink } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

type ApplicationStatus = "not_started" | "preparing" | "submitted" | "awaiting_decision" | "awarded" | "rejected";

interface FundingEntry {
  id: string;
  funder: string;
  amount_available: string;
  stage_fit: string;
  eligibility_notes: string;
  status: ApplicationStatus;
  deadline: string;
  notes: string;
  url: string;
}

const STATUS_LABELS: Record<ApplicationStatus, string> = {
  not_started: "Not started",
  preparing: "Preparing",
  submitted: "Submitted",
  awaiting_decision: "Awaiting decision",
  awarded: "Awarded",
  rejected: "Rejected",
};

const STATUS_VARIANTS: Record<ApplicationStatus, "secondary" | "outline" | "default" | "destructive"> = {
  not_started: "secondary",
  preparing: "outline",
  submitted: "outline",
  awaiting_decision: "outline",
  awarded: "default",
  rejected: "destructive",
};

const SA_FUNDERS: Omit<FundingEntry, "id" | "status" | "deadline" | "notes">[] = [
  {
    funder: "TIA — Technology Innovation Agency",
    amount_available: "Up to R5M",
    stage_fit: "Early-stage tech / spinout",
    eligibility_notes: "Must be a registered SA company. Focus on technology with commercial potential.",
    url: "https://www.tia.org.za",
  },
  {
    funder: "SPII — Support Programme for Industrial Innovation",
    amount_available: "Up to R5M",
    stage_fit: "Pre-commercial / prototype",
    eligibility_notes: "SA companies with innovative industrial products or processes. Matching fund contribution required.",
    url: "https://www.dtic.gov.za/incentives/spii",
  },
  {
    funder: "SEDA — Small Enterprise Development Agency",
    amount_available: "Variable (grants + non-financial support)",
    stage_fit: "Early-stage / pre-revenue",
    eligibility_notes: "Broad eligibility for small businesses. Non-financial support + some grant funding programs.",
    url: "https://www.seda.org.za",
  },
  {
    funder: "DSTI — Department of Science, Technology & Innovation",
    amount_available: "Variable",
    stage_fit: "Research-linked commercialisation",
    eligibility_notes: "Strong fit for university spinouts. Programmes include THRIP and other research commercialisation funds.",
    url: "https://www.dst.gov.za",
  },
  {
    funder: "TIA — Tech Deployment Programme",
    amount_available: "Up to R3M",
    stage_fit: "Pilot deployment / first commercial contract",
    eligibility_notes: "For companies with a working prototype ready for first commercial deployment.",
    url: "https://www.tia.org.za",
  },
  {
    funder: "IDC — Industrial Development Corporation",
    amount_available: "R1M+",
    stage_fit: "Revenue generating / growth",
    eligibility_notes: "Debt and equity financing. Requires revenue traction and SA industrial / manufacturing focus.",
    url: "https://www.idc.co.za",
  },
  {
    funder: "DTIC — Department of Trade, Industry & Competition",
    amount_available: "Variable",
    stage_fit: "Various stages",
    eligibility_notes: "Range of incentive programmes including MCEP, AIS. Check current open programmes.",
    url: "https://www.thedtic.gov.za",
  },
];

function uid() {
  return Math.random().toString(36).slice(2, 9);
}

type FundingTrackerEntryDB = {
  id: string;
  team_id: string;
  funder: string;
  amount_available: number | null;
  stage_fit: string | null;
  eligibility_notes: string | null;
  status: string;
  deadline: string | null;
  notes: string | null;
  url: string | null;
  created_at: string;
  updated_at: string;
};

function dbToEntry(e: FundingTrackerEntryDB): FundingEntry {
  return {
    id: e.id,
    funder: e.funder,
    amount_available: e.amount_available != null ? String(e.amount_available) : "",
    stage_fit: e.stage_fit ?? "",
    eligibility_notes: e.eligibility_notes ?? "",
    status: (e.status as ApplicationStatus) ?? "not_started",
    deadline: e.deadline ?? "",
    notes: e.notes ?? "",
    url: e.url ?? "",
  };
}

export function FundingTracker({ teamId, userId, isReadOnly, existingEntries }: {
  teamId: string;
  userId: string;
  isReadOnly: boolean;
  existingEntries: FundingTrackerEntryDB[];
}) {
  const [entries, setEntries] = useState<FundingEntry[]>(() => existingEntries.map(dbToEntry));
  const [saving, setSaving] = useState<Record<string, boolean>>({});
  const [saved, setSaved] = useState<Record<string, boolean>>({});
  const [addingCustom, setAddingCustom] = useState(false);
  const [customForm, setCustomForm] = useState<Omit<FundingEntry, "id" | "status">>({
    funder: "", amount_available: "", stage_fit: "", eligibility_notes: "", deadline: "", notes: "", url: "",
  });
  const supabase = createClient();

  async function handleSaveEntry(entry: FundingEntry) {
    setSaving((prev) => ({ ...prev, [entry.id]: true }));
    if (entry.id.startsWith("new_")) {
      const { data: a } = await supabase.from("funding_tracker_entries").insert({
        team_id: teamId,
        funder: entry.funder,
        amount_available: entry.amount_available ? parseFloat(entry.amount_available) : null,
        stage_fit: entry.stage_fit,
        eligibility_notes: entry.eligibility_notes,
        status: entry.status,
        deadline: entry.deadline || null,
        notes: entry.notes,
        url: entry.url || null,
      }).select("id").single();
      if (a) {
        setEntries((prev) => prev.map((e) => e.id === entry.id ? { ...e, id: a.id } : e));
      }
    } else {
      await supabase.from("funding_tracker_entries").update({
        status: entry.status,
        deadline: entry.deadline || null,
        notes: entry.notes,
        amount_available: entry.amount_available ? parseFloat(entry.amount_available) : null,
        stage_fit: entry.stage_fit,
        eligibility_notes: entry.eligibility_notes,
        url: entry.url || null,
        updated_at: new Date().toISOString(),
      }).eq("id", entry.id);
    }
    setSaving((prev) => ({ ...prev, [entry.id]: false }));
    setSaved((prev) => ({ ...prev, [entry.id]: true }));
    setTimeout(() => setSaved((prev) => ({ ...prev, [entry.id]: false })), 2000);
  }

  async function handleDelete(id: string) {
    if (id.startsWith("new_")) {
      setEntries((prev) => prev.filter((e) => e.id !== id));
      return;
    }
    await supabase.from("funding_tracker_entries").delete().eq("id", id);
    setEntries((prev) => prev.filter((e) => e.id !== id));
  }

  function updateEntry(id: string, field: keyof FundingEntry, value: string) {
    setEntries((prev) => prev.map((e) => e.id === id ? { ...e, [field]: value } : e));
  }

  function addFromTemplate(funder: typeof SA_FUNDERS[0]) {
    const entry: FundingEntry = {
      id: `new_${uid()}`,
      ...funder,
      status: "not_started",
      deadline: "",
      notes: "",
    };
    setEntries((prev) => [...prev, entry]);
  }

  async function addCustomEntry() {
    const entry: FundingEntry = {
      id: `new_${uid()}`,
      ...customForm,
      status: "not_started",
    };
    setEntries((prev) => [...prev, entry]);
    setCustomForm({ funder: "", amount_available: "", stage_fit: "", eligibility_notes: "", deadline: "", notes: "", url: "" });
    setAddingCustom(false);
  }

  const existingFunderNames = new Set(entries.map((e) => e.funder));
  const availableTemplates = SA_FUNDERS.filter((f) => !existingFunderNames.has(f.funder));
  const awardedCount = entries.filter((e) => e.status === "awarded").length;
  const activeCount = entries.filter((e) => ["preparing", "submitted", "awaiting_decision"].includes(e.status)).length;

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3 flex-wrap">
        <Badge variant="secondary">{entries.length} funders tracked</Badge>
        {activeCount > 0 && <Badge variant="outline">{activeCount} active applications</Badge>}
        {awardedCount > 0 && <Badge>{awardedCount} awarded</Badge>}
      </div>

      {/* SA Funder Templates */}
      {!isReadOnly && availableTemplates.length > 0 && (
        <div className="rounded-lg border border-dashed p-4 space-y-3">
          <p className="text-sm font-medium">Add SA funder</p>
          <p className="text-xs text-muted-foreground">Pre-populated with known SA funding sources. Click to add to your tracker.</p>
          <div className="flex flex-wrap gap-2">
            {availableTemplates.map((f) => (
              <Button key={f.funder} variant="outline" size="sm" onClick={() => addFromTemplate(f)}>
                <Plus className="size-3 mr-1" />{f.funder.split(" — ")[0]}
              </Button>
            ))}
            <Button variant="outline" size="sm" onClick={() => setAddingCustom(true)}>
              <Plus className="size-3 mr-1" />Custom funder
            </Button>
          </div>
        </div>
      )}

      {/* Custom Funder Form */}
      {addingCustom && (
        <div className="rounded-lg border p-4 space-y-3">
          <div className="flex items-center justify-between">
            <p className="text-sm font-medium">Add custom funder</p>
            <Button variant="ghost" size="sm" onClick={() => setAddingCustom(false)}>Cancel</Button>
          </div>
          <div className="grid gap-3 sm:grid-cols-2">
            <div className="space-y-1.5 sm:col-span-2">
              <Label>Funder name</Label>
              <Input value={customForm.funder} onChange={(e) => setCustomForm((p) => ({ ...p, funder: e.target.value }))} placeholder="e.g. Stellenbosch University TTO Grant" />
            </div>
            <div className="space-y-1.5">
              <Label>Amount available</Label>
              <Input value={customForm.amount_available} onChange={(e) => setCustomForm((p) => ({ ...p, amount_available: e.target.value }))} placeholder="e.g. R500k" />
            </div>
            <div className="space-y-1.5">
              <Label>Stage fit</Label>
              <Input value={customForm.stage_fit} onChange={(e) => setCustomForm((p) => ({ ...p, stage_fit: e.target.value }))} placeholder="e.g. Pre-seed / validate" />
            </div>
            <div className="space-y-1.5 sm:col-span-2">
              <Label>Eligibility notes</Label>
              <Input value={customForm.eligibility_notes} onChange={(e) => setCustomForm((p) => ({ ...p, eligibility_notes: e.target.value }))} placeholder="Key requirements" />
            </div>
            <div className="space-y-1.5 sm:col-span-2">
              <Label>URL</Label>
              <Input type="url" value={customForm.url} onChange={(e) => setCustomForm((p) => ({ ...p, url: e.target.value }))} placeholder="https://..." />
            </div>
          </div>
          <Button size="sm" onClick={addCustomEntry} disabled={!customForm.funder}>
            <Plus className="size-3.5 mr-1" />Add funder
          </Button>
        </div>
      )}

      {entries.length === 0 && (
        <div className="rounded-lg border border-dashed p-8 text-center">
          <p className="text-sm text-muted-foreground">No funders tracked yet.</p>
          <p className="text-xs text-muted-foreground mt-1">Add a SA funder above or create a custom entry.</p>
        </div>
      )}

      {/* Entry List */}
      {entries.map((entry, idx) => (
        <div key={entry.id}>
          <div className="space-y-3">
            <div className="flex items-start justify-between gap-3">
              <div className="flex-1 space-y-0.5">
                <div className="flex items-center gap-2 flex-wrap">
                  <p className="text-sm font-semibold">{entry.funder}</p>
                  {entry.url && (
                    <a href={entry.url} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 text-xs text-primary hover:underline">
                      Website <ExternalLink className="size-3" />
                    </a>
                  )}
                </div>
                {entry.amount_available && <p className="text-xs text-muted-foreground">{entry.amount_available} · {entry.stage_fit}</p>}
                {entry.eligibility_notes && <p className="text-xs text-muted-foreground">{entry.eligibility_notes}</p>}
              </div>
              {!isReadOnly && (
                <Button variant="ghost" size="icon" className="size-7 shrink-0" onClick={() => handleDelete(entry.id)}>
                  <Trash2 className="size-3.5" />
                </Button>
              )}
            </div>
            <div className="grid gap-3 sm:grid-cols-3">
              <div className="space-y-1.5">
                <Label className="text-xs">Status</Label>
                <Select value={entry.status} onValueChange={(v) => updateEntry(entry.id, "status", v)} disabled={isReadOnly}>
                  <SelectTrigger className="h-8 text-xs">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {(Object.keys(STATUS_LABELS) as ApplicationStatus[]).map((s) => (
                      <SelectItem key={s} value={s}>{STATUS_LABELS[s]}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs">Deadline</Label>
                <Input type="date" value={entry.deadline} onChange={(e) => updateEntry(entry.id, "deadline", e.target.value)} disabled={isReadOnly} className="h-8 text-xs" />
              </div>
              <div className="flex items-end">
                <Badge variant={STATUS_VARIANTS[entry.status]} className="text-xs">{STATUS_LABELS[entry.status]}</Badge>
              </div>
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs">Notes</Label>
              <Textarea placeholder="Reference numbers, contact names, next steps, documents submitted..." value={entry.notes} onChange={(e) => updateEntry(entry.id, "notes", e.target.value)} disabled={isReadOnly} rows={2} className="text-sm" />
            </div>
            {!isReadOnly && (
              <Button size="sm" onClick={() => handleSaveEntry(entry)} disabled={saving[entry.id]}>
                {saving[entry.id] ? <><Loader2 className="size-3.5 animate-spin" />Saving...</> : saved[entry.id] ? <><Check className="size-3.5" />Saved</> : <><Save className="size-3.5" />Save</>}
              </Button>
            )}
          </div>
          {idx < entries.length - 1 && <Separator className="mt-4" />}
        </div>
      ))}
    </div>
  );
}
