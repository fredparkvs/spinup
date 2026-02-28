"use client";

import { useTransition } from "react";
import { Button } from "@/components/ui/button";
import { Heart } from "lucide-react";
import { cn } from "@/lib/utils";
import { toggleFavourite } from "@/app/(app)/jobs/applicants/actions";

interface Props {
  companyId: string;
  applicantProfileId: string;
  isFavourited: boolean;
}

export function FavouriteButton({ companyId, applicantProfileId, isFavourited }: Props) {
  const [isPending, startTransition] = useTransition();

  function handleToggle() {
    startTransition(async () => {
      const fd = new FormData();
      fd.set("company_id", companyId);
      fd.set("applicant_profile_id", applicantProfileId);
      fd.set("action", isFavourited ? "remove" : "add");
      await toggleFavourite(fd);
    });
  }

  return (
    <Button
      variant="ghost"
      size="icon-sm"
      onClick={handleToggle}
      disabled={isPending}
      className={cn(isFavourited && "text-red-500")}
    >
      <Heart className={cn("size-4", isFavourited && "fill-current")} />
    </Button>
  );
}
