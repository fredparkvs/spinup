import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import type { JbRole } from "@/lib/jobs/types";

export default async function JobBoardPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/sign-in");

  const admin = createAdminClient();

  const [rolesResult, profileResult] = await Promise.all([
    supabase
      .from("jb_user_roles")
      .select("role")
      .eq("user_id", user.id),
    admin
      .from("profiles")
      .select("platform_role")
      .eq("id", user.id)
      .single(),
  ]);

  const jbRoles: JbRole[] =
    rolesResult.data?.map((r: { role: JbRole }) => r.role) ?? [];
  const platformRole = profileResult.data?.platform_role ?? "entrepreneur";

  if (jbRoles.length === 0 && platformRole !== "admin") {
    redirect("/jobs/onboarding");
  }

  if (platformRole === "admin") {
    redirect("/jobs/admin");
  }

  if (jbRoles.includes("company_member")) {
    redirect("/jobs/applicants");
  }

  redirect("/jobs/preferences");
}
