"use client";

import { useState } from "react";
import { Save, Loader2, Check, PlusCircle, Trash2, AlertCircle } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";

type BoardStage = "advisory" | "structured" | "scaleup";
type MemberRole = "independent" | "investor" | "founder" | "observer";

interface BoardMember {
  id: string;
  name: string;
  role: MemberRole;
  expertise: string;
  joined: string;
  notes: string;
}

interface MeetingLog {
  id: string;
  date: string;
  key_decisions: string;
  action_items: string;
  next_meeting: string;
}

interface BoardData {
  stage: BoardStage;
  charter: string;
  cadence: string;
  members: BoardMember[];
  meetings: MeetingLog[];
  board_pack_notes: string;
}

function parseData(raw: Record<string, unknown>): BoardData {
  return {
    stage: (raw.stage as BoardStage) ?? "advisory",
    charter: (raw.charter as string) ?? "",
    cadence: (raw.cadence as string) ?? "",
    members: (raw.members as BoardMember[]) ?? [],
    meetings: (raw.meetings as MeetingLog[]) ?? [],
    board_pack_notes: (raw.board_pack_notes as string) ?? "",
  };
}

const STAGE_INFO: Record<BoardStage, { label: string; description: string }> = {
  advisory: { label: "Advisory board", description: "Informal advisors. No fiduciary duty. Focus on domain expertise and network access." },
  structured: { label: "Structured board", description: "Post-seed/Series A. Investor board seats, independent directors. Formal governance begins." },
  scaleup: { label: "Scale-up board", description: "Series B+. Full governance with audit/comp committees. Formal charter, clear mandates." },
};

const ROLE_LABELS: Record<MemberRole, string> = {
  independent: "Independent",
  investor: "Investor",
  founder: "Founder",
  observer: "Observer",
};

const CHARTER_TEMPLATE = `Board Charter — [Company Name]

1. Purpose
The Board of Directors provides strategic oversight, governance, and accountability to [Company Name] and its stakeholders.

2. Composition
- [N] directors total: [N] founders, [N] investor nominees, [N] independent directors
- Quorum: majority of directors

3. Responsibilities
- Approve annual budget and major capital expenditures
- Hire, evaluate and compensate the CEO
- Approve material contracts and transactions
- Monitor company performance against OKRs

4. Meeting cadence
Quarterly full board meetings + monthly CEO update (written)

5. Committees
- Audit: [Members]
- Compensation: [Members]

6. Information rights
Board pack delivered 72 hours before each meeting. Contents: P&L, cash position, KPI dashboard, OKR update, risks.`;

function uid(): string {
  return Math.random().toString(36).slice(2, 9);
}

