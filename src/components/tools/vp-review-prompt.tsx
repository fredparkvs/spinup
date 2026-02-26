"use client";

import { useState } from "react";
import Link from "next/link";
import { AlertCircle, ExternalLink } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import type { ValueProposition } from "@/lib/types/database";

interface VpReviewPromptProps {
  teamId: string;
  valueProposition: ValueProposition | null;
  vpUpdatedAt: string | null;
}

export function VpReviewPrompt({
  teamId,
  valueProposition,
  vpUpdatedAt,
}: VpReviewPromptProps) {
  const [dismissed, setDismissed] = useState(false);

  if (dismissed) return null;

  const vpLink = `/teams/${teamId}/tools/value-proposition`;

  if (!valueProposition) {
    return (
      <Alert>
        <AlertCircle className="size-4" />
        <AlertDescription className="flex items-center justify-between gap-4">
          <span>You haven&apos;t set your value proposition yet. It will be displayed at the top of every tool and included in all document exports.</span>
          <Button size="sm" asChild>
            <Link href={vpLink}>
              Set it now
              <ExternalLink className="size-3" />
            </Link>
          </Button>
        </AlertDescription>
      </Alert>
    );
  }

  const updatedDate = vpUpdatedAt
    ? new Date(vpUpdatedAt).toLocaleDateString("en-ZA", {
        day: "numeric",
        month: "long",
        year: "numeric",
      })
    : "some time ago";

  return (
    <Alert>
      <AlertCircle className="size-4" />
      <AlertDescription className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <span className="text-sm">
          Your value proposition was last updated on{" "}
          <span className="font-medium">{updatedDate}</span>. Does it still
          reflect your thinking before you continue?
        </span>
        <div className="flex items-center gap-2 shrink-0">
          <Button size="sm" variant="outline" asChild>
            <Link href={vpLink}>Review & Update</Link>
          </Button>
          <Button size="sm" variant="ghost" onClick={() => setDismissed(true)}>
            Continue
          </Button>
        </div>
      </AlertDescription>
    </Alert>
  );
}
