export interface Business {
  name: string;
  address: string;
  neighborhood: string;
  category: string;
  phone: string | null;
  website: string | null;
  googleRating: number | null;
  googleReviewCount: number | null;
  instagramHandle: string | null;
  yelpUrl: string | null;
  description: string;
}

export interface AuditResult {
  businessName: string;
  query: string;
  aiScore: number;
  visibilityStatus: "not_found" | "mentioned" | "recommended";
  chatGPTScore: number;
  perplexityScore: number;
  googleAIScore: number;
  chatGPTResponse: string;
  businessMentioned: boolean;
  scoreReason: string;
  topGap: string;
  quickWin: string;
}

export interface Lead extends Business, AuditResult {
  leadCategory: string;
}

export const NEIGHBORHOODS = [
  "Upper East Side",
  "Upper West Side",
  "Tribeca",
  "SoHo",
  "Chelsea",
  "West Village",
  "Greenwich Village",
  "Flatiron",
  "Midtown East",
  "Midtown West",
  "Williamsburg",
  "Park Slope",
  "DUMBO",
  "Astoria",
  "Long Island City",
];

export const CATEGORIES = [
  "Yoga Studios",
  "Pilates Studios",
  "Spas & Wellness Centers",
  "Acupuncture & TCM",
  "Chiropractic Offices",
  "Meditation Centers",
  "Float Therapy",
  "Cryotherapy",
  "Nutritionists & Dietitians",
  "Mental Health & Therapy Practices",
];

export const LEAD_THRESHOLDS: { max: number; label: string; color: string }[] = [
  { max: 2, label: "HOT LEAD", color: "red" },
  { max: 4, label: "WARM LEAD", color: "orange" },
  { max: 6, label: "LUKEWARM", color: "yellow" },
  { max: 8, label: "LOW PRIORITY", color: "blue" },
  { max: 10, label: "DO NOT CONTACT", color: "gray" },
];

export function categorizeScore(score: number): string {
  for (const { max, label } of LEAD_THRESHOLDS) {
    if (score <= max) return label;
  }
  return "UNKNOWN";
}
