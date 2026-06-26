import { LayoutDashboard, LineChart, ShieldAlert, Settings, ShieldCheck } from "lucide-react";
import { SidebarTab } from "../types";

interface SidebarProps {
  activeTab: SidebarTab;
  onChangeTab: (tab: SidebarTab) => void;
  apiActive: boolean;
}

export default function Sidebar({ activeTab, onChangeTab, apiActive }: SidebarProps) {
  return (
    <aside className="fixed left-0 top-16 h-[calc(100vh-64px)] p-6 w-64 bg-[#f5f0e8] border-r-4 border-[#1a1a1a] flex flex-col z-40 select-none">
      <div className="mb-8 pb-4 border-b-4 border-[#1a1a1a]">
        <h2 className="font-[Space Grotesk] text-3xl font-black text-[#1a1a1a] uppercase tracking-tighter">NetraAI</h2>
        <p className="font-mono text-xs text-[#1a1a1a] font-bold bg-[#ffcc00] inline-block px-2 py-0.5 mt-1 border-2 border-[#1a1a1a]">
          SYS.V.2.4
        </p>
      </div>

      <nav className="flex flex-col gap-3 flex-1">
        {/* Audit Trail - The Masterpiece screen highlighted in design request */}
        <button
          onClick={() => onChangeTab("AUDIT_TRAIL")}
          className={`flex items-center gap-3 p-3 font-[Space Grotesk] uppercase font-black text-sm border-2 transition-all cursor-pointer text-left ${
            activeTab === "AUDIT_TRAIL"
              ? "bg-[#1a1a1a] text-[#ffffff] border-[#1a1a1a] [box-shadow:2px_2px_0px_#1a1a1a]"
              : "text-[#1a1a1a] border-transparent hover:border-[#1a1a1a] hover:bg-[#ffcc00]/25"
          }`}
        >
          <ShieldCheck size={20} className={activeTab === "AUDIT_TRAIL" ? "text-[#ffcc00]" : "text-[#1a1a1a]"} />
          <span>Audit Trail</span>
        </button>

        {/* Dashboard */}
        <button
          onClick={() => onChangeTab("DASHBOARD")}
          className={`flex items-center gap-3 p-3 font-[Space Grotesk] uppercase font-bold text-sm border-2 transition-all cursor-pointer text-left ${
            activeTab === "DASHBOARD"
              ? "bg-[#1a1a1a] text-[#ffffff] border-[#1a1a1a] [box-shadow:2px_2px_0px_#1a1a1a]"
              : "text-[#1a1a1a] border-transparent hover:border-[#1a1a1a] hover:bg-[#ffcc00]/25"
          }`}
        >
          <LayoutDashboard size={20} className={activeTab === "DASHBOARD" ? "text-[#ffcc00]" : "text-[#1a1a1a]"} />
          <span>Dashboard</span>
        </button>

        {/* Analytics */}
        <button
          onClick={() => onChangeTab("ANALYTICS")}
          className={`flex items-center gap-3 p-3 font-[Space Grotesk] uppercase font-bold text-sm border-2 transition-all cursor-pointer text-left ${
            activeTab === "ANALYTICS"
              ? "bg-[#1a1a1a] text-[#ffffff] border-[#1a1a1a] [box-shadow:2px_2px_0px_#1a1a1a]"
              : "text-[#1a1a1a] border-transparent hover:border-[#1a1a1a] hover:bg-[#ffcc00]/25"
          }`}
        >
          <LineChart size={20} className={activeTab === "ANALYTICS" ? "text-[#ffcc00]" : "text-[#1a1a1a]"} />
          <span>Analytics</span>
        </button>

        {/* Risk Reports */}
        <button
          onClick={() => onChangeTab("RISK")}
          className={`flex items-center gap-3 p-3 font-[Space Grotesk] uppercase font-bold text-sm border-2 transition-all cursor-pointer text-left ${
            activeTab === "RISK"
              ? "bg-[#1a1a1a] text-[#ffffff] border-[#1a1a1a] [box-shadow:2px_2px_0px_#1a1a1a]"
              : "text-[#1a1a1a] border-transparent hover:border-[#1a1a1a] hover:bg-[#e63b2e]/25"
          }`}
        >
          <ShieldAlert size={20} className={activeTab === "RISK" ? "text-[#e63b2e]" : "text-[#1a1a1a]"} />
          <span>Risk Reports</span>
        </button>

        {/* Settings */}
        <button
          onClick={() => onChangeTab("SETTINGS")}
          className={`flex items-center gap-3 p-3 font-[Space Grotesk] uppercase font-bold text-sm border-2 transition-all cursor-pointer text-left ${
            activeTab === "SETTINGS"
              ? "bg-[#1a1a1a] text-[#ffffff] border-[#1a1a1a] [box-shadow:2px_2px_0px_#1a1a1a]"
              : "text-[#1a1a1a] border-transparent hover:border-[#1a1a1a] hover:bg-[#0055ff]/25"
          }`}
        >
          <Settings size={20} className={activeTab === "SETTINGS" ? "text-[#0055ff]" : "text-[#1a1a1a]"} />
          <span>Settings</span>
        </button>
      </nav>

      <div className="mt-auto p-4 bg-[#eee9e0] border-4 border-[#1a1a1a] [box-shadow:3px_3px_0px_#1a1a1a]">
        <p className="text-xs font-mono font-bold mb-2 uppercase border-b-2 border-[#1a1a1a] pb-1">System Status</p>
        <div className="flex items-center gap-2">
          <div
            className={`w-3 h-3 border-2 border-[#1a1a1a] transition-all duration-300 ${
              apiActive ? "bg-[#e63b2e] animate-pulse" : "bg-[#4a4a4a]"
            }`}
          ></div>
          <span className="text-xs font-mono font-black text-[#1a1a1a]">
            API: audit/stream {apiActive ? "[OK]" : "[PAUSED]"}
          </span>
        </div>
      </div>
    </aside>
  );
}
