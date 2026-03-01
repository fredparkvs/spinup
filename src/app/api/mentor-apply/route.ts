import { NextRequest, NextResponse } from "next/server";
import { Resend } from "resend";

export async function POST(request: NextRequest) {
  if (!process.env.RESEND_API_KEY) {
    return NextResponse.json(
      { error: "Email service not configured." },
      { status: 503 }
    );
  }

  const resend = new Resend(process.env.RESEND_API_KEY);

  const body = await request.json();
  const { name, email, companies, industries, message } = body;

  if (!name || !email || !companies || !industries) {
    return NextResponse.json({ error: "Missing required fields." }, { status: 400 });
  }

  const { error } = await resend.emails.send({
    from: "SpinUp Mentors <onboarding@resend.dev>",
    to: "fred@parkvs.co.za",
    replyTo: email,
    subject: `Mentor application — ${name}`,
    html: `
      <h2>New mentor application</h2>
      <p><strong>Name:</strong> ${name}</p>
      <p><strong>Email:</strong> ${email}</p>
      <p><strong>Companies:</strong> ${companies}</p>
      <p><strong>Industries:</strong> ${industries}</p>
      ${message ? `<p><strong>Message:</strong><br>${message.replace(/\n/g, "<br>")}</p>` : ""}
    `,
  });

  if (error) {
    return NextResponse.json({ error: "Failed to send email." }, { status: 500 });
  }

  return NextResponse.json({ success: true });
}
