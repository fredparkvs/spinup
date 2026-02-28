"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { X } from "lucide-react";
import type { JbJobType, JbWorkMode } from "@/lib/jobs/types";

const JOB_TYPES: { value: JbJobType; label: string }[] = [
  { value: "paid_internship", label: "Paid Internship" },
  { value: "unpaid_internship", label: "Unpaid Internship" },
  { value: "part_time_contractor", label: "Part-time Contractor" },
  { value: "full_time_contractor", label: "Full-time Contractor" },
  { value: "employment", label: "Employment" },
];

const WORK_MODES: { value: JbWorkMode; label: string }[] = [
  { value: "remote", label: "Remote" },
  { value: "hybrid", label: "Hybrid" },
  { value: "in_person", label: "In Person" },
];

export function ApplicantFilters() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const skills = searchParams.get("skills") ?? "";
  const location = searchParams.get("location") ?? "";
  const jobTypes = searchParams.getAll("jobType");
  const workModes = searchParams.getAll("workMode");

  function updateParams(updates: Record<string, string | string[] | null>) {
    const params = new URLSearchParams(searchParams.toString());
    for (const [key, value] of Object.entries(updates)) {
      params.delete(key);
      if (value === null) continue;
      if (Array.isArray(value)) {
        value.forEach((v) => params.append(key, v));
      } else if (value) {
        params.set(key, value);
      }
    }
    router.push(`/jobs/applicants?${params.toString()}`);
  }

  function clearAll() {
    router.push("/jobs/applicants");
  }

  const hasFilters = skills || location || jobTypes.length > 0 || workModes.length > 0;

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-sm">Filters</CardTitle>
          {hasFilters && (
            <Button variant="ghost" size="sm" onClick={clearAll}>
              <X className="size-3" />
              Clear
            </Button>
          )}
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <div>
          <Label className="text-xs">Skills</Label>
          <Input
            value={skills}
            onChange={(e) => updateParams({ skills: e.target.value || null })}
            placeholder="e.g. Python"
          />
        </div>

        <div>
          <Label className="text-xs">Location</Label>
          <Input
            value={location}
            onChange={(e) => updateParams({ location: e.target.value || null })}
            placeholder="e.g. Cape Town"
          />
        </div>

        <div>
          <Label className="text-xs mb-2 block">Job Type</Label>
          {JOB_TYPES.map((jt) => (
            <div key={jt.value} className="flex items-center gap-2 mb-1">
              <Checkbox
                id={`filter-${jt.value}`}
                checked={jobTypes.includes(jt.value)}
                onCheckedChange={(checked) => {
                  const next = checked
                    ? [...jobTypes, jt.value]
                    : jobTypes.filter((x) => x !== jt.value);
                  updateParams({ jobType: next.length > 0 ? next : null });
                }}
              />
              <Label htmlFor={`filter-${jt.value}`} className="text-xs">
                {jt.label}
              </Label>
            </div>
          ))}
        </div>

        <div>
          <Label className="text-xs mb-2 block">Work Mode</Label>
          {WORK_MODES.map((wm) => (
            <div key={wm.value} className="flex items-center gap-2 mb-1">
              <Checkbox
                id={`filter-${wm.value}`}
                checked={workModes.includes(wm.value)}
                onCheckedChange={(checked) => {
                  const next = checked
                    ? [...workModes, wm.value]
                    : workModes.filter((x) => x !== wm.value);
                  updateParams({ workMode: next.length > 0 ? next : null });
                }}
              />
              <Label htmlFor={`filter-${wm.value}`} className="text-xs">
                {wm.label}
              </Label>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
