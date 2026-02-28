"use client";

import { useState, useTransition } from "react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Loader2, Check } from "lucide-react";
import { savePreferences } from "@/app/(app)/jobs/preferences/actions";
import type { JbApplicantPreferences, JbJobType, JbWorkMode, JbAvailabilityType } from "@/lib/jobs/types";

const JOB_TYPE_LABELS: Record<JbJobType, string> = {
  paid_internship: "Paid Internship",
  unpaid_internship: "Unpaid Internship",
  part_time_contractor: "Part-time Contractor",
  full_time_contractor: "Full-time Contractor",
  employment: "Employment",
};

const WORK_MODE_LABELS: Record<JbWorkMode, string> = {
  remote: "Remote",
  hybrid: "Hybrid",
  in_person: "In Person",
};

interface Props {
  profileId: string;
  preferences: JbApplicantPreferences | null;
}

export function ApplicantPreferencesForm({ profileId, preferences }: Props) {
  const [jobTypes, setJobTypes] = useState<JbJobType[]>(preferences?.job_types ?? []);
  const [availabilityType, setAvailabilityType] = useState<JbAvailabilityType>(
    preferences?.availability_type ?? "start_date_only"
  );
  const [availableFrom, setAvailableFrom] = useState(preferences?.available_from ?? "");
  const [availableUntil, setAvailableUntil] = useState(preferences?.available_until ?? "");
  const [workModes, setWorkModes] = useState<JbWorkMode[]>(preferences?.work_modes ?? []);
  const [isPending, startTransition] = useTransition();
  const [saved, setSaved] = useState(false);

  function toggleJobType(jt: JbJobType) {
    setJobTypes((prev) =>
      prev.includes(jt) ? prev.filter((x) => x !== jt) : [...prev, jt]
    );
  }

  function toggleWorkMode(wm: JbWorkMode) {
    setWorkModes((prev) =>
      prev.includes(wm) ? prev.filter((x) => x !== wm) : [...prev, wm]
    );
  }

  function handleSave() {
    startTransition(async () => {
      const fd = new FormData();
      fd.set("profile_id", profileId);
      fd.set(
        "data",
        JSON.stringify({
          job_types: jobTypes,
          availability_type: availabilityType,
          available_from: availableFrom,
          available_until: availabilityType === "date_range" ? availableUntil : null,
          work_modes: workModes,
        })
      );
      await savePreferences(fd);
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    });
  }

  return (
    <div className="space-y-6">
      {/* Job Types */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">What type of role are you looking for?</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          {(Object.keys(JOB_TYPE_LABELS) as JbJobType[]).map((jt) => (
            <div key={jt} className="flex items-center gap-2">
              <Checkbox
                id={jt}
                checked={jobTypes.includes(jt)}
                onCheckedChange={() => toggleJobType(jt)}
              />
              <Label htmlFor={jt} className="text-sm">
                {JOB_TYPE_LABELS[jt]}
              </Label>
            </div>
          ))}
        </CardContent>
      </Card>

      {/* Availability */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">When are you available?</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <RadioGroup
            value={availabilityType}
            onValueChange={(v) => setAvailabilityType(v as JbAvailabilityType)}
          >
            <div className="flex items-center gap-2">
              <RadioGroupItem value="start_date_only" id="start_date" />
              <Label htmlFor="start_date" className="text-sm">
                From a specific date
              </Label>
            </div>
            <div className="flex items-center gap-2">
              <RadioGroupItem value="date_range" id="date_range" />
              <Label htmlFor="date_range" className="text-sm">
                During a specific period (e.g. holidays)
              </Label>
            </div>
          </RadioGroup>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label className="text-xs">Available from</Label>
              <Input
                type="date"
                value={availableFrom}
                onChange={(e) => setAvailableFrom(e.target.value)}
              />
            </div>
            {availabilityType === "date_range" && (
              <div>
                <Label className="text-xs">Available until</Label>
                <Input
                  type="date"
                  value={availableUntil}
                  onChange={(e) => setAvailableUntil(e.target.value)}
                />
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Work Mode */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Work arrangement</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          {(Object.keys(WORK_MODE_LABELS) as JbWorkMode[]).map((wm) => (
            <div key={wm} className="flex items-center gap-2">
              <Checkbox
                id={wm}
                checked={workModes.includes(wm)}
                onCheckedChange={() => toggleWorkMode(wm)}
              />
              <Label htmlFor={wm} className="text-sm">
                {WORK_MODE_LABELS[wm]}
              </Label>
            </div>
          ))}
        </CardContent>
      </Card>

      <div className="flex justify-end">
        <Button onClick={handleSave} disabled={isPending}>
          {isPending ? (
            <>
              <Loader2 className="size-4 animate-spin" />
              Saving…
            </>
          ) : saved ? (
            <>
              <Check className="size-4" />
              Saved
            </>
          ) : (
            "Save preferences"
          )}
        </Button>
      </div>
    </div>
  );
}
