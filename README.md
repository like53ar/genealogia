# 🌳 Árbol Genealógico

Aplicación web para construir, visualizar y gestionar árboles genealógicos familiares. Combina un backend en **Python/FastAPI** con un frontend en **Angular**, con diseño visual inspirado en jardines zen japoneses.

---

## 📸 Pantalla de inicio

La pantalla principal muestra el título **ÁRBOL GENEALÓGICO** centrado sobre un fondo de jardín zen ilustrado, con 3 acciones disponibles:

- 🌱 **CREAR ÁRBOL** — Abre un formulario para registrar una nueva familia
- ✏️ **EDITAR ÁRBOL** — Accede al árbol para modificar personas y relaciones
- 🍂 **BORRAR ÁRBOL** — Elimina el árbol con confirmación previa

---

## 🏗️ Arquitectura

```
genealogia/
├── backend/          # API REST con Python + FastAPI
│   ├── app/
│   │   ├── main.py       # Endpoints de la API
│   │   ├── models.py     # Modelos SQLAlchemy (Arbol, Persona, Relacion, Lugar)
│   │   ├── schemas.py    # Schemas Pydantic (validación)
│   │   ├── database.py   # Conexión SQLite / PostgreSQL
│   │   └── services/
│   │       ├── geocoding.py  # Geocodificación de lugares
│   │       └── kinship.py    # Cálculo de parentesco
│   └── requirements.txt
│
├── frontend/         # SPA con Angular 18
│   └── src/app/
│       ├── app.component.ts       # Componente raíz + navegación + modales
│       ├── core/
│       │   └── api.service.ts     # Servicio HTTP hacia el backend
│       └── features/
│           ├── family-tree/       # Visualización del árbol
│           └── onboarding/        # (legacy) Carga inicial de personas
│
└── docker-compose.yml  # Levanta PostgreSQL en Docker (opcional)
```

---

## 🗄️ Modelo de datos

### `Arbol` (árboles genealógicos)
| Campo | Tipo | Descripción |
|---|---|---|
| `id` | UUID | Identificador único |
| `nombre` | String | Nombre de la familia (ej: "Familia García") |
| `descripcion` | Text | Descripción opcional (origen, período, etc.) |
| `fecha_creacion` | Date | Fecha de creación automática |

### `Persona`
| Campo | Tipo | Descripción |
|---|---|---|
| `id` | UUID | Identificador único |
| `arbol_id` | UUID FK | Árbol al que pertenece |
| `nombre` / `apellido` | String | Nombre completo |
| `genero` | String | Género |
| `fecha_nacimiento` | Date | Fecha de nacimiento |
| `fecha_fallecimiento` | Date | Fecha de fallecimiento |
| `lugar_nacimiento_id` | UUID FK | Lugar de nacimiento geocodificado |
| `biografia` | Text | Notas biográficas |

### `RelacionDirecta`
| Campo | Tipo | Descripción |
|---|---|---|
| `tipo_relacion` | Enum | `PADRE_HIJO`, `PAREJA`, `ADOPCION` |
| `persona_1_id` / `persona_2_id` | UUID FK | Personas relacionadas |
| `arbol_id` | UUID FK | Árbol al que pertenece |

### `Lugar`
| Campo | Tipo | Descripción |
|---|---|---|
| `nombre` | String | Nombre del lugar |
| `latitud` / `longitud` | Float | Coordenadas geocodificadas |

---

## 🌐 API REST

Base URL: `http://localhost:8000`

### Árboles
| Método | Endpoint | Descripción |
|---|---|---|
| `GET` | `/arboles/` | Lista todos los árboles |
| `GET` | `/arboles/{id}` | Obtiene un árbol por ID |
| `POST` | `/arboles/` | Crea un nuevo árbol |
| `PUT` | `/arboles/{id}` | Edita nombre/descripción |
| `DELETE` | `/arboles/{id}` | Elimina árbol y todo su contenido (cascada) |

### Personas
| Método | Endpoint | Descripción |
|---|---|---|
| `GET` | `/personas/` | Lista todas las personas |
| `POST` | `/personas/` | Crea una persona (geocodifica el lugar automáticamente) |
| `PUT` | `/personas/{id}` | Edita una persona |
| `DELETE` | `/personas/{id}` | Elimina una persona y sus relaciones |

