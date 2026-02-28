"use client";

import { useState, useTransition } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Send, Loader2, Check } from "lucide-react";
import { sendOutreach } from "@/app/(app)/jobs/outreach/actions";

interface Props {
  companyId: string;
  applicantProfileId: string;
  anonymousId: string;
}

export function OutreachDialog({ companyId, applicantProfileId, anonymousId }: Props) {
  const [open, setOpen] = useState(false);
  const [message, setMessage] = useState("");
  const [isPending, startTransition] = useTransition();
  const [sent, setSent] = useState(false);

  function handleSend() {
    startTransition(async () => {
      const fd = new FormData();
      fd.set("company_id", companyId);
      fd.set("applicant_profile_id", applicantProfileId);
      fd.set("message", message);
      await sendOutreach(fd);
      setSent(true);
      setTimeout(() => {
        setOpen(false);
        setSent(false);
        setMessage("");
      }, 1500);
    });
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button size="sm">
          <Send className="size-3.5" />
          Reach Out
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Reach out to {anonymousId}</DialogTitle>
          <DialogDescription>
            An email will be sent to this candidate with your company profile and contact
            information. Your identity is only revealed to the candidate, not vice versa.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-3">
          <div>
            <Label className="text-xs">Optional message</Label>
            <Textarea
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder="Tell them why you're interested..."
              rows={4}
              maxLength={1000}
            />
            <p className="text-xs text-muted-foreground mt-1">
              {message.length}/1000 characters
            </p>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => setOpen(false)}>
            Cancel
          </Button>
          <Button onClick={handleSend} disabled={isPending || sent}>
            {isPending ? (
              <>
                <Loader2 className="size-4 animate-spin" />
                Sending…
              </>
            ) : sent ? (
              <>
                <Check className="size-4" />
                Sent
              </>
            ) : (
              <>
                <Send className="size-3.5" />
                Send
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
