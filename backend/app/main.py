from fastapi import FastAPI, Depends, HTTPException, Query
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.orm import Session
from typing import List, Optional
from uuid import UUID
from datetime import date

from . import models, schemas, database
from .database import engine
from .services import geocoding, kinship
from pydantic import BaseModel

models.Base.metadata.create_all(bind=engine)

app = FastAPI(title="Genealogy Tree API", description="API for Genealogy Tree platform")

# ── CORS ────────────────────────────────────────────────
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.get("/")
def read_root():
    return {"message": "Welcome to the Genealogy Tree API"}


# ── Schema simplificado para el formulario de nueva persona ──
class PersonaSimpleCreate(BaseModel):
    nombre: str
    apellido: str
    genero: Optional[str] = None
    fecha_nacimiento: Optional[date] = None
    fecha_muerte: Optional[date] = None        # alias amigable
    lugar_nacimiento: Optional[str] = None     # texto libre → geocodificado
    notas: Optional[str] = None


class PersonaSimple(BaseModel):
    id: UUID
    nombre: str
    apellido: str
    genero: Optional[str] = None
    fecha_nacimiento: Optional[date] = None
    fecha_fallecimiento: Optional[date] = None
    lugar_nacimiento: Optional[str] = None
    notas: Optional[str] = None

    class Config:
        from_attributes = True


# ── Personas endpoints ───────────────────────────────────

@app.post("/personas/", response_model=PersonaSimple)
def create_persona(persona: PersonaSimpleCreate, db: Session = Depends(database.get_db)):
    """Crea una persona. Acepta lugar_nacimiento como texto libre y fecha_muerte."""
    lugar_id = None
    lugar_nombre_str = None

    if persona.lugar_nacimiento and persona.lugar_nacimiento.strip():
        lugar_nombre_str = persona.lugar_nacimiento.strip()
        # Buscar lugar existente o crear
        db_lugar = db.query(models.Lugar).filter(
            models.Lugar.nombre == lugar_nombre_str
        ).first()
        if not db_lugar:
            lat, lng = geocoding.get_coordinates(lugar_nombre_str)
            db_lugar = models.Lugar(nombre=lugar_nombre_str, latitud=lat, longitud=lng)
            db.add(db_lugar)
            db.flush()
        lugar_id = db_lugar.id

    db_persona = models.Persona(
        nombre=persona.nombre,
        apellido=persona.apellido,
        genero=persona.genero,
        fecha_nacimiento=persona.fecha_nacimiento,
        fecha_fallecimiento=persona.fecha_muerte,
        lugar_nacimiento_id=lugar_id,
        biografia=persona.notas,
    )
    db.add(db_persona)
    db.commit()
    db.refresh(db_persona)

    # Build response manually to include flat lugar string
    return PersonaSimple(
        id=db_persona.id,
        nombre=db_persona.nombre,
        apellido=db_persona.apellido,
        genero=db_persona.genero,
        fecha_nacimiento=db_persona.fecha_nacimiento,
        fecha_fallecimiento=db_persona.fecha_fallecimiento,
        lugar_nacimiento=lugar_nombre_str,
        notas=db_persona.biografia,
    )


@app.get("/personas/", response_model=List[PersonaSimple])
def read_personas(skip: int = 0, limit: int = 100, db: Session = Depends(database.get_db)):
    personas = db.query(models.Persona).offset(skip).limit(limit).all()
    result = []
    for p in personas:
        lugar_str = p.lugar_nacimiento.nombre if p.lugar_nacimiento else None
        result.append(PersonaSimple(
            id=p.id,
            nombre=p.nombre,
            apellido=p.apellido,
            genero=p.genero,
            fecha_nacimiento=p.fecha_nacimiento,
            fecha_fallecimiento=p.fecha_fallecimiento,
            lugar_nacimiento=lugar_str,
            notas=p.biografia,
        ))
    return result

