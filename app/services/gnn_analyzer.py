"""
ForgeShield — Week 2
Graph Neural Network Document Coherence Analyzer

Builds an entity relationship graph from document entities
and detects structural anomalies using NetworkX.

In a production system, this would use PyTorch Geometric (GNN).
For the hackathon demo, NetworkX graph analysis is used for
reliability while demonstrating the same conceptual approach.
"""

import json
import networkx as nx


def build_document_graph(entities: dict) -> nx.DiGraph:
    """
    Build a directed entity-relationship graph from extracted document entities.
    Nodes = entity instances. Edges = relationships between entities.
    """
    G = nx.DiGraph()

    # Add company nodes
    for company in entities.get("companies", []):
        G.add_node(company, type="company", label=company[:20])

    # Add amount nodes
    for i, amt in enumerate(entities.get("amounts", [])):
        nid = f"amt_{i}"
        G.add_node(nid, type="amount", value=amt)

    # Add date nodes
    for i, date in enumerate(entities.get("dates", [])):
        nid = f"date_{i}"
        G.add_node(nid, type="date", value=date)

    # Add PAN nodes
    for pan in entities.get("pan_numbers", []):
        G.add_node(pan, type="pan")

    # Add IFSC nodes
    for ifsc in entities.get("ifsc_codes", []):
        G.add_node(ifsc, type="ifsc")

    # Connect: company → amount (financial relationship)
    for company in entities.get("companies", []):
        for i in range(len(entities.get("amounts", []))):
            G.add_edge(company, f"amt_{i}", relation="has_amount")

    # Connect: company → PAN (identity relationship)
    for company in entities.get("companies", []):
        for pan in entities.get("pan_numbers", []):
            G.add_edge(company, pan, relation="identified_by")

    # Connect: date → company (temporal relationship)
    for i in range(len(entities.get("dates", []))):
        for company in entities.get("companies", []):
            G.add_edge(f"date_{i}", company, relation="associated_date")

    # Connect: IFSC → amount (transaction relationship)
    for ifsc in entities.get("ifsc_codes", []):
        for i in range(len(entities.get("amounts", []))):
            G.add_edge(ifsc, f"amt_{i}", relation="transaction")

    return G


def analyze_graph_coherence(entities: dict) -> dict:
    """
    Analyze the entity graph for structural coherence anomalies.
    Returns graph_score (0–100) and list of detected anomalies.
    """
    G         = build_document_graph(entities)
    anomalies = []
    score     = 0.0

    if G.number_of_nodes() == 0:
        return {
            "graph_score": 0.0,
            "anomalies":   ["Insufficient entities to build graph"],
            "node_count":  0,
            "edge_count":  0,
            "components":  0
        }

    # Check 1: Isolated nodes — entities with no relationships
    isolated = list(nx.isolates(G))
    if isolated:
        anomalies.append(
            f"Isolated entities with no relationships detected: "
            f"{[str(n)[:30] for n in isolated[:3]]}"
        )
        score += len(isolated) * 5

    # Check 2: Disconnected components — fragmented document structure
    undirected  = G.to_undirected()
    components  = list(nx.connected_components(undirected))
    n_comp      = len(components)
    if n_comp > 2:
        anomalies.append(
            f"Document has {n_comp} disconnected entity clusters — "
            "possible cut-and-paste document assembly"
        )
        score += min(n_comp * 8, 30)

    # Check 3: Amounts with no company context
    amount_nodes  = [n for n, d in G.nodes(data=True) if d.get("type") == "amount"]
    company_nodes = [n for n, d in G.nodes(data=True) if d.get("type") == "company"]
    if len(amount_nodes) > 2 and len(company_nodes) == 0:
        anomalies.append(
            f"Found {len(amount_nodes)} financial amounts with no associated company entity"
        )
        score += 18

    # Check 4: Very sparse graph — low entity density for a financial document
    if G.number_of_nodes() > 4:
        density = nx.density(G)
        if density < 0.05:
            anomalies.append(
                f"Very low entity relationship density ({density:.3f}) — "
                "sparse structure unusual for a financial document"
            )
            score += 12

    # Check 5: Multiple PAN for a single company (possible identity fraud)
    for company in company_nodes:
        pan_neighbors = [
            n for n in G.successors(company)
            if G.nodes[n].get("type") == "pan"
        ]
        if len(pan_neighbors) > 1:
            anomalies.append(
                f"Company '{str(company)[:30]}' associated with multiple PAN numbers "
                f"({len(pan_neighbors)}) — possible identity manipulation"
            )
            score += 20

    # Check 6: No dates in a financial document
    date_nodes = [n for n, d in G.nodes(data=True) if d.get("type") == "date"]
    if len(amount_nodes) > 0 and len(date_nodes) == 0:
        anomalies.append(
            "Financial amounts present but no dates found — "
            "unusual for a legitimate financial document"
        )
        score += 10

    graph_score = min(round(score, 2), 100.0)

    return {
        "graph_score": graph_score,
        "anomalies":   anomalies,
        "node_count":  G.number_of_nodes(),
        "edge_count":  G.number_of_edges(),
        "components":  n_comp
    }


def generate_heatmap_data(vit_risk: float, semantic_risk: float,
                           graph_risk: float) -> list:
    """
    Generate heatmap region annotations for the frontend document overlay.
    In production this would use GradCAM attention maps from the ViT model.
    For demo: generates plausible region highlights based on risk scores.
    """
    regions = []

    if vit_risk > 50:
        regions.append({
            "label": "Pixel anomaly region",
            "x": 8, "y": 8, "w": 35, "h": 18,
            "risk": round(vit_risk / 100, 2),
            "color": "#FF3B3B"
        })

    if vit_risk > 65:
        regions.append({
            "label": "Compression artifact",
            "x": 55, "y": 15, "w": 30, "h": 12,
            "risk": round((vit_risk - 10) / 100, 2),
            "color": "#FF3B3B"
        })

    if semantic_risk > 30:
        regions.append({
            "label": "Entity mismatch zone",
            "x": 10, "y": 40, "w": 80, "h": 10,
            "risk": round(semantic_risk / 100, 2),
            "color": "#FF9500"
        })

    if graph_risk > 20:
        regions.append({
            "label": "Relationship anomaly",
            "x": 20, "y": 62, "w": 60, "h": 10,
            "risk": round(graph_risk / 100, 2),
            "color": "#FF9500"
        })

    if semantic_risk > 60:
        regions.append({
            "label": "Registry mismatch",
            "x": 5, "y": 80, "w": 90, "h": 12,
            "risk": round(semantic_risk / 100, 2),
            "color": "#FF3B3B"
        })

    return regions
