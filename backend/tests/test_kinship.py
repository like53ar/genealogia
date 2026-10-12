"""Tests del cálculo de parentesco.

Familia de ejemplo:

    Abuelo ═ Abuela                    Consuegro ═ Consuegra
         │                                      │
   ┌─────┼──────────┐                           │
 Padre ═ Madre    Tia ═ TioPolitico           (Madre es hija de Consuegros)
   │                │
 ┌─┴──────┐        Primo
 Yo ═ Esposa  Hermano
 │
 Hijo ═ Nuera
 │
 Nieto

Además: Padre tiene una hija (MediaHermana) con OtraPareja,
y Esposa tiene un hijo (Hijastro) de una relación anterior.
"""
import uuid

import pytest
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker

from app import models
from app.database import Base
from app.services.kinship import FamilyGraph, kinship_label, infer_kinship

PERSONAS = {
    "Abuelo": "M", "Abuela": "F", "Consuegro": "M", "Consuegra": "F",
    "Padre": "M", "Madre": "F", "Tia": "F", "TioPolitico": "M",
    "Yo": "M", "Esposa": "F", "Hermano": "M", "Primo": "M",
    "Hijo": "M", "Nuera": "F", "Nieto": "M",
    "OtraPareja": "F", "MediaHermana": "F", "Hijastro": "M",
    "CunadaHermanaEsposa": "F", "SuegroEsposa": "M", "Extrano": None,
}
PADRE_HIJO = [
    ("Abuelo", "Padre"), ("Abuela", "Padre"), ("Abuelo", "Tia"), ("Abuela", "Tia"),
    ("Consuegro", "Madre"), ("Consuegra", "Madre"),
    ("Padre", "Yo"), ("Madre", "Yo"), ("Padre", "Hermano"), ("Madre", "Hermano"),
    ("Tia", "Primo"), ("TioPolitico", "Primo"),
    ("Yo", "Hijo"), ("Esposa", "Hijo"), ("Hijo", "Nieto"), ("Nuera", "Nieto"),
    ("Padre", "MediaHermana"), ("OtraPareja", "MediaHermana"),
    ("Esposa", "Hijastro"),
    ("SuegroEsposa", "Esposa"), ("SuegroEsposa", "CunadaHermanaEsposa"),
]
PAREJAS = [
    ("Abuelo", "Abuela"), ("Consuegro", "Consuegra"), ("Padre", "Madre"),
    ("Tia", "TioPolitico"), ("Yo", "Esposa"), ("Hijo", "Nuera"),
    ("Padre", "OtraPareja"),
]


@pytest.fixture(scope="module")
def familia():
    g = FamilyGraph()
    for nombre, genero in PERSONAS.items():
        g.add_person(nombre, genero)
    for padre, hijo in PADRE_HIJO:
        g.add_parent(padre, hijo)
    for a, b in PAREJAS:
        g.add_couple(a, b)
    return g


@pytest.mark.parametrize("a, b, esperado", [
    # Línea directa
    ("Padre", "Yo", "Padre"),
    ("Madre", "Yo", "Madre"),
    ("Abuela", "Yo", "Abuela"),
    ("Abuelo", "Nieto", "Tatarabuelo"),
    ("Yo", "Padre", "Hijo"),
    ("Nieto", "Yo", "Nieto"),
    ("Nieto", "Abuelo", "Tataranieto"),
    # Colaterales
    ("Hermano", "Yo", "Hermano"),
    ("MediaHermana", "Yo", "Media hermana"),
    ("Tia", "Yo", "Tía"),
    ("Yo", "Tia", "Sobrino"),
    ("Tia", "Hijo", "Tía abuela"),
    ("Hijo", "Tia", "Sobrino nieto"),
    ("Primo", "Yo", "Primo hermano"),
    # Pareja y parentesco político
    ("Esposa", "Yo", "Esposa"),
    ("Yo", "Esposa", "Esposo"),
    ("SuegroEsposa", "Yo", "Suegro"),
    ("Nuera", "Yo", "Nuera"),
    ("Yo", "Nuera", "Suegro"),
    ("Yo", "Hijastro", "Padrastro"),
    ("Hijastro", "Yo", "Hijastro"),
    ("CunadaHermanaEsposa", "Yo", "Cuñada"),
    ("Esposa", "Hermano", "Cuñada"),
    # Otros
    ("Yo", "Yo", "Misma persona"),
    ("Extrano", "Yo", "Sin parentesco conocido"),
    ("Consuegro", "TioPolitico", "Relación lejana"),
    ("Yo", "NoExiste", "Persona desconocida"),
])
def test_kinship_label(familia, a, b, esperado):
    assert kinship_label(familia, a, b) == esperado


def test_pareja_no_se_confunde_con_ancestro(familia):
    # Bug anterior: las aristas de pareja permitían "caminar" de cónyuge a hijo.
    assert kinship_label(familia, "Esposa", "Yo") != "Madre"
    assert kinship_label(familia, "Yo", "Hijastro") != "Padre"
    assert kinship_label(familia, "Esposa", "Nieto") == "Abuela"


def test_genero_desconocido_usa_ambas_formas():
    g = FamilyGraph()
    g.add_person("p", None)
    g.add_person("h", "M")
    g.add_parent("p", "h")
    assert kinship_label(g, "p", "h") == "Padre/Madre"


@pytest.fixture
def db():
    engine = create_engine("sqlite://")
    Base.metadata.create_all(engine)
    session = sessionmaker(bind=engine)()
    yield session
    session.close()


def test_infer_kinship_limita_al_arbol(db):
    arbol_1, arbol_2 = models.Arbol(nombre="Uno"), models.Arbol(nombre="Dos")
    db.add_all([arbol_1, arbol_2])
    db.flush()

    def persona(nombre, genero, arbol):
        p = models.Persona(id=uuid.uuid4(), nombre=nombre, apellido="Test",
                           genero=genero, arbol_id=arbol.id)
        db.add(p)
        return p

    padre = persona("Padre", "M", arbol_1)
    hija = persona("Hija", "F", arbol_1)
    otro = persona("Otro", "M", arbol_2)
    db.flush()
    db.add(models.RelacionDirecta(arbol_id=arbol_1.id, persona_1_id=padre.id,
                                  persona_2_id=hija.id,
                                  tipo_relacion=models.TipoRelacion.PADRE_HIJO))
    db.commit()

    assert infer_kinship(db, padre.id, hija.id) == "Padre"
    assert infer_kinship(db, hija.id, padre.id) == "Hija"
    assert infer_kinship(db, padre.id, otro.id) == "Sin parentesco conocido"
    assert infer_kinship(db, padre.id, uuid.uuid4()) == "Persona desconocida"
