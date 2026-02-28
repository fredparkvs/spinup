import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { MapPin, Calendar, GraduationCap, Briefcase } from "lucide-react";
import type { JbApplicantProfile, JbApplicantPreferences, AcademicEntry, WorkExperienceEntry } from "@/lib/jobs/types";

const JOB_TYPE_LABELS: Record<string, string> = {
  paid_internship: "Paid Internship",
  unpaid_internship: "Unpaid Internship",
  part_time_contractor: "Part-time Contractor",
  full_time_contractor: "Full-time Contractor",
  employment: "Employment",
};

const WORK_MODE_LABELS: Record<string, string> = {
  remote: "Remote",
  hybrid: "Hybrid",
  in_person: "In Person",
};

interface Props {
  profile: JbApplicantProfile;
  preferences?: JbApplicantPreferences | null;
  actions?: React.ReactNode;
}

export function ApplicantDetail({ profile, preferences, actions }: Props) {
  const academics = profile.academics as AcademicEntry[];
  const experience = profile.work_experience as WorkExperienceEntry[];

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between">
        <div>
          <h2 className="text-xl font-bold font-mono">{profile.anonymous_id}</h2>
          {profile.location_city && (
            <p className="text-sm text-muted-foreground flex items-center gap-1 mt-1">
              <MapPin className="size-3.5" />
              {profile.location_city}
              {profile.location_country && `, ${profile.location_country}`}
              {profile.willing_to_relocate && " (willing to relocate)"}
            </p>
          )}
        </div>
        {actions && <div className="flex items-center gap-2">{actions}</div>}
      </div>

      {/* Skills & Languages */}
      <div className="flex flex-wrap gap-4">
        {profile.software_skills.length > 0 && (
          <div>
            <p className="text-xs font-medium text-muted-foreground mb-1">Skills</p>
            <div className="flex flex-wrap gap-1">
              {profile.software_skills.map((s) => (
                <Badge key={s} variant="secondary" className="text-xs">
                  {s}
                </Badge>
              ))}
            </div>
          </div>
        )}
        {profile.languages.length > 0 && (
          <div>
            <p className="text-xs font-medium text-muted-foreground mb-1">Languages</p>
            <div className="flex flex-wrap gap-1">
              {profile.languages.map((l) => (
                <Badge key={l} variant="outline" className="text-xs">
                  {l}
                </Badge>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Preferences */}
      {preferences && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Looking for</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {preferences.job_types.length > 0 && (
              <div className="flex flex-wrap gap-1">
                {preferences.job_types.map((jt) => (
                  <Badge key={jt} className="text-xs">
                    {JOB_TYPE_LABELS[jt] ?? jt}
                  </Badge>
                ))}
              </div>
            )}
            {preferences.work_modes.length > 0 && (
              <div className="flex flex-wrap gap-1">
                {preferences.work_modes.map((wm) => (
                  <Badge key={wm} variant="outline" className="text-xs">
                    {WORK_MODE_LABELS[wm] ?? wm}
                  </Badge>
                ))}
              </div>
            )}
            {preferences.available_from && (
              <p className="text-sm text-muted-foreground flex items-center gap-1">
                <Calendar className="size-3.5" />
                Available from {preferences.available_from}
                {preferences.available_until && ` to ${preferences.available_until}`}
              </p>
            )}
          </CardContent>
        </Card>
      )}

      {/* Academics */}
      {academics.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <GraduationCap className="size-4" />
              Academics
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {academics.map((a, i) => (
              <div key={i}>
                <p className="text-sm font-medium">
                  {a.degree} in {a.field}
                </p>
                <p className="text-xs text-muted-foreground">
                  {a.institution} — {a.year_start}
                  {a.status === "completed" && a.year_end ? `–${a.year_end}` : " (current)"}
                </p>
              </div>
            ))}
          </CardContent>
        </Card>
      )}

      {/* Work Experience */}
      {experience.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <Briefcase className="size-4" />
              Work Experience
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {experience.map((e, i) => (
              <div key={i}>
                <p className="text-sm font-medium">{e.role}</p>
                <p className="text-xs text-muted-foreground">{e.company}</p>
                {e.description && (
                  <p className="text-sm text-muted-foreground mt-1">{e.description}</p>
                )}
              </div>
            ))}
          </CardContent>
        </Card>
      )}

      <Separator />

      {/* About */}
      {(profile.personality_description || profile.looking_for) && (
        <div className="space-y-4">
          {profile.personality_description && (
            <div>
              <p className="text-sm font-medium mb-1">Personality</p>
              <p className="text-sm text-muted-foreground">{profile.personality_description}</p>
            </div>
          )}
          {profile.looking_for && (
            <div>
              <p className="text-sm font-medium mb-1">What I&apos;m looking for</p>
              <p className="text-sm text-muted-foreground">{profile.looking_for}</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
