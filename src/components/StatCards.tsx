import { ArrowUpRight, ArrowDownRight } from "lucide-react";
import { useEffect, useState } from "react";

interface StatCardsProps {
  totalEventsCount: number; // Keep track of dynamically simulated increments
  criticalAlerts: number;
  aiAuditsCount: number;
  apiActive: boolean;
}

export default function StatCards({
  totalEventsCount,
  criticalAlerts,
  aiAuditsCount,
  apiActive,
}: StatCardsProps) {
  const [latency, setLatency] = useState(12);

  // Experience Polish: Make the sync latency flicker realistically to signify live connection
  useEffect(() => {
    if (!apiActive) return;
    const interval = setInterval(() => {
      setLatency((prev) => {
        const delta = Math.random() > 0.5 ? 1 : -1;
        const next = prev + delta;
        return next < 8 ? 8 : next > 16 ? 16 : next;
      });
    }, 2500);

    return () => clearInterval(interval);
  }, [apiActive]);

  const formattedEvents = (totalEventsCount / 1000000).toFixed(6);

  return (
    <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-6 select-none">
      {/* Total Events */}
      <div className="bg-[#ffcc00] p-4 border-4 border-[#1a1a1a] [box-shadow:4px_4px_0px_#1a1a1a] hover:-translate-y-0.5 active:translate-y-0.5 transition-all">
        <p className="font-mono text-xs font-black uppercase border-b-2 border-[#1a1a1a] pb-2 mb-2 text-[#1a1a1a]">
          Total Events
        </p>
        <div className="flex items-end justify-between">
          <span className="font-[Space Grotesk] text-4.5xl font-black text-[#1a1a1a] tracking-tight leading-none">
            {formattedEvents.slice(0, 5)}M+
          </span>
          <span className="bg-[#f5f0e8] border-2 border-[#1a1a1a] px-1.5 py-0.5 font-mono text-[10px] font-bold flex items-center gap-0.5 [box-shadow:1.5px_1.5px_0px_#1a1a1a] text-[#1a1a1a]">
            +12.4% <ArrowUpRight size={10} className="stroke-[3]" />
          </span>
        </div>
      </div>

      {/* Critical Alerts */}
      <div className="bg-[#e63b2e] p-4 border-4 border-[#1a1a1a] [box-shadow:4px_4px_0px_#1a1a1a] text-[#ffffff] hover:-translate-y-0.5 active:translate-y-0.5 transition-all">
        <p className="font-mono text-xs font-bold uppercase border-b-2 border-[#ffffff]/40 pb-2 mb-2 text-[#ffffff]">
          Critical Alerts
        </p>
        <div className="flex items-end justify-between">
          <span className="font-[Space Grotesk] text-4.5xl font-black tracking-tight leading-none">
            {criticalAlerts}
          </span>
          <span className="bg-[#f5f0e8] text-[#1a1a1a] border-2 border-[#1a1a1a] px-1.5 py-0.5 font-mono text-[10px] font-bold flex items-center gap-0.5 [box-shadow:1.5px_1.5px_0px_#1a1a1a]">
            -2.1% <ArrowDownRight size={10} className="stroke-[3]" />
          </span>
        </div>
      </div>

      {/* AI Audits */}
      <div className="bg-[#0055ff] p-4 border-4 border-[#1a1a1a] [box-shadow:4px_4px_0px_#1a1a1a] text-[#ffffff] hover:-translate-y-0.5 active:translate-y-0.5 transition-all">
        <p className="font-mono text-xs font-bold uppercase border-b-2 border-[#ffffff]/40 pb-2 mb-2 text-[#ffffff]">
          AI Audits
        </p>
        <div className="flex items-end justify-between">
          <span className="font-[Space Grotesk] text-4.5xl font-black tracking-tight leading-none">
            {(aiAuditsCount / 1000).toFixed(1)}K
          </span>
          <span className="bg-[#f5f0e8] text-[#1a1a1a] border-2 border-[#1a1a1a] px-1.5 py-0.5 font-mono text-[10px] font-bold flex items-center gap-0.5 [box-shadow:1.5px_1.5px_0px_#1a1a1a]">
            +5.8% <ArrowUpRight size={10} className="stroke-[3]" />
          </span>
        </div>
      </div>

      {/* Sync Latency */}
      <div className="bg-[#f5f0e8] p-4 border-4 border-[#1a1a1a] [box-shadow:4px_4px_0px_#1a1a1a] hover:-translate-y-0.5 active:translate-y-0.5 transition-all">
        <p className="font-mono text-xs font-black uppercase border-b-2 border-[#1a1a1a] pb-2 mb-2 text-[#1a1a1a]">
          Sync Latency
        </p>
        <div className="flex items-end justify-between">
          <span className="font-[Space Grotesk] text-4.5xl font-black text-[#1a1a1a] tracking-tight leading-none">
            {apiActive ? `${latency}ms` : "OFFLINE"}
          </span>
          <span className={`border-2 border-[#1a1a1a] px-2 py-0.5 font-mono text-[9px] font-black tracking-wider [box-shadow:1.5px_1.5px_0px_#1a1a1a] ${
            apiActive ? "bg-[#ffcc00] text-[#1a1a1a]" : "bg-[#efede6] text-[#4a4a4a]"
          }`}>
            {apiActive ? "OPTIMAL" : "STALLED"}
          </span>
        </div>
      </div>
    </div>
  );
}
