import { createObjectCsvWriter } from "csv-writer";
import { writeFile, mkdir } from "node:fs/promises";
import { join } from "node:path";

function datestamp() {
  return new Date().toISOString().split("T")[0];
}

export async function writeResults(leads, outputDir = "./output") {
  await mkdir(outputDir, { recursive: true });
  const stamp = datestamp();

  // Full JSON output
  const jsonPath = join(outputDir, `leads_${stamp}.json`);
  await writeFile(jsonPath, JSON.stringify(leads, null, 2));
  console.log(`  JSON: ${jsonPath} (${leads.length} leads)`);

  // CSV output
  const csvPath = join(outputDir, `leads_${stamp}.csv`);
  const csvWriter = createObjectCsvWriter({
    path: csvPath,
    header: [
      { id: "name", title: "Business Name" },
      { id: "category", title: "Category" },
      { id: "neighborhood", title: "Neighborhood" },
      { id: "address", title: "Address" },
      { id: "phone", title: "Phone" },
      { id: "website", title: "Website" },
      { id: "instagramHandle", title: "Instagram" },
      { id: "yelpUrl", title: "Yelp URL" },
      { id: "googleRating", title: "Google Rating" },
      { id: "googleReviewCount", title: "Google Reviews" },
      { id: "aiScore", title: "AI Visibility Score" },
      { id: "leadCategory", title: "Lead Category" },
      { id: "visibilityStatus", title: "Visibility Status" },
      { id: "chatGPTScore", title: "ChatGPT Score" },
      { id: "perplexityScore", title: "Perplexity Score" },
      { id: "googleAIScore", title: "Google AI Score" },
      { id: "scoreReason", title: "Score Reason" },
      { id: "topGap", title: "Top Gap" },
      { id: "quickWin", title: "Quick Win" },
      { id: "chatGPTResponse", title: "ChatGPT Response Simulation" },
      { id: "description", title: "Description" },
    ],
  });
  await csvWriter.writeRecords(leads);
  console.log(`  CSV:  ${csvPath}`);

  // Summary
  const summary = {};
  for (const lead of leads) {
    const cat = lead.leadCategory || "UNSCORED";
    summary[cat] = (summary[cat] || 0) + 1;
  }
  const summaryPath = join(outputDir, `summary_${stamp}.json`);
  await writeFile(summaryPath, JSON.stringify(summary, null, 2));
  console.log(`  Summary: ${summaryPath}`);

  return { jsonPath, csvPath, summaryPath };
}

export async function writeDiscoveryIntermediate(businesses, outputDir = "./output") {
  await mkdir(outputDir, { recursive: true });
  const stamp = datestamp();
  const path = join(outputDir, `discovered_${stamp}.json`);
  await writeFile(path, JSON.stringify(businesses, null, 2));
  console.log(`  Intermediate discovery saved: ${path} (${businesses.length} businesses)`);
  return path;
}
