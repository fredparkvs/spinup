import {
  Document,
  Paragraph,
  TextRun,
  HeadingLevel,
  AlignmentType,
  BorderStyle,
  Table,
  TableRow,
  TableCell,
  WidthType,
  Packer,
} from "docx";
import type { ValueProposition } from "@/lib/types/database";

// ---- Helpers ----

function heading1(text: string): Paragraph {
  return new Paragraph({ text, heading: HeadingLevel.HEADING_1, spacing: { before: 400, after: 200 } });
}

function heading2(text: string): Paragraph {
  return new Paragraph({ text, heading: HeadingLevel.HEADING_2, spacing: { before: 300, after: 120 } });
}

function body(text: string): Paragraph {
  return new Paragraph({ text: text || "—", spacing: { after: 160 } });
}

function label(text: string): Paragraph {
  return new Paragraph({
    children: [new TextRun({ text, bold: true, size: 20 })],
    spacing: { before: 200, after: 80 },
  });
}

function divider(): Paragraph {
  return new Paragraph({ border: { bottom: { style: BorderStyle.SINGLE, size: 6, color: "CCCCCC" } }, spacing: { before: 200, after: 200 } });
}

function vpParagraph(vp: ValueProposition | null): Paragraph[] {
  if (!vp) return [];
  return [
    new Paragraph({
      children: [
        new TextRun({ text: "Value Proposition: ", bold: true }),
        new TextRun(`Our product ${vp.solution} helps ${vp.customer} achieve ${vp.benefit} by ${vp.how_it_works}, an improvement of ${vp.improvement} over current options.`),
      ],
      spacing: { after: 200 },
    }),
    divider(),
  ];
}

// ---- Renderers ----

export type DocRenderer = (data: Record<string, unknown>, vp: ValueProposition | null, teamName: string) => Promise<Buffer>;

async function buildDoc(teamName: string, title: string, children: (Paragraph | Table)[]): Promise<Buffer> {
  const doc = new Document({
    sections: [{
      properties: {},
      children: [
        new Paragraph({
          children: [new TextRun({ text: "SpinUp", bold: true, size: 24, color: "888888" })],
          alignment: AlignmentType.RIGHT,
        }),
        heading1(title),
        new Paragraph({
          children: [new TextRun({ text: teamName, color: "666666", size: 20 })],
          spacing: { after: 300 },
        }),
        ...children,
      ],
    }],
  });
  return Buffer.from(await Packer.toBuffer(doc));
}

const companyName: DocRenderer = async (data, _vp, teamName) => {
  const d = data as {
    bar_test?: { easy_pronounce?: boolean; easy_spell?: boolean; not_confused?: boolean; memorable?: boolean; score?: string };
    name_search?: { outcome?: string; notes?: string };
    trademark_search?: { outcome?: string; notes?: string };
    domain_check?: { outcome?: string; notes?: string };
    final_name?: string;
  };
  return buildDoc(teamName, "Company Name Due Diligence", [
    heading2("Bar Test"),
    label("Easy to pronounce"), body(d.bar_test?.easy_pronounce ? "Yes" : "No"),
    label("Easy to spell"), body(d.bar_test?.easy_spell ? "Yes" : "No"),
    label("Not easily confused"), body(d.bar_test?.not_confused ? "Yes" : "No"),
    label("Memorable in one hearing"), body(d.bar_test?.memorable ? "Yes" : "No"),
    divider(),
    heading2("Name Search (Govchain)"),
    label("Outcome"), body(d.name_search?.outcome ?? "—"),
    label("Notes"), body(d.name_search?.notes ?? "—"),
    divider(),
    heading2("Trademark Search (Govchain)"),
    label("Outcome"), body(d.trademark_search?.outcome ?? "—"),
    label("Notes"), body(d.trademark_search?.notes ?? "—"),
    divider(),
    heading2("Domain Check"),
    label("Outcome"), body(d.domain_check?.outcome ?? "—"),
    label("Notes"), body(d.domain_check?.notes ?? "—"),
    divider(),
    heading2("Final Name Decision"),
    body(d.final_name ?? "—"),
  ]);
};

