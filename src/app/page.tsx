"use client";

import { useState, useCallback } from "react";
import Sidebar from "@/components/Sidebar";
import LeadTable from "@/components/LeadTable";
import LeadDetail from "@/components/LeadDetail";
import StatusBar from "@/components/StatusBar";
import { Lead } from "@/lib/types";

type Phase = "idle" | "discovering" | "auditing" | "done" | "error";

export default function Home() {
  const [neighborhood, setNeighborhood] = useState("");
  const [category, setCategory] = useState("");
  const [leads, setLeads] = useState<Lead[]>([]);
  const [selectedLead, setSelectedLead] = useState<Lead | null>(null);
  const [phase, setPhase] = useState<Phase>("idle");
  const [statusMessage, setStatusMessage] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSearch = useCallback(async () => {
    if (!neighborhood || !category) return;

    setLoading(true);
    setLeads([]);
    setSelectedLead(null);
    setPhase("discovering");
    setStatusMessage(
      `Finding ${category} in ${neighborhood}...`
    );

    try {
      // Phase 1: Discovery
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

      // Phase 2: Audit
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

      // Sort by AI score ascending (lowest = hottest lead)
      auditedLeads.sort(
        (a: Lead, b: Lead) => (a.aiScore ?? 99) - (b.aiScore ?? 99)
      );

      setLeads(auditedLeads);
      setPhase("done");
      setStatusMessage(
        `Done! Found ${auditedLeads.length} leads for ${category} in ${neighborhood}.`
      );
    } catch (err) {
      setPhase("error");
      setStatusMessage(
        err instanceof Error ? err.message : "Something went wrong."
      );
    } finally {
      setLoading(false);
    }
  }, [neighborhood, category]);

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
      />

      <main className="flex-1 flex flex-col min-h-screen">
        <StatusBar phase={phase} message={statusMessage} />
        <LeadTable
          leads={leads}
          onSelectLead={setSelectedLead}
          selectedLead={selectedLead}
        />
      </main>

      {selectedLead && (
        <LeadDetail
          lead={selectedLead}
          onClose={() => setSelectedLead(null)}
        />
      )}
    </div>
  );
}
