import { Plus, HelpCircle, ShieldCheck } from "lucide-react";
import { useState, FormEvent } from "react";
import { AuditLog, VectorCategory } from "../types";

interface SimulationPanelProps {
  onAddLog: (newLog: Partial<AuditLog>) => void;
  lastBlockHash: string;
}

export default function SimulationPanel({ onAddLog, lastBlockHash }: SimulationPanelProps) {
  const [vector, setVector] = useState("SANDBOX_SIM");
  const [category, setCategory] = useState<VectorCategory>("SANDBOX");
  const [entityHash, setEntityHash] = useState("TRX-7749-AF");
  const [payload, setPayload] = useState("Critical compliance diagnostic executed. All checksums valid.");
  const [origin, setOrigin] = useState("Sandbox-Agent-Alpha");
  const [riskFactor, setRiskFactor] = useState(15);
  const [successMessage, setSuccessMessage] = useState(false);

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();

    // Map Category based on Vector selection for compliance
    let mappedCategory: VectorCategory = "SANDBOX";
    if (vector === "QUERY_INIT") mappedCategory = "SYS";
    else if (vector === "NEURAL_EVAL") mappedCategory = "AI";
    else if (vector === "DATA_INGEST") mappedCategory = "API";
    else if (vector === "OVERRIDE") mappedCategory = "HUMAN";
    else if (vector === "VERIFIED") mappedCategory = "CONSENSUS";

    const customJson = `{\n  "source_agent": "${origin}",\n  "audit_entity": "${entityHash}",\n  "custom_payload": "${payload}",\n  "compliance_parameters": {\n    "risk_index": ${riskFactor / 100},\n    "sandboxed": true,\n    "pre_verified": true\n  }\n}`;

    onAddLog({
      vector,
      vectorCategory: mappedCategory,
      entityHash,
      payload,
      details: {
        origin,
        riskAdjustedFrom: 8,
        riskAdjustedTo: riskFactor,
        protocolVersion: "v2.4.9-sandboxed",
        payloadJson: customJson,
        latencyMs: Math.floor(Math.random() * 80) + 10,
      }
    });

    setSuccessMessage(true);
    setTimeout(() => setSuccessMessage(false), 3000);

    // Randomize some fields for the next entry
    const idSeed = Math.floor(1000 + Math.random() * 9000);
    setEntityHash(`TRX-${idSeed}-BB`);
  };

  return (
    <div className="bg-[#ffffff] border-4 border-[#1a1a1a] p-6 [box-shadow:4px_4px_0px_#1a1a1a] mb-8 select-none">
      <div className="flex items-center gap-3 border-b-2 border-[#1a1a1a] pb-3 mb-4">
        <div className="w-8 h-8 bg-[#ffcc00] border-2 border-[#1a1a1a] flex items-center justify-center font-black [box-shadow:1.5px_1.5px_0px_#1a1a1a]">
          <Plus size={16} />
        </div>
        <h3 className="font-[Space Grotesk] text-xl font-black uppercase text-[#1a1a1a] tracking-tight">
          Simulate Ledger Event
        </h3>
      </div>

      <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Vector Type */}
        <div>
          <label className="font-mono text-[10px] font-black text-[#1a1a1a] uppercase block mb-1">
            Compliance Vector
          </label>
          <select
            value={vector}
            onChange={(e) => {
              setVector(e.target.value);
              // Auto-adjust categories
              const v = e.target.value;
              if (v === "QUERY_INIT") setCategory("SYS");
              else if (v === "NEURAL_EVAL") setCategory("AI");
              else if (v === "DATA_INGEST") setCategory("API");
              else if (v === "OVERRIDE") setCategory("HUMAN");
              else if (v === "VERIFIED") setCategory("CONSENSUS");
              else setCategory("SANDBOX");
            }}
            className="w-full bg-[#f5f0e8] text-sm text-[#1a1a1a] font-mono font-bold p-2.5 border-2 border-[#1a1a1a] focus:outline-none focus:bg-[#ffcc00]/20"
          >
            <option value="SANDBOX_SIM">SANDBOX_SIM (SANDBOX)</option>
            <option value="QUERY_INIT">QUERY_INIT (SYS)</option>
            <option value="NEURAL_EVAL">NEURAL_EVAL (AI)</option>
            <option value="DATA_INGEST">DATA_INGEST (API)</option>
            <option value="OVERRIDE">OVERRIDE (HUMAN)</option>
            <option value="VERIFIED">VERIFIED (CONSENSUS)</option>
          </select>
        </div>

        {/* Entity Hash ID */}
        <div>
          <label className="font-mono text-[10px] font-black text-[#1a1a1a] uppercase block mb-1">
            Entity Hash Key
          </label>
          <input
            type="text"
            required
            value={entityHash}
            onChange={(e) => setEntityHash(e.target.value)}
            className="w-full bg-[#f5f0e8] text-sm font-mono font-bold p-2 border-2 border-[#1a1a1a] focus:outline-none focus:bg-[#ffcc00]/20 text-[#1a1a1a]"
            placeholder="e.g. TRX-9981-AF"
          />
        </div>

        {/* Payload Statement */}
        <div className="md:col-span-2">
          <label className="font-mono text-[10px] font-black text-[#1a1a1a] uppercase block mb-1">
            Event Payload / Log message
          </label>
          <input
            type="text"
            required
            value={payload}
            onChange={(e) => setPayload(e.target.value)}
            className="w-full bg-[#f5f0e8] text-sm font-semibold p-2 border-2 border-[#1a1a1a] focus:outline-none focus:bg-[#ffcc00]/20 text-[#1a1a1a]"
            placeholder="Describe the transaction verification parameter..."
          />
        </div>

        {/* Origin node */}
        <div>
          <label className="font-mono text-[10px] font-black text-[#1a1a1a] uppercase block mb-1">
            System Origin Node
          </label>
          <input
            type="text"
            required
            value={origin}
            onChange={(e) => setOrigin(e.target.value)}
            className="w-full bg-[#f5f0e8] text-sm font-mono font-bold p-2 border-2 border-[#1a1a1a] focus:outline-none focus:bg-[#ffcc00]/20 text-[#1a1a1a]"
          />
        </div>

        {/* Risk weight factor */}
        <div>
          <label className="font-mono text-[10px] font-black text-[#1a1a1a] uppercase block mb-1">
            Simulated Risk Factor: {riskFactor}%
          </label>
          <input
            type="range"
            min="0"
            max="100"
            value={riskFactor}
            onChange={(e) => setRiskFactor(Number(e.target.value))}
            className="w-full h-2 bg-[#f5f0e8] border-2 border-[#1a1a1a] rounded-lg appearance-none cursor-pointer accent-[#e63b2e]"
          />
        </div>

        {/* Action button */}
        <div className="md:col-span-2 mt-2">
          <button
            type="submit"
            className="w-full bg-[#e63b2e] text-[#ffffff] font-[Space Grotesk] font-black uppercase text-sm py-2.5 border-4 border-[#1a1a1a] [box-shadow:4px_4px_0px_#1a1a1a] hover:-translate-y-0.5 active:translate-y-0.5 active:shadow-none transition-all cursor-pointer flex items-center justify-center gap-2"
          >
            <ShieldCheck size={18} /> Inject Cryptographic Compliance Block
          </button>
        </div>
      </form>

      {successMessage && (
        <div className="mt-4 bg-[#2e7d32]/10 border-2 border-[#2e7d32] p-3 text-xs font-mono text-[#2e7d32] flex items-center gap-2 animate-bounce">
          <div className="w-1.5 h-1.5 bg-[#2e7d32] rounded-full animate-ping"></div>
          <span>Block successfully chained onto anchor. Previous Hash resolved matching hash: <code className="font-black select-all">{lastBlockHash.slice(0, 16)}...</code></span>
        </div>
      )}
    </div>
  );
}
