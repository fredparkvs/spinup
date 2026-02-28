import type { Phase } from "@/lib/types/database";

export interface ArtifactTypeInfo {
  id: string;
  label: string;
  description: string;
  phase: Phase | "cross_phase" | "setup";
  icon: string;
  promptVpReview?: boolean;
}

export const ARTIFACT_TYPES: ArtifactTypeInfo[] = [
  // Setup
  {
    id: "company_name",
    label: "Company Name Checker",
    description: "Validate your company name with the bar test, name search, trademark search, and domain check",
    phase: "setup",
    icon: "Building2",
  },
  {
    id: "value_proposition",
    label: "Value Proposition",
    description: "Define your 10x advantage statement",
    phase: "setup",
    icon: "Target",
  },
  // Validate
  {
    id: "hypothesis_tracker",
    label: "Hypothesis Tracker",
    description: "Track and test the core assumptions that underpin your business",
    phase: "validate",
    icon: "FlaskConical",
  },
  {
    id: "interview_scripts",
    label: "Customer Interview Scripts",
    description: "Generate Mom Test-based interview scripts and log findings",
    phase: "validate",
    icon: "MessageSquare",
    promptVpReview: true,
  },
  {
    id: "problem_solution_fit",
    label: "Problem-Solution Fit Canvas",
    description: "Map who has the problem, what it is, and your 10x advantage",
    phase: "validate",
    icon: "Puzzle",
    promptVpReview: true,
  },
  {
    id: "competitive_landscape",
    label: "Competitive Landscape Map",
    description: "Identify competitors, their weaknesses, and your specific gap",
    phase: "validate",
    icon: "Map",
    promptVpReview: true,
  },
  // Build Minimum
  {
    id: "mvp_definition",
    label: "MVP Definition",
    description: "Define the minimum product that tests your core value proposition",
    phase: "build_minimum",
    icon: "Rocket",
  },
  {
    id: "unit_economics",
    label: "Unit Economics Calculator",
    description: "Calculate CAC, LTV, gross margin, and break-even point",
    phase: "build_minimum",
    icon: "Calculator",
  },
  {
    id: "runway_calculator",
    label: "Runway Calculator",
    description: "Track burn rate, available cash, and remaining months of operation",
    phase: "build_minimum",
    icon: "TrendingDown",
  },
  {
    id: "pricing_experiment",
    label: "Pricing Experiment",
    description: "Test willingness to pay before launch",
    phase: "build_minimum",
    icon: "BadgeRandSymbol",
  },
  // Sell & Iterate
  {
    id: "pmf_dashboard",
    label: "Product-Market Fit Dashboard",
    description: "Track PMF indicators: Sean Ellis score, NPS, retention, referrals",
    phase: "sell_iterate",
    icon: "BarChart3",
  },
  {
    id: "pitch_deck",
    label: "Pitch Deck Builder",
    description: "Generate a structured 10-12 slide deck outline with guidance",
    phase: "sell_iterate",
    icon: "Presentation",
  },
  {
    id: "financial_model",
    label: "Financial Model",
    description: "Three-statement model with monthly granularity for 24 months",
    phase: "sell_iterate",
    icon: "Sheet",
  },
  {
    id: "compliance_checklist",
    label: "SA Compliance Checklist",
    description: "CIPC, SARS, B-BBEE, banking, shareholder agreement, IP assignment",
    phase: "sell_iterate",
    icon: "ClipboardCheck",
  },
  // Scale (Accelerator — Phase 4)
  {
    id: "scaling_readiness",
    label: "Scaling Readiness Assessment",
    description: "Diagnose your readiness across all 6 scaling pillars and identify your top constraints",
    phase: "scale",
    icon: "Radar",
  },
  {
    id: "gtm_playbook",
    label: "GTM Playbook Builder",
    description: "Codify your sales process into a repeatable playbook any team member can run",
    phase: "scale",
    icon: "BookOpenCheck",
  },
  {
    id: "scale_unit_economics",
    label: "Unit Economics Dashboard",
    description: "Track segmented CAC, cohort LTV, NRR, GRR, and payback period against growth-stage benchmarks",
    phase: "scale",
    icon: "TrendingUp",
  },
  {
    id: "retention_tracker",
    label: "Revenue Retention Tracker",
    description: "Cohort-based NRR and GRR analysis separating logo churn from revenue churn",
    phase: "scale",
    icon: "Repeat2",
  },
  {
    id: "hiring_planner",
    label: "Hiring & Org Design Planner",
    description: "Map your headcount stage, identify gaps, and build the hiring infrastructure your stage requires",
    phase: "scale",
    icon: "UsersRound",
  },
  {
    id: "founder_ceo_tracker",
    label: "Founder-to-CEO Tracker",
    description: "Track your progress through the 5 identity shifts required to lead a scaling company",
    phase: "scale",
    icon: "UserCog",
  },
  {
    id: "okr_tracker",
    label: "OKR Planning & Tracking",
    description: "Quarterly objectives and key results with weekly check-ins and cascading team goals",
    phase: "scale",
    icon: "ListChecks",
  },
  {
    id: "process_docs",
    label: "Process Documentation",
    description: "Document core business processes so what works doesn't live only in someone's head",
    phase: "scale",
    icon: "FileText",
  },
  {
    id: "board_toolkit",
    label: "Board Development Toolkit",
    description: "Build from advisory board to structured governance with templates and composition guidance",
    phase: "scale",
    icon: "Building",
  },
  {
    id: "scale_financial_model",
    label: "Growth-Stage Financial Model",
    description: "Scenario-based projections with departmental budgets, dilution modelling, and cap table",
    phase: "scale",
    icon: "BarChart2",
  },
  {
    id: "fundraising_pipeline",
    label: "Fundraising Pipeline Manager",
    description: "Track investor relationships through the full VC pipeline with due diligence checklists",
    phase: "scale",
    icon: "Handshake",
  },
  {
    id: "market_expansion",
    label: "Market Expansion Planner",
    description: "Evaluate and plan international market entry with a structured Go/No-Go framework",
    phase: "scale",
    icon: "Globe",
  },
  // Cross-phase
  {
    id: "weekly_journal",
    label: "Weekly Progress Journal",
    description: "Structured weekly reflection on wins, learnings, and blockers",
    phase: "cross_phase",
    icon: "BookOpen",
  },
  {
    id: "funding_tracker",
    label: "Funding Application Tracker",
    description: "Track SA-specific funding opportunities and application status",
    phase: "cross_phase",
    icon: "Wallet",
  },
  {
    id: "advisor_network",
    label: "Mentor & Advisor Network",
    description: "Track relationships with industry experts and advisors",
    phase: "cross_phase",
    icon: "Users",
  },
];

export const PHASE_LABELS: Record<Phase, string> = {
  validate: "Validate",
  build_minimum: "Build Minimum",
  sell_iterate: "Sell & Iterate",
  scale: "Scale",
};

export const PHASE_DESCRIPTIONS: Record<Phase, string> = {
  validate: "Test your assumptions with real customers before building",
  build_minimum: "Build the minimum product that proves your value proposition",
  sell_iterate: "Sell to customers and iterate based on real feedback",
  scale: "Build the systems, team, and capital strategy to scale repeatably",
};

export function getToolsByPhase(phase: Phase) {
  return ARTIFACT_TYPES.filter((t) => t.phase === phase);
}

export function getCrossPhaseTools() {
  return ARTIFACT_TYPES.filter((t) => t.phase === "cross_phase");
}

export function getSetupTools() {
  return ARTIFACT_TYPES.filter((t) => t.phase === "setup");
}
