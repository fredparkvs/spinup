"use client";

import { useState, useCallback, useEffect } from "react";
import { createClient } from "@/lib/supabase/client";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Separator } from "@/components/ui/separator";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import {
  Building2,
  ExternalLink,
  ArrowLeft,
  ArrowRight,
  Check,
  Loader2,
  Save,
} from "lucide-react";

/* -------------------------------------------------------------------------- */
/*  Types                                                                      */
/* -------------------------------------------------------------------------- */

interface CompanyNameData {
  // Step 1
  proposedName: string;
  barTest: {
    easyToPronounce: boolean;
    easyToSpell: boolean;
    notConfused: boolean;
    memorable: boolean;
  };
  // Step 2
  nameSearch: {
    status: "available" | "not_available" | "need_alternative" | "";
    notes: string;
  };
  // Step 3
  trademarkSearch: {
    status: "no_conflicts" | "potential_conflict" | "conflict_found" | "";
    notes: string;
  };
  // Step 4
  domainCheck: {
    coZaAvailable: boolean;
    comAvailable: boolean;
    notes: string;
  };
  // Step 5
  confirmedName: string;
}

interface CompanyNameCheckerProps {
  teamId: string;
  userId: string;
  existingArtifact: {
    id: string;
    data: Record<string, unknown>;
    status: string;
  } | null;
  currentOperatingName: string | null;
}

const TOTAL_STEPS = 5;

const DEFAULT_DATA: CompanyNameData = {
  proposedName: "",
  barTest: {
    easyToPronounce: false,
    easyToSpell: false,
    notConfused: false,
    memorable: false,
  },
  nameSearch: { status: "", notes: "" },
  trademarkSearch: { status: "", notes: "" },
  domainCheck: { coZaAvailable: false, comAvailable: false, notes: "" },
  confirmedName: "",
};

function parseExistingData(
  raw: Record<string, unknown> | null
): CompanyNameData {
  if (!raw) return { ...DEFAULT_DATA };
  try {
    return {
      proposedName: (raw.proposedName as string) ?? "",
      barTest: {
        easyToPronounce:
          (raw.barTest as Record<string, unknown>)?.easyToPronounce === true,
        easyToSpell:
          (raw.barTest as Record<string, unknown>)?.easyToSpell === true,
        notConfused:
          (raw.barTest as Record<string, unknown>)?.notConfused === true,
        memorable:
          (raw.barTest as Record<string, unknown>)?.memorable === true,
      },
      nameSearch: {
        status:
          ((raw.nameSearch as Record<string, unknown>)?.status as string) ?? "",
        notes:
          ((raw.nameSearch as Record<string, unknown>)?.notes as string) ?? "",
      },
      trademarkSearch: {
        status:
          ((raw.trademarkSearch as Record<string, unknown>)?.status as string) ??
          "",
        notes:
          ((raw.trademarkSearch as Record<string, unknown>)?.notes as string) ??
          "",
      },
      domainCheck: {
        coZaAvailable:
          (raw.domainCheck as Record<string, unknown>)?.coZaAvailable === true,
        comAvailable:
          (raw.domainCheck as Record<string, unknown>)?.comAvailable === true,
        notes:
          ((raw.domainCheck as Record<string, unknown>)?.notes as string) ?? "",
      },
      confirmedName: (raw.confirmedName as string) ?? "",
    };
  } catch {
    return { ...DEFAULT_DATA };
  }
}

/* -------------------------------------------------------------------------- */
/*  Main Component                                                             */
/* -------------------------------------------------------------------------- */

