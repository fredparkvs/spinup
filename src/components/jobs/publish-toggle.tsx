"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Loader2, Eye, EyeOff } from "lucide-react";
import { togglePublish } from "@/app/(app)/jobs/profile/actions";

interface Props {
  profileId: string;
  isPublished: boolean;
}

export function PublishToggle({ profileId, isPublished }: Props) {
  const [isPending, startTransition] = useTransition();
  const router = useRouter();

  function handleToggle() {
    startTransition(async () => {
      const fd = new FormData();
      fd.set("profile_id", profileId);
      fd.set("is_published", (!isPublished).toString());
      await togglePublish(fd);
      router.refresh();
    });
  }

  return (
    <Button
      onClick={handleToggle}
      disabled={isPending}
      variant={isPublished ? "outline" : "default"}
      size="sm"
    >
      {isPending ? (
        <Loader2 className="size-4 animate-spin" />
      ) : isPublished ? (
        <>
          <EyeOff className="size-3.5" />
          Unpublish
        </>
      ) : (
        <>
          <Eye className="size-3.5" />
          Publish Profile
        </>
      )}
    </Button>
  );
}
