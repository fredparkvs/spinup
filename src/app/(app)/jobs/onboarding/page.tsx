import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Search, User, ArrowLeft } from "lucide-react";
import Link from "next/link";
import { selectApplicantRole, selectCompanyRole } from "./actions";

export default async function JobBoardOnboardingPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/sign-in");

  // Check if already has roles
  const { data: roles } = await supabase
    .from("jb_user_roles")
    .select("role")
    .eq("user_id", user.id);

  if (roles && roles.length > 0) {
    redirect("/jobs");
  }

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-muted/40 px-4 py-12">
      <div className="mb-8 flex flex-col items-center gap-2">
        <h1 className="text-3xl font-bold tracking-tight">Job Board</h1>
        <p className="text-sm text-muted-foreground">
          How would you like to use the job board?
        </p>
      </div>

      <div className="w-full max-w-lg grid grid-cols-1 sm:grid-cols-2 gap-4">
        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <User className="size-4" />
              I&apos;m looking for opportunities
            </CardTitle>
            <CardDescription>
              Create an anonymous profile and let companies find you
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form action={selectApplicantRole}>
              <Button type="submit" className="w-full">
                Join as Applicant
              </Button>
            </form>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <Search className="size-4" />
              I&apos;m hiring
            </CardTitle>
            <CardDescription>
              Browse anonymous candidates and reach out to talent
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form action={selectCompanyRole}>
              <Button type="submit" variant="outline" className="w-full">
                Join as Company
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>

      <Button asChild variant="ghost" size="sm" className="mt-6">
        <Link href="/dashboard">
          <ArrowLeft className="size-3.5" />
          Back to apps
        </Link>
      </Button>
    </div>
  );
}
