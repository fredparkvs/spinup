import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { MailCheck } from "lucide-react";
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { SignUpForm } from "./sign-up-form";

export default async function SignUpPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string; email?: string }>;
}) {
  const params = await searchParams;

  async function signUp(formData: FormData) {
    "use server";

    const fullName = formData.get("full_name") as string;
    const email = formData.get("email") as string;
    const password = formData.get("password") as string;

    if (!fullName || !email || !password) {
      redirect("/sign-up?error=Please fill in all fields");
    }

    if (password.length < 6) {
      redirect("/sign-up?error=Password must be at least 6 characters");
    }

    const supabase = await createClient();

    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: { data: { full_name: fullName } },
    });

    if (error) {
      redirect(`/sign-up?error=${encodeURIComponent(error.message)}`);
    }

    redirect(`/sign-up?email=${encodeURIComponent(email)}`);
  }

  // Success state — show when email param is present
  if (params.email) {
    return (
      <Card className="animate-in fade-in slide-in-from-bottom-4 duration-500">
        <CardHeader className="items-center text-center pb-2">
          <div className="mb-3 flex size-16 items-center justify-center rounded-full bg-primary/10">
            <MailCheck className="size-8 text-primary" />
          </div>
          <CardTitle className="text-xl">Check your inbox</CardTitle>
          <CardDescription>
            We sent a confirmation link to{" "}
            <span className="font-medium text-foreground">{params.email}</span>
          </CardDescription>
        </CardHeader>
        <CardContent className="text-center space-y-2">
          <p className="text-sm text-muted-foreground">
            Click the link in the email to activate your account, then sign in.
          </p>
          <p className="text-xs text-muted-foreground">
            Can&apos;t find it? Check your spam or junk folder.
          </p>
        </CardContent>
        <CardFooter className="justify-center">
          <Link
            href="/sign-in"
            className="text-sm text-primary underline-offset-4 hover:underline"
          >
            Back to sign in
          </Link>
        </CardFooter>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-xl">Create an account</CardTitle>
        <CardDescription>
          Enter your details to get started with SpinUp
        </CardDescription>
      </CardHeader>
      <CardContent>
        <SignUpForm action={signUp} error={params.error} />
      </CardContent>
      <CardFooter className="justify-center">
        <p className="text-sm text-muted-foreground">
          Already have an account?{" "}
          <Link
            href="/sign-in"
            className="text-primary underline-offset-4 hover:underline"
          >
            Sign in
          </Link>
        </p>
      </CardFooter>
    </Card>
  );
}
