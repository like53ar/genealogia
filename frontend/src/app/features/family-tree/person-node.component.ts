import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Persona } from '../../core/api.service';

export type NodeRole = 'root' | 'parent' | 'ancestor' | 'child' | 'partner' | 'sibling';

@Component({
  selector: 'app-person-node',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="flex flex-col items-center node-wrapper" [class.root-node]="role === 'root'">

      <!-- Card -->
      <div
        class="node-card relative flex flex-col items-center cursor-pointer transition-all duration-300"
        [class]="getCardClass()"
        (click)="nodeClick.emit(person)"
      >
        <!-- Top accent bar (only for root) -->
        <div *ngIf="role === 'root'" class="top-accent"></div>

        <!-- Avatar circle -->
        <div class="avatar-circle" [class]="getAvatarClass()">
          {{ getInitials(person.nombre, person.apellido) }}
        </div>

        <!-- Name -->
        <div class="person-name">{{ person.nombre }}</div>
        <div class="person-apellido">{{ person.apellido }}</div>

        <!-- Years -->
        <div class="person-years">
          {{ getBirthYear() }} {{ getDeathYear() ? '- ' + getDeathYear() : (getBirthYear() !== '?' ? '- Presente' : '') }}
        </div>

        <!-- Country / Place of Origin -->
        <div class="person-place" *ngIf="getCountryOrPlace()" [title]="person.lugar_nacimiento || ''">
          <span class="place-icon">📍</span>
          <span class="place-text">{{ getCountryOrPlace() }}</span>
        </div>

        <!-- Kinship badge -->
        <div class="kinship-badge" *ngIf="kinshipLabel" [class]="getKinshipClass()">
          {{ kinshipLabel }}
        </div>
      </div>

      <!-- Action buttons below card — for ALL nodes in ALL generations -->
      <div class="action-buttons">

        <!-- Button +Padre/Madre -->
        <button
          (click)="addAction.emit({person: person, type: 'PADRE', subType: 'PADRE'}); $event.stopPropagation()"
          class="action-btn action-btn-padre"
          title="Añadir Padre o Madre">
          + Padre/Madre
        </button>

        <!-- Button Hermano/a -->
        <button
          (click)="addAction.emit({person: person, type: 'HERMANO', subType: 'HERMANO'}); $event.stopPropagation()"
          class="action-btn action-btn-hermano"
          title="Añadir Hermano o Hermana">
          👫 Hermano/a
        </button>

        <!-- Button Hijo/a -->
        <button
          (click)="addAction.emit({person: person, type: 'HIJO', subType: 'HIJO'}); $event.stopPropagation()"
          class="action-btn action-btn-hijo"
          title="Añadir Hijo o Hija">
          + Hijo/a
        </button>

        <!-- Button Pareja -->
        <button
          (click)="addAction.emit({person: person, type: 'PAREJA', subType: 'PAREJA'}); $event.stopPropagation()"
          class="action-btn action-btn-pareja"
          title="Añadir Pareja / Cónyuge">
          💑 Pareja
        </button>

        <!-- Button Primo/a -->
        <button
          (click)="addAction.emit({person: person, type: 'PRIMO', subType: 'PRIMO'}); $event.stopPropagation()"
          class="action-btn action-btn-primo"
          title="Añadir Primo o Prima">
          🌿 Primo/a
        </button>

      </div>

    </div>
  `,
  styles: [`
    .node-wrapper {
      position: relative;
    }

    /* Card base */
    .node-card {
      width: 108px;
      padding: 8px 6px 6px;
      border-radius: 11px;
      border-width: 1.5px;
      border-style: solid;
      box-shadow: 0 4px 16px rgba(0,0,0,0.35), 0 1px 3px rgba(0,0,0,0.2);
      gap: 2px;
    }

    .node-card:hover {
      transform: translateY(-2px);
      box-shadow: 0 8px 24px rgba(0,0,0,0.45);
    }

    /* Root node: larger and with double border effect */
    .root-node .node-card {
      width: 136px;
      padding: 12px 8px 8px;
      border-radius: 14px;
      border-width: 2px;
      box-shadow: 0 0 0 3px rgba(212, 175, 55, 0.55), 0 8px 28px rgba(0,0,0,0.45);
    }

    /* Top accent bar for root */
    .top-accent {
      position: absolute;
      top: 0;
      left: 50%;
      transform: translateX(-50%);
      width: 36px;
      height: 3px;
      background: #8FA491;
      border-radius: 0 0 3px 3px;
    }

    /* Avatar */
    .avatar-circle {
      width: 32px;
      height: 32px;
      border-radius: 50%;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 11px;
      font-weight: 500;
      margin-bottom: 4px;
      border-width: 1.5px;
      border-style: solid;
    }

    .root-node .avatar-circle {
      width: 42px;
      height: 42px;
      font-size: 14px;
      margin-bottom: 6px;
    }

    /* Text */
    .person-name {
      font-size: 10.5px;
      font-weight: 600;
      color: #334155;
      text-align: center;
      line-height: 1.2;
    }

    .root-node .person-name {
      font-size: 12.5px;
    }

    .person-apellido {
      font-size: 9.5px;
      color: #64748B;
      text-align: center;
      line-height: 1.2;
    }

    .person-years {
      font-size: 9px;
      color: #94A3B8;
      text-align: center;
      margin-top: 2px;
      font-weight: 500;
      letter-spacing: 0.02em;
    }

    /* Country / Place of Origin */
    .person-place {
      font-size: 8px;
      color: #6E4E28;
      background: rgba(235, 218, 192, 0.55);
      border: 1px solid rgba(195, 168, 128, 0.55);
      border-radius: 999px;
      padding: 1px 5px;
      margin-top: 2px;
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 2px;
      max-width: 96%;
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
      font-weight: 600;
      letter-spacing: 0.02em;
    }

    .place-icon {
      font-size: 7.5px;
    }

    .place-text {
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
    }

    .root-node .person-place {
      font-size: 9px;
      padding: 1px 7px;
    }

    /* Kinship badge */
    .kinship-badge {
      margin-top: 3px;
      padding: 1px 6px;
      border-radius: 12px;
      font-size: 8.5px;
      font-weight: 600;
      letter-spacing: 0.03em;
      text-transform: uppercase;
      opacity: 0.9;
    }

    .kinship-ancestor {
      background: #E8F0FF;
      color: #3A5FA0;
      border: 1px solid #BDD0FF;
    }

    .kinship-parent {
      background: #E8F5E9;
      color: #2E6E35;
      border: 1px solid #A8D5AD;
    }

    .kinship-partner {
      background: #FFF3E0;
      color: #8B5E1A;
      border: 1px solid #F5D08A;
    }

    .kinship-child {
      background: #F3E5F5;
      color: #6A2E80;
      border: 1px solid #CFA8E0;
    }

    .kinship-sibling {
      background: #FFF3E6;
      color: #8C531B;
      border: 1px solid #F5D2B0;
    }

    /* Action buttons */
    .action-buttons {
      display: flex;
      gap: 2px;
      margin-top: 5px;
      flex-wrap: wrap;
      justify-content: center;
      max-width: 170px;
    }

    .action-btn {
      padding: 2px 5px;
      background: white;
      border: 1px solid #E2E8F0;
      border-radius: 5px;
      font-size: 9.5px;
      color: #64748B;
      cursor: pointer;
      transition: all 0.2s ease;
      white-space: nowrap;
      box-shadow: 0 1px 2px rgba(0,0,0,0.04);
    }

    .action-btn:hover {
      background: #F8FAFC;
      border-color: #8FA491;
      color: #4A7A50;
    }

    .action-btn-padre {
      border-color: #B0C4DE;
      color: #3B5998;
    }
    .action-btn-padre:hover {
      background: #F0F4F8;
      border-color: #7B96D4;
      color: #1E3A8A;
    }

    .action-btn-pareja {
      border-color: #C9B99A;
      color: #7A6040;
    }
    .action-btn-pareja:hover {
      background: #FDF6EC;
      border-color: #C9A87A;
      color: #7A4F20;
    }

    .action-btn-hermano {
      border-color: #D8C3A5;
      color: #7A5528;
    }
    .action-btn-hermano:hover {
      background: #FDF7F0;
      border-color: #BA8E58;
      color: #5C3A10;
    }

    .action-btn-hijo {
      border-color: #A8C4A2;
      color: #3D6B40;
    }
    .action-btn-hijo:hover {
      background: #F0F7F0;
      border-color: #6FA472;
      color: #2D5230;
    }

    .action-btn-primo {
      border-color: #A3C9A8;
      color: #2E6E3D;
    }
    .action-btn-primo:hover {
      background: #F0F9F2;
      border-color: #6EB279;
      color: #1E502B;
    }

    /* Role-specific card colors */
    .card-ancestor {
      background: #F5EDD8;
      border-color: #C9B99A;
    }
    .card-parent {
      background: #B8D4B2;
      border-color: #7FA87A;
    }
    .card-partner {
      background: #B8D4B2;
      border-color: #7FA87A;
    }
    .card-root {
      background: #F5EDD8;
      border-color: #8FA491;
    }
    .card-child {
      background: #F5EDD8;
      border-color: #C9B99A;
    }
    .card-sibling {
      background: #FDF7EE;
      border-color: #D8B98C;
    }

    /* Avatar colors per role */
    .avatar-ancestor {
      background: #EAD9B8;
      border-color: #C9B99A;
      color: #7A5C35;
    }
    .avatar-parent {
      background: #93C191;
      border-color: #5E9E5A;
      color: #2D5E30;
    }
    .avatar-partner {
      background: #93C191;
      border-color: #5E9E5A;
      color: #2D5E30;
    }
    .avatar-root {
      background: #D4C4A0;
      border-color: #8FA491;
      color: #4D4020;
    }
    .avatar-child {
      background: #EAD9B8;
      border-color: #C9B99A;
      color: #7A5C35;
    }
    .avatar-sibling {
      background: #F4DEBF;
      border-color: #D8B98C;
      color: #7A4F1D;
    }
  `]
})
export class PersonNodeComponent {
  @Input() person!: Persona;
  @Input() role: NodeRole = 'ancestor';
  @Input() kinshipLabel = '';
  @Input() parentCount = 0;

  @Output() nodeClick = new EventEmitter<Persona>();
  @Output() addAction = new EventEmitter<{person: Persona, type: 'PADRE' | 'PAREJA' | 'HIJO' | 'HERMANO' | 'PRIMO', subType: string}>();

  getCardClass(): string {
    return `node-card card-${this.role}`;
  }

  getAvatarClass(): string {
    return `avatar-circle avatar-${this.role}`;
  }

  getKinshipClass(): string {
    if (this.role === 'partner') return 'kinship-badge kinship-partner';
    if (this.role === 'parent') return 'kinship-badge kinship-parent';
    if (this.role === 'ancestor') return 'kinship-badge kinship-ancestor';
    if (this.role === 'child') return 'kinship-badge kinship-child';
    if (this.role === 'sibling') return 'kinship-badge kinship-sibling';
    return 'kinship-badge';
  }

  getInitials(nombre: string, apellido: string): string {
    return (nombre.charAt(0) + apellido.charAt(0)).toUpperCase();
  }

  getBirthYear(): string {
    if (!this.person.fecha_nacimiento) return '?';
    return new Date(this.person.fecha_nacimiento).getFullYear().toString();
  }

  getDeathYear(): string | null {
    if (!this.person.fecha_fallecimiento) return null;
    return new Date(this.person.fecha_fallecimiento).getFullYear().toString();
  }

  getCountryOrPlace(): string | null {
    if (!this.person.lugar_nacimiento || !this.person.lugar_nacimiento.trim()) {
      return null;
    }
    const raw = this.person.lugar_nacimiento.trim();
    const parts = raw.split(',').map(s => s.trim()).filter(s => s);
    if (parts.length === 0) return null;
    return parts[parts.length - 1];
  }
}

