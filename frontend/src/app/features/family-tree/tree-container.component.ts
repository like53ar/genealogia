import { Component, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ApiService, Persona, Relacion, PersonaCreate } from '../../core/api.service';
import { PersonNodeComponent, NodeRole } from './person-node.component';
import { AddRelativeDialogComponent } from '../../shared/add-relative-dialog/add-relative-dialog.component';
import { EditPersonDialogComponent } from '../../shared/edit-person-dialog/edit-person-dialog.component';

@Component({
  selector: 'app-tree-container',
  standalone: true,
  imports: [CommonModule, PersonNodeComponent, AddRelativeDialogComponent, EditPersonDialogComponent],
  template: `
    <div class="tree-viewport">

      <!-- Loading -->
      <div *ngIf="loading" class="loading-msg">
        Cargando tu historia...
      </div>

      <!-- Tree Layout -->
      <div *ngIf="!loading && rootPerson" class="tree-layout">

        <!-- ── GRANDPARENTS ROW ─────────────────────────────── -->
        <div class="tree-row grandparents-row" *ngIf="grandparents.length > 0">
          <div *ngFor="let gp of grandparents" class="grandparent-unit">
            <app-person-node
              [person]="gp"
              [role]="'ancestor'"
              (nodeClick)="onPersonNodeClick(gp)"
              (addAction)="openAddRelative(gp, $event.type)"
            ></app-person-node>
          </div>
        </div>

        <!-- Connector: grandparents → parents (vertical line from each grandparent to parent) -->
        <div class="connector-row" *ngIf="grandparents.length > 0 && parents.length > 0">
          <div class="v-line" *ngFor="let _ of parents"></div>
        </div>

        <!-- ── PARENTS ROW ─────────────────────────────────── -->
        <div class="tree-row parents-row" *ngIf="parents.length > 0">

          <!-- Padre -->
          <div class="parent-unit" *ngIf="parents[0]">
            <app-person-node
              [person]="parents[0]"
              [role]="'parent'"
              (nodeClick)="onPersonNodeClick(parents[0])"
              (addAction)="openAddRelative(parents[0], $event.type)"
            ></app-person-node>
          </div>

          <!-- H-connector between padre and madre -->
          <div class="h-connector parents-connector" *ngIf="parents.length > 1"></div>

          <!-- Madre -->
          <div class="parent-unit" *ngIf="parents[1]">
            <app-person-node
              [person]="parents[1]"
              [role]="'parent'"
              (nodeClick)="onPersonNodeClick(parents[1])"
              (addAction)="openAddRelative(parents[1], $event.type)"
            ></app-person-node>
          </div>
        </div>

        <!-- Connector: parents → root (vertical) -->
        <div class="connector-to-root" *ngIf="parents.length > 0">
          <div class="v-line-center"></div>
        </div>

        <!-- ── CENTER ROW: Root + Partner ─────────────────── -->
        <div class="tree-row center-row">

          <!-- Root node -->
          <div class="root-unit">
            <app-person-node
              [person]="rootPerson"
              [role]="'root'"
              (nodeClick)="onPersonNodeClick(rootPerson)"
              (addAction)="openAddRelative(rootPerson, $event.type)"
            ></app-person-node>
          </div>

          <!-- H-connector root → partner -->
          <div class="couple-connector-wrap" *ngIf="partners.length > 0">
            <div class="h-connector couple-h-line"></div>
          </div>

          <!-- Partner(s) -->
          <div class="partners-units" *ngIf="partners.length > 0">
            <ng-container *ngFor="let partner of partners; let i = index">
              <div class="h-connector" *ngIf="i > 0"></div>
              <app-person-node
                [person]="partner"
                [role]="'partner'"
                (nodeClick)="onPersonNodeClick(partner)"
                (addAction)="openAddRelative(partner, $event.type)"
              ></app-person-node>
            </ng-container>
          </div>

        </div>

        <!-- Add partner button (if no partner yet) -->
        <div class="add-partner-row" *ngIf="partners.length === 0">
          <button (click)="openAddRelative(rootPerson!, 'PAREJA')" class="add-relative-btn add-partner-btn">
            <span class="plus-icon">+</span> Añadir Pareja
          </button>
        </div>

        <!-- Connector: couple center → children -->
        <div class="connector-to-children" *ngIf="children.length > 0">
          <div class="v-line-center"></div>
        </div>

        <!-- Add child button (centered below couple) -->
        <div class="add-child-center" *ngIf="partners.length > 0">
          <button (click)="openAddRelative(rootPerson!, 'HIJO')" class="add-relative-btn add-child-btn">
            <span class="plus-icon">+</span> Añadir Hijo/a
          </button>
        </div>

        <!-- ── CHILDREN ROW ────────────────────────────────── -->
        <div class="tree-row children-row" *ngIf="children.length > 0">
          <!-- Horizontal bar connecting children -->
          <div class="children-h-bar" *ngIf="children.length > 1"></div>

          <div *ngFor="let child of children" class="child-unit">
            <!-- Small vertical line from bar to each child -->
            <div class="v-line-short" *ngIf="children.length > 1"></div>
            <app-person-node
              [person]="child"
              [role]="'child'"
              (nodeClick)="onPersonNodeClick(child)"
              (addAction)="openAddRelative(child, $event.type)"
            ></app-person-node>
          </div>
        </div>

      </div>

      <!-- Empty state -->
      <div *ngIf="!loading && !rootPerson" class="text-zen-textMuted">
        No hay personas en el árbol.
      </div>

    </div>

    <!-- Dialogs -->
    <app-add-relative-dialog
      [isOpen]="isDialogOpen"
      [targetPerson]="dialogTargetPerson"
      [relativeType]="dialogRelativeType"
      (closed)="isDialogOpen = false"
      (saved)="onRelativeSaved($event)">
    </app-add-relative-dialog>

    <app-edit-person-dialog
      [isOpen]="isEditPersonDialogOpen"
      [person]="editDialogTargetPerson"
      (closed)="isEditPersonDialogOpen = false"
      (saved)="onPersonEdited($event)"
      (deleted)="onPersonDeleted($event)"
      (navigate)="onPersonNavigate($event)">
    </app-edit-person-dialog>
  `,
  styles: [`
    /* ── Viewport ──────────────────────────────────────── */
    .tree-viewport {
      width: 100%;
      min-height: 80vh;
      display: flex;
      align-items: center;
      justify-content: center;
      padding: 40px 20px 60px;
      overflow: auto;
    }

    .loading-msg {
      color: #94A3B8;
      font-size: 14px;
      animation: pulse 1.5s ease-in-out infinite;
    }

    /* ── Main layout (vertical column) ─────────────────── */
    .tree-layout {
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 0;
    }

    /* ── Rows ───────────────────────────────────────────── */
    .tree-row {
      display: flex;
      flex-direction: row;
      align-items: flex-start;
      justify-content: center;
    }

    .grandparents-row {
      gap: 24px;
    }

    .grandparent-unit {
      display: flex;
      flex-direction: column;
      align-items: center;
    }

    .parents-row {
      align-items: center;
      gap: 0;
    }

    .parent-unit {
      display: flex;
      flex-direction: column;
      align-items: center;
    }

    .center-row {
      align-items: center;
      gap: 0;
    }

    .root-unit, .partners-units {
      display: flex;
      align-items: center;
    }

    .children-row {
      position: relative;
      align-items: flex-start;
      gap: 24px;
    }

    .child-unit {
      display: flex;
      flex-direction: column;
      align-items: center;
    }

    /* ── Connectors ─────────────────────────────────────── */

    /* Generic horizontal line between nodes */
    .h-connector {
      height: 2px;
      background: #B8A898;
      flex-shrink: 0;
      align-self: center;
    }

    .parents-connector {
      width: 80px;
    }

    .couple-connector-wrap {
      display: flex;
      align-items: center;
    }

    .couple-h-line {
      width: 60px;
    }

    /* Generic vertical line strip */
    .connector-row {
      display: flex;
      gap: 24px;
      justify-content: center;
      margin: 0;
    }

    .v-line {
      width: 2px;
      height: 32px;
      background: #B8A898;
    }

    /* Centered vertical line (parents → root) */
    .connector-to-root {
      display: flex;
      justify-content: center;
      margin: 0;
    }

    .v-line-center {
      width: 2px;
      height: 40px;
      background: #B8A898;
    }

    /* Connector couple → children */
    .connector-to-children {
      display: flex;
      justify-content: center;
      margin-top: 0;
    }

    /* Short vertical from horizontal bar to child */
    .v-line-short {
      width: 2px;
      height: 24px;
      background: #B8A898;
      align-self: center;
    }

    /* Children horizontal bar – overlaid as absolute, centered */
    .children-h-bar {
      position: absolute;
      top: 0;
      left: 15%;
      right: 15%;
      height: 2px;
      background: #B8A898;
    }

    /* ── Add-relative buttons ───────────────────────────── */
    .add-child-center {
      display: flex;
      justify-content: center;
      margin-top: 8px;
    }

    .add-partner-row {
      display: flex;
      justify-content: center;
      margin-top: 8px;
    }

    .add-relative-btn {
      display: flex;
      align-items: center;
      gap: 6px;
      padding: 6px 16px;
      background: white;
      border: 1.5px solid #E2E8F0;
      border-radius: 8px;
      font-size: 13px;
      color: #64748B;
      cursor: pointer;
      transition: all 0.2s ease;
      box-shadow: 0 2px 8px rgba(0,0,0,0.06);
    }

    .add-relative-btn:hover {
      background: #F0F7F0;
      border-color: #8FA491;
      color: #4A7A50;
    }

    .plus-icon {
      font-size: 16px;
      font-weight: 300;
      line-height: 1;
    }

    @keyframes pulse {
      0%, 100% { opacity: 1; }
      50% { opacity: 0.4; }
    }
  `]
})
export class TreeContainerComponent implements OnInit {
  private api = inject(ApiService);

