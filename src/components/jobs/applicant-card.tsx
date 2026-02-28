import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { MapPin, Calendar, Eye } from "lucide-react";
import { FavouriteButton } from "./favourite-button";
import type { JbApplicantProfile, JbApplicantPreferences } from "@/lib/jobs/types";

const JOB_TYPE_SHORT: Record<string, string> = {
  paid_internship: "Paid Intern",
  unpaid_internship: "Unpaid Intern",
  part_time_contractor: "Part-time",
  full_time_contractor: "Full-time",
  employment: "Employment",
};

const WORK_MODE_SHORT: Record<string, string> = {
  remote: "Remote",
  hybrid: "Hybrid",
  in_person: "In Person",
};

interface Props {
  profile: JbApplicantProfile;
  preferences?: JbApplicantPreferences | null;
  companyId: string;
  isFavourited: boolean;
}

export function ApplicantCard({ profile, preferences, companyId, isFavourited }: Props) {
  return (
    <Card>
      <CardContent className="pt-4 space-y-3">
        <div className="flex items-start justify-between">
          <div>
            <p className="font-mono font-medium text-sm">{profile.anonymous_id}</p>
            {profile.location_city && (
              <p className="text-xs text-muted-foreground flex items-center gap-1 mt-0.5">
                <MapPin className="size-3" />
                {profile.location_city}
                {profile.location_country && `, ${profile.location_country}`}
              </p>
            )}
          </div>
          <FavouriteButton
            companyId={companyId}
            applicantProfileId={profile.id}
            isFavourited={isFavourited}
          />
        </div>

        {/* Skills */}
        {profile.software_skills.length > 0 && (
          <div className="flex flex-wrap gap-1">
            {profile.software_skills.slice(0, 6).map((s) => (
              <Badge key={s} variant="secondary" className="text-xs">
                {s}
              </Badge>
            ))}
            {profile.software_skills.length > 6 && (
              <Badge variant="outline" className="text-xs">
                +{profile.software_skills.length - 6}
              </Badge>
            )}
          </div>
        )}

        {/* Preferences */}
        {preferences && (
          <div className="flex flex-wrap gap-1">
            {preferences.job_types.map((jt) => (
              <Badge key={jt} variant="outline" className="text-xs">
                {JOB_TYPE_SHORT[jt] ?? jt}
              </Badge>
            ))}
            {preferences.work_modes.map((wm) => (
              <Badge key={wm} variant="outline" className="text-xs">
                {WORK_MODE_SHORT[wm] ?? wm}
              </Badge>
            ))}
          </div>
        )}

        {preferences?.available_from && (
          <p className="text-xs text-muted-foreground flex items-center gap-1">
            <Calendar className="size-3" />
            From {preferences.available_from}
            {preferences.available_until && ` to ${preferences.available_until}`}
          </p>
        )}

        <div className="flex justify-end">
          <Button asChild size="sm" variant="outline">
            <Link href={`/jobs/applicants/${profile.id}`}>
              <Eye className="size-3.5" />
              View Profile
            </Link>
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
