# Marketing Agency Lead Discovery

Discover NYC wellness businesses and audit their AI visibility to find the best leads for a digital marketing agency.

## How It Works

1. **Discovery** — Uses Claude to find independent, boutique wellness businesses across NYC neighborhoods
2. **Audit** — Scores each business on AI visibility (0-10) — how likely they are to be recommended by ChatGPT, Perplexity, and Google AI
3. **Output** — Generates CSV and JSON reports with lead categorization

### Lead Categories (inverted — low visibility = hot lead)

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
cp .env.example .env
# Add your Anthropic API key to .env
```

## Usage

```bash
# Full pipeline — all neighborhoods and categories
npm start

# Specific neighborhoods and categories
node src/index.js -n "Tribeca,SoHo" -c "Yoga Studios,Pilates Studios"

# Discovery only (no audit)
node src/index.js --discovery-only

# Audit from previously discovered businesses
node src/index.js --skip-discovery output/discovered_2026-03-18.json

# Dry run — see what would be processed
node src/index.js --dry-run
```

## Output

Results are saved to `./output/`:
- `leads_YYYY-MM-DD.json` — Full lead data
- `leads_YYYY-MM-DD.csv` — Spreadsheet-ready format
- `summary_YYYY-MM-DD.json` — Category breakdown
- `discovered_YYYY-MM-DD.json` — Intermediate discovery results

## Configuration

Edit `src/config.js` to customize:
- **Neighborhoods** — NYC neighborhoods to search
- **Categories** — Wellness business types to find
- **Lead thresholds** — Score ranges for lead categorization
