import { NextRequest, NextResponse } from "next/server";
import { auditBusinesses } from "@/lib/api";
import { Business } from "@/lib/types";

export async function POST(req: NextRequest) {
  try {
    const { businesses } = (await req.json()) as { businesses: Business[] };

    if (!businesses || !Array.isArray(businesses) || businesses.length === 0) {
      return NextResponse.json(
        { error: "businesses array is required" },
        { status: 400 }
      );
    }

    if (!process.env.ANTHROPIC_API_KEY) {
      return NextResponse.json(
        { error: "ANTHROPIC_API_KEY not configured. Add it to your environment variables." },
        { status: 500 }
      );
    }

    const leads = await auditBusinesses(businesses);
    return NextResponse.json({ leads });
  } catch (error) {
    console.error("Audit error:", error);
    return NextResponse.json(
      { error: "Failed to audit businesses. Please try again." },
      { status: 500 }
    );
  }
}

export const maxDuration = 120;
