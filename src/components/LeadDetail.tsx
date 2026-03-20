"use client";

import { Lead, SavedLeadInfo } from "@/lib/types";
import { useState, useCallback, useEffect } from "react";

interface LeadDetailProps {
  lead: Lead;
  onClose: () => void;
  savedInfo: SavedLeadInfo | null;
  onSave: (lead: Lead) => Promise<{ success: boolean; duplicate?: boolean; savedId?: number }>;
  onLeadUpdated: () => void;
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

function safeHref(url: string | null): string | null {
  if (!url) return null;
  if (url.startsWith("http://") || url.startsWith("https://")) return url;
  return `https://${url}`;
}

export default function LeadDetail({
  lead,
  onClose,
  savedInfo,
  onSave,
  onLeadUpdated,
}: LeadDetailProps) {
  const [saving, setSaving] = useState(false);
  const [saveMessage, setSaveMessage] = useState("");
  const [localSavedInfo, setLocalSavedInfo] = useState<SavedLeadInfo | null>(savedInfo);
  const [emailAddress, setEmailAddress] = useState("");
  const [emailSubject, setEmailSubject] = useState("");
  const [emailBody, setEmailBody] = useState("");
  const [generating, setGenerating] = useState(false);
  const [sending, setSending] = useState(false);
  const [emailError, setEmailError] = useState("");
  const [emailSent, setEmailSent] = useState(savedInfo?.emailStatus === "sent");
  const [showConfirmSend, setShowConfirmSend] = useState(false);

  // Sync localSavedInfo when parent prop changes
  useEffect(() => {
    setLocalSavedInfo(savedInfo);
    setEmailSent(savedInfo?.emailStatus === "sent");
  }, [savedInfo]);

  // Load saved email data when a saved lead is opened
  useEffect(() => {
    if (!savedInfo?.id) return;
    fetch(`/api/leads/${savedInfo.id}`)
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (data?.lead) {
          setEmailAddress(data.lead.emailAddress || "");
          setEmailSubject(data.lead.emailSubject || "");
          setEmailBody(data.lead.emailBody || "");
        }
      })
      .catch(() => {});
  }, [savedInfo?.id]);

  const categoryColor: Record<string, string> = {
    "HOT LEAD": "bg-red-600",
    "WARM LEAD": "bg-orange-500",
    LUKEWARM: "bg-yellow-500",
    "LOW PRIORITY": "bg-blue-500",
    "DO NOT CONTACT": "bg-gray-400",
  };

  const handleSave = useCallback(async () => {
    setSaving(true);
    setSaveMessage("");
    const result = await onSave(lead);
    if (result.success && result.savedId) {
      setLocalSavedInfo({ id: result.savedId, emailStatus: "not_sent" });
      setSaveMessage("Lead saved!");
    } else if (result.duplicate) {
      setSaveMessage("Already saved");
    } else {
      setSaveMessage("Failed to save");
    }
    setSaving(false);
  }, [lead, onSave]);

  const handleSaveDraft = useCallback(async () => {
    if (!localSavedInfo) return;
    try {
      const res = await fetch(`/api/leads/${localSavedInfo.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          emailAddress,
          emailSubject,
          emailBody,
          emailStatus: "draft",
        }),
      });
      if (!res.ok) {
        setEmailError("Failed to save draft");
      }
      onLeadUpdated();
    } catch {
      setEmailError("Failed to save draft");
    }
  }, [localSavedInfo, emailAddress, emailSubject, emailBody, onLeadUpdated]);

  const handleGenerateEmail = useCallback(async () => {
    if (!localSavedInfo) return;
    setGenerating(true);
    setEmailError("");

    // Save email address first
    if (emailAddress) {
      try {
        const patchRes = await fetch(`/api/leads/${localSavedInfo.id}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ emailAddress }),
        });
        if (!patchRes.ok) {
          setEmailError("Failed to save email address");
          setGenerating(false);
          return;
        }
      } catch {
        setEmailError("Failed to save email address");
        setGenerating(false);
        return;
      }
    }

    try {
      const res = await fetch("/api/generate-email", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ leadId: localSavedInfo.id }),
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || "Generation failed");
      }

      const { subject, body } = await res.json();
      setEmailSubject(subject);
      setEmailBody(body);

      // Auto-save draft
      const draftRes = await fetch(`/api/leads/${localSavedInfo.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          emailSubject: subject,
          emailBody: body,
          emailStatus: "draft",
        }),
      });
      if (draftRes.ok) {
        setLocalSavedInfo({ ...localSavedInfo, emailStatus: "draft" });
      }
      onLeadUpdated();
    } catch (err) {
      setEmailError(
        err instanceof Error ? err.message : "Failed to generate email"
      );
    } finally {
      setGenerating(false);
    }
  }, [localSavedInfo, emailAddress, onLeadUpdated]);

  const handleSendEmail = useCallback(async () => {
    if (!localSavedInfo) return;
    setSending(true);
    setEmailError("");
    setShowConfirmSend(false);

    await handleSaveDraft();

    try {
      const res = await fetch("/api/send-email", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ leadId: localSavedInfo.id }),
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || "Send failed");
      }

      setEmailSent(true);
      setLocalSavedInfo({ ...localSavedInfo, emailStatus: "sent" });
      onLeadUpdated();
    } catch (err) {
      setEmailError(
        err instanceof Error ? err.message : "Failed to send email"
      );
    } finally {
      setSending(false);
    }
  }, [localSavedInfo, handleSaveDraft, onLeadUpdated]);

  const isSaved = !!localSavedInfo;
  const hasEmail = emailAddress.trim().length > 0;
  const hasDraft = emailSubject.length > 0 && emailBody.length > 0;
  const websiteHref = safeHref(lead.website);

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

        {/* Save Lead Button */}
        <div className="mb-6">
          {!isSaved ? (
            <button
              onClick={handleSave}
              disabled={saving}
              className="w-full bg-indigo-600 hover:bg-indigo-500 disabled:bg-gray-300 text-white font-medium py-2 px-4 rounded-lg text-sm transition-colors"
            >
              {saving ? "Saving..." : "Save Lead to Pipeline"}
            </button>
          ) : (
            <div className="flex items-center gap-2 text-sm text-green-600 bg-green-50 rounded-lg px-3 py-2">
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
              Lead saved
            </div>
          )}
          {saveMessage && !isSaved && (
            <p className="text-xs text-gray-500 mt-1 text-center">{saveMessage}</p>
          )}
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
          {websiteHref && (
            <div className="flex items-center gap-2 text-sm">
              <span className="text-gray-400">
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 01-9 9m9-9a9 9 0 00-9-9m9 9H3m9 9a9 9 0 01-9-9m9 9c1.657 0 3-4.03 3-9s-1.343-9-3-9m0 18c-1.657 0-3-4.03-3-9s1.343-9 3-9" />
                </svg>
              </span>
              <a
                href={websiteHref}
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
                  <span className="text-2xl font-bold text-gray-900">{lead.googleRating}</span>
                  <span className="text-sm text-gray-400"> / 5</span>
                </div>
              )}
              {lead.googleReviewCount && (
                <div className="text-sm text-gray-500">{lead.googleReviewCount} reviews</div>
              )}
            </div>
          </div>
        )}

        {/* Analysis */}
        <div className="mb-6">
          <h3 className="text-xs font-medium text-gray-400 uppercase tracking-wide mb-2">Score Reason</h3>
          <p className="text-sm text-gray-700">{lead.scoreReason}</p>
        </div>
        <div className="mb-6">
          <h3 className="text-xs font-medium text-red-400 uppercase tracking-wide mb-2">Top Gap</h3>
          <p className="text-sm text-gray-700">{lead.topGap}</p>
        </div>
        <div className="mb-6">
          <h3 className="text-xs font-medium text-green-500 uppercase tracking-wide mb-2">Quick Win</h3>
          <p className="text-sm text-gray-700">{lead.quickWin}</p>
        </div>

        {/* ChatGPT Response Simulation */}
        <div className="mb-6">
          <h3 className="text-xs font-medium text-gray-400 uppercase tracking-wide mb-2">ChatGPT Would Say</h3>
          <div className="p-3 bg-gray-50 rounded-lg text-sm text-gray-600 italic border-l-4 border-gray-300">
            {lead.chatGPTResponse}
          </div>
        </div>

        {/* Email Outreach Section */}
        {isSaved && (
          <div className="border-t border-gray-200 pt-6">
            <h3 className="text-xs font-medium text-gray-400 uppercase tracking-wide mb-3">
              Email Outreach
            </h3>

            {emailSent ? (
              <div className="bg-green-50 rounded-lg p-4 text-center">
                <svg className="w-8 h-8 text-green-500 mx-auto mb-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <p className="text-sm font-medium text-green-800">Email sent!</p>
              </div>
            ) : (
              <>
                <div className="mb-3">
                  <label className="block text-xs text-gray-500 mb-1">Email address</label>
                  <input
                    type="email"
                    value={emailAddress}
                    onChange={(e) => setEmailAddress(e.target.value)}
                    placeholder="owner@business.com"
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none"
                  />
                </div>

                <button
                  onClick={handleGenerateEmail}
                  disabled={!hasEmail || generating}
                  className="w-full bg-purple-600 hover:bg-purple-500 disabled:bg-gray-300 disabled:text-gray-500 text-white font-medium py-2 px-4 rounded-lg text-sm transition-colors mb-3"
                >
                  {generating ? (
                    <span className="flex items-center justify-center gap-2">
                      <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24" fill="none">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z" />
                      </svg>
                      Generating...
                    </span>
                  ) : hasDraft ? (
                    "Regenerate Email"
                  ) : (
                    "Generate Email"
                  )}
                </button>

                {!hasEmail && (
                  <p className="text-xs text-gray-400 mb-3 text-center">
                    Enter an email address to generate outreach email
                  </p>
                )}

                {emailError && (
                  <p className="text-xs text-red-500 mb-3">{emailError}</p>
                )}

                {hasDraft && (
                  <div className="space-y-3">
                    <div>
                      <label className="block text-xs text-gray-500 mb-1">Subject</label>
                      <input
                        type="text"
                        value={emailSubject}
                        onChange={(e) => setEmailSubject(e.target.value)}
                        onBlur={handleSaveDraft}
                        className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none"
                      />
                    </div>
                    <div>
                      <label className="block text-xs text-gray-500 mb-1">Body</label>
                      <textarea
                        value={emailBody}
                        onChange={(e) => setEmailBody(e.target.value)}
                        onBlur={handleSaveDraft}
                        rows={10}
                        className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none resize-y"
                      />
                    </div>

                    {showConfirmSend ? (
                      <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3">
                        <p className="text-xs text-yellow-800 mb-2">
                          Send this email to <strong>{emailAddress}</strong>?
                        </p>
                        <div className="flex gap-2">
                          <button
                            onClick={handleSendEmail}
                            disabled={sending}
                            className="flex-1 bg-green-600 hover:bg-green-500 text-white font-medium py-1.5 px-3 rounded text-xs transition-colors"
                          >
                            {sending ? "Sending..." : "Confirm Send"}
                          </button>
                          <button
                            onClick={() => setShowConfirmSend(false)}
                            className="flex-1 bg-gray-200 hover:bg-gray-300 text-gray-700 font-medium py-1.5 px-3 rounded text-xs transition-colors"
                          >
                            Cancel
                          </button>
                        </div>
                      </div>
                    ) : (
                      <button
                        onClick={() => setShowConfirmSend(true)}
                        disabled={!hasEmail || !hasDraft || sending}
                        className="w-full bg-green-600 hover:bg-green-500 disabled:bg-gray-300 disabled:text-gray-500 text-white font-medium py-2 px-4 rounded-lg text-sm transition-colors"
                      >
                        Send Email
                      </button>
                    )}
                  </div>
                )}
              </>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
