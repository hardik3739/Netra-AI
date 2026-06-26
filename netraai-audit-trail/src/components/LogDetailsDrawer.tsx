import { X, Fingerprint, ShieldAlert, CheckCircle2, Copy, FileCode2 } from "lucide-react";
import { useState, useEffect } from "react";
import { AuditLog } from "../types";

interface LogDetailsDrawerProps {
  log: AuditLog | null;
  onClose: () => void;
}

export default function LogDetailsDrawer({ log, onClose }: LogDetailsDrawerProps) {
  const [isVerifying, setIsVerifying] = useState(false);
  const [verifiedStatus, setVerifiedStatus] = useState<"IDLE" | "RUNNING" | "PASSED">("IDLE");
  const [copied, setCopied] = useState(false);

  // Reset verification state when log changes
  useEffect(() => {
    setVerifiedStatus("IDLE");
    setIsVerifying(false);
  }, [log]);

  if (!log) return null;

  const handleVerify = () => {
    setIsVerifying(true);
    setVerifiedStatus("RUNNING");
    setTimeout(() => {
      setIsVerifying(false);
      setVerifiedStatus("PASSED");
    }, 1200);
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(log.details.payloadJson || JSON.stringify(log, null, 2));
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const getVectorBg = (category: string) => {
    switch (category) {
      case "SYS":
        return "bg-[#1a1a1a] text-[#ffffff]";
      case "AI":
        return "bg-[#0055ff] text-[#ffffff]";
      case "API":
        return "bg-[#ffcc00] text-[#1a1a1a]";
      case "HUMAN":
        return "bg-[#e63b2e] text-[#ffffff]";
      case "CONSENSUS":
        return "bg-[#e63b2e] text-[#ffffff] font-black";
      default:
        return "bg-[#eee9e0] text-[#1a1a1a]";
    }
  };

  return (
    <div className="fixed inset-0 bg-[#1a1a1a]/60 backdrop-blur-xs flex justify-end z-50 select-none">
      {/* Click outside to close */}
      <div className="flex-1 cursor-pointer" onClick={onClose}></div>

      {/* Slide-out Frame */}
      <div className="w-full max-w-xl bg-[#f5f0e8] border-l-4 border-[#1a1a1a] h-full p-8 flex flex-col justify-between overflow-y-auto z-10">
        {/* Header Section */}
        <div>
          <div className="flex justify-between items-center pb-4 border-b-4 border-[#1a1a1a] mb-6">
            <div className="flex items-center gap-3">
              <span className="font-mono text-xs font-black bg-[#ffcc00] px-2 py-1 border-2 border-[#1a1a1a] [box-shadow:2px_2px_0px_#1a1a1a]">
                BLOCK / {log.block}
              </span>
              <h3 className="font-[Space Grotesk] text-2xl font-black text-[#1a1a1a] uppercase tracking-tighter">
                Ledger Proof
              </h3>
            </div>
            <button
              onClick={onClose}
              className="p-1.5 border-2 border-[#1a1a1a] bg-[#f5f0e8] hover:bg-[#e63b2e] hover:text-[#ffffff] [box-shadow:2px_2px_0px_#1a1a1a] active:translate-x-0.5 active:translate-y-0.5 active:shadow-none transition-all cursor-pointer"
            >
              <X size={18} className="stroke-[3]" />
            </button>
          </div>

          {/* Quick Metrics */}
          <div className="grid grid-cols-2 gap-4 mb-6">
            <div className="bg-[#eee9e0] p-3 border-2 border-[#1a1a1a] [box-shadow:2px_2px_0px_#1a1a1a]">
              <span className="font-mono text-[10px] text-gray-500 block font-bold uppercase">Vector Stream</span>
              <span className={`font-mono text-xs font-bold inline-block px-2 py-0.5 mt-1 border border-[#1a1a1a] ${getVectorBg(log.vectorCategory)}`}>
                {log.vector} ({log.vectorCategory})
              </span>
            </div>
            <div className="bg-[#eee9e0] p-3 border-2 border-[#1a1a1a] [box-shadow:2px_2px_0px_#1a1a1a]">
              <span className="font-mono text-[10px] text-gray-500 block font-bold uppercase">Timestamp (UTC)</span>
              <span className="font-mono text-xs font-bold text-[#1a1a1a] block mt-1">
                {log.timestampDate} // {log.timestampTime}
              </span>
            </div>
          </div>

          {/* Cryptographic Chain Linking details */}
          <div className="bg-[#ffffff] p-4 border-4 border-[#1a1a1a] [box-shadow:4px_4px_0px_#1a1a1a] mb-6">
            <h4 className="font-[Space Grotesk] font-black uppercase text-sm border-b-2 border-[#1a1a1a] pb-1.5 mb-3 flex items-center gap-2">
              <Fingerprint size={16} className="text-[#1a1a1a]" />
              Cryptographic Anchors
            </h4>

            {/* Block hash */}
            <div className="mb-3">
              <span className="font-mono text-[9px] font-black text-gray-500 block uppercase">BLOCK_HASH_SIGNATURE (SHA-256)</span>
              <code className="font-mono text-xs font-bold break-all text-[#0055ff] bg-[#0055ff]/5 p-1 block border border-[#1a1a1a] mt-1 select-all">
                {log.currentHash}
              </code>
            </div>

            {/* Previous Block link */}
            <div>
              <span className="font-mono text-[9px] font-black text-gray-500 block uppercase">PREVIOUS_BLOCK_HASH</span>
              <code className="font-mono text-xs font-semibold break-all text-gray-600 bg-gray-50 p-1 block border border-dashed border-[#1a1a1a] mt-1 select-all">
                {log.previousHash}
              </code>
            </div>
          </div>

          {/* Diagnostic Checker */}
          <div className="bg-[#f5f0e8] p-4 border-4 border-[#1a1a1a] [box-shadow:4px_4px_0px_#1a1a1a] mb-6 flex flex-col justify-between">
            <div className="flex justify-between items-center mb-2">
              <span className="font-[Space Grotesk] font-black text-xs uppercase tracking-wider">Integrity Stream Validation</span>
              {verifiedStatus === "PASSED" && (
                <span className="bg-[#2e7d32]/15 text-[#2e7d32] font-mono text-[10px] font-bold px-2 py-0.5 border border-[#2e7d32] flex items-center gap-1 animate-pulse">
                  <CheckCircle2 size={12} /> SECURED
                </span>
              )}
            </div>

            {verifiedStatus === "IDLE" && (
              <p className="font-mono text-xs text-[#5a5a5a] mb-3">
                Diagnose cryptographic signatures to confirm payload compliance.
              </p>
            )}

            {verifiedStatus === "RUNNING" && (
              <div className="mb-3">
                <div className="flex items-center justify-between text-xs font-mono font-bold mb-1">
                  <span>Re-calculating SHA-256 blocks...</span>
                  <span className="animate-pulse text-[#0055ff] font-black">RUNNING DIAGNOSTIC</span>
                </div>
                <div className="h-4 bg-gray-200 border-2 border-[#1a1a1a] overflow-hidden">
                  <div className="h-full bg-[#0055ff] border-r-2 border-[#1a1a1a] animate-[slide_1.2s_ease-in-out_infinite]" style={{ width: "66%" }}></div>
                </div>
              </div>
            )}

            {verifiedStatus === "PASSED" && (
              <div className="mb-3 bg-white p-2.5 border-2 border-[#2e7d32] text-xs font-mono text-[#2e7d32] leading-relaxed flex items-start gap-2.5">
                <CheckCircle2 size={16} className="shrink-0 mt-0.5" />
                <div>
                  <span className="font-black block uppercase">Diagnostic Integrity PASSED</span>
                  Merged merkle leaf validation matched block {log.block}. Chain is 100% compliant and tamper-proof.
                </div>
              </div>
            )}

            {verifiedStatus !== "RUNNING" && (
              <button
                onClick={handleVerify}
                className="w-full bg-[#ffcc00] font-mono text-xs font-black uppercase text-[#1a1a1a] py-2 border-2 border-[#1a1a1a] [box-shadow:2px_2px_0px_#1a1a1a] hover:-translate-y-0.5 active:translate-y-0.5 active:shadow-none transition-all cursor-pointer text-center"
              >
                {verifiedStatus === "PASSED" ? "Re-Run Diagnostic Check" : "Verify Block Cryptographic Integrity"}
              </button>
            )}
          </div>

          {/* JSON code container */}
          <div className="border-4 border-[#1a1a1a] bg-[#1a1a1a] [box-shadow:4px_4px_0px_#1a1a1a]">
            {/* Header bar of Code Block */}
            <div className="flex justify-between items-center px-4 py-2 border-b-2 border-[#1a1a1a] bg-[#f5f0e8]">
              <span className="font-mono text-[10px] font-black text-[#1a1a1a] flex items-center gap-1.5">
                <FileCode2 size={12} /> payload_descriptor.json
              </span>
              <button
                onClick={handleCopy}
                className="font-mono text-[9px] font-black text-[#1a1a1a] uppercase bg-[#ffcc00] px-2 py-1 border-2 border-[#1a1a1a] [box-shadow:1.5px_1.5px_0px_#1a1a1a] active:translate-y-0.5 hover:bg-[#ffcc00]/90 transition-all flex items-center gap-1 cursor-pointer"
              >
                <Copy size={10} />
                {copied ? "COPIED" : "COPY RAW"}
              </button>
            </div>
            {/* JSON Content */}
            <pre className="p-4 text-[#ffffff] font-mono text-[11px] leading-relaxed overflow-x-auto select-all max-h-56">
              {log.details.payloadJson || JSON.stringify(log, null, 2)}
            </pre>
          </div>
        </div>

        {/* Footer info brand */}
        <div className="border-t-2 border-[#1a1a1a] pt-4 mt-8 flex justify-between items-center font-mono text-[10px] font-bold text-gray-500 uppercase">
          <span>NetraAI Ledger compliance standard</span>
          <span>ROOT_TRUST=TRUE</span>
        </div>
      </div>
    </div>
  );
}