export function CompanyNameChecker({
  teamId,
  userId,
  existingArtifact,
  currentOperatingName,
}: CompanyNameCheckerProps) {
  const [step, setStep] = useState(0);
  const [data, setData] = useState<CompanyNameData>(() => {
    const parsed = parseExistingData(existingArtifact?.data ?? null);
    // Pre-fill confirmed name from proposed name or current operating name
    if (!parsed.confirmedName && parsed.proposedName) {
      parsed.confirmedName = parsed.proposedName;
    }
    if (!parsed.confirmedName && currentOperatingName) {
      parsed.confirmedName = currentOperatingName;
    }
    return parsed;
  });
  const [artifactId, setArtifactId] = useState<string | null>(
    existingArtifact?.id ?? null
  );
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [confirming, setConfirming] = useState(false);
  const [confirmed, setConfirmed] = useState(
    existingArtifact?.status === "complete"
  );

  const supabase = createClient();

  const barTestScore = [
    data.barTest.easyToPronounce,
    data.barTest.easyToSpell,
    data.barTest.notConfused,
    data.barTest.memorable,
  ].filter(Boolean).length;

  const progressValue = ((step + 1) / TOTAL_STEPS) * 100;

  /* -------------------------------------------------------------------------- */
  /*  Save logic                                                                 */
  /* -------------------------------------------------------------------------- */

  const saveProgress = useCallback(
    async (status: "draft" | "complete" = "draft") => {
      setSaving(true);
      setSaved(false);

      try {
        if (artifactId) {
          // Update existing artifact
          await supabase
            .from("artifacts")
            .update({
              data: data as unknown as Record<string, unknown>,
              status,
              updated_at: new Date().toISOString(),
            })
            .eq("id", artifactId);
        } else {
          // Insert new artifact
          const { data: newArtifact } = await supabase
            .from("artifacts")
            .insert({
              team_id: teamId,
              artifact_type: "company_name",
              title: "Company Name Checker",
              data: data as unknown as Record<string, unknown>,
              status,
              created_by: userId,
            })
            .select("id")
            .single();

          if (newArtifact) {
            setArtifactId(newArtifact.id);
          }
        }
        setSaved(true);
        setTimeout(() => setSaved(false), 2000);
      } catch {
        // Error saving -- silent fail for auto-save
      } finally {
        setSaving(false);
      }
    },
    [artifactId, data, supabase, teamId, userId]
  );

  // Auto-save when navigating between steps
  const goToStep = useCallback(
    (targetStep: number) => {
      saveProgress("draft");
      setStep(targetStep);
    },
    [saveProgress]
  );

  /* -------------------------------------------------------------------------- */
  /*  Confirm name                                                               */
  /* -------------------------------------------------------------------------- */

  async function handleConfirmName() {
    if (!data.confirmedName.trim()) return;
    setConfirming(true);

    try {
      // Save artifact as complete
      await saveProgress("complete");

      // Update team's operating_name
      await supabase
        .from("teams")
        .update({ operating_name: data.confirmedName.trim() })
        .eq("id", teamId);

      setConfirmed(true);
    } catch {
      // Error confirming
    } finally {
      setConfirming(false);
    }
  }

  /* -------------------------------------------------------------------------- */
  /*  Render                                                                     */
  /* -------------------------------------------------------------------------- */

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <Building2 className="size-6 text-primary" />
        <div>
          <h1 className="text-2xl font-bold tracking-tight">
            Company Name Checker
          </h1>
          <p className="text-sm text-muted-foreground">
            Validate your company name before registration
          </p>
        </div>
      </div>

      {/* Progress */}
      <div className="space-y-2">
        <div className="flex items-center justify-between text-sm">
          <span className="text-muted-foreground">
            Step {step + 1} of {TOTAL_STEPS}
          </span>
          <div className="flex items-center gap-2">
            {saving && (
              <span className="flex items-center gap-1 text-muted-foreground">
                <Loader2 className="size-3 animate-spin" />
                Saving...
              </span>
            )}
            {saved && (
              <span className="flex items-center gap-1 text-green-600">
                <Check className="size-3" />
                Saved
              </span>
            )}
          </div>
        </div>
        <Progress value={progressValue} />
        <div className="flex justify-between">
          {["Bar Test", "Name Search", "Trademark", "Domain", "Confirm"].map(
            (label, i) => (
              <button
                key={label}
                onClick={() => goToStep(i)}
                className={`text-xs transition-colors ${
                  i === step
                    ? "font-medium text-primary"
                    : i < step
                      ? "text-muted-foreground hover:text-foreground"
                      : "text-muted-foreground/50"
                }`}
              >
                {label}
              </button>
            )
          )}
        </div>
      </div>

      {/* Steps */}
      {step === 0 && (
        <StepBarTest
          data={data}
          barTestScore={barTestScore}
          onChange={setData}
        />
      )}
      {step === 1 && <StepNameSearch data={data} onChange={setData} />}
      {step === 2 && <StepTrademarkSearch data={data} onChange={setData} />}
      {step === 3 && <StepDomainCheck data={data} onChange={setData} />}
      {step === 4 && (
        <StepFinalDecision
          data={data}
          barTestScore={barTestScore}
          onChange={setData}
          onConfirm={handleConfirmName}
          confirming={confirming}
          confirmed={confirmed}
        />
      )}

      {/* Navigation */}
      <div className="flex items-center justify-between">
        <Button
          variant="outline"
          onClick={() => goToStep(step - 1)}
          disabled={step === 0}
        >
          <ArrowLeft className="size-4" />
          Back
        </Button>

        <Button variant="ghost" size="sm" onClick={() => saveProgress("draft")}>
          <Save className="size-4" />
          Save
        </Button>

        {step < TOTAL_STEPS - 1 ? (
          <Button onClick={() => goToStep(step + 1)}>
            Next
            <ArrowRight className="size-4" />
          </Button>
        ) : (
          <div />
        )}
      </div>
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/*  Step 1 — The Bar Test                                                      */
/* -------------------------------------------------------------------------- */

function StepBarTest({
  data,
  barTestScore,
  onChange,
}: {
  data: CompanyNameData;
  barTestScore: number;
  onChange: (d: CompanyNameData) => void;
}) {
  function toggleCriteria(key: keyof CompanyNameData["barTest"]) {
    onChange({
      ...data,
      barTest: { ...data.barTest, [key]: !data.barTest[key] },
    });
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg">Step 1: The Bar Test</CardTitle>
        <CardDescription>
          Can you tell someone your company name in a noisy bar and have them
          spell it correctly the first time?
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="space-y-2">
          <Label htmlFor="proposed-name">Proposed company name</Label>
          <Input
            id="proposed-name"
            placeholder="Enter your company name"
            value={data.proposedName}
            onChange={(e) =>
              onChange({ ...data, proposedName: e.target.value })
            }
          />
        </div>

        <Separator />

        <div className="space-y-1">
          <p className="text-sm font-medium">
            Score your name against these criteria:
          </p>
          <p className="text-xs text-muted-foreground">
            Check each criterion that your name meets
          </p>
        </div>

        <div className="space-y-3">
          <div className="flex items-center gap-3">
            <Checkbox
              id="easy-pronounce"
              checked={data.barTest.easyToPronounce}
              onCheckedChange={() => toggleCriteria("easyToPronounce")}
            />
            <Label htmlFor="easy-pronounce" className="cursor-pointer">
              Easy to pronounce
            </Label>
          </div>

          <div className="flex items-center gap-3">
            <Checkbox
              id="easy-spell"
              checked={data.barTest.easyToSpell}
              onCheckedChange={() => toggleCriteria("easyToSpell")}
            />
            <Label htmlFor="easy-spell" className="cursor-pointer">
              Easy to spell
            </Label>
          </div>

          <div className="flex items-center gap-3">
            <Checkbox
              id="not-confused"
              checked={data.barTest.notConfused}
              onCheckedChange={() => toggleCriteria("notConfused")}
            />
            <Label htmlFor="not-confused" className="cursor-pointer">
              Not easily confused with another brand
            </Label>
          </div>

          <div className="flex items-center gap-3">
            <Checkbox
              id="memorable"
              checked={data.barTest.memorable}
              onCheckedChange={() => toggleCriteria("memorable")}
            />
            <Label htmlFor="memorable" className="cursor-pointer">
              Memorable in one hearing
            </Label>
          </div>
        </div>
      </CardContent>
      <CardFooter>
        <Badge
          variant={barTestScore >= 3 ? "default" : "secondary"}
          className="text-sm"
        >
          {barTestScore}/4 criteria met
        </Badge>
      </CardFooter>
    </Card>
  );
}

/* -------------------------------------------------------------------------- */
/*  Step 2 — Name Search (Govchain)                                            */
/* -------------------------------------------------------------------------- */

function StepNameSearch({
  data,
  onChange,
}: {
  data: CompanyNameData;
  onChange: (d: CompanyNameData) => void;
}) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg">Step 2: Name Search (CIPC)</CardTitle>
        <CardDescription>
          Check if your company name is available for registration with CIPC
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <Button variant="outline" asChild>
          <a
            href="https://www.govchain.co.za/name-search"
            target="_blank"
            rel="noopener noreferrer"
          >
            <ExternalLink className="size-4" />
            Search on Govchain
          </a>
        </Button>

        <Separator />

        <div className="space-y-3">
          <Label>Availability result</Label>
          <RadioGroup
            value={data.nameSearch.status}
            onValueChange={(value) =>
              onChange({
                ...data,
                nameSearch: {
                  ...data.nameSearch,
                  status: value as CompanyNameData["nameSearch"]["status"],
                },
              })
            }
          >
            <div className="flex items-center gap-3">
              <RadioGroupItem value="available" id="ns-available" />
              <Label htmlFor="ns-available" className="cursor-pointer">
                Available
              </Label>
            </div>
            <div className="flex items-center gap-3">
              <RadioGroupItem value="not_available" id="ns-not-available" />
              <Label htmlFor="ns-not-available" className="cursor-pointer">
                Not available
              </Label>
            </div>
            <div className="flex items-center gap-3">
              <RadioGroupItem
                value="need_alternative"
                id="ns-need-alternative"
              />
              <Label htmlFor="ns-need-alternative" className="cursor-pointer">
                Need alternative
              </Label>
            </div>
          </RadioGroup>
        </div>

        <div className="space-y-2">
          <Label htmlFor="ns-notes">Notes</Label>
          <Textarea
            id="ns-notes"
            placeholder="Any additional notes about your name search..."
            value={data.nameSearch.notes}
            onChange={(e) =>
              onChange({
                ...data,
                nameSearch: { ...data.nameSearch, notes: e.target.value },
              })
            }
            rows={3}
          />
        </div>
      </CardContent>
    </Card>
  );
}

