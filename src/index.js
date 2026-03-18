import "dotenv/config";
import { program } from "commander";
import Anthropic from "@anthropic-ai/sdk";
import { readFile } from "node:fs/promises";
import { NEIGHBORHOODS, CATEGORIES } from "./config.js";
import { discoverAll, deduplicateBusinesses } from "./discovery.js";
import { auditAll } from "./audit.js";
import { writeResults, writeDiscoveryIntermediate } from "./output.js";

program
  .name("lead-discovery")
  .description("Discover and audit NYC wellness businesses for AI visibility")
  .option(
    "-n, --neighborhoods <list>",
    "comma-separated neighborhoods (default: all)",
    (v) => v.split(",").map((s) => s.trim())
  )
  .option(
    "-c, --categories <list>",
    "comma-separated categories (default: all)",
    (v) => v.split(",").map((s) => s.trim())
  )
  .option("-o, --output-dir <dir>", "output directory", "./output")
  .option("--discovery-only", "stop after discovery phase")
  .option(
    "--skip-discovery <file>",
    "skip discovery, load businesses from JSON file"
  )
  .option("--dry-run", "show what would be processed without making API calls");

program.parse();
const opts = program.opts();

const neighborhoods = opts.neighborhoods || NEIGHBORHOODS;
const categories = opts.categories || CATEGORIES;

console.log("\n=== Marketing Agency Lead Discovery ===\n");
console.log(`Neighborhoods: ${neighborhoods.length}`);
console.log(`Categories:    ${categories.length}`);
console.log(
  `Total combos:  ${neighborhoods.length * categories.length}\n`
);

if (opts.dryRun) {
  console.log("DRY RUN — would process these combinations:");
  for (const cat of categories) {
    for (const hood of neighborhoods) {
      console.log(`  ${cat} in ${hood}`);
    }
  }
  process.exit(0);
}

if (!process.env.ANTHROPIC_API_KEY) {
  console.error("Error: ANTHROPIC_API_KEY not set. Copy .env.example to .env and add your key.");
  process.exit(1);
}

const client = new Anthropic();

let businesses;

if (opts.skipDiscovery) {
  // Load from file
  console.log(`Loading discovered businesses from ${opts.skipDiscovery}...`);
  const raw = await readFile(opts.skipDiscovery, "utf-8");
  businesses = JSON.parse(raw);
  console.log(`  Loaded ${businesses.length} businesses\n`);
} else {
  // Discovery phase
  console.log("--- Phase 1: Discovery ---\n");
  businesses = await discoverAll(categories, neighborhoods, client, {
    onProgress(current, total, category, neighborhood) {
      console.log(`  [${current}/${total}] ${category} in ${neighborhood}`);
    },
  });

  console.log(`\n  Raw discoveries: ${businesses.length}`);
  businesses = deduplicateBusinesses(businesses);
  console.log(`  After dedup:     ${businesses.length}\n`);

  // Save intermediate results
  await writeDiscoveryIntermediate(businesses, opts.outputDir);

  if (opts.discoveryOnly) {
    console.log("\nDiscovery complete (--discovery-only). Exiting.");
    process.exit(0);
  }
}

// Audit phase
console.log("--- Phase 2: AI Visibility Audit ---\n");
const leads = await auditAll(businesses, client, {
  onProgress(completed, total, groupKey) {
    console.log(`  [${completed}/${total}] Audited group: ${groupKey}`);
  },
});

// Output phase
console.log("\n--- Phase 3: Output ---\n");
await writeResults(leads, opts.outputDir);

// Print summary
console.log("\n--- Summary ---\n");
const buckets = {};
for (const lead of leads) {
  const cat = lead.leadCategory || "UNSCORED";
  buckets[cat] = (buckets[cat] || 0) + 1;
}
for (const [label, count] of Object.entries(buckets).sort(
  (a, b) => b[1] - a[1]
)) {
  console.log(`  ${label}: ${count}`);
}
console.log(`\n  Total leads: ${leads.length}`);

// Top 10 hottest leads
const hot = leads
  .filter((l) => l.aiScore != null)
  .sort((a, b) => a.aiScore - b.aiScore)
  .slice(0, 10);

if (hot.length > 0) {
  console.log("\n--- Top 10 Hottest Leads ---\n");
  for (const lead of hot) {
    console.log(
      `  ${lead.name} (${lead.category}, ${lead.neighborhood}) — AI Score: ${lead.aiScore} — ${lead.leadCategory}`
    );
    if (lead.quickWin) console.log(`    Quick win: ${lead.quickWin}`);
  }
}

console.log("\nDone!\n");
