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

  // Fetch company info (including how_we_work)
  const { data: company } = await admin
    .from("jb_companies")
    .select("name, what_we_do, how_we_work, website_url, team_linkedin")
    .eq("id", companyId)
    .single();

  if (!company) return { error: "Company not found" };

  // Fetch the sender's email so the applicant can reply directly
  const { data: senderAuth } = await admin.auth.admin.getUserById(user.id);
  const senderEmail = senderAuth?.user?.email ?? "";

  // Fetch applicant's actual email via admin client (bypasses RLS)
  const { data: applicantProfile } = await admin
    .from("jb_applicant_profiles")
    .select("user_id")
    .eq("id", applicantProfileId)
    .single();

  if (!applicantProfile) return { error: "Applicant not found" };

  const { data: applicantAuthProfile } = await admin
    .from("profiles")
    .select("email")
    .eq("id", applicantProfile.user_id)
    .single();

  if (!applicantAuthProfile) return { error: "Profile not found" };

  // Create outreach record
  await admin.from("jb_outreach").insert({
    company_id: companyId,
    applicant_profile_id: applicantProfileId,
    sent_by: user.id,
    message,
  });

  // Build and send email
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const linkedinList = (company.team_linkedin as any[] ?? [])
    .map(
      (l: { name: string; role: string; linkedin_url: string }) =>
        `<li><a href="${l.linkedin_url}" style="color: #3b82f6;">${l.name}</a> — ${l.role}</li>`
    )
    .join("");

  const html = `
    <div style="font-family: system-ui, sans-serif; max-width: 580px; color: #111827;">
      <p>Hi there,</p>
      <p>A company found your profile on <strong>SpinUp Jobs</strong> and would like to connect with you.</p>

      <div style="border: 1px solid #e5e7eb; border-radius: 8px; padding: 20px; margin: 20px 0; background: #f9fafb;">
        <h3 style="margin: 0 0 12px 0; font-size: 18px;">${company.name}</h3>

        ${company.what_we_do ? `
          <p style="margin: 0 0 4px 0; font-size: 12px; font-weight: 600; color: #6b7280; text-transform: uppercase; letter-spacing: 0.05em;">What we do</p>
          <p style="margin: 0 0 16px 0; font-size: 14px; color: #374151;">${company.what_we_do}</p>
        ` : ""}

        ${company.how_we_work ? `
          <p style="margin: 0 0 4px 0; font-size: 12px; font-weight: 600; color: #6b7280; text-transform: uppercase; letter-spacing: 0.05em;">How we work</p>
          <p style="margin: 0 0 16px 0; font-size: 14px; color: #374151;">${company.how_we_work}</p>
        ` : ""}

        ${company.website_url ? `
          <p style="margin: 0 0 4px 0; font-size: 12px; font-weight: 600; color: #6b7280; text-transform: uppercase; letter-spacing: 0.05em;">Website</p>
          <p style="margin: 0 0 16px 0;"><a href="${company.website_url}" style="color: #3b82f6; font-size: 14px;">${company.website_url}</a></p>
        ` : ""}

        ${linkedinList ? `
          <p style="margin: 0 0 4px 0; font-size: 12px; font-weight: 600; color: #6b7280; text-transform: uppercase; letter-spacing: 0.05em;">Team</p>
          <ul style="margin: 0; padding-left: 20px; font-size: 13px; color: #374151; line-height: 1.8;">${linkedinList}</ul>
        ` : ""}
      </div>

      ${message ? `
        <div style="border-left: 3px solid #3b82f6; padding: 12px 16px; margin: 20px 0; background: #eff6ff; border-radius: 0 6px 6px 0;">
          <p style="margin: 0 0 4px 0; font-size: 12px; font-weight: 600; color: #6b7280; text-transform: uppercase; letter-spacing: 0.05em;">Message from ${company.name}</p>
          <p style="margin: 0; font-size: 14px; color: #374151;">${message}</p>
        </div>
      ` : ""}

      <div style="margin: 24px 0; padding: 16px; border: 1px solid #e5e7eb; border-radius: 8px; background: #fff;">
        <p style="margin: 0 0 4px 0; font-size: 13px; font-weight: 600; color: #374151;">Reply directly to:</p>
        <p style="margin: 0; font-size: 14px;">
          <a href="mailto:${senderEmail}" style="color: #3b82f6;">${senderEmail}</a>
        </p>
        <p style="margin: 8px 0 0 0; font-size: 12px; color: #6b7280;">
          We suggest you always respond — even if you&apos;re not interested. A short, polite reply keeps the community healthy and may open unexpected doors.
        </p>
      </div>

      <p style="margin-top: 20px;">
        <a href="mailto:${senderEmail}?subject=Re: SpinUp Jobs — ${encodeURIComponent(company.name)}"
           style="display: inline-block; background: #111827; color: white; padding: 10px 24px; border-radius: 6px; text-decoration: none; font-size: 14px; font-weight: 500;">
          Respond
        </a>
      </p>

      <p style="margin-top: 24px; font-size: 12px; color: #9ca3af; border-top: 1px solid #f3f4f6; padding-top: 16px;">
        This email was sent because you have a published profile on SpinUp Jobs.
        Your identity has not been shared with the company.
      </p>
    </div>
  `;

  await sendEmail({
    to: applicantAuthProfile.email,
    subject: `${company.name} would like to connect with you on SpinUp Jobs`,
    html,
  });

  revalidatePath("/jobs/outreach");
  return { error: null };
}
