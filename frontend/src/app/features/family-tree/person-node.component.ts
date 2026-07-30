import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Persona } from '../../core/api.service';

export type NodeRole = 'root' | 'parent' | 'ancestor' | 'child' | 'partner';

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
          {{ getBirthYear() }} {{ getDeathYear() ? '- ' + getDeathYear() : (getBirthYear() ? '- Presente' : '') }}
        </div>
      </div>

      <!-- Action buttons below card -->
      <div class="action-buttons">
        <button
          (click)="addAction.emit({person: person, type: 'PADRE', subType: 'PADRE'}); $event.stopPropagation()"
          class="action-btn"
          title="Añadir Padre">
          + Padre
        </button>
        <button
          (click)="addAction.emit({person: person, type: 'PADRE', subType: 'MADRE'}); $event.stopPropagation()"
          class="action-btn"
          title="Añadir Madre">
          + Madre
        </button>
        <button
          (click)="addAction.emit({person: person, type: 'HIJO', subType: 'HIJO'}); $event.stopPropagation()"
          class="action-btn"
          title="Añadir Hijo/a">
          + Hijo/a
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
      width: 160px;
      padding: 20px 16px 16px;
      border-radius: 16px;
      border-width: 1.5px;
      border-style: solid;
      box-shadow: 0 4px 16px -2px rgba(0,0,0,0.08);
      gap: 4px;
    }

    .node-card:hover {
      transform: translateY(-3px);
      box-shadow: 0 10px 24px -4px rgba(0,0,0,0.12);
    }

    /* Root node: larger and with double border effect */
    .root-node .node-card {
      width: 200px;
      padding: 24px 20px 20px;
      border-radius: 20px;
      border-width: 2px;
      box-shadow: 0 0 0 4px rgba(143,164,145,0.2), 0 6px 20px -2px rgba(0,0,0,0.1);
    }

    /* Top accent bar for root */
    .top-accent {
      position: absolute;
      top: 0;
      left: 50%;
      transform: translateX(-50%);
      width: 48px;
      height: 4px;
      background: #8FA491;
      border-radius: 0 0 4px 4px;
    }

    /* Avatar */
    .avatar-circle {
      width: 52px;
      height: 52px;
      border-radius: 50%;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 17px;
      font-weight: 500;
      margin-bottom: 10px;
      border-width: 1.5px;
      border-style: solid;
    }

    .root-node .avatar-circle {
      width: 64px;
      height: 64px;
      font-size: 20px;
      margin-bottom: 12px;
    }

    /* Text */
    .person-name {
      font-size: 15px;
      font-weight: 600;
      color: #334155;
      text-align: center;
      line-height: 1.3;
    }

    .root-node .person-name {
      font-size: 18px;
    }

    .person-apellido {
      font-size: 13px;
      color: #64748B;
      text-align: center;
      line-height: 1.3;
    }

    .person-years {
      font-size: 11px;
      color: #94A3B8;
      text-align: center;
      margin-top: 4px;
      font-weight: 500;
      letter-spacing: 0.02em;
    }

    /* Action buttons */
    .action-buttons {
      display: flex;
      gap: 4px;
      margin-top: 8px;
    }

    .action-btn {
      padding: 3px 8px;
      background: white;
      border: 1px solid #E2E8F0;
      border-radius: 6px;
      font-size: 11px;
      color: #64748B;
      cursor: pointer;
      transition: all 0.2s ease;
      white-space: nowrap;
      box-shadow: 0 1px 3px rgba(0,0,0,0.05);
    }

    .action-btn:hover {
      background: #F8FAFC;
      border-color: #8FA491;
      color: #4A7A50;
    }

    /* Role-specific card colors: applied via [class] binding */
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
  `]
})
export class PersonNodeComponent {
  @Input() person!: Persona;
  @Input() role: NodeRole = 'ancestor';

  @Output() nodeClick = new EventEmitter<Persona>();
  @Output() addAction = new EventEmitter<{person: Persona, type: 'PADRE' | 'PAREJA' | 'HIJO', subType: string}>();

  getCardClass(): string {
    return `node-card card-${this.role}`;
  }

  getAvatarClass(): string {
    return `avatar-circle avatar-${this.role}`;
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
}
