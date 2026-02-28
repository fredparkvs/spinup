import Link from "next/link";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
  CardFooter,
} from "@/components/ui/card";
import { FlaskConical, Briefcase, Rocket } from "lucide-react";

const apps = [
  {
    phase: "Phase 1",
    title: "Idea to Break Even",
    icon: FlaskConical,
    app: "SpinUp Tools",
    description:
      "Evidence-based tools to help research spinout founders validate their idea, scope a minimum product, land first customers, and reach break-even faster.",
    cta: "Get Started",
    href: "/sign-up",
    badge: null,
  },
  {
    phase: "Phase 2",
    title: "Building a Team",
    icon: Briefcase,
    app: "Job Board",
    description:
      "A bias-free job board built for South African startups. Applicants share skills and experience anonymously — companies discover talent on merit, not appearance.",
    cta: "Join the Job Board",
    href: "/sign-up?app=jobs",
    badge: "New",
  },
  {
    phase: "Phase 3",
    title: "Scale",
    icon: Rocket,
    app: "Accelerator",
    description:
      "Structured programmes to help South African founders scale their ventures, raise capital, and expand into new markets.",
    cta: "Coming Soon",
    href: null,
    badge: "Coming Soon",
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
            Tools for South African Startups
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

        {/* Apps */}
        <section className="w-full max-w-5xl px-6 pb-24">
          <h2 className="mb-8 text-center text-2xl font-semibold tracking-tight">
            From first idea to scale
          </h2>
          <div className="grid gap-6 sm:grid-cols-3">
            {apps.map((item, index) => {
              const Icon = item.icon;
              return (
                <Card
                  key={item.title}
                  className={item.href ? "" : "opacity-70"}
                >
                  <CardHeader>
                    <CardDescription className="text-xs font-medium uppercase tracking-wider">
                      Phase {index + 1}
                    </CardDescription>
                    <div className="flex items-center gap-2 mt-1">
                      <Icon className="size-5 text-primary" />
                      <CardTitle className="text-xl">{item.title}</CardTitle>
                    </div>
                    <p className="text-xs text-muted-foreground font-medium">
                      {item.app}
                      {item.badge && (
                        <span className="ml-2 inline-flex items-center rounded-full bg-primary/10 px-2 py-0.5 text-xs font-medium text-primary">
                          {item.badge}
                        </span>
                      )}
                    </p>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm text-muted-foreground">
                      {item.description}
                    </p>
                  </CardContent>
                  <CardFooter>
                    {item.href ? (
                      <Button asChild variant="outline" size="sm" className="w-full">
                        <Link href={item.href}>{item.cta}</Link>
                      </Button>
                    ) : (
                      <Button
                        variant="outline"
                        size="sm"
                        className="w-full"
                        disabled
                      >
                        {item.cta}
                      </Button>
                    )}
                  </CardFooter>
                </Card>
              );
            })}
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="border-t py-8 text-center text-sm text-muted-foreground">
        Built for South African startups
      </footer>
    </div>
  );
}
