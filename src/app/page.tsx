import Link from "next/link";
import { Button } from "@/components/ui/button";
import { FlaskConical, Briefcase, Rocket } from "lucide-react";
import { SpinUpLogo } from "@/components/marketing/logo";

export default function Home() {
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
            <Link
              href="/about"
              className="text-sm text-muted-foreground hover:text-foreground transition-colors hidden sm:block"
            >
              About
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

      <main className="flex flex-1 flex-col items-center">
        {/* Hero */}
        <section className="flex w-full flex-col items-center gap-8 px-6 pt-24 pb-20 text-center">
          <SpinUpLogo size={72} />
          <div className="space-y-3">
            <h1 className="text-5xl font-bold tracking-tight sm:text-7xl">SpinUp</h1>
            <p className="text-xl text-muted-foreground sm:text-2xl">
              From research lab to funded company.
            </p>
          </div>
          <p className="max-w-xl text-muted-foreground leading-relaxed">
            Three integrated apps to take South African research spinout founders from first
            idea to break-even, first hire, and venture scale. Practical, mentor-supported,
            and grounded in evidence.
          </p>
          <div className="flex flex-col gap-3 sm:flex-row">
            <Button asChild size="lg">
              <Link href="/sign-up">Get Started — It&apos;s Free</Link>
            </Button>
            <Button asChild variant="outline" size="lg">
              <Link href="/about">Our Story</Link>
            </Button>
          </div>
        </section>

        {/* Philosophy */}
        <section className="w-full bg-muted/40 py-20 px-6">
          <div className="mx-auto max-w-4xl">
            <div className="text-center mb-12">
              <h2 className="text-3xl font-bold tracking-tight">Built on three principles</h2>
              <p className="mt-3 text-muted-foreground max-w-xl mx-auto">
                SpinUp is not a course, a framework, or a consulting service. It is a set of
                tools that make the right things easy to do.
              </p>
            </div>
            <div className="grid gap-10 sm:grid-cols-3">
              <div className="space-y-3">
                <div className="w-10 h-1 bg-red-600 rounded-full" />
                <h3 className="font-semibold text-lg">Research-Based</h3>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  Every tool is grounded in evidence from studies of thousands of startup
                  outcomes — from GALI&apos;s database of 23,000 ventures to Startup Genome&apos;s
                  scaling research. The benchmarks, red flags, and frameworks are not opinions.
                  They are what the data says works.
                </p>
              </div>
              <div className="space-y-3">
                <div className="w-10 h-1 bg-red-600 rounded-full" />
                <h3 className="font-semibold text-lg">Mentor-Supported</h3>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  Every tool has a built-in space for mentor and administrator guidance. Mentors
                  see exactly what founders are building in real time, add coaching prompts, and
                  flag concerns — without taking over the wheel. The founder leads; the mentor
                  guides.
                </p>
              </div>
              <div className="space-y-3">
                <div className="w-10 h-1 bg-red-600 rounded-full" />
                <h3 className="font-semibold text-lg">Practical</h3>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  No slides to read. No frameworks to memorise. Every tool begins with a clear
                  explanation of why it matters and ends with a concrete output — something you
                  can share with a customer, a mentor, or an investor.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* Three apps — detailed */}
        <section className="w-full max-w-5xl px-6 py-24">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold tracking-tight">Three apps, one journey</h2>
            <p className="mt-3 text-muted-foreground max-w-xl mx-auto">
              Each app is designed for a specific stage. Use them sequentially, or jump in
              where you are.
            </p>
          </div>

          <div className="space-y-20">
            {/* Phase 1 */}
            <div className="grid gap-10 md:grid-cols-2 items-center">
              <div className="space-y-5">
                <span className="text-xs font-semibold uppercase tracking-wider text-red-600">
                  Phase 1
                </span>
                <h3 className="text-2xl font-bold">SpinUp Tools — Incubator</h3>
                <p className="text-muted-foreground leading-relaxed">
                  Seventeen evidence-based tools to take you from an unvalidated idea to
                  break-even. Validate your problem, define your minimum viable product, price
                  it, sell it, and iterate — with built-in mentor guidance at every step.
                </p>
                <ul className="space-y-2 text-sm text-muted-foreground">
                  {[
                    "Hypothesis tracking and Mom Test interview frameworks",
                    "Problem-Solution Fit Canvas",
                    "Unit Economics and Runway Calculator",
                    "PMF Dashboard with Sean Ellis benchmarks",
                    "Pricing experiments and financial modelling",
                  ].map((f) => (
                    <li key={f} className="flex items-start gap-2">
                      <span className="text-red-600 shrink-0 mt-0.5 font-bold">—</span>
                      {f}
                    </li>
                  ))}
                </ul>
                <Button asChild>
                  <Link href="/sign-up">Start for Free</Link>
                </Button>
              </div>
              <div className="rounded-2xl border bg-muted/30 p-8">
                <div className="flex items-center gap-3 mb-6">
                  <FlaskConical className="size-7 text-muted-foreground" />
                  <div>
                    <p className="font-semibold">SpinUp Tools</p>
                    <p className="text-xs text-muted-foreground">Idea → Break-even</p>
                  </div>
                </div>
                <div className="space-y-2">
                  {["Setup", "Validate", "Build Minimum", "Sell & Iterate"].map(
                    (phase, i) => (
                      <div
                        key={phase}
                        className="flex items-center gap-3 rounded-lg bg-background border px-3 py-2.5"
                      >
                        <span className="text-xs text-red-600 font-bold w-5">{i + 1}</span>
                        <span className="text-sm font-medium">{phase}</span>
                      </div>
                    )
                  )}
                </div>
              </div>
            </div>

            <div className="border-t" />

            {/* Phase 2 */}
            <div className="grid gap-10 md:grid-cols-2 items-center">
              <div className="rounded-2xl border bg-muted/30 p-8 order-last md:order-first">
                <div className="flex items-center gap-3 mb-6">
                  <Briefcase className="size-7 text-muted-foreground" />
                  <div>
                    <p className="font-semibold">Job Board</p>
                    <p className="text-xs text-muted-foreground">Bias-free talent discovery</p>
                  </div>
                </div>
                <div className="space-y-3 text-sm">
                  <div className="rounded-lg bg-background border px-3 py-3">
                    <p className="font-medium">For applicants</p>
                    <p className="text-xs text-muted-foreground mt-1">
                      Share skills and experience anonymously. Be discovered on merit, not
                      appearance or background.
                    </p>
                  </div>
                  <div className="rounded-lg bg-background border px-3 py-3">
                    <p className="font-medium">For startups</p>
                    <p className="text-xs text-muted-foreground mt-1">
                      Discover candidates you would never have found through conventional
                      hiring. Reach out directly when there&apos;s a match.
                    </p>
                  </div>
                </div>
              </div>
              <div className="space-y-5">
                <span className="text-xs font-semibold uppercase tracking-wider text-red-600">
                  Phase 2
                </span>
                <h3 className="text-2xl font-bold">Job Board</h3>
                <p className="text-muted-foreground leading-relaxed">
                  A bias-free job board built for South African startups. Applicants share
                  skills, experience, and work samples anonymously — companies discover talent
                  on merit, not appearance, background, or university name.
                </p>
                <ul className="space-y-2 text-sm text-muted-foreground">
                  {[
                    "Anonymous profiles — no photos, no names until match",
                    "Skills-first discovery for early-stage roles",
                    "Direct outreach from companies to matched candidates",
                    "Built for South African startup hiring budgets",
                  ].map((f) => (
                    <li key={f} className="flex items-start gap-2">
                      <span className="text-red-600 shrink-0 mt-0.5 font-bold">—</span>
                      {f}
                    </li>
                  ))}
                </ul>
                <Button asChild>
                  <Link href="/sign-up?app=jobs">Join the Job Board</Link>
                </Button>
              </div>
            </div>

            <div className="border-t" />

            {/* Phase 3 */}
            <div className="grid gap-10 md:grid-cols-2 items-center">
              <div className="space-y-5">
                <div className="flex items-center gap-3">
                  <span className="text-xs font-semibold uppercase tracking-wider text-red-600">
                    Phase 3
                  </span>
                  <span className="inline-flex items-center rounded-full bg-red-50 border border-red-200 px-2.5 py-0.5 text-xs font-medium text-red-700">
                    New
                  </span>
                </div>
                <h3 className="text-2xl font-bold">Accelerator</h3>
                <p className="text-muted-foreground leading-relaxed">
                  Twelve post-PMF tools structured around the six dimensions of scaling
                  readiness. For founders who have validated demand and now need to build a
                  repeatable, scalable, fundable business.
                </p>
                <ul className="space-y-2 text-sm text-muted-foreground">
                  {[
                    "Scaling Readiness Assessment across 6 pillars",
                    "GTM Playbook Builder for repeatable sales",
                    "Growth-stage unit economics and revenue retention tracking",
                    "OKR planning, process documentation, board governance",
                    "Fundraising pipeline with VC due diligence toolkit",
                  ].map((f) => (
                    <li key={f} className="flex items-start gap-2">
                      <span className="text-red-600 shrink-0 mt-0.5 font-bold">—</span>
                      {f}
                    </li>
                  ))}
                </ul>
                <Button asChild>
                  <Link href="/sign-up">Get Started</Link>
                </Button>
              </div>
              <div className="rounded-2xl border bg-muted/30 p-8">
                <div className="flex items-center gap-3 mb-6">
                  <Rocket className="size-7 text-muted-foreground" />
                  <div>
                    <p className="font-semibold">Accelerator</p>
                    <p className="text-xs text-muted-foreground">PMF → Scale</p>
                  </div>
                </div>
                <div className="space-y-2">
                  {[
                    "GTM Repeatability",
                    "Unit Economics",
                    "Team & Org Design",
                    "Operations & Systems",
                    "Board Governance",
                    "Fundraising Strategy",
                  ].map((pillar) => (
                    <div
                      key={pillar}
                      className="flex items-center gap-3 rounded-lg bg-background border px-3 py-2"
                    >
                      <span className="size-1.5 rounded-full bg-red-600 shrink-0" />
                      <span className="text-sm">{pillar}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* CTA strip */}
        <section className="w-full bg-foreground text-background py-20 px-6">
          <div className="mx-auto max-w-2xl text-center space-y-6">
            <h2 className="text-3xl font-bold">Ready to start?</h2>
            <p className="text-background/70 max-w-md mx-auto">
              Free to use. No credit card required. Built specifically for South African
              research spinout founders.
            </p>
            <Button asChild size="lg" variant="secondary">
              <Link href="/sign-up">Create Your Free Account</Link>
            </Button>
          </div>
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
            <Link href="/sign-in" className="hover:text-foreground transition-colors">
              Sign In
            </Link>
            <Link href="/sign-up" className="hover:text-foreground transition-colors">
              Get Started
            </Link>
          </div>
          <p>© 2025 SpinUp. Built for South African startups.</p>
        </div>
      </footer>
    </div>
  );
}
