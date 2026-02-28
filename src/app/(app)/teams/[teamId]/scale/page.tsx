import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { ArrowRight, Radar, BookOpenCheck, TrendingUp, Repeat2, UsersRound, UserCog, ListChecks, FileText, Building, BarChart2, Handshake, Globe } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { ARTIFACT_TYPES } from "@/lib/artifacts/types";

const SCALE_TOOL_ICONS: Record<string, React.ComponentType<{ className?: string }>> = {
  scaling_readiness: Radar,
  gtm_playbook: BookOpenCheck,
  scale_unit_economics: TrendingUp,
  retention_tracker: Repeat2,
  hiring_planner: UsersRound,
  founder_ceo_tracker: UserCog,
  okr_tracker: ListChecks,
  process_docs: FileText,
  board_toolkit: Building,
  scale_financial_model: BarChart2,
  fundraising_pipeline: Handshake,
  market_expansion: Globe,
};

function toToolSlug(artifactType: string): string {
  return artifactType.replace(/_/g, "-");
}

export default async function AcceleratorDashboardPage({
  params,
}: {
  params: Promise<{ teamId: string }>;
}) {
  const { teamId } = await params;
  const supabase = await createClient();

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/sign-in");

  const [teamResult, artifactsResult] = await Promise.all([
    supabase
      .from("teams")
      .select("id, name, operating_name")
      .eq("id", teamId)
      .single(),
    supabase
      .from("artifacts")
      .select("artifact_type")
      .eq("team_id", teamId),
  ]);

  const team = teamResult.data;
  if (!team) redirect("/accelerator");

  const completedTypes = new Set((artifactsResult.data ?? []).map((a) => a.artifact_type));
  const scaleTools = ARTIFACT_TYPES.filter((t) => t.phase === "scale");
  const completedCount = scaleTools.filter((t) => completedTypes.has(t.id)).length;

  const displayName = team.operating_name ?? team.name;
  const hasStarted = completedTypes.has("scaling_readiness");

  return (
    <div className="p-6 max-w-4xl mx-auto space-y-8">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold">{displayName} — Accelerator</h1>
          <p className="text-muted-foreground mt-1 text-sm">
            Post-PMF tools to build a repeatable, scalable business
          </p>
        </div>
        <Badge variant="secondary" className="shrink-0">
          {completedCount}/{scaleTools.length} tools started
        </Badge>
      </div>

      {/* Start here prompt */}
      {!hasStarted && (
        <Card className="border-primary/30 bg-primary/5">
          <CardContent className="pt-5">
            <div className="flex items-center justify-between gap-4">
              <div>
                <p className="font-medium text-sm">Start with the Scaling Readiness Assessment</p>
                <p className="text-xs text-muted-foreground mt-0.5">
                  Get a baseline across all 6 pillars and identify your top constraints before diving into individual tools.
                </p>
              </div>
              <Button asChild size="sm" className="shrink-0">
                <Link href={`/teams/${teamId}/tools/scaling-readiness`}>
                  Start <ArrowRight className="size-3.5 ml-1" />
                </Link>
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Tool grid */}
      <div>
        <h2 className="text-base font-semibold mb-4">All 12 Accelerator Tools</h2>
        <div className="grid gap-3 sm:grid-cols-2">
          {scaleTools.map((tool) => {
            const Icon = SCALE_TOOL_ICONS[tool.id] ?? Radar;
            const done = completedTypes.has(tool.id);
            const slug = toToolSlug(tool.id);
            return (
              <Link
                key={tool.id}
                href={`/teams/${teamId}/tools/${slug}`}
                className="group flex items-start gap-3 rounded-lg border p-4 transition-colors hover:bg-accent"
              >
                <div className={`mt-0.5 rounded-md p-1.5 shrink-0 ${done ? "bg-primary/10 text-primary" : "bg-muted text-muted-foreground"}`}>
                  <Icon className="size-4" />
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <p className="text-sm font-medium truncate">{tool.label}</p>
                    {done && (
                      <Badge variant="outline" className="text-[10px] px-1.5 py-0 shrink-0 text-primary border-primary/30">
                        Started
                      </Badge>
                    )}
                  </div>
                  <p className="text-xs text-muted-foreground mt-0.5 line-clamp-2">
                    {tool.description}
                  </p>
                </div>
                <ArrowRight className="size-4 shrink-0 text-muted-foreground mt-0.5 opacity-0 group-hover:opacity-100 transition-opacity" />
              </Link>
            );
          })}
        </div>
      </div>

      {/* Pillars overview */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base">6 Scaling Pillars</CardTitle>
          <CardDescription>The accelerator covers every dimension of scaling readiness</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-2 sm:grid-cols-2 text-sm">
            {[
              { pillar: "Go-to-Market Repeatability", tools: "GTM Playbook Builder" },
              { pillar: "Unit Economics & Financial Discipline", tools: "Unit Economics Dashboard · Revenue Retention Tracker" },
              { pillar: "Team Building & Org Design", tools: "Hiring Planner · Founder-to-CEO Tracker" },
              { pillar: "Operations & Systems", tools: "OKR Tracker · Process Documentation" },
              { pillar: "Governance & Board Development", tools: "Board Development Toolkit" },
              { pillar: "Fundraising & Capital Strategy", tools: "Financial Model · Fundraising Pipeline · Market Expansion" },
            ].map(({ pillar, tools }) => (
              <div key={pillar} className="rounded-md border p-3">
                <p className="font-medium text-xs">{pillar}</p>
                <p className="text-xs text-muted-foreground mt-0.5">{tools}</p>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