const valueProposition: DocRenderer = async (data, _vp, teamName) => {
  const d = data as { solution?: string; customer?: string; benefit?: string; how_it_works?: string; improvement?: string };
  return buildDoc(teamName, "Value Proposition Statement", [
    body(`Our product ${d.solution ?? "___"} helps ${d.customer ?? "___"} achieve ${d.benefit ?? "___"} by ${d.how_it_works ?? "___"}, an improvement of ${d.improvement ?? "___"} over current options.`),
    divider(),
    label("Solution"), body(d.solution ?? "—"),
    label("Customer"), body(d.customer ?? "—"),
    label("Benefit"), body(d.benefit ?? "—"),
    label("How it works"), body(d.how_it_works ?? "—"),
    label("Improvement over alternatives"), body(d.improvement ?? "—"),
  ]);
};

const hypothesisTracker: DocRenderer = async (data, vp, teamName) => {
  const hypotheses = (data.hypotheses as Array<{
    assumption?: string; why_we_believe?: string; experiment?: string;
    outcome?: string; validated?: string; next_action?: string;
  }>) ?? [];
  const children: (Paragraph | Table)[] = [...vpParagraph(vp)];
  hypotheses.forEach((h, i) => {
    children.push(heading2(`Hypothesis ${i + 1}`));
    children.push(label("Assumption"), body(h.assumption ?? "—"));
    children.push(label("Why we believe this"), body(h.why_we_believe ?? "—"));
    children.push(label("Experiment designed"), body(h.experiment ?? "—"));
    children.push(label("Outcome"), body(h.outcome ?? "—"));
    children.push(label("Validated?"), body(h.validated ?? "—"));
    children.push(label("Next action"), body(h.next_action ?? "—"));
    if (i < hypotheses.length - 1) children.push(divider());
  });
  return buildDoc(teamName, "Hypothesis Tracker", children);
};

const problemSolutionFit: DocRenderer = async (data, vp, teamName) => {
  const d = data as Record<string, string>;
  return buildDoc(teamName, "Problem-Solution Fit Canvas", [
    ...vpParagraph(vp),
    label("Who has the problem?"), body(d.who_has_problem),
    divider(),
    label("What is the problem?"), body(d.what_is_problem),
    divider(),
    label("How do they currently solve it?"), body(d.how_they_solve_now),
    divider(),
    label("Why do current solutions fail?"), body(d.why_current_fails),
    divider(),
    label("Our proposed solution"), body(d.our_solution),
    divider(),
    label("The 10x advantage"), body(d.ten_x_advantage),
    divider(),
    label("Evidence so far"), body(d.evidence_so_far),
  ]);
};

const competitiveLandscape: DocRenderer = async (data, vp, teamName) => {
  const competitors = (data.competitors as Array<{
    name?: string; strength?: string; weakness?: string; differentiation?: string; sa_relevance?: string;
  }>) ?? [];
  const children: (Paragraph | Table)[] = [...vpParagraph(vp)];

  if (competitors.length > 0) {
    const tableRows = [
      new TableRow({
        children: ["Competitor", "Strength", "Weakness", "Our differentiation", "SA relevance"].map(
          (h) => new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: h, bold: true })] })] })
        ),
      }),
      ...competitors.map(
        (c) => new TableRow({
          children: [c.name, c.strength, c.weakness, c.differentiation, c.sa_relevance].map(
            (v) => new TableCell({ children: [body(v ?? "—")] })
          ),
        })
      ),
    ];
    children.push(new Table({ rows: tableRows, width: { size: 100, type: WidthType.PERCENTAGE } }));
  }
  return buildDoc(teamName, "Competitive Landscape Map", children);
};

const mvpDefinition: DocRenderer = async (data, vp, teamName) => {
  const d = data as {
    core_value_prop?: string; not_building?: string; success_metric?: string; first_user?: string;
    features?: Array<{ name?: string; type?: string }>;
  };
  return buildDoc(teamName, "MVP Definition", [
    ...vpParagraph(vp),
    label("Core value proposition"), body(d.core_value_prop ?? "—"),
    divider(),
    label("Minimum feature set"),
    ...(d.features ?? []).map((f) => new Paragraph({ text: `• [${f.type ?? "core"}] ${f.name ?? ""}`, spacing: { after: 80 } })),
    divider(),
    label("What we are NOT building"), body(d.not_building ?? "—"),
    divider(),
    label("Success metric"), body(d.success_metric ?? "—"),
    divider(),
    label("First user / customer"), body(d.first_user ?? "—"),
  ]);
};

