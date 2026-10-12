"""Cálculo de parentesco entre dos personas.

Convención: el resultado describe qué es A respecto de B
("A es <resultado> de B").

Las relaciones PADRE_HIJO / ADOPCION forman un grafo dirigido padre → hijo,
que es el único que se usa para calcular ancestros y consanguinidad.
Las relaciones PAREJA se guardan aparte y sólo se usan para el parentesco
político (suegros, cuñados, etc.), para no contaminar las distancias
generacionales.
"""
from dataclasses import dataclass, field
from typing import Dict, Optional, Set, FrozenSet
from uuid import UUID

import networkx as nx
from sqlalchemy.orm import Session

from .. import models

PARENT_TYPES = (models.TipoRelacion.PADRE_HIJO, models.TipoRelacion.ADOPCION)


@dataclass
class FamilyGraph:
    parents: nx.DiGraph = field(default_factory=nx.DiGraph)  # arista padre → hijo
    couples: Set[FrozenSet] = field(default_factory=set)
    genders: Dict = field(default_factory=dict)

    def add_person(self, pid, genero: Optional[str] = None):
        self.parents.add_node(pid)
        self.genders[pid] = (genero or "").upper()[:1]

    def add_parent(self, parent, child):
        self.parents.add_edge(parent, child)

    def add_couple(self, a, b):
        self.couples.add(frozenset((a, b)))

    def spouses_of(self, pid) -> Set:
        return {other for c in self.couples if pid in c for other in c if other != pid}

    def parents_of(self, pid) -> Set:
        return set(self.parents.predecessors(pid)) if pid in self.parents else set()

    def children_of(self, pid) -> Set:
        return set(self.parents.successors(pid)) if pid in self.parents else set()

    def ancestor_distances(self, pid) -> Dict:
        """{ancestro: generaciones}, incluyendo a la propia persona con 0."""
        return nx.single_source_shortest_path_length(self.parents.reverse(copy=False), pid)


def build_graph(db: Session, arbol_id: Optional[UUID] = None) -> FamilyGraph:
    """Construye el grafo familiar, limitado a un árbol si se indica."""
    g = FamilyGraph()

    personas = db.query(models.Persona)
    if arbol_id is not None:
        personas = personas.filter(models.Persona.arbol_id == arbol_id)

    for p in personas.all():
        g.add_person(p.id, p.genero)

    # Se filtran por pertenencia de ambas personas al árbol, no por
    # RelacionDirecta.arbol_id, que puede venir vacío en registros antiguos.
    for r in db.query(models.RelacionDirecta).all():
        if r.persona_1_id not in g.genders or r.persona_2_id not in g.genders:
            continue
        if r.tipo_relacion in PARENT_TYPES:
            # persona_1 = padre/madre, persona_2 = hijo/hija
            g.add_parent(r.persona_1_id, r.persona_2_id)
        elif r.tipo_relacion == models.TipoRelacion.PAREJA:
            g.add_couple(r.persona_1_id, r.persona_2_id)

    return g


def _g(gender: str, masc: str, fem: str) -> str:
    if gender == "M":
        return masc
    if gender == "F":
        return fem
    return f"{masc}/{fem}"


_ASCENDENTES = {1: ("Padre", "Madre"), 2: ("Abuelo", "Abuela"),
                3: ("Bisabuelo", "Bisabuela"), 4: ("Tatarabuelo", "Tatarabuela")}
_DESCENDENTES = {1: ("Hijo", "Hija"), 2: ("Nieto", "Nieta"),
                 3: ("Bisnieto", "Bisnieta"), 4: ("Tataranieto", "Tataranieta")}
_TIOS = {2: ("Tío", "Tía"), 3: ("Tío abuelo", "Tía abuela"),
         4: ("Tío bisabuelo", "Tía bisabuela")}
_SOBRINOS = {2: ("Sobrino", "Sobrina"), 3: ("Sobrino nieto", "Sobrina nieta"),
             4: ("Sobrino bisnieto", "Sobrina bisnieta")}
_PRIMOS = {2: "hermano", 3: "segundo", 4: "tercero", 5: "cuarto"}


