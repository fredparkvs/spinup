import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";

const NAV_ITEMS = [
  { href: "", label: "Team" },
  { href: "/members", label: "Members" },
  { href: "/trello", label: "Trello" },
  { href: "/exports", label: "Exports" },
];

export default async function SettingsLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ teamId: string }>;
}) {
  const { teamId } = await params;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/sign-in");

  // Only entrepreneurs can access settings (not mentors)
  const { data: member } = await supabase.from("team_members").select("role").eq("team_id", teamId).eq("user_id", user.id).single();
  const { data: profile } = await supabase.from("profiles").select("platform_role").eq("id", user.id).single();
  if (member?.role === "mentor" && profile?.platform_role !== "admin") redirect(`/teams/${teamId}`);

  return (
    <div className="p-6 max-w-3xl mx-auto">
      <h1 className="text-xl font-semibold mb-1">Team Settings</h1>
      <p className="text-sm text-muted-foreground mb-6">Manage your team, members, and integrations.</p>
      <nav className="flex gap-1 border-b mb-6">
        {NAV_ITEMS.map((item) => (
          <Link
            key={item.href}
            href={`/teams/${teamId}/settings${item.href}`}
            className="px-3 py-2 text-sm font-medium text-muted-foreground hover:text-foreground transition-colors border-b-2 border-transparent hover:border-foreground -mb-px"
          >
            {item.label}
          </Link>
        ))}
      </nav>
      {children}
    </div>
  );
}
