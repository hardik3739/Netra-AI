import { Bell, Settings } from "lucide-react";
import { SidebarTab } from "../types";

interface NavbarProps {
  activeTab: SidebarTab;
  onChangeTab: (tab: SidebarTab) => void;
  criticalCount: number;
}

export default function Navbar({ activeTab, onChangeTab, criticalCount }: NavbarProps) {
  return (
    <header className="fixed top-0 left-0 w-full z-50 flex justify-between items-center px-8 h-16 bg-[#f5f0e8] border-b-4 border-[#1a1a1a] [box-shadow:0px_2px_0px_0px_#1a1a1a] select-none">
      {/* Brand Logo */}
      <div className="flex items-center gap-4">
        <span 
          onClick={() => onChangeTab("AUDIT_TRAIL")}
          className="font-[Space Grotesk] text-2xl font-black text-[#1a1a1a] uppercase tracking-tighter cursor-pointer hover:bg-[#ffcc00] px-1"
        >
          NetraAI
        </span>
      </div>

      {/* Center Nav Link Tabs - Styled Exactly Like the Design */}
      <nav className="hidden md:flex gap-6 items-center">
        <button
          onClick={() => onChangeTab("DASHBOARD")}
          className={`px-3 py-1 border-2 transition-all font-[Space Grotesk] text-xs uppercase font-bold cursor-pointer ${
            activeTab === "DASHBOARD"
              ? "bg-[#1a1a1a] text-[#ffffff] border-[#1a1a1a] [box-shadow:2px_2px_0px_#1a1a1a]"
              : "text-[#1a1a1a] border-transparent hover:border-[#1a1a1a] hover:bg-[#ffcc00]/20"
          }`}
        >
          ForgeShield
        </button>

        <button
          onClick={() => onChangeTab("ANALYTICS")}
          className={`px-3 py-1 border-2 transition-all font-[Space Grotesk] text-xs uppercase font-bold cursor-pointer ${
            activeTab === "ANALYTICS"
              ? "bg-[#1a1a1a] text-[#ffffff] border-[#1a1a1a] [box-shadow:2px_2px_0px_#1a1a1a]"
              : "text-[#1a1a1a] border-transparent hover:border-[#1a1a1a] hover:bg-[#ffcc00]/20"
          }`}
        >
          RegPilot
        </button>

        <button
          onClick={() => onChangeTab("SETTINGS")}
          className={`px-3 py-1 border-2 transition-all font-[Space Grotesk] text-xs uppercase font-bold cursor-pointer ${
            activeTab === "SETTINGS"
              ? "bg-[#1a1a1a] text-[#ffffff] border-[#1a1a1a] [box-shadow:2px_2px_0px_#1a1a1a]"
              : "text-[#1a1a1a] border-transparent hover:border-[#1a1a1a] hover:bg-[#ffcc00]/20"
          }`}
        >
          Dashboard
        </button>

        <button
          onClick={() => onChangeTab("AUDIT_TRAIL")}
          className={`px-3 py-1 border-2 transition-all font-[Space Grotesk] text-xs uppercase font-black cursor-pointer ${
            activeTab === "AUDIT_TRAIL"
              ? "bg-[#1a1a1a] text-[#ffffff] border-[#1a1a1a] [box-shadow:2px_2px_0px_#1a1a1a]"
              : "text-[#1a1a1a] border-transparent hover:border-[#1a1a1a] hover:bg-[#ffcc00]/20"
          }`}
        >
          Audit Trail
        </button>
      </nav>

      {/* Right Controls */}
      <div className="flex items-center gap-4">
        {/* Dynamic Notification Bell */}
        <button 
          onClick={() => onChangeTab("RISK")}
          className="relative p-1.5 border-2 border-transparent hover:border-[#1a1a1a] hover:bg-[#ffcc00]/30 transition-all cursor-pointer rounded-sm"
          title="Critical Alerts Notifications"
        >
          <Bell size={20} className="text-[#1a1a1a] stroke-[2.5]" />
          {criticalCount > 0 && (
            <span className="absolute -top-1 -right-1 bg-[#e63b2e] text-[#ffffff] font-mono text-[9px] font-bold px-1.5 py-0.2 border border-[#1a1a1a] animate-bounce">
              {criticalCount}
            </span>
          )}
        </button>

        {/* Quick Settings Icon */}
        <button 
          onClick={() => onChangeTab("SETTINGS")}
          className="p-1.5 border-2 border-transparent hover:border-[#1a1a1a] hover:bg-[#ffcc00]/30 transition-all cursor-pointer rounded-sm"
          title="Configure System Settings"
        >
          <Settings size={20} className="text-[#1a1a1a] stroke-[2.5]" />
        </button>

        {/* Profile Avatar Frame with Local SVG Icon */}
        <button
          onClick={() => onChangeTab("SETTINGS")}
          className="w-9 h-9 border-2 border-[#1a1a1a] bg-[#e63b2e] cursor-pointer hover:scale-105 active:scale-95 transition-all [box-shadow:1px_1px_0px_#1a1a1a] flex items-center justify-center"
          title="User Account Settings"
        >
          <svg className="w-5 h-5 text-[#1a1a1a]" fill="currentColor" viewBox="0 0 24 24">
            <path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z" />
          </svg>
        </button>
      </div>
    </header>
  );
}
