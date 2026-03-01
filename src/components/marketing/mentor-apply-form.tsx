"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Loader2, CheckCircle2 } from "lucide-react";

export function MentorApplyForm() {
  const [form, setForm] = useState({
    name: "",
    email: "",
    companies: "",
    industries: "",
    message: "",
  });
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function handleChange(
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) {
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    setError(null);

    const res = await fetch("/api/mentor-apply", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form),
    });

    const json = await res.json();

    if (!res.ok) {
      setError(json.error ?? "Something went wrong. Please try again.");
      setSubmitting(false);
      return;
    }

    setSubmitted(true);
    setSubmitting(false);
  }

  if (submitted) {
    return (
      <div className="rounded-xl border bg-muted/30 p-8 text-center space-y-3">
        <CheckCircle2 className="size-8 text-green-600 mx-auto" />
        <p className="font-semibold">Application received</p>
        <p className="text-sm text-muted-foreground">
          Thank you. Fred will be in touch shortly.
        </p>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-1.5">
          <Label htmlFor="name">Full name *</Label>
          <Input
            id="name"
            name="name"
            placeholder="Jane Smith"
            value={form.name}
            onChange={handleChange}
            required
          />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="email">Email address *</Label>
          <Input
            id="email"
            name="email"
            type="email"
            placeholder="jane@example.com"
            value={form.email}
            onChange={handleChange}
            required
          />
        </div>
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="companies">Companies you have founded or worked in *</Label>
        <Input
          id="companies"
          name="companies"
          placeholder="e.g. Custos Media Technologies, VoxCroft Analytics"
          value={form.companies}
          onChange={handleChange}
          required
        />
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="industries">Industries and sectors *</Label>
        <Input
          id="industries"
          name="industries"
          placeholder="e.g. Blockchain, AI, SaaS, B2B, Medtech"
          value={form.industries}
          onChange={handleChange}
          required
        />
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="message">What can you offer as a mentor?</Label>
        <Textarea
          id="message"
          name="message"
          placeholder="Briefly describe your experience with spinouts or early-stage companies, and what you would bring to a founder relationship."
          value={form.message}
          onChange={handleChange}
          rows={4}
        />
      </div>

      {error && (
        <p className="text-sm text-destructive">{error}</p>
      )}

      <Button type="submit" disabled={submitting}>
        {submitting && <Loader2 className="size-4 animate-spin" />}
        Submit Application
      </Button>
    </form>
  );
}
