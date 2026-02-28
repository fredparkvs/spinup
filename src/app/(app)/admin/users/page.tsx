import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import type { PlatformRole } from "@/lib/types/database";

async function updateRole(userId: string, role: PlatformRole) {
  "use server";
  const supabase = await createClient();
  await supabase.from("profiles").update({ platform_role: role }).eq("id", userId);
  revalidatePath("/admin/users");
}

const ROLE_VARIANTS: Record<PlatformRole, "default" | "secondary" | "outline"> = {
  admin: "default",
  mentor: "outline",
  entrepreneur: "secondary",
};

export default async function AdminUsersPage() {
  const supabase = await createClient();

  const { data: profiles } = await supabase
    .from("profiles")
    .select("id, full_name, email, platform_role, created_at, onboarding_completed")
    .order("created_at", { ascending: false });

  return (
    <div className="space-y-4">
      <p className="text-sm text-muted-foreground">{profiles?.length ?? 0} registered users</p>
      <div className="rounded-lg border overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-muted/50">
            <tr>
              <th className="text-left py-2 px-4 font-medium">User</th>
              <th className="text-left py-2 px-4 font-medium">Role</th>
              <th className="text-left py-2 px-4 font-medium">Onboarded</th>
              <th className="text-left py-2 px-4 font-medium">Joined</th>
              <th className="text-left py-2 px-4 font-medium">Change role</th>
            </tr>
          </thead>
          <tbody>
            {(profiles ?? []).map((p, idx) => (
              <tr key={p.id} className={`border-t ${idx % 2 === 0 ? "" : "bg-muted/20"}`}>
                <td className="py-2.5 px-4">
                  <p className="font-medium">{p.full_name ?? "—"}</p>
                  <p className="text-xs text-muted-foreground">{p.email}</p>
                </td>
                <td className="py-2.5 px-4">
                  <Badge variant={ROLE_VARIANTS[p.platform_role]} className="text-xs capitalize">{p.platform_role}</Badge>
                </td>
                <td className="py-2.5 px-4 text-muted-foreground">{p.onboarding_completed ? "Yes" : "No"}</td>
                <td className="py-2.5 px-4 text-xs text-muted-foreground">{new Date(p.created_at).toLocaleDateString("en-ZA")}</td>
                <td className="py-2.5 px-4">
                  <div className="flex gap-1">
                    {(["admin", "mentor", "entrepreneur"] as PlatformRole[]).filter((r) => r !== p.platform_role).map((role) => {
                      const action = updateRole.bind(null, p.id, role);
                      return (
                        <form key={role} action={action}>
                          <Button type="submit" variant="outline" size="sm" className="text-xs h-7 px-2 capitalize">{role}</Button>
                        </form>
                      );
                    })}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {(profiles?.length ?? 0) === 0 && (
          <div className="p-8 text-center text-sm text-muted-foreground">No users yet.</div>
        )}
      </div>
    </div>
  );
}
