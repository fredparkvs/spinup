import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";
import Link from "next/link";

export default async function JbAdminApplicantsPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/sign-in");

  const admin = createAdminClient();

  const { data: profile } = await admin
    .from("profiles")
    .select("platform_role")
    .eq("id", user.id)
    .single();

  if (profile?.platform_role !== "admin") {
    redirect("/jobs");
  }

  // Fetch all applicants with their real names (admin only)
  const { data: applicants } = await admin
    .from("jb_applicant_profiles")
    .select("id, user_id, anonymous_id, is_published, software_skills, location_city, created_at")
    .order("created_at", { ascending: false });

  // Fetch real names
  const userIds = (applicants ?? []).map((a: { user_id: string }) => a.user_id);
  const { data: profiles } = userIds.length > 0
    ? await admin
        .from("profiles")
        .select("id, full_name, email")
        .in("id", userIds)
    : { data: [] };

  const nameMap = new Map(
    (profiles ?? []).map((p: { id: string; full_name: string | null; email: string }) => [p.id, p])
  );

  return (
    <div>
      <Button asChild variant="ghost" size="sm" className="mb-4">
        <Link href="/jobs/admin">
          <ArrowLeft className="size-3.5" />
          Back to admin
        </Link>
      </Button>

      <div className="mb-6">
        <h1 className="text-2xl font-bold tracking-tight">All Applicants</h1>
        <p className="text-sm text-muted-foreground">
          {applicants?.length ?? 0} registered applicants
        </p>
      </div>

      <div className="space-y-3">
        {(applicants ?? []).map((a) => {
          const p = nameMap.get(a.user_id) as { full_name: string | null; email: string } | undefined;
          return (
            <Card key={a.id}>
              <CardHeader className="pb-2">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-sm">
                    {p?.full_name ?? p?.email ?? "Unknown"}{" "}
                    <span className="font-mono text-xs text-muted-foreground">
                      ({a.anonymous_id})
                    </span>
                  </CardTitle>
                  <Badge variant={a.is_published ? "default" : "outline"} className="text-xs">
                    {a.is_published ? "Published" : "Draft"}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent>
                <div className="flex flex-wrap gap-1">
                  {a.location_city && (
                    <Badge variant="outline" className="text-xs">
                      {a.location_city}
                    </Badge>
                  )}
                  {(a.software_skills as string[]).slice(0, 5).map((s: string) => (
                    <Badge key={s} variant="secondary" className="text-xs">
                      {s}
                    </Badge>
                  ))}
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
