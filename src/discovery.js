import { setTimeout } from "node:timers/promises";

export async function discoverBusinesses(category, neighborhood, client) {
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

  for (let attempt = 0; attempt < 3; attempt++) {
    try {
      const response = await client.messages.create({
        model: "claude-sonnet-4-20250514",
        max_tokens: 4096,
        messages: [{ role: "user", content: prompt }],
      });

      const text = response.content[0].text.trim();
      const businesses = JSON.parse(text);

      if (!Array.isArray(businesses)) {
        throw new Error("Response is not an array");
      }

      return businesses;
    } catch (err) {
      if (attempt < 2) {
        const delay = Math.pow(2, attempt + 1) * 1000;
        console.warn(
          `  Retry ${attempt + 1}/2 for ${category} in ${neighborhood}: ${err.message}`
        );
        await setTimeout(delay);
      } else {
        console.error(
          `  Failed to discover ${category} in ${neighborhood}: ${err.message}`
        );
        return [];
      }
    }
  }
}

export async function discoverAll(
  categories,
  neighborhoods,
  client,
  { onProgress } = {}
) {
  const allBusinesses = [];
  const total = categories.length * neighborhoods.length;
  let current = 0;

  for (const category of categories) {
    for (const neighborhood of neighborhoods) {
      current++;
      if (onProgress) onProgress(current, total, category, neighborhood);

      const businesses = await discoverBusinesses(
        category,
        neighborhood,
        client
      );
      allBusinesses.push(...businesses);

      // Rate limit: brief pause between API calls
      await setTimeout(1000);
    }
  }

  return allBusinesses;
}

export function deduplicateBusinesses(businesses) {
  const seen = new Map();
  for (const biz of businesses) {
    const key = biz.name.toLowerCase().trim();
    if (!seen.has(key)) {
      seen.set(key, biz);
    }
  }
  return [...seen.values()];
}
