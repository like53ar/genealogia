import { Component, Input, Output, EventEmitter, OnChanges, SimpleChanges } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Persona } from '../../core/api.service';

interface TimelineItem {
  person: Persona;
  birthYear: number | null;
  deathYear: number | null;
  age: string;
  country: string | null;
}

interface DecadeGroup {
  decadeName: string;
  decadeNum: number;
  items: TimelineItem[];
}

@Component({
  selector: 'app-timeline-dialog',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="timeline-overlay" *ngIf="isOpen">
      <div class="timeline-modal animate-scale-up" (click)="$event.stopPropagation()">
        
        <!-- Header -->
        <div class="timeline-header">
          <div class="header-left">
            <span class="timeline-icon">⏳</span>
            <div>
              <h2 class="timeline-title">Línea de Tiempo Cronológica</h2>
              <p class="timeline-subtitle">Historia y generaciones ordenadas por fecha de nacimiento</p>
            </div>
          </div>
          <button (click)="close()" class="close-btn" title="Cerrar">✕</button>
        </div>

        <!-- Toolbar & Stats -->
        <div class="timeline-toolbar">
          <div class="stats-row">
            <div class="stat-badge">
              <span class="stat-val">{{ allPersons.length }}</span>
              <span class="stat-lbl">Integrantes</span>
            </div>
            <div class="stat-badge" *ngIf="yearSpan">
              <span class="stat-val">{{ yearSpan }}</span>
              <span class="stat-lbl">Historia Registrada</span>
            </div>
            <div class="stat-badge" *ngIf="oldestMember">
              <span class="stat-val">🌱 {{ oldestMember }}</span>
              <span class="stat-lbl">Primer Nacimiento</span>
            </div>
          </div>

          <!-- Buscador -->
          <div class="search-wrap">
            <input
              type="text"
              [(ngModel)]="searchQuery"
              (ngModelChange)="filterTimeline()"
              placeholder="🔍 Buscar familiar en la cronología..."
              class="search-input"
            />
          </div>
        </div>

        <!-- Timeline Content Scrollable -->
        <div class="timeline-body">

          <!-- Empty State -->
          <div *ngIf="filteredGroups.length === 0" class="empty-timeline">
            <span>📜</span>
            <p>No se encontraron integrantes con los criterios de búsqueda.</p>
          </div>

          <!-- Decades Loop -->
          <div class="timeline-stream">
            <div *ngFor="let group of filteredGroups" class="decade-block">
              
              <!-- Decade Header Tag -->
              <div class="decade-tag-wrap">
                <div class="decade-tag">
                  {{ group.decadeName }}
                </div>
                <div class="decade-line"></div>
              </div>

              <!-- Persons in this Decade -->
              <div class="decade-cards-grid">
                <div *ngFor="let item of group.items" class="timeline-person-card">
                  
                  <div class="card-avatar" [class.avatar-male]="item.person.genero === 'M'" [class.avatar-female]="item.person.genero === 'F'">
                    {{ getInitials(item.person.nombre, item.person.apellido) }}
                  </div>

                  <div class="card-info">
                    <div class="person-full-name">
                      {{ item.person.nombre }} {{ item.person.apellido }}
                    </div>

                    <div class="person-meta-row">
                      <span class="meta-dates">
                        📅 {{ item.birthYear ? item.birthYear : 'Fecha desconocida' }}
                        {{ item.deathYear ? ' - ' + item.deathYear : (item.birthYear ? ' - Presente' : '') }}
                      </span>
                      <span class="meta-age" *ngIf="item.age">
                        ({{ item.age }})
                      </span>
                    </div>

                    <div class="person-meta-row" *ngIf="item.country">
                      <span class="meta-place">
                        📍 {{ item.country }}
                      </span>
                    </div>
                  </div>

                  <button (click)="navigateToPerson(item.person)" class="focus-btn" title="Centrar este familiar en el árbol">
                    🎯 Centrar
                  </button>

                </div>
              </div>

            </div>
          </div>

        </div>

      </div>
    </div>
  `,
  styles: [`
    .timeline-overlay {
      position: fixed;
      inset: 0;
      z-index: 90;
      background: rgba(14, 9, 5, 0.75);
      backdrop-filter: blur(8px);
      -webkit-backdrop-filter: blur(8px);
      display: flex;
      align-items: center;
      justify-content: center;
      padding: 1.5rem;
      animation: fadeIn 0.25s ease-out;
    }

    .timeline-modal {
      background: radial-gradient(circle at 50% 20%, rgba(44, 30, 19, 0.96) 0%, rgba(22, 14, 8, 0.98) 100%);
      border: 1.5px solid rgba(212, 175, 120, 0.45);
      border-radius: 24px;
      width: 100%;
      max-width: 820px;
      max-height: 88vh;
      display: flex;
      flex-direction: column;
      box-shadow: 0 20px 60px rgba(0, 0, 0, 0.6);
      overflow: hidden;
    }

    .timeline-header {
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding: 1.25rem 1.75rem;
      background: rgba(30, 20, 12, 0.85);
      border-bottom: 1px solid rgba(212, 175, 120, 0.3);
    }

    .header-left {
      display: flex;
      align-items: center;
      gap: 12px;
    }

    .timeline-icon {
      font-size: 1.8rem;
    }

    .timeline-title {
      font-family: 'Georgia', serif;
      font-size: 1.3rem;
      font-weight: 700;
      color: #F8ECD5;
      margin: 0;
      letter-spacing: 0.05em;
    }

    .timeline-subtitle {
      font-size: 0.82rem;
      color: #D4AF7A;
      margin: 2px 0 0;
    }

    .close-btn {
      background: rgba(255, 255, 255, 0.1);
      border: 1px solid rgba(212, 175, 120, 0.3);
      color: #F8ECD5;
      width: 32px;
      height: 32px;
      border-radius: 50%;
      display: flex;
      align-items: center;
      justify-content: center;
      cursor: pointer;
      font-size: 1rem;
      transition: all 0.2s;
    }

    .close-btn:hover {
      background: rgba(255, 255, 255, 0.2);
      transform: scale(1.05);
    }

    .timeline-toolbar {
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding: 0.9rem 1.75rem;
      background: rgba(36, 24, 15, 0.6);
      border-bottom: 1px solid rgba(212, 175, 120, 0.2);
      gap: 16px;
      flex-wrap: wrap;
    }

    .stats-row {
      display: flex;
      align-items: center;
      gap: 10px;
      flex-wrap: wrap;
    }

    .stat-badge {
      display: flex;
      flex-direction: column;
      background: rgba(55, 38, 24, 0.7);
      border: 1px solid rgba(212, 175, 120, 0.3);
      border-radius: 10px;
      padding: 4px 10px;
    }

    .stat-val {
      font-size: 0.85rem;
      font-weight: 700;
      color: #F8ECD5;
    }

    .stat-lbl {
      font-size: 0.68rem;
      color: #C8A870;
      text-transform: uppercase;
      letter-spacing: 0.04em;
    }

    .search-wrap {
      flex: 1;
      min-width: 220px;
    }

    .search-input {
      width: 100%;
      background: #FAF3E6;
      border: 1.5px solid #C8A265;
      border-radius: 10px;
      padding: 6px 12px;
      font-size: 0.85rem;
      color: #2E1B0E;
      font-family: 'Georgia', serif;
      outline: none;
      box-shadow: 0 1px 4px rgba(0,0,0,0.15);
    }

    .search-input:focus {
      border-color: #D4AF37;
    }

    .timeline-body {
      padding: 1.5rem 1.75rem;
      overflow-y: auto;
      flex: 1;
    }

    .timeline-stream {
      display: flex;
      flex-direction: column;
      gap: 1.75rem;
      position: relative;
    }

    .decade-block {
      display: flex;
      flex-direction: column;
      gap: 10px;
    }

    .decade-tag-wrap {
      display: flex;
      align-items: center;
      gap: 12px;
    }

    .decade-tag {
      font-family: 'Georgia', serif;
      font-size: 0.9rem;
      font-weight: 700;
      color: #2E1A0C;
      background: linear-gradient(135deg, #EAD5A8, #D4AF7A);
      border: 1px solid #F5E6CC;
      border-radius: 20px;
      padding: 3px 14px;
      box-shadow: 0 2px 8px rgba(0,0,0,0.3);
      letter-spacing: 0.06em;
      white-space: nowrap;
    }

    .decade-line {
      flex: 1;
      height: 1px;
      background: linear-gradient(90deg, rgba(212, 175, 120, 0.5), transparent);
    }

    .decade-cards-grid {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(240px, 1fr));
      gap: 12px;
      padding-left: 8px;
    }

    .timeline-person-card {
      display: flex;
      align-items: center;
      gap: 10px;
      background: rgba(45, 30, 18, 0.75);
      border: 1px solid rgba(212, 175, 120, 0.35);
      border-radius: 14px;
      padding: 10px 12px;
      box-shadow: 0 4px 12px rgba(0,0,0,0.25);
      transition: all 0.2s;
    }

    .timeline-person-card:hover {
      background: rgba(58, 39, 24, 0.9);
      border-color: #D4AF37;
      transform: translateY(-2px);
      box-shadow: 0 6px 16px rgba(0,0,0,0.35);
    }

    .card-avatar {
      width: 38px;
      height: 38px;
      border-radius: 50%;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 0.8rem;
      font-weight: 700;
      flex-shrink: 0;
      background: #D4C4A0;
      color: #3B2A10;
      border: 1.5px solid #C8A265;
    }

    .avatar-male {
      background: #CFE0CE;
      color: #2D5230;
      border-color: #79A876;
    }

    .avatar-female {
      background: #EEDCCE;
      color: #6E3B20;
      border-color: #C89A76;
    }

    .card-info {
      flex: 1;
      display: flex;
      flex-direction: column;
      gap: 2px;
      overflow: hidden;
    }

    .person-full-name {
      font-family: 'Georgia', serif;
      font-size: 0.88rem;
      font-weight: 700;
      color: #F8ECD5;
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
    }

    .person-meta-row {
      display: flex;
      align-items: center;
      gap: 6px;
      font-size: 0.74rem;
      color: #D4AF7A;
      flex-wrap: wrap;
    }

    .meta-age {
      color: #A89068;
      font-weight: 600;
    }

    .meta-place {
      color: #E6CEAA;
      background: rgba(212, 175, 120, 0.15);
      border-radius: 4px;
      padding: 1px 5px;
      font-size: 0.7rem;
    }

    .focus-btn {
      background: rgba(212, 175, 120, 0.2);
      border: 1px solid rgba(212, 175, 120, 0.4);
      color: #F8ECD5;
      font-size: 0.72rem;
      padding: 4px 8px;
      border-radius: 8px;
      cursor: pointer;
      transition: all 0.2s;
      white-space: nowrap;
    }

    .focus-btn:hover {
      background: #D4AF37;
      color: #2E1B0E;
      font-weight: 600;
    }

    .empty-timeline {
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      padding: 3rem 1rem;
      color: #C8A870;
      gap: 8px;
      font-size: 1.5rem;
    }

    .empty-timeline p {
      font-size: 0.9rem;
      margin: 0;
    }

    @keyframes fadeIn {
      from { opacity: 0; }
      to { opacity: 1; }
    }

    .animate-scale-up {
      animation: scaleUp 0.25s cubic-bezier(0.16, 1, 0.3, 1) forwards;
    }

    @keyframes scaleUp {
      from { opacity: 0; transform: scale(0.95) translateY(12px); }
      to { opacity: 1; transform: scale(1) translateY(0); }
    }
  `]
})
export class TimelineDialogComponent implements OnChanges {
  @Input() isOpen = false;
  @Input() allPersons: Persona[] = [];

  @Output() closed = new EventEmitter<void>();
  @Output() personSelected = new EventEmitter<Persona>();

  searchQuery = '';
  allGroups: DecadeGroup[] = [];
  filteredGroups: DecadeGroup[] = [];

  yearSpan: string | null = null;
  oldestMember: string | null = null;

  ngOnChanges(changes: SimpleChanges) {
    if (changes['allPersons'] || changes['isOpen']) {
      this.buildTimeline();
    }
  }

  buildTimeline() {
    if (!this.allPersons || this.allPersons.length === 0) {
      this.allGroups = [];
      this.filteredGroups = [];
      this.yearSpan = null;
      this.oldestMember = null;
      return;
    }

    const items: TimelineItem[] = this.allPersons.map(p => {
      let bYear: number | null = null;
      let dYear: number | null = null;
      if (p.fecha_nacimiento) {
        try {
          const yr = new Date(p.fecha_nacimiento + 'T00:00:00').getFullYear();
          if (!isNaN(yr)) bYear = yr;
        } catch { bYear = null; }
      }
      if (p.fecha_fallecimiento) {
        try {
          const yr = new Date(p.fecha_fallecimiento + 'T00:00:00').getFullYear();
          if (!isNaN(yr)) dYear = yr;
        } catch { dYear = null; }
      }

      let age = '';
      if (bYear && dYear) {
        age = `${dYear - bYear} años`;
      } else if (bYear && !dYear) {
        const curr = new Date().getFullYear();
        age = `${curr - bYear} años`;
      }

      let country: string | null = null;
      if (p.lugar_nacimiento && p.lugar_nacimiento.trim()) {
        const parts = p.lugar_nacimiento.split(',').map(s => s.trim()).filter(s => s);
        if (parts.length > 0) country = parts[parts.length - 1];
      }

      return {
        person: p,
        birthYear: bYear,
        deathYear: dYear,
        age,
        country
      };
    });

    // Ordenar por año de nacimiento ascendente
    items.sort((a, b) => {
      if (a.birthYear === null && b.birthYear === null) return a.person.nombre.localeCompare(b.person.nombre);
      if (a.birthYear === null) return 1;
      if (b.birthYear === null) return -1;
      return a.birthYear - b.birthYear;
    });

    // Calcular estadísticas
    const validBirths = items.filter(i => i.birthYear !== null);
    if (validBirths.length > 0) {
      const minYear = validBirths[0].birthYear!;
      const maxYear = new Date().getFullYear();
      this.yearSpan = `${minYear} - ${maxYear} (${maxYear - minYear} años)`;
      this.oldestMember = `${validBirths[0].person.nombre} (${minYear})`;
    } else {
      this.yearSpan = null;
      this.oldestMember = null;
    }

    // Agrupar por décadas
    const groupMap = new Map<number, TimelineItem[]>();
    const noDateItems: TimelineItem[] = [];

    items.forEach(item => {
      if (item.birthYear !== null) {
        const decade = Math.floor(item.birthYear / 10) * 10;
        if (!groupMap.has(decade)) {
          groupMap.set(decade, []);
        }
        groupMap.get(decade)!.push(item);
      } else {
        noDateItems.push(item);
      }
    });

    const groups: DecadeGroup[] = [];
    const sortedDecades = Array.from(groupMap.keys()).sort((a, b) => a - b);

    sortedDecades.forEach(dec => {
      groups.push({
        decadeName: `Década de ${dec}s`,
        decadeNum: dec,
        items: groupMap.get(dec)!
      });
    });

    if (noDateItems.length > 0) {
      groups.push({
        decadeName: 'Sin fecha de nacimiento',
        decadeNum: 9999,
        items: noDateItems
      });
    }

    this.allGroups = groups;
    this.filterTimeline();
  }

  filterTimeline() {
    if (!this.searchQuery || !this.searchQuery.trim()) {
      this.filteredGroups = this.allGroups;
      return;
    }

    const q = this.searchQuery.toLowerCase().trim();
    const result: DecadeGroup[] = [];

    this.allGroups.forEach(grp => {
      const matchingItems = grp.items.filter(item =>
        item.person.nombre.toLowerCase().includes(q) ||
        item.person.apellido.toLowerCase().includes(q) ||
        (item.country && item.country.toLowerCase().includes(q)) ||
        (item.birthYear && item.birthYear.toString().includes(q))
      );
      if (matchingItems.length > 0) {
        result.push({
          decadeName: grp.decadeName,
          decadeNum: grp.decadeNum,
          items: matchingItems
        });
      }
    });

    this.filteredGroups = result;
  }

  getInitials(nombre: string, apellido: string): string {
    return ((nombre ? nombre[0] : '') + (apellido ? apellido[0] : '')).toUpperCase();
  }

  navigateToPerson(person: Persona) {
    this.personSelected.emit(person);
    this.close();
  }

  close() {
    this.isOpen = false;
    this.closed.emit();
  }
}
