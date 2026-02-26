"use server";

import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";

async function inviteMember(teamId: string, userId: string, formData: FormData) {
  "use server";
  const email = (formData.get("email") as string).trim().toLowerCase();
  if (!email) return;
  const supabase = await createClient();
  await supabase.from("team_invites").upsert({ team_id: teamId, email, role: "entrepreneur", invited_by: userId }, { onConflict: "team_id,email" });
  revalidatePath(`/teams/${teamId}/settings/members`);
}

async function removeMember(teamId: string, memberId: string) {
  "use server";
  const supabase = await createClient();
  await supabase.from("team_members").delete().eq("id", memberId);
  revalidatePath(`/teams/${teamId}/settings/members`);
}

export default async function MembersPage({ params }: { params: Promise<{ teamId: string }> }) {
  const { teamId } = await params;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/sign-in");

  const [membersResult, invitesResult] = await Promise.all([
    supabase.from("team_members").select("id, role, joined_at, profiles(id, full_name, email)").eq("team_id", teamId),
    supabase.from("team_invites").select("id, email, role, accepted, created_at").eq("team_id", teamId).eq("accepted", false),
  ]);

  const members = membersResult.data ?? [];
  const pendingInvites = invitesResult.data ?? [];

  const inviteAction = inviteMember.bind(null, teamId, user.id);

  return (
    <div className="space-y-6 max-w-xl">
      {/* Current members */}
      <div className="space-y-3">
        <h2 className="text-sm font-semibold">Team members</h2>
        {members.map((m) => {
          const profile = m.profiles as { id: string; full_name: string | null; email: string } | null;
          const removeAction = removeMember.bind(null, teamId, m.id);
          return (
            <div key={m.id} className="flex items-center justify-between gap-3 py-2">
              <div>
                <p className="text-sm font-medium">{profile?.full_name ?? profile?.email ?? "Unknown"}</p>
                {profile?.full_name && <p className="text-xs text-muted-foreground">{profile.email}</p>}
              </div>
              <div className="flex items-center gap-2">
                <Badge variant="secondary" className="text-xs capitalize">{m.role}</Badge>
                {profile?.id !== user.id && (
                  <form action={removeAction}>
                    <Button type="submit" variant="ghost" size="sm" className="text-destructive hover:text-destructive">Remove</Button>
                  </form>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {pendingInvites.length > 0 && (
        <>
          <Separator />
          <div className="space-y-2">
            <h2 className="text-sm font-semibold">Pending invites</h2>
            {pendingInvites.map((inv) => (
              <div key={inv.id} className="flex items-center justify-between text-sm py-1">
                <span className="text-muted-foreground">{inv.email}</span>
                <Badge variant="outline" className="text-xs">Pending</Badge>
              </div>
            ))}
          </div>
        </>
      )}

      <Separator />

      {/* Invite form */}
      <div className="space-y-3">
        <h2 className="text-sm font-semibold">Invite a co-founder</h2>
        <form action={inviteAction} className="flex gap-2">
          <div className="flex-1">
            <Label htmlFor="email" className="sr-only">Email address</Label>
            <Input id="email" name="email" type="email" placeholder="co-founder@email.com" required />
          </div>
          <Button type="submit">Send invite</Button>
        </form>
        <p className="text-xs text-muted-foreground">They&apos;ll see the invite when they sign in or sign up.</p>
      </div>
    </div>
  );
}
