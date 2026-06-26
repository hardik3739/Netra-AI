import { useState } from "react";
import { SidebarTab, AuditLog } from "../types";
import { 
  Play, Pause, RefreshCw, KeyRound, ServerCrash, Hammer, 
  Settings as SettingsIcon, ShieldCheck, Cpu, Database, AlertOctagon, 
  CheckCircle, ArrowUpRight, ArrowDownRight, Radio
} from "lucide-react";

interface ExtraScreensProps {
  currentTab: SidebarTab;
  onChangeTab: (tab: SidebarTab) => void;
  logs: AuditLog[];
  onAddLog: (newLog: Partial<AuditLog>) => void;
}

export default function ExtraScreens({ currentTab, onChangeTab, logs, onAddLog }: ExtraScreensProps) {
  // --- STATE FOR SETTINGS ---
  const [streamUrl, setStreamUrl] = useState("https://api.netra.ai/regpilot/audit/stream");
  const [apiKey, setApiKey] = useState("************************_v2_key");
  const [auditThreshold, setAuditThreshold] = useState(75);
  const [autoApprove, setAutoApprove] = useState(true);

  // --- STATE FOR RISK OVERRIDES ---
  const [pendingOverridden, setPendingOverridden] = useState<string[]>([]);
  const [frozenUsers, setFrozenUsers] = useState<string[]>([]);

  if (currentTab === "AUDIT_TRAIL" || currentTab === "FORGESHIELD" || currentTab === "REGPILOT") return null;

  // --- 1. DASHBOARD VIEW ---
  if (currentTab === "DASHBOARD") {
    return (
      <div className="space-y-6 select-none animate-fadeIn">
        {/* Header Block inline with design */}
        <div className="bg-[#1a1a1a] text-[#ffffff] p-6 border-4 border-[#1a1a1a] [box-shadow:4px_4px_0px_#1a1a1a]">
          <h2 className="font-[Space Grotesk] text-4xl font-black uppercase tracking-tight">System Overview</h2>
          <p className="font-mono text-xs text-[#ffcc00] uppercase font-bold mt-1">
            Real-time telemetry and ledger metrics
          </p>
        </div>

        {/* Dynamic Telemetry bento grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Active node block */}
          <div className="bg-[#ffffff] border-4 border-[#1a1a1a] p-4 [box-shadow:4px_4px_0px_#1a1a1a]">
            <h3 className="font-[Space Grotesk] font-black uppercase text-sm border-b-2 border-[#1a1a1a] pb-1.5 mb-3 flex items-center gap-2">
              <Cpu size={16} /> Cluster Nodes
            </h3>
            <div className="space-y-2">
              {[
                { name: "NETRA-PRIMARY-US", speed: "11ms", status: "HEALTHY", bg: "bg-[#2e7d32]" },
                { name: "NETRA-SECONDARY-EU", speed: "18ms", status: "HEALTHY", bg: "bg-[#2e7d32]" },
                { name: "NETRA-BACKUP-SG", speed: "35ms", status: "STABLE", bg: "bg-[#0055ff]" },
                { name: "AISHIELD-EVAL-V3", speed: "128ms", status: "HEAVY_LOAD", bg: "bg-[#ffcc00]" },
              ].map((node, i) => (
                <div key={i} className="flex justify-between items-center bg-[#f5f0e8] p-2 border-2 border-[#1a1a1a]">
                  <span className="font-mono text-xs font-bold text-[#1a1a1a]">{node.name}</span>
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-[10px] text-gray-500 font-bold">{node.speed}</span>
                    <span className={`w-2 h-2 ${node.bg} border border-[#1a1a1a]`}></span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Verification Ratio */}
          <div className="bg-[#ffffff] border-4 border-[#1a1a1a] p-4 [box-shadow:4px_4px_0px_#1a1a1a]">
            <h3 className="font-[Space Grotesk] font-black uppercase text-sm border-b-2 border-[#1a1a1a] pb-1.5 mb-3 flex items-center gap-2">
              <Database size={16} /> Ledger Compaction
            </h3>
            <div className="flex flex-col justify-between h-[calc(100%-40px)]">
              <div>
                <p className="font-mono text-xs font-medium text-gray-600">
                  Compaction algorithms run once every 24 hours to secure absolute historical hash states under zero entropy loss.
                </p>
                <div className="flex justify-between items-center mt-3 font-mono text-xs font-bold text-[#1a1a1a]">
                  <span>REDUNDANCY COEFFICIENT</span>
                  <span>1.024x (OPTIMAL)</span>
                </div>
              </div>
              <div className="h-4 bg-gray-100 border-2 border-[#1a1a1a] mt-2 relative">
                <div className="h-full bg-[#ffcc00] border-r-2 border-[#1a1a1a]" style={{ width: "94.2%" }}></div>
                <span className="absolute inset-0 flex items-center justify-center font-mono text-[9px] font-black text-[#1a1a1a]">
                  94.2% STORAGE COMPACTED
                </span>
              </div>
            </div>
          </div>

          {/* AI Decision Profile */}
          <div className="bg-[#ffffff] border-4 border-[#1a1a1a] p-4 [box-shadow:4px_4px_0px_#1a1a1a]">
            <h3 className="font-[Space Grotesk] font-black uppercase text-sm border-b-2 border-[#1a1a1a] pb-1.5 mb-3 flex items-center gap-2">
              <Radio size={16} className="text-[#0055ff]" /> Microsoft Phi-3 Mini Precision
            </h3>
            <div className="text-center py-2">
              <span className="font-[Space Grotesk] text-5xl font-black text-[#0055ff] leading-none">
                99.94%
              </span>
              <p className="font-mono text-[9px] text-[#4a4a4a] font-bold mt-1 uppercase tracking-wider">
                Model v3 Precision confidence score
              </p>
              <div className="mt-3 flex justify-center gap-2">
                <span className="bg-[#ffcc00] border-2 border-[#1a1a1a] font-mono text-[10px] font-bold px-2 py-0.5 [box-shadow:1.5px_1.5px_0px_#1a1a1a]">
                  ACTIVE INFERENCE
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Custom SVG Data Plots */}
        <div className="bg-[#f5f0e8] border-4 border-[#1a1a1a] p-6 [box-shadow:4px_4px_0px_#1a1a1a] select-none">
          <h3 className="font-[Space Grotesk] text-lg font-black uppercase text-[#1a1a1a] mb-4 border-b-2 border-[#1a1a1a] pb-2">
            Dynamic Compliance Latency Wave
          </h3>
          <div className="w-full h-44 bg-white border-2 border-[#1a1a1a] relative flex items-end">
            {/* Custom SVG for precision and styling layout */}
            <svg className="w-full h-full p-2" viewBox="0 0 500 100" preserveAspectRatio="none">
              {/* grid background */}
              <line x1="0" y1="25" x2="500" y2="25" stroke="#eee9e0" strokeWidth="1" strokeDasharray="5,5" />
              <line x1="0" y1="50" x2="500" y2="50" stroke="#eee9e0" strokeWidth="1" strokeDasharray="5,5" />
              <line x1="0" y1="75" x2="500" y2="75" stroke="#eee9e0" strokeWidth="1" strokeDasharray="5,5" />
              {/* Plot graph line */}
              <path
                d="M 0 50 Q 50 15 100 80 T 200 40 T 300 70 T 400 20 T 500 65"
                fill="none"
                stroke="#0055ff"
                strokeWidth="4"
              />
              <path
                d="M 0 50 Q 50 15 100 80 T 200 40 T 300 70 T 400 20 T 500 65 L 500 100 L 0 100 Z"
                fill="#0055ff"
                fillOpacity="0.1"
              />
            </svg>
            <span className="absolute top-2 left-2 bg-[#ffcc00] border border-[#1a1a1a] font-mono text-[9px] font-black px-1">
              LATENCY PEAK: 84ms
            </span>
            <span className="absolute bottom-2 right-2 bg-[#1a1a1a] text-white font-mono text-[9px] font-bold px-1">
              SWEEP TIMELINE: LAST 60 MINS
            </span>
          </div>
        </div>
      </div>
    );
  }

  // --- 2. ANALYTICS VIEW ---
  if (currentTab === "ANALYTICS") {
    return (
      <div className="space-y-6 select-none animate-fadeIn">
        <div className="bg-[#1a1a1a] text-[#ffffff] p-6 border-4 border-[#1a1a1a] [box-shadow:4px_4px_0px_#1a1a1a]">
          <h2 className="font-[Space Grotesk] text-4xl font-black uppercase tracking-tight">Compliance Analytics</h2>
          <p className="font-mono text-xs text-[#ffcc00] uppercase font-bold mt-1">
            Historical audit vectors performance auditing
          </p>
        </div>

        {/* Visual Analytics columns */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Chart 1: Log Ingestion Streams volume */}
          <div className="bg-[#ffffff] border-4 border-[#1a1a1a] p-4 [box-shadow:4px_4px_0px_#1a1a1a]">
            <h3 className="font-[Space Grotesk] font-black uppercase text-sm border-b-2 border-[#1a1a1a] pb-1.5 mb-3">
              Event Density by Stream
            </h3>
            <div className="h-48 flex items-end justify-between p-2 pt-4 bg-[#f2ede5] border-2 border-[#1a1a1a]">
              {[
                { label: "SYS", height: "85%", val: "481K", bg: "bg-[#1a1a1a]" },
                { label: "AI", height: "60%", val: "340K", bg: "bg-[#0055ff]" },
                { label: "API", height: "95%", val: "512K", bg: "bg-[#ffcc00]" },
                { label: "HUMAN", height: "25%", val: "140K", bg: "bg-[#e63b2e]" },
              ].map((item, i) => (
                <div key={i} className="flex flex-col items-center w-16 space-y-2">
                  <span className="font-mono text-[9px] font-black text-[#1a1a1a]">{item.val}</span>
                  <div className={`w-10 ${item.bg} border-2 border-[#1a1a1a] rounded-t-sm transition-all duration-500`} style={{ height: item.height }}></div>
                  <span className="font-mono text-[10px] font-bold text-[#1a1a1a] border-t-2 border-[#1a1a1a] w-full text-center py-1">
                    {item.label}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Chart 2: API Request speed profile */}
          <div className="bg-[#ffffff] border-4 border-[#1a1a1a] p-4 [box-shadow:4px_4px_0px_#1a1a1a] flex flex-col justify-between">
            <div>
              <h3 className="font-[Space Grotesk] font-black uppercase text-sm border-b-2 border-[#1a1a1a] pb-1.5 mb-3">
                Ingest Efficiency Breakdown
              </h3>
              <p className="font-mono text-xs text-gray-600 mb-4">
                API integration queries represent our fastest validation vector. Internal routing keeps cross-border validation under optimal SLA limits of 15ms.
              </p>
              <div className="space-y-3">
                {[
                  { metric: "Ledger writing throughput", pct: "98.9%", width: "w-[98.9%]", color: "bg-[#0055ff]" },
                  { metric: "Dynamic hash propagation", pct: "94.0%", width: "w-[94.0%]", color: "bg-[#ffcc00]" },
                  { metric: "Anomalous signature block locks", pct: "85.2%", width: "w-[85.2%]", color: "bg-[#e63b2e]" },
                ].map((item, i) => (
                  <div key={i}>
                    <div className="flex justify-between items-center font-mono text-[10px] font-bold text-[#1a1a1a] mb-1">
                      <span>{item.metric.toUpperCase()}</span>
                      <span>{item.pct}</span>
                    </div>
                    <div className="h-3 bg-gray-100 border-2 border-[#1a1a1a]">
                      <div className={`h-full ${item.color} border-r-2 border-[#1a1a1a] ${item.width}`}></div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // --- 3. RISK REPORTS VIEW ---
  if (currentTab === "RISK") {
    // Generate simulated override action
    const handleBypassUser = (user: string) => {
      onAddLog({
        vector: "OVERRIDE",
        vectorCategory: "HUMAN",
        entityHash: user,
        payload: `Compliance warning manual bypass approved for key user ${user}.`,
        details: {
          origin: "Compliance-Auditor-Terminal",
          operatorId: "ADM-99",
          latencyMs: 140,
          payloadJson: `{\n  "action": "MANUAL_BYPASS",\n  "target_user_id": "${user}",\n  "regulatory_review": "COMPLIANT_EXCLUSION_GRANTED",\n  "granted_by": "Compliance Officer"\n}`
        }
      });
      setPendingOverridden([...pendingOverridden, user]);
    };

    // Simulated ledger freeze action
    const handleFreezeUser = (user: string) => {
      onAddLog({
        vector: "OVERRIDE",
        vectorCategory: "SYS",
        entityHash: user,
        payload: `CRITICAL SEC_LOCK: User profile ${user} frozen indefinitely.`,
        details: {
          origin: "Compliance-Auditor-Terminal",
          operatorId: "ADM-99",
          latencyMs: 190,
          payloadJson: `{\n  "action": "LEDGER_LOCKOUT_EXEC",\n  "subject": "${user}",\n  "reason": "Anomalous flash-loan vector transaction signature",\n  "security_escalation": "CRITICAL_SEV_1"\n}`
        }
      });
      setFrozenUsers([...frozenUsers, user]);
    };

    return (
      <div className="space-y-6 select-none animate-fadeIn">
        <div className="bg-[#1a1a1a] text-[#ffffff] p-6 border-4 border-[#1a1a1a] [box-shadow:4px_4px_0px_#1a1a1a]">
          <h2 className="font-[Space Grotesk] text-4xl font-black uppercase tracking-tight">AI Risk Audit Deck</h2>
          <p className="font-mono text-xs text-[#ffcc00] uppercase font-bold mt-1">
            Actions ledger interface for overrides and manual system blocks
          </p>
        </div>

        {/* Board grid of risk reports requiring manual auditor override review */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {[
            { user: "USR-ALPHA-09", reason: "Anomalous large liquidity withdrawal in Swiss Francs (CHF)", score: 88 },
            { user: "USR-GAMMA-12", reason: "Repetitive connection queries routing from multiple nested VPNS", score: 92 },
          ].map((item, i) => {
            const isApproved = pendingOverridden.includes(item.user);
            const isLocked = frozenUsers.includes(item.user);

            return (
              <div key={i} className="bg-[#ffffff] border-4 border-[#1a1a1a] p-5 [box-shadow:4px_4px_0px_#1a1a1a] flex flex-col justify-between">
                <div>
                  <div className="flex justify-between items-start mb-3 border-b-2 border-dashed border-[#1a1a1a] pb-2">
                    <span className="font-mono text-sm font-black text-[#101010] bg-[#ffcc00] border-2 border-[#1a1a1a] px-2 py-0.5">
                      {item.user}
                    </span>
                    <span className={`font-mono text-xs font-black border-2 border-[#1a1a1a] px-2 py-0.5 ${
                      isLocked ? "bg-[#e63b2e] text-white" : "bg-white text-[#e63b2e]"
                    }`}>
                      RISK SCORE: {item.score}
                    </span>
                  </div>
                  <p className="font-mono text-xs text-gray-700 leading-relaxed mb-4">
                    {item.reason}
                  </p>
                </div>

                <div className="gap-3 flex items-center mt-2">
                  {isApproved ? (
                    <span className="bg-[#2e7d32]/10 text-[#2e7d32] border-2 border-[#2e7d32] font-mono text-xs font-black py-2 text-center w-full uppercase">
                      BYPASS SIGNED OFF
                    </span>
                  ) : isLocked ? (
                    <span className="bg-[#e63b2e]/10 text-[#e63b2e] border-2 border-[#e63b2e] font-mono text-xs font-black py-2 text-center w-full uppercase">
                      PROFILE FROZEN - BLOCKED
                    </span>
                  ) : (
                    <>
                      <button
                        onClick={() => handleBypassUser(item.user)}
                        className="flex-1 bg-[#ffcc00] border-2 border-[#1a1a1a] text-xs font-mono font-black py-2 hover:bg-[#ffcc00]/90 active:translate-y-0.5 transition-all text-center uppercase cursor-pointer [box-shadow:2px_2px_0px_#1a1a1a]"
                      >
                        Bypass Alert
                      </button>
                      <button
                        onClick={() => handleFreezeUser(item.user)}
                        className="flex-1 bg-[#e63b2e] text-white border-2 border-[#1a1a1a] text-xs font-mono font-black py-2 hover:bg-[#e63b2e]/90 active:translate-y-0.5 transition-all text-center uppercase cursor-pointer [box-shadow:2px_2px_0px_#1a1a1a]"
                      >
                        Block Ledger Profile
                      </button>
                    </>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    );
  }

  // --- 4. SETTINGS VIEW ---
  if (currentTab === "SETTINGS") {
    return (
      <div className="space-y-6 select-none animate-fadeIn">
        <div className="bg-[#1a1a1a] text-[#ffffff] p-6 border-4 border-[#1a1a1a] [box-shadow:4px_4px_0px_#1a1a1a]">
          <h2 className="font-[Space Grotesk] text-4xl font-black uppercase tracking-tight">Compliance Configs</h2>
          <p className="font-mono text-xs text-[#ffcc00] uppercase font-bold mt-1">
            Audit Ledger engine properties inputs
          </p>
        </div>

        <div className="bg-[#ffffff] border-4 border-[#1a1a1a] p-6 [box-shadow:4px_4px_0px_#1a1a1a] space-y-6">
          {/* Stream API */}
          <div>
            <label className="font-mono text-xs font-black text-[#1a1a1a] uppercase block mb-1">
              Active ledger stream endpoint URL
            </label>
            <input
              type="text"
              value={streamUrl}
              onChange={(e) => setStreamUrl(e.target.value)}
              className="w-full bg-[#f5f0e8] text-sm font-mono font-bold p-2.5 border-2 border-[#1a1a1a] focus:outline-none focus:bg-[#ffcc00]/20 text-[#1a1a1a]"
            />
          </div>

          {/* Secret Key */}
          <div>
            <label className="font-mono text-xs font-black text-[#1a1a1a] uppercase block mb-1">
              HSM Verification Credentials Token
            </label>
            <input
              type="password"
              value={apiKey}
              onChange={(e) => setApiKey(e.target.value)}
              className="w-full bg-[#f5f0e8] text-sm font-mono font-bold p-2.5 border-2 border-[#1a1a1a] focus:outline-none focus:bg-[#ffcc00]/20 text-[#1a1a1a]"
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 border-t-2 border-[#1a1a1a] pt-4">
            {/* Range factor */}
            <div>
              <label className="font-mono text-xs font-black text-[#1a1a1a] uppercase block mb-1">
                Trigger heavy-audit warning threshold: {auditThreshold}% Critical Anomaly
              </label>
              <input
                type="range"
                min="50"
                max="95"
                value={auditThreshold}
                onChange={(e) => setAuditThreshold(Number(e.target.value))}
                className="w-full h-2 bg-[#f5f0e8] border-2 border-[#1a1a1a] rounded-lg appearance-none cursor-pointer accent-[#0055ff]"
              />
            </div>

            {/* Check Flag */}
            <div className="flex items-center gap-3">
              <input
                type="checkbox"
                id="autoApprove"
                checked={autoApprove}
                onChange={(e) => setAutoApprove(e.target.checked)}
                className="w-5 h-5 bg-[#f5f0e8] border-2 border-[#1a1a1a] rounded-xs text-[#0055ff] focus:ring-0 checked:bg-[#0055ff] checked:border-[#1a1a1a] accent-[#0055ff] cursor-pointer"
              />
              <label htmlFor="autoApprove" className="font-mono text-xs font-black text-[#1a1a1a] uppercase cursor-pointer">
                Auto-Commit consensus blocks on 100% election quorum
              </label>
            </div>
          </div>

          {/* Commit settings */}
          <div className="border-t-2 border-[#1a1a1a] pt-4 flex justify-end">
            <button
              onClick={() => alert("NetraAI compliance properties saved successfully!")}
              className="bg-[#0055ff] text-[#ffffff] font-[Space Grotesk] font-black uppercase text-sm px-6 py-2.5 border-4 border-[#1a1a1a] [box-shadow:3px_3px_0px_#1a1a1a] hover:-translate-y-0.5 active:translate-y-0.5 transition-all cursor-pointer"
            >
              Commit Compliance Rules
            </button>
          </div>
        </div>
      </div>
    );
  }

  return null;
}
