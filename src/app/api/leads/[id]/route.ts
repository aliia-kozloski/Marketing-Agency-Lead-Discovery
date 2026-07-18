import { NextRequest, NextResponse } from "next/server";
import { getLeadById, updateLead, deleteLead } from "@/lib/db-queries";

export async function GET(
  _req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const lead = await getLeadById(Number(params.id));
    if (!lead) {
      return NextResponse.json({ error: "Lead not found" }, { status: 404 });
    }
    return NextResponse.json({ lead });
  } catch (err) {
    console.error("Failed to fetch lead:", err);
    return NextResponse.json(
      { error: "Failed to fetch lead" },
      { status: 500 }
    );
  }
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const updates = await req.json();
    const lead = await updateLead(Number(params.id), updates);
    if (!lead) {
      return NextResponse.json({ error: "Lead not found" }, { status: 404 });
    }
    return NextResponse.json({ lead });
  } catch (err) {
    console.error("Failed to update lead:", err);
    return NextResponse.json(
      { error: "Failed to update lead" },
      { status: 500 }
    );
  }
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const deleted = await deleteLead(Number(params.id));
    if (!deleted) {
      return NextResponse.json({ error: "Lead not found" }, { status: 404 });
    }
    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("Failed to delete lead:", err);
    return NextResponse.json(
      { error: "Failed to delete lead" },
      { status: 500 }
    );
  }
}
