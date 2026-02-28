"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { Separator } from "@/components/ui/separator";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Plus, Trash2, Loader2, Check, X, ArrowRight } from "lucide-react";
import { saveApplicantProfile } from "@/app/(app)/jobs/profile/actions";
import type { JbApplicantProfile, JbApplicantPreferences, AcademicEntry, WorkExperienceEntry, JbJobType, JbWorkMode } from "@/lib/jobs/types";

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
  profile: JbApplicantProfile;
  preferences: JbApplicantPreferences | null;
}

const EMPTY_ACADEMIC: AcademicEntry = {
  institution: "",
  degree: "",
  field: "",
  status: "current",
  year_start: new Date().getFullYear(),
  year_end: null,
};

const EMPTY_EXPERIENCE: WorkExperienceEntry = {
  company: "",
  role: "",
  description: "",
  start_date: "",
  end_date: null,
  current: false,
};

export function ApplicantProfileForm({ profile, preferences }: Props) {
  const [academics, setAcademics] = useState<AcademicEntry[]>(
    profile.academics.length > 0 ? profile.academics : [{ ...EMPTY_ACADEMIC }]
  );
  const [skills, setSkills] = useState<string[]>(profile.software_skills);
  const [skillInput, setSkillInput] = useState("");
  const [languages, setLanguages] = useState<string[]>(profile.languages);
  const [languageInput, setLanguageInput] = useState("");
  const [locationCity, setLocationCity] = useState(profile.location_city ?? "");
  const [locationCountry, setLocationCountry] = useState(profile.location_country ?? "");
  const [willingToRelocate, setWillingToRelocate] = useState(profile.willing_to_relocate);
  const [experience, setExperience] = useState<WorkExperienceEntry[]>(
    profile.work_experience.length > 0 ? profile.work_experience : []
  );
  const [personality, setPersonality] = useState(profile.personality_description ?? "");
  const [lookingFor, setLookingFor] = useState(profile.looking_for ?? "");
  const [isPending, startTransition] = useTransition();
  const [saved, setSaved] = useState(false);

  function addSkill() {
    const v = skillInput.trim();
    if (v && !skills.includes(v)) {
      setSkills([...skills, v]);
      setSkillInput("");
    }
  }

  function addLanguage() {
    const v = languageInput.trim();
    if (v && !languages.includes(v)) {
      setLanguages([...languages, v]);
      setLanguageInput("");
    }
  }

  function handleSave() {
    startTransition(async () => {
      const fd = new FormData();
      fd.set("profile_id", profile.id);
      fd.set(
        "data",
        JSON.stringify({
          academics: academics.filter((a) => a.institution),
          software_skills: skills,
          languages,
          location_city: locationCity,
          location_country: locationCountry,
          willing_to_relocate: willingToRelocate,
          work_experience: experience.filter((e) => e.company),
          personality_description: personality,
          looking_for: lookingFor,
        })
      );
      await saveApplicantProfile(fd);
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    });
  }

  return (
    <div className="space-y-6">
      <p className="text-xs text-muted-foreground">
        Your anonymous ID: <span className="font-mono font-medium">{profile.anonymous_id}</span>
      </p>

      {/* Academics */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Academics</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {academics.map((a, i) => (
            <div key={i} className="space-y-3 rounded-md border p-3">
              <div className="flex items-start justify-between">
                <p className="text-sm font-medium">Entry {i + 1}</p>
                {academics.length > 1 && (
                  <Button
                    variant="ghost"
                    size="icon-xs"
                    onClick={() => setAcademics(academics.filter((_, j) => j !== i))}
                  >
                    <Trash2 className="size-3.5" />
                  </Button>
                )}
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="col-span-2">
                  <Label className="text-xs">Institution</Label>
                  <Input
                    value={a.institution}
                    onChange={(e) => {
                      const arr = [...academics];
                      arr[i] = { ...a, institution: e.target.value };
                      setAcademics(arr);
                    }}
                    placeholder="University of Cape Town"
                  />
                </div>
                <div>
                  <Label className="text-xs">Degree</Label>
                  <Input
                    value={a.degree}
                    onChange={(e) => {
                      const arr = [...academics];
                      arr[i] = { ...a, degree: e.target.value };
                      setAcademics(arr);
                    }}
                    placeholder="BSc"
                  />
                </div>
                <div>
                  <Label className="text-xs">Field</Label>
                  <Input
                    value={a.field}
                    onChange={(e) => {
                      const arr = [...academics];
                      arr[i] = { ...a, field: e.target.value };
                      setAcademics(arr);
                    }}
                    placeholder="Computer Science"
                  />
                </div>
                <div>
                  <Label className="text-xs">Status</Label>
                  <Select
                    value={a.status}
                    onValueChange={(v) => {
                      const arr = [...academics];
                      arr[i] = { ...a, status: v as "current" | "completed" };
                      setAcademics(arr);
                    }}
                  >
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="current">Current</SelectItem>
                      <SelectItem value="completed">Completed</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label className="text-xs">Year started</Label>
                  <Input
                    type="number"
                    value={a.year_start}
                    onChange={(e) => {
                      const arr = [...academics];
                      arr[i] = { ...a, year_start: parseInt(e.target.value) || 0 };
                      setAcademics(arr);
                    }}
                  />
                </div>
              </div>
            </div>
          ))}
          <Button
            variant="outline"
            size="sm"
            onClick={() => setAcademics([...academics, { ...EMPTY_ACADEMIC }])}
          >
            <Plus className="size-3.5" />
            Add entry
          </Button>
        </CardContent>
      </Card>

      {/* Software Skills */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Software Skills</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="flex flex-wrap gap-1.5">
            {skills.map((s) => (
              <Badge key={s} variant="secondary" className="gap-1">
                {s}
                <button onClick={() => setSkills(skills.filter((x) => x !== s))}>
                  <X className="size-3" />
                </button>
              </Badge>
            ))}
          </div>
          <div className="flex gap-2">
            <Input
              value={skillInput}
              onChange={(e) => setSkillInput(e.target.value)}
              placeholder="e.g. Python, React, SQL"
              onKeyDown={(e) => e.key === "Enter" && (e.preventDefault(), addSkill())}
            />
            <Button variant="outline" size="sm" onClick={addSkill}>
              Add
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Languages */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Languages</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="flex flex-wrap gap-1.5">
            {languages.map((l) => (
              <Badge key={l} variant="secondary" className="gap-1">
                {l}
                <button onClick={() => setLanguages(languages.filter((x) => x !== l))}>
                  <X className="size-3" />
                </button>
              </Badge>
            ))}
          </div>
          <div className="flex gap-2">
            <Input
              value={languageInput}
              onChange={(e) => setLanguageInput(e.target.value)}
              placeholder="e.g. English, Afrikaans, Zulu"
              onKeyDown={(e) => e.key === "Enter" && (e.preventDefault(), addLanguage())}
            />
            <Button variant="outline" size="sm" onClick={addLanguage}>
              Add
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Location */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Location</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label className="text-xs">City</Label>
              <Input
                value={locationCity}
                onChange={(e) => setLocationCity(e.target.value)}
                placeholder="Cape Town"
              />
            </div>
            <div>
              <Label className="text-xs">Country</Label>
              <Input
                value={locationCountry}
                onChange={(e) => setLocationCountry(e.target.value)}
                placeholder="South Africa"
              />
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Checkbox
              id="relocate"
              checked={willingToRelocate}
              onCheckedChange={(c) => setWillingToRelocate(!!c)}
            />
            <Label htmlFor="relocate" className="text-sm">
              Willing to relocate
            </Label>
          </div>
        </CardContent>
      </Card>

      {/* Work Experience */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Work Experience</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {experience.map((e, i) => (
            <div key={i} className="space-y-3 rounded-md border p-3">
              <div className="flex items-start justify-between">
                <p className="text-sm font-medium">Position {i + 1}</p>
                <Button
                  variant="ghost"
                  size="icon-xs"
                  onClick={() => setExperience(experience.filter((_, j) => j !== i))}
                >
                  <Trash2 className="size-3.5" />
                </Button>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label className="text-xs">Company</Label>
                  <Input
                    value={e.company}
                    onChange={(ev) => {
                      const arr = [...experience];
                      arr[i] = { ...e, company: ev.target.value };
                      setExperience(arr);
                    }}
                  />
                </div>
                <div>
                  <Label className="text-xs">Role</Label>
                  <Input
                    value={e.role}
                    onChange={(ev) => {
                      const arr = [...experience];
                      arr[i] = { ...e, role: ev.target.value };
                      setExperience(arr);
                    }}
                  />
                </div>
                <div className="col-span-2">
                  <Label className="text-xs">Description</Label>
                  <Textarea
                    value={e.description}
                    onChange={(ev) => {
                      const arr = [...experience];
                      arr[i] = { ...e, description: ev.target.value };
                      setExperience(arr);
                    }}
                    rows={2}
                  />
                </div>
              </div>
            </div>
          ))}
          <Button
            variant="outline"
            size="sm"
            onClick={() => setExperience([...experience, { ...EMPTY_EXPERIENCE }])}
          >
            <Plus className="size-3.5" />
            Add experience
          </Button>
        </CardContent>
      </Card>

      {/* Personality & Looking For */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">About You</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label className="text-xs">Personality</Label>
            <Textarea
              value={personality}
              onChange={(e) => setPersonality(e.target.value)}
              placeholder="Describe your personality, work style, and what motivates you..."
              rows={3}
            />
          </div>
          <div>
            <Label className="text-xs">What I&apos;m looking for</Label>
            <Textarea
              value={lookingFor}
              onChange={(e) => setLookingFor(e.target.value)}
              placeholder="Describe the kind of role, company, or environment you're looking for..."
              rows={3}
            />
          </div>
        </CardContent>
      </Card>

      {/* Preferences summary (read-only) */}
      {preferences && (
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="text-base">Job Preferences</CardTitle>
              <Button asChild variant="ghost" size="sm" className="text-xs text-muted-foreground h-auto py-1">
                <Link href="/jobs/preferences">Edit</Link>
              </Button>
            </div>
          </CardHeader>
          <CardContent className="space-y-3">
            {preferences.job_types && preferences.job_types.length > 0 && (
              <div>
                <p className="text-xs text-muted-foreground mb-1.5">Looking for</p>
                <div className="flex flex-wrap gap-1.5">
                  {preferences.job_types.map((jt) => (
                    <Badge key={jt} variant="secondary" className="text-xs">
                      {JOB_TYPE_LABELS[jt] ?? jt}
                    </Badge>
                  ))}
                </div>
              </div>
            )}
            {preferences.work_modes && preferences.work_modes.length > 0 && (
              <div>
                <p className="text-xs text-muted-foreground mb-1.5">Work arrangement</p>
                <div className="flex flex-wrap gap-1.5">
                  {preferences.work_modes.map((wm) => (
                    <Badge key={wm} variant="outline" className="text-xs">
                      {WORK_MODE_LABELS[wm] ?? wm}
                    </Badge>
                  ))}
                </div>
              </div>
            )}
            {preferences.available_from && (
              <div>
                <p className="text-xs text-muted-foreground mb-1">Availability</p>
                <p className="text-sm">
                  From {new Date(preferences.available_from).toLocaleDateString("en-ZA", { day: "numeric", month: "long", year: "numeric" })}
                  {preferences.available_until
                    ? ` to ${new Date(preferences.available_until).toLocaleDateString("en-ZA", { day: "numeric", month: "long", year: "numeric" })}`
                    : ""}
                </p>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      <Separator />

      <div className="flex items-center justify-between">
        <Button onClick={handleSave} disabled={isPending} variant="outline">
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
            "Save profile"
          )}
        </Button>

        <Button asChild>
          <Link href="/jobs/my-profile">
            Next: Preview & Publish
            <ArrowRight className="size-4" />
          </Link>
        </Button>
      </div>
    </div>
  );
}