### Relaciones
| Método | Endpoint | Descripción |
|---|---|---|
| `GET` | `/relaciones/` | Lista todas las relaciones |
| `POST` | `/relaciones/` | Crea una relación entre personas |

### Utilidades
| Método | Endpoint | Descripción |
|---|---|---|
| `GET` | `/geocodificar/?direccion=...` | Devuelve coordenadas de un lugar |
| `GET` | `/parentesco/?persona_a_id=...&persona_b_id=...` | Calcula el parentesco entre dos personas |

> La documentación interactiva completa está disponible en: `http://localhost:8000/docs`

---

## 🚀 Instalación y arranque

### Requisitos previos
- **Python 3.12** (recomendado)
- **Node.js 18+** y **npm**
- **Git**

### 1. Clonar el repositorio

```bash
git clone https://github.com/like53ar/genealogia
cd genealogia
```

### 2. Backend

```bash
cd backend

# Crear entorno virtual con Python 3.12
py -3.12 -m venv venv

# Activar entorno (Windows)
.\venv\Scripts\activate

# Instalar dependencias
pip install -r requirements.txt

# Iniciar servidor
python -m uvicorn app.main:app --reload
```

El backend queda disponible en `http://localhost:8000`.

> **Base de datos:** Por defecto usa **SQLite** (`genealogy.db`) sin configuración adicional.  
> Para usar PostgreSQL, definir la variable de entorno `DATABASE_URL` en un archivo `.env`.

### 3. Frontend

```bash
cd frontend

# Instalar dependencias (con flag para compatibilidad de versiones)
npm install --legacy-peer-deps

# Iniciar servidor de desarrollo
npm start
```

El frontend queda disponible en `http://localhost:4200` y se abre automáticamente en el navegador.

---

## 🎨 Diseño visual

El sistema utiliza una paleta **zen** coherente en todos los elementos:

| Elemento | Color / Estilo |
|---|---|
| Fondo | Jardín zen ilustrado (árbol, rocas, arena) |
| Tipografía | `Georgia`, serif, mayúsculas con espaciado |
| Botones | Glassmorphism con `backdrop-filter: blur` |
| Paleta | Verde sage `#8a9a6a`, tierra `#7a6e5a`, terracota `#9a6a5a` |
| Efectos | Hover con elevación, active con escala |

---

## 🗺️ Hoja de ruta

### ✅ Completado
- [x] Pantalla de inicio con fondo zen y título central
- [x] 3 botones de acción (Crear / Editar / Borrar árbol)
- [x] Modal "Nuevo Árbol Familiar" con nombre y descripción
- [x] API REST completa para árboles (`/arboles/`)
- [x] API REST para personas, relaciones, lugares y parentesco
- [x] Modelo de datos relacional (Arbol → Persona → Relacion)
- [x] Entorno Python 3.12 con dependencias estables

### 🔄 En progreso
- [ ] Vincular personas al árbol activo al momento de la carga
- [ ] Botón "Editar Árbol" → lista de árboles existentes
- [ ] Botón "Borrar Árbol" → conectar con API (actualmente solo UI)

### 🔮 Próximos pasos
- [ ] Visualización gráfica del árbol con nodos y conexiones
- [ ] Mapa de lugares de nacimiento/fallecimiento (Leaflet)
- [ ] Carga de fotos por persona
- [ ] Exportar árbol a PDF o imagen
- [ ] Buscador de personas dentro del árbol

---

## 🛠️ Tecnologías utilizadas

| Capa | Tecnología | Versión |
|---|---|---|
| Backend | Python | 3.12 |
| API | FastAPI | 0.115.x |
| ORM | SQLAlchemy | 2.0.36 |
| Validación | Pydantic | 2.10.x |
| ASGI | Uvicorn | 0.32.x |
| BD local | SQLite | — |
| BD producción | PostgreSQL | 15 (Docker) |
| Frontend | Angular | 18 |
| Estilos | TailwindCSS | 3.x + CSS custom |
| Grafos | ngx-graph + D3.js | — |
| Mapas | Leaflet + ngx-leaflet | — |
| Geocodificación | Geopy | 2.4.1 |

---

## 👤 Autor

Proyecto personal de genealogía familiar.  
Repositorio: [github.com/like53ar/genealogia](https://github.com/like53ar/genealogia)
