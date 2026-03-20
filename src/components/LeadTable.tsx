"use client";

import { Lead, SavedLeadInfo } from "@/lib/types";

interface LeadTableProps {
  leads: Lead[];
  onSelectLead: (lead: Lead) => void;
  selectedLead: Lead | null;
  savedLeadMap: Map<string, SavedLeadInfo>;
  leadKey: (lead: { name: string; neighborhood: string; category: string }) => string;
}

function ScoreBadge({ score }: { score: number }) {
  const bg =
    score <= 2
      ? "bg-red-100 text-red-800"
      : score <= 4
      ? "bg-orange-100 text-orange-800"
      : score <= 6
      ? "bg-yellow-100 text-yellow-800"
      : score <= 8
      ? "bg-blue-100 text-blue-800"
      : "bg-gray-100 text-gray-800";

  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${bg}`}>
      {score}/10
    </span>
  );
}

function CategoryBadge({ category }: { category: string }) {
  const styles: Record<string, string> = {
    "HOT LEAD": "bg-red-600 text-white",
    "WARM LEAD": "bg-orange-500 text-white",
    LUKEWARM: "bg-yellow-500 text-gray-900",
    "LOW PRIORITY": "bg-blue-500 text-white",
    "DO NOT CONTACT": "bg-gray-400 text-white",
  };

  return (
    <span
      className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-bold ${
        styles[category] || "bg-gray-200 text-gray-800"
      }`}
    >
      {category}
    </span>
  );
}

function EmailStatusBadge({ status }: { status: string }) {
  if (status === "sent") {
    return (
      <span className="inline-flex items-center px-1.5 py-0.5 rounded text-xs font-medium bg-green-100 text-green-800">
        Sent
      </span>
    );
  }
  if (status === "draft") {
    return (
      <span className="inline-flex items-center px-1.5 py-0.5 rounded text-xs font-medium bg-purple-100 text-purple-800">
        Draft
      </span>
    );
  }
  return (
    <span className="inline-flex items-center px-1.5 py-0.5 rounded text-xs font-medium bg-gray-100 text-gray-600">
      Saved
    </span>
  );
}

export default function LeadTable({
  leads,
  onSelectLead,
  selectedLead,
  savedLeadMap,
  leadKey,
}: LeadTableProps) {
  if (leads.length === 0) {
    return (
      <div className="flex-1 flex items-center justify-center text-gray-400">
        <div className="text-center">
          <svg
            className="mx-auto h-12 w-12 text-gray-300"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={1}
              d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
            />
          </svg>
          <p className="mt-4 text-sm">
            Select a neighborhood and category, then click{" "}
            <strong>Discover & Audit</strong> to find leads.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 overflow-auto">
      <table className="w-full text-sm">
        <thead className="bg-gray-50 sticky top-0 z-10">
          <tr>
            <th className="text-left px-4 py-3 font-medium text-gray-500 uppercase text-xs tracking-wide">
              Business
            </th>
            <th className="text-left px-4 py-3 font-medium text-gray-500 uppercase text-xs tracking-wide">
              AI Score
            </th>
            <th className="text-left px-4 py-3 font-medium text-gray-500 uppercase text-xs tracking-wide">
              Lead Status
            </th>
            <th className="text-left px-4 py-3 font-medium text-gray-500 uppercase text-xs tracking-wide">
              Visibility
            </th>
            <th className="text-left px-4 py-3 font-medium text-gray-500 uppercase text-xs tracking-wide">
              Outreach
            </th>
            <th className="text-left px-4 py-3 font-medium text-gray-500 uppercase text-xs tracking-wide">
              Quick Win
            </th>
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-100">
          {leads.map((lead, i) => {
            const key = leadKey(lead);
            const savedInfo = savedLeadMap.get(key);
            const isSelected = selectedLead
              ? leadKey(selectedLead) === key
              : false;

            return (
              <tr
                key={`${key}-${i}`}
                onClick={() => onSelectLead(lead)}
                className={`cursor-pointer transition-colors hover:bg-indigo-50 ${
                  isSelected ? "bg-indigo-50" : ""
                }`}
              >
                <td className="px-4 py-3">
                  <div className="font-medium text-gray-900">{lead.name}</div>
                  <div className="text-xs text-gray-500">{lead.address}</div>
                </td>
                <td className="px-4 py-3">
                  <ScoreBadge score={lead.aiScore} />
                </td>
                <td className="px-4 py-3">
                  <CategoryBadge category={lead.leadCategory} />
                </td>
                <td className="px-4 py-3">
                  <span
                    className={`text-xs capitalize ${
                      lead.visibilityStatus === "not_found"
                        ? "text-red-600"
                        : lead.visibilityStatus === "mentioned"
                        ? "text-yellow-600"
                        : "text-green-600"
                    }`}
                  >
                    {lead.visibilityStatus?.replace("_", " ")}
                  </span>
                </td>
                <td className="px-4 py-3">
                  {savedInfo ? (
                    <EmailStatusBadge status={savedInfo.emailStatus} />
                  ) : (
                    <span className="text-xs text-gray-400">-</span>
                  )}
                </td>
                <td className="px-4 py-3 text-xs text-gray-600 max-w-xs truncate">
                  {lead.quickWin}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
