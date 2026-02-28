import { redirect } from "next/navigation";
import { fetchJbContext } from "@/lib/jobs/fetch-jb-context";
import { createClient } from "@/lib/supabase/server";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Send } from "lucide-react";

export default async function OutreachHistoryPage() {
  const ctx = await fetchJbContext();

  if (!ctx.companyMembership && ctx.platformRole !== "admin") {
    redirect("/jobs");
  }

  const companyId = ctx.companyMembership?.company_id ?? "";
  const supabase = await createClient();

  const { data: outreaches } = await supabase
    .from("jb_outreach")
    .select("*, jb_applicant_profiles(anonymous_id)")
    .eq("company_id", companyId)
    .order("sent_at", { ascending: false });

  const items = outreaches ?? [];

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold tracking-tight">Outreach History</h1>
        <p className="text-sm text-muted-foreground">
          Messages you&apos;ve sent to candidates
        </p>
      </div>

      {items.length === 0 ? (
        <div className="text-center py-12">
          <Send className="size-8 text-muted-foreground mx-auto mb-3" />
          <p className="text-sm text-muted-foreground">No outreach sent yet.</p>
          <p className="text-xs text-muted-foreground">
            Browse applicants and reach out to candidates you&apos;re interested in.
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {items.map((item) => {
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            const anonId = (item as any).jb_applicant_profiles?.anonymous_id ?? "Unknown";
            return (
              <Card key={item.id}>
                <CardHeader className="pb-2">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-sm font-mono">{anonId}</CardTitle>
                    <Badge
                      variant={item.status === "viewed" ? "secondary" : "outline"}
                      className="text-xs"
                    >
                      {item.status}
                    </Badge>
                  </div>
                  <CardDescription className="text-xs">
                    Sent {new Date(item.sent_at).toLocaleDateString()}
                  </CardDescription>
                </CardHeader>
                {item.message && (
                  <CardContent>
                    <p className="text-sm text-muted-foreground">{item.message}</p>
                  </CardContent>
                )}
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
