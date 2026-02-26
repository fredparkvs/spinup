"use server";

import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

async function updateTeam(teamId: string, formData: FormData) {
  "use server";
  const supabase = await createClient();
  const name = formData.get("name") as string;
  const institution = formData.get("institution") as string;
  await supabase.from("teams").update({ name, institution: institution || null, updated_at: new Date().toISOString() }).eq("id", teamId);
  revalidatePath(`/teams/${teamId}/settings`);
}

export default async function TeamSettingsPage({ params }: { params: Promise<{ teamId: string }> }) {
  const { teamId } = await params;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/sign-in");

  const { data: team } = await supabase.from("teams").select("name, institution, operating_name").eq("id", teamId).single();
  if (!team) redirect("/dashboard");

  const updateAction = updateTeam.bind(null, teamId);

  return (
    <div className="space-y-6 max-w-md">
      <form action={updateAction} className="space-y-4">
        <div className="space-y-1.5">
          <Label htmlFor="name">Team name</Label>
          <Input id="name" name="name" defaultValue={team.name} required />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="institution">Institution <span className="text-muted-foreground font-normal">(optional)</span></Label>
          <Input id="institution" name="institution" defaultValue={team.institution ?? ""} placeholder="e.g. University of Cape Town" />
        </div>
        {team.operating_name && (
          <div className="space-y-1.5">
            <Label>Operating name</Label>
            <p className="text-sm text-muted-foreground">{team.operating_name} — set via the Company Name tool.</p>
          </div>
        )}
        <Button type="submit">Save changes</Button>
      </form>
    </div>
  );
}
