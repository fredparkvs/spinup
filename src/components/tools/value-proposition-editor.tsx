"use client";

import { useState } from "react";
import { Loader2, Save, Check } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import type { ValueProposition } from "@/lib/types/database";

interface ValuePropositionEditorProps {
  teamId: string;
  initialValueProposition: ValueProposition | null;
}

const EMPTY_VP: ValueProposition = {
  solution: "",
  customer: "",
  benefit: "",
  how_it_works: "",
  improvement: "",
};

export function ValuePropositionEditor({
  teamId,
  initialValueProposition,
}: ValuePropositionEditorProps) {
  const [vp, setVp] = useState<ValueProposition>(
    initialValueProposition ?? EMPTY_VP
  );
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const supabase = createClient();

  const isComplete =
    vp.solution.trim() &&
    vp.customer.trim() &&
    vp.benefit.trim() &&
    vp.how_it_works.trim() &&
    vp.improvement.trim();

  const preview = isComplete
    ? `Our product ${vp.solution} helps ${vp.customer} achieve ${vp.benefit} by ${vp.how_it_works}, an improvement of ${vp.improvement} over current options.`
    : "Fill in all fields below to see your value proposition.";

  async function handleSave() {
    setSaving(true);
    await supabase
      .from("teams")
      .update({
        value_proposition: vp,
        vp_updated_at: new Date().toISOString(),
      })
      .eq("id", teamId);
    setSaving(false);
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  }

  function update(field: keyof ValueProposition, value: string) {
    setVp((prev) => ({ ...prev, [field]: value }));
    setSaved(false);
  }

  return (
    <div className="space-y-6">
      {/* Live preview */}
      <Card className={isComplete ? "border-primary/30 bg-primary/5" : ""}>
        <CardHeader className="pb-2">
          <CardTitle className="text-base">Your Value Proposition</CardTitle>
          <CardDescription>Updates as you type</CardDescription>
        </CardHeader>
        <CardContent>
          <p className={`text-sm leading-relaxed ${isComplete ? "font-medium" : "text-muted-foreground italic"}`}>
            &ldquo;{preview}&rdquo;
          </p>
        </CardContent>
      </Card>

      <Separator />

      {/* Form */}
      <div className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="solution">What does your product do?</Label>
          <Textarea
            id="solution"
            placeholder="e.g. rapidly detects contamination in water samples using AI-powered sensors"
            value={vp.solution}
            onChange={(e) => update("solution", e.target.value)}
            rows={2}
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="customer">Who is your target customer?</Label>
          <Textarea
            id="customer"
            placeholder="e.g. municipal water treatment facilities in sub-Saharan Africa"
            value={vp.customer}
            onChange={(e) => update("customer", e.target.value)}
            rows={2}
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="benefit">What benefit do they achieve?</Label>
          <Textarea
            id="benefit"
            placeholder="e.g. safer drinking water compliance and reduced manual testing costs"
            value={vp.benefit}
            onChange={(e) => update("benefit", e.target.value)}
            rows={2}
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="how-it-works">How does your product deliver this benefit?</Label>
          <Textarea
            id="how-it-works"
            placeholder="e.g. continuously monitoring 12 contaminant markers in real-time with no lab required"
            value={vp.how_it_works}
            onChange={(e) => update("how_it_works", e.target.value)}
            rows={2}
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="improvement">What is the improvement over current options?</Label>
          <Input
            id="improvement"
            placeholder="e.g. 10x faster detection, 70% lower cost per test"
            value={vp.improvement}
            onChange={(e) => update("improvement", e.target.value)}
          />
          <p className="text-xs text-muted-foreground">Be specific with numbers where possible — &ldquo;10x faster&rdquo; beats &ldquo;much faster&rdquo;.</p>
        </div>
      </div>

      <Button onClick={handleSave} disabled={!isComplete || saving} className="w-full sm:w-auto">
        {saving ? (
          <><Loader2 className="size-4 animate-spin" />Saving...</>
        ) : saved ? (
          <><Check className="size-4" />Saved</>
        ) : (
          <><Save className="size-4" />Save Value Proposition</>
        )}
      </Button>
    </div>
  );
}
