import { setTimeout } from "node:timers/promises";
import { categorizeScore } from "./config.js";

const BATCH_SIZE = 5;

function buildAuditPrompt(businesses, neighborhood, category) {
  return `
You are an AI visibility analyst for a digital agency that helps wellness
businesses get recommended by AI search tools like ChatGPT and Perplexity.
Here are ${businesses.length} businesses in ${neighborhood}, NYC:
${JSON.stringify(businesses, null, 2)}
For each business, audit how likely they are to be recommended by AI search
tools when someone searches: "best ${category} in ${neighborhood} NYC"
Analyze based on:
- Strength of their online presence (website quality, social media)
- Volume and quality of reviews
- How specific and descriptive their business information is
- Whether they have a clear niche or specialization AI can cite
- Structured data and content signals
Return ONLY a valid JSON array in this exact structure:
[
  {
    "businessName": "Exact name matching input",
    "query": "best ${category} in ${neighborhood} NYC",
    "aiScore": 3,
    "visibilityStatus": "not_found",
    "chatGPTScore": 2,
    "perplexityScore": 3,
    "googleAIScore": 4,
    "chatGPTResponse": "A realistic simulation of what ChatGPT would actually say if asked this query. If the business would appear, mention them naturally. If not, describe who does appear instead. 2-3 sentences.",
    "businessMentioned": false,
    "scoreReason": "One sentence explaining why they got this score",
    "topGap": "The single biggest reason they are not being recommended by AI",
    "quickWin": "The one thing that would most improve their AI visibility"
  }
]
Scoring guide:
- 0-2: No meaningful online presence, invisible to AI — HOT LEAD
- 3-4: Some presence but weak signals, rarely appears — WARM LEAD
- 5-6: Moderate presence, occasionally mentioned — LUKEWARM
- 7-8: Strong presence, frequently recommended — LOW PRIORITY
- 9-10: Dominant AI presence, always recommended — DO NOT CONTACT
visibilityStatus must be exactly one of: "not_found", "mentioned", "recommended"
Return ONLY the JSON array, no explanation, no markdown, no backticks
`;
}

async function auditBatch(businesses, client) {
  if (businesses.length === 0) return [];

  const neighborhood = businesses[0].neighborhood;
  const category = businesses[0].category;
  const prompt = buildAuditPrompt(businesses, neighborhood, category);

  for (let attempt = 0; attempt < 3; attempt++) {
    try {
      const response = await client.messages.create({
        model: "claude-sonnet-4-20250514",
        max_tokens: 8192,
        messages: [{ role: "user", content: prompt }],
      });

      const text = response.content[0].text.trim();
      const audits = JSON.parse(text);

      if (!Array.isArray(audits)) {
        throw new Error("Audit response is not an array");
      }

      return audits;
    } catch (err) {
      if (attempt < 2) {
        const delay = Math.pow(2, attempt + 1) * 1000;
        console.warn(`  Audit retry ${attempt + 1}/2: ${err.message}`);
        await setTimeout(delay);
      } else {
        console.error(`  Audit failed for batch: ${err.message}`);
        return [];
      }
    }
  }
}

export async function auditAll(businesses, client, { onProgress } = {}) {
  // Group businesses by neighborhood + category for coherent batching
  const groups = new Map();
  for (const biz of businesses) {
    const key = `${biz.neighborhood}::${biz.category}`;
    if (!groups.has(key)) groups.set(key, []);
    groups.get(key).push(biz);
  }

  const results = [];
  const groupEntries = [...groups.entries()];
  let completed = 0;
  const totalGroups = groupEntries.length;

  for (const [key, groupBusinesses] of groupEntries) {
    // Process in sub-batches of BATCH_SIZE
    for (let i = 0; i < groupBusinesses.length; i += BATCH_SIZE) {
      const batch = groupBusinesses.slice(i, i + BATCH_SIZE);
      const audits = await auditBatch(batch, client);

      // Merge audit data back into business objects
      for (const audit of audits) {
        const original = batch.find(
          (b) => b.name.toLowerCase() === audit.businessName.toLowerCase()
        );
        if (original) {
          results.push({
            ...original,
            ...audit,
            leadCategory: categorizeScore(audit.aiScore),
          });
        } else {
          results.push({
            ...audit,
            leadCategory: categorizeScore(audit.aiScore),
          });
        }
      }

      await setTimeout(1000);
    }

    completed++;
    if (onProgress) onProgress(completed, totalGroups, key);
  }

  return results;
}