def _blood_kinship(g: FamilyGraph, a, b) -> Optional[str]:
    """Parentesco consanguíneo de A respecto de B, o None si no comparten ancestros."""
    sex = g.genders.get(a, "")
    anc_a = g.ancestor_distances(a)
    anc_b = g.ancestor_distances(b)
    common = anc_a.keys() & anc_b.keys()
    if not common:
        return None

    # Ancestro común más cercano (mínima suma de generaciones)
    lca = min(common, key=lambda x: (anc_a[x] + anc_b[x], anc_a[x]))
    da, db = anc_a[lca], anc_b[lca]

    if da == 0:  # A es ancestro de B
        if db in _ASCENDENTES:
            return _g(sex, *_ASCENDENTES[db])
        return f"{_g(sex, 'Ancestro', 'Ancestra')} ({db}.ª generación)"
    if db == 0:  # A es descendiente de B
        if da in _DESCENDENTES:
            return _g(sex, *_DESCENDENTES[da])
        return f"{_g(sex, 'Descendiente', 'Descendiente')} ({da}.ª generación)"

    if da == 1 and db == 1:
        pa, pb = g.parents_of(a), g.parents_of(b)
        if len(pa) == 2 and len(pb) == 2 and len(pa & pb) == 1:
            return _g(sex, "Medio hermano", "Media hermana")
        return _g(sex, "Hermano", "Hermana")
    if da == 1 and db in _TIOS:
        return _g(sex, *_TIOS[db])
    if db == 1 and da in _SOBRINOS:
        return _g(sex, *_SOBRINOS[da])
    if da == db and da in _PRIMOS:
        return f"{_g(sex, 'Primo', 'Prima')} {_PRIMOS[da]}"

    return f"Pariente (ancestro común a {da} y {db} generaciones)"


def _affinity_kinship(g: FamilyGraph, a, b) -> Optional[str]:
    """Parentesco político (a través de una pareja) de A respecto de B."""
    sex = g.genders.get(a, "")
    spouses_a, spouses_b = g.spouses_of(a), g.spouses_of(b)
    parents_b, children_b = g.parents_of(b), g.children_of(b)

    # A es padre/madre de la pareja de B
    if any(s in g.children_of(a) for s in spouses_b):
        return _g(sex, "Suegro", "Suegra")
    # A es pareja de un hijo de B
    if spouses_a & children_b:
        return _g(sex, "Yerno", "Nuera")
    # A es pareja del padre/madre de B (sin serlo)
    if spouses_a & parents_b:
        return _g(sex, "Padrastro", "Madrastra")
    # A es hijo de la pareja de B (sin serlo)
    if g.parents_of(a) & spouses_b:
        return _g(sex, "Hijastro", "Hijastra")
    # A es hermano de la pareja de B, o pareja de un hermano de B
    siblings = lambda p: {c for par in g.parents_of(p) for c in g.children_of(par)} - {p}
    if any(s in siblings(a) for s in spouses_b) or spouses_a & siblings(b):
        return _g(sex, "Cuñado", "Cuñada")
    return None


def kinship_label(g: FamilyGraph, a, b) -> str:
    if a not in g.genders or b not in g.genders:
        return "Persona desconocida"
    if a == b:
        return "Misma persona"
    if frozenset((a, b)) in g.couples:
        return _g(g.genders.get(a, ""), "Esposo", "Esposa")

    label = _blood_kinship(g, a, b) or _affinity_kinship(g, a, b)
    if label:
        return label

    connected = g.parents.to_undirected()
    connected.add_edges_from(tuple(c) for c in g.couples)
    if nx.has_path(connected, a, b):
        return "Relación lejana"
    return "Sin parentesco conocido"


def infer_kinship(db: Session, persona_a_id: UUID, persona_b_id: UUID) -> str:
    """Infiere qué es la persona A respecto de la persona B, dentro de su árbol."""
    persona_a = db.query(models.Persona).filter(models.Persona.id == persona_a_id).first()
    persona_b = db.query(models.Persona).filter(models.Persona.id == persona_b_id).first()
    if not persona_a or not persona_b:
        return "Persona desconocida"
    if persona_a.arbol_id != persona_b.arbol_id:
        return "Sin parentesco conocido"

    g = build_graph(db, persona_a.arbol_id)
    return kinship_label(g, persona_a_id, persona_b_id)
