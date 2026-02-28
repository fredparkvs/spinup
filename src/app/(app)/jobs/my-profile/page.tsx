import { redirect } from "next/navigation";
import { fetchJbContext } from "@/lib/jobs/fetch-jb-context";
import { ApplicantDetail } from "@/components/jobs/applicant-detail";
import { PublishToggle } from "@/components/jobs/publish-toggle";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Mail, Info } from "lucide-react";
import Link from "next/link";

export default async function MyProfilePreviewPage() {
  const ctx = await fetchJbContext();

  if (!ctx.jbRoles.includes("applicant") && ctx.platformRole !== "admin") {
    redirect("/jobs");
  }

  if (!ctx.applicantProfile) {
    redirect("/jobs/onboarding");
  }

  const isPublished = ctx.applicantProfile.is_published;

  return (
    <div>
      <div className="mb-6 flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Preview & Publish</h1>
          <p className="text-sm text-muted-foreground">
            This is exactly how companies will see your profile
          </p>
        </div>
        <div className="flex items-center gap-3 shrink-0">
          <Badge variant={isPublished ? "default" : "outline"}>
            {isPublished ? "Published" : "Draft"}
          </Badge>
          <PublishToggle
            profileId={ctx.applicantProfile.id}
            isPublished={isPublished}
          />
        </div>
      </div>

      {/* Published explanation */}
      {isPublished ? (
        <div className="mb-6 rounded-lg border border-primary/20 bg-primary/5 p-4 space-y-2">
          <div className="flex items-center gap-2 text-sm font-medium text-primary">
            <Mail className="size-4 shrink-0" />
            Your profile is live — here&apos;s what happens next
          </div>
          <ul className="space-y-1.5 text-sm text-muted-foreground ml-6 list-disc">
            <li>Companies browse anonymously and can see your profile without knowing who you are.</li>
            <li>If a company is interested, they can send you a message through the platform — you&apos;ll receive it by email.</li>
            <li>The email will introduce the company (name, what they do, how they work) but will never reveal your identity to them.</li>
            <li>
              <strong className="text-foreground">We suggest you always reply</strong> — even if you&apos;re not interested.
              A short, polite response keeps the startup community healthy and may open unexpected doors.
            </li>
          </ul>
        </div>
      ) : (
        <div className="mb-6 rounded-lg border bg-muted/40 p-4 flex items-start gap-3">
          <Info className="size-4 shrink-0 mt-0.5 text-muted-foreground" />
          <div className="space-y-1">
            <p className="text-sm font-medium">Your profile is in draft</p>
            <p className="text-sm text-muted-foreground">
              Companies can&apos;t see you yet. Once you&apos;re happy with your profile, hit{" "}
              <strong>Publish</strong> to go live.
            </p>
          </div>
        </div>
      )}

      <ApplicantDetail
        profile={ctx.applicantProfile}
        preferences={ctx.preferences}
      />

      <div className="mt-8 flex justify-start">
        <Button asChild variant="outline">
          <Link href="/jobs/profile">← Back to edit profile</Link>
        </Button>
      </div>
    </div>
  );
}
