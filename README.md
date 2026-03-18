# Lead Discovery — NYC Wellness

A Next.js web dashboard that discovers NYC wellness businesses and audits their AI visibility to find the best leads for a digital marketing agency.

## How It Works

1. **Pick** a neighborhood and business category from the sidebar
2. **Click** "Discover & Audit" — Claude AI finds real businesses and scores their visibility
3. **Browse** the results table sorted by lead quality (hottest leads first)
4. **Click** any lead to see full details: AI scores, gaps, quick wins, and a simulated ChatGPT response

### Lead Categories

| AI Score | Category | Meaning |
|----------|----------|---------|
| 0-2 | HOT LEAD | Invisible to AI — needs help most |
| 3-4 | WARM LEAD | Weak signals, rarely appears |
| 5-6 | LUKEWARM | Moderate presence |
| 7-8 | LOW PRIORITY | Already visible |
| 9-10 | DO NOT CONTACT | Dominant AI presence |

## Setup

```bash
npm install
cp .env.example .env.local
# Add your Anthropic API key to .env.local
npm run dev
```

Open http://localhost:3000 in your browser.

## Deploy to Vercel

1. Push to GitHub
2. Import the repo at vercel.com/new
3. Add `ANTHROPIC_API_KEY` as an environment variable
4. Deploy

## Tech Stack

- Next.js 14 (App Router)
- Tailwind CSS
- Claude API (Anthropic SDK)
- TypeScript
