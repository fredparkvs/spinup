"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  Menu,
  ChevronRight,
  Settings,
  ShieldCheck,
  LogOut,
  FileDown,
  FlaskConical,
  MessageSquare,
  Puzzle,
  Map,
  Rocket,
  Calculator,
  TrendingDown,
  TrendingUp,
  BadgeDollarSign,
  BarChart3,
  BarChart2,
  Presentation,
  Sheet as SheetIcon,
  ClipboardCheck,
  BookOpen,
  BookOpenCheck,
  Wallet,
  Users,
  UsersRound,
  Building2,
  Building,
  Target,
  Radar,
  Repeat2,
  UserCog,
  ListChecks,
  FileText,
  Handshake,
  Globe,
  type LucideIcon,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import {
  Sheet,
  SheetContent,
  SheetTrigger,
  SheetTitle,
} from "@/components/ui/sheet";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import {
  PHASE_LABELS,
  getToolsByPhase,
  getCrossPhaseTools,
  getSetupTools,
} from "@/lib/artifacts/types";
import type { ArtifactTypeInfo } from "@/lib/artifacts/types";
import type {
  Phase,
  PlatformRole,
  TeamMemberRole,
  ValueProposition,
} from "@/lib/types/database";
import { createClient } from "@/lib/supabase/client";

// Map icon string names from ARTIFACT_TYPES to actual Lucide components
const ICON_MAP: Record<string, LucideIcon> = {
  Building2,
  Building,
  Target,
  FlaskConical,
  MessageSquare,
  Puzzle,
  Map,
  Rocket,
  Calculator,
  TrendingDown,
  TrendingUp,
  BadgeDollarSign,
  BadgeRandSymbol: BadgeDollarSign, // fallback for BadgeRandSymbol
  BarChart3,
  BarChart2,
  Presentation,
  Sheet: SheetIcon,
  ClipboardCheck,
  BookOpen,
  BookOpenCheck,
  Wallet,
  Users,
  UsersRound,
  Radar,
  Repeat2,
  UserCog,
  ListChecks,
  FileText,
  Handshake,
  Globe,
};

const PHASE_ICONS: Record<Phase, LucideIcon> = {
  validate: FlaskConical,
  build_minimum: Rocket,
  sell_iterate: BarChart3,
  scale: TrendingUp,
};

const PHASES: Phase[] = ["validate", "build_minimum", "sell_iterate", "scale"];

interface AppSidebarProps {
  teamId: string;
  teamName: string;
  operatingName: string | null;
  currentPhase: Phase;
  valueProposition: ValueProposition | null;
  vpUpdatedAt: string | null;
  teamRole: TeamMemberRole | null;
  platformRole: PlatformRole;
}

function toToolSlug(artifactTypeId: string): string {
  return artifactTypeId.replace(/_/g, "-");
}

function formatVpStatement(vp: ValueProposition): string {
  return `Our product ${vp.solution} helps ${vp.customer} achieve ${vp.benefit} by ${vp.how_it_works}, an improvement of ${vp.improvement} over current options.`;
}

function ToolLink({
  tool,
  teamId,
  pathname,
}: {
  tool: ArtifactTypeInfo;
  teamId: string;
  pathname: string;
}) {
  const slug = toToolSlug(tool.id);
  const href = `/teams/${teamId}/tools/${slug}`;
  const isActive = pathname === href;
  const Icon = ICON_MAP[tool.icon] ?? Target;

  return (
    <Link
      href={href}
      className={cn(
        "flex items-center gap-2 rounded-md px-3 py-1.5 text-sm transition-colors",
        isActive
          ? "bg-primary/10 text-primary font-medium"
          : "text-muted-foreground hover:bg-accent hover:text-accent-foreground"
      )}
    >
      <Icon className="size-4 shrink-0" />
      <span className="truncate">{tool.label}</span>
    </Link>
  );
}

