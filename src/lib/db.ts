import Database from "better-sqlite3";
import path from "path";
import fs from "fs";

let db: Database.Database | null = null;

export function getDb(): Database.Database {
  if (db) return db;

  const dataDir = path.join(process.cwd(), "data");
  if (!fs.existsSync(dataDir)) {
    fs.mkdirSync(dataDir, { recursive: true });
  }

  db = new Database(path.join(dataDir, "agency.db"));
  db.pragma("journal_mode = WAL");
  db.pragma("foreign_keys = ON");

  // Create tables if they don't exist
  db.exec(`
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
    );
  `);

  // Recover any stranded 'sending' states from crashes
  db.prepare(
    "UPDATE leads SET email_status = 'draft' WHERE email_status = 'sending'"
  ).run();

  return db;
}
