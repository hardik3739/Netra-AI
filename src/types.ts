export type VectorCategory = "SYS" | "AI" | "API" | "HUMAN" | "CONSENSUS" | "SANDBOX";

export interface AuditLog {
  block: string;            // '001', '002', etc.
  vector: string;           // 'QUERY_INIT', 'NEURAL_EVAL', etc.
  vectorCategory: VectorCategory;
  entityHash: string;       // 'TRX-9482-XA'
  payload: string;          // Action details
  timestampDate: string;    // '2023.10.24' or similar
  timestampTime: string;    // '14:22:01.042'
  previousHash: string;     // SHA-256 mock chaining
  currentHash: string;      // SHA-256 current block signature
  isVerified: boolean;      // Client integrity checked flag
  details: {
    origin: string;
    operatorId?: string;
    riskAdjustedFrom?: number;
    riskAdjustedTo?: number;
    latencyMs?: number;
    payloadJson?: string;
    protocolVersion?: string;
  };
}

export type ActiveTab = "ALL" | "TRIGGERS" | "AI_MODS";

export type SidebarTab = "FORGESHIELD" | "REGPILOT" | "AUDIT_TRAIL" | "DASHBOARD" | "ANALYTICS" | "RISK" | "SETTINGS" | "LOAN_DOSSIER" | "FRAUD_PATTERNS";

// ─────────────────────────────────────────────────────────
// FORGESHIELD DATA CONTRACTS
// ─────────────────────────────────────────────────────────

export interface HeatmapRegion {
  label: string;
  x: number;
  y: number;
  w: number;
  h: number;
  risk: number;
  color: string;
}

export interface ScanResultItem {
  scan_id: string;
  filename: string;
  risk_score: number;
  verdict: string;
  confidence: number;
  created_at: string;
}

export interface ScanResultDetails {
  scan_id: string;
  filename: string;
  risk_score: number;
  verdict: string;
  confidence: number;
  details: string; // JSON string containing model, image_size, top_class, risk_level, indicators
  created_at: string;
  enriched?: {
    semantic_score: number;
    graph_score: number;
    final_score: number;
    nlp_flags: string[];
    gnn_anomalies: string[];
    entities: {
      companies?: string[];
      survey_numbers?: string[];
      amounts?: string[];
      dates?: string[];
      pan_numbers?: string[];
      aadhaar?: string[];
      ifsc_codes?: string[];
    };
    heatmap: HeatmapRegion[];
    mca21?: {
      results: Record<string, { status: string; cin: string | null; type?: string }>;
      flags: string[];
    };
    cersai?: {
      results: Record<string, { mortgaged?: boolean; owner?: string; district?: string; state?: string; mortgaged_with?: string; loan_amount?: string; status?: string }>;
      flags: string[];
    };
  } | null;
  matched_patterns?: any[];
}


export interface FraudPattern {
  id: string;
  name: string;
  description: string;
  trigger_flags: string[];
  trigger_keywords: string[];
  severity: string;
  frequency: string;
  india_impact: string;
  legal_reference: string;
  recommended_action: string;
  detection_indicators: string[];
  match_confidence?: string;
}

// ─────────────────────────────────────────────────────────
// REGPILOT DATA CONTRACTS
// ─────────────────────────────────────────────────────────

export interface MAPItem {
  id: string;
  circular_id: string;
  title: string;
  description: string;
  department: string;
  deadline: string;
  priority: string;
  status: "open" | "in_progress" | "completed";
  validated: boolean;
  evidence: string | null;
  created_at: string;
  updated_at: string | null;
}

export interface CircularItem {
  id: string;
  source: string;
  title: string;
  url: string | null;
  published_at: string | null;
  fetched_at: string | null;
  is_processed: boolean;
}

export interface CircularDetails extends CircularItem {
  raw_text: string | null;
  maps: MAPItem[];
}

export interface ValidationResult {
  map_id: string;
  map_title: string;
  department: string;
  validation: {
    status: "VALIDATED" | "PARTIAL" | "INSUFFICIENT";
    message: string;
    score: number;
    gaps: string[];
    method: "ollama" | "rule-based";
  };
  map_status: string;
  validated: boolean;
}

export interface DeptStats {
  total: number;
  completed: number;
  in_progress: number;
  open: number;
  high_priority_open: number;
  compliance_score: number;
}

export interface ComplianceDashboardData {
  overall_compliance_score: number;
  total_maps: number;
  completed_maps: number;
  open_maps: number;
  in_progress_maps: number;
  total_circulars: number;
  high_priority_open: number;
  medium_priority_open: number;
  departments: Record<string, DeptStats>;
}