/* -------------------------------------------------------------------------- */
/*  Step 3 — Trademark Search                                                  */
/* -------------------------------------------------------------------------- */

function StepTrademarkSearch({
  data,
  onChange,
}: {
  data: CompanyNameData;
  onChange: (d: CompanyNameData) => void;
}) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg">Step 3: Trademark Search</CardTitle>
        <CardDescription>
          Check if your company name conflicts with existing trademarks
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <Button variant="outline" asChild>
          <a
            href="https://www.govchain.co.za/trademark-search"
            target="_blank"
            rel="noopener noreferrer"
          >
            <ExternalLink className="size-4" />
            Search Trademarks
          </a>
        </Button>

        <Separator />

        <div className="space-y-3">
          <Label>Trademark result</Label>
          <RadioGroup
            value={data.trademarkSearch.status}
            onValueChange={(value) =>
              onChange({
                ...data,
                trademarkSearch: {
                  ...data.trademarkSearch,
                  status:
                    value as CompanyNameData["trademarkSearch"]["status"],
                },
              })
            }
          >
            <div className="flex items-center gap-3">
              <RadioGroupItem value="no_conflicts" id="tm-no-conflicts" />
              <Label htmlFor="tm-no-conflicts" className="cursor-pointer">
                No conflicts
              </Label>
            </div>
            <div className="flex items-center gap-3">
              <RadioGroupItem
                value="potential_conflict"
                id="tm-potential-conflict"
              />
              <Label
                htmlFor="tm-potential-conflict"
                className="cursor-pointer"
              >
                Potential conflict
              </Label>
            </div>
            <div className="flex items-center gap-3">
              <RadioGroupItem
                value="conflict_found"
                id="tm-conflict-found"
              />
              <Label htmlFor="tm-conflict-found" className="cursor-pointer">
                Conflict found
              </Label>
            </div>
          </RadioGroup>
        </div>

        <div className="space-y-2">
          <Label htmlFor="tm-notes">Notes</Label>
          <Textarea
            id="tm-notes"
            placeholder="Any additional notes about trademark conflicts..."
            value={data.trademarkSearch.notes}
            onChange={(e) =>
              onChange({
                ...data,
                trademarkSearch: {
                  ...data.trademarkSearch,
                  notes: e.target.value,
                },
              })
            }
            rows={3}
          />
        </div>
      </CardContent>
    </Card>
  );
}

