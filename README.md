# Aliia Admin — Lead Discovery & Outreach

A Next.js web dashboard that discovers NYC wellness businesses, audits their AI visibility, and manages personalized outreach emails.

## How It Works

1. **Pick** a neighborhood and business category from the sidebar
2. **Click** "Discover & Audit" — Claude AI finds real businesses and scores their visibility
3. **Browse** the results table sorted by lead quality (hottest leads first)
4. **Click** any lead to see full details: AI scores, gaps, quick wins
5. **Save** promising leads to your database
6. **Generate** a personalized outreach email with one click
7. **Send** emails directly via Resend

### Lead Categories

| AI Score | Category | Meaning |
|----------|----------|---------|
| 0-2 | HOT LEAD | Invisible to AI — needs help most |
| 3-4 | WARM LEAD | Weak signals, rarely appears |
| 5-6 | LUKEWARM | Moderate presence |
| 7-8 | LOW PRIORITY | Already visible |
| 9-10 | DO NOT CONTACT | Dominant AI presence |

## Deploy to Vercel

### 1. Set up Turso database (free)

```bash
# Install Turso CLI
curl -sSfL https://get.tur.so/install.sh | bash

# Sign up and create a database
turso auth signup
turso db create aliia-leads
turso db show aliia-leads --url    # copy TURSO_DATABASE_URL
turso db tokens create aliia-leads  # copy TURSO_AUTH_TOKEN
```

### 2. Deploy

1. Push this repo to GitHub
2. Import at [vercel.com/new](https://vercel.com/new)
3. Add these environment variables in Vercel:
   - `ANTHROPIC_API_KEY` — your Anthropic API key
   - `TURSO_DATABASE_URL` — from step 1
   - `TURSO_AUTH_TOKEN` — from step 1
   - `NEXTAUTH_SECRET` — run `openssl rand -base64 32` to generate
   - `ADMIN_PASSWORD` — pick a password for the login screen
   - `RESEND_API_KEY` — (optional) for sending emails via Resend
4. Deploy

## Local Development

```bash
npm install
cp .env.example .env.local
# Fill in your keys in .env.local
npm run dev
```

Open http://localhost:3000 in your browser.

## Tech Stack

- Next.js 14 (App Router)
- Tailwind CSS
- Claude API (Anthropic SDK)
- Turso (SQLite for serverless)
- NextAuth.js (password-protected admin)
- Resend (email delivery)
