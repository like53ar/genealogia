import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

// ── Interfaces Árbol ──────────────────────────────────
export interface Arbol {
  id: string;
  nombre: string;
  descripcion?: string;
  fecha_creacion?: string;
  cantidad_personas?: number;
}

export interface ArbolCreate {
  nombre: string;
  descripcion?: string;
}

// ── Interfaces Persona ────────────────────────────────
export interface Persona {
  id: string;
  arbol_id?: string;
  nombre: string;
  apellido: string;
  genero?: string;
  fecha_nacimiento?: string;
  fecha_fallecimiento?: string;
  lugar_nacimiento?: string;
  notas?: string;
}

export interface PersonaCreate {
  nombre: string;
  apellido: string;
  genero?: string;
  fecha_nacimiento?: string;
  fecha_muerte?: string;
  lugar_nacimiento?: string;
  notas?: string;
  arbol_id?: string;
}

export interface Relacion {
  id: string;
  arbol_id?: string;
  persona_1_id: string;
  persona_2_id: string;
  tipo_relacion: 'PADRE_HIJO' | 'PAREJA' | 'ADOPCION';
  fecha_inicio?: string;
  fecha_fin?: string;
}

export interface RelacionCreate {
  arbol_id?: string;
  persona_1_id: string;
  persona_2_id: string;
  tipo_relacion: 'PADRE_HIJO' | 'PAREJA' | 'ADOPCION';
  fecha_inicio?: string;
  fecha_fin?: string;
}

@Injectable({
  providedIn: 'root'
})
export class ApiService {
  private http = inject(HttpClient);
  private apiUrl = 'http://localhost:8000';

  // ── Árboles ──────────────────────────────────────────
  getArboles(): Observable<Arbol[]> {
    return this.http.get<Arbol[]>(`${this.apiUrl}/arboles/`);
  }

  getArbol(id: string): Observable<Arbol> {
    return this.http.get<Arbol>(`${this.apiUrl}/arboles/${id}`);
  }

  createArbol(arbol: ArbolCreate): Observable<Arbol> {
    return this.http.post<Arbol>(`${this.apiUrl}/arboles/`, arbol);
  }

  updateArbol(id: string, arbol: ArbolCreate): Observable<Arbol> {
    return this.http.put<Arbol>(`${this.apiUrl}/arboles/${id}`, arbol);
  }

  deleteArbol(id: string): Observable<any> {
    return this.http.delete(`${this.apiUrl}/arboles/${id}`);
  }

  // ── Personas ───────────────────────────────────
  getPersonas(arbolId?: string): Observable<Persona[]> {
    const url = arbolId
      ? `${this.apiUrl}/personas/?arbol_id=${arbolId}`
      : `${this.apiUrl}/personas/`;
    return this.http.get<Persona[]>(url);
  }

  createPersona(persona: PersonaCreate): Observable<Persona> {
    return this.http.post<Persona>(`${this.apiUrl}/personas/`, persona);
  }

  updatePersona(id: string, persona: PersonaCreate): Observable<Persona> {
    return this.http.put<Persona>(`${this.apiUrl}/personas/${id}`, persona);
  }

  deletePersona(id: string): Observable<any> {
    return this.http.delete(`${this.apiUrl}/personas/${id}`);
  }

  // ── Relaciones ────────────────────────────────────────
  getRelaciones(arbolId?: string): Observable<Relacion[]> {
    const url = arbolId
      ? `${this.apiUrl}/relaciones/?arbol_id=${arbolId}&limit=2000`
      : `${this.apiUrl}/relaciones/?limit=2000`;
    return this.http.get<Relacion[]>(url);
  }

  createRelacion(relacion: RelacionCreate): Observable<Relacion> {
    return this.http.post<Relacion>(`${this.apiUrl}/relaciones/`, relacion);
  }

  updateRelacion(id: string, data: Partial<RelacionCreate>): Observable<Relacion> {
    return this.http.put<Relacion>(`${this.apiUrl}/relaciones/${id}`, data);
  }

  updateRelacionBetween(persona1Id: string, persona2Id: string, data: Partial<RelacionCreate>): Observable<Relacion> {
    return this.http.put<Relacion>(`${this.apiUrl}/relaciones/entre/${persona1Id}/${persona2Id}`, data);
  }

  deleteRelacion(id: string): Observable<any> {
    return this.http.delete(`${this.apiUrl}/relaciones/${id}`);
  }

  deleteRelacionBetween(persona1Id: string, persona2Id: string): Observable<any> {
    return this.http.delete(`${this.apiUrl}/relaciones/entre/${persona1Id}/${persona2Id}`);
  }

  // ── Parentesco ────────────────────────────────────────
  getParentesco(personaAId: string, personaBId: string): Observable<{relacion: string}> {
    return this.http.get<{relacion: string}>(`${this.apiUrl}/parentesco/?persona_a_id=${personaAId}&persona_b_id=${personaBId}`);
  }
}
