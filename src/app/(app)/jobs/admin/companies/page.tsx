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
import { ArrowLeft, Globe } from "lucide-react";
import Link from "next/link";

export default async function JbAdminCompaniesPage() {
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

  const { data: companies } = await admin
    .from("jb_companies")
    .select("id, name, what_we_do, website_url, is_verified, created_at")
    .order("created_at", { ascending: false });

  return (
    <div>
      <Button asChild variant="ghost" size="sm" className="mb-4">
        <Link href="/jobs/admin">
          <ArrowLeft className="size-3.5" />
          Back to admin
        </Link>
      </Button>

      <div className="mb-6">
        <h1 className="text-2xl font-bold tracking-tight">All Companies</h1>
        <p className="text-sm text-muted-foreground">
          {companies?.length ?? 0} registered companies
        </p>
      </div>

      <div className="space-y-3">
        {(companies ?? []).map((c) => (
          <Card key={c.id}>
            <CardHeader className="pb-2">
              <div className="flex items-center justify-between">
                <CardTitle className="text-sm flex items-center gap-2">
                  {c.name}
                  {c.website_url && (
                    <a
                      href={c.website_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-muted-foreground hover:text-foreground"
                    >
                      <Globe className="size-3.5" />
                    </a>
                  )}
                </CardTitle>
                <Badge
                  variant={c.is_verified ? "default" : "outline"}
                  className="text-xs"
                >
                  {c.is_verified ? "Verified" : "Unverified"}
                </Badge>
              </div>
            </CardHeader>
            {c.what_we_do && (
              <CardContent>
                <p className="text-sm text-muted-foreground line-clamp-2">
                  {c.what_we_do}
                </p>
              </CardContent>
            )}
          </Card>
        ))}
      </div>
    </div>
  );
}
