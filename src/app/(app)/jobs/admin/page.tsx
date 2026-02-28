import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Users, Building2, Send } from "lucide-react";
import Link from "next/link";

export default async function JbAdminPage() {
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

  const [applicantCount, companyCount, outreachCount] = await Promise.all([
    admin.from("jb_applicant_profiles").select("id", { count: "exact", head: true }),
    admin.from("jb_companies").select("id", { count: "exact", head: true }),
    admin.from("jb_outreach").select("id", { count: "exact", head: true }),
  ]);

  const stats = [
    {
      label: "Applicants",
      value: applicantCount.count ?? 0,
      icon: Users,
      href: "/jobs/admin/applicants",
    },
    {
      label: "Companies",
      value: companyCount.count ?? 0,
      icon: Building2,
      href: "/jobs/admin/companies",
    },
    {
      label: "Outreach Sent",
      value: outreachCount.count ?? 0,
      icon: Send,
      href: undefined,
    },
  ];

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold tracking-tight">Job Board Admin</h1>
        <p className="text-sm text-muted-foreground">Overview of the job board</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {stats.map((stat) => {
          const Icon = stat.icon;
          const content = (
            <Card key={stat.label} className={stat.href ? "hover:bg-accent transition-colors" : ""}>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm text-muted-foreground flex items-center gap-2">
                  <Icon className="size-4" />
                  {stat.label}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-3xl font-bold">{stat.value}</p>
              </CardContent>
            </Card>
          );
          return stat.href ? (
            <Link key={stat.label} href={stat.href}>
              {content}
            </Link>
          ) : (
            <div key={stat.label}>{content}</div>
          );
        })}
      </div>
    </div>
  );
}
