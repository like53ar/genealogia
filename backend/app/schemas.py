from pydantic import BaseModel, Field, field_validator
from typing import Optional, List
from uuid import UUID
from datetime import date
from .models import TipoRelacion

# ── Árbol schemas ────────────────────────────────────────
class ArbolCreate(BaseModel):
    nombre: str
    descripcion: Optional[str] = None

class ArbolOut(BaseModel):
    id: UUID
    nombre: str
    descripcion: Optional[str] = None
    fecha_creacion: Optional[date] = None

    class Config:
        from_attributes = True


class LugarBase(BaseModel):
    nombre: str
    latitud: Optional[float] = None
    longitud: Optional[float] = None

class LugarCreate(LugarBase):
    pass

class Lugar(LugarBase):
    id: UUID

    class Config:
        from_attributes = True

class PersonaBase(BaseModel):
    nombre: str
    apellido: str
    genero: Optional[str] = None
    fecha_nacimiento: Optional[date] = None
    fecha_fallecimiento: Optional[date] = None
    lugar_nacimiento_id: Optional[UUID] = None
    lugar_fallecimiento_id: Optional[UUID] = None
    biografia: Optional[str] = None

    @field_validator('fecha_nacimiento', 'fecha_fallecimiento', mode='before')
    @classmethod
    def clean_empty_dates(cls, v):
        if v == '' or v is None:
            return None
        return v

class PersonaCreate(PersonaBase):
    pass

class Persona(PersonaBase):
    id: UUID
    lugar_nacimiento: Optional[Lugar] = None
    lugar_fallecimiento: Optional[Lugar] = None

    class Config:
        from_attributes = True

class RelacionDirectaBase(BaseModel):
    persona_1_id: UUID
    persona_2_id: UUID
    tipo_relacion: TipoRelacion
    fecha_inicio: Optional[date] = None
    fecha_fin: Optional[date] = None
    arbol_id: Optional[UUID] = None

    @field_validator('fecha_inicio', 'fecha_fin', mode='before')
    @classmethod
    def clean_empty_dates(cls, v):
        if v == '' or v is None:
            return None
        return v

class RelacionDirectaCreate(RelacionDirectaBase):
    pass

class RelacionDirectaUpdate(BaseModel):
    fecha_inicio: Optional[date] = None
    fecha_fin: Optional[date] = None
    tipo_relacion: Optional[TipoRelacion] = None

    @field_validator('fecha_inicio', 'fecha_fin', mode='before')
    @classmethod
    def clean_empty_dates(cls, v):
        if v == '' or v is None:
            return None
        return v

class RelacionDirecta(RelacionDirectaBase):
    id: UUID

    class Config:
        from_attributes = True
