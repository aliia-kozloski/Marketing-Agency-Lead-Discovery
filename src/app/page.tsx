"use client";

import { useState, useCallback, useEffect } from "react";
import Sidebar from "@/components/Sidebar";
import LeadTable from "@/components/LeadTable";
import LeadDetail from "@/components/LeadDetail";
import StatusBar from "@/components/StatusBar";
import { Lead } from "@/lib/types";

type Phase = "idle" | "discovering" | "auditing" | "done" | "error";

interface SavedLeadInfo {
  id: number;
  emailStatus: string;
}

export default function Home() {
  const [neighborhood, setNeighborhood] = useState("");
  const [category, setCategory] = useState("");
  const [leads, setLeads] = useState<Lead[]>([]);
  const [selectedLead, setSelectedLead] = useState<Lead | null>(null);
  const [phase, setPhase] = useState<Phase>("idle");
  const [statusMessage, setStatusMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const [savedLeadMap, setSavedLeadMap] = useState<
    Map<string, SavedLeadInfo>
  >(new Map());
  const [outreachStats, setOutreachStats] = useState({
    totalSaved: 0,
    emailsDrafted: 0,
    emailsSent: 0,
  });
  const [emailStatusFilter, setEmailStatusFilter] = useState("");

  // Generate a stable key for a lead
  const leadKey = (lead: { name: string; neighborhood: string; category: string }) =>
    `${lead.name}::${lead.neighborhood}::${lead.category}`;

  // Fetch saved leads on mount and refresh stats
  const refreshSavedLeads = useCallback(async () => {
    try {
      const res = await fetch("/api/leads?statsOnly=true");
      if (res.ok) {
        const { stats } = await res.json();
        setOutreachStats(stats);
      }

      const fullRes = await fetch("/api/leads");
      if (fullRes.ok) {
        const { leads: savedLeads } = await fullRes.json();
        const map = new Map<string, SavedLeadInfo>();
        for (const sl of savedLeads) {
          map.set(leadKey(sl), { id: sl.id, emailStatus: sl.emailStatus });
        }
        setSavedLeadMap(map);
      }
    } catch {
      // Silently fail — stats are non-critical
    }
  }, []);

  useEffect(() => {
    refreshSavedLeads();
  }, [refreshSavedLeads]);

  const handleSearch = useCallback(async () => {
    if (!neighborhood || !category) return;

    setLoading(true);
    setLeads([]);
    setSelectedLead(null);
    setPhase("discovering");
    setStatusMessage(`Finding ${category} in ${neighborhood}...`);

    try {
      const discoverRes = await fetch("/api/discover", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ category, neighborhood }),
      });

      if (!discoverRes.ok) {
        const err = await discoverRes.json();
        throw new Error(err.error || "Discovery failed");
      }

      const { businesses } = await discoverRes.json();

      if (businesses.length === 0) {
        setPhase("done");
        setStatusMessage("No businesses found. Try a different combination.");
        setLoading(false);
        return;
      }

      setStatusMessage(
        `Found ${businesses.length} businesses. Auditing AI visibility...`
      );
      setPhase("auditing");

      const auditRes = await fetch("/api/audit", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ businesses }),
      });

      if (!auditRes.ok) {
        const err = await auditRes.json();
        throw new Error(err.error || "Audit failed");
      }

      const { leads: auditedLeads } = await auditRes.json();

      auditedLeads.sort(
        (a: Lead, b: Lead) => (a.aiScore ?? 99) - (b.aiScore ?? 99)
      );

      setLeads(auditedLeads);
      setPhase("done");
      setStatusMessage(
        `Done! Found ${auditedLeads.length} leads for ${category} in ${neighborhood}.`
      );

      // Refresh saved lead map to show correct saved status
      refreshSavedLeads();
    } catch (err) {
      setPhase("error");
      setStatusMessage(
        err instanceof Error ? err.message : "Something went wrong."
      );
    } finally {
      setLoading(false);
    }
  }, [neighborhood, category, refreshSavedLeads]);

  const handleSaveLead = useCallback(
    async (lead: Lead) => {
      try {
        const res = await fetch("/api/leads", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(lead),
        });

        if (res.status === 409) {
          return { success: false, duplicate: true };
        }

        if (!res.ok) throw new Error("Save failed");

        const { lead: savedLead } = await res.json();
        setSavedLeadMap((prev) => {
          const next = new Map(prev);
          next.set(leadKey(lead), {
            id: savedLead.id,
            emailStatus: savedLead.emailStatus,
          });
          return next;
        });
        refreshSavedLeads();
        return { success: true, savedId: savedLead.id };
      } catch {
        return { success: false, duplicate: false };
      }
    },
    [refreshSavedLeads]
  );

  // Compute lead category counts
  const leadCounts: Record<string, number> = {};
  for (const lead of leads) {
    const cat = lead.leadCategory || "UNKNOWN";
    leadCounts[cat] = (leadCounts[cat] || 0) + 1;
  }

  return (
    <div className="flex min-h-screen bg-white">
      <Sidebar
        neighborhood={neighborhood}
        category={category}
        onNeighborhoodChange={setNeighborhood}
        onCategoryChange={setCategory}
        onSearch={handleSearch}
        loading={loading}
        leadCounts={leadCounts}
        outreachStats={outreachStats}
        emailStatusFilter={emailStatusFilter}
        onEmailStatusFilterChange={setEmailStatusFilter}
      />

      <main className="flex-1 flex flex-col min-h-screen">
        <StatusBar phase={phase} message={statusMessage} />
        <LeadTable
          leads={leads}
          onSelectLead={setSelectedLead}
          selectedLead={selectedLead}
          savedLeadMap={savedLeadMap}
          leadKey={leadKey}
        />
      </main>

      {selectedLead && (
        <LeadDetail
          lead={selectedLead}
          onClose={() => setSelectedLead(null)}
          savedInfo={savedLeadMap.get(leadKey(selectedLead)) || null}
          onSave={handleSaveLead}
          onLeadUpdated={refreshSavedLeads}
        />
      )}
    </div>
  );
}
