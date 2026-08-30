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


# ── Árboles endpoints ────────────────────────────────────

@app.get("/arboles/", response_model=List[schemas.ArbolOut])
def get_arboles(db: Session = Depends(database.get_db)):
    """Devuelve todos los árboles genealógicos."""
    return db.query(models.Arbol).order_by(models.Arbol.fecha_creacion.desc()).all()

@app.get("/arboles/{arbol_id}", response_model=schemas.ArbolOut)
def get_arbol(arbol_id: UUID, db: Session = Depends(database.get_db)):
    """Devuelve un árbol por ID."""
    arbol = db.query(models.Arbol).filter(models.Arbol.id == arbol_id).first()
    if not arbol:
        raise HTTPException(status_code=404, detail="Árbol no encontrado")
    return arbol

@app.post("/arboles/", response_model=schemas.ArbolOut, status_code=201)
def create_arbol(arbol: schemas.ArbolCreate, db: Session = Depends(database.get_db)):
    """Crea un nuevo árbol genealógico con nombre y descripción opcional."""
    db_arbol = models.Arbol(
        nombre=arbol.nombre,
        descripcion=arbol.descripcion,
    )
    db.add(db_arbol)
    db.commit()
    db.refresh(db_arbol)
    return db_arbol

@app.put("/arboles/{arbol_id}", response_model=schemas.ArbolOut)
def update_arbol(arbol_id: UUID, arbol: schemas.ArbolCreate, db: Session = Depends(database.get_db)):
    """Actualiza el nombre/descripción de un árbol."""
    db_arbol = db.query(models.Arbol).filter(models.Arbol.id == arbol_id).first()
    if not db_arbol:
        raise HTTPException(status_code=404, detail="Árbol no encontrado")
    db_arbol.nombre = arbol.nombre
    db_arbol.descripcion = arbol.descripcion
    db.commit()
    db.refresh(db_arbol)
    return db_arbol

@app.delete("/arboles/{arbol_id}")
def delete_arbol(arbol_id: UUID, db: Session = Depends(database.get_db)):
    """Elimina un árbol y en cascada todas sus personas y relaciones."""
    db_arbol = db.query(models.Arbol).filter(models.Arbol.id == arbol_id).first()
    if not db_arbol:
        raise HTTPException(status_code=404, detail="Árbol no encontrado")
    db.delete(db_arbol)
    db.commit()
    return {"message": f"Árbol '{db_arbol.nombre}' eliminado exitosamente"}


class PersonaSimpleCreate(BaseModel):
    nombre: str
    apellido: str
    genero: Optional[str] = None
    fecha_nacimiento: Optional[date] = None
    fecha_muerte: Optional[date] = None        # alias amigable
    lugar_nacimiento: Optional[str] = None     # texto libre → geocodificado
    notas: Optional[str] = None
    arbol_id: Optional[UUID] = None            # FK al árbol familiar


class PersonaSimple(BaseModel):
    id: UUID
    arbol_id: Optional[UUID] = None
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

    # Verificar que el árbol exista si se provee arbol_id
    if persona.arbol_id:
        arbol = db.query(models.Arbol).filter(models.Arbol.id == persona.arbol_id).first()
        if not arbol:
            raise HTTPException(status_code=404, detail="Árbol no encontrado")

    db_persona = models.Persona(
        nombre=persona.nombre,
        apellido=persona.apellido,
        genero=persona.genero,
        fecha_nacimiento=persona.fecha_nacimiento,
        fecha_fallecimiento=persona.fecha_muerte,
        lugar_nacimiento_id=lugar_id,
        biografia=persona.notas,
        arbol_id=persona.arbol_id,  # ← vincula al árbol familiar
    )
    db.add(db_persona)
    db.commit()
    db.refresh(db_persona)

    # Build response manually to include flat lugar string
    return PersonaSimple(
        id=db_persona.id,
        arbol_id=db_persona.arbol_id,
        nombre=db_persona.nombre,
        apellido=db_persona.apellido,
        genero=db_persona.genero,
        fecha_nacimiento=db_persona.fecha_nacimiento,
        fecha_fallecimiento=db_persona.fecha_fallecimiento,
        lugar_nacimiento=lugar_nombre_str,
        notas=db_persona.biografia,
    )


