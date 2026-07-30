import { Component, inject, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ApiService, PersonaCreate, Persona } from '../../core/api.service';

@Component({
  selector: 'app-onboarding',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="flex flex-col items-center justify-center min-h-[80vh] w-full px-4 animate-fade-in-up">
      <div class="max-w-md w-full bg-zen-surface rounded-3xl shadow-zen p-8 border border-zen-border/50">
        <div class="text-center mb-8">
          <h1 class="text-3xl font-light text-zen-text mb-2">Comienza tu viaje</h1>
          <p class="text-zen-textMuted text-sm">Ingresa los datos de la primera persona para iniciar el árbol genealógico.</p>
        </div>

        <form (ngSubmit)="onSubmit()" #form="ngForm" class="space-y-5">
          <div class="grid grid-cols-2 gap-4">
            <div>
              <label class="block text-xs font-medium text-zen-textMuted mb-1 ml-1">Nombre</label>
              <input type="text" [(ngModel)]="persona.nombre" name="nombre" required class="input-zen" placeholder="Ej. Leonidas" />
            </div>
            <div>
              <label class="block text-xs font-medium text-zen-textMuted mb-1 ml-1">Apellido</label>
              <input type="text" [(ngModel)]="persona.apellido" name="apellido" required class="input-zen" placeholder="Ej. Antonucci" />
            </div>
          </div>

          <div>
            <label class="block text-xs font-medium text-zen-textMuted mb-1 ml-1">Género</label>
            <select [(ngModel)]="persona.genero" name="genero" class="input-zen bg-white">
              <option value="">Seleccionar...</option>
              <option value="M">Masculino</option>
              <option value="F">Femenino</option>
              <option value="O">Otro</option>
            </select>
          </div>

          <div class="grid grid-cols-2 gap-4">
            <div>
              <label class="block text-xs font-medium text-zen-textMuted mb-1 ml-1">Nacimiento</label>
              <input type="date" [(ngModel)]="persona.fecha_nacimiento" name="fecha_nacimiento" class="input-zen" />
            </div>
            <div>
              <label class="block text-xs font-medium text-zen-textMuted mb-1 ml-1">Fallecimiento</label>
              <input type="date" [(ngModel)]="persona.fecha_muerte" name="fecha_muerte" class="input-zen" />
            </div>
          </div>

          <div class="grid grid-cols-3 gap-2">
            <div>
              <label class="block text-xs font-medium text-zen-textMuted mb-1 ml-1">Ciudad</label>
              <input type="text" [(ngModel)]="ciudad" name="ciudad" class="input-zen text-sm" placeholder="Macerata" />
            </div>
            <div>
              <label class="block text-xs font-medium text-zen-textMuted mb-1 ml-1">Distrito/Región</label>
              <input type="text" [(ngModel)]="distrito" name="distrito" class="input-zen text-sm" placeholder="Marche" />
            </div>
            <div>
              <label class="block text-xs font-medium text-zen-textMuted mb-1 ml-1">País</label>
              <input type="text" [(ngModel)]="pais" name="pais" class="input-zen text-sm" placeholder="Italia" />
            </div>
          </div>

          <div class="pt-4">
            <button type="submit" [disabled]="!form.valid || loading" class="w-full btn-zen py-3 flex justify-center items-center gap-2">
              <ng-container *ngIf="!loading">
                Plantar la semilla
              </ng-container>
              <ng-container *ngIf="loading">
                <svg class="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
                  <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                Creando...
              </ng-container>
            </button>
          </div>
        </form>
      </div>
    </div>
  `,
  styles: [`
    .animate-fade-in-up {
      animation: fadeInUp 0.6s cubic-bezier(0.16, 1, 0.3, 1) forwards;
      opacity: 0;
      transform: translateY(20px);
    }
    @keyframes fadeInUp {
      to {
        opacity: 1;
        transform: translateY(0);
      }
    }
  `]
})
export class OnboardingComponent {
  private api = inject(ApiService);
  
  @Output() personaCreated = new EventEmitter<Persona>();

  persona: PersonaCreate = {
    nombre: '',
    apellido: '',
    genero: '',
    fecha_nacimiento: '',
    fecha_muerte: '',
    lugar_nacimiento: '',
    notas: ''
  };

  ciudad = '';
  distrito = '';
  pais = '';

  loading = false;

  onSubmit() {
    if (this.persona.nombre && this.persona.apellido) {
      this.loading = true;
      
      // Concatenate location fields
      const ubicacion = [this.ciudad, this.distrito, this.pais].filter(x => x).join(', ');
      
      // Convert empty strings for dates to undefined so API doesn't fail parsing empty date string
      const payload = { ...this.persona };
      payload.lugar_nacimiento = ubicacion;
      
      if (!payload.fecha_nacimiento) delete payload.fecha_nacimiento;
      if (!payload.fecha_muerte) delete payload.fecha_muerte;
      if (!payload.genero) delete payload.genero;
      if (!payload.lugar_nacimiento) delete payload.lugar_nacimiento;

      this.api.createPersona(payload).subscribe({
        next: (res) => {
          this.loading = false;
          this.personaCreated.emit(res);
        },
        error: (err) => {
          console.error(err);
          this.loading = false;
          alert('Hubo un error al crear la persona. Revisa la consola.');
        }
      });
    }
  }
}
