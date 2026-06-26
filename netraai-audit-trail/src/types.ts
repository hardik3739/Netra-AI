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

export type SidebarTab = "DASHBOARD" | "ANALYTICS" | "RISK" | "SETTINGS" | "AUDIT_TRAIL";
