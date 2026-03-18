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

export const LEAD_THRESHOLDS = [
  { max: 2, label: "HOT LEAD" },
  { max: 4, label: "WARM LEAD" },
  { max: 6, label: "LUKEWARM" },
  { max: 8, label: "LOW PRIORITY" },
  { max: 10, label: "DO NOT CONTACT" },
];

export function categorizeScore(score) {
  for (const { max, label } of LEAD_THRESHOLDS) {
    if (score <= max) return label;
  }
  return "UNKNOWN";
}
