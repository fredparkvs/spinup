import Link from "next/link";
import { Button } from "@/components/ui/button";
import { SpinUpLogo } from "@/components/marketing/logo";
import { MentorApplyForm } from "@/components/marketing/mentor-apply-form";

export const metadata = {
  title: "Mentors — SpinUp",
  description:
    "Meet the SpinUp mentor network — experienced founders and operators who guide South African research spinout teams through the journey.",
};

interface Mentor {
  name: string;
  companies: string[];
  industries: string[];
  bio: string;
}

const MENTORS: Mentor[] = [
  {
    name: "Fred Lutz",
    companies: ["Custos Media Technologies", "VoxCroft Analytics"],
    industries: ["Blockchain", "AI", "Intelligence", "Software", "SaaS", "B2B", "B2G"],
    bio: "Co-founder and spinout founder with experience taking deep-tech ventures from research lab to commercial scale. Has run companies through scale-up across blockchain, AI, and analytics.",
  },
];

export default function MentorsPage() {
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
            <span className="text-sm font-medium hidden sm:block">Mentors</span>
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
              The Mentor Network
            </span>
            <h1 className="text-4xl font-bold tracking-tight sm:text-5xl leading-tight">
              Mentors who have been through the journey
            </h1>
          </div>
          <p className="text-xl text-muted-foreground leading-relaxed">
            SpinUp mentors are experienced founders and operators who guide founders
            through the tools — not around them. They have built and scaled companies,
            navigated the South African ecosystem, and understand what it actually takes
            to get from an idea to a viable business.
          </p>
        </section>

        {/* Why mentors matter */}
        <section className="border-t">
          <div className="mx-auto max-w-3xl px-6 py-16">
            <div className="space-y-5 mb-14">
              <div className="w-10 h-1 bg-red-600 rounded-full" />
              <h2 className="text-2xl font-bold">Why mentors make the difference</h2>
              <div className="text-muted-foreground leading-relaxed space-y-4">
                <p>
                  The evidence on mentorship is clear: founders who receive structured,
                  long-term, relationship-based mentorship — practical guidance from
                  people who have been through the journey themselves — build stronger
                  businesses, raise capital more effectively, and make better decisions
                  at every stage.
                </p>
                <p>
                  What does not work is one-off advice, lecture-style coaching, or
                  generic frameworks presented in workshop format. What works is a mentor
                  who understands your specific situation, can see what you are building
                  in context, and guides you through the hard decisions rather than
                  around them.
                </p>
                <p>
                  SpinUp is built so that mentors can see exactly what each team is
                  working on — the specific tools, the outputs, the gaps — and provide
                  guidance directly in that context. No update decks. No status reports.
                  Just mentorship embedded in the work itself.
                </p>
              </div>
            </div>

            <div className="space-y-5">
              <div className="w-10 h-1 bg-red-600 rounded-full" />
              <h2 className="text-2xl font-bold">What we look for in a mentor</h2>
              <div className="grid gap-4 sm:grid-cols-2">
                {[
                  {
                    title: "Operational experience",
                    body: "You have founded, co-founded, or operated a company — ideally a spinout or early-stage venture. You know what it feels like to be in the room when the hard decisions get made.",
                  },
                  {
                    title: "South African context",
                    body: "You understand the SA ecosystem — its capital constraints, talent market, regulatory environment, and the specific challenges that founders here face that their Silicon Valley counterparts do not.",
                  },
                  {
                    title: "Commitment to the relationship",
                    body: "Mentorship on SpinUp is ongoing, not episodic. We ask for a minimum of monthly touchpoints with the teams you support, guided by what they are actually working on in the platform.",
                  },
                  {
                    title: "Specific domain knowledge",
                    body: "Deep expertise in one or more areas — whether that is medtech, agritech, SaaS, B2G, fundraising, unit economics, or scaling teams — that is genuinely useful to founders working in that space.",
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
          </div>
        </section>

        {/* Mentor cards */}
        <section className="bg-muted/40 py-16 px-6">
          <div className="mx-auto max-w-3xl">
            <h2 className="text-2xl font-bold mb-10">Current mentors</h2>
            <div className="grid gap-6 sm:grid-cols-2">
              {MENTORS.map((mentor) => (
                <div
                  key={mentor.name}
                  className="rounded-xl border bg-background p-6 space-y-4"
                >
                  <div className="flex items-start gap-3">
                    <div className="w-10 h-1 bg-red-600 rounded-full mt-2 shrink-0" />
                    <div>
                      <h3 className="font-semibold text-lg">{mentor.name}</h3>
                    </div>
                  </div>

                  <p className="text-sm text-muted-foreground leading-relaxed">
                    {mentor.bio}
                  </p>

                  <div className="space-y-3">
                    <div>
                      <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-1.5">
                        Companies
                      </p>
                      <ul className="space-y-0.5">
                        {mentor.companies.map((c) => (
                          <li key={c} className="text-sm flex items-center gap-2">
                            <span className="text-red-600 font-bold text-xs">—</span>
                            {c}
                          </li>
                        ))}
                      </ul>
                    </div>

                    <div>
                      <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-1.5">
                        Industries
                      </p>
                      <div className="flex flex-wrap gap-1.5">
                        {mentor.industries.map((ind) => (
                          <span
                            key={ind}
                            className="inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-medium"
                          >
                            {ind}
                          </span>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Application form */}
        <section className="mx-auto max-w-3xl px-6 py-16">
          <div className="space-y-2 mb-8">
            <div className="w-10 h-1 bg-red-600 rounded-full" />
            <h2 className="text-2xl font-bold">Become a mentor</h2>
            <p className="text-muted-foreground">
              If you have built and scaled companies in South Africa and want to help
              the next generation of research spinout founders, we would like to hear
              from you. Fill in the form below and Fred will be in touch.
            </p>
          </div>
          <MentorApplyForm />
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
