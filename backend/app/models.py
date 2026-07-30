import uuid
from datetime import date as date_type
from sqlalchemy import Column, String, Date, Float, ForeignKey, Text, Enum, Uuid
from sqlalchemy.orm import relationship
import enum

from .database import Base

class TipoRelacion(enum.Enum):
    PADRE_HIJO = "PADRE_HIJO"
    PAREJA = "PAREJA"
    ADOPCION = "ADOPCION"

class Arbol(Base):
    __tablename__ = "arboles"

    id = Column(Uuid(as_uuid=True), primary_key=True, default=uuid.uuid4)
    nombre = Column(String, nullable=False)
    descripcion = Column(Text, nullable=True)
    fecha_creacion = Column(Date, nullable=True, default=date_type.today)

    personas = relationship("Persona", back_populates="arbol", cascade="all, delete-orphan")
    relaciones = relationship("RelacionDirecta", back_populates="arbol", cascade="all, delete-orphan")

class Lugar(Base):
    __tablename__ = "lugares"

    id = Column(Uuid(as_uuid=True), primary_key=True, default=uuid.uuid4)
    nombre = Column(String, index=True, nullable=False)
    latitud = Column(Float, nullable=True)
    longitud = Column(Float, nullable=True)

class Persona(Base):
    __tablename__ = "personas"

    id = Column(Uuid(as_uuid=True), primary_key=True, default=uuid.uuid4)
    arbol_id = Column(Uuid(as_uuid=True), ForeignKey("arboles.id", ondelete="CASCADE"), nullable=True)
    nombre = Column(String, nullable=False)
    apellido = Column(String, nullable=False)
    genero = Column(String, nullable=True)
    fecha_nacimiento = Column(Date, nullable=True)
    fecha_fallecimiento = Column(Date, nullable=True)
    lugar_nacimiento_id = Column(Uuid(as_uuid=True), ForeignKey("lugares.id"), nullable=True)
    lugar_fallecimiento_id = Column(Uuid(as_uuid=True), ForeignKey("lugares.id"), nullable=True)
    biografia = Column(Text, nullable=True)

    arbol = relationship("Arbol", back_populates="personas")
    lugar_nacimiento = relationship("Lugar", foreign_keys=[lugar_nacimiento_id])
    lugar_fallecimiento = relationship("Lugar", foreign_keys=[lugar_fallecimiento_id])

class RelacionDirecta(Base):
    __tablename__ = "relaciones_directas"

    id = Column(Uuid(as_uuid=True), primary_key=True, default=uuid.uuid4)
    arbol_id = Column(Uuid(as_uuid=True), ForeignKey("arboles.id", ondelete="CASCADE"), nullable=True)
    persona_1_id = Column(Uuid(as_uuid=True), ForeignKey("personas.id"), nullable=False)
    persona_2_id = Column(Uuid(as_uuid=True), ForeignKey("personas.id"), nullable=False)
    tipo_relacion = Column(Enum(TipoRelacion), nullable=False)
    fecha_inicio = Column(Date, nullable=True)
    fecha_fin = Column(Date, nullable=True)

    arbol = relationship("Arbol", back_populates="relaciones")
    persona_1 = relationship("Persona", foreign_keys=[persona_1_id])
    persona_2 = relationship("Persona", foreign_keys=[persona_2_id])
