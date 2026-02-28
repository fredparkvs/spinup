import { z } from "zod";

export const academicEntrySchema = z.object({
  institution: z.string().min(1, "Institution is required"),
  degree: z.string().min(1, "Degree is required"),
  field: z.string().min(1, "Field of study is required"),
  status: z.enum(["current", "completed"]),
  year_start: z.number().int().min(1990).max(2035),
  year_end: z.number().int().min(1990).max(2035).nullable(),
});

export const workExperienceSchema = z.object({
  company: z.string().min(1, "Company is required"),
  role: z.string().min(1, "Role is required"),
  description: z.string(),
  start_date: z.string(),
  end_date: z.string().nullable(),
  current: z.boolean(),
});

export const linkedInEntrySchema = z.object({
  name: z.string().min(1, "Name is required"),
  role: z.string().min(1, "Role is required"),
  linkedin_url: z.string().url("Must be a valid URL"),
});

export const applicantProfileSchema = z.object({
  academics: z.array(academicEntrySchema),
  software_skills: z.array(z.string()),
  languages: z.array(z.string()),
  location_city: z.string().nullable(),
  location_country: z.string().nullable(),
  willing_to_relocate: z.boolean(),
  work_experience: z.array(workExperienceSchema),
  personality_description: z.string().nullable(),
  looking_for: z.string().nullable(),
});

export const applicantPreferencesSchema = z.object({
  job_types: z.array(
    z.enum([
      "paid_internship",
      "unpaid_internship",
      "part_time_contractor",
      "full_time_contractor",
      "employment",
    ])
  ),
  availability_type: z.enum(["start_date_only", "date_range"]),
  available_from: z.string().nullable(),
  available_until: z.string().nullable(),
  work_modes: z.array(z.enum(["remote", "hybrid", "in_person"])),
});

export const companyProfileSchema = z.object({
  name: z.string().min(1, "Company name is required"),
  what_we_do: z.string().nullable(),
  how_we_work: z.string().nullable(),
  website_url: z.string().url("Must be a valid URL").nullable().or(z.literal("")),
  team_linkedin: z.array(linkedInEntrySchema),
});

export const outreachMessageSchema = z.object({
  applicant_profile_id: z.string().uuid(),
  message: z.string().max(1000).nullable(),
});
