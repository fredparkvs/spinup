"use client";

import { useState } from "react";
import { Save, Loader2, Check, Download } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import type { ValueProposition } from "@/lib/types/database";

interface SlideData { content: string; }
interface PitchDeckData {
  problem: SlideData; solution: SlideData; why_now: SlideData; market_size: SlideData;
  business_model: SlideData; traction: SlideData; team: SlideData; competition: SlideData;
  financials: SlideData; the_ask: SlideData;
}

const SLIDES: { key: keyof PitchDeckData; num: number; title: string; guidance: string }[] = [
  { key: "problem", num: 1, title: "The Problem", guidance: "One stat or story that makes the problem visceral. What's broken and who suffers? Avoid jargon." },
  { key: "solution", num: 2, title: "Our Solution", guidance: "What you do in one clear sentence. Then describe how it works. Include a demo screenshot or mockup if available." },
  { key: "why_now", num: 3, title: "Why Now", guidance: "What changed that makes this possible today? New regulation, new technology, new behaviour — what's the unlock?" },
  { key: "market_size", num: 4, title: "Market Size", guidance: "TAM / SAM / SOM. Use bottom-up estimates. SA-localise your numbers where possible." },
  { key: "business_model", num: 5, title: "Business Model", guidance: "How do you make money? Pricing, contract length, key revenue assumptions." },
  { key: "traction", num: 6, title: "Traction", guidance: "Revenue, paying customers, letters of interest, pilots, downloads, MoM growth. Show momentum." },
  { key: "team", num: 7, title: "Team", guidance: "Who are you and why are you the right team for this? Domain expertise, unfair advantages, relevant history." },
  { key: "competition", num: 8, title: "Competition", guidance: "Your specific differentiation. Link to your competitive landscape map. 'No competition' is a red flag to investors." },
  { key: "financials", num: 9, title: "Financials", guidance: "24-month revenue projection + key assumptions. Show monthly burn, runway, and when you reach break-even." },
  { key: "the_ask", num: 10, title: "The Ask", guidance: "How much are you raising? What will you use it for? What milestones will it get you to?" },
];

function parseData(raw: Record<string, unknown>): PitchDeckData {
  const empty: SlideData = { content: "" };
  return {
    problem: (raw.problem as SlideData) ?? empty,
    solution: (raw.solution as SlideData) ?? empty,
    why_now: (raw.why_now as SlideData) ?? empty,
    market_size: (raw.market_size as SlideData) ?? empty,
    business_model: (raw.business_model as SlideData) ?? empty,
    traction: (raw.traction as SlideData) ?? empty,
    team: (raw.team as SlideData) ?? empty,
    competition: (raw.competition as SlideData) ?? empty,
    financials: (raw.financials as SlideData) ?? empty,
    the_ask: (raw.the_ask as SlideData) ?? empty,
  };
}

export function PitchDeck({ teamId, userId, isReadOnly, existingArtifact, valueProposition }: {
  teamId: string; userId: string; isReadOnly: boolean;
  existingArtifact: { id: string; data: Record<string, unknown> } | null;
  valueProposition: ValueProposition | null;
}) {
  const [data, setData] = useState<PitchDeckData>(() => {
    const parsed = parseData(existingArtifact?.data ?? {});
    if (valueProposition && !parsed.solution.content) {
      parsed.solution = { content: `Our product ${valueProposition.solution} helps ${valueProposition.customer} achieve ${valueProposition.benefit} by ${valueProposition.how_it_works}, an improvement of ${valueProposition.improvement} over current options.` };
    }
    return parsed;
  });
  const [artifactId, setArtifactId] = useState(existingArtifact?.id ?? null);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const supabase = createClient();

  function updateSlide(key: keyof PitchDeckData, content: string) {
    setData((prev) => ({ ...prev, [key]: { content } }));
    setSaved(false);
  }

  async function handleSave() {
    setSaving(true);
    if (artifactId) {
      await supabase.from("artifacts").update({ data: data as unknown as Record<string, unknown>, updated_at: new Date().toISOString() }).eq("id", artifactId);
    } else {
      const { data: a } = await supabase.from("artifacts").insert({ team_id: teamId, artifact_type: "pitch_deck", title: "Pitch Deck", data: data as unknown as Record<string, unknown>, created_by: userId }).select("id").single();
      if (a) setArtifactId(a.id);
    }
    setSaving(false);
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  }

  const completedSlides = SLIDES.filter((s) => data[s.key].content.trim().length > 0).length;

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <Badge variant={completedSlides === 10 ? "default" : "secondary"}>{completedSlides}/10 slides drafted</Badge>
        <p className="text-xs text-muted-foreground">This tool generates narrative content — format it in your own deck.</p>
      </div>

      {SLIDES.map((slide, index) => (
        <div key={slide.key}>
          <div className="space-y-2">
            <div className="flex items-start gap-2">
              <span className="mt-0.5 flex size-6 shrink-0 items-center justify-center rounded-full bg-primary/10 text-xs font-bold text-primary">
                {slide.num}
              </span>
              <div className="flex-1 space-y-1">
                <Label className="text-sm font-medium">{slide.title}</Label>
                <p className="text-xs text-muted-foreground">{slide.guidance}</p>
                <Textarea
                  placeholder={`Write your ${slide.title.toLowerCase()} narrative here...`}
                  value={data[slide.key].content}
                  onChange={(e) => updateSlide(slide.key, e.target.value)}
                  disabled={isReadOnly}
                  rows={4}
                />
              </div>
            </div>
          </div>
          {index < SLIDES.length - 1 && <Separator className="mt-4" />}
        </div>
      ))}

      <div className="flex items-center gap-3">
        {!isReadOnly && (
          <Button onClick={handleSave} disabled={saving}>
            {saving ? <><Loader2 className="size-4 animate-spin" />Saving...</> : saved ? <><Check className="size-4" />Saved</> : <><Save className="size-4" />Save Pitch Deck</>}
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
