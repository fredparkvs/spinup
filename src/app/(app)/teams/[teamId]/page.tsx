import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { ArrowRight, BookOpen, CheckCircle2, Circle, AlertTriangle } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { ARTIFACT_TYPES, PHASE_LABELS, PHASE_DESCRIPTIONS } from "@/lib/artifacts/types";
import type { Phase } from "@/lib/types/database";

function toToolSlug(artifactType: string): string {
  return artifactType.replace(/_/g, "-");
}

const PHASE_ORDER: Phase[] = ["validate", "build_minimum", "sell_iterate"];

export default async function TeamDashboardPage({ params }: { params: Promise<{ teamId: string }> }) {
  const { teamId } = await params;
  const supabase = await createClient();

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/sign-in");

  // Fetch team + artifacts + latest journal entry in parallel
  const [teamResult, artifactsResult, journalResult, trelloResult] = await Promise.all([
    supabase.from("teams").select("id, name, operating_name, current_phase, value_proposition").eq("id", teamId).single(),
    supabase.from("artifacts").select("artifact_type, updated_at").eq("team_id", teamId),
    supabase.from("journal_entries").select("week_start, next_week_priority, what_we_learned").eq("team_id", teamId).order("week_start", { ascending: false }).limit(1).maybeSingle(),
    supabase.from("trello_connections").select("board_id, last_synced_at").eq("team_id", teamId).maybeSingle(),
  ]);

  const team = teamResult.data;
  if (!team) redirect("/dashboard");

  const artifactTypes = new Set((artifactsResult.data ?? []).map((a) => a.artifact_type));
  const latestJournal = journalResult.data;
  const trello = trelloResult.data;

  const currentPhase = team.current_phase;

  // Calculate completion per phase
  function phaseTools(phase: Phase) {
    return ARTIFACT_TYPES.filter((t) => t.phase === phase);
  }

  function phaseCompletion(phase: Phase) {
    const tools = phaseTools(phase);
    const done = tools.filter((t) => artifactTypes.has(t.id)).length;
    return { done, total: tools.length };
  }

  const setupTools = ARTIFACT_TYPES.filter((t) => t.phase === "setup");
  const setupDone = setupTools.filter((t) => artifactTypes.has(t.id)).length;

  // Determine next recommended action
  function getNextAction(): { label: string; href: string } {
    // If setup not complete
    if (!artifactTypes.has("company_name")) return { label: "Complete company name validation", href: `/teams/${teamId}/tools/company-name` };
    if (!artifactTypes.has("value_proposition")) return { label: "Set your value proposition", href: `/teams/${teamId}/tools/value-proposition` };
    // Find first incomplete tool in current phase
    const tools = phaseTools(currentPhase);
    const incomplete = tools.find((t) => !artifactTypes.has(t.id));
    if (incomplete) return { label: `Start: ${incomplete.label}`, href: `/teams/${teamId}/tools/${toToolSlug(incomplete.id)}` };
    // Phase complete — suggest next phase
    const phaseIdx = PHASE_ORDER.indexOf(currentPhase);
    if (phaseIdx < PHASE_ORDER.length - 1) {
      const next = PHASE_ORDER[phaseIdx + 1];
      const nextTool = phaseTools(next)[0];
      if (nextTool) return { label: `Move to ${PHASE_LABELS[next]}: ${nextTool.label}`, href: `/teams/${teamId}/tools/${toToolSlug(nextTool.id)}` };
    }
    // Everything done
    return { label: "Write this week's journal entry", href: `/teams/${teamId}/tools/weekly-journal` };
  }

  const nextAction = getNextAction();

  // Is journal this week done?
  function getThisMonday(): string {
    const d = new Date();
    const day = d.getDay();
    const diff = d.getDate() - day + (day === 0 ? -6 : 1);
    d.setDate(diff);
    return d.toISOString().split("T")[0];
  }
  const thisWeek = getThisMonday();
  const journalThisWeek = latestJournal?.week_start === thisWeek;

  return (
    <div className="p-6 max-w-4xl mx-auto space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold">{team.operating_name ?? team.name}</h1>
        <p className="text-muted-foreground mt-1">
          Current phase: <span className="font-medium text-foreground">{PHASE_LABELS[currentPhase]}</span>
          <span className="mx-2 text-muted-foreground">·</span>
          <span className="text-sm">{PHASE_DESCRIPTIONS[currentPhase]}</span>
        </p>
      </div>

      {/* Value proposition */}
      {team.value_proposition ? (
        <Card className="border-primary/20 bg-primary/5">
          <CardContent className="pt-4">
            <p className="text-xs font-medium text-primary mb-1 uppercase tracking-wide">Your value proposition</p>
            <p className="text-sm">
              Our product <strong>{(team.value_proposition as { solution?: string }).solution}</strong> helps{" "}
              <strong>{(team.value_proposition as { customer?: string }).customer}</strong> achieve{" "}
              <strong>{(team.value_proposition as { benefit?: string }).benefit}</strong> by{" "}
              {(team.value_proposition as { how_it_works?: string }).how_it_works}, an improvement of{" "}
              <strong>{(team.value_proposition as { improvement?: string }).improvement}</strong> over current options.
            </p>
          </CardContent>
        </Card>
      ) : (
        <Card className="border-amber-200 bg-amber-50">
          <CardContent className="pt-4">
            <div className="flex items-center gap-2">
              <AlertTriangle className="size-4 text-amber-600 shrink-0" />
              <p className="text-sm text-amber-800">You haven&apos;t set your value proposition yet.</p>
              <Button asChild size="sm" variant="outline" className="ml-auto">
                <Link href={`/teams/${teamId}/tools/value-proposition`}>Set it now</Link>
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Next action */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base">Next recommended action</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between gap-4">
            <p className="text-sm text-muted-foreground">{nextAction.label}</p>
            <Button asChild>
              <Link href={nextAction.href}>
                Go <ArrowRight className="size-3.5 ml-1" />
              </Link>
            </Button>
          </div>
        </CardContent>
      </Card>

      <div className="grid gap-6 md:grid-cols-2">
        {/* Phase progress */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base">Phase progress</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Setup */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between text-sm">
                <span className="font-medium">Setup</span>
                <Badge variant={setupDone === setupTools.length ? "default" : "secondary"} className="text-xs">
                  {setupDone}/{setupTools.length}
                </Badge>
              </div>
              <div className="space-y-1">
                {setupTools.map((tool) => (
                  <Link key={tool.id} href={`/teams/${teamId}/tools/${toToolSlug(tool.id)}`} className="flex items-center gap-2 text-xs hover:text-primary transition-colors group">
                    {artifactTypes.has(tool.id) ? (
                      <CheckCircle2 className="size-3.5 text-primary shrink-0" />
                    ) : (
                      <Circle className="size-3.5 text-muted-foreground shrink-0 group-hover:text-primary" />
                    )}
                    <span className={artifactTypes.has(tool.id) ? "text-muted-foreground line-through" : ""}>{tool.label}</span>
                  </Link>
                ))}
              </div>
            </div>

            <Separator />

            {PHASE_ORDER.map((phase) => {
              const { done, total } = phaseCompletion(phase);
              const isCurrentPhase = phase === currentPhase;
              return (
                <div key={phase} className={`space-y-1.5 ${!isCurrentPhase ? "opacity-60" : ""}`}>
                  <div className="flex items-center justify-between text-sm">
                    <div className="flex items-center gap-1.5">
                      <span className="font-medium">{PHASE_LABELS[phase]}</span>
                      {isCurrentPhase && <Badge variant="outline" className="text-xs">Current</Badge>}
                    </div>
                    <Badge variant={done === total ? "default" : "secondary"} className="text-xs">{done}/{total}</Badge>
                  </div>
                  <div className="space-y-1">
                    {phaseTools(phase).map((tool) => (
                      <Link key={tool.id} href={`/teams/${teamId}/tools/${toToolSlug(tool.id)}`} className="flex items-center gap-2 text-xs hover:text-primary transition-colors group">
                        {artifactTypes.has(tool.id) ? (
                          <CheckCircle2 className="size-3.5 text-primary shrink-0" />
                        ) : (
                          <Circle className="size-3.5 text-muted-foreground shrink-0 group-hover:text-primary" />
                        )}
                        <span className={artifactTypes.has(tool.id) ? "text-muted-foreground line-through" : ""}>{tool.label}</span>
                      </Link>
                    ))}
                  </div>
                </div>
              );
            })}
          </CardContent>
        </Card>

        {/* Weekly journal + Trello */}
        <div className="space-y-4">
          {/* Weekly journal prompt */}
          <Card className={journalThisWeek ? "" : "border-amber-200"}>
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center gap-2">
                <BookOpen className="size-4" />
                Weekly journal
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {journalThisWeek ? (
                <div>
                  <p className="text-xs text-green-600 font-medium mb-1">This week&apos;s entry is done ✓</p>
                  {latestJournal?.next_week_priority && (
                    <p className="text-xs text-muted-foreground">Next week&apos;s focus: <span className="text-foreground">{latestJournal.next_week_priority}</span></p>
                  )}
                </div>
              ) : (
                <div>
                  <p className="text-sm text-amber-700">No entry this week yet.</p>
                  {latestJournal?.what_we_learned && (
                    <p className="text-xs text-muted-foreground mt-1">Last week you learned: <span className="italic">&ldquo;{latestJournal.what_we_learned.slice(0, 80)}{latestJournal.what_we_learned.length > 80 ? "…" : ""}&rdquo;</span></p>
                  )}
                </div>
              )}
              <Button asChild size="sm" variant={journalThisWeek ? "outline" : "default"} className="w-full">
                <Link href={`/teams/${teamId}/tools/weekly-journal`}>
                  {journalThisWeek ? "View journal" : "Write this week's entry"}
                </Link>
              </Button>
            </CardContent>
          </Card>

          {/* Trello sync status */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base">Trello sync</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              {trello?.board_id ? (
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <div className="size-2 rounded-full bg-green-500" />
                    <span className="text-sm">Connected</span>
                  </div>
                  {trello.last_synced_at && (
                    <p className="text-xs text-muted-foreground">
                      Last synced: {new Date(trello.last_synced_at).toLocaleDateString("en-ZA")}
                    </p>
                  )}
                </div>
              ) : (
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <div className="size-2 rounded-full bg-muted-foreground" />
                    <span className="text-sm text-muted-foreground">Not connected</span>
                  </div>
                  <Button asChild size="sm" variant="outline" className="w-full">
                    <Link href={`/teams/${teamId}/settings/trello`}>Connect Trello</Link>
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
