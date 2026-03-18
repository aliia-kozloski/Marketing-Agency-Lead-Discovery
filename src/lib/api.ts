import Anthropic from "@anthropic-ai/sdk";
import { Business, categorizeScore, Lead } from "./types";

function getClient() {
  return new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });
}

export async function discoverBusinesses(
  category: string,
  neighborhood: string
): Promise<Business[]> {
  const client = getClient();

  const prompt = `
You are a business research assistant for a NYC wellness agency.
Search the web and find exactly 10 real, currently operating ${category} businesses
in ${neighborhood}, New York City.
For each business return ONLY a valid JSON array with this exact structure:
[
  {
    "name": "Business name",
    "address": "Full street address",
    "neighborhood": "${neighborhood}",
    "category": "${category}",
    "phone": "Phone number or null",
    "website": "Full URL or null",
    "googleRating": 4.5,
    "googleReviewCount": 120,
    "instagramHandle": "@handle or null",
    "yelpUrl": "URL or null",
    "description": "One sentence describing what they offer"
  }
]
Rules:
- Only include businesses that are currently open and operating
- Only real businesses you can verify exist
- No chains or franchises (no Heyday, no Equinox)
- Focus on independent, boutique, owner-operated studios
- If you cannot find 10, return however many you find
- Return ONLY the JSON array, no explanation, no markdown, no backticks
`;

  const response = await client.messages.create({
    model: "claude-sonnet-4-20250514",
    max_tokens: 4096,
    messages: [{ role: "user", content: prompt }],
  });

  const text =
    response.content[0].type === "text" ? response.content[0].text.trim() : "";

  try {
    const businesses = JSON.parse(text);
    if (!Array.isArray(businesses)) return [];
    return businesses;
  } catch {
    console.error("Failed to parse discovery response");
    return [];
  }
}

export async function auditBusinesses(
  businesses: Business[]
): Promise<Lead[]> {
  if (businesses.length === 0) return [];

  const client = getClient();
  const neighborhood = businesses[0].neighborhood;
  const category = businesses[0].category;

  const prompt = `
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

  const response = await client.messages.create({
    model: "claude-sonnet-4-20250514",
    max_tokens: 8192,
    messages: [{ role: "user", content: prompt }],
  });

  const text =
    response.content[0].type === "text" ? response.content[0].text.trim() : "";

  try {
    const audits = JSON.parse(text);
    if (!Array.isArray(audits)) return [];

    return audits.map((audit) => {
      const original = businesses.find(
        (b) => b.name.toLowerCase() === audit.businessName?.toLowerCase()
      );
      return {
        ...(original || {}),
        ...audit,
        leadCategory: categorizeScore(audit.aiScore),
      } as Lead;
    });
  } catch {
    console.error("Failed to parse audit response");
    return [];
  }
}
