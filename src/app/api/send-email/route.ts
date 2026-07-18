import { NextRequest, NextResponse } from "next/server";
import { Resend } from "resend";
import { getLeadById, claimLeadForSending, updateLead } from "@/lib/db-queries";

export async function POST(req: NextRequest) {
  try {
    const { leadId } = await req.json();

    if (!leadId) {
      return NextResponse.json(
        { error: "leadId is required" },
        { status: 400 }
      );
    }

    const apiKey = process.env.RESEND_API_KEY;
    if (!apiKey) {
      return NextResponse.json(
        { error: "RESEND_API_KEY is not configured. Add it to your environment variables." },
        { status: 500 }
      );
    }

    const lead = await getLeadById(leadId);
    if (!lead) {
      return NextResponse.json({ error: "Lead not found" }, { status: 404 });
    }

    if (!lead.emailAddress) {
      return NextResponse.json(
        { error: "No email address set for this lead" },
        { status: 400 }
      );
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(lead.emailAddress)) {
      return NextResponse.json(
        { error: "Invalid email address" },
        { status: 400 }
      );
    }

    if (!lead.emailSubject || !lead.emailBody) {
      return NextResponse.json(
        { error: "Generate an email first before sending" },
        { status: 400 }
      );
    }

    const claimed = await claimLeadForSending(leadId);
    if (!claimed) {
      return NextResponse.json(
        { error: "Email already sent or currently sending" },
        { status: 409 }
      );
    }

    try {
      const resend = new Resend(apiKey);

      const { data, error } = await resend.emails.send({
        from: "Aliia <hello@aurastudionyc.com>",
        to: [lead.emailAddress],
        subject: lead.emailSubject,
        text: lead.emailBody,
      });

      if (error) {
        await updateLead(leadId, { emailStatus: "draft" });
        return NextResponse.json(
          { error: `Email send failed: ${error.message}` },
          { status: 500 }
        );
      }

      const updatedLead = await updateLead(leadId, {
        emailStatus: "sent",
        emailSentAt: new Date().toISOString(),
        resendMessageId: data?.id ?? undefined,
      });

      return NextResponse.json({ success: true, lead: updatedLead });
    } catch (sendError) {
      await updateLead(leadId, { emailStatus: "draft" });
      throw sendError;
    }
  } catch (err) {
    console.error("Send email failed:", err);
    return NextResponse.json(
      { error: "Failed to send email" },
      { status: 500 }
    );
  }
}
