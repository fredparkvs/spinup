import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";

const NAV_ITEMS = [
  { href: "/admin/teams", label: "Teams" },
  { href: "/admin/users", label: "Users" },
  { href: "/admin/mentors", label: "Mentors" },
];

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/sign-in");

  const { data: profile } = await supabase.from("profiles").select("platform_role").eq("id", user.id).single();
  if (profile?.platform_role !== "admin") redirect("/dashboard");

  return (
    <div className="p-6 max-w-5xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-xl font-semibold">Admin Panel</h1>
          <p className="text-sm text-muted-foreground">Platform-wide management</p>
        </div>
        <Link href="/dashboard" className="text-sm text-muted-foreground hover:text-foreground">← Back to app</Link>
      </div>
      <nav className="flex gap-1 border-b mb-6">
        {NAV_ITEMS.map((item) => (
          <Link key={item.href} href={item.href} className="px-3 py-2 text-sm font-medium text-muted-foreground hover:text-foreground transition-colors border-b-2 border-transparent hover:border-foreground -mb-px">
            {item.label}
          </Link>
        ))}
      </nav>
      {children}
    </div>
  );
}
