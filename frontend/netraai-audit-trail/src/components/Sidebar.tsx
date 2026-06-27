import { 
  LayoutDashboard, LineChart, ShieldAlert, Settings, 
  ShieldCheck, Shield, FileText, Activity 
} from "lucide-react";
import { SidebarTab } from "../types";

interface SidebarProps {
  activeTab: SidebarTab;
  onChangeTab: (tab: SidebarTab) => void;
  apiActive: boolean;
}

export default function Sidebar({ activeTab, onChangeTab, apiActive }: SidebarProps) {
  return (
    <aside className="fixed left-0 top-16 h-[calc(100vh-64px)] p-5 w-64 bg-[#f5f0e8] border-r-4 border-[#1a1a1a] flex flex-col z-40 select-none overflow-y-auto">
      
      {/* Brand Header */}
      <div className="mb-6 pb-4 border-b-4 border-[#1a1a1a]">
        <h2 className="font-[Space Grotesk] text-3xl font-black text-[#1a1a1a] uppercase tracking-tighter">NetraAI</h2>
        <p className="font-mono text-xs text-[#1a1a1a] font-bold bg-[#ffcc00] inline-block px-2 py-0.5 mt-1 border-2 border-[#1a1a1a]">
          CORE.V.2.5
        </p>
      </div>

      <nav className="flex flex-col gap-5 flex-1">
        
        {/* SECTION 1: AI CORE MODULES */}
        <div className="space-y-2">
          <p className="font-mono text-[10px] text-gray-500 font-extrabold uppercase tracking-wider px-1 mb-1">
            AI Core Modules
          </p>
          
          {/* ForgeShield */}
          <button
            onClick={() => onChangeTab("FORGESHIELD")}
            className={`flex items-center gap-3 p-2.5 font-[Space Grotesk] uppercase font-black text-xs border-2 transition-all cursor-pointer text-left w-full ${
              activeTab === "FORGESHIELD"
                ? "bg-[#1a1a1a] text-[#ffffff] border-[#1a1a1a] [box-shadow:2px_2px_0px_#1a1a1a]"
                : "text-[#1a1a1a] border-transparent hover:border-[#1a1a1a] hover:bg-[#ffcc00]/25"
            }`}
          >
            <Shield size={16} className={activeTab === "FORGESHIELD" ? "text-[#ffcc00]" : "text-[#1a1a1a]"} />
            <span>ForgeShield Scan</span>
          </button>

          {/* RegPilot */}
          <button
            onClick={() => onChangeTab("REGPILOT")}
            className={`flex items-center gap-3 p-2.5 font-[Space Grotesk] uppercase font-black text-xs border-2 transition-all cursor-pointer text-left w-full ${
              activeTab === "REGPILOT"
                ? "bg-[#1a1a1a] text-[#ffffff] border-[#1a1a1a] [box-shadow:2px_2px_0px_#1a1a1a]"
                : "text-[#1a1a1a] border-transparent hover:border-[#1a1a1a] hover:bg-[#ffcc00]/25"
            }`}
          >
            <FileText size={16} className={activeTab === "REGPILOT" ? "text-[#ffcc00]" : "text-[#1a1a1a]"} />
            <span>RegPilot Agent</span>
          </button>

          {/* Fraud Pattern Library */}
          <button
            onClick={() => onChangeTab("FRAUD_PATTERNS")}
            className={`flex items-center gap-3 p-2.5 font-[Space Grotesk] uppercase font-black text-xs border-2 transition-all cursor-pointer text-left w-full ${
              activeTab === "FRAUD_PATTERNS"
                ? "bg-[#1a1a1a] text-[#ffffff] border-[#1a1a1a] [box-shadow:2px_2px_0px_#1a1a1a]"
                : "text-[#1a1a1a] border-transparent hover:border-[#1a1a1a] hover:bg-[#ffcc00]/25"
            }`}
          >
            <Activity size={16} className={activeTab === "FRAUD_PATTERNS" ? "text-[#ffcc00]" : "text-[#1a1a1a]"} />
            <span>Fraud Patterns</span>
          </button>
        </div>

        {/* SECTION 2: TELEMETRY & LEDGER LOGS */}
        <div className="space-y-2">
          <p className="font-mono text-[10px] text-gray-500 font-extrabold uppercase tracking-wider px-1 mb-1">
            Ledger & Telemetry
          </p>

          {/* Audit Trail */}
          <button
            onClick={() => onChangeTab("AUDIT_TRAIL")}
            className={`flex items-center gap-3 p-2.5 font-[Space Grotesk] uppercase font-bold text-xs border-2 transition-all cursor-pointer text-left w-full ${
              activeTab === "AUDIT_TRAIL"
                ? "bg-[#1a1a1a] text-[#ffffff] border-[#1a1a1a] [box-shadow:2px_2px_0px_#1a1a1a]"
                : "text-[#1a1a1a] border-transparent hover:border-[#1a1a1a] hover:bg-[#ffcc00]/25"
            }`}
          >
            <ShieldCheck size={16} className={activeTab === "AUDIT_TRAIL" ? "text-[#ffcc00]" : "text-[#1a1a1a]"} />
            <span>Audit Ledger</span>
          </button>

          {/* Telemetry Dashboard */}
          <button
            onClick={() => onChangeTab("DASHBOARD")}
            className={`flex items-center gap-3 p-2.5 font-[Space Grotesk] uppercase font-bold text-xs border-2 transition-all cursor-pointer text-left w-full ${
              activeTab === "DASHBOARD"
                ? "bg-[#1a1a1a] text-[#ffffff] border-[#1a1a1a] [box-shadow:2px_2px_0px_#1a1a1a]"
                : "text-[#1a1a1a] border-transparent hover:border-[#1a1a1a] hover:bg-[#ffcc00]/25"
            }`}
          >
            <LayoutDashboard size={16} className={activeTab === "DASHBOARD" ? "text-[#ffcc00]" : "text-[#1a1a1a]"} />
            <span>Node Telemetry</span>
          </button>

          {/* Analytics */}
          <button
            onClick={() => onChangeTab("ANALYTICS")}
            className={`flex items-center gap-3 p-2.5 font-[Space Grotesk] uppercase font-bold text-xs border-2 transition-all cursor-pointer text-left w-full ${
              activeTab === "ANALYTICS"
                ? "bg-[#1a1a1a] text-[#ffffff] border-[#1a1a1a] [box-shadow:2px_2px_0px_#1a1a1a]"
                : "text-[#1a1a1a] border-transparent hover:border-[#1a1a1a] hover:bg-[#ffcc00]/25"
            }`}
          >
            <LineChart size={16} className={activeTab === "ANALYTICS" ? "text-[#ffcc00]" : "text-[#1a1a1a]"} />
            <span>Performance</span>
          </button>

          {/* Risk Overrides */}
          <button
            onClick={() => onChangeTab("RISK")}
            className={`flex items-center gap-3 p-2.5 font-[Space Grotesk] uppercase font-bold text-xs border-2 transition-all cursor-pointer text-left w-full ${
              activeTab === "RISK"
                ? "bg-[#1a1a1a] text-[#ffffff] border-[#1a1a1a] [box-shadow:2px_2px_0px_#1a1a1a]"
                : "text-[#1a1a1a] border-transparent hover:border-[#1a1a1a] hover:bg-[#e63b2e]/25"
            }`}
          >
            <ShieldAlert size={16} className={activeTab === "RISK" ? "text-[#e63b2e]" : "text-[#1a1a1a]"} />
            <span>Risk Override</span>
          </button>
        </div>

        {/* SECTION 3: SYSTEM SETTINGS */}
        <div className="space-y-2 mt-auto">
          <button
            onClick={() => onChangeTab("SETTINGS")}
            className={`flex items-center gap-3 p-2.5 font-[Space Grotesk] uppercase font-bold text-xs border-2 transition-all cursor-pointer text-left w-full ${
              activeTab === "SETTINGS"
                ? "bg-[#1a1a1a] text-[#ffffff] border-[#1a1a1a] [box-shadow:2px_2px_0px_#1a1a1a]"
                : "text-[#1a1a1a] border-transparent hover:border-[#1a1a1a] hover:bg-[#0055ff]/25"
            }`}
          >
            <Settings size={16} className={activeTab === "SETTINGS" ? "text-[#0055ff]" : "text-[#1a1a1a]"} />
            <span>System Configs</span>
          </button>
        </div>

      </nav>

      {/* Stream Status footer */}
      <div className="mt-4 p-3.5 bg-[#eee9e0] border-4 border-[#1a1a1a] [box-shadow:2px_2px_0px_#1a1a1a]">
        <p className="text-[10px] font-mono font-bold mb-1.5 uppercase border-b border-[#1a1a1a]/30 pb-0.5">Stream status</p>
        <div className="flex items-center gap-2">
          <div
            className={`w-2.5 h-2.5 border border-[#1a1a1a] transition-all duration-300 ${
              apiActive ? "bg-[#e63b2e] animate-pulse" : "bg-[#4a4a4a]"
            }`}
          ></div>
          <span className="text-[10px] font-mono font-bold text-[#1a1a1a] truncate">
            API: {apiActive ? "ACTIVE" : "PAUSED"}
          </span>
        </div>
      </div>
    </aside>
  );
}