  allPersons: Persona[] = [];
  allRelations: Relacion[] = [];

  rootPerson: Persona | null = null;

  grandparents: Persona[] = [];
  parents: Persona[] = [];
  partners: Persona[] = [];
  children: Persona[] = [];

  loading = true;

  // Dialog State
  isDialogOpen = false;
  dialogTargetPerson: Persona | null = null;
  dialogRelativeType: 'PADRE' | 'PAREJA' | 'HIJO' = 'PADRE';

  // Edit dialog state
  isEditPersonDialogOpen = false;
  editDialogTargetPerson: Persona | null = null;

  ngOnInit() {
    this.loadData();
  }

  loadData() {
    this.loading = true;
    this.api.getPersonas().subscribe(personas => {
      this.allPersons = personas;
      this.api.getRelaciones().subscribe(relaciones => {
        this.allRelations = relaciones;

        if (!this.rootPerson && this.allPersons.length > 0) {
          this.rootPerson = this.allPersons[0];
        }

        if (this.rootPerson) {
          const updatedRoot = this.allPersons.find(p => p.id === this.rootPerson?.id);
          if (updatedRoot) this.rootPerson = updatedRoot;
          this.calculateTree(this.rootPerson);
        }
        this.loading = false;
      });
    });
  }

  setRoot(person: Persona) {
    this.rootPerson = person;
    this.calculateTree(person);
  }

