import { useState, useEffect } from "react";
import type { ChangeEvent, DragEvent } from "react";
import { 
  Upload, AlertTriangle, FileText, CheckCircle2, 
  ChevronRight, Activity, Calendar, Hash, DollarSign, 
  RefreshCw, X, ShieldAlert, Layers
} from "lucide-react";
import { ScanResultItem, ScanResultDetails, HeatmapRegion } from "../types";

interface ForgeShieldProps {
  apiBase: string;
  onAddLog: (newLog: any) => void;
}

export default function ForgeShieldDashboard({ apiBase, onAddLog }: ForgeShieldProps) {
  type ExtractedEntities = NonNullable<NonNullable<ScanResultDetails["enriched"]>["entities"]>;
  const [file, setFile] = useState<File | null>(null);
  const [dragging, setDragging] = useState(false);
  const [scanState, setScanState] = useState<"idle" | "uploading" | "vit" | "nlp" | "gnn" | "success" | "error">("idle");
  const [statusMessage, setStatusMessage] = useState("");
  const [errorMessage, setErrorMessage] = useState("");
  const [history, setHistory] = useState<ScanResultItem[]>([]);
  const [selectedResult, setSelectedResult] = useState<ScanResultDetails | null>(null);
  const [isBackendConnected, setIsBackendConnected] = useState(false);
  const [matchedPatterns, setMatchedPatterns] = useState<any[]>([]);

  // Stats
  const [stats, setStats] = useState({
    total_scans: 0,
    high_risk: 0,
    medium_risk: 0,
    low_risk: 0,
    avg_risk: 0
  });

  // Fetch stats and history
  const loadStatsAndHistory = async () => {
    try {
      const histRes = await fetch(`${apiBase}/forgeshield/history`);
      if (histRes.ok) {
        const histData = await histRes.json();
        setHistory(histData);
        setIsBackendConnected(true);
      }
      
      const statsRes = await fetch(`${apiBase}/forgeshield/stats`);
      if (statsRes.ok) {
        const statsData = await statsRes.json();
        setStats(statsData);
      }
    } catch (e) {
      console.log("[ForgeShield] Backend down, using offline simulated data.");
      setIsBackendConnected(false);
      // Fallback simulated history if backend not connected
      if (history.length === 0) {
        const mockHistory: ScanResultItem[] = [
          {
            scan_id: "scan-mock-001",
            filename: "collateral_land_deed_SY789012.pdf",
            risk_score: 82.4,
            verdict: "HIGH RISK — Multiple anomaly layers detected",
            confidence: 89.2,
            created_at: new Date(Date.now() - 3600000 * 2).toISOString()
          },
          {
            scan_id: "scan-mock-002",
            filename: "salary_slip_fraudco_ltd.jpg",
            risk_score: 62.6,
            verdict: "MEDIUM RISK — Cross-validation anomalies found",
            confidence: 72.5,
            created_at: new Date(Date.now() - 3600000 * 24).toISOString()
          },
          {
            scan_id: "scan-mock-003",
            filename: "infosys_financial_statement.pdf",
            risk_score: 12.5,
            verdict: "LOW RISK — Document passes all integrity checks",
            confidence: 98.4,
            created_at: new Date(Date.now() - 3600000 * 48).toISOString()
          }
        ];
        setHistory(mockHistory);
        setStats({
          total_scans: 3,
          high_risk: 1,
          medium_risk: 1,
          low_risk: 1,
          avg_risk: 52.5
        });
      }
    }
  };

  useEffect(() => {
    loadStatsAndHistory();
  }, [apiBase]);

  // Load single result details
  const handleSelectResult = async (scanId: string) => {
    if (scanId.startsWith("scan-mock-")) {
      // Mock details
      const matched = history.find(h => h.scan_id === scanId);
      if (matched) {
        const mockDetails: ScanResultDetails = {
          scan_id: matched.scan_id,
          filename: matched.filename,
          risk_score: matched.risk_score,
          verdict: matched.verdict,
          confidence: matched.confidence,
          details: JSON.stringify({
            model: "google/vit-base-patch16-224",
            image_size: "1024x768",
            top_class: 48,
            risk_level: matched.risk_score > 70 ? "high" : matched.risk_score > 40 ? "medium" : "low",
            indicators: matched.risk_score > 70 
              ? ["Pixel-level inconsistencies detected", "Potential copy-paste manipulation", "Font irregularity detected"] 
              : ["No significant pixel anomalies detected"]
          }),
          created_at: matched.created_at,
          enriched: {
            semantic_score: matched.risk_score > 70 ? 85 : matched.risk_score > 40 ? 45 : 10,
            graph_score: matched.risk_score > 70 ? 70 : matched.risk_score > 40 ? 30 : 5,
            final_score: matched.risk_score,
            nlp_flags: matched.risk_score > 70 
              ? ["⚠ Land parcel SY789012 is already mortgaged with Canara Bank (Amount: ₹45,00,000)"]
              : matched.risk_score > 40
              ? ["⚠ Company 'FRAUDCO PRIVATE LIMITED' status is 'STRUCK OFF' in MCA21"]
              : [],
            gnn_anomalies: matched.risk_score > 70
              ? ["Isolated entities with no relationships detected", "Document has 3 disconnected entity clusters"]
              : [],
            entities: matched.risk_score > 70 
              ? { companies: ["CANARA BANK"], survey_numbers: ["SY789012"], amounts: ["₹45,00,000"], dates: ["24-10-2023"] }
              : { companies: ["FRAUDCO PRIVATE LIMITED"], amounts: ["₹5,00,000"], dates: ["24-10-2023"] },
            heatmap: matched.risk_score > 70
              ? [
                  { label: "Registry Mismatch Zone", x: 10, y: 35, w: 80, h: 12, risk: 0.85, color: "#e63b2e" },
                  { label: "Pixel anomaly", x: 8, y: 8, w: 35, h: 18, risk: 0.78, color: "#e63b2e" }
                ]
              : matched.risk_score > 40
              ? [{ label: "Entity status mismatch", x: 10, y: 40, w: 80, h: 10, risk: 0.45, color: "#ffcc00" }]
              : [],
            mca21: { results: {}, flags: [] },
            cersai: { results: {}, flags: [] }
          }
        };
        setSelectedResult(mockDetails);
      }
      return;
    }

    try {
      const res = await fetch(`${apiBase}/forgeshield/result/${scanId}`);
      if (res.ok) {
        const data = await res.json();
        setSelectedResult(data);
        setMatchedPatterns(data.matched_patterns || []);
      }
    } catch (e) {
      console.error("Failed to load scan details", e);
    }
  };

  const handleDragOver = (e: DragEvent) => {
    e.preventDefault();
    setDragging(true);
  };

  const handleDragLeave = () => {
    setDragging(false);
  };

  const handleDrop = (e: DragEvent) => {
    e.preventDefault();
    setDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      setFile(e.dataTransfer.files[0]);
      setScanState("idle");
      setErrorMessage("");
    }
  };

  const handleFileChange = (e: ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      setFile(e.target.files[0]);
      setScanState("idle");
      setErrorMessage("");
    }
  };

  // Run full multi-layer analysis
  const handleUploadSubmit = async () => {
    if (!file) return;

    setScanState("uploading");
    setStatusMessage("Uploading document metadata...");
    setErrorMessage("");

    // Setup animated step transitions to reflect real pipeline layers
    const timer1 = setTimeout(() => {
      setScanState("vit");
      setStatusMessage("Running Vision Transformer (ViT) pixel forgery scan...");
    }, 1200);

    const timer2 = setTimeout(() => {
      setScanState("nlp");
      setStatusMessage("Extracting text & validating entities vs MCA21/CERSAI registries...");
    }, 2800);

    const timer3 = setTimeout(() => {
      setScanState("gnn");
      setStatusMessage("Building Graph Neural Network (GNN) entity coherence model...");
    }, 4500);

    const formData = new FormData();
    formData.append("file", file);

    try {
      const res = await fetch(`${apiBase}/forgeshield/analyze/full`, {
        method: "POST",
        body: formData
      });

      clearTimeout(timer1);
      clearTimeout(timer2);
      clearTimeout(timer3);

      if (res.ok) {
        const result = await res.json();
        setScanState("success");
        setStatusMessage("Analysis complete!");
        // store matched patterns returned by the full analysis response
        setMatchedPatterns(result.matched_patterns || []);
        // temporarily show the returned result (matched patterns included)
        setSelectedResult(result as any);
        
        // Refresh history and stats
        await loadStatsAndHistory();
        
        // Set currently selected details
        await handleSelectResult(result.scan_id);
        
        // Log to ledger
        onAddLog({
          vector: "NEURAL_EVAL",
          vectorCategory: "AI",
          entityHash: `SCAN-${result.scan_id.substring(0, 8).toUpperCase()}`,
          payload: `ForgeShield: ${result.filename} verdict: ${result.verdict} (Risk: ${result.final_score}%)`,
          details: {
            origin: "ForgeShield-Inference-Pipeline",
            latencyMs: 3120,
            payloadJson: JSON.stringify(result, null, 2)
          }
        });

        setFile(null);
      } else {
        const errJson = await res.json();
        throw new Error(errJson.detail || "Scan request failed");
      }
    } catch (e: any) {
      clearTimeout(timer1);
      clearTimeout(timer2);
      clearTimeout(timer3);
      console.log("[ForgeShield] Offline scan fallback due to:", e.message);

      // Perform offline high-fidelity mock simulation
      setTimeout(() => {
        setScanState("success");
        setStatusMessage("Offline Mock Analysis completed successfully.");
        
        const fname = file.name.toLowerCase();
        let score = 15.4;
        let verdict = "LOW RISK — Document passes all integrity checks";
        let flags: string[] = [];
        let anomalies: string[] = [];
        let mapRegions: HeatmapRegion[] = [];
        let entities: ExtractedEntities = { companies: ["INFOSYS LIMITED"], amounts: ["₹12,45,000"], dates: ["15-05-2025"] };

        if (fname.includes("fraud") || fname.includes("struck") || fname.includes("salary")) {
          score = 68.5;
          verdict = "MEDIUM RISK — Cross-validation anomalies found";
          flags = ["⚠ Company 'FRAUDCO PRIVATE LIMITED' status is 'STRUCK OFF' in MCA21"];
          anomalies = ["Isolated entities with no relationships detected"];
          mapRegions = [{ label: "Struck-off registry match", x: 10, y: 40, w: 80, h: 10, risk: 0.68, color: "#ffcc00" }];
          entities = { companies: ["FRAUDCO PRIVATE LIMITED"], amounts: ["₹5,00,000"], dates: ["24-10-2023"] };
        } else if (fname.includes("deed") || fname.includes("mortgage") || fname.includes("fake")) {
          score = 86.2;
          verdict = "HIGH RISK — Multiple anomaly layers detected";
          flags = ["⚠ Land parcel SY789012 is already mortgaged with Canara Bank (Amount: ₹45,00,000)"];
          anomalies = ["Document has 3 disconnected entity clusters — possible cut-and-paste assembly"];
          mapRegions = [
            { label: "Registry Mortgage Double-Financing", x: 10, y: 35, w: 80, h: 12, risk: 0.86, color: "#e63b2e" },
            { label: "Cut-and-paste pixel signature misalignment", x: 55, y: 15, w: 30, h: 12, risk: 0.75, color: "#e63b2e" }
          ];
          entities = { companies: ["CANARA BANK"], survey_numbers: ["SY789012"], amounts: ["₹45,00,000"], dates: ["12-04-2023"] };
        }

        const mockId = `scan-mock-${Date.now()}`;
        const newScanItem: ScanResultItem = {
          scan_id: mockId,
          filename: file.name,
          risk_score: score,
          verdict: verdict,
          confidence: 84.5,
          created_at: new Date().toISOString()
        };

        const mockDetails: ScanResultDetails = {
          scan_id: mockId,
          filename: file.name,
          risk_score: score,
          verdict: verdict,
          confidence: 84.5,
          details: JSON.stringify({
            model: "google/vit-base-patch16-224 [Simulated]",
            image_size: "800x600",
            top_class: 102,
            risk_level: score > 70 ? "high" : score > 40 ? "medium" : "low",
            indicators: score > 40 ? ["Pixel-level anomalies identified", "Suspicious metadata values"] : ["Passes all validation criteria"]
          }),
          created_at: newScanItem.created_at,
          enriched: {
            semantic_score: score > 70 ? 82 : score > 40 ? 50 : 8,
            graph_score: score > 70 ? 65 : score > 40 ? 30 : 10,
            final_score: score,
            nlp_flags: flags,
            gnn_anomalies: anomalies,
            entities: entities,
            heatmap: mapRegions,
            mca21: { results: {}, flags: [] },
            cersai: { results: {}, flags: [] }
          }
        };

        // Generate simple matched pattern mocks based on filename clues
        const fnameLower = file.name.toLowerCase();
        let mp: any[] = [];
        if (fnameLower.includes("salary")) mp.push({ id: "FP001", name: "Salary Slip Inflation", match_confidence: "HIGH" });
        if (fnameLower.includes("deed") || fnameLower.includes("mortgage")) mp.push({ id: "FP002", name: "Duplicate Mortgage Fraud", match_confidence: "HIGH" });
        if (fnameLower.includes("fraud") || fnameLower.includes("struck")) mp.push({ id: "FP003", name: "Shell Company Fraud", match_confidence: "MEDIUM" });

        mockDetails.matched_patterns = mp;
        setMatchedPatterns(mp);

        setHistory(prev => [newScanItem, ...prev]);
        setSelectedResult(mockDetails);
        setStats(prev => ({
          total_scans: prev.total_scans + 1,
          high_risk: score > 70 ? prev.high_risk + 1 : prev.high_risk,
          medium_risk: (score > 40 && score <= 70) ? prev.medium_risk + 1 : prev.medium_risk,
          low_risk: score <= 40 ? prev.low_risk + 1 : prev.low_risk,
          avg_risk: roundScore((prev.avg_risk * prev.total_scans + score) / (prev.total_scans + 1))
        }));

        onAddLog({
          vector: "NEURAL_EVAL",
          vectorCategory: "AI",
          entityHash: `SCAN-${mockId.substring(10, 18).toUpperCase()}`,
          payload: `[Simulated] ForgeShield: ${file.name} final risk: ${score}% (${verdict})`,
          details: {
            origin: "ForgeShield-Simulation-Mode",
            latencyMs: 1450,
            payloadJson: JSON.stringify(mockDetails, null, 2)
          }
        });

        setFile(null);
      }, 2500);
    }
  };

  const roundScore = (val: number) => Math.round(val * 100) / 100;

  return (
    <div className="space-y-6 select-none animate-fadeIn">
      {/* Title block */}
      <div className="bg-[#1a1a1a] text-[#ffffff] p-6 border-4 border-[#1a1a1a] [box-shadow:4px_4px_0px_#1a1a1a] flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <nav className="flex items-center gap-2 text-[#ffcc00] font-mono text-xs uppercase font-extrabold tracking-wider mb-1">
            <span>ForgeShield</span>
            <span>/</span>
            <span className="text-[#ffffff]">Real-time Anomaly Scan</span>
          </nav>
          <h2 className="font-[Space Grotesk] text-4xl font-black uppercase tracking-tight">ForgeShield Dashboard</h2>
          <p className="font-mono text-xs text-[#ffcc00] uppercase font-bold mt-0.5">
            Pixel-level forensics, registry matching, and graph coherence analysis
          </p>
        </div>
        <div className="flex items-center gap-2 font-mono text-[10px] bg-[#2e7d32]/20 text-[#49a04d] border-2 border-[#2e7d32] px-3 py-1 font-black">
          <span className={`w-2 h-2 rounded-full ${isBackendConnected ? "bg-[#2e7d32] animate-pulse" : "bg-gray-500"}`}></span>
          <span>BACKEND API: {isBackendConnected ? "CONNECTED" : "OFFLINE (SIMULATION MODE)"}</span>
        </div>
      </div>

      {/* Stats row */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        {[
          { label: "TOTAL DOCUMENTS SCAN", val: stats.total_scans, color: "bg-[#ffffff]", text: "text-[#1a1a1a]" },
          { label: "AVERAGE RISK SCORE", val: `${stats.avg_risk}%`, color: "bg-[#ffffff]", text: "text-[#0055ff]" },
          { label: "HIGH RISK FLAGS", val: stats.high_risk, color: "bg-[#e63b2e]/10", text: "text-[#e63b2e]" },
          { label: "MEDIUM RISK DEVIANTS", val: stats.medium_risk, color: "bg-[#ffcc00]/10", text: "text-[#ff9900]" },
          { label: "LOW RISK PASSED", val: stats.low_risk, color: "bg-[#2e7d32]/10", text: "text-[#2e7d32]" },
        ].map((stat, i) => (
          <div key={i} className={`${stat.color} border-4 border-[#1a1a1a] p-3 [box-shadow:3px_3px_0px_#1a1a1a] flex flex-col justify-between`}>
            <span className="font-mono text-[9px] font-black text-gray-500 uppercase tracking-tight leading-none mb-1">
              {stat.label}
            </span>
            <span className={`font-[Space Grotesk] text-3xl font-black leading-none ${stat.text}`}>
              {stat.val}
            </span>
          </div>
        ))}
      </div>

      {/* Main layout: 1/3 history/uploader, 2/3 viewer */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Left column: upload + history list */}
        <div className="space-y-6">
          {/* File uploader */}
          <div className="bg-[#ffffff] border-4 border-[#1a1a1a] p-4 [box-shadow:4px_4px_0px_#1a1a1a] relative">
            <h3 className="font-[Space Grotesk] font-black uppercase text-sm border-b-2 border-[#1a1a1a] pb-1.5 mb-3 flex items-center gap-2">
              <Upload size={16} /> Submit collateral document
            </h3>

            {scanState !== "idle" && scanState !== "success" && scanState !== "error" ? (
              // Uploading state
              <div className="h-44 flex flex-col items-center justify-center bg-[#f5f0e8] border-2 border-dashed border-[#1a1a1a] p-4 text-center">
                <RefreshCw size={32} className="text-[#0055ff] animate-spin mb-3 stroke-[3]" />
                <span className="font-mono text-xs font-black text-[#1a1a1a] uppercase mb-1">
                  {scanState.toUpperCase()} LAYER ACTIVE
                </span>
                <p className="font-mono text-[10px] text-gray-600 font-bold leading-normal">
                  {statusMessage}
                </p>
                <div className="w-full bg-gray-200 h-2 border border-[#1a1a1a] mt-3 overflow-hidden relative">
                  <div className="bg-[#0055ff] h-full transition-all duration-300" 
                    style={{ 
                      width: scanState === "uploading" ? "15%" : scanState === "vit" ? "40%" : scanState === "nlp" ? "70%" : "90%" 
                    }}
                  />
                </div>
              </div>
            ) : (
              // Idle state / file selected
              <div 
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onDrop={handleDrop}
                className={`h-44 border-2 border-dashed border-[#1a1a1a] flex flex-col items-center justify-center p-4 cursor-pointer relative transition-colors ${
                  dragging ? "bg-[#ffcc00]/10" : "bg-[#f5f0e8] hover:bg-[#eee9e0]"
                }`}
              >
                <input 
                  type="file" 
                  id="forgeshield-upload-input"
                  onChange={handleFileChange}
                  accept=".pdf,image/png,image/jpeg,image/jpg,image/webp"
                  className="hidden"
                />
                
                {file ? (
                  <label htmlFor="forgeshield-upload-input" className="text-center w-full h-full flex flex-col items-center justify-center cursor-pointer">
                    <FileText size={32} className="text-[#0055ff] mb-2" />
                    <span className="font-mono text-xs font-black text-[#1a1a1a] truncate max-w-full block px-2">
                      {file.name}
                    </span>
                    <span className="font-mono text-[10px] text-gray-500 font-bold mt-0.5">
                      {(file.size / 1024).toFixed(1)} KB (Click to change)
                    </span>
                  </label>
                ) : (
                  <label htmlFor="forgeshield-upload-input" className="text-center w-full h-full flex flex-col items-center justify-center cursor-pointer">
                    <Upload size={32} className="text-gray-500 mb-2 stroke-[2.5]" />
                    <span className="font-[Space Grotesk] text-xs font-black text-[#1a1a1a] uppercase">
                      Drag & Drop File Here
                    </span>
                    <span className="font-mono text-[9px] text-gray-500 font-bold uppercase mt-1">
                      PDF, JPG, PNG up to 10MB
                    </span>
                  </label>
                )}
              </div>
            )}

            {file && scanState === "idle" && (
              <button
                onClick={handleUploadSubmit}
                className="w-full mt-3 bg-[#ffcc00] text-[#1a1a1a] font-[Space Grotesk] font-black uppercase text-xs py-2 border-2 border-[#1a1a1a] [box-shadow:2px_2px_0px_#1a1a1a] active:translate-y-0.5 active:shadow-none transition-all cursor-pointer"
              >
                Scan Collateral Integrity
              </button>
            )}
          </div>

          {/* Scan History list */}
          <div className="bg-[#ffffff] border-4 border-[#1a1a1a] p-4 [box-shadow:4px_4px_0px_#1a1a1a]">
            <h3 className="font-[Space Grotesk] font-black uppercase text-sm border-b-2 border-[#1a1a1a] pb-1.5 mb-3 flex items-center gap-2">
              <Activity size={16} /> Scan History Logs
            </h3>
            
            <div className="space-y-3.5 max-h-80 overflow-y-auto pr-1">
              {history.map((h) => (
                <div 
                  key={h.scan_id}
                  onClick={() => handleSelectResult(h.scan_id)}
                  className={`border-2 border-[#1a1a1a] p-2.5 transition-all cursor-pointer flex justify-between items-start gap-2 ${
                    selectedResult?.scan_id === h.scan_id 
                      ? "bg-[#ffcc00]/20 border-l-4 border-l-[#0055ff]" 
                      : "bg-[#f5f0e8] hover:bg-[#eee9e0]"
                  }`}
                >
                  <div className="min-w-0">
                    <p className="font-mono text-xs font-black text-[#1a1a1a] truncate leading-tight">
                      {h.filename}
                    </p>
                    <span className="font-mono text-[9px] text-gray-500 font-bold mt-1 block">
                      {new Date(h.created_at).toLocaleDateString()} @ {new Date(h.created_at).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                    </span>
                  </div>
                  <div className="flex flex-col items-end flex-shrink-0">
                    <span className={`font-mono text-[10px] font-black border border-[#1a1a1a] px-1 bg-white ${
                      h.risk_score > 70 ? "text-[#e63b2e]" : h.risk_score > 40 ? "text-[#ff9900]" : "text-[#2e7d32]"
                    }`}>
                      {h.risk_score}%
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Right column: results breakdown & document canvas */}
        <div className="lg:col-span-2 space-y-6">
          
          {selectedResult ? (
            // Result selected details panel
            <div className="bg-[#ffffff] border-4 border-[#1a1a1a] p-6 [box-shadow:4px_4px_0px_#1a1a1a] space-y-6 animate-fadeIn">
              
              {/* Header result row */}
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center border-b-2 border-dashed border-[#1a1a1a] pb-4 gap-3">
                <div>
                  <h3 className="font-[Space Grotesk] text-2xl font-black text-[#1a1a1a] uppercase leading-none">
                    Forensic Verdict Deck
                  </h3>
                  <span className="font-mono text-xs text-gray-500 font-bold block mt-1">
                    Filename: <strong className="text-[#1a1a1a]">{selectedResult.filename}</strong>
                  </span>
                </div>
                
                <span className={`font-mono text-xs font-black border-2 border-[#1a1a1a] px-3 py-1.5 [box-shadow:2px_2px_0px_#1a1a1a] uppercase ${
                  selectedResult.risk_score > 70 
                    ? "bg-[#e63b2e] text-[#ffffff]" 
                    : selectedResult.risk_score > 40 
                    ? "bg-[#ffcc00] text-[#1a1a1a]" 
                    : "bg-[#2e7d32] text-[#ffffff]"
                }`}>
                  {selectedResult.risk_score > 70 ? "HIGH RISK ANOMALY" : selectedResult.risk_score > 40 ? "MEDIUM SUSPICION" : "CLEARED PASS"}
                </span>
              </div>

              {/* Grid: Scores & Document Preview */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                
                {/* Visual scorecard breakdown */}
                <div className="space-y-4">
                  <div>
                    <h4 className="font-[Space Grotesk] text-sm font-black uppercase text-[#1a1a1a] border-b border-[#1a1a1a] pb-1 mb-2">
                      Anomaly Score Vector
                    </h4>
                    
                    {/* Radial/Bar combined final metric */}
                    <div className="bg-[#f5f0e8] border-2 border-[#1a1a1a] p-4 text-center">
                      <p className="font-mono text-[9px] text-gray-500 font-black uppercase mb-1">Combined Threat Score</p>
                      <span className={`font-[Space Grotesk] text-6xl font-black leading-none ${
                        selectedResult.risk_score > 70 ? "text-[#e63b2e]" : selectedResult.risk_score > 40 ? "text-[#ff9900]" : "text-[#2e7d32]"
                      }`}>
                        {selectedResult.risk_score}%
                      </span>
                      <p className="font-mono text-[10px] text-[#1a1a1a] font-bold mt-2">
                        {selectedResult.verdict}
                      </p>
                      <div className="mt-3 text-[10px] font-mono text-gray-500 font-bold">
                        Inference Confidence: {selectedResult.confidence}%
                      </div>
                    </div>
                  </div>

                  {/* Weights list */}
                  <div className="space-y-3">
                    <h4 className="font-[Space Grotesk] text-xs font-black uppercase text-[#1a1a1a]">
                      Layer Score Contributions
                    </h4>
                    
                    {[
                      { label: "ViT Pixel Forensics (50%)", val: JSON.parse(selectedResult.details || "{}").risk_level === "high" ? 85 : JSON.parse(selectedResult.details || "{}").risk_level === "medium" ? 50 : 15, col: "bg-[#0055ff]" },
                      { label: "NLP Registry Validation (30%)", val: selectedResult.enriched?.semantic_score || 0, col: "bg-[#ffcc00]" },
                      { label: "GNN Graph Coherence (20%)", val: selectedResult.enriched?.graph_score || 0, col: "bg-[#e63b2e]" },
                    ].map((layer, idx) => (
                      <div key={idx} className="bg-[#f5f0e8] p-2 border-2 border-[#1a1a1a]">
                        <div className="flex justify-between items-center font-mono text-[10px] font-black mb-1">
                          <span>{layer.label}</span>
                          <span>{layer.val}%</span>
                        </div>
                        <div className="h-2 bg-white border border-[#1a1a1a]">
                          <div className={`h-full ${layer.col}`} style={{ width: `${layer.val}%` }}></div>
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* Indicators details */}
                  <div className="space-y-2">
                    <h4 className="font-[Space Grotesk] text-xs font-black uppercase text-[#1a1a1a]">
                      Indicators Tagged
                    </h4>
                    <div className="flex flex-wrap gap-2">
                      {JSON.parse(selectedResult.details || "{}").indicators?.map((ind: string, i: number) => (
                        <span key={i} className="font-mono text-[9px] font-bold bg-[#eee9e0] border border-[#1a1a1a] px-2 py-0.5">
                          • {ind}
                        </span>
                      )) || <span className="font-mono text-[9px] text-gray-500">None</span>}
                    </div>
                  </div>
                </div>

                {/* Heatmap document preview overlay */}
                <div className="space-y-2">
                  <h4 className="font-[Space Grotesk] text-sm font-black uppercase text-[#1a1a1a] border-b border-[#1a1a1a] pb-1 mb-2 flex justify-between items-center">
                    <span>Collateral Document Preview</span>
                    <span className="font-mono text-[9px] bg-[#0055ff] text-white border border-[#1a1a1a] px-1 font-bold">HEATMAP ON</span>
                  </h4>
                  
                  <div className="w-full h-80 bg-[#ffffff] border-4 border-[#1a1a1a] relative [box-shadow:3px_3px_0px_#1a1a1a] overflow-hidden p-4 select-none">
                    {/* Bounding box overlays */}
                    {selectedResult.enriched?.heatmap?.map((region, i) => (
                      <div 
                        key={i}
                        className="absolute border-2 border-dashed cursor-pointer group flex items-start p-1 transition-all"
                        style={{
                          left: `${region.x}%`,
                          top: `${region.y}%`,
                          width: `${region.w}%`,
                          height: `${region.h}%`,
                          borderColor: region.color,
                          backgroundColor: `${region.color}15`
                        }}
                        title={`${region.label}: Risk Score ${Math.round(region.risk * 100)}%`}
                      >
                        <span className="font-mono text-[7px] font-black text-white px-1 absolute -top-4 left-[-2px] border border-[#1a1a1a]"
                          style={{ backgroundColor: region.color }}
                        >
                          {region.label} ({Math.round(region.risk * 100)}%)
                        </span>
                      </div>
                    ))}

                    {/* Mock document layout underneath */}
                    <div className="space-y-4 text-[#1a1a1a]/40 font-mono text-[7px] pointer-events-none uppercase">
                      <div className="border-b-2 border-dashed border-gray-300 pb-2 text-center">
                        <p className="font-bold text-[9px] text-[#1a1a1a]/60">LAND REGISTRATION CERTIFICATE</p>
                        <p>GOVERNMENT OF MAHARASHTRA • DEPARTMENT OF COLLATERALS</p>
                      </div>
                      
                      <div className="grid grid-cols-2 gap-2 mt-4">
                        <div>
                          <p>SURVEY IDENTIFIER NO: <strong className="text-[#1a1a1a]/60">{selectedResult.enriched?.entities?.survey_numbers?.[0] || "SY789012"}</strong></p>
                          <p>APPLICANT OWNER: <strong className="text-[#1a1a1a]/60">PRIYA SHARMA</strong></p>
                          <p>SUB-REGISTRAR OFFICE: <strong className="text-[#1a1a1a]/60">PUNE DISTRICT</strong></p>
                        </div>
                        <div>
                          <p>REGISTRATION DATE: <strong className="text-[#1a1a1a]/60">{selectedResult.enriched?.entities?.dates?.[0] || "24/10/2023"}</strong></p>
                          <p>COLLATERAL VALUATION: <strong className="text-[#1a1a1a]/60">{selectedResult.enriched?.entities?.amounts?.[0] || "₹45,00,000"}</strong></p>
                          <p>ASSOCIATED ENTITY: <strong className="text-[#1a1a1a]/60">{selectedResult.enriched?.entities?.companies?.[0] || "CANARA BANK"}</strong></p>
                        </div>
                      </div>

                      <div className="border-t border-gray-200 pt-3 space-y-1">
                        <p className="font-bold">VERIFICATION DECLARATION POLICY STATEMENT:</p>
                        <p>This collateral document declares absolute clear ownership status of the mentioned land parcel, unencumbered by any previous mortgage deeds or concurrent loans in the state of Maharashtra. CERSAI ledger state verified.</p>
                      </div>

                      <div className="mt-8 flex justify-between items-end border-t border-dashed border-gray-300 pt-3">
                        <div className="text-center">
                          <div className="w-12 h-6 border border-gray-300/40 bg-gray-50 flex items-center justify-center mb-1">STAMP</div>
                          <p>OFFICIAL STAMP</p>
                        </div>
                        <div className="text-center">
                          <p className="font-serif italic text-gray-500/50 text-[10px]">Priya Sharma</p>
                          <p>OWNER SIGNATURE</p>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

              </div>

              {/* Registry Mismatch warning logs */}
              {selectedResult.enriched && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-4 border-t-2 border-[#1a1a1a]">
                  
                  {/* Registry Verification */}
                  <div className="space-y-2.5">
                    <h4 className="font-[Space Grotesk] text-xs font-black uppercase text-[#1a1a1a] flex items-center gap-2">
                      <ShieldAlert size={14} className="text-[#e63b2e]" /> Registry Verification Flags (NLP)
                    </h4>
                    
                    <div className="space-y-2">
                      {selectedResult.enriched.nlp_flags && selectedResult.enriched.nlp_flags.length > 0 ? (
                        selectedResult.enriched.nlp_flags.map((flag, idx) => (
                          <div key={idx} className="bg-[#e63b2e]/10 border-2 border-[#e63b2e] p-2.5 font-mono text-[10px] text-[#e63b2e] font-bold">
                            {flag}
                          </div>
                        ))
                      ) : (
                        <div className="bg-[#2e7d32]/10 border-2 border-[#2e7d32] p-2.5 font-mono text-[10px] text-[#2e7d32] font-bold flex items-center gap-1.5">
                          <CheckCircle2 size={12} /> Registry verification successful: MCA21 & CERSAI cleared.
                        </div>
                      )}
                    </div>
                  </div>

                  {/* GNN Graph Coherence */}
                  <div className="space-y-2.5">
                    <h4 className="font-[Space Grotesk] text-xs font-black uppercase text-[#1a1a1a] flex items-center gap-2">
                      <Layers size={14} className="text-[#0055ff]" /> Entity Graph Coherence (GNN)
                    </h4>

                    <div className="space-y-2">
                      {selectedResult.enriched.gnn_anomalies && selectedResult.enriched.gnn_anomalies.length > 0 ? (
                        selectedResult.enriched.gnn_anomalies.map((anom, idx) => (
                          <div key={idx} className="bg-[#0055ff]/10 border-2 border-[#0055ff] p-2.5 font-mono text-[10px] text-[#0055ff] font-bold">
                            {anom}
                          </div>
                        ))
                      ) : (
                        <div className="bg-[#2e7d32]/10 border-2 border-[#2e7d32] p-2.5 font-mono text-[10px] text-[#2e7d32] font-bold flex items-center gap-1.5">
                          <CheckCircle2 size={12} /> Graph Coherence: consistent entities relationship matching.
                        </div>
                      )}
                    </div>
                  </div>

                </div>
              )}

              {/* Extracted Entities Chips row */}
              {selectedResult.enriched?.entities && (
                <div className="bg-[#f5f0e8] border-2 border-[#1a1a1a] p-3 space-y-2.5">
                  <h4 className="font-mono text-[10px] font-black uppercase text-[#1a1a1a] tracking-wider leading-none">
                    Extracted Document Entities Check
                  </h4>
                  
                  <div className="flex flex-wrap gap-2.5 font-mono text-[9px] font-bold">
                    {(Object.entries(selectedResult.enriched.entities) as [string, string[] | undefined][]).map(([key, list]) => (
                      list && list.length > 0 && (
                        <div key={key} className="flex items-center bg-white border border-[#1a1a1a]">
                          <span className="bg-[#1a1a1a] text-white px-1.5 py-0.5 uppercase tracking-wide text-[8px] font-black">{key}</span>
                          <span className="px-2 py-0.5 text-gray-700">{list.join(", ")}</span>
                        </div>
                      )
                    ))}
                  </div>

                      {/* 🎯 MATCHED FRAUD PATTERNS */}
                      <div className="pt-4">
                        <h4 className="font-[Space Grotesk] text-xs font-black uppercase text-[#1a1a1a] mb-2">🎯 MATCHED FRAUD PATTERNS</h4>

                        { (matchedPatterns && matchedPatterns.length === 0) && (
                          <div className="bg-[#2e7d32]/10 border-2 border-[#1a1a1a] p-3 font-mono text-[10px] text-[#2e7d32] font-bold">
                            <CheckCircle2 size={14} /> ✓ No known fraud patterns matched
                          </div>
                        )}

                        { matchedPatterns && matchedPatterns.length > 0 && (
                          <div className="space-y-3 mt-2">
                            {matchedPatterns.map((mp:any, idx:number) => (
                              <div key={idx} className="bg-[#ffecec] border-2 border-[#1a1a1a] p-3 [box-shadow:4px_4px_0px_#1a1a1a]">
                                <div className="flex justify-between items-center">
                                  <div>
                                    <div className="font-mono text-[10px] font-black">{mp.id} • <span className="font-[Space Grotesk] font-black uppercase">{mp.name}</span></div>
                                    <div className="mt-1 font-mono text-[10px]">
                                      <span className="px-2 py-0.5 border-2 border-[#1a1a1a] bg-[#e63b2e] text-white mr-2">{mp.severity || 'CRITICAL'}</span>
                                      <span className="px-2 py-0.5 border-2 border-[#1a1a1a] bg-black text-white">{mp.match_confidence || 'MEDIUM'}</span>
                                    </div>
                                  </div>
                                  <div className="text-right">
                                    <div className="font-mono text-[10px]">{mp.india_impact || ''}</div>
                                    <div className="font-mono text-[10px] border-2 border-black px-2 py-1 mt-2">{mp.legal_reference || ''}</div>
                                    <div className="mt-2 font-[Space Grotesk] font-black">Recommended: <span className="font-bold">{mp.recommended_action || ''}</span></div>
                                    <button onClick={() => { localStorage.setItem('netraai_active_tab','FRAUD_PATTERNS'); window.location.reload(); }} className="mt-2 inline-block bg-[#e63b2e]/20 border-2 border-[#1a1a1a] px-3 py-1 font-mono font-black">VIEW FULL PATTERN →</button>
                                  </div>
                                </div>
                              </div>
                            ))}
                          </div>
                        )}

                      {/* UNDERWRITER DECISION — Decision Assistant */}
                      {selectedResult && (selectedResult as any).decision && (
                        <div className="bg-white border-4 border-black p-4 [box-shadow:5px_5px_0px_#000] mt-4">
                          <div style={{ backgroundColor: (selectedResult as any).decision.recommendation.color }} className="p-3 border-4 border-black mb-3">
                            <div className="text-2xl font-black uppercase">{(selectedResult as any).decision.recommendation.label}</div>
                          </div>

                          <div className="flex gap-4">
                            <div className="flex-1">
                              <div className="border-l-4 border-black bg-white p-3 mb-3">
                                <div className="text-xs text-purple-700 uppercase">REASON</div>
                                <div className="font-bold mt-1">{(selectedResult as any).decision.specific_reason}</div>
                              </div>

                              <div className="bg-gray-100 border-2 border-black p-3 mb-3 font-mono text-sm">
                                <div className="text-xs uppercase font-black mb-1">REGULATORY BASIS</div>
                                <div className="text-xs font-mono">{(selectedResult as any).decision.regulatory_reference}</div>
                              </div>

                              <div>
                                <div className="text-xs uppercase font-black mb-2">NEXT STEPS</div>
                                <div className="space-y-2">
                                  {(selectedResult as any).decision.next_steps.map((step: string, i: number) => (
                                    <div key={i} className="border-2 border-black p-2 [box-shadow:2px_2px_0px_#000] flex items-start gap-3">
                                      <div className="w-6 h-6 border-2 border-black font-black flex items-center justify-center">{i+1}</div>
                                      <div>{step}</div>
                                    </div>
                                  ))}
                                </div>
                              </div>
                            </div>

                            {((selectedResult as any).decision.recommendation.code === 'REJECT') && (selectedResult as any).decision.str_template && (
                              <div className="w-1/3 ml-4 p-3" style={{ backgroundColor: '#ffecec' }}>
                                <div className="text-sm font-black mb-2">⚠ STR FILING REQUIRED</div>
                                <textarea readOnly value={(selectedResult as any).decision.str_template} className="w-full h-40 font-mono text-xs p-2 border-2 border-black" />
                                <button onClick={() => navigator.clipboard.writeText((selectedResult as any).decision.str_template)} className="mt-2 bg-red-600 text-white px-3 py-1 font-black border-2 border-black">COPY STR TEMPLATE</button>
                              </div>
                            )}
                          </div>
                        </div>
                      )}

                      </div>
                </div>
              )}

            </div>
          ) : (
            // Empty State
            <div className="bg-[#ffffff] border-4 border-[#1a1a1a] p-12 text-center [box-shadow:4px_4px_0px_#1a1a1a] flex flex-col items-center justify-center min-h-[400px]">
              <ShieldAlert size={48} className="text-gray-400 stroke-[2] mb-3 animate-pulse" />
              <h3 className="font-[Space Grotesk] text-xl font-black text-[#1a1a1a] uppercase">No Scan Selected</h3>
              <p className="font-mono text-xs text-gray-500 font-bold max-w-sm mt-1 leading-normal">
                Upload a loan/KYC document or click on a log record in the history checklist to view multi-layer anomaly heatmaps.
              </p>
            </div>
          )}

        </div>

      </div>

    </div>
  );
}
