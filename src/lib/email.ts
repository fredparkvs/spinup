/**
 * Send an email via Resend REST API.
 * Requires RESEND_API_KEY and RESEND_FROM_EMAIL env vars.
 */
export async function sendEmail({
  to,
  subject,
  html,
}: {
  to: string;
  subject: string;
  html: string;
}): Promise<{ ok: boolean; error?: string }> {
  const apiKey = process.env.RESEND_API_KEY;
  const from = process.env.RESEND_FROM_EMAIL ?? "SpinUp <noreply@spinupapp.co.za>";

  if (!apiKey) {
    console.warn("RESEND_API_KEY not set — skipping email to", to);
    return { ok: false, error: "RESEND_API_KEY not configured" };
  }

  const res = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ from, to, subject, html }),
  });

  if (!res.ok) {
    const body = await res.text();
    console.error("Resend error:", res.status, body);
    return { ok: false, error: body };
  }

  return { ok: true };
}
