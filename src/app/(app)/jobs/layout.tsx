import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { JobBoardSidebar } from "@/components/jobs/job-board-sidebar";
import type { JbRole } from "@/lib/jobs/types";

export default async function JobBoardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
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

  // If user has no JB roles and isn't admin, they need onboarding
  // But allow the onboarding page itself to render
  if (jbRoles.length === 0 && platformRole !== "admin") {
    // Let the onboarding page through
    return <>{children}</>;
  }

  return (
    <div className="flex h-screen">
      <JobBoardSidebar jbRoles={jbRoles} platformRole={platformRole} />
      <main className="flex-1 overflow-y-auto">
        <div className="mx-auto max-w-4xl px-4 py-8 md:px-8">
          {children}
        </div>
      </main>
    </div>
  );
}
