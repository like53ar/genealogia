import { Component, Input, Output, EventEmitter, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Persona, PersonaCreate, ApiService } from '../../core/api.service';

@Component({
  selector: 'app-add-relative-dialog',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="fixed inset-0 z-50 flex items-center justify-center bg-zen-text/20 backdrop-blur-sm animate-fade-in" *ngIf="isOpen">
      <div class="bg-zen-surface rounded-3xl shadow-2xl p-8 max-w-md w-full m-4 border border-zen-border relative transform transition-all animate-scale-up">
        
        <button (click)="close()" class="absolute top-4 right-4 text-zen-textMuted hover:text-zen-text transition-colors">
          <svg xmlns="http://www.w3.org/2000/svg" class="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" /></svg>
        </button>

        <h2 class="text-2xl font-light text-zen-text mb-1">Añadir familiar</h2>
        <p class="text-sm text-zen-textMuted mb-6">Agregando {{ getRelativeTypeName() }} de {{ targetPerson?.nombre }}</p>

        <form (ngSubmit)="onSubmit()" #form="ngForm" class="space-y-4">
          <div class="grid grid-cols-2 gap-4">
            <div>
              <label class="block text-xs font-medium text-zen-textMuted mb-1 ml-1">Nombre</label>
              <input type="text" [(ngModel)]="persona.nombre" name="nombre" required class="input-zen" />
            </div>
            <div>
              <label class="block text-xs font-medium text-zen-textMuted mb-1 ml-1">Apellido</label>
              <input type="text" [(ngModel)]="persona.apellido" name="apellido" required class="input-zen" />
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
              <input type="text" [(ngModel)]="ciudad" name="ciudad" class="input-zen text-xs p-2" />
            </div>
            <div>
              <label class="block text-xs font-medium text-zen-textMuted mb-1 ml-1">Distrito</label>
              <input type="text" [(ngModel)]="distrito" name="distrito" class="input-zen text-xs p-2" />
            </div>
            <div>
              <label class="block text-xs font-medium text-zen-textMuted mb-1 ml-1">País</label>
              <input type="text" [(ngModel)]="pais" name="pais" class="input-zen text-xs p-2" />
            </div>
          </div>

          <!-- Fecha de matrimonio — solo para PAREJA -->
          <div *ngIf="relativeType === 'PAREJA'" class="wedding-field">
            <label class="block text-xs font-medium mb-1 ml-1" style="color: #8B6A3E;">
              💍 Fecha de matrimonio
            </label>
            <input
              type="date"
              [(ngModel)]="fechaMatrimonio"
              name="fechaMatrimonio"
              class="input-zen"
              style="border-color: #C9B99A;"
            />
          </div>

          <div class="pt-4 flex gap-3">
            <button type="button" (click)="close()" class="flex-1 btn-zen-secondary py-2">Cancelar</button>
            <button type="submit" [disabled]="!form.valid || loading" class="flex-1 btn-zen py-2">
              {{ loading ? 'Guardando...' : 'Guardar' }}
            </button>
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
    .wedding-field {
      background: #FDF8F0;
      border: 1px solid #E8D9C0;
      border-radius: 12px;
      padding: 12px;
    }
  `]
})
export class AddRelativeDialogComponent {
  @Input() isOpen = false;
  @Input() targetPerson: Persona | null = null;
  @Input() relativeType: 'PADRE' | 'PAREJA' | 'HIJO' = 'PADRE';
  
  @Output() closed = new EventEmitter<void>();
  @Output() saved = new EventEmitter<{
    personaData: PersonaCreate;
    relativeType: 'PADRE' | 'PAREJA' | 'HIJO';
    fechaMatrimonio?: string;
  }>();

  persona: PersonaCreate = { nombre: '', apellido: '', genero: '', fecha_nacimiento: '', fecha_muerte: '', lugar_nacimiento: '', notas: '' };
  ciudad = '';
  distrito = '';
  pais = '';
  fechaMatrimonio = '';
  loading = false;

  getRelativeTypeName() {
    switch (this.relativeType) {
      case 'PADRE': return 'padre o madre';
      case 'PAREJA': return 'una pareja';
      case 'HIJO': return 'un hijo/a';
      default: return 'un familiar';
    }
  }

  close() {
    this.isOpen = false;
    this.closed.emit();
    this.resetForm();
  }

  onSubmit() {
    if (this.persona.nombre && this.persona.apellido && !this.loading) {
      this.loading = true;  // bloquea el botón de inmediato
      const ubicacion = [this.ciudad, this.distrito, this.pais].filter(x => x).join(', ');
      this.persona.lugar_nacimiento = ubicacion;
      
      this.saved.emit({
        personaData: { ...this.persona },
        relativeType: this.relativeType,
        fechaMatrimonio: this.fechaMatrimonio || undefined,
      });
    }
  }

  resetForm() {
    this.persona = { nombre: '', apellido: '', genero: '', fecha_nacimiento: '', fecha_muerte: '', lugar_nacimiento: '', notas: '' };
    this.ciudad = '';
    this.distrito = '';
    this.pais = '';
    this.fechaMatrimonio = '';
    this.loading = false;
  }
}
