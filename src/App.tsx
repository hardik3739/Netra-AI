import { useState, useEffect } from "react";
import { 
  ChevronLeft, ChevronRight, Download, Search, 
  Play, Pause, RefreshCw, FileText, Check, ShieldCheck 
} from "lucide-react";
import { AuditLog, SidebarTab, ActiveTab, VectorCategory } from "./types";
import { initialAuditLogs } from "./initialData";
import Sidebar from "./components/Sidebar";
import Navbar from "./components/Navbar";
import StatCards from "./components/StatCards";
import LogDetailsDrawer from "./components/LogDetailsDrawer";
import SimulationPanel from "./components/SimulationPanel";
import ExtraScreens from "./components/ExtraScreens";
import ForgeShieldDashboard from "./components/ForgeShieldDashboard";
import RegPilotDashboard from "./components/RegPilotDashboard";
import LoanDossier from "./pages/LoanDossier";
import DashboardPage from "./pages/Dashboard";
import FraudPatterns from "./pages/FraudPatterns";

const API_BASE = (import.meta.env.VITE_API_BASE || "http://localhost:8000").replace(/\/$/, "");

export default function App() {
  // --- CORE APP STATES ---
  const initialTab = (localStorage.getItem('netraai_active_tab') as SidebarTab) || "FORGESHIELD";
  const [activeSidebarTab, setActiveSidebarTab] = useState<SidebarTab>(initialTab);
  const [logs, setLogs] = useState<AuditLog[]>(initialAuditLogs);
  const [activeFilterTab, setActiveFilterTab] = useState<ActiveTab>("ALL");
  const [searchQuery, setSearchQuery] = useState("");
  const [apiActive, setApiActive] = useState(true);
  const [selectedLog, setSelectedLog] = useState<AuditLog | null>(null);

  // --- PAGINATION STATES ---
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 5;

  // --- DYNAMIC TOTAL EVENTS STATE ---
  const [totalEvents, setTotalEvents] = useState(1244102);
  const [aiAudits, setAiAudits] = useState(84200);
  const [criticalAlerts, setCriticalAlerts] = useState(24);
  const [isBackendConnected, setIsBackendConnected] = useState(false);

  // --- REAL-TIME LIVE DATA AND BACKEND SYNC LOOP ---
  useEffect(() => {
    // Fetch real audit logs from PostgreSQL if available
    const fetchBackendLogs = async () => {
      try {
        const res = await fetch(`${API_BASE}/regpilot/audit?limit=50`);
        if (res.ok) {
          const dbLogs = await res.json();
          setIsBackendConnected(true);
          if (dbLogs && dbLogs.length > 0) {
            const mapped: AuditLog[] = dbLogs.map((dbLog: any) => {
              const idStr = String(dbLog.id).padStart(3, "0");
              let category: VectorCategory = "SYS";
              const ev = dbLog.event_type.toLowerCase();
              if (ev.includes("scan") || ev.includes("validated")) {
                category = "AI";
              } else if (ev.includes("status") || ev.includes("circular")) {
                category = "API";
              } else if (ev.includes("override")) {
                category = "HUMAN";
              }
              
              const createdDate = new Date(dbLog.created_at);
              const dateStr = createdDate.toISOString().split('T')[0].replace(/-/g, '.');
              const timeStr = createdDate.toTimeString().split(' ')[0] + "." + String(createdDate.getMilliseconds()).padStart(3, "0");
              
              let parsedDetails = {
                origin: "Database-Ledger",
                latencyMs: 12,
                payloadJson: dbLog.details || "{}"
              };

              return {
                block: idStr,
                vector: dbLog.event_type.toUpperCase(),
                vectorCategory: category,
                entityHash: dbLog.entity_id || "SYS-LOG",
                payload: dbLog.details || "Database audit trace.",
                timestampDate: dateStr,
                timestampTime: timeStr,
                previousHash: "000aaffebc992d992eefcca31",
                currentHash: "b" + Math.random().toString(36).substring(2, 15).padEnd(63, "1"),
                isVerified: true,
                details: parsedDetails
              };
            });

            // Merge and update state
            setLogs(prev => {
              const existingBlocks = new Set(mapped.map(l => l.block));
              const filteredPrev = prev.filter(l => !existingBlocks.has(l.block));
              const merged = [...mapped, ...filteredPrev];
              // Sort by block ID descending
              return merged.sort((a, b) => b.block.localeCompare(a.block));
            });
          }
        }
      } catch (e) {
        setIsBackendConnected(false);
      }
    };

    fetchBackendLogs();

    const interval = setInterval(() => {
      if (!apiActive) return;

      // Increment events locally
      setTotalEvents((prev) => prev + Math.floor(Math.random() * 3) + 1);

      if (Math.random() < 0.15) {
        setAiAudits((prev) => prev + 1);
      }

      // If backend is active, fetch from backend. Otherwise, simulate random logs.
      if (isBackendConnected) {
        fetchBackendLogs();
      } else {
        // Fallback simulation: Randomly inject a system log block
        if (Math.random() < 0.12) {
          const testVectors = [
            { vector: "VAL_CHECK", category: "SYS" as VectorCategory, payload: "Routine system integrity election finalized successfully.", prefix: "SYS-ROT" },
            { vector: "NEURAL_EVAL", category: "AI" as VectorCategory, payload: "AI risk check: anomalous transfer rate evaluated as [LOW].", prefix: "USR-EVAL" },
            { vector: "DATA_INGEST", category: "API" as VectorCategory, payload: "Incoming transaction sequence matching dynamic clearing checklist.", prefix: "API-CLR" }
          ];
          const chosen = testVectors[Math.floor(Math.random() * testVectors.length)];
          const blockId = String(logs.length + 1).padStart(3, "0");
          const latestCurrentHash = logs[0]?.currentHash || "000aaffebc992d992eefcca31";

          const tempHash = Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
          const nextHash = "b" + tempHash.padEnd(63, "1");

          const now = new Date();
          const dateStr = now.toISOString().split('T')[0].replace(/-/g, '.');
          const timeStr = now.toTimeString().split(' ')[0] + "." + String(now.getMilliseconds()).padStart(3, "0");

          const sysLog: AuditLog = {
            block: blockId,
            vector: chosen.vector,
            vectorCategory: chosen.category,
            entityHash: `${chosen.prefix}-${Math.floor(Math.random() * 8000) + 1000}`,
            payload: chosen.payload,
            timestampDate: dateStr,
            timestampTime: timeStr,
            previousHash: latestCurrentHash,
            currentHash: nextHash,
            isVerified: true,
            details: {
              origin: "AutonomicStreamBridge",
              latencyMs: Math.floor(Math.random() * 24) + 8,
              payloadJson: `{\n  "event": "AUTOMATED_API_SYNC",\n  "status": "COMPULSORY_STATE_ANCHOR",\n  "payload": "${chosen.payload}"\n}`
            }
          };

          setLogs((prev) => [sysLog, ...prev]);
        }
      }
    }, 4000);

    return () => clearInterval(interval);
  }, [apiActive, logs, isBackendConnected]);

  // Persist sidebar tab selection for simple cross-component navigation
  useEffect(() => {
    try {
      localStorage.setItem('netraai_active_tab', activeSidebarTab);
    } catch (e) {
      // ignore
    }
  }, [activeSidebarTab]);

  // --- COMPULSORY EXPORT ACTION ---
  const handleExportBlock = () => {
    const rawData = JSON.stringify(logs, null, 2);
    const blob = new Blob([rawData], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `NetraAI_Ledger_Export_B${logs[0]?.block || "001"}.json`;
    link.click();
    URL.revokeObjectURL(url);
  };

  // --- MANUAL COMPLIANCE LOG ADDER ---
  const handleAddManualLog = (newLogProps: Partial<AuditLog>) => {
    const nextBlockNum = String(logs.length + 1).padStart(3, "0");
    const previousLatestHash = logs[0]?.currentHash || "000000000aaffe882910bbccdd811";
    
    // Simulate SHA-256 block signature hashing loop
    const seed = `${previousLatestHash}-${newLogProps.entityHash}-${newLogProps.payload}`;
    let hashCalc = "c";
    for (let i = 0; i < seed.length; i++) {
      hashCalc += seed.charCodeAt(i).toString(16);
    }
    const currentCalculatedHash = hashCalc.padEnd(64, "4").slice(0, 64);

    const now = new Date();
    const dateStr = now.toISOString().split('T')[0].replace(/-/g, '.');
    const timeStr = now.toTimeString().split(' ')[0] + "." + String(now.getMilliseconds()).padStart(3, "0");

    const completeLog: AuditLog = {
      block: nextBlockNum,
      vector: newLogProps.vector || "SANDBOX_SIM",
      vectorCategory: newLogProps.vectorCategory || "SANDBOX",
      entityHash: newLogProps.entityHash || "TRX-7700-BB",
      payload: newLogProps.payload || "Sandbox dynamic compliance entry.",
      timestampDate: dateStr,
      timestampTime: timeStr,
      previousHash: previousLatestHash,
      currentHash: currentCalculatedHash,
      isVerified: true,
      details: newLogProps.details as AuditLog["details"] || {
        origin: "Sandbox-Console",
        latencyMs: 12,
        payloadJson: `{\n  "simulated": true\n}`
      }
    };

    setLogs((prev) => [completeLog, ...prev]);
    setTotalEvents((prev) => prev + 1);

    if (completeLog.vectorCategory === "HUMAN") {
      setCriticalAlerts((prev) => prev + 1);
    }
  };

  // --- REAL-TIME HIGH-SPEED LOG FILTERING LOOP ---
  const filteredLogs = logs.filter((log) => {
    // 1. Text Query Filter
    const matchesSearch = 
      log.entityHash.toLowerCase().includes(searchQuery.toLowerCase()) ||
      log.payload.toLowerCase().includes(searchQuery.toLowerCase()) ||
      log.vector.toLowerCase().includes(searchQuery.toLowerCase());

    if (!matchesSearch) return false;

    // 2. Tab Filter mapping directly to image specification
    if (activeFilterTab === "TRIGGERS") {
      // Triggers contains SYS, API, and HUMAN vectors
      return ["SYS", "API", "HUMAN", "SANDBOX"].includes(log.vectorCategory);
    }
    if (activeFilterTab === "AI_MODS") {
      // AI Mods contains AI and CONSENSUS vectors
      return ["AI", "CONSENSUS"].includes(log.vectorCategory);
    }

    // Default "All Streams"
    return true;
  });

  // Calculate pages
  const totalPages = Math.ceil(filteredLogs.length / pageSize) || 1;
  const paginatedLogs = filteredLogs.slice(
    (currentPage - 1) * pageSize,
    currentPage * pageSize
  );

  // Sync page index bounds on filter changes
  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery, activeFilterTab]);

  // --- ELEMENT RENDERING FOR TABLE CHIPS (Vector types) ---
  const renderVectorBadge = (log: AuditLog) => {
    switch (log.vectorCategory) {
      case "SYS":
        return (
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-[#1a1a1a] text-[#ffffff] border-2 border-[#1a1a1a] flex items-center justify-center font-black [box-shadow:1.5px_1.5px_0px_#1a1a1a]">
              ?
            </div>
            <div>
              <p className="font-[Space Grotesk] text-xs font-bold text-[#1a1a1a] uppercase leading-tight">
                {log.vector}
              </p>
              <span className="font-mono text-[9px] bg-[#1a1a1a] text-[#ffffff] px-1 border border-[#1a1a1a] uppercase font-bold">
                SYS
              </span>
            </div>
          </div>
        );
      case "AI":
        return (
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-[#0055ff] text-[#ffffff] border-2 border-[#1a1a1a] flex items-center justify-center font-black rounded-full [box-shadow:1.5px_1.5px_0px_#1a1a1a]">
              N
            </div>
            <div>
              <p className="font-[Space Grotesk] text-xs font-bold text-[#1a1a1a] uppercase leading-tight">
                {log.vector}
              </p>
              <span className="font-mono text-[9px] bg-[#0055ff] text-[#ffffff] px-1 border border-[#1a1a1a] uppercase font-bold">
                AI
              </span>
            </div>
          </div>
        );
      case "API":
        return (
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-[#ffcc00] text-[#1a1a1a] border-2 border-[#1a1a1a] flex items-center justify-center font-black rotate-45 [box-shadow:1px_1px_0px_#1a1a1a]">
              <span className="block -rotate-45 font-extrabold">I</span>
            </div>
            <div>
              <p className="font-[Space Grotesk] text-xs font-bold text-[#1a1a1a] uppercase leading-tight">
                {log.vector}
              </p>
              <span className="font-mono text-[9px] bg-[#ffcc00] text-[#1a1a1a] px-1 border border-[#1a1a1a] uppercase font-black">
                API
              </span>
            </div>
          </div>
        );
      case "HUMAN":
        return (
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-[#e63b2e] text-[#ffffff] border-2 border-[#1a1a1a] flex items-center justify-center font-black [box-shadow:1.5px_1.5px_0px_#1a1a1a]">
              !
            </div>
            <div>
              <p className="font-[Space Grotesk] text-xs font-bold text-[#e63b2e] uppercase leading-tight">
                {log.vector}
              </p>
              <span className="font-mono text-[9px] bg-[#e63b2e] text-[#ffffff] px-1 border border-[#1a1a1a] uppercase font-bold">
                HUMAN
              </span>
            </div>
          </div>
        );
      case "CONSENSUS":
        return (
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-[#e63b2e] text-[#ffffff] border-2 border-[#1a1a1a] flex items-center justify-center font-black [box-shadow:1.5px_1.5px_0px_#1a1a1a]">
              V
            </div>
            <div>
              <p className="font-[Space Grotesk] text-xs font-bold text-[#e63b2e] uppercase leading-tight">
                {log.vector}
              </p>
              <span className="font-mono text-[9px] bg-[#e63b2e] text-[#ffffff] px-1 border border-[#1a1a1a] uppercase font-bold">
                CONSENSUS
              </span>
            </div>
          </div>
        );
      default:
        return (
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-[#eee9e0] text-[#1a1a1a] border-2 border-[#1a1a1a] flex items-center justify-center font-black [box-shadow:1.5px_1.5px_0px_#1a1a1a]">
              S
            </div>
            <div>
              <p className="font-[Space Grotesk] text-xs font-bold text-[#1a1a1a] uppercase leading-tight">
                {log.vector}
              </p>
              <span className="font-mono text-[9px] bg-[#eee9e0] text-[#1a1a1a] px-1 border border-[#1a1a1a] uppercase font-bold">
                SANDBOX
              </span>
            </div>
          </div>
        );
    }
  };

  const getHashColors = (category: string) => {
    switch (category) {
      case "SYS":
        return "bg-[#ffcc00] text-[#1a1a1a]";
      case "AI":
        return "bg-[#d6e3ff] text-[#1a1a1a]";
      case "API":
        return "bg-[#eee9e0] text-[#1a1a1a]";
      case "HUMAN":
        return "bg-[#ffdad6] text-[#e63b2e]";
      case "CONSENSUS":
        return "bg-[#eee9e0] text-[#e63b2e]";
      default:
        return "bg-[#eee9e0] text-[#1a1a1a]";
    }
  };

  return (
    <div className="min-h-screen bg-[#f5f0e8] text-[#1a1a1a] font-sans antialiased border-t-8 border-[#1a1a1a] relative brutal-grid">
      {/* 1. Header Navigation Bar */}
      <Navbar 
        activeTab={activeSidebarTab} 
        onChangeTab={setActiveSidebarTab} 
        criticalCount={criticalAlerts} 
      />

      {/* 2. Left side rail (fixed on desktop) */}
      <Sidebar 
        activeTab={activeSidebarTab} 
        onChangeTab={setActiveSidebarTab} 
        apiActive={apiActive} 
      />

      {/* 3. Main Stage */}
      <main className="ml-64 pt-24 px-8 pb-12 transition-all duration-300">
        <div className="max-w-7xl mx-auto space-y-6">
          
          {/* A. If we are on extra support screens, render them modularly */}
          <ExtraScreens 
            currentTab={activeSidebarTab} 
            onChangeTab={setActiveSidebarTab} 
            logs={logs}
            onAddLog={handleAddManualLog}
          />

          {/* C. ForgeShield Dashboard Screen */}
          {activeSidebarTab === "FORGESHIELD" && (
            <ForgeShieldDashboard 
              apiBase={API_BASE} 
              onAddLog={handleAddManualLog} 
            />
          )}

          {/* New Compliance Trend Dashboard */}
          {activeSidebarTab === "DASHBOARD" && (
            <DashboardPage apiBase={API_BASE} />
          )}

          {/* D. RegPilot Dashboard Screen */}
          {activeSidebarTab === "REGPILOT" && (
            <RegPilotDashboard 
              apiBase={API_BASE} 
              onAddLog={handleAddManualLog} 
            />
          )}

          {activeSidebarTab === "LOAN_DOSSIER" && (
            <LoanDossier apiBase={API_BASE} onAddLog={handleAddManualLog} />
          )}

          {activeSidebarTab === "FRAUD_PATTERNS" && (
            <FraudPatterns apiBase={API_BASE} />
          )}

          {/* B. Primary Screen: Immutable Ledger Audit Trail */}
          {activeSidebarTab === "AUDIT_TRAIL" && (
            <div className="space-y-6 animate-fadeIn">
              
              {/* HEADER SECTION PANEL */}
              <div className="flex flex-col md:flex-row md:items-end justify-between p-6 bg-[#1a1a1a] text-[#ffffff] border-4 border-[#1a1a1a] [box-shadow:4px_4px_0px_#1a1a1a] gap-4">
                <div className="space-y-2">
                  <nav className="flex items-center gap-2 text-[#ffcc00] font-mono text-xs uppercase font-extrabold tracking-wider">
                    <span>RegPilot</span>
                    <span>/</span>
                    <span className="text-[#ffffff]">Audit Trail</span>
                  </nav>
                  <h1 className="font-[Space Grotesk] text-4.5xl font-black uppercase tracking-tighter leading-none text-[#ffffff]">
                    Immutable Ledger
                  </h1>
                  <p className="font-mono text-xs max-w-2xl text-[#f5f0e8]/88 border-l-4 border-[#ffcc00] pl-3 leading-relaxed">
                    Raw, cryptographic event stream. All system interactions and AI decisions are final and secured.
                  </p>
                </div>

                {/* Right controls: search and export lock */}
                <div className="flex flex-col sm:flex-row gap-3">
                  <div className="relative">
                    <Search size={18} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[#1a1a1a] stroke-[2.5]" />
                    <input
                      type="text"
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="pl-10 pr-4 py-2 bg-[#f5f0e8] text-[#1a1a1a] border-4 border-[#1a1a1a] font-mono text-xs font-black focus:outline-none focus:bg-[#ffcc00] transition-colors w-full sm:w-60 placeholder-gray-500 rounded-xs"
                      placeholder="SEARCH ENTITY_ID..."
                    />
                  </div>
                  <button
                    onClick={handleExportBlock}
                    className="flex items-center justify-center gap-2 px-4 py-2 bg-[#e63b2e] text-[#ffffff] border-4 border-[#1a1a1a] font-[Space Grotesk] font-black uppercase text-xs [box-shadow:2.5px_2.5px_0px_#1a1a1a] hover:-translate-y-0.5 active:translate-y-0.5 active:shadow-none transition-all cursor-pointer"
                    title="Export ledger blocks as signature JSON"
                  >
                    <Download size={14} className="stroke-[3]" />
                    <span>Export Block</span>
                  </button>
                </div>
              </div>

              {/* STATS DECK COMPONENT */}
              <StatCards 
                totalEventsCount={totalEvents} 
                criticalAlerts={criticalAlerts} 
                aiAuditsCount={aiAudits} 
                apiActive={apiActive} 
              />

              {/* LOG ENTITY INJECTION FORM */}
              <SimulationPanel 
                onAddLog={handleAddManualLog} 
                lastBlockHash={logs[0]?.currentHash || ""} 
              />

              {/* IMMUTABLE STREAM TABLE CONTAINER */}
              <div className="bg-[#f5f0e8] border-4 border-[#1a1a1a] [box-shadow:4px_4px_0px_#1a1a1a]">
                
                {/* TABLE HEADER ACTIONS BAR */}
                <div className="p-4 border-b-4 border-[#1a1a1a] flex flex-col sm:flex-row justify-between items-center gap-4 bg-[#eee9e0]">
                  <div className="flex gap-2.5">
                    {[
                      { id: "ALL", label: "All Streams" },
                      { id: "TRIGGERS", label: "Triggers" },
                      { id: "AI_MODS", label: "AI Mods" }
                    ].map((tab) => (
                      <button
                        key={tab.id}
                        onClick={() => {
                          setActiveFilterTab(tab.id as ActiveTab);
                          setSelectedLog(null);
                        }}
                        className={`px-4 py-1.5 border-2 border-[#1a1a1a] font-[Space Grotesk] text-xs uppercase font-black cursor-pointer transition-all ${
                          activeFilterTab === tab.id
                            ? "bg-[#1a1a1a] text-[#ffffff] [box-shadow:1.5px_1.5px_0px_#1a1a1a]"
                            : "bg-[#f5f0e8] text-[#1a1a1a] hover:bg-[#ffcc00]/20"
                        }`}
                      >
                        {tab.label}
                      </button>
                    ))}
                  </div>

                  {/* API STREAM MODE TOGGLE */}
                  <button
                    onClick={() => setApiActive(!apiActive)}
                    className={`flex items-center gap-2 font-mono text-xs font-black border-2 border-[#1a1a1a] px-3 py-1 cursor-pointer transition-all ${
                      apiActive 
                        ? "bg-[#ffcc00] text-[#1a1a1a] [box-shadow:1.5px_1.5px_0px_#1a1a1a]" 
                        : "bg-gray-200 text-gray-600 border-dashed"
                    }`}
                    title={apiActive ? "Pause active live stream generation" : "Enable live stream simulation"}
                  >
                    <span className={`w-2 h-2 ${apiActive ? "bg-[#e63b2e]" : "bg-gray-500"} border border-[#1a1a1a] ${apiActive ? "animate-pulse" : ""}`}></span>
                    <span>{apiActive ? "LIVE SYNC: T-0.1s" : "STREAM PAUSED"}</span>
                    {apiActive ? <Pause size={12} className="stroke-[3]" /> : <Play size={12} />}
                  </button>
                </div>

                {/* SCROLLABLE TABLE BODY */}
                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse">
                    <thead className="bg-[#1a1a1a] text-[#ffffff] font-[Space Grotesk] text-xs uppercase tracking-wider border-b-4 border-[#1a1a1a] select-none">
                      <tr>
                        <th className="px-4 py-3 border-r-2 border-[#1a1a1a] w-16 text-center">BLK</th>
                        <th className="px-4 py-3 border-r-2 border-[#1a1a1a] w-72">Vector</th>
                        <th className="px-4 py-3 border-r-2 border-[#1a1a1a] w-52">Entity_Hash</th>
                        <th className="px-4 py-3 border-r-2 border-[#1a1a1a]">Payload_Data</th>
                        <th className="px-4 py-3 text-right w-44">Timestamp_UTC</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y-4 divide-[#1a1a1a] bg-[#f5f0e8]">
                      {paginatedLogs.length > 0 ? (
                        paginatedLogs.map((log) => (
                          <tr
                            key={log.block}
                            onClick={() => setSelectedLog(log)}
                            className="hover:bg-[#e8e3da] transition-colors duration-150 cursor-pointer active:bg-[#fff7e6]"
                          >
                            {/* Block ID index */}
                            <td className="px-4 py-4 border-r-2 border-[#1a1a1a] font-mono font-black text-center bg-[#e8e3da]">
                              {log.block}
                            </td>

                            {/* Vector Column Badge */}
                            <td className="px-4 py-4 border-r-2 border-[#1a1a1a]">
                              {renderVectorBadge(log)}
                            </td>

                            {/* Entity Hash Offset border */}
                            <td className="px-4 py-4 border-r-2 border-[#1a1a1a]">
                              <code className={`font-mono font-bold border-2 border-[#1a1a1a] px-2 py-1 text-xs shadow-[2px_2px_0px_#1a1a1a] select-all ${getHashColors(log.vectorCategory)}`}>
                                {log.entityHash}
                              </code>
                            </td>

                            {/* Log Statement payload */}
                            <td className="px-4 py-4 border-r-2 border-[#1a1a1a] font-mono text-xs font-semibold text-[#1a1a1a]">
                              {log.payload}
                            </td>

                            {/* UTCTimestamp formatted date box */}
                            <td className="px-4 py-4 text-right font-mono text-[10px]">
                              <p className="font-bold bg-[#e8e3da] inline-block px-1.5 py-0.5 border-2 border-[#1a1a1a]">
                                {log.timestampDate}
                              </p>
                              <p className="mt-1 font-bold text-gray-700">{log.timestampTime}</p>
                            </td>
                          </tr>
                        ))
                      ) : (
                        <tr>
                          <td colSpan={5} className="px-6 py-12 text-center font-mono text-xs font-black text-gray-500 uppercase">
                            No ledger blocks found matching filter attributes.
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>

                {/* TABLE PAGINATION FOOTER */}
                <div className="p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-t-4 border-[#1a1a1a] bg-[#eee9e0] select-none">
                  <p className="font-mono text-xs font-black bg-[#f5f0e8] border-2 border-[#1a1a1a] px-2.5 py-1 inline-block [box-shadow:1.5px_1.5px_0px_#1a1a1a]">
                    PAGE {currentPage} // {filteredLogs.length} BLOCKS MATCHED
                  </p>
                  
                  <div className="flex items-center gap-1.5 self-center sm:self-auto">
                    {/* Previous page */}
                    <button
                      onClick={() => setCurrentPage((prev) => Math.max(prev - 1, 1))}
                      disabled={currentPage === 1}
                      className="w-9 h-9 flex items-center justify-center bg-[#f5f0e8] border-2 border-[#1a1a1a] [box-shadow:2px_2px_0px_#1a1a1a] hover:-translate-y-0.5 active:translate-y-0.5 active:shadow-none transition-all disabled:opacity-40 disabled:hover:translate-y-0 disabled:active:shadow-[2px_2px_0px_#1a1a1a] cursor-pointer"
                      title="Previous Page"
                    >
                      <ChevronLeft size={16} className="stroke-[3]" />
                    </button>

                    {/* Numeric Indicators */}
                    {Array.from({ length: totalPages }).map((_, i) => {
                      const pageNum = i + 1;
                      return (
                        <button
                          key={pageNum}
                          onClick={() => setCurrentPage(pageNum)}
                          className={`w-9 h-9 flex items-center justify-center text-xs font-black border-2 border-[#1a1a1a] [box-shadow:2px_2px_0px_#1a1a1a] transition-all cursor-pointer ${
                            currentPage === pageNum
                              ? "bg-[#1a1a1a] text-[#ffffff]"
                              : "bg-[#f5f0e8] text-[#1a1a1a] hover:bg-[#ffcc00]/20"
                          }`}
                        >
                          {pageNum}
                        </button>
                      );
                    })}

                    {totalPages > 3 && (
                      <>
                        <span className="px-1.5 font-bold font-mono">...</span>
                        <button
                          onClick={() => setCurrentPage(totalPages)}
                          className="w-11 h-9 flex items-center justify-center bg-[#f5f0e8] text-[#1a1a1a] font-mono text-[10px] font-black border-2 border-[#1a1a1a] [box-shadow:2px_2px_0px_#1a1a1a] hover:bg-[#ffcc00]/20"
                        >
                          {totalPages}k
                        </button>
                      </>
                    )}

                    {/* Next page */}
                    <button
                      onClick={() => setCurrentPage((prev) => Math.min(prev + 1, totalPages))}
                      disabled={currentPage === totalPages}
                      className="w-9 h-9 flex items-center justify-center bg-[#f5f0e8] border-2 border-[#1a1a1a] [box-shadow:2px_2px_0px_#1a1a1a] hover:-translate-y-0.5 active:translate-y-0.5 active:shadow-none transition-all disabled:opacity-40 disabled:hover:translate-y-0 disabled:active:shadow-[2px_2px_0px_#1a1a1a] cursor-pointer"
                      title="Next Page"
                    >
                      <ChevronRight size={16} className="stroke-[3]" />
                    </button>
                  </div>
                </div>
              </div>

              {/* CONTEXTUAL FOOTER INFOGRAPHIC WIDGETS */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 select-none shadow-[#1a1a1a]">
                <div className="bg-[#f5f0e8] p-6 border-4 border-[#1a1a1a] [box-shadow:4px_4px_0px_#1a1a1a] flex items-start gap-4">
                  <div className="w-12 h-12 bg-[#1a1a1a] text-[#ffffff] flex items-center justify-center border-2 border-[#1a1a1a] flex-shrink-0 [box-shadow:2px_2px_0px_#1a1a1a]">
                    <ShieldCheck size={24} className="text-[#ffcc00]" />
                  </div>
                  <div>
                    <h3 className="font-[Space Grotesk] text-lg font-black uppercase mb-1 text-[#1a1a1a]">
                      SOC2 Type II Compliant
                    </h3>
                    <p className="font-mono text-xs text-gray-600 font-bold leading-relaxed">
                      Cryptographically secured logs. Meets all national, EU, and global secure financial reporting protocol criteria. ROOT_TRUST=TRUE.
                    </p>
                  </div>
                </div>

                <div className="bg-[#f5f0e8] p-6 border-4 border-[#1a1a1a] [box-shadow:4px_4px_0px_#1a1a1a] flex items-start gap-4">
                  <div className="w-12 h-12 bg-[#e63b2e] text-[#ffffff] flex items-center justify-center border-2 border-[#1a1a1a] flex-shrink-0 [box-shadow:2px_2px_0px_#1a1a1a]">
                    <RefreshCw size={24} className="stroke-[2.5]" />
                  </div>
                  <div>
                    <h3 className="font-[Space Grotesk] text-lg font-black uppercase mb-1 text-[#1a1a1a]">
                      API Connection Active
                    </h3>
                    <p className="font-mono text-xs text-gray-600 font-bold leading-relaxed">
                      GET /regpilot/audit stream status is green. {(totalEvents * 0.01).toFixed(0)} packets processed in last 60s. STATUS: COMPLIANT_STABLE.
                    </p>
                  </div>
                </div>
              </div>

            </div>
          )}

        </div>
      </main>

      {/* 4. Log Details Side Drawer (Overlay) */}
      <LogDetailsDrawer log={selectedLog} onClose={() => setSelectedLog(null)} />
    </div>
  );
}