export function BoardToolkit({
  teamId, userId, isReadOnly, existingArtifact,
}: {
  teamId: string; userId: string; isReadOnly: boolean;
  existingArtifact: { id: string; data: Record<string, unknown> } | null;
}) {
  const [data, setData] = useState<BoardData>(() => parseData(existingArtifact?.data ?? {}));
  const [artifactId, setArtifactId] = useState(existingArtifact?.id ?? null);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [showMeetingForm, setShowMeetingForm] = useState(false);
  const [newMeeting, setNewMeeting] = useState<MeetingLog>({ id: uid(), date: "", key_decisions: "", action_items: "", next_meeting: "" });
  const [confirmed, setConfirmed] = useState(!!existingArtifact);
  const supabase = createClient();

  function update(field: keyof BoardData, value: string) {
    setData((p) => ({ ...p, [field]: value }));
    setSaved(false);
  }

  function addMember() {
    const m: BoardMember = { id: uid(), name: "", role: "independent", expertise: "", joined: "", notes: "" };
    setData((p) => ({ ...p, members: [...p.members, m] }));
    setSaved(false);
  }

  function updateMember(id: string, field: keyof BoardMember, value: string) {
    setData((p) => ({ ...p, members: p.members.map((m) => m.id === id ? { ...m, [field]: value } : m) }));
    setSaved(false);
  }

  function removeMember(id: string) {
    setData((p) => ({ ...p, members: p.members.filter((m) => m.id !== id) }));
    setSaved(false);
  }

  function logMeeting() {
    setData((p) => ({ ...p, meetings: [...p.meetings, { ...newMeeting, id: uid() }] }));
    setNewMeeting({ id: uid(), date: "", key_decisions: "", action_items: "", next_meeting: "" });
    setShowMeetingForm(false);
    setSaved(false);
  }

  function useCharterTemplate() {
    setData((p) => ({ ...p, charter: CHARTER_TEMPLATE }));
    setSaved(false);
  }

  async function handleSave() {
    setSaving(true);
    if (artifactId) {
      await supabase.from("artifacts").update({ data: data as unknown as Record<string, unknown>, updated_at: new Date().toISOString() }).eq("id", artifactId);
    } else {
      const { data: a } = await supabase.from("artifacts").insert({ team_id: teamId, artifact_type: "board_toolkit", title: "Board Development Toolkit", data: data as unknown as Record<string, unknown>, created_by: userId }).select("id").single();
      if (a) setArtifactId(a.id);
    }
    setSaving(false);
    setSaved(true);
    setConfirmed(true);
    setTimeout(() => setSaved(false), 2000);
  }

  return (
    <div className="space-y-6">
      <Card className="border-primary/20 bg-primary/5">
        <CardContent className="pt-4 pb-4">
          <p className="text-sm font-medium mb-1">Why a great board is a competitive advantage</p>
          <p className="text-sm text-muted-foreground">
            A well-constructed board is one of the most underrated assets a scaling company has. The right independent directors provide pattern recognition, networks, and accountability that founders cannot get elsewhere. But boards must be built intentionally — the wrong composition, cadence, or governance creates friction, not value.
          </p>
        </CardContent>
      </Card>

      {!confirmed && (
        <div className="flex items-start gap-3 rounded-lg border border-amber-300 bg-amber-50 dark:bg-amber-950/30 p-4">
          <AlertCircle className="size-4 mt-0.5 text-amber-600 shrink-0" />
          <p className="text-sm text-amber-800 dark:text-amber-300">
            <span className="font-medium text-amber-900 dark:text-amber-200">Set up your board profile. </span>
            Select your current stage, add your board members, and complete or generate your charter.
          </p>
        </div>
      )}

      {/* Stage selector */}
      <div>
        <Label className="mb-2 block">Board stage</Label>
        <div className="grid gap-3 sm:grid-cols-3">
          {(Object.entries(STAGE_INFO) as [BoardStage, { label: string; description: string }][]).map(([stage, info]) => (
            <button
              key={stage}
              disabled={isReadOnly}
              onClick={() => update("stage", stage)}
              className={`rounded-lg border p-4 text-left transition-colors ${data.stage === stage ? "border-primary bg-primary/5" : "hover:bg-muted/50"} disabled:cursor-not-allowed`}
            >
              <p className="text-sm font-medium mb-1">{info.label}</p>
              <p className="text-xs text-muted-foreground">{info.description}</p>
            </button>
          ))}
        </div>
      </div>

      <Separator />

      {/* Members */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <Label>Board members</Label>
          {!isReadOnly && (
            <Button size="sm" variant="outline" onClick={addMember}>
              <PlusCircle className="size-4" />Add Member
            </Button>
          )}
        </div>
        <div className="space-y-3">
          {data.members.length === 0 && <p className="text-sm text-muted-foreground">No members added yet.</p>}
          {data.members.map((m) => (
            <div key={m.id} className="rounded-lg border p-4 space-y-3">
              <div className="flex items-start justify-between gap-2">
                <div className="grid gap-3 sm:grid-cols-2 flex-1">
                  <div className="space-y-1">
                    <Label className="text-xs">Name</Label>
                    <Input placeholder="Full name" value={m.name} onChange={(e) => updateMember(m.id, "name", e.target.value)} disabled={isReadOnly} />
                  </div>
                  <div className="space-y-1">
                    <Label className="text-xs">Role</Label>
                    <select
                      className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                      value={m.role}
                      onChange={(e) => updateMember(m.id, "role", e.target.value)}
                      disabled={isReadOnly}
                    >
                      {Object.entries(ROLE_LABELS).map(([v, l]) => <option key={v} value={v}>{l}</option>)}
                    </select>
                  </div>
                  <div className="space-y-1">
                    <Label className="text-xs">Expertise tags</Label>
                    <Input placeholder="e.g. GTM, SaaS, Africa expansion" value={m.expertise} onChange={(e) => updateMember(m.id, "expertise", e.target.value)} disabled={isReadOnly} />
                  </div>
                  <div className="space-y-1">
                    <Label className="text-xs">Joined</Label>
                    <Input type="month" value={m.joined} onChange={(e) => updateMember(m.id, "joined", e.target.value)} disabled={isReadOnly} />
                  </div>
                </div>
                {!isReadOnly && (
                  <Button size="sm" variant="ghost" onClick={() => removeMember(m.id)}>
                    <Trash2 className="size-3.5" />
                  </Button>
                )}
              </div>
              <div className="space-y-1">
                <Label className="text-xs">Notes / value-add</Label>
                <Textarea rows={2} value={m.notes} onChange={(e) => updateMember(m.id, "notes", e.target.value)} disabled={isReadOnly} placeholder="Key contributions, network access, areas of advice..." />
              </div>
              <Badge variant="secondary" className="text-xs">{ROLE_LABELS[m.role]}</Badge>
            </div>
          ))}
        </div>
      </div>

      <Separator />

      {/* Charter */}
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <Label>Board charter</Label>
          {!isReadOnly && !data.charter && (
            <Button size="sm" variant="outline" onClick={useCharterTemplate}>Use template</Button>
          )}
        </div>
        <Textarea rows={12} placeholder="Paste or write your board charter here, or use the template above." value={data.charter} onChange={(e) => update("charter", e.target.value)} disabled={isReadOnly} className="font-mono text-xs" />
      </div>

      {/* Cadence */}
      <div className="space-y-1.5">
        <Label>Meeting cadence & board pack format</Label>
        <Textarea rows={3} placeholder="e.g. Quarterly full board (3h) + monthly written CEO update. Board pack sent 72h in advance: P&L, KPIs, OKR update, risks." value={data.cadence} onChange={(e) => update("cadence", e.target.value)} disabled={isReadOnly} />
      </div>

      {/* Board pack notes */}
      <div className="space-y-1.5">
        <Label>Board pack notes / template</Label>
        <Textarea rows={4} placeholder="What goes in each board pack? What format? What questions should it answer?" value={data.board_pack_notes} onChange={(e) => update("board_pack_notes", e.target.value)} disabled={isReadOnly} />
      </div>

      {/* Meeting log */}
      <Separator />
      <div>
        <div className="flex items-center justify-between mb-3">
          <Label>Meeting log</Label>
          {!isReadOnly && (
            <Button size="sm" variant="outline" onClick={() => setShowMeetingForm(true)}>
              <PlusCircle className="size-4" />Log Meeting
            </Button>
          )}
        </div>

        {showMeetingForm && (
          <div className="rounded-lg border p-4 space-y-3 mb-4">
            <p className="text-sm font-medium">New meeting record</p>
            <div className="grid gap-3 sm:grid-cols-2">
              <div className="space-y-1">
                <Label className="text-xs">Meeting date</Label>
                <Input type="date" value={newMeeting.date} onChange={(e) => setNewMeeting((p) => ({ ...p, date: e.target.value }))} />
              </div>
              <div className="space-y-1">
                <Label className="text-xs">Next meeting</Label>
                <Input type="date" value={newMeeting.next_meeting} onChange={(e) => setNewMeeting((p) => ({ ...p, next_meeting: e.target.value }))} />
              </div>
            </div>
            <div className="space-y-1">
              <Label className="text-xs">Key decisions</Label>
              <Textarea rows={3} value={newMeeting.key_decisions} onChange={(e) => setNewMeeting((p) => ({ ...p, key_decisions: e.target.value }))} placeholder="What was decided?" />
            </div>
            <div className="space-y-1">
              <Label className="text-xs">Action items</Label>
              <Textarea rows={3} value={newMeeting.action_items} onChange={(e) => setNewMeeting((p) => ({ ...p, action_items: e.target.value }))} placeholder="Who does what by when?" />
            </div>
            <div className="flex gap-2">
              <Button size="sm" onClick={logMeeting}>Save Meeting</Button>
              <Button size="sm" variant="ghost" onClick={() => setShowMeetingForm(false)}>Cancel</Button>
            </div>
          </div>
        )}

        <div className="space-y-2">
          {data.meetings.length === 0 && <p className="text-sm text-muted-foreground">No meetings logged yet.</p>}
          {data.meetings.slice().reverse().map((m) => (
            <div key={m.id} className="rounded-lg border p-4 space-y-2">
              <div className="flex items-center gap-2">
                <p className="text-sm font-medium">{m.date ? new Date(m.date).toLocaleDateString("en-GB", { year: "numeric", month: "long", day: "numeric" }) : "No date"}</p>
                {m.next_meeting && <Badge variant="secondary" className="text-xs">Next: {m.next_meeting}</Badge>}
              </div>
              {m.key_decisions && <p className="text-xs text-muted-foreground"><span className="font-medium">Decisions:</span> {m.key_decisions}</p>}
              {m.action_items && <p className="text-xs text-muted-foreground"><span className="font-medium">Actions:</span> {m.action_items}</p>}
            </div>
          ))}
        </div>
      </div>

      {!isReadOnly && (
        <Button onClick={handleSave} disabled={saving}>
          {saving ? <><Loader2 className="size-4 animate-spin" />Saving...</> : saved ? <><Check className="size-4" />Saved</> : <><Save className="size-4" />Save</>}
        </Button>
      )}
    </div>
  );
}
