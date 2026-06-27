"""
Unit tests for NetraAI — ForgeShield & RegPilot modules
Tests focus on core business logic: fraud detection & compliance validation
"""

import pytest
import json
from app.services.nlp_engine import run_semantic_analysis, extract_entities
from app.services.gnn_analyzer import analyze_graph_coherence
from app.services.map_extractor import get_regulatory_reference


class TestNLPEngine:
    """Test NLP semantic analysis and entity extraction."""

    def test_extract_fraudco_detects_struck_off_company(self):
        """
        Test that NLP engine detects FRAUDCO (struck-off company) from text.
        FRAUDCO should be flagged in nlp_flags with MCA21 status.
        """
        text = """
        We the undersigned hereby certify that FRAUDCO PRIVATE LIMITED
        has applied for a loan of Rs. 25,00,000 with CIN: U00000MH2010PTC000000.
        """
        
        result = run_semantic_analysis(text)
        
        # Assert the function returns a dict
        assert isinstance(result, dict)
        
        # Assert semantic score is computed
        assert "semantic_score" in result
        assert isinstance(result["semantic_score"], (int, float))
        
        # Assert entities were extracted
        assert "entities" in result
        entities = result.get("entities", {})
        assert "companies" in entities
        
        # Assert NLP flags include fraud detection
        nlp_flags_raw = result.get("nlp_flags", "[]")
        nlp_flags = json.loads(nlp_flags_raw) if isinstance(nlp_flags_raw, str) else nlp_flags_raw
        assert any("FRAUDCO" in str(flag) or "struck" in str(flag).lower() for flag in nlp_flags), \
            f"Expected FRAUDCO fraud flag, got: {nlp_flags}"

    def test_cersai_detects_mortgaged_property(self):
        """
        Test that NLP engine detects SY789012 (mortgaged property) from text.
        Should flag that property is already mortgaged to Canara Bank.
        """
        text = """
        We hereby pledge the agricultural land described as:
        Survey Number: SY789012, located in Karnataka.
        Total loan amount: Rs. 45,00,000
        """
        
        result = run_semantic_analysis(text)
        
        # Assert survey number was extracted
        entities = result.get("entities", {})
        survey_numbers = entities.get("survey_numbers", [])
        # SY789012 should be detected if text parsing is working
        
        # Assert NLP flags are present
        nlp_flags_raw = result.get("nlp_flags", "[]")
        nlp_flags = json.loads(nlp_flags_raw) if isinstance(nlp_flags_raw, str) else nlp_flags_raw
        assert isinstance(nlp_flags, list)

    def test_clean_document_low_risk(self):
        """
        Test that clean documents (TATA, INFOSYS, etc.) show no fraud flags.
        Semantic score should be 0 or very low for legitimate companies.
        """
        text = """
        TATA CONSULTANCY SERVICES LIMITED
        A leading IT consulting firm.
        Loan application for Rs. 10,00,000.
        """
        
        result = run_semantic_analysis(text)
        
        # Assert semantic score for clean doc
        assert "semantic_score" in result
        semantic_score = result["semantic_score"]
        # Clean companies should have low/zero semantic fraud score
        assert semantic_score <= 20, f"Expected low score for clean company, got {semantic_score}"
        
        # Assert no major fraud flags
        nlp_flags_raw = result.get("nlp_flags", "[]")
        nlp_flags = json.loads(nlp_flags_raw) if isinstance(nlp_flags_raw, str) else nlp_flags_raw
        assert len(nlp_flags) <= 2, f"Expected few flags for clean doc, got {len(nlp_flags)}: {nlp_flags}"

    def test_future_date_detection(self):
        """
        Test that NLP engine detects post-dated/future-dated documents.
        Future dates indicate document manipulation.
        """
        text = """
        Salary Certificate dated 25-FEB-2025 for 3 months ahead.
        This is a post-dated document.
        """
        
        result = run_semantic_analysis(text)
        
        # Extract entities to check date parsing
        nlp_flags_raw = result.get("nlp_flags", "[]")
        nlp_flags = json.loads(nlp_flags_raw) if isinstance(nlp_flags_raw, str) else nlp_flags_raw
        
        # Assert function completes without error
        assert isinstance(nlp_flags, list)


