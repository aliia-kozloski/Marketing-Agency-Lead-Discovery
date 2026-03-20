"use client";

import { NEIGHBORHOODS, CATEGORIES } from "@/lib/types";

interface SidebarProps {
  neighborhood: string;
  category: string;
  onNeighborhoodChange: (v: string) => void;
  onCategoryChange: (v: string) => void;
  onSearch: () => void;
  loading: boolean;
  leadCounts: Record<string, number>;
  outreachStats: {
    totalSaved: number;
    emailsDrafted: number;
    emailsSent: number;
  };
  emailStatusFilter: string;
  onEmailStatusFilterChange: (v: string) => void;
}

export default function Sidebar({
  neighborhood,
  category,
  onNeighborhoodChange,
  onCategoryChange,
  onSearch,
  loading,
  leadCounts,
  outreachStats,
  emailStatusFilter,
  onEmailStatusFilterChange,
}: SidebarProps) {
  const totalLeads = Object.values(leadCounts).reduce((a, b) => a + b, 0);

  return (
    <aside className="w-72 bg-gray-900 text-white flex flex-col h-screen sticky top-0">
      <div className="p-6 border-b border-gray-700">
        <h1 className="text-lg font-bold tracking-tight">Aliia Admin</h1>
        <p className="text-xs text-gray-400 mt-1">Lead Discovery & Outreach</p>
      </div>

      <div className="p-6 flex-1 overflow-y-auto space-y-5">
        {/* Outreach Stats */}
        {outreachStats.totalSaved > 0 && (
          <div className="pb-4 border-b border-gray-700">
            <h3 className="text-xs font-medium text-gray-400 uppercase tracking-wide mb-3">
              Outreach
            </h3>
            <div className="grid grid-cols-3 gap-2">
              <div className="text-center">
                <div className="text-lg font-bold text-white">
                  {outreachStats.totalSaved}
                </div>
                <div className="text-xs text-gray-500">Saved</div>
              </div>
              <div className="text-center">
                <div className="text-lg font-bold text-purple-400">
                  {outreachStats.emailsDrafted}
                </div>
                <div className="text-xs text-gray-500">Drafted</div>
              </div>
              <div className="text-center">
                <div className="text-lg font-bold text-green-400">
                  {outreachStats.emailsSent}
                </div>
                <div className="text-xs text-gray-500">Sent</div>
              </div>
            </div>

            {/* Email status filter */}
            <select
              value={emailStatusFilter}
              onChange={(e) => onEmailStatusFilterChange(e.target.value)}
              className="w-full mt-3 bg-gray-800 border border-gray-600 rounded-lg px-3 py-1.5 text-xs focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none"
            >
              <option value="">All leads</option>
              <option value="not_sent">Not sent</option>
              <option value="draft">Drafts</option>
              <option value="sent">Sent</option>
            </select>
          </div>
        )}

        {/* Discovery Controls */}
        <div>
          <label className="block text-xs font-medium text-gray-400 uppercase tracking-wide mb-2">
            Neighborhood
          </label>
          <select
            value={neighborhood}
            onChange={(e) => onNeighborhoodChange(e.target.value)}
            className="w-full bg-gray-800 border border-gray-600 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none"
          >
            <option value="">Select neighborhood...</option>
            {NEIGHBORHOODS.map((n) => (
              <option key={n} value={n}>
                {n}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-xs font-medium text-gray-400 uppercase tracking-wide mb-2">
            Category
          </label>
          <select
            value={category}
            onChange={(e) => onCategoryChange(e.target.value)}
            className="w-full bg-gray-800 border border-gray-600 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none"
          >
            <option value="">Select category...</option>
            {CATEGORIES.map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </select>
        </div>

        <button
          onClick={onSearch}
          disabled={!neighborhood || !category || loading}
          className="w-full bg-indigo-600 hover:bg-indigo-500 disabled:bg-gray-700 disabled:text-gray-500 text-white font-medium py-2.5 px-4 rounded-lg text-sm transition-colors"
        >
          {loading ? (
            <span className="flex items-center justify-center gap-2">
              <svg
                className="animate-spin h-4 w-4"
                viewBox="0 0 24 24"
                fill="none"
              >
                <circle
                  className="opacity-25"
                  cx="12"
                  cy="12"
                  r="10"
                  stroke="currentColor"
                  strokeWidth="4"
                />
                <path
                  className="opacity-75"
                  fill="currentColor"
                  d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z"
                />
              </svg>
              Searching...
            </span>
          ) : (
            "Discover & Audit"
          )}
        </button>

        {totalLeads > 0 && (
          <div className="pt-4 border-t border-gray-700">
            <h3 className="text-xs font-medium text-gray-400 uppercase tracking-wide mb-3">
              Lead Summary
            </h3>
            <div className="space-y-2">
              {Object.entries(leadCounts).map(([label, count]) => (
                <div key={label} className="flex justify-between items-center">
                  <span className="flex items-center gap-2">
                    <span
                      className={`w-2 h-2 rounded-full ${
                        label === "HOT LEAD"
                          ? "bg-red-500"
                          : label === "WARM LEAD"
                          ? "bg-orange-500"
                          : label === "LUKEWARM"
                          ? "bg-yellow-500"
                          : label === "LOW PRIORITY"
                          ? "bg-blue-500"
                          : "bg-gray-500"
                      }`}
                    />
                    <span className="text-xs text-gray-300">{label}</span>
                  </span>
                  <span className="text-xs font-mono text-gray-400">
                    {count}
                  </span>
                </div>
              ))}
              <div className="flex justify-between items-center pt-2 border-t border-gray-700">
                <span className="text-xs text-gray-300 font-medium">
                  Total
                </span>
                <span className="text-xs font-mono text-white">
                  {totalLeads}
                </span>
              </div>
            </div>
          </div>
        )}
      </div>

      <div className="p-4 border-t border-gray-700 text-xs text-gray-500">
        Powered by Claude AI
      </div>
    </aside>
  );
}
