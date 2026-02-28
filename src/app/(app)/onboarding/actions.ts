"use server";

import { createClient } from "@/lib/supabase/server";

export async function completeOnboarding(userId: string) {
  const supabase = await createClient();

  const { error } = await supabase
    .from("profiles")
    .update({ onboarding_completed: true })
    .eq("id", userId);

  if (error) {
    throw new Error("Failed to complete onboarding: " + error.message);
  }
}
