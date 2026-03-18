import { NextRequest, NextResponse } from "next/server";
import { discoverBusinesses } from "@/lib/api";

export async function POST(req: NextRequest) {
  try {
    const { category, neighborhood } = await req.json();

    if (!category || !neighborhood) {
      return NextResponse.json(
        { error: "category and neighborhood are required" },
        { status: 400 }
      );
    }

    if (!process.env.ANTHROPIC_API_KEY) {
      return NextResponse.json(
        { error: "ANTHROPIC_API_KEY not configured. Add it to your environment variables." },
        { status: 500 }
      );
    }

    const businesses = await discoverBusinesses(category, neighborhood);
    return NextResponse.json({ businesses });
  } catch (error) {
    console.error("Discovery error:", error);
    return NextResponse.json(
      { error: "Failed to discover businesses. Please try again." },
      { status: 500 }
    );
  }
}

export const maxDuration = 60;
