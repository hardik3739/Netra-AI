import { AuditLog } from "./types";

export const initialAuditLogs: AuditLog[] = [
  {
    block: "001",
    vector: "QUERY_INIT",
    vectorCategory: "SYS",
    entityHash: "TRX-9482-XA",
    payload: "Cross-border validation check for high-value transfer.",
    timestampDate: "2023.10.24",
    timestampTime: "14:22:01.042",
    previousHash: "0000000000000000000000000000000000000000000000000000000000000000",
    currentHash: "b7e0892c5717ebd789b78c6b738e4dfafafedf123dfac75d1f0eaef0a3224b12",
    isVerified: true,
    details: {
      origin: "Gateway-US-East",
      latencyMs: 44,
      protocolVersion: "v2.4.1",
      payloadJson: `{\n  "transaction_id": "TRX-9482-XA",\n  "amount_usd": 1500000,\n  "sender_country": "US",\n  "receiver_country": "SG",\n  "routing_hops": ["US_EAST", "CH_ZURICH", "SG_CORP"],\n  "checks": {\n    "sanction_list": "CLEARED",\n    "velocity_check": "OPTIMAL"\n  }\n}`
    }
  },
  {
    block: "002",
    vector: "NEURAL_EVAL",
    vectorCategory: "AI",
    entityHash: "USR-ALPHA-09",
    payload: "Risk score adjusted [12 -> 45]. Reason: OUTLIER_BEHAVIOR.",
    timestampDate: "2023.10.24",
    timestampTime: "14:21:58.891",
    previousHash: "b7e0892c5717ebd789b78c6b738e4dfafafedf123dfac75d1f0eaef0a3224b12",
    currentHash: "f1a1d94b01e23fde9384bcffaefcae14234e7f805988000aaefe7cfdcbaeeef5",
    isVerified: true,
    details: {
      origin: "AIShield-Model-V3",
      riskAdjustedFrom: 12,
      riskAdjustedTo: 45,
      latencyMs: 118,
      protocolVersion: "model-v3.0.1",
      payloadJson: `{\n  "agent_id": "AIShield-Model-V3",\n  "target_user": "USR-ALPHA-09",\n  "anomaly_profile": {\n    "unexpected_ip_country": "UNKNOWN",\n    "atm_withdrawal_frequency": "HIGH_SPIKE",\n    "neural_uncertainty_index": 0.84\n  },\n  "decision": "SOFT_WARN_FLAGged_ADDITIONAL_2FA"\n}`
    }
  },
  {
    block: "003",
    vector: "DATA_INGEST",
    vectorCategory: "API",
    entityHash: "REG-FLOW-55",
    payload: "Regulatory framework update (v2.4) synced from GLOBAL_DB.",
    timestampDate: "2023.10.24",
    timestampTime: "14:20:12.330",
    previousHash: "f1a1d94b01e23fde9384bcffaefcae14234e7f805988000aaefe7cfdcbaeeef5",
    currentHash: "2aadebe134aefd400e238914baedae3ff28d7210e782eaefe7738efcc03aa11b",
    isVerified: true,
    details: {
      origin: "FedReserve-API-Sync",
      latencyMs: 312,
      protocolVersion: "v1.2",
      payloadJson: `{\n  "update_type": "REGULATORY_COMPLIANCE",\n  "source": "GLOBAL_DB_COMPLIANCE_SERVER",\n  "sync_packets_received": 140,\n  "checksum": "0xAAFE839210B",\n  "changes": [\n    {\n      "rule_id": "FED-505-B",\n      "severity_multiplier": 1.15,\n      "enforcement_date": "2023.11.01"\n    }\n  ]\n}`
    }
  },
  {
    block: "004",
    vector: "OVERRIDE",
    vectorCategory: "HUMAN",
    entityHash: "FLG-8812-ZZ",
    payload: "Flag: FALSE_POSITIVE. Admin_ID: ADM-44.",
    timestampDate: "2023.10.24",
    timestampTime: "14:18:44.201",
    previousHash: "2aadebe134aefd400e238914baedae3ff28d7210e782eaefe7738efcc03aa11b",
    currentHash: "6f5a3b2b8e213ad4feaefcba0012eafefcfdaaa345bddeeeffdcb9e8b7fc93af",
    isVerified: true,
    details: {
      origin: "Admin-Terminal-East",
      operatorId: "ADM-44",
      latencyMs: 1450,
      protocolVersion: "v2.0",
      payloadJson: `{\n  "action": "FORCE_ALLOW",\n  "overridden_flag": "FLG-8812-ZZ",\n  "override_justification": "Verified physically over emergency hotline. Legitimate customer trading abroad.",\n  "approved_by": "Senior Auditor ADM-44",\n  "security_token": "TOK-COMP-E-4482"\n}`
    }
  },
  {
    block: "005",
    vector: "VERIFIED",
    vectorCategory: "CONSENSUS",
    entityHash: "BLK-CHN-007",
    payload: "Ledger block finalized, hashed to CHAIN.",
    timestampDate: "2023.10.24",
    timestampTime: "14:15:00.001",
    previousHash: "6f5a3b2b8e213ad4feaefcba0012eafefcfdaaa345bddeeeffdcb9e8b7fc93af",
    currentHash: "bc7ee49a318ea94bdcfbcfad912eef45aafee37b927aedeaaccddeedcfef2342",
    isVerified: true,
    details: {
      origin: "PrimaryConsensusEngine",
      latencyMs: 12,
      protocolVersion: "v4.0",
      payloadJson: `{\n  "consensus_round": 12053,\n  "ledger_node_voters": 12,\n  "quorum_percentage": 100.0,\n  "block_merkle_root": "0x78a1e2fdea09bc73caedfe123",\n  "compression_ratio_pct": 94.2\n}`
    }
  },
  {
    block: "006",
    vector: "LIQUID_LOCK",
    vectorCategory: "SYS",
    entityHash: "TRX-4421-YF",
    payload: "Automated liquidity freeze on suspected collateral deficit.",
    timestampDate: "2023.10.24",
    timestampTime: "14:12:18.941",
    previousHash: "bc7ee49a318ea94bdcfbcfad912eef45aafee37b927aedeaaccddeedcfef2342",
    currentHash: "123da4bfeea789acbcffeef89234aaab7234edee81992934ffeed2347bdffeed",
    isVerified: true,
    details: {
      origin: "SmartContractKeeper",
      latencyMs: 18,
      protocolVersion: "v2.5.4",
      payloadJson: `{\n  "contract_addr": "0x3f5ceb82...4fe",\n  "liquidity_pool": "USDC-ETH-V3",\n  "locked_amount": 420000,\n  "collateral_ratio_found": 1.04,\n  "min_required_ratio": 1.15\n}`
    }
  },
  {
    block: "007",
    vector: "NEURAL_EVAL",
    vectorCategory: "AI",
    entityHash: "USR-GAMMA-12",
    payload: "Risk score adjusted [05 -> 88]. Reason: COINCIDENT_TRANSFER_STORM.",
    timestampDate: "2023.10.24",
    timestampTime: "14:11:02.115",
    previousHash: "123da4bfeea789acbcffeef89234aaab7234edee81992934ffeed2347bdffeed",
    currentHash: "ef38aa234dbeee7c2a781d4aef89bcff234a45fe712bc9e2cf38aed9bf3cf8ee",
    isVerified: true,
    details: {
      origin: "AIShield-Model-V3",
      riskAdjustedFrom: 5,
      riskAdjustedTo: 88,
      latencyMs: 145,
      payloadJson: `{\n  "user_tier": "VIP_RETAIL",\n  "transaction_frequency_increase_pct": 1400.0,\n  "multi_layer_risk_assessment": {\n    "velocity_score": 0.95,\n    "structural_divergence": 0.81\n  },\n  "recommended_action": "FORCE_HOLD_30M"\n}`
    }
  },
  {
    block: "008",
    vector: "DATA_INGEST",
    vectorCategory: "API",
    entityHash: "SEC-POL-99",
    payload: "Security policy update (token-rotation v1.0.9) synced dynamically.",
    timestampDate: "2023.10.24",
    timestampTime: "14:09:41.002",
    previousHash: "ef38aa234dbeee7c2a781d4aef89bcff234a45fe712bc9e2cf38aed9bf3cf8ee",
    currentHash: "f3c8a91b2c4d5efe7df12349baef82bcffffeed123476313aaefe12345fbba53",
    isVerified: true,
    details: {
      origin: "Auth0-Bridge-Hook",
      latencyMs: 78,
      payloadJson: `{\n  "event": "JWT_ROTATION_POLICIES",\n  "target_scopes": ["api:read", "api:write", "admin:override"],\n  "reauthorization_required_immediately": true\n}`
    }
  },
  {
    block: "009",
    vector: "OVERRIDE",
    vectorCategory: "HUMAN",
    entityHash: "FLG-4412-BB",
    payload: "Lockout manual bypass by Regional Inspector (Admin_ID: ADM-02).",
    timestampDate: "2023.10.24",
    timestampTime: "14:05:12.772",
    previousHash: "f3c8a91b2c4d5efe7df12349baef82bcffffeed123476313aaefe12345fbba53",
    currentHash: "7b8e1a12e23b6c5d6efff7a2ea3bcffa4e9123feaa819ac9bedbfeeefcbdeea1",
    isVerified: true,
    details: {
      origin: "Admin-Terminal-West",
      operatorId: "ADM-02",
      latencyMs: 2900,
      payloadJson: `{\n  "target_lockout": "IP_BLOCK_USR-BETA-41",\n  "bypass_duration_minutes": 15,\n  "inspector_pki_signature": "0x55ff6abced1441",\n  "audit_reason": "On-site physically confirmed identity and bypass needed for corporate file upload."\n}`
    }
  },
  {
    block: "010",
    vector: "VERIFIED",
    vectorCategory: "CONSENSUS",
    entityHash: "BLK-CHN-006",
    payload: "Consensus block 12052 written, confirmed by 11 nodes.",
    timestampDate: "2023.10.24",
    timestampTime: "14:00:00.002",
    previousHash: "7b8e1a12e23b6c5d6efff7a2ea3bcffa4e9123feaa819ac9bedbfeeefcbdeea1",
    currentHash: "decfef2342bc7ee49a318ea94bdcfbcfad912eef45aafee37b927aedeaaccddee",
    isVerified: true,
    details: {
      origin: "BackupConsensusNodeEast",
      latencyMs: 14,
      payloadJson: `{\n  "consensus_round": 12052,\n  "nodes_active": 11,\n  "re-org_detected": false,\n  "block_weight_factor": 1.442\n}`
    }
  },
  {
    block: "011",
    vector: "SIGN_ROTATION",
    vectorCategory: "SYS",
    entityHash: "KEY-ROT-44",
    payload: "Cryptographic signature keys rotated for RegPilot API stream.",
    timestampDate: "2023.10.24",
    timestampTime: "13:58:32.190",
    previousHash: "decfef2342bc7ee49a318ea94bdcfbcfad912eef45aafee37b927aedeaaccddee",
    currentHash: "fe38234ea72312dcf9c9ceeeeff1823abfcfdeea938472f102adeefcf62e08cc",
    isVerified: true,
    details: {
      origin: "HSM-Cluster-Nordic",
      latencyMs: 82,
      payloadJson: `{\n  "vault_key_id": "V-9983-KEY",\n  "algorithm": "ECDSA-P384",\n  "entropy_score_percent": 99.9997,\n  "active_nodes_updated": 4\n}`
    }
  },
  {
    block: "012",
    vector: "NEURAL_EVAL",
    vectorCategory: "AI",
    entityHash: "TRX-7711-LK",
    payload: "Evaluation complete. Approved. Risk score locked at [08].",
    timestampDate: "2023.10.24",
    timestampTime: "13:55:12.441",
    previousHash: "fe38234ea72312dcf9c9ceeeeff1823abfcfdeea938472f102adeefcf62e08cc",
    currentHash: "7ea023ee4cbdfeb49dfec456aeeb789fcf234e6fae1a21e0ffccbdaef012fdfc",
    isVerified: true,
    details: {
      origin: "AIShield-Model-V3",
      riskAdjustedFrom: 8,
      riskAdjustedTo: 8,
      latencyMs: 95,
      payloadJson: `{\n  "transaction_id": "TRX-7711-LK",\n  "sender_wallet": "0x88f2191bce092",\n  "neural_inference_paths_traversed": 128,\n  "confidence_rating": 0.994\n}`
    }
  },
  {
    block: "013",
    vector: "DATA_INGEST",
    vectorCategory: "API",
    entityHash: "SEC-POL-98",
    payload: "EU regulatory updates on dynamic sanctions lists pulled successfully.",
    timestampDate: "2023.10.24",
    timestampTime: "13:50:01.092",
    previousHash: "7ea023ee4cbdfeb49dfec456aeeb789fcf234e6fae1a21e0ffccbdaef012fdfc",
    currentHash: "324eeefc7e819bcfefeed2314aefcb324b89eedcab71bce12ea11b8efbbcca21",
    isVerified: true,
    details: {
      origin: "EU-Brussels-RegAPI",
      latencyMs: 512,
      payloadJson: `{\n  "endpoint": "ssl://rules.eu.brussels/v3/sanctions",\n  "entries_parsed": 1204,\n  "critical_additions_count": 2,\n  "sync_latencies_avg_ms": 110\n}`
    }
  },
  {
    block: "014",
    vector: "OVERRIDE",
    vectorCategory: "HUMAN",
    entityHash: "FLG-2190-XA",
    payload: "Dynamic velocity hold canceled. Verified by (Admin_ID: ADM-18).",
    timestampDate: "2023.10.24",
    timestampTime: "13:46:11.890",
    previousHash: "324eeefc7e819bcfefeed2314aefcb324b89eedcab71bce12ea11b8efbbcca21",
    currentHash: "fbcde31248caefab7e9bcfee2daef8bc8e89fdedae2d12e8beefcaed90ffcee1",
    isVerified: true,
    details: {
      origin: "Admin-Terminal-Central",
      operatorId: "ADM-18",
      latencyMs: 1890,
      payloadJson: `{\n  "incident_reference": "INC-8192",\n  "customer_tier": "PLATINUM",\n  "verification_token": "HOTLINE-SECURE-998",\n  "justification": "Customer called from verified satellite link on yacht. Legit trade."\n}`
    }
  },
  {
    block: "015",
    vector: "VERIFIED",
    vectorCategory: "CONSENSUS",
    entityHash: "BLK-CHN-005",
    payload: "Ledger writing completed. Blocks anchored with SHA-256 securely.",
    timestampDate: "2023.10.24",
    timestampTime: "13:40:00.000",
    previousHash: "fbcde31248caefab7e9bcfee2daef8bc8e89fdedae2d12e8beefcaed90ffcee1",
    currentHash: "aeffda321bceee324eeef112adef82cbbf1123eec7e82acbf24b912aedecca00",
    isVerified: true,
    details: {
      origin: "PrimaryConsensusEngine",
      latencyMs: 11,
      payloadJson: `{\n  "consensus_round": 12051,\n  "validated_packets": 880,\n  "block_hash_strength_index": 1.0,\n  "epoch_status": "LOCKED"\n}`
    }
  }
];
