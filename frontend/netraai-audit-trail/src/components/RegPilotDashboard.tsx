import { useState, useEffect } from "react";
import { 
  FileText, Search, Play, Pause, RefreshCw, 
  CheckCircle, AlertTriangle, AlertCircle, 
  HelpCircle, ChevronRight, CheckSquare, 
  ArrowUpRight, BarChart2, ShieldCheck, ListTodo, ShieldAlert,
  X, Activity
} from "lucide-react";
import { 
  CircularItem, CircularDetails, MAPItem, 
  ComplianceDashboardData, DeptStats 
} from "../types";

interface RegPilotProps {
  apiBase: string;
  onAddLog: (newLog: any) => void;
}

export default function RegPilotDashboard({ apiBase, onAddLog }: RegPilotProps) {
  // Navigation states inside RegPilot
  const [activeSubTab, setActiveSubTab] = useState<"SCORECARD" | "CIRCULARS" | "MAPS" | "DEADLINES">("SCORECARD");
  const [deadlinesData, setDeadlinesData] = useState<any|null>(null);
  const deadlinesRef = (el: any) => { if (el) { /* placeholder for scrolling */ } };
  
  // Data states
  const [dashboardData, setDashboardData] = useState<ComplianceDashboardData | null>(null);
  const [circulars, setCirculars] = useState<CircularItem[]>([]);
  const [selectedCircular, setSelectedCircular] = useState<CircularDetails | null>(null);
  const [maps, setMaps] = useState<MAPItem[]>([]);
  const [selectedDept, setSelectedDept] = useState<string>("compliance");
  const [mapFilterStatus, setMapFilterStatus] = useState<string>("all");
  const [isBackendConnected, setIsBackendConnected] = useState(false);

  // Scraper states
  const [crawling, setCrawling] = useState(false);
  const [crawlStatus, setCrawlStatus] = useState("");
  const [crawlResult, setCrawlResult] = useState<string | null>(null);
  const [agentStatus, setAgentStatus] = useState<{
    scheduler_running: boolean;
    next_run: string | null;
    last_run: string | null;
    total_autonomous_runs: number;
  } | null>(null);

  // Evidence validation states
  const [submittingEvidenceId, setSubmittingEvidenceId] = useState<string | null>(null);
  const [evidenceText, setEvidenceText] = useState<string>("");
  const [validationOutput, setValidationOutput] = useState<Record<string, any>>({});

  const loadData = async () => {
    try {
      // Test backend connection and load dashboard statistics
      const dashRes = await fetch(`${apiBase}/regpilot/dashboard`);
      if (dashRes.ok) {
        const dashData = await dashRes.json();
        setDashboardData(dashData);
        setIsBackendConnected(true);
      }

      // Load circulars list
      const circRes = await fetch(`${apiBase}/regpilot/circulars`);
      if (circRes.ok) {
        const circData = await circRes.json();
        setCirculars(circData);
      }

      // Load MAPs list
      const mapRes = await fetch(`${apiBase}/regpilot/maps`);
      if (mapRes.ok) {
        const mapData = await mapRes.json();
        setMaps(mapData);
      }
      // Load deadlines
      try {
        const dlRes = await fetch(`${apiBase}/regpilot/deadlines`);
        if (dlRes.ok) {
          setDeadlinesData(await dlRes.json());
        }
      } catch (e) {
        console.warn("Failed to fetch deadlines", e);
      }

      // Load RegPilot autonomous agent status
      try {
        const statusRes = await fetch(`${apiBase}/regpilot/agent-status`);
        if (statusRes.ok) {
          setAgentStatus(await statusRes.json());
        }
      } catch (e) {
        console.warn("Failed to load RegPilot agent status", e);
      }
    } catch (e) {
      console.log("[RegPilot] Backend down, triggering offline simulated dataset.");
      setIsBackendConnected(false);
      setupMockData();
    }
  };

  // Mock data setup if backend is unreachable
  const setupMockData = () => {
    if (circulars.length > 0) return;

    // Mock dashboard metrics
    const mockDash: ComplianceDashboardData = {
      overall_compliance_score: 66.7,
      total_maps: 15,
      completed_maps: 10,
      open_maps: 3,
      in_progress_maps: 2,
      total_circulars: 3,
      high_priority_open: 2,
      medium_priority_open: 1,
      departments: {
        credit: { total: 2, completed: 1, in_progress: 1, open: 0, high_priority_open: 0, compliance_score: 50.0 },
        treasury: { total: 2, completed: 1, in_progress: 0, open: 1, high_priority_open: 1, compliance_score: 50.0 },
        retail: { total: 3, completed: 2, in_progress: 0, open: 1, high_priority_open: 0, compliance_score: 66.7 },
        AML: { total: 2, completed: 2, in_progress: 0, open: 0, high_priority_open: 0, compliance_score: 100.0 },
        IT: { total: 3, completed: 2, in_progress: 1, open: 0, high_priority_open: 0, compliance_score: 66.7 },
        compliance: { total: 3, completed: 2, in_progress: 0, open: 1, high_priority_open: 1, compliance_score: 66.7 }
      }
    };
    setDashboardData(mockDash);

    // Mock circulars list
    const mockCircs: CircularItem[] = [
      { id: "c-mock-1", source: "RBI", title: "Master Direction on KYC — Amendment No. 7 (2024)", url: "https://rbi.org.in/scripts/12601", published_at: new Date(Date.now() - 3600000 * 48).toISOString(), fetched_at: new Date().toISOString(), is_processed: true },
      { id: "c-mock-2", source: "SEBI", title: "Circular on Cybersecurity and Cyber Resilience Framework", url: "https://sebi.gov.in/cybersecurity", published_at: new Date(Date.now() - 3600000 * 96).toISOString(), fetched_at: new Date().toISOString(), is_processed: true },
      { id: "c-mock-3", source: "IRDAI", title: "Guidelines on Data Privacy and Information Security", url: "https://irdai.gov.in/privacy", published_at: new Date(Date.now() - 3600000 * 120).toISOString(), fetched_at: new Date().toISOString(), is_processed: true }
    ];
    setCirculars(mockCircs);

    // Mock MAPs list
    const mockMaps: MAPItem[] = [
      { id: "m-mock-1", circular_id: "c-mock-1", title: "Revise customer onboarding workflows for video KYC", description: "The credit department must revise customer onboarding workflows to incorporate video-based KYC.", department: "credit", deadline: "Within 90 days", priority: "medium", status: "in_progress", validated: false, evidence: null, created_at: new Date().toISOString(), updated_at: null },
      { id: "m-mock-2", circular_id: "c-mock-1", title: "Implement automated digital KYC integrated with UIDAI", description: "The IT department must implement automated digital KYC verification systems integrated with UIDAI by 31st March 2025. All manual processes retired.", department: "IT", deadline: "31st March 2025", priority: "high", status: "completed", validated: true, evidence: "Completed digital KYC integration. API endpoint secured with HSM certificate.", created_at: new Date().toISOString(), updated_at: null },
      { id: "m-mock-3", circular_id: "c-mock-1", title: "Retrain branch staff on updated KYC procedures", description: "The retail department must retrain all branch staff on updated KYC procedures.", department: "retail", deadline: "Within 45 days", priority: "medium", status: "completed", validated: true, evidence: "Conducted training on 12th April. Attended by 180 staff members. Certificates issued.", created_at: new Date().toISOString(), updated_at: null },
      { id: "m-mock-4", circular_id: "c-mock-2", title: "Appoint Chief Information Security Officer (CISO)", description: "All registered entities must appoint a Chief Information Security Officer (CISO) within 30 days reporting directly to the Board.", department: "compliance", deadline: "Within 30 days", priority: "high", status: "open", validated: false, evidence: null, created_at: new Date().toISOString(), updated_at: null },
      { id: "m-mock-5", circular_id: "c-mock-2", title: "Encrypt transaction data using AES-256", description: "The treasury department must ensure all financial transaction data is encrypted using AES-256 or equivalent standards within 60 days.", department: "treasury", deadline: "Within 60 days", priority: "high", status: "open", validated: false, evidence: null, created_at: new Date().toISOString(), updated_at: null }
    ];
    setMaps(mockMaps);
  };

  useEffect(() => {
    loadData();
  }, [apiBase]);

  const formatNextRun = (value: string | null) => {
    if (!value) return "pending";
    try {
      return new Date(value).toLocaleString();
    } catch {
      return value;
    }
  };

  // Scrape portal crawler trigger
  const handleCrawlPortals = async () => {
    setCrawling(true);
    setCrawlResult(null);
    setCrawlStatus("Scraping regulatory notices RBI...");
    
    const steps = [
      "Connecting to RBI Gazette Feed...",
      "Scraping MCA21 notifications...",
      "Parsing RBI circulars using Microsoft Phi-3 Mini...",
      "Extracting Measurable Action Points (MAPs)...",
      "Routing MAPs to compliance, IT, and retail departments..."
    ];

    let i = 0;
    const interval = setInterval(() => {
      if (i < steps.length) {
        setCrawlStatus(steps[i]);
        i++;
      } else {
        clearInterval(interval);
      }
    }, 800);

    try {
      const res = await fetch(`${apiBase}/regpilot/fetch`, { method: "POST" });
      clearInterval(interval);
      if (res.ok) {
        const result = await res.json();
        setCrawlResult(`Success! Crawled ${result.new_circulars} new circulars and generated ${result.maps_generated} Measurable Action Points.`);
        
        onAddLog({
          vector: "DATA_INGEST",
          vectorCategory: "API",
          entityHash: "REGPILOT-CRAWLER",
          payload: `Regulatory crawler execution: fetched ${result.new_circulars} circulars, created ${result.maps_generated} MAP tasks.`,
          details: {
            origin: "RegPilot-Autonomous-Crawler",
            latencyMs: 4200,
            payloadJson: JSON.stringify(result, null, 2)
          }
        });

        loadData();
      } else {
        throw new Error("HTTP scrape error");
      }
    } catch (e) {
      clearInterval(interval);
      console.log("[RegPilot] Offline crawler fallback triggered.");
      
      // Simulate offline fetch additions
      setTimeout(() => {
        setCrawlResult("Offline Simulation: Crawled 1 new circular (RBI stressed assets resolution update) and generated 2 department action points.");
        
        const newCirc: CircularItem = {
          id: `c-mock-new-${Date.now()}`,
          source: "RBI",
          title: "Prudential Framework for Resolution of Stressed Assets — Update 2024",
          url: "https://rbi.org.in/scripts/12700",
          published_at: new Date().toISOString(),
          fetched_at: new Date().toISOString(),
          is_processed: true
        };

        const newMAPs: MAPItem[] = [
          {
            id: `m-mock-new-1-${Date.now()}`,
            circular_id: newCirc.id,
            title: "SMA account classification and reporting to CRILC",
            description: "The credit department must classify all accounts with principal or interest overdue for more than 30 days as Special Mention Accounts (SMA) and report to CRILC within 30 days.",
            department: "credit",
            deadline: "Within 30 days",
            priority: "high",
            status: "open",
            validated: false,
            evidence: null,
            created_at: new Date().toISOString(),
            updated_at: null
          },
          {
            id: `m-mock-new-2-${Date.now()}`,
            circular_id: newCirc.id,
            title: "Automate daily Early Warning System (EWS) feeds",
            description: "Banks must implement an automated Early Warning System (EWS) for all borrower accounts with exposure above ₹5 Crore. IT department must ensure EWS data feeds automated and updated daily.",
            department: "IT",
            deadline: "Within 90 days",
            priority: "medium",
            status: "open",
            validated: false,
            evidence: null,
            created_at: new Date().toISOString(),
            updated_at: null
          }
        ];

        setCirculars(prev => [newCirc, ...prev]);
        setMaps(prev => [...newMAPs, ...prev]);
        setDashboardData(prev => {
          if (!prev) return null;
          return {
            ...prev,
            total_maps: prev.total_maps + 2,
            open_maps: prev.open_maps + 2,
            total_circulars: prev.total_circulars + 1,
            high_priority_open: prev.high_priority_open + 1,
            medium_priority_open: prev.medium_priority_open + 1,
            departments: {
              ...prev.departments,
              credit: {
                ...prev.departments.credit,
                total: prev.departments.credit.total + 1,
                open: prev.departments.credit.open + 1,
                compliance_score: Math.round((prev.departments.credit.completed / (prev.departments.credit.total + 1)) * 1000) / 10
              },
              IT: {
                ...prev.departments.IT,
                total: prev.departments.IT.total + 1,
                open: prev.departments.IT.open + 1,
                compliance_score: Math.round((prev.departments.IT.completed / (prev.departments.IT.total + 1)) * 1000) / 10
              }
            }
          };
        });

        onAddLog({
          vector: "DATA_INGEST",
          vectorCategory: "API",
          entityHash: "REGPILOT-CRAWLER",
          payload: `[Simulated] Crawler: fetched circular: Stressed Assets Resolution Update. Created 2 MAP tasks.`,
          details: {
            origin: "RegPilot-Scrape-Simulator",
            latencyMs: 1200,
            payloadJson: JSON.stringify({ circular: newCirc, maps: newMAPs }, null, 2)
          }
        });
      }, 1500);
    } finally {
      setTimeout(() => {
        setCrawling(false);
      }, 1800);
    }
  };

  // Select a circular for full text display
  const handleSelectCircular = async (circId: string) => {
    if (circId.startsWith("c-mock-")) {
      // Mock details
      const matched = circulars.find(c => c.id === circId);
      const circMaps = maps.filter(m => m.circular_id === circId);
      if (matched) {
        let text = "Reserve Bank of India regulatory details circular.";
        if (circId === "c-mock-1") {
          text = `Reserve Bank of India — Master Direction on Know Your Customer (KYC) — Amendment No. 7\n\nAll Regulated Entities (REs) are hereby directed as follows:\n\n1. The credit department must revise customer onboarding workflows to incorporate video-based KYC within 90 days of this circular.\n\n2. The IT department must implement automated digital KYC verification systems integrated with UIDAI by 31st March 2025. All existing manual processes must be retired.`;
        } else if (circId === "c-mock-2") {
          text = `Securities and Exchange Board of India — Cybersecurity and Cyber Resilience Framework\n\nIn exercise of powers conferred under Section 11 of the SEBI Act, 1992:\n\n1. All registered entities must implement a comprehensive Cybersecurity Framework within 180 days.\n\n2. All entities must appoint a Chief Information Security Officer (CISO) within 30 days reporting directly to the Board of Directors.`;
        }

        setSelectedCircular({
          ...matched,
          raw_text: text,
          maps: circMaps
        });
      }
      return;
    }

    try {
      const res = await fetch(`${apiBase}/regpilot/circulars/${circId}`);
      if (res.ok) {
        const data = await res.json();
        setSelectedCircular(data);
      }
    } catch (e) {
      console.error("Failed to load circular details", e);
    }
  };

  // Submit MAP evidence text for autonomous validation
  const handleValidateEvidence = async (mapId: string) => {
    if (!evidenceText.trim()) return;

    setValidationOutput(prev => ({
      ...prev,
      [mapId]: { status: "VALIDATING", message: "Evaluating evidence against regulatory requirement..." }
    }));

    try {
      const res = await fetch(`${apiBase}/regpilot/maps/${mapId}/validate`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ evidence: evidenceText })
      });

      if (res.ok) {
        const valData = await res.json();
        setValidationOutput(prev => ({
          ...prev,
          [mapId]: valData.validation
        }));

        onAddLog({
          vector: "VAL_CHECK",
          vectorCategory: "AI",
          entityHash: `MAP-${mapId.substring(0, 8).toUpperCase()}`,
          payload: `Evidence validated for MAP: ${valData.map_title} (Status: ${valData.validation.status})`,
          details: {
            origin: "RegPilot-Evidence-Validator",
            latencyMs: 1450,
            payloadJson: JSON.stringify(valData, null, 2)
          }
        });

        loadData();
        setEvidenceText("");
        setSubmittingEvidenceId(null);
      } else {
        throw new Error("Validation HTTP error");
      }
    } catch (e) {
      console.log("[RegPilot] Offline evidence validation triggered.");
      
      // Local simulated validation parser fallback
      setTimeout(() => {
        const wordCount = evidenceText.split(/\s+/).length;
        const targetMap = maps.find(m => m.id === mapId);
        let status: "VALIDATED" | "PARTIAL" | "INSUFFICIENT" = "VALIDATED";
        let message = "Evidence adequately addresses the regulatory requirement.";
        let score = 92;
        let gaps: string[] = [];

        if (wordCount < 10) {
          status = "INSUFFICIENT";
          message = "Evidence is too brief. Please provide detailed implementation records.";
          score = 25;
          gaps = ["Specify action names and integration systems", "Include reference dates or HSM identifiers", "Minimum 15 words required"];
        } else if (evidenceText.toLowerCase().includes("plan") || evidenceText.toLowerCase().includes("work in progress")) {
          status = "PARTIAL";
          message = "Evidence shows partial implementation. Board-approved policy document confirmation is required.";
          score = 60;
          gaps = ["Submit signed audit/completion certificate", "Provide production URL or deployment proof"];
        }

        const simOutput = {
          status: status,
          message: message,
          score: score,
          gaps: gaps,
          method: "rule-based [Simulated]"
        };

        setValidationOutput(prev => ({
          ...prev,
          [mapId]: simOutput
        }));

        if (status === "VALIDATED") {
          // Update local maps state
          setMaps(prev => prev.map(m => {
            if (m.id === mapId) {
              return { ...m, status: "completed", validated: true, evidence: evidenceText };
            }
            return m;
          }));

          // Recalculate compliance scorecard values
          setDashboardData(prev => {
            if (!prev) return null;
            const targetDept = targetMap?.department || "compliance";
            const currentDeptStats = prev.departments[targetDept];
            
            const updatedDeptStats: DeptStats = {
              ...currentDeptStats,
              completed: currentDeptStats.completed + 1,
              open: Math.max(0, currentDeptStats.open - 1),
              compliance_score: Math.round(((currentDeptStats.completed + 1) / currentDeptStats.total) * 1000) / 10
            };

            const totalCompleted = prev.completed_maps + 1;

            return {
              ...prev,
              completed_maps: totalCompleted,
              open_maps: Math.max(0, prev.open_maps - 1),
              overall_compliance_score: Math.round((totalCompleted / prev.total_maps) * 1000) / 10,
              departments: {
                ...prev.departments,
                [targetDept]: updatedDeptStats
              }
            };
          });

          onAddLog({
            vector: "VAL_CHECK",
            vectorCategory: "AI",
            entityHash: `MAP-${mapId.substring(0, 8).toUpperCase()}`,
            payload: `[Simulated] Evidence validated: ${targetMap?.title || "MAP"}. Score: ${score}% (VALIDATED)`,
            details: {
              origin: "RegPilot-Validation-Simulator",
              latencyMs: 450,
              payloadJson: JSON.stringify({ map_id: mapId, validation: simOutput }, null, 2)
            }
          });
          
          setEvidenceText("");
          setSubmittingEvidenceId(null);
        }
      }, 1200);
    }
  };

  const departmentColors: Record<string, string> = {
    credit: "bg-[#0055ff]/10 border-[#0055ff] text-[#0055ff]",
    treasury: "bg-[#ff9900]/10 border-[#ff9900] text-[#ff9900]",
    retail: "bg-[#2e7d32]/10 border-[#2e7d32] text-[#2e7d32]",
    AML: "bg-[#e63b2e]/10 border-[#e63b2e] text-[#e63b2e]",
    IT: "bg-[#ab47bc]/10 border-[#ab47bc] text-[#ab47bc]",
    compliance: "bg-[#1a1a1a]/10 border-[#1a1a1a] text-[#1a1a1a]"
  };

  return (
    <div className="space-y-6 select-none animate-fadeIn">
      
      {/* Title block */}
      <div className="bg-[#1a1a1a] text-[#ffffff] p-6 border-4 border-[#1a1a1a] [box-shadow:4px_4px_0px_#1a1a1a] flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <nav className="flex items-center gap-2 text-[#ffcc00] font-mono text-xs uppercase font-extrabold tracking-wider mb-1">
            <span>RegPilot</span>
            <span>/</span>
            <span className="text-[#ffffff]">Compliance Intelligence Agent</span>
          </nav>
          <h2 className="font-[Space Grotesk] text-4xl font-black uppercase tracking-tight">RegPilot Dashboard</h2>
          <p className="font-mono text-xs text-[#ffcc00] uppercase font-bold mt-0.5">
            Autonomous circular crawlers, department routing, and evidence validation audit trails
          </p>
        </div>
        
        {/* Scraper Trigger control button */}
        <div className="flex items-center gap-3">
          <button
            onClick={handleCrawlPortals}
            disabled={crawling}
            className="bg-[#ffcc00] text-[#1a1a1a] font-[Space Grotesk] font-black uppercase text-xs px-5 py-2.5 border-4 border-[#1a1a1a] [box-shadow:3px_3px_0px_#1a1a1a] hover:-translate-y-0.5 active:translate-y-0.5 active:shadow-none transition-all cursor-pointer disabled:opacity-50"
          >
            {crawling ? (
              <div className="flex items-center gap-2">
                <RefreshCw size={14} className="animate-spin stroke-[3]" />
                <span>Scraping Portals...</span>
              </div>
            ) : (
              <span>Crawl Services(demo)</span>
            )}
          </button>

          <span className="bg-white border-2 border-black text-black text-[11px] font-black uppercase px-2 py-0.5">POWERED BY MICROSOFT PHI-3 MINI</span>
        </div>
      </div>

      {agentStatus && (
        <div className="flex items-center justify-end gap-2 px-6">
          <span className="relative inline-flex items-center gap-2 rounded-[14px] border-2 border-black bg-black px-3 py-2 text-[12px] font-black uppercase text-white tracking-[0.12em]">
            <span className="h-2.5 w-2.5 rounded-full bg-[#00ff55] border border-black shadow-[0_0_0_2px_rgba(0,0,0,0.15)] animate-pulse" />
            🤖 AGENT ACTIVE — Next check: {formatNextRun(agentStatus.next_run)}
          </span>
        </div>
      )
      }

      {/* Crawling loader details overlay */}
      {crawling && (
        <div className="bg-[#ffcc00]/10 border-4 border-[#1a1a1a] p-4 font-mono text-xs font-black text-[#1a1a1a] uppercase [box-shadow:2.5px_2.5px_0px_#1a1a1a] flex items-center justify-between animate-pulse">
          <div className="flex items-center gap-3">
            <RefreshCw size={16} className="animate-spin text-[#1a1a1a] stroke-[2.5]" />
            <span>Agent Action: {crawlStatus}</span>
          </div>
          <span className="bg-white text-black px-2 py-0.5 border-2 border-black text-[10px] font-black">POWERED BY MICROSOFT PHI-3 MINI</span>
        </div>
      )}

      {crawlResult && (
        <div className="bg-[#2e7d32]/10 border-4 border-[#1a1a1a] p-4 font-mono text-xs font-black text-[#2e7d32] uppercase [box-shadow:2.5px_2.5px_0px_#1a1a1a] flex items-center justify-between">
          <div className="flex items-center gap-2">
            <CheckCircle size={16} />
            <span>{crawlResult}</span>
          </div>
          <button onClick={() => setCrawlResult(null)} className="text-gray-500 hover:text-red-500 font-bold">
            <X size={16} />
          </button>
        </div>
      )}

      {/* Critical Alerts Banner (top) - shows when overdue or critical exist */}
      {deadlinesData && ( (deadlinesData.summary?.overdue || deadlinesData.summary?.critical) ) && (
        <div onClick={() => {
            // scroll to deadlines tab section
            setActiveSubTab("DEADLINES");
            const el = document.getElementById('regpilot-deadlines-section');
            if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' });
          }}
          className="cursor-pointer bg-[#e63b2e] text-white p-3 border-4 border-black [box-shadow:6px_6px_0px_#000] font-black text-center"
        >
          🚨 CRITICAL COMPLIANCE ALERT — {deadlinesData.summary.overdue} overdue MAPs, {deadlinesData.summary.critical} due within 7 days
        </div>
      )}

      {/* RegPilot sub-tabs navigation */}
      <div className="flex gap-3 border-b-4 border-[#1a1a1a] pb-1">
        {[
          { id: "SCORECARD", label: "Compliance Scorecard", icon: <BarChart2 size={16} /> },
          { id: "CIRCULARS", label: "Circular Documents", icon: <FileText size={16} /> },
          { id: "MAPS", label: "Department Checklists", icon: <ListTodo size={16} /> },
          { id: "DEADLINES", label: "Deadlines", icon: <ShieldAlert size={16} /> }
        ].map(t => (
          <button
            key={t.id}
            onClick={() => setActiveSubTab(t.id as any)}
            className={`px-4 py-2 border-2 border-b-0 border-[#1a1a1a] font-[Space Grotesk] text-xs uppercase font-black cursor-pointer transition-all flex items-center gap-2 ${
              activeSubTab === t.id
                ? "bg-[#1a1a1a] text-[#ffffff] [box-shadow:2.5px_-2.5px_0px_#1a1a1a]"
                : "bg-[#f5f0e8] text-[#1a1a1a] hover:bg-[#ffcc00]/25"
            }`}
          >
            {t.icon}
            <span>{t.label}</span>
          </button>
        ))}
      </div>

      {/* ========================================================= */}
      {/* 1. SCORECARD TAB */}
      {/* ========================================================= */}
      {activeSubTab === "SCORECARD" && dashboardData && (
        <div className="space-y-6">
          {/* Main scorecard display */}
          <div className="bg-[#ffffff] border-4 border-[#1a1a1a] p-6 [box-shadow:4px_4px_0px_#1a1a1a] grid grid-cols-1 md:grid-cols-4 gap-6">
            
            <div className="md:col-span-1 border-r-0 md:border-r-4 border-dashed border-[#1a1a1a] pr-0 md:pr-6 text-center md:text-left flex flex-col justify-between">
              <div>
                <span className="font-mono text-[9px] text-gray-500 font-black uppercase tracking-tight">
                  Overall Compliance Rating
                </span>
                <p className="font-[Space Grotesk] text-6.5xl font-black text-[#0055ff] leading-none mt-2">
                  {dashboardData.overall_compliance_score}%
                </p>
              </div>
              <div className="h-4 bg-gray-100 border-2 border-[#1a1a1a] mt-4 relative">
                <div className="h-full bg-[#0055ff] border-r-2 border-[#1a1a1a]" style={{ width: `${dashboardData.overall_compliance_score}%` }}></div>
              </div>
            </div>

            <div className="md:col-span-3 grid grid-cols-2 sm:grid-cols-4 gap-4">
              {[
                { label: "TOTAL CRAWLED CIRCULARS", val: dashboardData.total_circulars, col: "text-[#1a1a1a]" },
                { label: "ACTION POINTS COMPLETED", val: `${dashboardData.completed_maps}/${dashboardData.total_maps}`, col: "text-[#2e7d32]" },
                { label: "HIGH PRIORITY PENDING", val: dashboardData.high_priority_open, col: "text-[#e63b2e]" },
                { label: "IN PROGRESS TASKS", val: dashboardData.in_progress_maps, col: "text-[#ff9900]" }
              ].map((m, i) => (
                <div key={i} className="bg-[#f5f0e8] border-2 border-[#1a1a1a] p-3 flex flex-col justify-between [box-shadow:2px_2px_0px_#1a1a1a]">
                  <span className="font-mono text-[9px] font-black text-gray-500 uppercase tracking-tight leading-tight mb-1">
                    {m.label}
                  </span>
                  <span className={`font-[Space Grotesk] text-2xl font-black leading-none ${m.col}`}>
                    {m.val}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Department-wise Heatmap Matrix grid */}
          <div className="space-y-3">
            <h3 className="font-[Space Grotesk] text-base font-black uppercase text-[#1a1a1a] border-b-2 border-[#1a1a1a] pb-1.5">
              Department Compliance Heatmap
            </h3>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {(Object.entries(dashboardData.departments) as [string, DeptStats][]).map(([dept, dstats]) => {
                const badgeStyle = departmentColors[dept] || "border-[#1a1a1a] text-[#1a1a1a] bg-white";
                return (
                  <div key={dept} className="bg-[#ffffff] border-4 border-[#1a1a1a] p-4 [box-shadow:4px_4px_0px_#1a1a1a] flex flex-col justify-between">
                    <div>
                      <div className="flex justify-between items-center mb-3">
                        <span className={`font-mono text-[10px] font-black border-2 px-2 py-0.5 uppercase tracking-wide ${badgeStyle}`}>
                          {dept}
                        </span>
                        <span className="font-[Space Grotesk] text-xl font-black text-[#1a1a1a]">
                          {dstats.compliance_score}%
                        </span>
                      </div>
                      
                      {/* Stats details */}
                      <div className="space-y-1.5 font-mono text-[10px] text-gray-600 font-bold border-b border-gray-100 pb-2 mb-3">
                        <div className="flex justify-between">
                          <span>Total Assigned Actions:</span>
                          <span className="text-[#1a1a1a]">{dstats.total}</span>
                        </div>
                        <div className="flex justify-between">
                          <span>Completed Tasks:</span>
                          <span className="text-[#2e7d32]">{dstats.completed}</span>
                        </div>
                        <div className="flex justify-between">
                          <span>High Priority Open:</span>
                          <span className="text-[#e63b2e]">{dstats.high_priority_open}</span>
                        </div>
                      </div>
                    </div>

                    <div>
                      {/* Department specific progress bar */}
                      <div className="h-3 bg-gray-100 border-2 border-[#1a1a1a] relative">
                        <div className="h-full bg-[#ffcc00] border-r-2 border-[#1a1a1a]" 
                          style={{ width: `${dstats.compliance_score}%` }}
                        />
                      </div>
                      <button
                        onClick={() => {
                          setSelectedDept(dept);
                          setActiveSubTab("MAPS");
                        }}
                        className="w-full mt-3 bg-[#eee9e0] hover:bg-[#ffcc00]/25 border-2 border-[#1a1a1a] text-[10px] font-mono font-black uppercase py-1 text-center block"
                      >
                        View checklist checklist
                      </button>
                    </div>

                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* 4. DEADLINES TAB */}
      {/* ========================================================= */}
      {activeSubTab === "DEADLINES" && (
        <div id="regpilot-deadlines-section" className="space-y-6">
          {/* Summary tiles */}
          <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
            {[
              { key: 'OVERDUE', label: 'OVERDUE', val: deadlinesData?.summary?.overdue || 0, bg: 'bg-[#e63b2e]' },
              { key: 'CRITICAL', label: 'CRITICAL — 7 DAYS', val: deadlinesData?.summary?.critical || 0, bg: 'bg-[#ff9900]' },
              { key: 'WARNING', label: 'WARNING — 30 DAYS', val: deadlinesData?.summary?.warning || 0, bg: 'bg-[#ffcc00]' },
              { key: 'SAFE', label: 'SAFE', val: deadlinesData?.summary?.safe || 0, bg: 'bg-[#2e7d32]' }
            ].map(tile => (
              <div key={tile.key} className={`${tile.bg} text-white border-4 border-black [box-shadow:6px_6px_0px_#000] p-4 font-black text-center`}> 
                <div className="text-sm">{tile.label}</div>
                <div className="text-3xl mt-2">{tile.val}</div>
              </div>
            ))}
          </div>

          {/* Deadline cards */}
          <div className="space-y-3">
            {(deadlinesData?.deadlines || []).map((d: any) => {
              const dr = d.days_remaining;
              const color = d.urgency === 'OVERDUE' ? 'text-[#e63b2e]' : d.urgency === 'CRITICAL' ? 'text-[#ff9900]' : d.urgency === 'WARNING' ? 'text-[#ffcc00]' : 'text-[#2e7d32]';
              return (
                <div key={d.id} className="border-2 border-black [box-shadow:4px_4px_0px_#000] p-4 bg-white flex justify-between items-center">
                  <div>
                    <h4 className="font-black text-lg">{d.title}</h4>
                    <div className="flex gap-2 items-center mt-2">
                      <span className={`px-2 py-0.5 border-2 border-black font-bold text-xs uppercase`}>{d.department}</span>
                      <span className="px-2 py-0.5 border-2 border-black font-bold text-xs uppercase">{d.priority}</span>
                    </div>
                    <div className="mt-3">
                      {d.days_remaining === null ? (
                        <div className="text-sm">UNSCHEDULED</div>
                      ) : d.days_remaining < 0 ? (
                        <div className="text-xl font-black text-[#e63b2e]">OVERDUE BY {Math.abs(d.days_remaining)} DAYS</div>
                      ) : (
                        <div className={`text-3xl font-black ${color}`}>{d.days_remaining} days</div>
                      )}
                      <div className="mt-2 text-sm text-amber-700">⚠ Penalty: {d.penalty_exposure}</div>
                    </div>
                  </div>
                  <div className="flex flex-col gap-2">
                    <button onClick={async () => {
                        try {
                          await fetch(`${apiBase}/regpilot/maps/${d.id}/status`, { method: 'PATCH', headers: {'Content-Type':'application/json'}, body: JSON.stringify({ status: 'in_progress' }) });
                          loadData();
                        } catch (e) { console.error(e); }
                      }}
                      className="border-2 border-black px-4 py-2 bg-white font-black">MARK IN PROGRESS</button>
                    <button onClick={() => { setActiveSubTab('MAPS'); window.setTimeout(()=>{ const el = document.getElementById(d.id); if(el) el.scrollIntoView({behavior:'smooth'}); }, 300); }}
                      className="border-2 border-black px-4 py-2 bg-white font-black">SUBMIT EVIDENCE</button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* 2. CIRCULARS TAB */}
      {/* ========================================================= */}
      {activeSubTab === "CIRCULARS" && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left: circulars list */}
          <div className="bg-[#ffffff] border-4 border-[#1a1a1a] p-4 [box-shadow:4px_4px_0px_#1a1a1a] h-fit">
            <h3 className="font-[Space Grotesk] font-black uppercase text-sm border-b-2 border-[#1a1a1a] pb-1.5 mb-3">
              Circular Feed
            </h3>
            
            <div className="space-y-3 max-h-[460px] overflow-y-auto pr-1">
              {circulars.map(c => (
                <div
                  key={c.id}
                  onClick={() => handleSelectCircular(c.id)}
                  className={`border-2 border-[#1a1a1a] p-3 cursor-pointer transition-all ${
                    selectedCircular?.id === c.id 
                      ? "bg-[#ffcc00]/20 border-l-4 border-l-[#0055ff]" 
                      : "bg-[#f5f0e8] hover:bg-[#eee9e0]"
                  }`}
                >
                  <div className="flex justify-between items-start mb-1.5">
                    <span className="font-mono text-[9px] font-black bg-[#1a1a1a] text-white px-1.5 border border-[#1a1a1a] uppercase">
                      {c.source}
                    </span>
                    <span className="font-mono text-[9px] text-gray-500 font-bold">
                      {c.published_at ? new Date(c.published_at).toLocaleDateString() : ""}
                    </span>
                  </div>
                  <h4 className="font-mono text-[11px] font-black text-[#1a1a1a] leading-snug">
                    {c.title}
                  </h4>
                </div>
              ))}
            </div>
          </div>

          {/* Right: raw text & extracted MAPs */}
          <div className="lg:col-span-2 space-y-6">
            {selectedCircular ? (
              <div className="bg-[#ffffff] border-4 border-[#1a1a1a] p-5 [box-shadow:4px_4px_0px_#1a1a1a] space-y-5 animate-fadeIn">
                
                <div>
                  <h3 className="font-[Space Grotesk] text-xl font-black text-[#1a1a1a] uppercase leading-snug">
                    {selectedCircular.title}
                  </h3>
                  <div className="flex gap-3 font-mono text-[10px] text-gray-500 font-bold mt-1.5 pb-2 border-b border-gray-100">
                    <span>Source: <strong className="text-[#1a1a1a]">{selectedCircular.source}</strong></span>
                    <span>•</span>
                    <span>Published Date: <strong className="text-[#1a1a1a]">{selectedCircular.published_at ? new Date(selectedCircular.published_at).toLocaleDateString() : ""}</strong></span>
                    {selectedCircular.url && (
                      <>
                        <span>•</span>
                        <a href={selectedCircular.url} target="_blank" rel="noreferrer" className="text-[#0055ff] hover:underline flex items-center gap-0.5">
                          Official URL <ArrowUpRight size={10} />
                        </a>
                      </>
                    )}
                  </div>
                </div>

                {/* raw text window */}
                <div className="space-y-1">
                  <span className="font-mono text-[9px] font-black uppercase text-gray-500">Official Circular Gazette Text</span>
                  <div className="bg-[#f5f0e8] border-2 border-[#1a1a1a] p-3 text-xs font-mono font-medium max-h-48 overflow-y-auto whitespace-pre-line text-gray-700">
                    {selectedCircular.raw_text || "No text fetched."}
                  </div>
                </div>

                {/* Extracted MAP list from circular */}
                <div className="space-y-2.5">
                  <h4 className="font-[Space Grotesk] text-sm font-black uppercase text-[#1a1a1a] flex items-center gap-1.5">
                    <CheckSquare size={14} className="text-[#2e7d32]" /> Action Items Extracted By AI (MAPs)
                  </h4>
                  
                  <div className="space-y-3">
                    {selectedCircular.maps && selectedCircular.maps.length > 0 ? (
                      selectedCircular.maps.map(m => {
                        const deptBadge = departmentColors[m.department] || "border-[#1a1a1a] text-[#1a1a1a] bg-white";
                        return (
                          <div key={m.id} className="border-2 border-[#1a1a1a] p-3 bg-[#f5f0e8]/50 flex justify-between items-start gap-4">
                            <div className="space-y-1">
                              <h5 className="font-mono text-xs font-black text-[#1a1a1a]">{m.title}</h5>
                              <p className="font-mono text-[10px] text-gray-600 font-bold leading-normal">{m.description}</p>
                              <div className="flex gap-2 items-center font-mono text-[9px] font-bold mt-1.5">
                                <span className={`border px-1 uppercase text-[8px] ${deptBadge}`}>{m.department}</span>
                                <span className="text-gray-500">Deadline: <strong className="text-gray-700">{m.deadline}</strong></span>
                                <span className={`border px-1 uppercase text-[8px] ${
                                  m.priority === "high" ? "bg-[#e63b2e]/10 text-[#e63b2e]" : m.priority === "medium" ? "bg-[#ff9900]/10 text-[#ff9900]" : "bg-gray-100"
                                }`}>
                                  {m.priority}
                                </span>
                              </div>
                            </div>

                            <span className={`font-mono text-[9px] font-black border px-2 py-0.5 uppercase ${
                              m.status === "completed" ? "bg-[#2e7d32] text-white" : m.status === "in_progress" ? "bg-[#ff9900] text-white" : "bg-white text-gray-500"
                            }`}>
                              {m.status}
                            </span>
                          </div>
                        );
                      })
                    ) : (
                      <p className="font-mono text-[10px] text-gray-500 italic">No action points found. Click crawl to reload.</p>
                    )}
                  </div>
                </div>

              </div>
            ) : (
              <div className="bg-[#ffffff] border-4 border-[#1a1a1a] p-12 text-center [box-shadow:4px_4px_0px_#1a1a1a] flex flex-col items-center justify-center min-h-[360px]">
                <FileText size={48} className="text-gray-400 stroke-[2] mb-3" />
                <h3 className="font-[Space Grotesk] text-xl font-black text-[#1a1a1a] uppercase">No Circular Selected</h3>
                <p className="font-mono text-xs text-gray-500 font-bold max-w-sm mt-1">
                  Select a regulatory notification from the left circular feed to review the extracted action items list.
                </p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* 3. MAP BOARD / DEPT CHECKLIST TAB */}
      {/* ========================================================= */}
      {activeSubTab === "MAPS" && (
        <div className="space-y-6">
          
          {/* Department selectors row */}
          <div className="flex flex-wrap gap-2">
            {Object.keys(departmentColors).map(dept => {
              const isActive = selectedDept === dept;
              const deptBadge = departmentColors[dept];
              return (
                <button
                  key={dept}
                  onClick={() => {
                    setSelectedDept(dept);
                    setValidationOutput({});
                  }}
                  className={`px-3 py-1.5 border-2 border-[#1a1a1a] font-[Space Grotesk] text-xs uppercase font-black cursor-pointer transition-all ${
                    isActive 
                      ? "bg-[#1a1a1a] text-white [box-shadow:1.5px_1.5px_0px_#1a1a1a]" 
                      : "bg-[#ffffff] hover:bg-[#ffcc00]/25 text-[#1a1a1a]"
                  }`}
                >
                  {dept}
                </button>
              );
            })}
          </div>

          {/* Filters and MAP items board list */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            
            {/* Left MAP items selection column */}
            <div className="lg:col-span-1 bg-[#ffffff] border-4 border-[#1a1a1a] p-4 [box-shadow:4px_4px_0px_#1a1a1a]">
              <h3 className="font-[Space Grotesk] font-black uppercase text-sm border-b-2 border-[#1a1a1a] pb-1.5 mb-3 flex justify-between items-center">
                <span>{selectedDept} Checklist</span>
                <span className="font-mono text-[9px] bg-white border border-[#1a1a1a] px-1 font-bold text-gray-500">
                  {maps.filter(m => m.department === selectedDept).length} TASKS
                </span>
              </h3>

              {/* Status filter selection */}
              <div className="flex gap-1.5 mb-3 pb-2 border-b border-gray-100">
                {["all", "open", "in_progress", "completed"].map(status => (
                  <button
                    key={status}
                    onClick={() => setMapFilterStatus(status)}
                    className={`px-2 py-0.5 border text-[9px] font-mono font-bold uppercase transition-all ${
                      mapFilterStatus === status 
                        ? "bg-[#1a1a1a] text-white" 
                        : "bg-[#f5f0e8] text-gray-600 hover:bg-gray-200"
                    }`}
                  >
                    {status}
                  </button>
                ))}
              </div>

              {/* MAP lists */}
              <div className="space-y-3 max-h-[380px] overflow-y-auto pr-1">
                {maps
                  .filter(m => m.department === selectedDept)
                  .filter(m => mapFilterStatus === "all" || m.status === mapFilterStatus)
                  .map(m => (
                    <div
                      key={m.id}
                      onClick={() => {
                        setSubmittingEvidenceId(m.id);
                        setValidationOutput({});
                      }}
                      className={`border-2 border-[#1a1a1a] p-3 cursor-pointer transition-all ${
                        submittingEvidenceId === m.id 
                          ? "bg-[#ffcc00]/20 border-l-4 border-l-[#0055ff]" 
                          : "bg-[#f5f0e8] hover:bg-[#eee9e0]"
                      }`}
                    >
                      <div className="flex justify-between items-start mb-1 gap-2">
                        <span className={`font-mono text-[8px] font-black border px-1 uppercase ${
                          m.priority === "high" ? "bg-[#e63b2e]/10 text-[#e63b2e]" : m.priority === "medium" ? "bg-[#ff9900]/10 text-[#ff9900]" : "bg-gray-100 text-gray-500"
                        }`}>
                          {m.priority}
                        </span>
                        
                        <span className={`font-mono text-[8px] font-black border px-1 uppercase ${
                          m.status === "completed" ? "bg-[#2e7d32] text-white" : m.status === "in_progress" ? "bg-[#ff9900] text-white" : "bg-white text-gray-500"
                        }`}>
                          {m.status}
                        </span>
                      </div>
                      <h4 className="font-mono text-[10px] font-black text-[#1a1a1a] leading-snug">
                        {m.title}
                      </h4>
                    </div>
                  ))}
              </div>
            </div>

            {/* Right: Validation Panel details */}
            <div className="lg:col-span-2">
              {submittingEvidenceId ? (() => {
                const currentMap = maps.find(m => m.id === submittingEvidenceId);
                const activeVal = validationOutput[submittingEvidenceId];
                if (!currentMap) return null;

                return (
                  <div className="bg-[#ffffff] border-4 border-[#1a1a1a] p-5 [box-shadow:4px_4px_0px_#1a1a1a] space-y-5 animate-fadeIn">
                    
                    {/* Header MAP Title */}
                    <div>
                      <span className="font-mono text-[9px] text-[#e63b2e] font-black border border-[#e63b2e] bg-[#e63b2e]/10 px-1.5 uppercase inline-block mb-1">
                        Task Definition
                      </span>
                      <h3 className="font-[Space Grotesk] text-xl font-black text-[#1a1a1a] uppercase leading-snug">
                        {currentMap.title}
                      </h3>
                      <p className="font-mono text-[11px] text-gray-600 font-bold leading-normal mt-2 bg-gray-50 p-2.5 border-l-4 border-gray-300 border">
                        {currentMap.description}
                      </p>
                      <div className="flex gap-3 font-mono text-[9px] text-gray-500 font-bold mt-2.5">
                        <span>Responsible: <strong className="text-gray-700 uppercase">{currentMap.department}</strong></span>
                        <span>•</span>
                        <span>Deadline: <strong className="text-gray-700">{currentMap.deadline}</strong></span>
                        <span>•</span>
                        <span>Priority: <strong className="text-gray-700 uppercase">{currentMap.priority}</strong></span>
                      </div>
                    </div>

                    {/* Status check / Validation status */}
                    {currentMap.status === "completed" && currentMap.evidence && (
                      <div className="bg-[#2e7d32]/10 border-2 border-[#2e7d32] p-4 text-[#2e7d32] font-mono text-xs space-y-2">
                        <div className="flex items-center gap-2 font-black uppercase">
                          <CheckCircle size={16} />
                          <span>COMPLIANCE STATUS: VALIDATED & ARCHIVED</span>
                        </div>
                        <p className="font-bold leading-normal">
                          Evidence Submitted: <strong className="text-gray-700 block mt-1 font-medium italic bg-white p-2 border border-[#2e7d32]/30">"{currentMap.evidence}"</strong>
                        </p>
                        <span className="bg-[#2e7d32] text-white px-2 py-0.5 text-[9px] font-black inline-block uppercase mt-1">LEDGER LOCKOUT STATE: TRUE</span>
                      </div>
                    )}

                    {/* Active Validator action interface */}
                    {currentMap.status !== "completed" && (
                      <div className="space-y-4 pt-2 border-t border-gray-100">
                        <div className="space-y-1">
                          <label className="font-mono text-[10px] font-black uppercase text-gray-500 block">
                            Auditor Validation Evidence (Written policy, screenshot references, HSM identifiers)
                          </label>
                          <textarea
                            value={evidenceText}
                            onChange={(e) => setEvidenceText(e.target.value)}
                            disabled={activeVal?.status === "VALIDATING"}
                            rows={4}
                            placeholder="Provide details of steps taken to address this circular mandate. E.g. 'Completed AES-256 encryption integration on all databases. Code reviewed by internal CISO team on 15/03/2025...'"
                            className="w-full bg-[#f5f0e8] text-xs font-mono font-bold p-3 border-2 border-[#1a1a1a] focus:outline-none focus:bg-[#ffcc00]/20 text-[#1a1a1a] placeholder-gray-500"
                          />
                        </div>

                        {activeVal?.status !== "VALIDATING" && (
                          <button
                            onClick={() => handleValidateEvidence(currentMap.id)}
                            disabled={!evidenceText.trim()}
                            className="bg-[#0055ff] text-[#ffffff] font-[Space Grotesk] font-black uppercase text-xs px-5 py-2.5 border-4 border-[#1a1a1a] [box-shadow:2.5px_2.5px_0px_#1a1a1a] hover:-translate-y-0.5 active:translate-y-0.5 active:shadow-none transition-all cursor-pointer disabled:opacity-50"
                          >
                            Submit Evidence for AI Validation
                          </button>
                        )}
                      </div>
                    )}

                    {/* Output feedback validation logs */}
                    {activeVal && (
                      <div className="border-t-2 border-dashed border-[#1a1a1a] pt-4 space-y-4">
                        <h4 className="font-[Space Grotesk] text-xs font-black uppercase text-[#1a1a1a] flex items-center gap-1.5">
                          <Activity size={14} className="text-[#0055ff]" /> Autonomous Auditor Agent Report
                        </h4>
                        
                        {activeVal.status === "VALIDATING" ? (
                          <div className="bg-[#0055ff]/10 border-2 border-[#0055ff] p-4 font-mono text-xs font-black text-[#0055ff] uppercase flex items-center gap-3 animate-pulse">
                            <RefreshCw size={14} className="animate-spin stroke-[3]" />
                            <span>{activeVal.message}</span>
                          </div>
                        ) : (
                          <div className="space-y-4">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                              {/* Verdict card */}
                              <div className={`border-2 border-[#1a1a1a] p-3 flex flex-col justify-between [box-shadow:2px_2px_0px_#1a1a1a] ${
                                activeVal.status === "VALIDATED" 
                                  ? "bg-[#2e7d32]/10 text-[#2e7d32]" 
                                  : activeVal.status === "PARTIAL" 
                                  ? "bg-[#ff9900]/10 text-[#ff9900]" 
                                  : "bg-[#e63b2e]/10 text-[#e63b2e]"
                              }`}>
                                <span className="font-mono text-[9px] font-black text-gray-500 uppercase leading-none">AI VERDICT STATUS</span>
                                <span className="font-[Space Grotesk] text-xl font-black mt-2">{activeVal.status}</span>
                                <p className="font-mono text-[9px] font-bold mt-1 text-gray-600">Method: {activeVal.method}</p>
                                {activeVal.method === "ollama" && (
                                  <p className="text-gray-500 text-[11px] mt-2">Validated by Microsoft Phi-3 Mini — running locally</p>
                                )}
                              </div>

                              {/* Completeness score */}
                              <div className="bg-[#f5f0e8] border-2 border-[#1a1a1a] p-3 flex flex-col justify-between [box-shadow:2px_2px_0px_#1a1a1a]">
                                <span className="font-mono text-[9px] font-black text-gray-500 uppercase leading-none">COMPLIANCE SCORE</span>
                                <span className="font-[Space Grotesk] text-xl font-black text-[#0055ff] mt-2">{activeVal.score}%</span>
                                <div className="h-2 bg-white border border-[#1a1a1a] mt-1 overflow-hidden">
                                  <div className="h-full bg-[#0055ff]" style={{ width: `${activeVal.score}%` }}></div>
                                </div>
                              </div>
                            </div>

                            {/* Verdict explanation sentence */}
                            <div className="bg-[#eee9e0] p-3 border border-[#1a1a1a] font-mono text-[10px] text-gray-700 font-bold leading-normal">
                              {activeVal.message}
                            </div>

                            {/* Gaps Checklist feedback */}
                            {activeVal.gaps && activeVal.gaps.length > 0 && (
                              <div className="space-y-2">
                                <span className="font-mono text-[9px] text-[#e63b2e] font-black uppercase tracking-wider block">Required Action Gaps Checklist ({activeVal.gaps.length} items)</span>
                                <div className="space-y-2">
                                  {activeVal.gaps.map((gap: string, i: number) => (
                                    <div key={i} className="flex items-start gap-2 bg-[#e63b2e]/10 border border-[#e63b2e] p-2 text-[#e63b2e] font-mono text-[10px] font-bold">
                                      <AlertTriangle size={12} className="flex-shrink-0 mt-0.5" />
                                      <span>{gap}</span>
                                    </div>
                                  ))}
                                </div>
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    )}

                  </div>
                );
              })() : (
                <div className="bg-[#ffffff] border-4 border-[#1a1a1a] p-12 text-center [box-shadow:4px_4px_0px_#1a1a1a] flex flex-col items-center justify-center min-h-[360px]">
                  <CheckCircle size={48} className="text-gray-400 stroke-[2] mb-3" />
                  <h3 className="font-[Space Grotesk] text-xl font-black text-[#1a1a1a] uppercase">No Action Selected</h3>
                  <p className="font-mono text-xs text-gray-500 font-bold max-w-sm mt-1">
                    Select a Measurable Action Point (MAP) task item from the left department checklist to review details or validate evidence.
                  </p>
                </div>
              )}
            </div>

          </div>

        </div>
      )}

    </div>
  );
}
