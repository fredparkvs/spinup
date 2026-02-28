import Link from "next/link";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ArrowRight } from "lucide-react";
import type { LucideIcon } from "lucide-react";

interface AppSelectorCardProps {
  icon: LucideIcon;
  title: string;
  description: string;
  status: "active" | "new" | "coming_soon";
  href?: string;
  actionLabel?: string;
  detail?: string;
}

export function AppSelectorCard({
  icon: Icon,
  title,
  description,
  status,
  href,
  actionLabel,
  detail,
}: AppSelectorCardProps) {
  const isDisabled = status === "coming_soon";

  return (
    <Card className={isDisabled ? "opacity-60" : ""}>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="text-base flex items-center gap-2">
            <Icon className="size-4" />
            {title}
          </CardTitle>
          {status === "new" && (
            <Badge variant="secondary" className="text-xs">
              New
            </Badge>
          )}
          {status === "coming_soon" && (
            <Badge variant="outline" className="text-xs">
              Coming soon
            </Badge>
          )}
        </div>
        <CardDescription>{description}</CardDescription>
      </CardHeader>
      <CardContent className="flex items-center justify-between">
        {detail && (
          <p className="text-xs text-muted-foreground">{detail}</p>
        )}
        {!detail && <div />}
        {href && !isDisabled ? (
          <Button asChild size="sm">
            <Link href={href}>
              {actionLabel ?? "Open"}
              <ArrowRight className="size-3.5" />
            </Link>
          </Button>
        ) : (
          <Button size="sm" disabled>
            {actionLabel ?? "Coming soon"}
          </Button>
        )}
      </CardContent>
    </Card>
  );
}
