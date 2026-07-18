import { NextRequest, NextResponse } from "next/server";
import { getLeads, insertLead, getOutreachStats } from "@/lib/db-queries";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const emailStatus = searchParams.get("emailStatus") || undefined;
    const neighborhood = searchParams.get("neighborhood") || undefined;
    const category = searchParams.get("category") || undefined;
    const statsOnly = searchParams.get("statsOnly");

    if (statsOnly === "true") {
      const stats = await getOutreachStats();
      return NextResponse.json({ stats });
    }

    const leads = await getLeads({ emailStatus, neighborhood, category });
    const stats = await getOutreachStats();
    return NextResponse.json({ leads, stats });
  } catch (err) {
    console.error("Failed to fetch leads:", err);
    return NextResponse.json(
      { error: "Failed to fetch leads" },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    const lead = await req.json();

    if (!lead.name) {
      return NextResponse.json(
        { error: "Lead name is required" },
        { status: 400 }
      );
    }

    const saved = await insertLead(lead);

    if (!saved) {
      return NextResponse.json(
        { error: "Lead already saved", duplicate: true },
        { status: 409 }
      );
    }

    return NextResponse.json({ lead: saved }, { status: 201 });
  } catch (err) {
    console.error("Failed to save lead:", err);
    return NextResponse.json(
      { error: "Failed to save lead" },
      { status: 500 }
    );
  }
}