  calculateTree(center: Persona) {
    // Parents (PADRE_HIJO: persona_1 = padre, persona_2 = hijo)
    const parentIds = this.allRelations
      .filter(r => r.tipo_relacion === 'PADRE_HIJO' && r.persona_2_id === center.id)
      .map(r => r.persona_1_id);
    this.parents = this.allPersons.filter(p => parentIds.includes(p.id));

    // Grandparents: parents of each parent
    const grandparentIds = new Set<string>();
    this.parents.forEach(parent => {
      this.allRelations
        .filter(r => r.tipo_relacion === 'PADRE_HIJO' && r.persona_2_id === parent.id)
        .forEach(r => grandparentIds.add(r.persona_1_id));
    });
    this.grandparents = this.allPersons.filter(p => grandparentIds.has(p.id));

    // Children
    const childIds = this.allRelations
      .filter(r => r.tipo_relacion === 'PADRE_HIJO' && r.persona_1_id === center.id)
      .map(r => r.persona_2_id);
    this.children = this.allPersons.filter(p => childIds.includes(p.id));

    // Partners
    const partnerIds = this.allRelations
      .filter(r => r.tipo_relacion === 'PAREJA' && (r.persona_1_id === center.id || r.persona_2_id === center.id))
      .map(r => r.persona_1_id === center.id ? r.persona_2_id : r.persona_1_id);
    this.partners = this.allPersons.filter(p => partnerIds.includes(p.id));
  }

