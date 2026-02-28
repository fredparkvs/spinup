"use client";

import { useFormStatus } from "react-dom";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { PasswordInput } from "@/components/ui/password-input";
import { Loader2 } from "lucide-react";

function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" className="w-full" disabled={pending}>
      {pending ? (
        <>
          <Loader2 className="size-4 animate-spin" />
          Creating account…
        </>
      ) : (
        "Sign up"
      )}
    </Button>
  );
}

export function SignUpForm({
  action,
  error,
  app,
}: {
  action: (formData: FormData) => Promise<void>;
  error?: string;
  app?: string;
}) {
  return (
    <form action={action} className="flex flex-col gap-4">
      {app && <input type="hidden" name="app" value={app} />}
      {error && (
        <div className="rounded-md bg-destructive/10 px-3 py-2 text-sm text-destructive">
          {error}
        </div>
      )}

      <div className="flex flex-col gap-2">
        <Label htmlFor="full_name">Full name</Label>
        <Input
          id="full_name"
          name="full_name"
          type="text"
          placeholder="Jane Doe"
          required
        />
      </div>

      <div className="flex flex-col gap-2">
        <Label htmlFor="email">Email</Label>
        <Input
          id="email"
          name="email"
          type="email"
          placeholder="you@example.com"
          required
        />
      </div>

      <div className="flex flex-col gap-2">
        <Label htmlFor="password">Password</Label>
        <PasswordInput
          id="password"
          name="password"
          placeholder="At least 6 characters"
          minLength={6}
          required
        />
      </div>

      <SubmitButton />
    </form>
  );
}
