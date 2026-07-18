import { getDb, initDb } from "./db";
import type { Lead } from "./types";

export interface SavedLead extends Lead {
  id: number;
  emailAddress: string | null;
  emailSubject: string | null;
  emailBody: string | null;
  emailStatus: "not_sent" | "draft" | "sending" | "sent";
  emailSentAt: string | null;
  resendMessageId: string | null;
  createdAt: string;
  updatedAt: string;
}

interface LeadRow {
  id: number;
  name: string;
  address: string | null;
  neighborhood: string | null;
  category: string | null;
  phone: string | null;
  website: string | null;
  google_rating: number | null;
  google_review_count: number | null;
  instagram_handle: string | null;
  yelp_url: string | null;
  description: string | null;
  ai_score: number | null;
  visibility_status: string | null;
  chatgpt_score: number | null;
  perplexity_score: number | null;
  google_ai_score: number | null;
  chatgpt_response: string | null;
  score_reason: string | null;
  top_gap: string | null;
  quick_win: string | null;
  lead_category: string | null;
  email_address: string | null;
  email_subject: string | null;
  email_body: string | null;
  email_status: string;
  email_sent_at: string | null;
  resend_message_id: string | null;
  created_at: string;
  updated_at: string;
}

function rowToSavedLead(row: LeadRow): SavedLead {
  return {
    id: row.id,
    name: row.name,
    address: row.address || "",
    neighborhood: row.neighborhood || "",
    category: row.category || "",
    phone: row.phone,
    website: row.website,
    googleRating: row.google_rating,
    googleReviewCount: row.google_review_count,
    instagramHandle: row.instagram_handle,
    yelpUrl: row.yelp_url,
    description: row.description || "",
    aiScore: row.ai_score || 0,
    visibilityStatus:
      (row.visibility_status as SavedLead["visibilityStatus"]) || "not_found",
    chatGPTScore: row.chatgpt_score || 0,
    perplexityScore: row.perplexity_score || 0,
    googleAIScore: row.google_ai_score || 0,
    chatGPTResponse: row.chatgpt_response || "",
    businessMentioned: false,
    businessName: row.name,
    query: "",
    scoreReason: row.score_reason || "",
    topGap: row.top_gap || "",
    quickWin: row.quick_win || "",
    leadCategory: row.lead_category || "",
    emailAddress: row.email_address,
    emailSubject: row.email_subject,
    emailBody: row.email_body,
    emailStatus: row.email_status as SavedLead["emailStatus"],
    emailSentAt: row.email_sent_at,
    resendMessageId: row.resend_message_id,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

async function ensureTable() {
  await initDb();
}

export async function getLeads(filters?: {
  emailStatus?: string;
  neighborhood?: string;
  category?: string;
}): Promise<SavedLead[]> {
  await ensureTable();
  const db = getDb();

  let sql = "SELECT * FROM leads WHERE 1=1";
  const args: (string | number)[] = [];

  if (filters?.emailStatus) {
    sql += " AND email_status = ?";
    args.push(filters.emailStatus);
  }
  if (filters?.neighborhood) {
    sql += " AND neighborhood = ?";
    args.push(filters.neighborhood);
  }
  if (filters?.category) {
    sql += " AND category = ?";
    args.push(filters.category);
  }

  sql += " ORDER BY created_at DESC";

  const result = await db.execute({ sql, args });
  return result.rows.map((row) => rowToSavedLead(row as unknown as LeadRow));
}

export async function getLeadById(id: number): Promise<SavedLead | null> {
  await ensureTable();
  const db = getDb();
  const result = await db.execute({
    sql: "SELECT * FROM leads WHERE id = ?",
    args: [id],
  });
  if (result.rows.length === 0) return null;
  return rowToSavedLead(result.rows[0] as unknown as LeadRow);
}

export async function insertLead(lead: Lead): Promise<SavedLead | null> {
  await ensureTable();
  const db = getDb();

  try {
    const result = await db.execute({
      sql: `INSERT OR IGNORE INTO leads (
        name, address, neighborhood, category, phone, website,
        google_rating, google_review_count, instagram_handle, yelp_url,
        description, ai_score, visibility_status, chatgpt_score,
        perplexity_score, google_ai_score, chatgpt_response, score_reason,
        top_gap, quick_win, lead_category
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      args: [
        lead.name,
        lead.address,
        lead.neighborhood,
        lead.category,
        lead.phone,
        lead.website,
        lead.googleRating,
        lead.googleReviewCount,
        lead.instagramHandle,
        lead.yelpUrl,
        lead.description,
        lead.aiScore,
        lead.visibilityStatus,
        lead.chatGPTScore,
        lead.perplexityScore,
        lead.googleAIScore,
        lead.chatGPTResponse,
        lead.scoreReason,
        lead.topGap,
        lead.quickWin,
        lead.leadCategory,
      ],
    });

    if (result.rowsAffected === 0) return null;
    const insertedId = Number(result.lastInsertRowid);
    return getLeadById(insertedId);
  } catch (err) {
    console.error("Failed to insert lead:", err);
    return null;
  }
}

export async function updateLead(
  id: number,
  updates: Partial<{
    emailAddress: string;
    emailSubject: string;
    emailBody: string;
    emailStatus: string;
    emailSentAt: string;
    resendMessageId: string;
  }>
): Promise<SavedLead | null> {
  await ensureTable();
  const db = getDb();

  const setClauses: string[] = ["updated_at = datetime('now')"];
  const args: (string | number | null)[] = [];

  if (updates.emailAddress !== undefined) {
    setClauses.push("email_address = ?");
    args.push(updates.emailAddress);
  }
  if (updates.emailSubject !== undefined) {
    setClauses.push("email_subject = ?");
    args.push(updates.emailSubject);
  }
  if (updates.emailBody !== undefined) {
    setClauses.push("email_body = ?");
    args.push(updates.emailBody);
  }
  if (updates.emailStatus !== undefined) {
    setClauses.push("email_status = ?");
    args.push(updates.emailStatus);
  }
  if (updates.emailSentAt !== undefined) {
    setClauses.push("email_sent_at = ?");
    args.push(updates.emailSentAt);
  }
  if (updates.resendMessageId !== undefined) {
    setClauses.push("resend_message_id = ?");
    args.push(updates.resendMessageId);
  }

  args.push(id);
  await db.execute({
    sql: `UPDATE leads SET ${setClauses.join(", ")} WHERE id = ?`,
    args,
  });

  return getLeadById(id);
}

export async function claimLeadForSending(id: number): Promise<boolean> {
  await ensureTable();
  const db = getDb();
  const result = await db.execute({
    sql: "UPDATE leads SET email_status = 'sending', updated_at = datetime('now') WHERE id = ? AND email_status != 'sent' AND email_status != 'sending'",
    args: [id],
  });
  return (result.rowsAffected ?? 0) > 0;
}

export async function deleteLead(id: number): Promise<boolean> {
  await ensureTable();
  const db = getDb();
  const result = await db.execute({
    sql: "DELETE FROM leads WHERE id = ?",
    args: [id],
  });
  return (result.rowsAffected ?? 0) > 0;
}

export async function getOutreachStats(): Promise<{
  totalSaved: number;
  emailsDrafted: number;
  emailsSent: number;
}> {
  await ensureTable();
  const db = getDb();

  const total = await db.execute("SELECT COUNT(*) as count FROM leads");
  const drafted = await db.execute(
    "SELECT COUNT(*) as count FROM leads WHERE email_status = 'draft'"
  );
  const sent = await db.execute(
    "SELECT COUNT(*) as count FROM leads WHERE email_status = 'sent'"
  );

  return {
    totalSaved: Number(total.rows[0].count),
    emailsDrafted: Number(drafted.rows[0].count),
    emailsSent: Number(sent.rows[0].count),
  };
}
