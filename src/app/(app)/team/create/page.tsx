import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";

export default async function CreateTeamPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const params = await searchParams;

  async function createTeam(formData: FormData) {
    "use server";

    const name = formData.get("name") as string;
    const institution = (formData.get("institution") as string) || null;

    if (!name || !name.trim()) {
      redirect("/team/create?error=Team name is required");
    }

    const supabase = await createClient();

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      redirect("/sign-in");
    }

    // Create the team
    const { data: team, error: teamError } = await supabase
      .from("teams")
      .insert({ name: name.trim(), institution: institution?.trim() || null })
      .select("id")
      .single();

    if (teamError || !team) {
      redirect(
        `/team/create?error=${encodeURIComponent(teamError?.message || "Failed to create team")}`
      );
    }

    // Create team_member record linking user as entrepreneur
    const { error: memberError } = await supabase
      .from("team_members")
      .insert({ team_id: team.id, user_id: user.id, role: "entrepreneur" });

    if (memberError) {
      redirect(
        `/team/create?error=${encodeURIComponent(memberError.message)}`
      );
    }

    // Seed the funding tracker for the new team
    await supabase.rpc("seed_funding_tracker", { p_team_id: team.id });

    redirect(`/teams/${team.id}/tools/company-name`);
  }

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-muted/40 px-4 py-12">
      <div className="mb-8 flex flex-col items-center gap-2">
        <h1 className="text-3xl font-bold tracking-tight">SpinUp</h1>
        <p className="text-sm text-muted-foreground">
          Create your team to get started
        </p>
      </div>
      <div className="w-full max-w-md">
        <Card>
          <CardHeader>
            <CardTitle className="text-xl">Create a team</CardTitle>
            <CardDescription>
              Set up your startup team. You can invite members later.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form action={createTeam} className="flex flex-col gap-4">
              {params.error && (
                <div className="rounded-md bg-destructive/10 px-3 py-2 text-sm text-destructive">
                  {params.error}
                </div>
              )}

              <div className="flex flex-col gap-2">
                <Label htmlFor="name">Team name</Label>
                <Input
                  id="name"
                  name="name"
                  type="text"
                  placeholder="My Startup"
                  required
                />
              </div>

              <div className="flex flex-col gap-2">
                <Label htmlFor="institution">Institution (optional)</Label>
                <Input
                  id="institution"
                  name="institution"
                  type="text"
                  placeholder="e.g. UCT, Wits, Stellenbosch"
                />
              </div>

              <Button type="submit" className="w-full">
                Create Team
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
