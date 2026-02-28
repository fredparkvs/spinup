"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { sendEmail } from "@/lib/email";

export async function sendOutreach(formData: FormData) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/sign-in");

  const companyId = formData.get("company_id") as string;
  const applicantProfileId = formData.get("applicant_profile_id") as string;
  const message = (formData.get("message") as string) || null;

  // Verify company membership
  const { data: membership } = await supabase
    .from("jb_company_members")
    .select("id")
    .eq("company_id", companyId)
    .eq("user_id", user.id)
    .maybeSingle();

  if (!membership) return { error: "Not a member of this company" };

  const admin = createAdminClient();

  // Fetch company info
  const { data: company } = await admin
    .from("jb_companies")
    .select("name, what_we_do, website_url, team_linkedin")
    .eq("id", companyId)
    .single();

  if (!company) return { error: "Company not found" };

  // Fetch applicant's actual email via admin client (bypasses RLS)
  const { data: applicantProfile } = await admin
    .from("jb_applicant_profiles")
    .select("user_id")
    .eq("id", applicantProfileId)
    .single();

  if (!applicantProfile) return { error: "Applicant not found" };

  const { data: profile } = await admin
    .from("profiles")
    .select("email")
    .eq("id", applicantProfile.user_id)
    .single();

  if (!profile) return { error: "Profile not found" };

  // Create outreach record
  await admin.from("jb_outreach").insert({
    company_id: companyId,
    applicant_profile_id: applicantProfileId,
    sent_by: user.id,
    message,
  });

  // Build and send email
  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL ?? "https://spinupapp.co.za";
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const linkedinList = (company.team_linkedin as any[] ?? [])
    .map(
      (l: { name: string; role: string; linkedin_url: string }) =>
        `<li><a href="${l.linkedin_url}">${l.name}</a> — ${l.role}</li>`
    )
    .join("");

  const html = `
    <div style="font-family: system-ui, sans-serif; max-width: 560px;">
      <p>Hi there,</p>
      <p>A company is interested in connecting with you on <strong>SpinUp Jobs</strong>.</p>

      <div style="border: 1px solid #e5e7eb; border-radius: 8px; padding: 16px; margin: 16px 0;">
        <h3 style="margin: 0 0 8px 0;">${company.name}</h3>
        ${company.what_we_do ? `<p style="margin: 0 0 8px 0; color: #6b7280; font-size: 14px;">${company.what_we_do}</p>` : ""}
        ${company.website_url ? `<p style="margin: 0 0 8px 0;"><a href="${company.website_url}">${company.website_url}</a></p>` : ""}
        ${linkedinList ? `<p style="margin: 8px 0 4px 0; font-size: 13px; font-weight: 600;">Team:</p><ul style="margin: 0; padding-left: 20px; font-size: 13px;">${linkedinList}</ul>` : ""}
      </div>

      ${message ? `<div style="border-left: 3px solid #3b82f6; padding-left: 12px; margin: 16px 0;"><p style="margin: 0; font-size: 14px; color: #374151;">${message}</p></div>` : ""}

      <p style="margin-top: 24px;">
        <a href="${baseUrl}/jobs" style="display: inline-block; background: #111827; color: white; padding: 10px 20px; border-radius: 6px; text-decoration: none; font-size: 14px;">
          View on SpinUp
        </a>
      </p>

      <p style="margin-top: 24px; font-size: 12px; color: #9ca3af;">
        This email was sent because you have a profile on SpinUp Jobs.
        If you have questions, reply to this email.
      </p>
    </div>
  `;

  await sendEmail({
    to: profile.email,
    subject: `A company is interested in connecting with you on SpinUp Jobs`,
    html,
  });

  revalidatePath("/jobs/outreach");
  return { error: null };
}
