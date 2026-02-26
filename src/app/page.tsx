import Link from "next/link";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
} from "@/components/ui/card";

const phases = [
  {
    title: "Validate",
    description:
      "Test your research-based idea against real market demand. Identify your beachhead customer, map the problem, and build conviction before you build anything.",
  },
  {
    title: "Build Minimum",
    description:
      "Scope and ship the smallest viable version of your product. Focus on what matters, avoid over-engineering, and get something into users' hands fast.",
  },
  {
    title: "Sell & Iterate",
    description:
      "Land your first paying customers and learn from live feedback. Refine your offer, tighten your unit economics, and chart the path to break-even.",
  },
];

export default function Home() {
  return (
    <div className="flex min-h-screen flex-col">
      <main className="flex flex-1 flex-col items-center">
        {/* Hero */}
        <section className="flex w-full flex-col items-center gap-8 px-6 pt-32 pb-20 text-center">
          <h1 className="text-5xl font-bold tracking-tight sm:text-6xl">
            SpinUp
          </h1>
          <p className="max-w-2xl text-lg text-muted-foreground sm:text-xl">
            Evidence-based tools to help South African research spinout founders
            reach break-even faster
          </p>
          <div className="flex flex-col gap-4 sm:flex-row">
            <Button asChild size="lg">
              <Link href="/sign-up">Get Started</Link>
            </Button>
            <Button asChild variant="outline" size="lg">
              <Link href="/sign-in">Sign In</Link>
            </Button>
          </div>
        </section>

        {/* Phases */}
        <section className="w-full max-w-5xl px-6 pb-24">
          <h2 className="mb-8 text-center text-2xl font-semibold tracking-tight">
            Three phases to break-even
          </h2>
          <div className="grid gap-6 sm:grid-cols-3">
            {phases.map((phase, index) => (
              <Card key={phase.title}>
                <CardHeader>
                  <CardDescription className="text-xs font-medium uppercase tracking-wider">
                    Phase {index + 1}
                  </CardDescription>
                  <CardTitle className="text-xl">{phase.title}</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground">
                    {phase.description}
                  </p>
                </CardContent>
              </Card>
            ))}
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="border-t py-8 text-center text-sm text-muted-foreground">
        Built for South African research spinouts
      </footer>
    </div>
  );
}
