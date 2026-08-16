import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Persona, PersonaCreate } from '../../core/api.service';

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
        <p class="text-sm text-zen-textMuted mb-6">
          <ng-container *ngIf="targetPerson; else primeraPersona">
            Agregando {{ getRelativeTypeName() }} de {{ targetPerson.nombre }}
          </ng-container>
          <ng-template #primeraPersona>
            Agregando la primera persona del árbol familiar
          </ng-template>
        </p>

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

          <!-- Mensaje contextual para HERMANO -->
          <div *ngIf="relativeType === 'HERMANO'" class="sibling-field">
            <label class="block text-xs font-medium mb-1 ml-1" style="color: #7A5528;">
              👫 Vínculo de hermandad
            </label>
            <p class="text-xs ml-1" style="color: #6E4215;" *ngIf="targetParents.length > 0">
              Se registrará compartiendo los padres de <strong>{{ targetPerson?.nombre }}</strong>:
              <span *ngFor="let p of targetParents; let isLast = last">
                {{ p.nombre }} {{ p.apellido }}{{ isLast ? '' : ', ' }}
              </span>.
            </p>
            <p class="text-xs ml-1" style="color: #7A5528;" *ngIf="targetParents.length === 0">
              Como <strong>{{ targetPerson?.nombre }}</strong> aún no tiene padres registrados, se creará un progenitor común para asociar a ambos hermanos.
            </p>
          </div>

          <!-- Mensaje contextual para PRIMO/A -->
          <div *ngIf="relativeType === 'PRIMO'" class="cousin-field">
            <label class="block text-xs font-medium mb-1 ml-1" style="color: #2E6E3D;">
              🌿 Vínculo de primos (hijo/a de un Tío/Tía)
            </label>
            <div *ngIf="availableUncles.length > 0" class="mb-2">
              <label class="block text-xs text-zen-textMuted mb-1 ml-1">Seleccionar Tío/Tía existente como progenitor:</label>
              <select [(ngModel)]="selectedUncleId" name="uncleId" class="input-zen bg-white text-xs" style="border-color: #A3C9A8;">
                <option value="">— Crear nuevo Tío/Tía como progenitor —</option>
                <option *ngFor="let u of availableUncles" [value]="u.id">
                  {{ u.nombre }} {{ u.apellido }} (Tío/a de {{ targetPerson?.nombre }})
                </option>
              </select>
            </div>
            <div *ngIf="!selectedUncleId">
              <label class="block text-xs text-zen-textMuted mb-1 ml-1">Nombre del Tío/Tía (padre o madre del primo):</label>
              <input
                type="text"
                [(ngModel)]="nuevoTioNombre"
                name="nuevoTioNombre"
                placeholder="Ej: Tío Carlos"
                class="input-zen text-xs"
                style="border-color: #A3C9A8;"
              />
            </div>
          </div>

          <!-- Selector de otro progenitor — solo para HIJO y cuando hay parejas disponibles -->
          <div *ngIf="relativeType === 'HIJO' && availablePartners.length > 0" class="other-parent-field">
            <label class="block text-xs font-medium mb-1 ml-1" style="color: #5a7a8a;">
              👩‍👦 Madre / Otro progenitor
            </label>
            <select
              [(ngModel)]="selectedOtherParentId"
              name="otherParentId"
              class="input-zen bg-white"
              style="border-color: #9ab8c4;"
            >
              <option value="">— Sin especificar —</option>
              <option *ngFor="let partner of availablePartners" [value]="partner.id">
                {{ partner.nombre }} {{ partner.apellido }}
                <ng-container *ngIf="partner.genero === 'M'"> (Padre)</ng-container>
                <ng-container *ngIf="partner.genero === 'F'"> (Madre)</ng-container>
              </option>
            </select>
            <p class="text-xs mt-1 ml-1" style="color: #8a9ea8;">
              La línea del árbol saldrá del centro de la unión de la pareja.
            </p>
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
    .sibling-field {
      background: #FDF7F0;
      border: 1px solid #E6D2BC;
      border-radius: 12px;
      padding: 12px;
    }
    .cousin-field {
      background: #F2FAF4;
      border: 1px solid #C4E2CB;
      border-radius: 12px;
      padding: 12px;
    }
    .other-parent-field {
      background: #F0F6F8;
      border: 1px solid #C0D8E0;
      border-radius: 12px;
      padding: 12px;
    }
  `]
})
export class AddRelativeDialogComponent {
  @Input() isOpen = false;
  @Input() targetPerson: Persona | null = null;
  @Input() relativeType: 'PADRE' | 'PAREJA' | 'HIJO' | 'HERMANO' | 'PRIMO' = 'PADRE';
  @Input() availablePartners: Persona[] = [];
  @Input() targetParents: Persona[] = [];
  @Input() availableUncles: Persona[] = [];
  
  @Output() closed = new EventEmitter<void>();
  @Output() saved = new EventEmitter<{
    personaData: PersonaCreate;
    relativeType: 'PADRE' | 'PAREJA' | 'HIJO' | 'HERMANO' | 'PRIMO';
    fechaMatrimonio?: string;
    otherParentId?: string;
    selectedUncleId?: string;
    nuevoTioNombre?: string;
  }>();

  persona: PersonaCreate = { nombre: '', apellido: '', genero: '', fecha_nacimiento: '', fecha_muerte: '', lugar_nacimiento: '', notas: '' };
  ciudad = '';
  distrito = '';
  pais = '';
  fechaMatrimonio = '';
  selectedOtherParentId = '';
  selectedUncleId = '';
  nuevoTioNombre = '';
  loading = false;

  getRelativeTypeName() {
    switch (this.relativeType) {
      case 'PADRE': return 'padre o madre';
      case 'PAREJA': return 'una pareja';
      case 'HIJO': return 'un hijo/a';
      case 'HERMANO': return 'un hermano/a';
      case 'PRIMO': return 'un primo/a';
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
      this.loading = true;
      const ubicacion = [this.ciudad, this.distrito, this.pais].filter(x => x).join(', ');
      this.persona.lugar_nacimiento = ubicacion;
      
      this.saved.emit({
        personaData: { ...this.persona },
        relativeType: this.relativeType,
        fechaMatrimonio: this.fechaMatrimonio || undefined,
        otherParentId: this.selectedOtherParentId || undefined,
        selectedUncleId: this.selectedUncleId || undefined,
        nuevoTioNombre: this.nuevoTioNombre || undefined,
      });
    }
  }

  resetForm() {
    this.persona = { nombre: '', apellido: '', genero: '', fecha_nacimiento: '', fecha_muerte: '', lugar_nacimiento: '', notas: '' };
    this.ciudad = '';
    this.distrito = '';
    this.pais = '';
    this.fechaMatrimonio = '';
    this.selectedOtherParentId = '';
    this.selectedUncleId = '';
    this.nuevoTioNombre = '';
    this.loading = false;
  }
}