const pitchDeck: DocRenderer = async (data, vp, teamName) => {
  type SlideData = { content?: string };
  const d = data as Record<string, SlideData>;
  const SLIDES = [
    { key: "problem", title: "1. The Problem" },
    { key: "solution", title: "2. Our Solution" },
    { key: "why_now", title: "3. Why Now" },
    { key: "market_size", title: "4. Market Size" },
    { key: "business_model", title: "5. Business Model" },
    { key: "traction", title: "6. Traction" },
    { key: "team", title: "7. Team" },
    { key: "competition", title: "8. Competition" },
    { key: "financials", title: "9. Financials" },
    { key: "the_ask", title: "10. The Ask" },
  ];
  const children: (Paragraph | Table)[] = [...vpParagraph(vp)];
  SLIDES.forEach((s, i) => {
    children.push(heading2(s.title));
    children.push(body(d[s.key]?.content ?? "—"));
    if (i < SLIDES.length - 1) children.push(divider());
  });
  return buildDoc(teamName, "Pitch Deck Narrative", children);
};

const financialModel: DocRenderer = async (data, _vp, teamName) => {
  type RS = { name?: string; month1?: string; month3?: string; month6?: string; month12?: string; month18?: string; month24?: string; year3?: string; year4?: string; year5?: string };
  type CI = { name?: string; type?: string; monthly?: string };
  const streams = (data.revenue_streams as RS[]) ?? [];
  const costs = (data.cost_items as CI[]) ?? [];

  const fmtR = (v?: string | number) => {
    const n = typeof v === "number" ? v : parseFloat(v ?? "");
    return isNaN(n) ? "—" : `R ${n.toLocaleString("en-ZA", { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`;
  };
  const sumCol = (key: keyof RS) =>
    streams.reduce((acc, s) => acc + (parseFloat((s[key] as string) ?? "") || 0), 0);

  const MONTH_KEYS: (keyof RS)[] = ["month1", "month3", "month6", "month12", "month18", "month24"];
  const MONTH_LABELS = ["M1", "M3", "M6", "M12", "M18", "M24"];
  const YEAR_KEYS: (keyof RS)[] = ["year3", "year4", "year5"];
  const YEAR_LABELS = ["Year 3", "Year 4", "Year 5"];

  const children: (Paragraph | Table)[] = [];

  children.push(heading2("Revenue Projections"));
  if (streams.length > 0) {
    const colHeaders = ["Stream", ...MONTH_LABELS, ...YEAR_LABELS];
    children.push(
      new Table({
        width: { size: 100, type: WidthType.PERCENTAGE },
        rows: [
          new TableRow({ children: colHeaders.map((h) => new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: h, bold: true, size: 18 })] })] })) }),
          ...streams.map((s) =>
            new TableRow({
              children: [s.name ?? "—", ...MONTH_KEYS.map((k) => fmtR(s[k] as string)), ...YEAR_KEYS.map((k) => fmtR(s[k] as string))].map(
                (v) => new TableCell({ children: [new Paragraph({ text: String(v) })] })
              ),
            })
          ),
          new TableRow({
            children: ["Total", ...MONTH_KEYS.map((k) => fmtR(sumCol(k))), ...YEAR_KEYS.map((k) => fmtR(sumCol(k)))].map(
              (v) => new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: String(v), bold: true })] })] })
            ),
          }),
        ],
      })
    );
  }

  children.push(divider(), heading2("Cost Structure (Monthly)"));
  if (costs.length > 0) {
    const totalMonthly = costs.reduce((acc, c) => acc + (parseFloat(c.monthly ?? "") || 0), 0);
    children.push(
      new Table({
        width: { size: 70, type: WidthType.PERCENTAGE },
        rows: [
          new TableRow({ children: ["Item", "Type", "Monthly"].map((h) => new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: h, bold: true })] })] })) }),
          ...costs.map((c) =>
            new TableRow({
              children: [c.name ?? "—", c.type ?? "—", fmtR(c.monthly)].map(
                (v) => new TableCell({ children: [new Paragraph({ text: String(v) })] })
              ),
            })
          ),
          new TableRow({
            children: ["Total", "", fmtR(totalMonthly)].map(
              (v) => new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: v, bold: true })] })] })
            ),
          }),
        ],
      })
    );
  }

  children.push(divider(), heading2("Assumptions & Metrics"));
  if (data.growth_rate_pct) { children.push(label("Monthly growth rate"), body(`${data.growth_rate_pct}%`)); }
  if (data.churn_rate_pct) { children.push(label("Monthly churn rate"), body(`${data.churn_rate_pct}%`)); }
  if (data.cac) { children.push(label("Customer acquisition cost (CAC)"), body(fmtR(String(data.cac)))); }
  if (data.hiring_plan) { children.push(label("Hiring plan"), body(String(data.hiring_plan))); }
  if (data.key_assumptions) { children.push(divider(), label("Key assumptions"), body(String(data.key_assumptions))); }
  if (data.break_even_notes) { children.push(divider(), label("Break-even analysis"), body(String(data.break_even_notes))); }

  return buildDoc(teamName, "Financial Model", children);
};