/* -------------------------------------------------------------------------- */
/*  Step 4 — Domain Check                                                      */
/* -------------------------------------------------------------------------- */

function StepDomainCheck({
  data,
  onChange,
}: {
  data: CompanyNameData;
  onChange: (d: CompanyNameData) => void;
}) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg">Step 4: Domain Check</CardTitle>
        <CardDescription>
          Check if a matching domain is available
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <Button variant="outline" asChild>
          <a
            href="https://www.godaddy.com/domainsearch/find"
            target="_blank"
            rel="noopener noreferrer"
          >
            <ExternalLink className="size-4" />
            Check on GoDaddy
          </a>
        </Button>

        <Separator />

        <div className="space-y-3">
          <Label>Domain availability</Label>

          <div className="flex items-center gap-3">
            <Checkbox
              id="coza-available"
              checked={data.domainCheck.coZaAvailable}
              onCheckedChange={(checked) =>
                onChange({
                  ...data,
                  domainCheck: {
                    ...data.domainCheck,
                    coZaAvailable: checked === true,
                  },
                })
              }
            />
            <Label htmlFor="coza-available" className="cursor-pointer">
              .co.za available
            </Label>
          </div>

          <div className="flex items-center gap-3">
            <Checkbox
              id="com-available"
              checked={data.domainCheck.comAvailable}
              onCheckedChange={(checked) =>
                onChange({
                  ...data,
                  domainCheck: {
                    ...data.domainCheck,
                    comAvailable: checked === true,
                  },
                })
              }
            />
            <Label htmlFor="com-available" className="cursor-pointer">
              .com available
            </Label>
          </div>
        </div>

        <div className="space-y-2">
          <Label htmlFor="domain-notes">Notes</Label>
          <Textarea
            id="domain-notes"
            placeholder="Any additional notes about domain availability..."
            value={data.domainCheck.notes}
            onChange={(e) =>
              onChange({
                ...data,
                domainCheck: { ...data.domainCheck, notes: e.target.value },
              })
            }
            rows={3}
          />
        </div>
      </CardContent>
    </Card>
  );
}

