"use client";

import { Lead } from "@/lib/types";

interface LeadDetailProps {
  lead: Lead;
  onClose: () => void;
}

function ScoreBar({ label, score }: { label: string; score: number }) {
  const pct = (score / 10) * 100;
  const color =
    score <= 2
      ? "bg-red-500"
      : score <= 4
      ? "bg-orange-500"
      : score <= 6
      ? "bg-yellow-500"
      : score <= 8
      ? "bg-blue-500"
      : "bg-green-500";

  return (
    <div>
      <div className="flex justify-between text-xs mb-1">
        <span className="text-gray-600">{label}</span>
        <span className="font-mono font-medium">{score}/10</span>
      </div>
      <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
        <div
          className={`h-full rounded-full ${color}`}
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
  );
}

export default function LeadDetail({ lead, onClose }: LeadDetailProps) {
  const categoryColor: Record<string, string> = {
    "HOT LEAD": "bg-red-600",
    "WARM LEAD": "bg-orange-500",
    LUKEWARM: "bg-yellow-500",
    "LOW PRIORITY": "bg-blue-500",
    "DO NOT CONTACT": "bg-gray-400",
  };

  return (
    <div className="w-[420px] border-l border-gray-200 bg-white h-screen overflow-y-auto sticky top-0">
      <div className="p-6">
        {/* Header */}
        <div className="flex items-start justify-between mb-6">
          <div>
            <span
              className={`inline-block px-2 py-0.5 rounded text-xs font-bold text-white mb-2 ${
                categoryColor[lead.leadCategory] || "bg-gray-400"
              }`}
            >
              {lead.leadCategory}
            </span>
            <h2 className="text-lg font-bold text-gray-900">{lead.name}</h2>
            <p className="text-sm text-gray-500">{lead.category}</p>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 p-1"
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Contact Info */}
        <div className="mb-6 space-y-2">
          <div className="flex items-start gap-2 text-sm">
            <span className="text-gray-400 mt-0.5">
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
            </span>
            <span className="text-gray-700">{lead.address}</span>
          </div>
          {lead.phone && (
            <div className="flex items-center gap-2 text-sm">
              <span className="text-gray-400">
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                </svg>
              </span>
              <span className="text-gray-700">{lead.phone}</span>
            </div>
          )}
          {lead.website && (
            <div className="flex items-center gap-2 text-sm">
              <span className="text-gray-400">
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 01-9 9m9-9a9 9 0 00-9-9m9 9H3m9 9a9 9 0 01-9-9m9 9c1.657 0 3-4.03 3-9s-1.343-9-3-9m0 18c-1.657 0-3-4.03-3-9s1.343-9 3-9" />
                </svg>
              </span>
              <a
                href={lead.website}
                target="_blank"
                rel="noopener noreferrer"
                className="text-indigo-600 hover:underline truncate"
              >
                {lead.website}
              </a>
            </div>
          )}
          {lead.instagramHandle && (
            <div className="flex items-center gap-2 text-sm">
              <span className="text-gray-400 font-bold text-xs">IG</span>
              <span className="text-gray-700">{lead.instagramHandle}</span>
            </div>
          )}
        </div>

        {/* Description */}
        <div className="mb-6">
          <p className="text-sm text-gray-600 italic">{lead.description}</p>
        </div>

        {/* AI Visibility Scores */}
        <div className="mb-6">
          <h3 className="text-xs font-medium text-gray-400 uppercase tracking-wide mb-3">
            AI Visibility Scores
          </h3>
          <div className="space-y-3">
            <ScoreBar label="Overall AI Score" score={lead.aiScore} />
            <ScoreBar label="ChatGPT" score={lead.chatGPTScore} />
            <ScoreBar label="Perplexity" score={lead.perplexityScore} />
            <ScoreBar label="Google AI" score={lead.googleAIScore} />
          </div>
        </div>

        {/* Google Reviews */}
        {(lead.googleRating || lead.googleReviewCount) && (
          <div className="mb-6 p-3 bg-gray-50 rounded-lg">
            <h3 className="text-xs font-medium text-gray-400 uppercase tracking-wide mb-2">
              Google Reviews
            </h3>
            <div className="flex items-center gap-4">
              {lead.googleRating && (
                <div>
                  <span className="text-2xl font-bold text-gray-900">
                    {lead.googleRating}
                  </span>
                  <span className="text-sm text-gray-400"> / 5</span>
                </div>
              )}
              {lead.googleReviewCount && (
                <div className="text-sm text-gray-500">
                  {lead.googleReviewCount} reviews
                </div>
              )}
            </div>
          </div>
        )}

        {/* Analysis */}
        <div className="mb-6">
          <h3 className="text-xs font-medium text-gray-400 uppercase tracking-wide mb-2">
            Score Reason
          </h3>
          <p className="text-sm text-gray-700">{lead.scoreReason}</p>
        </div>

        <div className="mb-6">
          <h3 className="text-xs font-medium text-red-400 uppercase tracking-wide mb-2">
            Top Gap
          </h3>
          <p className="text-sm text-gray-700">{lead.topGap}</p>
        </div>

        <div className="mb-6">
          <h3 className="text-xs font-medium text-green-500 uppercase tracking-wide mb-2">
            Quick Win
          </h3>
          <p className="text-sm text-gray-700">{lead.quickWin}</p>
        </div>

        {/* ChatGPT Response Simulation */}
        <div className="mb-6">
          <h3 className="text-xs font-medium text-gray-400 uppercase tracking-wide mb-2">
            ChatGPT Would Say
          </h3>
          <div className="p-3 bg-gray-50 rounded-lg text-sm text-gray-600 italic border-l-4 border-gray-300">
            {lead.chatGPTResponse}
          </div>
        </div>
      </div>
    </div>
  );
}
