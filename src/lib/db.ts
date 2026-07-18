import { createClient, Client } from "@libsql/client";

let client: Client | null = null;

export function getDb(): Client {
  if (client) return client;

  const url = process.env.TURSO_DATABASE_URL;
  const authToken = process.env.TURSO_AUTH_TOKEN;

  if (!url) {
    throw new Error(
      "TURSO_DATABASE_URL is not configured. Set up a free Turso database at https://turso.tech"
    );
  }

  client = createClient({
    url,
    authToken,
  });

  return client;
}

export async function initDb(): Promise<void> {
  const db = getDb();

  await db.execute(`
    CREATE TABLE IF NOT EXISTS leads (
      id                  INTEGER PRIMARY KEY AUTOINCREMENT,
      name                TEXT NOT NULL,
      address             TEXT,
      neighborhood        TEXT,
      category            TEXT,
      phone               TEXT,
      website             TEXT,
      google_rating       REAL,
      google_review_count INTEGER,
      instagram_handle    TEXT,
      yelp_url            TEXT,
      description         TEXT,
      ai_score            REAL,
      visibility_status   TEXT,
      chatgpt_score       REAL,
      perplexity_score    REAL,
      google_ai_score     REAL,
      chatgpt_response    TEXT,
      score_reason        TEXT,
      top_gap             TEXT,
      quick_win           TEXT,
      lead_category       TEXT,
      email_address       TEXT,
      email_subject       TEXT,
      email_body          TEXT,
      email_status        TEXT DEFAULT 'not_sent',
      email_sent_at       TEXT,
      resend_message_id   TEXT,
      created_at          TEXT DEFAULT (datetime('now')),
      updated_at          TEXT DEFAULT (datetime('now')),
      UNIQUE(name, neighborhood, category)
    )
  `);
}
