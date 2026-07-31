import { Component, inject, Input, Output, EventEmitter, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ApiService, PersonaCreate, Persona } from '../../core/api.service';

@Component({
  selector: 'app-onboarding',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div style="
      min-height: 100vh;
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: flex-start;
      padding: 2rem 1rem;
      position: relative;
      z-index: 10;
    ">

      <!-- Encabezado -->
      <div style="text-align: center; margin-bottom: 2rem; animation: fadeInUp 0.5s ease-out forwards;">
        <div style="font-size: 1.8rem; margin-bottom: 0.4rem;">👥</div>
        <h2 style="
          font-family: 'Georgia', serif; font-size: 1.4rem; font-weight: 700;
          letter-spacing: 0.16em; color: #3b3a36; text-transform: uppercase; margin: 0 0 0.3rem;
          text-shadow: 0 1px 8px rgba(255,255,255,0.8);
        ">Integrantes de la familia</h2>
        <p style="
          font-family: 'Georgia', serif; font-size: 0.85rem; color: #7a7368;
          letter-spacing: 0.08em; margin: 0;
          background: rgba(255,255,255,0.4); padding: 0.3em 1em; border-radius: 999px;
          display: inline-block;
        ">{{ nombreArbol }}</p>

        <!-- Contador de personas cargadas -->
        <div *ngIf="personasCargadas.length > 0" style="
          margin-top: 0.8rem; display: flex; align-items: center; justify-content: center;
          gap: 0.4rem; flex-wrap: wrap;
        ">
          <span *ngFor="let p of personasCargadas" style="
            font-family: 'Georgia', serif; font-size: 0.78rem; color: #5a6a42;
            background: rgba(138,154,106,0.18); border: 1px solid rgba(138,154,106,0.35);
            padding: 0.2em 0.8em; border-radius: 999px; letter-spacing: 0.06em;
          ">{{ p.nombre }} {{ p.apellido }}</span>
        </div>
      </div>

      <!-- Card del formulario -->
      <div style="
        max-width: 480px; width: 100%;
        background: rgba(252,250,245,0.88);
        backdrop-filter: blur(14px); -webkit-backdrop-filter: blur(14px);
        border: 1px solid rgba(255,255,255,0.75);
        border-radius: 24px;
        padding: 2rem 2rem 1.5rem;
        box-shadow: 0 8px 40px rgba(70,60,40,0.15);
        animation: fadeInUp 0.5s 0.1s ease-out forwards; opacity: 0;
      ">

        <!-- Título del formulario -->
        <div style="display: flex; align-items: center; gap: 0.5rem; margin-bottom: 1.5rem; padding-bottom: 1rem; border-bottom: 1px solid rgba(138,154,106,0.2);">
          <span style="font-size: 1.1rem;">🌱</span>
          <h3 style="
            font-family: 'Georgia', serif; font-size: 1rem; font-weight: 700;
            letter-spacing: 0.12em; color: #3b3a36; text-transform: uppercase; margin: 0;
          ">{{ personasCargadas.length === 0 ? 'Primera persona' : 'Agregar integrante' }}</h3>
          <span style="
            margin-left: auto; font-family: 'Georgia', serif; font-size: 0.75rem;
            color: #8a9a6a; letter-spacing: 0.08em;
          ">{{ personasCargadas.length }} cargada{{ personasCargadas.length !== 1 ? 's' : '' }}</span>
        </div>

        <form (ngSubmit)="onSubmit()" #form="ngForm">

          <!-- Nombre y Apellido -->
          <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 0.8rem; margin-bottom: 0.9rem;">
            <div>
              <label class="lbl-zen">Nombre *</label>
              <input type="text" [(ngModel)]="persona.nombre" name="nombre" required
                class="inp-zen" placeholder="Ej: Leonardo" />
            </div>
            <div>
              <label class="lbl-zen">Apellido *</label>
              <input type="text" [(ngModel)]="persona.apellido" name="apellido" required
                class="inp-zen" placeholder="Ej: García" />
            </div>
          </div>

          <!-- Género -->
          <div style="margin-bottom: 0.9rem;">
            <label class="lbl-zen">Género</label>
            <select [(ngModel)]="persona.genero" name="genero" class="inp-zen">
              <option value="">Seleccionar...</option>
              <option value="M">Masculino</option>
              <option value="F">Femenino</option>
              <option value="O">Otro</option>
            </select>
          </div>

          <!-- Fechas -->
          <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 0.8rem; margin-bottom: 0.9rem;">
            <div>
              <label class="lbl-zen">Nacimiento</label>
              <input type="date" [(ngModel)]="persona.fecha_nacimiento" name="fecha_nacimiento" class="inp-zen" />
            </div>
            <div>
              <label class="lbl-zen">Fallecimiento</label>
              <input type="date" [(ngModel)]="persona.fecha_muerte" name="fecha_muerte" class="inp-zen" />
            </div>
          </div>

          <!-- Lugar de nacimiento -->
          <div style="display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 0.6rem; margin-bottom: 0.9rem;">
            <div>
              <label class="lbl-zen">Ciudad</label>
              <input type="text" [(ngModel)]="ciudad" name="ciudad" class="inp-zen" placeholder="Roma" />
            </div>
            <div>
              <label class="lbl-zen">Región</label>
              <input type="text" [(ngModel)]="distrito" name="distrito" class="inp-zen" placeholder="Lazio" />
            </div>
            <div>
              <label class="lbl-zen">País</label>
              <input type="text" [(ngModel)]="pais" name="pais" class="inp-zen" placeholder="Italia" />
            </div>
          </div>

          <!-- Notas -->
          <div style="margin-bottom: 1.3rem;">
            <label class="lbl-zen">Notas <span style="opacity:0.6; font-size:0.85em;">(opcional)</span></label>
            <textarea [(ngModel)]="persona.notas" name="notas" rows="2"
              class="inp-zen" style="resize: vertical;" placeholder="Datos adicionales, profesión, etc."></textarea>
          </div>

          <!-- Error -->
          <div *ngIf="errorMsg" style="
            margin-bottom: 1rem; padding: 0.6em 1em;
            background: rgba(154,80,70,0.1); border: 1px solid rgba(154,80,70,0.3);
            border-radius: 8px; font-family: 'Georgia', serif;
            font-size: 0.82rem; color: #7a3a30; text-align: center;
          ">{{ errorMsg }}</div>

          <!-- Botones -->
          <div style="display: flex; gap: 0.7rem; flex-direction: column;">

            <!-- Guardar + agregar otra -->
            <button type="submit"
              [disabled]="!persona.nombre.trim() || !persona.apellido.trim() || loading"
              style="
                width: 100%; font-family: 'Georgia', serif; font-size: 0.9rem;
                font-weight: 600; letter-spacing: 0.12em; text-transform: uppercase;
                color: white;
                background: linear-gradient(135deg, #7a8c5a, #5a6a42);
                border: none; padding: 0.8em; border-radius: 12px;
                cursor: pointer; transition: all 0.2s;
                box-shadow: 0 3px 16px rgba(107,124,85,0.3);
              "
              [style.opacity]="(!persona.nombre.trim() || !persona.apellido.trim() || loading) ? '0.5' : '1'"
              onmouseover="if(!this.disabled) this.style.transform='translateY(-1px)'"
              onmouseout="this.style.transform='translateY(0)'">
              {{ loading ? 'Guardando...' : '🌱 Guardar y agregar otra persona' }}
            </button>

            <!-- Ver árbol (solo si hay al menos una persona) -->
            <button *ngIf="personasCargadas.length > 0" type="button"
              (click)="verArbol()"
              style="
                width: 100%; font-family: 'Georgia', serif; font-size: 0.85rem;
                letter-spacing: 0.1em; text-transform: uppercase;
                color: #3b3a36;
                background: rgba(255,255,255,0.6);
                border: 1.5px solid rgba(138,154,106,0.5);
                padding: 0.75em; border-radius: 12px;
                cursor: pointer; transition: all 0.2s;
              "
              onmouseover="this.style.background='rgba(255,255,255,0.85)'"
              onmouseout="this.style.background='rgba(255,255,255,0.6)'">
              🌳 Ver árbol familiar ({{ personasCargadas.length }} persona{{ personasCargadas.length !== 1 ? 's' : '' }})
            </button>

          </div>
        </form>
      </div>
    </div>
  `,
  styles: [`
    @keyframes fadeInUp {
      from { opacity: 0; transform: translateY(20px); }
      to   { opacity: 1; transform: translateY(0); }
    }
    .lbl-zen {
      display: block;
      font-family: 'Georgia', serif;
      font-size: 0.72rem;
      letter-spacing: 0.12em;
      text-transform: uppercase;
      color: #7a7368;
      margin-bottom: 0.35rem;
    }
    .inp-zen {
      width: 100%;
      box-sizing: border-box;
      padding: 0.6em 0.85em;
      font-family: 'Georgia', serif;
      font-size: 0.88rem;
      color: #3b3a36;
      background: rgba(255,255,255,0.75);
      border: 1.5px solid rgba(138,154,106,0.35);
      border-radius: 9px;
      outline: none;
      transition: border-color 0.2s, box-shadow 0.2s;
    }
    .inp-zen:focus {
      border-color: rgba(107,124,85,0.65);
      box-shadow: 0 0 0 3px rgba(138,154,106,0.14);
    }
  `]
})
export class OnboardingComponent implements OnInit {
  private api = inject(ApiService);

  @Input() arbolId: string = '';
  @Input() nombreArbol: string = '';
  @Output() verArbolEvent = new EventEmitter<void>();

  persona: PersonaCreate = this.personaVacia();
  ciudad = '';
  distrito = '';
  pais = '';
  loading = false;
  errorMsg = '';
  personasCargadas: Persona[] = [];

  ngOnInit() {
    // Cargar personas ya existentes de este árbol
    if (this.arbolId) {
      this.api.getPersonas(this.arbolId).subscribe({
        next: (personas) => { this.personasCargadas = personas; },
        error: () => {}
      });
    }
  }

  onSubmit() {
    if (!this.persona.nombre.trim() || !this.persona.apellido.trim()) return;
    this.loading = true;
    this.errorMsg = '';

    const ubicacion = [this.ciudad, this.distrito, this.pais].filter(x => x.trim()).join(', ');
    const payload: PersonaCreate = { ...this.persona, arbol_id: this.arbolId };
    payload.lugar_nacimiento = ubicacion || undefined;
    if (!payload.fecha_nacimiento) delete payload.fecha_nacimiento;
    if (!payload.fecha_muerte) delete payload.fecha_muerte;
    if (!payload.genero) delete payload.genero;

    this.api.createPersona(payload).subscribe({
      next: (res) => {
        this.personasCargadas.push(res);
        this.loading = false;
        // Limpiar formulario para la siguiente persona
        this.persona = this.personaVacia();
        this.ciudad = '';
        this.distrito = '';
        this.pais = '';
      },
      error: (err) => {
        console.error(err);
        this.loading = false;
        this.errorMsg = 'No se pudo guardar. Verificá que el servidor esté activo.';
      }
    });
  }

  verArbol() {
    this.verArbolEvent.emit();
  }

  private personaVacia(): PersonaCreate {
    return { nombre: '', apellido: '', genero: '', fecha_nacimiento: '', fecha_muerte: '', lugar_nacimiento: '', notas: '' };
  }
}