/* -------------------------------------------------------------------------- */
/*  Step 5 — Final Decision                                                    */
/* -------------------------------------------------------------------------- */

function StepFinalDecision({
  data,
  barTestScore,
  onChange,
  onConfirm,
  confirming,
  confirmed,
}: {
  data: CompanyNameData;
  barTestScore: number;
  onChange: (d: CompanyNameData) => void;
  onConfirm: () => void;
  confirming: boolean;
  confirmed: boolean;
}) {
  const nameSearchLabels: Record<string, string> = {
    available: "Available",
    not_available: "Not available",
    need_alternative: "Need alternative",
  };

  const trademarkLabels: Record<string, string> = {
    no_conflicts: "No conflicts",
    potential_conflict: "Potential conflict",
    conflict_found: "Conflict found",
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg">Step 5: Final Decision</CardTitle>
        <CardDescription>
          Review the results from all previous steps and confirm your company
          name
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Summary */}
        <div className="space-y-3 rounded-lg border bg-muted/30 p-4">
          <p className="text-sm font-medium">Summary</p>

          <div className="grid gap-3 sm:grid-cols-2">
            {/* Bar Test */}
            <div className="space-y-1 rounded-md border bg-background p-3">
              <p className="text-xs font-medium text-muted-foreground">
                Bar Test
              </p>
              <p className="text-sm font-medium">
                {data.proposedName || "No name entered"}
              </p>
              <Badge
                variant={barTestScore >= 3 ? "default" : "secondary"}
                className="text-xs"
              >
                {barTestScore}/4 criteria
              </Badge>
            </div>

            {/* Name Search */}
            <div className="space-y-1 rounded-md border bg-background p-3">
              <p className="text-xs font-medium text-muted-foreground">
                CIPC Name Search
              </p>
              <Badge
                variant={
                  data.nameSearch.status === "available"
                    ? "default"
                    : data.nameSearch.status === "not_available"
                      ? "destructive"
                      : "secondary"
                }
                className="text-xs"
              >
                {nameSearchLabels[data.nameSearch.status] || "Not checked"}
              </Badge>
              {data.nameSearch.notes && (
                <p className="text-xs text-muted-foreground">
                  {data.nameSearch.notes}
                </p>
              )}
            </div>

            {/* Trademark */}
            <div className="space-y-1 rounded-md border bg-background p-3">
              <p className="text-xs font-medium text-muted-foreground">
                Trademark Search
              </p>
              <Badge
                variant={
                  data.trademarkSearch.status === "no_conflicts"
                    ? "default"
                    : data.trademarkSearch.status === "conflict_found"
                      ? "destructive"
                      : "secondary"
                }
                className="text-xs"
              >
                {trademarkLabels[data.trademarkSearch.status] || "Not checked"}
              </Badge>
              {data.trademarkSearch.notes && (
                <p className="text-xs text-muted-foreground">
                  {data.trademarkSearch.notes}
                </p>
              )}
            </div>

            {/* Domain */}
            <div className="space-y-1 rounded-md border bg-background p-3">
              <p className="text-xs font-medium text-muted-foreground">
                Domain Check
              </p>
              <div className="flex flex-wrap gap-1">
                <Badge
                  variant={
                    data.domainCheck.coZaAvailable ? "default" : "secondary"
                  }
                  className="text-xs"
                >
                  .co.za {data.domainCheck.coZaAvailable ? "Yes" : "No"}
                </Badge>
                <Badge
                  variant={
                    data.domainCheck.comAvailable ? "default" : "secondary"
                  }
                  className="text-xs"
                >
                  .com {data.domainCheck.comAvailable ? "Yes" : "No"}
                </Badge>
              </div>
              {data.domainCheck.notes && (
                <p className="text-xs text-muted-foreground">
                  {data.domainCheck.notes}
                </p>
              )}
            </div>
          </div>
        </div>

        <Separator />

        {/* Confirm Name */}
        <div className="space-y-2">
          <Label htmlFor="confirmed-name">Confirmed company name</Label>
          <Input
            id="confirmed-name"
            placeholder="Your final company name"
            value={data.confirmedName}
            onChange={(e) =>
              onChange({ ...data, confirmedName: e.target.value })
            }
            disabled={confirmed}
          />
        </div>

        {confirmed ? (
          <div className="flex items-center gap-2 rounded-lg border border-green-200 bg-green-50 p-4 dark:border-green-800 dark:bg-green-950/30">
            <Check className="size-5 text-green-600" />
            <div>
              <p className="text-sm font-medium text-green-800 dark:text-green-200">
                Name confirmed
              </p>
              <p className="text-xs text-green-700 dark:text-green-300">
                &quot;{data.confirmedName}&quot; has been set as your team&apos;s
                operating name.
              </p>
            </div>
          </div>
        ) : (
          <Button
            onClick={onConfirm}
            disabled={!data.confirmedName.trim() || confirming}
            className="w-full"
          >
            {confirming ? (
              <>
                <Loader2 className="size-4 animate-spin" />
                Confirming...
              </>
            ) : (
              <>
                <Check className="size-4" />
                Confirm Name
              </>
            )}
          </Button>
        )}
      </CardContent>
    </Card>
  );
}
