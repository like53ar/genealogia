import networkx as nx
from typing import List, Dict, Any, Tuple
from sqlalchemy.orm import Session
from uuid import UUID

from .. import models, schemas

def build_graph(db: Session) -> nx.DiGraph:
    """Builds a directed graph representing the genealogy tree."""
    G = nx.DiGraph()
    personas = db.query(models.Persona).all()
    for p in personas:
        G.add_node(p.id, nombre=p.nombre, apellido=p.apellido)

    relaciones = db.query(models.RelacionDirecta).all()
    for r in relaciones:
        if r.tipo_relacion == models.TipoRelacion.PADRE_HIJO:
            # persona_1 = padre/madre, persona_2 = hijo/hija
            G.add_edge(r.persona_1_id, r.persona_2_id, type="PADRE_HIJO")
        elif r.tipo_relacion == models.TipoRelacion.PAREJA:
            # Bidirectional or undirected for PAREJA, we add both directed edges with type PAREJA
            G.add_edge(r.persona_1_id, r.persona_2_id, type="PAREJA")
            G.add_edge(r.persona_2_id, r.persona_1_id, type="PAREJA")
    
    return G

def infer_kinship(db: Session, persona_a_id: UUID, persona_b_id: UUID) -> str:
    """Infers the kinship relationship between two persons."""
    G = build_graph(db)
    
    if persona_a_id not in G or persona_b_id not in G:
        return "Unknown Persons"
        
    if persona_a_id == persona_b_id:
        return "Self"
        
    try:
        # Check shortest path in undirected graph to find the closest kinship
        undirected_G = G.to_undirected()
        path = nx.shortest_path(undirected_G, source=persona_a_id, target=persona_b_id)
        
        # Simple heuristics based on distance
        distance = len(path) - 1
        
        # Determine if A is ancestor of B
        try:
            if nx.has_path(G, persona_a_id, persona_b_id):
                path_a_b = nx.shortest_path(G, source=persona_a_id, target=persona_b_id)
                dist_a_b = len(path_a_b) - 1
                if dist_a_b == 1:
                    return "Padre/Madre"
                elif dist_a_b == 2:
                    return "Abuelo/Abuela"
                elif dist_a_b == 3:
                    return "Bisabuelo/Bisabuela"
                elif dist_a_b == 4:
                    return "Tatarabuelo/Tatarabuela"
                else:
                    return f"Ancestro ({dist_a_b}ª generación)"
        except nx.NetworkXNoPath:
            pass

        # Determine if B is ancestor of A
        try:
            if nx.has_path(G, persona_b_id, persona_a_id):
                path_b_a = nx.shortest_path(G, source=persona_b_id, target=persona_a_id)
                dist_b_a = len(path_b_a) - 1
                if dist_b_a == 1:
                    return "Hijo/Hija"
                elif dist_b_a == 2:
                    return "Nieto/Nieta"
                elif dist_b_a == 3:
                    return "Bisnieto/Bisnieta"
                elif dist_b_a == 4:
                    return "Tataranieto/Tataranieta"
                else:
                    return f"Descendiente ({dist_b_a}ª generación)"
        except nx.NetworkXNoPath:
            pass
            
        # Lowest Common Ancestor logic
        # Find ancestors of A
        ancestors_a = nx.ancestors(G, persona_a_id)
        ancestors_b = nx.ancestors(G, persona_b_id)
        
        common_ancestors = ancestors_a.intersection(ancestors_b)
        
        if common_ancestors:
            # Find the lowest common ancestor (closest to A and B)
            # A simple approach: find the common ancestor with the minimum sum of distances to A and B
            min_dist = float('inf')
            best_lca = None
            dist_a = 0
            dist_b = 0
            
            for lca in common_ancestors:
                try:
                    d_a = len(nx.shortest_path(G, source=lca, target=persona_a_id)) - 1
                    d_b = len(nx.shortest_path(G, source=lca, target=persona_b_id)) - 1
                    if d_a + d_b < min_dist:
                        min_dist = d_a + d_b
                        best_lca = lca
                        dist_a = d_a
                        dist_b = d_b
                except nx.NetworkXNoPath:
                    continue
                    
            if best_lca:
                if dist_a == 1 and dist_b == 1:
                    return "Hermano/Hermana"
                elif dist_a == 2 and dist_b == 1:
                    return "Tío/Tía"
                elif dist_a == 1 and dist_b == 2:
                    return "Sobrino/Sobrina"
                elif dist_a == 2 and dist_b == 2:
                    return "Primo/Prima"
                elif dist_a == 3 and dist_b == 1:
                    return "Tío Abuelo / Tía Abuela"
                else:
                    return f"Pariente (Ancestro común a {dist_a} y {dist_b} generaciones)"

        # Check for PAREJA directly
        if distance == 1:
            edge_data = G.get_edge_data(persona_a_id, persona_b_id) or G.get_edge_data(persona_b_id, persona_a_id)
            if edge_data and edge_data.get('type') == 'PAREJA':
                return "Pareja / Esposo(a)"
                
        return "Relación lejana"

    except nx.NetworkXNoPath:
        return "Sin parentesco conocido"
