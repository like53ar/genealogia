import { Component, Input, Output, EventEmitter, OnChanges, SimpleChanges } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Persona, PersonaCreate } from '../../core/api.service';

@Component({
  selector: 'app-edit-person-dialog',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="fixed inset-0 z-50 flex items-center justify-center bg-zen-text/20 backdrop-blur-sm animate-fade-in" *ngIf="isOpen">
      <div class="bg-zen-surface rounded-3xl shadow-2xl p-8 max-w-md w-full m-4 border border-zen-border relative transform transition-all animate-scale-up">
        
        <button (click)="close()" class="absolute top-4 right-4 text-zen-textMuted hover:text-zen-text transition-colors">
          <svg xmlns="http://www.w3.org/2000/svg" class="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" /></svg>
        </button>

        <h2 class="text-2xl font-light text-zen-text mb-1">Editar persona</h2>
        <p class="text-sm text-zen-textMuted mb-6">Actualiza los datos o navega por el árbol.</p>

        <!-- Sección Padres -->
        <div *ngIf="parents && parents.length > 0" style="
          margin-bottom: 1.25rem;
          background: rgba(232,240,255,0.55);
          border: 1px solid rgba(180,200,240,0.5);
          border-radius: 14px;
          padding: 0.75rem 1rem;
        ">
          <div style="
            font-size: 0.7rem;
            font-weight: 600;
            letter-spacing: 0.1em;
            text-transform: uppercase;
            color: #3A5FA0;
            margin-bottom: 0.5rem;
          ">👨‍👩‍👦 Padres</div>
          <div style="display: flex; flex-wrap: wrap; gap: 0.5rem;">
            <button
              *ngFor="let parent of parents"
              type="button"
              (click)="navigateTo(parent)"
              style="
                display: inline-flex; align-items: center; gap: 0.35rem;
                padding: 0.3rem 0.8rem;
                background: white;
                border: 1.5px solid rgba(100,140,210,0.4);
                border-radius: 999px;
                font-size: 0.82rem;
                color: #2E4A80;
                cursor: pointer;
                transition: all 0.18s;
                font-family: 'Georgia', serif;
                box-shadow: 0 1px 4px rgba(60,100,200,0.08);
              "
              onmouseover="this.style.background='rgba(220,230,255,0.7)'; this.style.borderColor='rgba(100,140,210,0.8)'"
              onmouseout="this.style.background='white'; this.style.borderColor='rgba(100,140,210,0.4)'"
            >
              <span style="font-size: 0.75rem;">{{ parent.genero === 'F' ? '👩' : '👨' }}</span>
              {{ parent.nombre }} {{ parent.apellido }}
              <span style="font-size: 0.65rem; color: #7A9AD0; margin-left: 2px;">↗</span>
            </button>
          </div>
        </div>

        <form (ngSubmit)="onSubmit()" #form="ngForm" class="space-y-4">
          <div class="grid grid-cols-2 gap-4">
            <div>
              <label class="block text-xs font-medium text-zen-textMuted mb-1 ml-1">Nombre</label>
              <input type="text" [(ngModel)]="personaForm.nombre" name="nombre" required class="input-zen" />
            </div>
            <div>
              <label class="block text-xs font-medium text-zen-textMuted mb-1 ml-1">Apellido</label>
              <input type="text" [(ngModel)]="personaForm.apellido" name="apellido" required class="input-zen" />
            </div>
          </div>

          <div>
            <label class="block text-xs font-medium text-zen-textMuted mb-1 ml-1">Género</label>
            <select [(ngModel)]="personaForm.genero" name="genero" class="input-zen bg-white">
              <option value="">Seleccionar...</option>
              <option value="M">Masculino</option>
              <option value="F">Femenino</option>
              <option value="O">Otro</option>
            </select>
          </div>

          <div class="grid grid-cols-2 gap-4">
            <div>
              <label class="block text-xs font-medium text-zen-textMuted mb-1 ml-1">Nacimiento</label>
              <input type="date" [(ngModel)]="personaForm.fecha_nacimiento" name="fecha_nacimiento" class="input-zen" />
            </div>
            <div>
              <label class="block text-xs font-medium text-zen-textMuted mb-1 ml-1">Fallecimiento</label>
              <input type="date" [(ngModel)]="personaForm.fecha_muerte" name="fecha_muerte" class="input-zen" />
            </div>
          </div>

          <div>
            <label class="block text-xs font-medium text-zen-textMuted mb-1 ml-1">Lugar de Nacimiento</label>
            <input type="text" [(ngModel)]="personaForm.lugar_nacimiento" name="lugar_nacimiento" class="input-zen" placeholder="Ciudad, País" />
          </div>

          <div class="pt-4 flex flex-col gap-3">
            <button type="submit" [disabled]="!form.valid || loading" class="w-full btn-zen py-2">
              {{ loading ? 'Guardando...' : 'Guardar Cambios' }}
            </button>
            <div class="flex gap-3">
              <button type="button" (click)="onNavigate()" class="flex-1 btn-zen-secondary py-2">Centrar Árbol</button>
              <button type="button" (click)="onDelete()" class="flex-1 bg-white border border-zen-danger text-zen-danger rounded-full py-2 hover:bg-zen-danger hover:text-white transition-colors focus:outline-none focus:ring-2 focus:ring-zen-danger shadow-sm">Eliminar</button>
            </div>
          </div>
        </form>
      </div>
    </div>
  `,
  styles: [`
    .animate-fade-in { animation: fadeIn 0.3s ease-out forwards; }
    .animate-scale-up { animation: scaleUp 0.3s cubic-bezier(0.16, 1, 0.3, 1) forwards; }
    @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
    @keyframes scaleUp { from { opacity: 0; transform: scale(0.95) translateY(10px); } to { opacity: 1; transform: scale(1) translateY(0); } }
  `]
})
export class EditPersonDialogComponent implements OnChanges {
  @Input() isOpen = false;
  @Input() person: Persona | null = null;
  @Input() parents: Persona[] = [];
  
  @Output() closed = new EventEmitter<void>();
  @Output() saved = new EventEmitter<PersonaCreate>();
  @Output() deleted = new EventEmitter<Persona>();
  @Output() navigate = new EventEmitter<Persona>();

  personaForm: PersonaCreate = { nombre: '', apellido: '', genero: '', fecha_nacimiento: '', fecha_muerte: '', lugar_nacimiento: '', notas: '' };
  loading = false;

  ngOnChanges(changes: SimpleChanges) {
    if (changes['person'] && this.person) {
      this.personaForm = {
        nombre: this.person.nombre || '',
        apellido: this.person.apellido || '',
        genero: this.person.genero || '',
        fecha_nacimiento: this.person.fecha_nacimiento || '',
        fecha_muerte: this.person.fecha_fallecimiento || '',
        lugar_nacimiento: this.person.lugar_nacimiento || '',
        notas: this.person.notas || ''
      };
    }
  }

  close() {
    this.isOpen = false;
    this.closed.emit();
  }

  onSubmit() {
    if (this.personaForm.nombre && this.personaForm.apellido) {
      const payload = { ...this.personaForm };
      this.saved.emit(payload);
    }
  }

  onDelete() {
    if (this.person && confirm('¿Estás seguro de que deseas eliminar esta persona y todas sus relaciones?')) {
      this.deleted.emit(this.person);
    }
  }

  onNavigate() {
    if (this.person) {
      this.navigate.emit(this.person);
    }
  }

  navigateTo(parent: Persona) {
    this.navigate.emit(parent);
  }
}
