"use client";

import { useState, useTransition } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Plus, Trash2, Loader2, Check } from "lucide-react";
import { saveCompanyProfile } from "@/app/(app)/jobs/company-profile/actions";
import type { JbCompany, LinkedInEntry } from "@/lib/jobs/types";

interface Props {
  company: JbCompany;
}

const EMPTY_LINKEDIN: LinkedInEntry = { name: "", role: "", linkedin_url: "" };

export function CompanyProfileForm({ company }: Props) {
  const [name, setName] = useState(company.name);
  const [whatWeDo, setWhatWeDo] = useState(company.what_we_do ?? "");
  const [howWeWork, setHowWeWork] = useState(company.how_we_work ?? "");
  const [websiteUrl, setWebsiteUrl] = useState(company.website_url ?? "");
  const [teamLinkedin, setTeamLinkedin] = useState<LinkedInEntry[]>(
    company.team_linkedin.length > 0 ? company.team_linkedin : []
  );
  const [isPending, startTransition] = useTransition();
  const [saved, setSaved] = useState(false);

  function handleSave() {
    startTransition(async () => {
      const fd = new FormData();
      fd.set("company_id", company.id);
      fd.set(
        "data",
        JSON.stringify({
          name,
          what_we_do: whatWeDo,
          how_we_work: howWeWork,
          website_url: websiteUrl,
          team_linkedin: teamLinkedin.filter((e) => e.name),
        })
      );
      await saveCompanyProfile(fd);
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    });
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Company Details</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label className="text-xs">Company Name</Label>
            <Input value={name} onChange={(e) => setName(e.target.value)} />
          </div>
          <div>
            <Label className="text-xs">What We Do</Label>
            <Textarea
              value={whatWeDo}
              onChange={(e) => setWhatWeDo(e.target.value)}
              placeholder="Describe what your company does..."
              rows={4}
            />
          </div>
          <div>
            <Label className="text-xs">How We Work</Label>
            <Textarea
              value={howWeWork}
              onChange={(e) => setHowWeWork(e.target.value)}
              placeholder="Describe your work culture, remote policy, etc..."
              rows={4}
            />
          </div>
          <div>
            <Label className="text-xs">Website URL (optional)</Label>
            <Input
              value={websiteUrl}
              onChange={(e) => setWebsiteUrl(e.target.value)}
              placeholder="https://example.com"
            />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Team LinkedIn</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {teamLinkedin.map((entry, i) => (
            <div key={i} className="grid grid-cols-3 gap-2 items-end">
              <div>
                <Label className="text-xs">Name</Label>
                <Input
                  value={entry.name}
                  onChange={(e) => {
                    const arr = [...teamLinkedin];
                    arr[i] = { ...entry, name: e.target.value };
                    setTeamLinkedin(arr);
                  }}
                />
              </div>
              <div>
                <Label className="text-xs">Role</Label>
                <Input
                  value={entry.role}
                  onChange={(e) => {
                    const arr = [...teamLinkedin];
                    arr[i] = { ...entry, role: e.target.value };
                    setTeamLinkedin(arr);
                  }}
                />
              </div>
              <div className="flex gap-2">
                <div className="flex-1">
                  <Label className="text-xs">LinkedIn URL</Label>
                  <Input
                    value={entry.linkedin_url}
                    onChange={(e) => {
                      const arr = [...teamLinkedin];
                      arr[i] = { ...entry, linkedin_url: e.target.value };
                      setTeamLinkedin(arr);
                    }}
                    placeholder="https://linkedin.com/in/..."
                  />
                </div>
                <Button
                  variant="ghost"
                  size="icon-sm"
                  className="mt-5"
                  onClick={() => setTeamLinkedin(teamLinkedin.filter((_, j) => j !== i))}
                >
                  <Trash2 className="size-3.5" />
                </Button>
              </div>
            </div>
          ))}
          <Button
            variant="outline"
            size="sm"
            onClick={() => setTeamLinkedin([...teamLinkedin, { ...EMPTY_LINKEDIN }])}
          >
            <Plus className="size-3.5" />
            Add team member
          </Button>
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
            "Save profile"
          )}
        </Button>
      </div>
    </div>
  );
}
