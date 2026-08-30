import { Component, Input, Output, EventEmitter, OnChanges, SimpleChanges } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Persona, PersonaCreate, Relacion } from '../../core/api.service';

@Component({
  selector: 'app-edit-person-dialog',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm animate-fade-in" *ngIf="isOpen">
      <div class="bg-[#FCFBF7] rounded-3xl shadow-2xl p-6 sm:p-7 max-w-xl w-full m-4 border border-[#E5DEC9] relative transform transition-all animate-scale-up max-h-[90vh] flex flex-col">
        
        <!-- Botón Cerrar -->
        <button (click)="close()" class="absolute top-4 right-4 text-[#8C8275] hover:text-[#2C241B] transition-colors p-1 rounded-full hover:bg-black/5">
          <svg xmlns="http://www.w3.org/2000/svg" class="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" /></svg>
        </button>

        <!-- Cabecera -->
        <div class="mb-4">
          <div class="flex items-center gap-2">
            <span class="text-xl">✏️</span>
            <h2 class="text-2xl font-serif font-medium text-[#2C241B]">
              {{ person?.nombre }} {{ person?.apellido }}
            </h2>
          </div>
          <p class="text-xs text-[#7A7062] mt-0.5 font-sans">Edición de datos del cuadro y corrección de relaciones genealógicas.</p>
        </div>

        <!-- Pestañas -->
        <div class="flex border-b border-[#E5DEC9] mb-4 gap-2">
          <button
            type="button"
            (click)="activeTab = 'datos'"
            [class.tab-active]="activeTab === 'datos'"
            class="tab-btn"
          >
            👤 Datos del Cuadro
          </button>
          <button
            type="button"
            (click)="activeTab = 'relaciones'"
            [class.tab-active]="activeTab === 'relaciones'"
            class="tab-btn flex items-center gap-1.5"
          >
            <span>🔗 Relaciones</span>
            <span class="px-1.5 py-0.2 text-[10px] rounded-full font-medium"
                  [ngClass]="activeTab === 'relaciones' ? 'bg-[#D4AF37] text-white' : 'bg-[#ECE5D8] text-[#6E6354]'">
              {{ (parents.length || 0) + (partners.length || 0) + (children.length || 0) }}
            </span>
          </button>
        </div>

        <!-- Contenedor con scroll para los contenidos -->
        <div class="overflow-y-auto pr-1 flex-1 space-y-4 custom-scrollbar">

          <!-- ═════════════════════════════════════════════════════════ -->
          <!-- PESTAÑA 1: DATOS PERSONALES                              -->
          <!-- ═════════════════════════════════════════════════════════ -->
          <div *ngIf="activeTab === 'datos'">
            <form (ngSubmit)="onSubmit()" #form="ngForm" class="space-y-3.5">
              
              <div class="grid grid-cols-2 gap-3">
                <div>
                  <label class="block text-xs font-semibold text-[#5A5042] mb-1 ml-1">Nombre</label>
                  <input type="text" [(ngModel)]="personaForm.nombre" name="nombre" required class="input-zen" placeholder="Nombre" />
                </div>
                <div>
                  <label class="block text-xs font-semibold text-[#5A5042] mb-1 ml-1">Apellido</label>
                  <input type="text" [(ngModel)]="personaForm.apellido" name="apellido" required class="input-zen" placeholder="Apellido" />
                </div>
              </div>

              <div>
                <label class="block text-xs font-semibold text-[#5A5042] mb-1 ml-1">Género</label>
                <select [(ngModel)]="personaForm.genero" name="genero" class="input-zen bg-white">
                  <option value="">Seleccionar género...</option>
                  <option value="M">Masculino (👨)</option>
                  <option value="F">Femenino (👩)</option>
                  <option value="O">Otro (🧑)</option>
                </select>
              </div>

              <div class="grid grid-cols-2 gap-3">
                <div>
                  <label class="block text-xs font-semibold text-[#5A5042] mb-1 ml-1">Fecha de Nacimiento</label>
                  <input type="date" [(ngModel)]="personaForm.fecha_nacimiento" name="fecha_nacimiento" class="input-zen" />
                </div>
                <div>
                  <label class="block text-xs font-semibold text-[#5A5042] mb-1 ml-1">Fecha de Fallecimiento</label>
                  <input type="date" [(ngModel)]="personaForm.fecha_muerte" name="fecha_muerte" class="input-zen" />
                </div>
              </div>

              <div>
                <label class="block text-xs font-semibold text-[#5A5042] mb-1 ml-1">Lugar de Nacimiento / Origen</label>
                <input type="text" [(ngModel)]="personaForm.lugar_nacimiento" name="lugar_nacimiento" class="input-zen" placeholder="Ej: San Juan, Argentina" />
              </div>

              <div>
                <label class="block text-xs font-semibold text-[#5A5042] mb-1 ml-1">Notas / Biografía</label>
                <textarea [(ngModel)]="personaForm.notas" name="notas" rows="2" class="input-zen resize-none text-xs" placeholder="Detalles históricos o anécdotas familiares..."></textarea>
              </div>

              <!-- Botones de Acción -->
              <div class="pt-3 border-t border-[#EAE2D2] flex flex-col gap-2.5">
                <button type="submit" [disabled]="!form.valid || loading" class="w-full btn-zen py-2 font-medium flex items-center justify-center gap-2">
                  <span>💾</span>
                  <span>{{ loading ? 'Guardando...' : 'Guardar Cambios del Cuadro' }}</span>
                </button>
                
                <div class="flex gap-2">
                  <button type="button" (click)="onNavigate()" class="flex-1 btn-zen-secondary py-2 text-xs flex items-center justify-center gap-1.5">
                    <span>🎯</span>
                    <span>Centrar Árbol</span>
                  </button>
                  <button type="button" (click)="onDelete()" class="flex-1 bg-white border border-red-300 text-red-700 rounded-full py-2 text-xs hover:bg-red-50 transition-colors focus:outline-none shadow-sm flex items-center justify-center gap-1.5">
                    <span>🗑️</span>
                    <span>Eliminar Persona</span>
                  </button>
                </div>
              </div>
            </form>
          </div>

          <!-- ═════════════════════════════════════════════════════════ -->
          <!-- PESTAÑA 2: GESTIÓN DE RELACIONES                          -->
          <!-- ═════════════════════════════════════════════════════════ -->
          <div *ngIf="activeTab === 'relaciones'" class="space-y-4">
            
            <!-- ── SECCIÓN PADRES ── -->
            <div class="rel-box bg-[#EEF4FF] border border-[#C2D6FC] rounded-2xl p-3.5">
              <div class="flex items-center justify-between mb-2">
                <div class="text-xs font-bold uppercase tracking-wider text-[#2B5497] flex items-center gap-1.5">
                  <span>👨‍👩‍👦</span>
                  <span>Padres / Progenitores ({{ parents.length }})</span>
                </div>
              </div>

              <!-- Lista de padres actuales -->
              <div *ngIf="parents.length > 0; else noParents" class="space-y-2 mb-3">
                <div *ngFor="let parent of parents" class="flex items-center justify-between bg-white rounded-xl px-3 py-2 border border-[#D0E0FF] shadow-xs">
                  <div class="flex items-center gap-2">
                    <span class="text-base">{{ parent.genero === 'F' ? '👩' : '👨' }}</span>
                    <div>
                      <span class="text-xs font-semibold text-[#1E3A8A] font-serif">{{ parent.nombre }} {{ parent.apellido }}</span>
                      <span class="text-[10px] text-gray-500 block" *ngIf="parent.fecha_nacimiento">Nac. {{ parent.fecha_nacimiento }}</span>
                    </div>
                  </div>
                  <div class="flex items-center gap-1.5">
                    <button type="button" (click)="navigateTo(parent)" class="px-2 py-1 bg-[#EEF4FF] hover:bg-[#DCE8FF] text-[#1E3A8A] text-[11px] rounded-lg transition-colors" title="Centrar árbol en este padre">
                      ↗ Ver
                    </button>
                    <button type="button" (click)="onUnlinkParent(parent)" class="px-2 py-1 bg-red-50 hover:bg-red-100 text-red-600 text-[11px] rounded-lg transition-colors border border-red-200" title="Desvincular relación de padre/hijo">
                      🗑️ Quitar
                    </button>
                  </div>
                </div>
              </div>

              <ng-template #noParents>
                <p class="text-xs text-[#5B7EB8] italic mb-3">No tiene padres vinculados actualmente.</p>
              </ng-template>

              <!-- Formulario para vincular padre existente -->
              <div class="pt-2 border-t border-[#D6E4FF]">
                <label class="block text-[11px] font-medium text-[#2B5497] mb-1">➕ Vincular padre o madre existente:</label>
                <div class="flex gap-2">
                  <select [(ngModel)]="selectedParentIdToLink" class="input-zen text-xs bg-white flex-1 py-1.5">
                    <option value="">— Seleccionar familiar del árbol —</option>
                    <option *ngFor="let p of getAvailablePersonsForParent()" [value]="p.id">
                      {{ p.nombre }} {{ p.apellido }} ({{ p.genero === 'F' ? 'Mujer' : (p.genero === 'M' ? 'Hombre' : 'Persona') }})
                    </option>
                  </select>
                  <button
                    type="button"
                    (click)="onLinkParent()"
                    [disabled]="!selectedParentIdToLink"
                    class="px-3 py-1.5 bg-[#2B5497] hover:bg-[#1E3A8A] disabled:opacity-40 text-white text-xs rounded-xl font-medium transition-colors"
                  >
                    Vincular
                  </button>
                </div>
              </div>
            </div>

            <!-- ── SECCIÓN PAREJAS / CÓNYUGES ── -->
            <div class="rel-box bg-[#FFF7ED] border border-[#FED7AA] rounded-2xl p-3.5">
              <div class="flex items-center justify-between mb-2">
                <div class="text-xs font-bold uppercase tracking-wider text-[#9A4C00] flex items-center gap-1.5">
                  <span>💑</span>
                  <span>Parejas / Cónyuges ({{ partners.length }})</span>
                </div>
              </div>

              <!-- Lista de parejas actuales con edición de fecha de matrimonio -->
              <div *ngIf="partners.length > 0; else noPartners" class="space-y-2.5 mb-3">
                <div *ngFor="let partner of partners" class="bg-white rounded-xl p-3 border border-[#FFEDD5] shadow-xs space-y-2">
                  <div class="flex items-center justify-between">
                    <div class="flex items-center gap-2">
                      <span class="text-base">{{ partner.genero === 'F' ? '👩' : '👨' }}</span>
                      <div>
                        <span class="text-xs font-semibold text-[#7C2D12] font-serif">{{ partner.nombre }} {{ partner.apellido }}</span>
                      </div>
                    </div>
                    <div class="flex items-center gap-1.5">
                      <button type="button" (click)="navigateTo(partner)" class="px-2 py-1 bg-[#FFF7ED] hover:bg-[#FFEDD5] text-[#9A4C00] text-[11px] rounded-lg transition-colors" title="Centrar en esta pareja">
                        ↗ Ver
                      </button>
                      <button type="button" (click)="onUnlinkPartner(partner)" class="px-2 py-1 bg-red-50 hover:bg-red-100 text-red-600 text-[11px] rounded-lg transition-colors border border-red-200" title="Desvincular pareja">
                        🗑️ Quitar
                      </button>
                    </div>
                  </div>

                  <!-- Edición de Fecha de Matrimonio de la relación establecida -->
                  <div class="flex items-center gap-2 pt-2 border-t border-[#FFF1E0]">
                    <label class="text-[11px] font-medium text-[#9A4C00] flex items-center gap-1 shrink-0">
                      <span>💍 Fecha Matrimonio:</span>
                    </label>
                    <input
                      type="date"
                      [(ngModel)]="partnerDates[partner.id]"
                      class="input-zen text-xs bg-[#FCFBF7] py-1 px-2 flex-1 max-w-[150px]"
                      title="Modificar fecha de matrimonio"
                    />
                    <button
                      type="button"
                      (click)="onSaveWeddingDate(partner)"
                      class="px-2.5 py-1 text-white text-[11px] rounded-lg font-medium transition-all shadow-xs shrink-0 flex items-center gap-1"
                      [ngClass]="savedPartnerId === partner.id ? 'bg-green-600 hover:bg-green-700' : 'bg-[#D4AF37] hover:bg-[#B89628]'"
                      title="Guardar fecha de matrimonio">
                      <span>{{ savedPartnerId === partner.id ? '✓ Guardado' : '💾 Guardar Fecha' }}</span>
                    </button>
                  </div>
                </div>
              </div>

              <ng-template #noPartners>
                <p class="text-xs text-[#A86E3B] italic mb-3">No tiene parejas registradas.</p>
              </ng-template>

              <!-- Formulario para vincular pareja existente -->
              <div class="pt-2 border-t border-[#FED7AA] space-y-2">
                <label class="block text-[11px] font-medium text-[#9A4C00]">➕ Vincular pareja existente:</label>
                <div class="flex flex-col sm:flex-row gap-2">
                  <select [(ngModel)]="selectedPartnerIdToLink" class="input-zen text-xs bg-white flex-1 py-1.5">
                    <option value="">— Seleccionar familiar —</option>
                    <option *ngFor="let p of getAvailablePersonsForPartner()" [value]="p.id">
                      {{ p.nombre }} {{ p.apellido }}
                    </option>
                  </select>
                  <input
                    type="date"
                    [(ngModel)]="weddingDateToLink"
                    class="input-zen text-xs bg-white py-1.5 sm:w-36"
                    placeholder="Fecha Matrimonio"
                    title="Fecha de matrimonio (opcional)"
                  />
                  <button
                    type="button"
                    (click)="onLinkPartner()"
                    [disabled]="!selectedPartnerIdToLink"
                    class="px-3 py-1.5 bg-[#9A4C00] hover:bg-[#7C2D12] disabled:opacity-40 text-white text-xs rounded-xl font-medium transition-colors"
                  >
                    Vincular
                  </button>
                </div>
              </div>
            </div>

            <!-- ── SECCIÓN HIJOS ── -->
            <div class="rel-box bg-[#F0FDF4] border border-[#BBF7D0] rounded-2xl p-3.5">
              <div class="flex items-center justify-between mb-2">
                <div class="text-xs font-bold uppercase tracking-wider text-[#166534] flex items-center gap-1.5">
                  <span>👶</span>
                  <span>Hijos / Hijas ({{ children.length }})</span>
                </div>
              </div>

              <!-- Lista de hijos actuales -->
              <div *ngIf="children.length > 0; else noChildren" class="space-y-2 mb-3">
                <div *ngFor="let child of children" class="flex items-center justify-between bg-white rounded-xl px-3 py-2 border border-[#DCFCE7] shadow-xs">
                  <div class="flex items-center gap-2">
                    <span class="text-base">{{ child.genero === 'F' ? '👧' : (child.genero === 'M' ? '👦' : '👶') }}</span>
                    <div>
                      <span class="text-xs font-semibold text-[#166534] font-serif">{{ child.nombre }} {{ child.apellido }}</span>
                      <span class="text-[10px] text-gray-500 block" *ngIf="child.fecha_nacimiento">Nac. {{ child.fecha_nacimiento }}</span>
                    </div>
                  </div>
                  <div class="flex items-center gap-1.5">
                    <button type="button" (click)="navigateTo(child)" class="px-2 py-1 bg-[#F0FDF4] hover:bg-[#DCFCE7] text-[#166534] text-[11px] rounded-lg transition-colors" title="Centrar en este hijo">
                      ↗ Ver
                    </button>
                    <button type="button" (click)="onUnlinkChild(child)" class="px-2 py-1 bg-red-50 hover:bg-red-100 text-red-600 text-[11px] rounded-lg transition-colors border border-red-200" title="Desvincular relación de hijo">
                      🗑️ Quitar
                    </button>
                  </div>
                </div>
              </div>

              <ng-template #noChildren>
                <p class="text-xs text-[#4A855A] italic mb-3">No tiene hijos registrados.</p>
              </ng-template>

              <!-- Formulario para vincular hijo existente -->
              <div class="pt-2 border-t border-[#BBF7D0]">
                <label class="block text-[11px] font-medium text-[#166534] mb-1">➕ Vincular hijo/a existente:</label>
                <div class="flex gap-2">
                  <select [(ngModel)]="selectedChildIdToLink" class="input-zen text-xs bg-white flex-1 py-1.5">
                    <option value="">— Seleccionar familiar del árbol —</option>
                    <option *ngFor="let p of getAvailablePersonsForChild()" [value]="p.id">
                      {{ p.nombre }} {{ p.apellido }}
                    </option>
                  </select>
                  <button
                    type="button"
                    (click)="onLinkChild()"
                    [disabled]="!selectedChildIdToLink"
                    class="px-3 py-1.5 bg-[#166534] hover:bg-[#14532D] disabled:opacity-40 text-white text-xs rounded-xl font-medium transition-colors"
                  >
                    Vincular
                  </button>
                </div>
              </div>
            </div>

            <!-- ── SECCIÓN HERMANOS (Informativa) ── -->
            <div *ngIf="siblings && siblings.length > 0" class="rel-box bg-[#FAF5FF] border border-[#E9D5FF] rounded-2xl p-3.5">
              <div class="text-xs font-bold uppercase tracking-wider text-[#6B21A8] mb-2 flex items-center justify-between">
                <span>👫 Hermanos / Hermanas ({{ siblings.length }})</span>
                <span class="text-[10px] font-normal lowercase text-[#8A49C4]">hijos del mismo padre/madre</span>
              </div>
              <div class="flex flex-wrap gap-1.5">
                <button
                  *ngFor="let sib of siblings"
                  type="button"
                  (click)="navigateTo(sib)"
                  class="inline-flex items-center gap-1 px-2.5 py-1 bg-white border border-[#DDD0F0] text-[#581C87] rounded-full text-xs hover:bg-[#F3E8FF] transition-colors"
                >
                  <span>{{ sib.genero === 'F' ? '👧' : (sib.genero === 'M' ? '👦' : '🧑') }}</span>
                  <span class="font-serif">{{ sib.nombre }} {{ sib.apellido }}</span>
                  <span class="text-[9px] text-[#9333EA]">↗</span>
                </button>
              </div>
            </div>

          </div>

        </div>
      </div>
    </div>
  `,
  styles: [`
    .animate-fade-in { animation: fadeIn 0.25s ease-out forwards; }
    .animate-scale-up { animation: scaleUp 0.25s cubic-bezier(0.16, 1, 0.3, 1) forwards; }
    @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
    @keyframes scaleUp { from { opacity: 0; transform: scale(0.96) translateY(8px); } to { opacity: 1; transform: scale(1) translateY(0); } }
    
    .tab-btn {
      padding: 0.5rem 1rem;
      font-size: 0.85rem;
      font-weight: 500;
      color: #7A7062;
      border-bottom: 2px solid transparent;
      transition: all 0.2s ease;
      cursor: pointer;
      background: transparent;
      border-top: none;
      border-left: none;
      border-right: none;
    }
    .tab-btn:hover {
      color: #2C241B;
    }
    .tab-active {
      color: #9C5B1C;
      font-weight: 700;
      border-bottom: 2.5px solid #9C5B1C;
    }

    .custom-scrollbar::-webkit-scrollbar {
      width: 5px;
    }
    .custom-scrollbar::-webkit-scrollbar-track {
      background: transparent;
    }
    .custom-scrollbar::-webkit-scrollbar-thumb {
      background: #D9D2C3;
      border-radius: 4px;
    }
    .custom-scrollbar::-webkit-scrollbar-thumb:hover {
      background: #B8B09F;
    }
  `]
})
export class EditPersonDialogComponent implements OnChanges {
  @Input() isOpen = false;
  @Input() person: Persona | null = null;
  @Input() parents: Persona[] = [];
  @Input() partners: Persona[] = [];
  @Input() children: Persona[] = [];
  @Input() siblings: Persona[] = [];
  @Input() allPersons: Persona[] = [];
  @Input() allRelations: Relacion[] = [];
  
  @Output() closed = new EventEmitter<void>();
  @Output() saved = new EventEmitter<PersonaCreate>();
  @Output() deleted = new EventEmitter<Persona>();
  @Output() navigate = new EventEmitter<Persona>();

  @Output() unlinkParent = new EventEmitter<{person: Persona, parent: Persona}>();
  @Output() unlinkPartner = new EventEmitter<{person: Persona, partner: Persona}>();
  @Output() unlinkChild = new EventEmitter<{person: Persona, child: Persona}>();

  @Output() linkParent = new EventEmitter<{person: Persona, parentId: string}>();
  @Output() linkPartner = new EventEmitter<{person: Persona, partnerId: string, weddingDate?: string}>();
  @Output() linkChild = new EventEmitter<{person: Persona, childId: string}>();

  @Output() updateWeddingDate = new EventEmitter<{person: Persona, partner: Persona, weddingDate: string}>();

  activeTab: 'datos' | 'relaciones' = 'datos';

  personaForm: PersonaCreate = { nombre: '', apellido: '', genero: '', fecha_nacimiento: '', fecha_muerte: '', lugar_nacimiento: '', notas: '' };
  loading = false;

  partnerDates: { [partnerId: string]: string } = {};

  selectedParentIdToLink = '';
  selectedPartnerIdToLink = '';
  weddingDateToLink = '';
  selectedChildIdToLink = '';

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
      this.resetSelectionFields();
    }
    if (changes['partners'] || changes['allRelations'] || changes['person']) {
      this.populatePartnerDates();
    }
  }

  populatePartnerDates() {
    this.partnerDates = {};
    if (!this.person || !this.partners) return;
    const normalize = (id?: string) => id ? id.replace(/-/g, '').toLowerCase() : '';
    const currentId = normalize(this.person.id);

    for (const p of this.partners) {
      const pId = normalize(p.id);
      const rel = this.allRelations.find(r => 
        r.tipo_relacion === 'PAREJA' && 
        ((normalize(r.persona_1_id) === currentId && normalize(r.persona_2_id) === pId) ||
         (normalize(r.persona_1_id) === pId && normalize(r.persona_2_id) === currentId))
      );
      this.partnerDates[p.id] = rel?.fecha_inicio || '';
    }
  }

  savedPartnerId: string | null = null;

  onSaveWeddingDate(partner: Persona) {
    if (!this.person) return;
    const date = this.partnerDates[partner.id] || '';
    this.savedPartnerId = partner.id;
    setTimeout(() => {
      if (this.savedPartnerId === partner.id) {
        this.savedPartnerId = null;
      }
    }, 2500);
    this.updateWeddingDate.emit({
      person: this.person,
      partner,
      weddingDate: date
    });
  }

  resetSelectionFields() {
    this.selectedParentIdToLink = '';
    this.selectedPartnerIdToLink = '';
    this.weddingDateToLink = '';
    this.selectedChildIdToLink = '';
  }

  close() {
    this.isOpen = false;
    this.resetSelectionFields();
    this.closed.emit();
  }

  onSubmit() {
    if (this.personaForm.nombre && this.personaForm.apellido) {
      const payload = { ...this.personaForm };
      this.saved.emit(payload);
    }
  }

  onDelete() {
    if (this.person && confirm(`¿Estás seguro de que deseas eliminar a ${this.person.nombre} ${this.person.apellido} y todas sus relaciones?`)) {
      this.deleted.emit(this.person);
    }
  }

  onNavigate() {
    if (this.person) {
      this.navigate.emit(this.person);
    }
  }

  navigateTo(target: Persona) {
    this.navigate.emit(target);
  }

  // ── Filtros para dropdowns de vinculación ──

  getAvailablePersonsForParent(): Persona[] {
    if (!this.person) return [];
    const parentIds = new Set(this.parents.map(p => p.id));
    const childIds = new Set(this.children.map(c => c.id));
    return this.allPersons.filter(p => 
      p.id !== this.person?.id && 
      !parentIds.has(p.id) &&
      !childIds.has(p.id)
    );
  }

  getAvailablePersonsForPartner(): Persona[] {
    if (!this.person) return [];
    const partnerIds = new Set(this.partners.map(p => p.id));
    const parentIds = new Set(this.parents.map(p => p.id));
    const childIds = new Set(this.children.map(c => c.id));
    return this.allPersons.filter(p => 
      p.id !== this.person?.id && 
      !partnerIds.has(p.id) &&
      !parentIds.has(p.id) &&
      !childIds.has(p.id)
    );
  }

  getAvailablePersonsForChild(): Persona[] {
    if (!this.person) return [];
    const childIds = new Set(this.children.map(c => c.id));
    const parentIds = new Set(this.parents.map(p => p.id));
    return this.allPersons.filter(p => 
      p.id !== this.person?.id && 
      !childIds.has(p.id) &&
      !parentIds.has(p.id)
    );
  }

  // ── Emisión de eventos de vinculación / desvinculación ──

  onUnlinkParent(parent: Persona) {
    if (!this.person) return;
    if (confirm(`¿Desvincular a ${parent.nombre} ${parent.apellido} como progenitor de ${this.person.nombre}?`)) {
      this.unlinkParent.emit({ person: this.person, parent });
    }
  }

  onUnlinkPartner(partner: Persona) {
    if (!this.person) return;
    if (confirm(`¿Desvincular la relación de pareja entre ${this.person.nombre} y ${partner.nombre}?`)) {
      this.unlinkPartner.emit({ person: this.person, partner });
    }
  }

  onUnlinkChild(child: Persona) {
    if (!this.person) return;
    if (confirm(`¿Desvincular a ${child.nombre} ${child.apellido} como hijo/a de ${this.person.nombre}?`)) {
      this.unlinkChild.emit({ person: this.person, child });
    }
  }

  onLinkParent() {
    if (!this.person || !this.selectedParentIdToLink) return;
    this.linkParent.emit({ person: this.person, parentId: this.selectedParentIdToLink });
    this.selectedParentIdToLink = '';
  }

  onLinkPartner() {
    if (!this.person || !this.selectedPartnerIdToLink) return;
    this.linkPartner.emit({
      person: this.person,
      partnerId: this.selectedPartnerIdToLink,
      weddingDate: this.weddingDateToLink || undefined
    });
    this.selectedPartnerIdToLink = '';
    this.weddingDateToLink = '';
  }

  onLinkChild() {
    if (!this.person || !this.selectedChildIdToLink) return;
    this.linkChild.emit({ person: this.person, childId: this.selectedChildIdToLink });
    this.selectedChildIdToLink = '';
  }
}