@app.put("/personas/{persona_id}", response_model=PersonaSimple)
def update_persona(persona_id: UUID, persona: PersonaSimpleCreate, db: Session = Depends(database.get_db)):
    db_persona = db.query(models.Persona).filter(models.Persona.id == persona_id).first()
    if not db_persona:
        raise HTTPException(status_code=404, detail="Persona no encontrada")

    lugar_id = db_persona.lugar_nacimiento_id
    lugar_nombre_str = db_persona.lugar_nacimiento.nombre if db_persona.lugar_nacimiento else None

    if persona.lugar_nacimiento and persona.lugar_nacimiento.strip():
        lugar_nombre_str = persona.lugar_nacimiento.strip()
        db_lugar = db.query(models.Lugar).filter(
            models.Lugar.nombre == lugar_nombre_str
        ).first()
        if not db_lugar:
            lat, lng = geocoding.get_coordinates(lugar_nombre_str)
            db_lugar = models.Lugar(nombre=lugar_nombre_str, latitud=lat, longitud=lng)
            db.add(db_lugar)
            db.flush()
        lugar_id = db_lugar.id
    elif persona.lugar_nacimiento == "":
        lugar_id = None
        lugar_nombre_str = None

    db_persona.nombre = persona.nombre
    db_persona.apellido = persona.apellido
    db_persona.genero = persona.genero
    db_persona.fecha_nacimiento = persona.fecha_nacimiento
    db_persona.fecha_fallecimiento = persona.fecha_muerte
    db_persona.lugar_nacimiento_id = lugar_id
    db_persona.biografia = persona.notas

    db.commit()
    db.refresh(db_persona)

    return PersonaSimple(
        id=db_persona.id,
        nombre=db_persona.nombre,
        apellido=db_persona.apellido,
        genero=db_persona.genero,
        fecha_nacimiento=db_persona.fecha_nacimiento,
        fecha_fallecimiento=db_persona.fecha_fallecimiento,
        lugar_nacimiento=lugar_nombre_str,
        notas=db_persona.biografia,
    )

@app.delete("/personas/{persona_id}")
def delete_persona(persona_id: UUID, db: Session = Depends(database.get_db)):
    db_persona = db.query(models.Persona).filter(models.Persona.id == persona_id).first()
    if not db_persona:
        raise HTTPException(status_code=404, detail="Persona no encontrada")
    
    # Delete relations where this person is involved
    db.query(models.RelacionDirecta).filter(
        (models.RelacionDirecta.persona_1_id == persona_id) | 
        (models.RelacionDirecta.persona_2_id == persona_id)
    ).delete(synchronize_session=False)

    db.delete(db_persona)
    db.commit()
    return {"message": "Persona eliminada exitosamente"}


# ── Lugares endpoints ────────────────────────────────────

@app.post("/lugares/", response_model=schemas.Lugar)
def create_lugar(lugar: schemas.LugarCreate, db: Session = Depends(database.get_db)):
    db_lugar = models.Lugar(**lugar.model_dump())
    db.add(db_lugar)
    db.commit()
    db.refresh(db_lugar)
    return db_lugar

@app.get("/lugares/", response_model=List[schemas.Lugar])
def read_lugares(skip: int = 0, limit: int = 100, db: Session = Depends(database.get_db)):
    lugares = db.query(models.Lugar).offset(skip).limit(limit).all()
    return lugares


# ── Relaciones endpoints ─────────────────────────────────

@app.post("/relaciones/", response_model=schemas.RelacionDirecta)
def create_relacion(relacion: schemas.RelacionDirectaCreate, db: Session = Depends(database.get_db)):
    db_relacion = models.RelacionDirecta(**relacion.model_dump())
    db.add(db_relacion)
    db.commit()
    db.refresh(db_relacion)
    return db_relacion

@app.get("/relaciones/", response_model=List[schemas.RelacionDirecta])
def read_relaciones(skip: int = 0, limit: int = 100, db: Session = Depends(database.get_db)):
    relaciones = db.query(models.RelacionDirecta).offset(skip).limit(limit).all()
    return relaciones


# ── Extra endpoints ──────────────────────────────────────

@app.get("/geocodificar/")
def geocodificar(direccion: str = Query(..., description="Dirección a geocodificar")):
    lat, lng = geocoding.get_coordinates(direccion)
    if lat is None or lng is None:
        raise HTTPException(status_code=404, detail="No se pudo encontrar la ubicación")
    return {"latitud": lat, "longitud": lng}

@app.get("/parentesco/")
def calcular_parentesco(persona_a_id: UUID, persona_b_id: UUID, db: Session = Depends(database.get_db)):
    relacion = kinship.infer_kinship(db, persona_a_id, persona_b_id)
    return {"relacion": relacion}