@app.get("/personas/", response_model=List[PersonaSimple])
def read_personas(
    skip: int = 0,
    limit: int = 100,
    arbol_id: Optional[UUID] = Query(None, description="Filtrar por árbol familiar"),
    db: Session = Depends(database.get_db)
):
    """Lista personas. Si se pasa arbol_id, filtra solo los integrantes de esa familia."""
    query = db.query(models.Persona)
    if arbol_id:
        query = query.filter(models.Persona.arbol_id == arbol_id)
    personas = query.offset(skip).limit(limit).all()
    result = []
    for p in personas:
        lugar_str = p.lugar_nacimiento.nombre if p.lugar_nacimiento else None
        result.append(PersonaSimple(
            id=p.id,
            arbol_id=p.arbol_id,
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
        arbol_id=db_persona.arbol_id,
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
    # Si no se pasó arbol_id explícito, intentar inferirlo de una de las personas
    rel_data = relacion.model_dump()
    if not rel_data.get("arbol_id"):
        p1 = db.query(models.Persona).filter(models.Persona.id == relacion.persona_1_id).first()
        if p1 and p1.arbol_id:
            rel_data["arbol_id"] = p1.arbol_id

    # Evitar duplicar la misma relación exacta (o invertida en caso de pareja)
    existente = db.query(models.RelacionDirecta).filter(
        ((models.RelacionDirecta.persona_1_id == relacion.persona_1_id) & (models.RelacionDirecta.persona_2_id == relacion.persona_2_id) & (models.RelacionDirecta.tipo_relacion == relacion.tipo_relacion)) |
        ((models.RelacionDirecta.tipo_relacion == 'PAREJA') & (relacion.tipo_relacion == models.TipoRelacion.PAREJA) & (models.RelacionDirecta.persona_1_id == relacion.persona_2_id) & (models.RelacionDirecta.persona_2_id == relacion.persona_1_id))
    ).first()
    if existente:
        if relacion.fecha_inicio is not None:
            existente.fecha_inicio = relacion.fecha_inicio
            db.commit()
            db.refresh(existente)
        return existente

    db_relacion = models.RelacionDirecta(**rel_data)
    db.add(db_relacion)
    db.commit()
    db.refresh(db_relacion)
    return db_relacion

@app.get("/relaciones/", response_model=List[schemas.RelacionDirecta])
def read_relaciones(
    skip: int = 0,
    limit: int = 2000,
    arbol_id: Optional[UUID] = Query(None, description="Filtrar relaciones por árbol"),
    persona_id: Optional[UUID] = Query(None, description="Filtrar por persona involucrada"),
    db: Session = Depends(database.get_db)
):
    query = db.query(models.RelacionDirecta)
    if arbol_id:
        p_ids = [p[0] for p in db.query(models.Persona.id).filter(models.Persona.arbol_id == arbol_id).all()]
        query = query.filter(
            (models.RelacionDirecta.arbol_id == arbol_id) |
            (models.RelacionDirecta.persona_1_id.in_(p_ids)) |
            (models.RelacionDirecta.persona_2_id.in_(p_ids)) |
            (models.RelacionDirecta.arbol_id == None)
        )
    if persona_id:
        query = query.filter(
            (models.RelacionDirecta.persona_1_id == persona_id) | 
            (models.RelacionDirecta.persona_2_id == persona_id)
        )
    relaciones = query.offset(skip).limit(limit).all()
    return relaciones

@app.put("/relaciones/{relacion_id}", response_model=schemas.RelacionDirecta)
def update_relacion(relacion_id: UUID, relacion_update: schemas.RelacionDirectaUpdate, db: Session = Depends(database.get_db)):
    """Actualiza los datos de una relación directa (fechas, tipo)."""
    db_relacion = db.query(models.RelacionDirecta).filter(models.RelacionDirecta.id == relacion_id).first()
    if not db_relacion:
        raise HTTPException(status_code=404, detail="Relación no encontrada")
    
    update_data = relacion_update.model_dump(exclude_unset=True)
    if "fecha_inicio" in update_data:
        db_relacion.fecha_inicio = update_data["fecha_inicio"]
    if "fecha_fin" in update_data:
        db_relacion.fecha_fin = update_data["fecha_fin"]
    if "tipo_relacion" in update_data and update_data["tipo_relacion"]:
        db_relacion.tipo_relacion = update_data["tipo_relacion"]

    db.commit()
    db.refresh(db_relacion)
    return db_relacion

@app.put("/relaciones/entre/{persona_1_id}/{persona_2_id}", response_model=schemas.RelacionDirecta)
def update_relacion_entre(persona_1_id: UUID, persona_2_id: UUID, relacion_update: schemas.RelacionDirectaUpdate, db: Session = Depends(database.get_db)):
    """Actualiza la relación existente entre dos personas."""
    db_relacion = db.query(models.RelacionDirecta).filter(
        ((models.RelacionDirecta.persona_1_id == persona_1_id) & (models.RelacionDirecta.persona_2_id == persona_2_id)) |
        ((models.RelacionDirecta.persona_1_id == persona_2_id) & (models.RelacionDirecta.persona_2_id == persona_1_id))
    ).first()
    if not db_relacion:
        raise HTTPException(status_code=404, detail="Relación no encontrada")
    update_data = relacion_update.model_dump(exclude_unset=True)
    if "fecha_inicio" in update_data:
        db_relacion.fecha_inicio = update_data["fecha_inicio"]
    if "fecha_fin" in update_data:
        db_relacion.fecha_fin = update_data["fecha_fin"]
    if "tipo_relacion" in update_data and update_data["tipo_relacion"]:
        db_relacion.tipo_relacion = update_data["tipo_relacion"]
    db.commit()
    db.refresh(db_relacion)
    return db_relacion

@app.delete("/relaciones/{relacion_id}")
def delete_relacion(relacion_id: UUID, db: Session = Depends(database.get_db)):
    """Elimina una relación directa por su ID."""
    db_relacion = db.query(models.RelacionDirecta).filter(models.RelacionDirecta.id == relacion_id).first()
    if not db_relacion:
        raise HTTPException(status_code=404, detail="Relación no encontrada")
    db.delete(db_relacion)
    db.commit()
    return {"message": "Relación eliminada exitosamente"}

@app.delete("/relaciones/entre/{persona_1_id}/{persona_2_id}")
def delete_relacion_entre(persona_1_id: UUID, persona_2_id: UUID, db: Session = Depends(database.get_db)):
    """Elimina cualquier relación directa directa o inversa entre dos personas."""
    eliminadas = db.query(models.RelacionDirecta).filter(
        ((models.RelacionDirecta.persona_1_id == persona_1_id) & (models.RelacionDirecta.persona_2_id == persona_2_id)) |
        ((models.RelacionDirecta.persona_1_id == persona_2_id) & (models.RelacionDirecta.persona_2_id == persona_1_id))
    ).delete(synchronize_session=False)
    db.commit()
    return {"message": f"{eliminadas} relación(es) eliminada(s)"}


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
