import Link from "next/link";
import { Button } from "@/components/ui/button";
import { SpinUpLogo } from "@/components/marketing/logo";

export const metadata = {
  title: "About — SpinUp",
  description:
    "Fred Lutz on the experience behind SpinUp and why it was built for South African research spinout founders.",
};

export default function AboutPage() {
  return (
    <div className="flex min-h-screen flex-col">
      {/* Nav */}
      <header className="sticky top-0 z-50 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/80">
        <div className="mx-auto flex max-w-5xl items-center justify-between px-6 py-4">
          <Link href="/" className="flex items-center gap-2.5">
            <SpinUpLogo size={30} />
            <span className="font-bold text-lg tracking-tight">SpinUp</span>
          </Link>
          <nav className="flex items-center gap-5">
            <span className="text-sm font-medium hidden sm:block">About</span>
            <Link
              href="/mentors"
              className="text-sm text-muted-foreground hover:text-foreground transition-colors hidden sm:block"
            >
              Mentors
            </Link>
            <Link
              href="/sign-in"
              className="text-sm text-muted-foreground hover:text-foreground transition-colors"
            >
              Sign In
            </Link>
            <Button asChild size="sm">
              <Link href="/sign-up">Get Started</Link>
            </Button>
          </nav>
        </div>
      </header>

      <main className="flex-1">
        {/* Hero */}
        <section className="mx-auto max-w-3xl px-6 pt-20 pb-12">
          <div className="space-y-2 mb-8">
            <span className="text-xs font-semibold uppercase tracking-wider text-red-600">
              Our Story
            </span>
            <h1 className="text-4xl font-bold tracking-tight sm:text-5xl leading-tight">
              Built by entrepreneurs for entrepreneurs
            </h1>
          </div>
          <p className="text-xl text-muted-foreground leading-relaxed">
            SpinUp exists because the journey from research lab to market is genuinely hard —
            and most of the tools available to founders either assume a US context, require
            expensive consultants, or teach frameworks without helping you apply them.
          </p>
        </section>

        {/* Fred's story */}
        <section className="border-t">
          <div className="mx-auto max-w-3xl px-6 py-16 space-y-14">
            <div className="space-y-5">
              <div className="w-10 h-1 bg-red-600 rounded-full" />
              <h2 className="text-2xl font-bold">Fred Lutz</h2>
              <div className="text-muted-foreground leading-relaxed space-y-4">
                <p>
                  I co-founded and spun out Custos Media Technologies and ran companies through
                  scale-up. I have sat in the room when an idea with genuine commercial
                  potential died on the vine — not because the science was wrong, but because
                  the founders did not know what to do next, and nobody gave them the right
                  tools at the right time. I am talking from experience.
                </p>
                <p>
                  I have seen what happens when founders get structured, evidence-based support:
                  they move faster, waste less capital, and make better decisions. Not because
                  they are smarter, but because they know what question to ask next. And I tap
                  my network for others who have been through the journey to help curate the
                  data and frameworks that power SpinUp.
                </p>
                <p>
                  SpinUp is my attempt to systematise that support. Not as consulting, not as a
                  course, but as a set of practical tools that embed the research — about what
                  actually works, at what stage, and why — directly into the founder&apos;s
                  workflow. I want every research spinout founder in South Africa to have access
                  to the same quality of structured support that the best-funded founders take
                  for granted.
                </p>
              </div>
            </div>

            <div className="space-y-5">
              <div className="w-10 h-1 bg-red-600 rounded-full" />
              <h2 className="text-2xl font-bold">Why South Africa</h2>
              <div className="text-muted-foreground leading-relaxed space-y-4">
                <p>
                  South African research institutions produce world-class science. The
                  University of Cape Town, Stellenbosch, Wits, and others generate IP with real
                  commercial potential across medtech, agritech, cleantech, and deep tech. The
                  gap between that science and a commercially viable business is where most
                  spinouts get lost — and where SpinUp operates.
                </p>
                <p>
                  The challenges founders face here are real and specific: a smaller domestic
                  market, limited access to early-stage capital, a talent market that is hard to
                  navigate without the right networks, and far less access to the kind of
                  hands-on mentorship that founders in better-funded ecosystems take for granted.
                  SpinUp is built with those constraints in mind. It is not a Silicon Valley
                  tool transplanted to a different context — it is built for this one.
                </p>
              </div>
            </div>

            <div className="space-y-5">
              <div className="w-10 h-1 bg-red-600 rounded-full" />
              <h2 className="text-2xl font-bold">The research behind the tools</h2>
              <div className="text-muted-foreground leading-relaxed space-y-4">
                <p>
                  The tools in SpinUp are not invented from scratch. They synthesise findings
                  from GALI&apos;s database of 23,000+ ventures, Startup Genome&apos;s global scaling
                  research, McKinsey&apos;s high-growth company studies, and South Africa-specific
                  ecosystem data. Where the evidence says something clearly — about when to
                  raise capital, what unit economics benchmarks matter at each stage, how team
                  composition affects outcomes — that finding is embedded directly into the
                  tools as benchmarks, red flags, and decision frameworks.
                </p>
                <p>
                  The goal is that founders interact with the frameworks, not the papers. The
                  research should shape their decisions without them needing to read forty
                  academic studies first. The tools do the translation work.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* What we believe */}
        <section className="bg-muted/40 py-16 px-6">
          <div className="mx-auto max-w-3xl">
            <h2 className="text-2xl font-bold mb-10">What we believe</h2>
            <div className="grid gap-8 sm:grid-cols-2">
              {[
                {
                  title: "Founders deserve better tools",
                  body: "Most founder tools are either too generic or too expensive. SpinUp is built specifically for the South African research spinout context — and it is free to use.",
                },
                {
                  title: "Mentors make the difference",
                  body: "The best accelerator outcomes happen when mentors are close to the work, not presenting slides in a lecture hall. SpinUp is built so mentors can see exactly what founders are doing and guide them in context.",
                },
                {
                  title: "Evidence beats opinion",
                  body: "We follow the data. When the evidence says something clearly, we build it in as a benchmark or a red flag. When the evidence is mixed, we tell you that too.",
                },
                {
                  title: "Practical beats theoretical",
                  body: "Every tool ends with something a founder can use — a document to share, a decision to make, a number to track. No completion certificates for reading frameworks.",
                },
              ].map(({ title, body }) => (
                <div key={title} className="space-y-2">
                  <div className="flex items-start gap-2.5">
                    <span className="w-1.5 h-1.5 rounded-full bg-red-600 mt-2 shrink-0" />
                    <h3 className="font-semibold">{title}</h3>
                  </div>
                  <p className="text-sm text-muted-foreground leading-relaxed pl-4">{body}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* CTA */}
        <section className="mx-auto max-w-3xl px-6 py-16 text-center space-y-4">
          <h2 className="text-2xl font-bold">Start the journey</h2>
          <p className="text-muted-foreground">
            Free to use. No credit card. Built for South African research spinout founders.
          </p>
          <Button asChild size="lg">
            <Link href="/sign-up">Create Your Free Account</Link>
          </Button>
        </section>
      </main>

      {/* Footer */}
      <footer className="border-t py-8 px-6">
        <div className="mx-auto max-w-5xl flex flex-col sm:flex-row items-center justify-between gap-4 text-sm text-muted-foreground">
          <div className="flex items-center gap-2">
            <SpinUpLogo size={22} />
            <span className="font-semibold text-foreground">SpinUp</span>
          </div>
          <div className="flex items-center gap-6">
            <Link href="/about" className="hover:text-foreground transition-colors">
              About
            </Link>
            <Link href="/mentors" className="hover:text-foreground transition-colors">
              Mentors
            </Link>
            <Link href="/sign-in" className="hover:text-foreground transition-colors">
              Sign In
            </Link>
            <Link href="/sign-up" className="hover:text-foreground transition-colors">
              Get Started
            </Link>
          </div>
          <p>© 2026 Fred Lutz. Built by entrepreneurs for entrepreneurs.</p>
        </div>
      </footer>
    </div>
  );
}
