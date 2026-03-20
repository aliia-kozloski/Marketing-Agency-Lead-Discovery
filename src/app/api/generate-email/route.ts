import { NextRequest, NextResponse } from "next/server";
import Anthropic from "@anthropic-ai/sdk";
import { getLeadById } from "@/lib/db-queries";

export const maxDuration = 60;

export async function POST(req: NextRequest) {
  try {
    const { leadId } = await req.json();

    if (!leadId) {
      return NextResponse.json(
        { error: "leadId is required" },
        { status: 400 }
      );
    }

    const lead = getLeadById(leadId);
    if (!lead) {
      return NextResponse.json({ error: "Lead not found" }, { status: 404 });
    }

    const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

    const prompt = `
You are writing a personalized cold outreach email for Aliia, the founder of a design-led AI visibility agency in NYC.

ABOUT ALIIA'S AGENCY:
- Agency: Aliia (AI Visibility for Wellness & Beauty)
- We design brands that humans love and AI recommends
- Services: Brand Presence Audit ($500-$1,000), Website Design & Build ($3,000-$8,000), AI Visibility Monitoring ($1,500/mo), Full AI Growth Retainer ($2,500-$3,000/mo)
- Currently accepting 3 founding clients for April 2026 with special founding pricing
- Website: marketing-agency-beta-flax.vercel.app

TARGET BUSINESS:
- Name: ${lead.name}
- Category: ${lead.category}
- Neighborhood: ${lead.neighborhood}
- AI Visibility Score: ${lead.aiScore}/10 (lower = less visible to AI)
- Lead Category: ${lead.leadCategory}
- What ChatGPT says about them: ${lead.chatGPTResponse}
- Top Gap: ${lead.topGap}
- Quick Win: ${lead.quickWin}
- Score Reason: ${lead.scoreReason}
- Website: ${lead.website || "Not found"}
- Google Rating: ${lead.googleRating || "Unknown"}

INSTRUCTIONS:
Write a personalized cold email that:
1. Opens with something specific about their business (not generic)
2. Mentions what happens when you ask ChatGPT about ${lead.category} in ${lead.neighborhood} — do they show up?
3. References their specific AI visibility gap
4. Suggests one quick win they could implement
5. Pitches the Brand Presence Audit as a low-commitment starting point
6. Mentions the founding client offer briefly
7. Tone: warm, professional, one business owner to another — NOT salesy or jargon-heavy
8. Keep it under 200 words
9. Sign off as "Aliia"

Return ONLY a JSON object with this exact structure:
{
  "subject": "Email subject line",
  "body": "Full email body text (use \\n for line breaks)"
}
Return ONLY the JSON, no explanation, no markdown, no backticks.
`;

    const response = await client.messages.create({
      model: "claude-sonnet-4-20250514",
      max_tokens: 1024,
      messages: [{ role: "user", content: prompt }],
    });

    let text =
      response.content[0].type === "text"
        ? response.content[0].text.trim()
        : "";

    // Strip markdown code fences if present
    text = text.replace(/^```(?:json)?\s*\n?/i, "").replace(/\n?```\s*$/, "");

    let email;
    try {
      email = JSON.parse(text);
    } catch {
      console.error("Failed to parse email JSON:", text.substring(0, 200));
      return NextResponse.json(
        { error: "Failed to parse generated email. Please try again." },
        { status: 500 }
      );
    }

    if (!email.subject || !email.body) {
      return NextResponse.json(
        { error: "Generated email is missing subject or body. Please try again." },
        { status: 500 }
      );
    }

    return NextResponse.json({
      subject: email.subject,
      body: email.body,
    });
  } catch (err) {
    console.error("Email generation failed:", err);
    return NextResponse.json(
      { error: "Failed to generate email" },
      { status: 500 }
    );
  }
}