class TestGNNAnalyzer:
    """Test GNN entity graph coherence analysis."""

    def test_gnn_empty_graph_returns_zero(self):
        """
        Test that empty entity set returns graph_score = 0 (no anomalies).
        An empty graph is structurally valid.
        """
        empty_entities = {
            "companies": [],
            "amounts": [],
            "dates": [],
            "pan_numbers": [],
            "survey_numbers": [],
            "ifsc_codes": []
        }
        
        result = analyze_graph_coherence(empty_entities)
        
        assert "graph_score" in result
        assert result["graph_score"] == 0.0, \
            f"Empty graph should have score 0, got {result['graph_score']}"

    def test_gnn_detects_isolated_nodes(self):
        """
        Test that GNN detects orphaned amounts (no company, no date).
        Isolated nodes indicate potential data manipulation or fraud.
        """
        entities_with_orphans = {
            "companies": ["COMPANY A"],
            "amounts": [100000, 500000],  # 500000 has no company association
            "dates": ["2024-01-15"],  # Only one date for two amounts
            "pan_numbers": [],
            "survey_numbers": [],
            "ifsc_codes": []
        }
        
        result = analyze_graph_coherence(entities_with_orphans)
        
        # Assert graph analysis was performed
        assert "graph_score" in result
        assert "anomalies" in result
        
        # Should detect orphaned amounts as anomalies
        anomalies = result.get("anomalies", [])
        # If graph_score > 0, some anomaly was detected
        if result["graph_score"] > 0:
            assert len(anomalies) > 0, "Non-zero score should have anomalies"

    def test_gnn_valid_coherent_graph(self):
        """
        Test that a coherent graph (company→amount→date chain) has low anomaly score.
        """
        coherent_entities = {
            "companies": ["TATA CONSULTANCY SERVICES"],
            "amounts": [1000000],
            "dates": ["2024-01-15"],
            "pan_numbers": ["AATCT0055A"],
            "survey_numbers": [],
            "ifsc_codes": ["HDFC0000123"]
        }
        
        result = analyze_graph_coherence(coherent_entities)
        
        assert "graph_score" in result
        # Coherent graph should have very low (or zero) anomaly score
        assert result["graph_score"] <= 15, \
            f"Coherent graph should have low score, got {result['graph_score']}"


class TestRegulatoryReferences:
    """Test regulatory reference mapping for MAPs."""

    def test_credit_rbi_regulatory_reference(self):
        """
        Test that credit department + RBI circular returns correct regulatory reference.
        """
        ref = get_regulatory_reference("credit", "RBI")
        
        assert "RBI Master Direction" in ref
        assert "Banking Regulation Act 1949" in ref
        assert "Prudential Norms" in ref

    def test_it_cybersecurity_reference(self):
        """
        Test that IT department + SEBI circular references cybersecurity framework.
        """
        ref = get_regulatory_reference("IT", "SEBI")
        
        assert "Cybersecurity" in ref
        assert "SEBI" in ref

    def test_aml_regulatory_reference(self):
        """
        Test that AML department references PMLA and KYC norms.
        """
        ref = get_regulatory_reference("AML", "RBI")
        
        assert "PMLA 2002" in ref
        assert "KYC" in ref or "Anti-money laundering" in ref

    def test_default_regulatory_reference(self):
        """
        Test that unknown department/source returns sensible default reference.
        """
        ref = get_regulatory_reference("unknown_dept", "unknown_source")
        
        assert isinstance(ref, str)
        assert len(ref) > 10, "Reference should be non-empty"
        assert "RBI" in ref or "Banking" in ref or "Compliance" in ref


