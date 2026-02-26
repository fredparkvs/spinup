"use client";

import { useState } from "react";
import { Save, Loader2, Check, ExternalLink } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Textarea } from "@/components/ui/textarea";

type ItemStatus = "not_started" | "in_progress" | "complete";

interface ChecklistItem {
  id: string;
  status: ItemStatus;
  notes: string;
}

interface ComplianceData {
  items: Record<string, ChecklistItem>;
}

const CHECKLIST: {
  id: string;
  title: string;
  detail: string;
  url?: string;
  urlLabel?: string;
  phase: "foundation" | "operations" | "protection";
}[] = [
  {
    id: "cipc_registration",
    title: "CIPC Registration — Pty Ltd",
    detail: "Register your private company with the Companies and Intellectual Property Commission. Required before you can open a business bank account, apply for most grants, or sign contracts as an entity.",
    url: "https://www.bizportal.gov.za",
    urlLabel: "BizPortal (CIPC)",
    phase: "foundation",
  },
  {
    id: "sars_income_tax",
    title: "SARS Income Tax Registration",
    detail: "Register with SARS for income tax within 60 days of incorporation. Required for all companies operating in South Africa.",
    url: "https://www.sars.gov.za/efiling",
    urlLabel: "SARS eFiling",
    phase: "foundation",
  },
  {
    id: "business_bank_account",
    title: "Business Bank Account",
    detail: "Open a dedicated business bank account in the company name. Required for grant disbursements, invoicing, and investor rounds. Keep business and personal finances separate from day one.",
    phase: "foundation",
  },
  {
    id: "shareholder_agreement",
    title: "Shareholder Agreement",
    detail: "A legally binding document defining ownership split, vesting schedules, decision rights, IP ownership, and exit provisions. Critical before any co-founder conflict arises — which is when you need it most.",
    phase: "foundation",
  },
  {
    id: "ip_assignment",
    title: "IP Assignment Agreement",
    detail: "Ensures all intellectual property created by founders and employees is assigned to the company. Especially important for spinouts — founders often create IP before the company exists.",
    phase: "foundation",
  },
  {
    id: "tto_clearance",
    title: "TTO Clearance / Spinout Agreement",
    detail: "If your technology originated from university research, you need written clearance from your Technology Transfer Office (TTO) on IP licensing terms. Investors will ask for this.",
    phase: "foundation",
  },
  {
    id: "sars_paye",
    title: "SARS PAYE Registration",
    detail: "Register as an employer for Pay-As-You-Earn tax when you hire your first salaried employee. Required before you can legally pay salaries.",
    url: "https://www.sars.gov.za/efiling",
    urlLabel: "SARS eFiling",
    phase: "operations",
  },
  {
    id: "vat_registration",
    title: "VAT Registration",
    detail: "Mandatory when your annual turnover exceeds R1 million. Voluntary registration is possible from R50k. Consider registering early if your customers are VAT-registered businesses.",
    url: "https://www.sars.gov.za/efiling",
    urlLabel: "SARS eFiling",
    phase: "operations",
  },
  {
    id: "bbbee_affidavit",
    title: "B-BBEE EME Affidavit",
    detail: "In your first year, as an Exempted Micro Enterprise (EME) with turnover under R10M, you only need a sworn affidavit signed by a commissioner of oaths. No formal B-BBEE audit required. Many government contracts and tenders require a valid B-BBEE certificate or affidavit.",
    phase: "operations",
  },
];

const PHASE_LABELS: Record<string, string> = {
  foundation: "Foundation (do these first)",
  operations: "Operations",
  protection: "Protection",
};

const STATUS_LABELS: Record<ItemStatus, string> = {
  not_started: "Not started",
  in_progress: "In progress",
  complete: "Complete",
};

const STATUS_VARIANTS: Record<ItemStatus, "secondary" | "outline" | "default"> = {
  not_started: "secondary",
  in_progress: "outline",
  complete: "default",
};

function defaultItems(): Record<string, ChecklistItem> {
  return Object.fromEntries(
    CHECKLIST.map((c) => [c.id, { id: c.id, status: "not_started" as ItemStatus, notes: "" }])
  );
}

function parseData(raw: Record<string, unknown>): ComplianceData {
  const rawItems = raw.items as Record<string, ChecklistItem> | undefined;
  if (!rawItems) return { items: defaultItems() };
  const items = { ...defaultItems() };
  for (const [key, val] of Object.entries(rawItems)) {
    if (items[key]) items[key] = { ...items[key], ...val };
  }
  return { items };
}

