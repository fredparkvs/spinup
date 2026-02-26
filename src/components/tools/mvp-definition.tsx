"use client";

import { useState } from "react";
import { Save, Loader2, Check, PlusCircle, Trash2 } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Checkbox } from "@/components/ui/checkbox";

interface Feature { id: string; description: string; isCore: boolean; }
interface MvpData {
  core_value_prop: string;
  features: Feature[];
  not_building: string;
  success_metric: string;
  first_user: string;
}

function parseData(raw: Record<string, unknown>): MvpData {
  return {
    core_value_prop: (raw.core_value_prop as string) ?? "",
    features: (raw.features as Feature[]) ?? [],
    not_building: (raw.not_building as string) ?? "",
    success_metric: (raw.success_metric as string) ?? "",
    first_user: (raw.first_user as string) ?? "",
  };
}

export function MvpDefinition({ teamId, userId, isReadOnly, existingArtifact }: {
  teamId: string; userId: string; isReadOnly: boolean;
  existingArtifact: { id: string; data: Record<string, unknown> } | null;
}) {
  const [data, setData] = useState<MvpData>(() => parseData(existingArtifact?.data ?? {}));
  const [artifactId, setArtifactId] = useState(existingArtifact?.id ?? null);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const supabase = createClient();

  function update(field: keyof MvpData, value: unknown) {
    setData((prev) => ({ ...prev, [field]: value }));
    setSaved(false);
  }

  function addFeature() {
    update("features", [...data.features, { id: crypto.randomUUID(), description: "", isCore: true }]);
  }
  function updateFeature(id: string, field: keyof Feature, value: unknown) {
    update("features", data.features.map((f) => f.id === id ? { ...f, [field]: value } : f));
  }
  function deleteFeature(id: string) {
    update("features", data.features.filter((f) => f.id !== id));
  }

  async function handleSave() {
    setSaving(true);
    if (artifactId) {
      await supabase.from("artifacts").update({ data: data as unknown as Record<string, unknown>, updated_at: new Date().toISOString() }).eq("id", artifactId);
    } else {
      const { data: a } = await supabase.from("artifacts").insert({ team_id: teamId, artifact_type: "mvp_definition", title: "MVP Definition", data: data as unknown as Record<string, unknown>, created_by: userId }).select("id").single();
      if (a) setArtifactId(a.id);
    }
    setSaving(false);
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  }

  const coreCount = data.features.filter((f) => f.isCore).length;
  const niceToHaveCount = data.features.filter((f) => !f.isCore).length;

  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <Label>Core value proposition (one sentence)</Label>
        <Textarea placeholder="What does this MVP do for whom?" value={data.core_value_prop} onChange={(e) => update("core_value_prop", e.target.value)} disabled={isReadOnly} rows={2} />
      </div>
      <Separator />
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <div>
            <Label>Feature list</Label>
            <p className="text-xs text-muted-foreground mt-0.5">
              {coreCount} core · {niceToHaveCount} nice-to-have
            </p>
          </div>
          {!isReadOnly && <Button size="sm" variant="outline" onClick={addFeature}><PlusCircle className="size-4" />Add Feature</Button>}
        </div>
        {data.features.map((feature) => (
          <div key={feature.id} className="flex items-start gap-3 rounded-lg border p-3">
            <div className="flex items-center gap-2 pt-1">
              <Checkbox id={`core-${feature.id}`} checked={feature.isCore} onCheckedChange={(v) => updateFeature(feature.id, "isCore", v === true)} disabled={isReadOnly} />
              <Label htmlFor={`core-${feature.id}`} className="text-xs cursor-pointer">Core</Label>
            </div>
            <Input placeholder="Feature description" value={feature.description} onChange={(e) => updateFeature(feature.id, "description", e.target.value)} disabled={isReadOnly} className="flex-1" />
            <Badge variant={feature.isCore ? "default" : "secondary"} className="text-xs shrink-0 mt-1">{feature.isCore ? "Core" : "Nice-to-have"}</Badge>
            {!isReadOnly && <Button size="sm" variant="ghost" onClick={() => deleteFeature(feature.id)} className="text-destructive hover:text-destructive h-8 px-2"><Trash2 className="size-3" /></Button>}
          </div>
        ))}
      </div>
      <Separator />
      <div className="space-y-2">
        <Label>What we are NOT building</Label>
        <p className="text-xs text-muted-foreground">Being explicit about out-of-scope prevents scope creep.</p>
        <Textarea placeholder="List features or capabilities explicitly excluded from this MVP..." value={data.not_building} onChange={(e) => update("not_building", e.target.value)} disabled={isReadOnly} rows={3} />
      </div>
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-2">
          <Label>How success is measured</Label>
          <Input placeholder="The one metric that proves this MVP is working" value={data.success_metric} onChange={(e) => update("success_metric", e.target.value)} disabled={isReadOnly} />
        </div>
        <div className="space-y-2">
          <Label>First user / customer</Label>
          <Input placeholder="Who will use it and how will you get them?" value={data.first_user} onChange={(e) => update("first_user", e.target.value)} disabled={isReadOnly} />
        </div>
      </div>
      {!isReadOnly && (
        <Button onClick={handleSave} disabled={saving}>
          {saving ? <><Loader2 className="size-4 animate-spin" />Saving...</> : saved ? <><Check className="size-4" />Saved</> : <><Save className="size-4" />Save MVP Definition</>}
        </Button>
      )}
    </div>
  );
}