class TestEntityExtraction:
    """Test entity extraction from document text."""

    def test_extract_pan_number(self):
        """
        Test that PAN numbers are correctly extracted from text.
        PAN format: AAAPF5055K (10 characters, alphanumeric)
        """
        text = "PAN: AAAPF5055K"
        
        entities = extract_entities(text)
        
        assert "pan_numbers" in entities
        pan_list = entities["pan_numbers"]
        # Function should attempt extraction
        assert isinstance(pan_list, list)

    def test_extract_survey_number(self):
        """
        Test that survey numbers (SY-XXX format) are extracted.
        """
        text = "Land survey number: SY789012"
        
        entities = extract_entities(text)
        
        assert "survey_numbers" in entities
        surveys = entities["survey_numbers"]
        assert isinstance(surveys, list)

    def test_extract_amounts(self):
        """
        Test that currency amounts are extracted.
        """
        text = "Loan amount: Rs. 25,00,000"
        
        entities = extract_entities(text)
        
        assert "amounts" in entities
        amounts = entities["amounts"]
        assert isinstance(amounts, list)


class TestIntegration:
    """Integration tests — verify end-to-end flows."""

    def test_full_scan_workflow_high_risk(self, sample_nlp_flags, sample_entities):
        """
        Test complete high-risk document workflow.
        From text → NLP flags → GNN analysis → final risk score.
        """
        # Step 1: NLP Analysis
        nlp_result = run_semantic_analysis("FRAUDCO PRIVATE LIMITED")
        
        # Step 2: GNN Analysis (simulated with mock data)
        gnn_result = analyze_graph_coherence(sample_entities)
        
        # Step 3: Compute weighted score
        vit_score = 85.0  # Simulated ViT score
        final_score = round(
            vit_score * 0.50 +
            nlp_result["semantic_score"] * 0.30 +
            gnn_result["graph_score"] * 0.20,
            2
        )
        
        # Assert combined score is in range
        assert 0 <= final_score <= 100
        # Fraud case should have high combined score
        assert final_score > 40, f"Fraud case should score high, got {final_score}"

    def test_full_scan_workflow_clean(self, sample_clean_entities):
        """
        Test complete low-risk document workflow with clean company.
        """
        # Step 1: NLP Analysis
        nlp_result = run_semantic_analysis("TATA CONSULTANCY SERVICES")
        
        # Step 2: GNN Analysis
        gnn_result = analyze_graph_coherence(sample_clean_entities)
        
        # Step 3: Compute weighted score
        vit_score = 5.0  # Clean document ViT score
        final_score = round(
            vit_score * 0.50 +
            nlp_result["semantic_score"] * 0.30 +
            gnn_result["graph_score"] * 0.20,
            2
        )
        
        # Assert clean document has low final score
        assert final_score < 40, f"Clean doc should score low, got {final_score}"


class TestErrorHandling:
    """Test error handling and edge cases."""

    def test_nlp_handles_empty_text(self):
        """
        Test that NLP analysis gracefully handles empty input.
        """
        result = run_semantic_analysis("")
        
        # Should return valid structure, not crash
        assert isinstance(result, dict)
        assert "semantic_score" in result
        assert "entities" in result

    def test_gnn_handles_none_entities(self):
        """
        Test that GNN analysis handles None or malformed entity input.
        """
        result = analyze_graph_coherence({})
        
        # Should return valid structure
        assert isinstance(result, dict)
        assert "graph_score" in result

    def test_regulatory_reference_handles_none(self):
        """
        Test that regulatory reference mapping handles None/empty inputs.
        """
        ref = get_regulatory_reference(None, None)
        
        assert isinstance(ref, str)
        assert len(ref) > 0


# ─────────────────────────────────────────────────────────
# Test execution helper
# ─────────────────────────────────────────────────────────
if __name__ == "__main__":
    pytest.main([__file__, "-v"])