  onPersonNodeClick(person: Persona) {
    this.editDialogTargetPerson = person;
    this.isEditPersonDialogOpen = true;
  }

  openAddRelative(person: Persona, type: 'PADRE' | 'PAREJA' | 'HIJO') {
    this.dialogTargetPerson = person;
    this.dialogRelativeType = type;
    this.isDialogOpen = true;
  }

  onRelativeSaved(event: {personaData: PersonaCreate, relativeType: 'PADRE' | 'PAREJA' | 'HIJO'}) {
    if (!this.dialogTargetPerson) return;

    const payload = { ...event.personaData };
    if (!payload.fecha_nacimiento) delete payload.fecha_nacimiento;
    if (!payload.fecha_muerte) delete payload.fecha_muerte;
    if (!payload.genero) delete payload.genero;
    if (!payload.lugar_nacimiento) delete payload.lugar_nacimiento;

    this.api.createPersona(payload).subscribe(newPerson => {
      let relationPayload: any = {
        tipo_relacion: event.relativeType === 'PAREJA' ? 'PAREJA' : 'PADRE_HIJO'
      };

      if (event.relativeType === 'PADRE') {
        relationPayload.persona_1_id = newPerson.id;
        relationPayload.persona_2_id = this.dialogTargetPerson!.id;
      } else if (event.relativeType === 'HIJO') {
        relationPayload.persona_1_id = this.dialogTargetPerson!.id;
        relationPayload.persona_2_id = newPerson.id;
      } else if (event.relativeType === 'PAREJA') {
        relationPayload.persona_1_id = this.dialogTargetPerson!.id;
        relationPayload.persona_2_id = newPerson.id;
      }

      this.api.createRelacion(relationPayload).subscribe(() => {
        this.isDialogOpen = false;
        this.loadData();
      });
    });
  }

  onPersonEdited(updatedData: PersonaCreate) {
    // Save the updated data via API, then reload
    if (this.editDialogTargetPerson) {
      const payload = { ...updatedData };
      if (!payload.fecha_nacimiento) delete payload.fecha_nacimiento;
      if (!payload.fecha_muerte) delete payload.fecha_muerte;
      if (!payload.genero) delete payload.genero;
      if (!payload.lugar_nacimiento) delete payload.lugar_nacimiento;

      this.api.updatePersona(this.editDialogTargetPerson.id, payload).subscribe(() => {
        this.isEditPersonDialogOpen = false;
        this.loadData();
      });
    }
  }

  onPersonDeleted(person: Persona) {
    if (person) {
      this.api.deletePersona(person.id).subscribe(() => {
        this.isEditPersonDialogOpen = false;
        // If deleted person was root, reset root
        if (this.rootPerson?.id === person.id) {
          this.rootPerson = null;
        }
        this.loadData();
      });
    }
  }

  onPersonNavigate(person: Persona) {
    this.isEditPersonDialogOpen = false;
    this.setRoot(person);
  }
}