const complianceChecklist: DocRenderer = async (data, _vp, teamName) => {
  const items = (data.items as Record<string, { status?: string; notes?: string }>) ?? {};
  const LABELS: Record<string, string> = {
    cipc_registration: "CIPC Registration",
    sars_income_tax: "SARS Income Tax",
    business_bank_account: "Business Bank Account",
    shareholder_agreement: "Shareholder Agreement",
    ip_assignment: "IP Assignment Agreement",
    tto_clearance: "TTO Clearance",
    sars_paye: "SARS PAYE",
    vat_registration: "VAT Registration",
    bbbee_affidavit: "B-BBEE Affidavit",
  };
  const children: (Paragraph | Table)[] = [];
  Object.entries(LABELS).forEach(([key, label_]) => {
    const item = items[key];
    children.push(label(label_));
    children.push(body(`Status: ${item?.status ?? "not_started"}`));
    if (item?.notes) children.push(body(`Notes: ${item.notes}`));
    children.push(divider());
  });
  return buildDoc(teamName, "SA Compliance Checklist", children);
};

const weeklyJournal: DocRenderer = async (data, _vp, teamName) => {
  // data not used — journal uses separate DB table; this is a placeholder
  // The actual export would need to pass entries differently
  const entries = (data.entries as Array<{
    week_start?: string; what_we_did?: string; what_we_learned?: string;
    what_changed?: string; blockers?: string; next_week_priority?: string;
  }>) ?? [];
  const children: (Paragraph | Table)[] = [];
  entries.forEach((e) => {
    children.push(heading2(`Week of ${e.week_start ?? "?"}`));
    children.push(label("What we did"), body(e.what_we_did ?? "—"));
    children.push(label("What we learned"), body(e.what_we_learned ?? "—"));
    children.push(label("What changed"), body(e.what_changed ?? "—"));
    children.push(label("Blockers"), body(e.blockers ?? "—"));
    children.push(label("Next week's priority"), body(e.next_week_priority ?? "—"));
    children.push(divider());
  });
  return buildDoc(teamName, "Weekly Progress Journal", children);
};

const genericRenderer: DocRenderer = async (data, vp, teamName) => {
  const children: (Paragraph | Table)[] = [...vpParagraph(vp)];
  for (const [key, value] of Object.entries(data)) {
    if (typeof value === "string" && value) {
      children.push(label(key.replace(/_/g, " ")));
      children.push(body(value));
    }
  }
  return buildDoc(teamName, "SpinUp Export", children);
};

export const RENDERERS: Record<string, DocRenderer> = {
  company_name: companyName,
  value_proposition: valueProposition,
  hypothesis_tracker: hypothesisTracker,
  problem_solution_fit: problemSolutionFit,
  competitive_landscape: competitiveLandscape,
  mvp_definition: mvpDefinition,
  pitch_deck: pitchDeck,
  financial_model: financialModel,
  compliance_checklist: complianceChecklist,
  weekly_journal: weeklyJournal,
};

export function getRenderer(artifactType: string): DocRenderer {
  return RENDERERS[artifactType] ?? genericRenderer;
}
