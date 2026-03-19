import { getDb } from "./db";
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
    visibilityStatus: (row.visibility_status as SavedLead["visibilityStatus"]) || "not_found",
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

export function getLeads(filters?: {
  emailStatus?: string;
  neighborhood?: string;
  category?: string;
}): SavedLead[] {
  const db = getDb();
  let sql = "SELECT * FROM leads WHERE 1=1";
  const params: string[] = [];

  if (filters?.emailStatus) {
    sql += " AND email_status = ?";
    params.push(filters.emailStatus);
  }
  if (filters?.neighborhood) {
    sql += " AND neighborhood = ?";
    params.push(filters.neighborhood);
  }
  if (filters?.category) {
    sql += " AND category = ?";
    params.push(filters.category);
  }

  sql += " ORDER BY created_at DESC";

  const rows = db.prepare(sql).all(...params) as LeadRow[];
  return rows.map(rowToSavedLead);
}

export function getLeadById(id: number): SavedLead | null {
  const db = getDb();
  const row = db.prepare("SELECT * FROM leads WHERE id = ?").get(id) as LeadRow | undefined;
  return row ? rowToSavedLead(row) : null;
}

export function insertLead(lead: Lead): SavedLead | null {
  const db = getDb();
  try {
    const result = db
      .prepare(
        `INSERT OR IGNORE INTO leads (
          name, address, neighborhood, category, phone, website,
          google_rating, google_review_count, instagram_handle, yelp_url,
          description, ai_score, visibility_status, chatgpt_score,
          perplexity_score, google_ai_score, chatgpt_response, score_reason,
          top_gap, quick_win, lead_category
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
      )
      .run(
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
        lead.leadCategory
      );

    if (result.changes === 0) return null; // duplicate
    return getLeadById(Number(result.lastInsertRowid));
  } catch {
    return null;
  }
}

export function updateLead(
  id: number,
  updates: Partial<{
    emailAddress: string;
    emailSubject: string;
    emailBody: string;
    emailStatus: string;
    emailSentAt: string;
    resendMessageId: string;
  }>
): SavedLead | null {
  const db = getDb();
  const setClauses: string[] = ["updated_at = datetime('now')"];
  const params: (string | null)[] = [];

  if (updates.emailAddress !== undefined) {
    setClauses.push("email_address = ?");
    params.push(updates.emailAddress);
  }
  if (updates.emailSubject !== undefined) {
    setClauses.push("email_subject = ?");
    params.push(updates.emailSubject);
  }
  if (updates.emailBody !== undefined) {
    setClauses.push("email_body = ?");
    params.push(updates.emailBody);
  }
  if (updates.emailStatus !== undefined) {
    setClauses.push("email_status = ?");
    params.push(updates.emailStatus);
  }
  if (updates.emailSentAt !== undefined) {
    setClauses.push("email_sent_at = ?");
    params.push(updates.emailSentAt);
  }
  if (updates.resendMessageId !== undefined) {
    setClauses.push("resend_message_id = ?");
    params.push(updates.resendMessageId);
  }

  params.push(String(id));
  db.prepare(`UPDATE leads SET ${setClauses.join(", ")} WHERE id = ?`).run(
    ...params
  );

  return getLeadById(id);
}

export function claimLeadForSending(id: number): boolean {
  const db = getDb();
  const result = db
    .prepare(
      "UPDATE leads SET email_status = 'sending', updated_at = datetime('now') WHERE id = ? AND email_status != 'sent' AND email_status != 'sending'"
    )
    .run(id);
  return result.changes > 0;
}

export function deleteLead(id: number): boolean {
  const db = getDb();
  const result = db.prepare("DELETE FROM leads WHERE id = ?").run(id);
  return result.changes > 0;
}

export function getOutreachStats(): {
  totalSaved: number;
  emailsDrafted: number;
  emailsSent: number;
} {
  const db = getDb();
  const total = (db.prepare("SELECT COUNT(*) as count FROM leads").get() as { count: number }).count;
  const drafted = (
    db
      .prepare("SELECT COUNT(*) as count FROM leads WHERE email_status = 'draft'")
      .get() as { count: number }
  ).count;
  const sent = (
    db
      .prepare("SELECT COUNT(*) as count FROM leads WHERE email_status = 'sent'")
      .get() as { count: number }
  ).count;

  return { totalSaved: total, emailsDrafted: drafted, emailsSent: sent };
}
