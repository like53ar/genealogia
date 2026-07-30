import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

export interface Persona {
  id: string;
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
}

export interface Relacion {
  id: string;
  persona_1_id: string;
  persona_2_id: string;
  tipo_relacion: 'PADRE_HIJO' | 'PAREJA' | 'ADOPCION';
  fecha_inicio?: string;
  fecha_fin?: string;
}

export interface RelacionCreate {
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
  private apiUrl = 'http://localhost:8000'; // Default FastAPI url

  // Personas
  getPersonas(): Observable<Persona[]> {
    return this.http.get<Persona[]>(`${this.apiUrl}/personas/`);
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

  // Relaciones
  getRelaciones(): Observable<Relacion[]> {
    return this.http.get<Relacion[]>(`${this.apiUrl}/relaciones/`);
  }

  createRelacion(relacion: RelacionCreate): Observable<Relacion> {
    return this.http.post<Relacion>(`${this.apiUrl}/relaciones/`, relacion);
  }

  // Parentesco
  getParentesco(personaAId: string, personaBId: string): Observable<{relacion: string}> {
    return this.http.get<{relacion: string}>(`${this.apiUrl}/parentesco/?persona_a_id=${personaAId}&persona_b_id=${personaBId}`);
  }
}