function SidebarContent({
  teamId,
  teamName,
  operatingName,
  currentPhase,
  valueProposition,
  platformRole,
  onSignOut,
}: AppSidebarProps & { onSignOut: () => void }) {
  const pathname = usePathname();
  const crossPhaseTools = getCrossPhaseTools();
  const setupTools = getSetupTools();

  const displayName = operatingName || teamName;
  const vpText = valueProposition ? formatVpStatement(valueProposition) : null;

  return (
    <div className="flex h-full flex-col">
      {/* Team header */}
      <div className="p-4">
        <div className="flex items-center justify-between gap-2 mb-0.5">
          <h2 className="text-base font-semibold truncate">{displayName}</h2>
          <Link
            href="/dashboard"
            className="shrink-0 text-[11px] text-muted-foreground hover:text-foreground transition-colors"
          >
            Switch
          </Link>
        </div>
        {vpText ? (
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <p className="mt-1 text-xs text-muted-foreground line-clamp-2 cursor-default">
                  {vpText}
                </p>
              </TooltipTrigger>
              <TooltipContent side="right" className="max-w-xs">
                <p className="text-xs">{vpText}</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        ) : (
          <Link
            href={`/teams/${teamId}/tools/value-proposition`}
            className="mt-1 block text-xs text-primary hover:underline"
          >
            Set your value proposition
          </Link>
        )}
      </div>

      <Separator />

      {/* Setup tools */}
      <div className="px-2 py-2">
        {setupTools.map((tool) => (
          <ToolLink
            key={tool.id}
            tool={tool}
            teamId={teamId}
            pathname={pathname}
          />
        ))}
      </div>

      <Separator />

      {/* Phase navigation */}
      <nav className="flex-1 overflow-y-auto px-2 py-2">
        <p className="mb-1 px-3 text-xs font-medium uppercase tracking-wider text-muted-foreground">
          Phases
        </p>

        {PHASES.map((phase) => {
          const PhaseIcon = PHASE_ICONS[phase];
          const tools = getToolsByPhase(phase);
          const isCurrentPhase = currentPhase === phase;
          // Check if any tool in this phase is active
          const hasActiveTool = tools.some(
            (t) =>
              pathname === `/teams/${teamId}/tools/${toToolSlug(t.id)}`
          );

          return (
            <Collapsible
              key={phase}
              defaultOpen={isCurrentPhase || hasActiveTool}
            >
              <CollapsibleTrigger className="flex w-full items-center gap-2 rounded-md px-3 py-2 text-sm font-medium transition-colors hover:bg-accent hover:text-accent-foreground group">
                <PhaseIcon className="size-4 shrink-0" />
                <span className="flex-1 text-left">{PHASE_LABELS[phase]}</span>
                {isCurrentPhase && (
                  <span className="rounded-full bg-primary/15 px-2 py-0.5 text-[10px] font-medium text-primary">
                    Current
                  </span>
                )}
                <ChevronRight className="size-4 shrink-0 text-muted-foreground transition-transform duration-200 group-data-[state=open]:rotate-90" />
              </CollapsibleTrigger>
              <CollapsibleContent>
                <div className="ml-2 border-l pl-2 py-1">
                  {tools.map((tool) => (
                    <ToolLink
                      key={tool.id}
                      tool={tool}
                      teamId={teamId}
                      pathname={pathname}
                    />
                  ))}
                </div>
              </CollapsibleContent>
            </Collapsible>
          );
        })}

        <Separator className="my-2" />

        {/* Cross-phase tools */}
        <p className="mb-1 px-3 text-xs font-medium uppercase tracking-wider text-muted-foreground">
          Always Available
        </p>
        {crossPhaseTools.map((tool) => (
          <ToolLink
            key={tool.id}
            tool={tool}
            teamId={teamId}
            pathname={pathname}
          />
        ))}
        <Link
          href={`/teams/${teamId}/settings`}
          className={cn(
            "flex items-center gap-2 rounded-md px-3 py-1.5 text-sm transition-colors",
            pathname.startsWith(`/teams/${teamId}/settings`)
              ? "bg-primary/10 text-primary font-medium"
              : "text-muted-foreground hover:bg-accent hover:text-accent-foreground"
          )}
        >
          <Settings className="size-4 shrink-0" />
          <span className="truncate">Settings</span>
        </Link>
        <Link
          href={`/teams/${teamId}/settings/exports`}
          className={cn(
            "flex items-center gap-2 rounded-md px-3 py-1.5 text-sm transition-colors",
            pathname === `/teams/${teamId}/settings/exports`
              ? "bg-primary/10 text-primary font-medium"
              : "text-muted-foreground hover:bg-accent hover:text-accent-foreground"
          )}
        >
          <FileDown className="size-4 shrink-0" />
          <span className="truncate">Exports</span>
        </Link>
      </nav>

      <Separator />

      {/* Bottom section: Admin (if applicable), Sign out */}
      <div className="p-2">
        {platformRole === "admin" && (
          <Link
            href="/admin"
            className={cn(
              "flex items-center gap-2 rounded-md px-3 py-2 text-sm transition-colors",
              pathname.startsWith("/admin")
                ? "bg-primary/10 text-primary font-medium"
                : "text-muted-foreground hover:bg-accent hover:text-accent-foreground"
            )}
          >
            <ShieldCheck className="size-4 shrink-0" />
            <span>Admin</span>
          </Link>
        )}

        <button
          onClick={onSignOut}
          className="flex w-full items-center gap-2 rounded-md px-3 py-2 text-sm text-muted-foreground transition-colors hover:bg-accent hover:text-accent-foreground"
        >
          <LogOut className="size-4 shrink-0" />
          <span>Sign out</span>
        </button>
      </div>
    </div>
  );
}

export function AppSidebar(props: AppSidebarProps) {
  const [mobileOpen, setMobileOpen] = useState(false);
  const router = useRouter();

  const handleSignOut = async () => {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push("/sign-in");
  };

  return (
    <>
      {/* Mobile: hamburger trigger + sheet */}
      <div className="sticky top-0 z-40 flex items-center border-b bg-background px-4 py-3 md:hidden">
        <Sheet open={mobileOpen} onOpenChange={setMobileOpen}>
          <SheetTrigger asChild>
            <Button variant="ghost" size="icon-sm">
              <Menu className="size-5" />
              <span className="sr-only">Open menu</span>
            </Button>
          </SheetTrigger>
          <SheetContent side="left" className="w-72 p-0">
            <SheetTitle className="sr-only">Navigation</SheetTitle>
            <SidebarContent {...props} onSignOut={handleSignOut} />
          </SheetContent>
        </Sheet>
        <Link
          href="/dashboard"
          className="ml-3 text-sm font-semibold truncate hover:text-muted-foreground transition-colors"
        >
          {props.operatingName || props.teamName}
        </Link>
      </div>

      {/* Desktop: fixed sidebar */}
      <aside className="hidden md:flex w-64 shrink-0 flex-col border-r bg-background">
        <SidebarContent {...props} onSignOut={handleSignOut} />
      </aside>
    </>
  );
}
