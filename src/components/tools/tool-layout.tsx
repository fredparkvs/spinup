"use client";

import { type ReactNode } from "react";
import { type LucideIcon, Download } from "lucide-react";
import { Separator } from "@/components/ui/separator";
import { ToolNotesPanel } from "@/components/tools/tool-notes-panel";
import { VpReviewPrompt } from "@/components/tools/vp-review-prompt";
import type { ValueProposition } from "@/lib/types/database";

interface ToolNote {
  id: string;
  note_text: string;
  url: string | null;
  url_label: string | null;
  author_role: "admin" | "mentor";
  created_by: string;
  created_at: string;
}

interface ToolLayoutProps {
  icon: LucideIcon;
  title: string;
  description: string;
  children: ReactNode;
  // Notes
  teamId: string;
  artifactType: string;
  platformRole: "admin" | "mentor" | "entrepreneur";
  currentUserId: string;
  adminNotes: ToolNote[];
  mentorNotes: ToolNote[];
  // VP review (optional)
  promptVpReview?: boolean;
  valueProposition?: ValueProposition | null;
  vpUpdatedAt?: string | null;
  // Export
  artifactId?: string | null;
}

export function ToolLayout({
  icon: Icon,
  title,
  description,
  children,
  teamId,
  artifactType,
  platformRole,
  currentUserId,
  adminNotes,
  mentorNotes,
  promptVpReview = false,
  valueProposition,
  vpUpdatedAt,
  artifactId,
}: ToolLayoutProps) {
  return (
    <div className="mx-auto w-full max-w-3xl px-4 py-8 space-y-6">
      {/* Header */}
      <div className="flex items-start gap-3">
        <Icon className="mt-0.5 size-6 shrink-0 text-primary" />
        <div className="flex-1">
          <h1 className="text-2xl font-bold tracking-tight">{title}</h1>
          <p className="text-sm text-muted-foreground">{description}</p>
        </div>
        {artifactId && (
          <a
            href={`/api/artifacts/${artifactId}/export`}
            className="inline-flex items-center gap-1.5 rounded-md border border-input bg-background px-3 py-1.5 text-xs font-medium hover:bg-accent transition-colors shrink-0"
            title="Download as .docx"
          >
            <Download className="size-3.5" />Export
          </a>
        )}
      </div>

      {/* VP review prompt (tools 3, 4, 5) */}
      {promptVpReview && (
        <VpReviewPrompt
          teamId={teamId}
          valueProposition={valueProposition ?? null}
          vpUpdatedAt={vpUpdatedAt ?? null}
        />
      )}

      {/* Main content */}
      {children}

      {/* Notes panel */}
      <Separator />
      <ToolNotesPanel
        teamId={teamId}
        artifactType={artifactType}
        platformRole={platformRole}
        currentUserId={currentUserId}
        adminNotes={adminNotes}
        mentorNotes={mentorNotes}
      />
    </div>
  );
}