export function ComplianceChecklist({ teamId, userId, isReadOnly, existingArtifact }: {
  teamId: string; userId: string; isReadOnly: boolean;
  existingArtifact: { id: string; data: Record<string, unknown> } | null;
}) {
  const [data, setData] = useState<ComplianceData>(() => parseData(existingArtifact?.data ?? {}));
  const [artifactId, setArtifactId] = useState(existingArtifact?.id ?? null);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const supabase = createClient();

  async function handleSave() {
    setSaving(true);
    if (artifactId) {
      await supabase.from("artifacts").update({ data: data as unknown as Record<string, unknown>, updated_at: new Date().toISOString() }).eq("id", artifactId);
    } else {
      const { data: a } = await supabase.from("artifacts").insert({ team_id: teamId, artifact_type: "compliance_checklist", title: "SA Compliance Checklist", data: data as unknown as Record<string, unknown>, created_by: userId }).select("id").single();
      if (a) setArtifactId(a.id);
    }
    setSaving(false);
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  }

  function cycleStatus(id: string) {
    if (isReadOnly) return;
    const order: ItemStatus[] = ["not_started", "in_progress", "complete"];
    setData((prev) => {
      const current = prev.items[id].status;
      const next = order[(order.indexOf(current) + 1) % order.length];
      return { ...prev, items: { ...prev.items, [id]: { ...prev.items[id], status: next } } };
    });
    setSaved(false);
  }

  function updateNotes(id: string, notes: string) {
    setData((prev) => ({ ...prev, items: { ...prev.items, [id]: { ...prev.items[id], notes } } }));
    setSaved(false);
  }

  const completedCount = Object.values(data.items).filter((i) => i.status === "complete").length;
  const phases = Array.from(new Set(CHECKLIST.map((c) => c.phase)));

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <Badge variant={completedCount === CHECKLIST.length ? "default" : "secondary"}>
          {completedCount}/{CHECKLIST.length} complete
        </Badge>
        <p className="text-xs text-muted-foreground">Click a status badge to cycle through: Not started → In progress → Complete</p>
      </div>

      {phases.map((phase) => (
        <div key={phase} className="space-y-3">
          <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">{PHASE_LABELS[phase]}</h3>
          {CHECKLIST.filter((c) => c.phase === phase).map((item, index, arr) => {
            const itemData = data.items[item.id];
            return (
              <div key={item.id}>
                <div className="space-y-2">
                  <div className="flex items-start gap-3">
                    <button
                      onClick={() => cycleStatus(item.id)}
                      disabled={isReadOnly}
                      className="mt-0.5 shrink-0 disabled:cursor-default"
                    >
                      <Badge variant={STATUS_VARIANTS[itemData.status]} className="cursor-pointer select-none">
                        {itemData.status === "complete" && <Check className="size-3 mr-1" />}
                        {STATUS_LABELS[itemData.status]}
                      </Badge>
                    </button>
                    <div className="flex-1 space-y-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <p className="text-sm font-medium">{item.title}</p>
                        {item.url && (
                          <a href={item.url} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 text-xs text-primary hover:underline">
                            {item.urlLabel ?? item.url}
                            <ExternalLink className="size-3" />
                          </a>
                        )}
                      </div>
                      <p className="text-xs text-muted-foreground">{item.detail}</p>
                      {(itemData.status !== "not_started" || itemData.notes) && (
                        <Textarea
                          placeholder="Add notes, reference numbers, dates, or next steps..."
                          value={itemData.notes}
                          onChange={(e) => updateNotes(item.id, e.target.value)}
                          disabled={isReadOnly}
                          rows={2}
                          className="mt-2 text-sm"
                        />
                      )}
                    </div>
                  </div>
                </div>
                {index < arr.length - 1 && <Separator className="mt-3" />}
              </div>
            );
          })}
        </div>
      ))}

      {!isReadOnly && (
        <Button onClick={handleSave} disabled={saving}>
          {saving ? <><Loader2 className="size-4 animate-spin" />Saving...</> : saved ? <><Check className="size-4" />Saved</> : <><Save className="size-4" />Save Checklist</>}
        </Button>
      )}
    </div>
  );
}
