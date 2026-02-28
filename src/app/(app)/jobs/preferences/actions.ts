"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";

export async function savePreferences(formData: FormData) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/sign-in");

  const profileId = formData.get("profile_id") as string;
  const data = JSON.parse(formData.get("data") as string);

  const admin = createAdminClient();

  // Upsert preferences
  await admin
    .from("jb_applicant_preferences")
    .upsert(
      {
        applicant_profile_id: profileId,
        job_types: data.job_types,
        availability_type: data.availability_type,
        available_from: data.available_from || null,
        available_until: data.available_until || null,
        work_modes: data.work_modes,
      },
      { onConflict: "applicant_profile_id" }
    );

  revalidatePath("/jobs/preferences");
  return { error: null };
}
