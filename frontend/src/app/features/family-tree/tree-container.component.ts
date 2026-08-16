import { Component, inject, OnInit, Input, OnChanges, SimpleChanges } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ApiService, Persona, Relacion, PersonaCreate } from '../../core/api.service';
import { PersonNodeComponent, NodeRole } from './person-node.component';
import { AddRelativeDialogComponent } from '../../shared/add-relative-dialog/add-relative-dialog.component';
import { EditPersonDialogComponent } from '../../shared/edit-person-dialog/edit-person-dialog.component';

export interface BisabueloGroup {
  p1: Persona;
  p2: Persona | null;
  weddingYear: string | null;
}

export interface GrandparentLineage {
  gp: Persona;
  bisabuelos: BisabueloGroup | null;
}

export interface ParentBranch {
  parent: Persona;
  grandparents: GrandparentLineage[];
  gpWeddingYear: string | null;
}

@Component({
  selector: 'app-tree-container',
  standalone: true,
  imports: [CommonModule, PersonNodeComponent, AddRelativeDialogComponent, EditPersonDialogComponent],
  template: `
    <div class="tree-viewport">

      <!-- Toast de éxito -->
      <div class="success-toast" *ngIf="toastVisible">
        {{ toastMessage }}
      </div>

      <!-- Loading -->
      <div *ngIf="loading" class="loading-msg">
        Cargando tu historia...
      </div>

      <!-- Tree Layout -->
      <div *ngIf="!loading && rootPerson" class="tree-layout">

        <!-- ── ANCESTOR BRANCHES: Bisabuelos y Abuelos organizados por origen y rama ── -->
        <div class="ancestor-branches-container" *ngIf="parentBranches.length > 0">
          
          <div class="ancestor-branches-row">
            <ng-container *ngFor="let branch of parentBranches; let bi = index">

              <div class="parent-branch-column">
                
                <!-- Subárbol de Abuelos y Bisabuelos de este Progenitor -->
                <div class="grandparents-branch-group" *ngIf="branch.grandparents.length > 0">
                  <div class="grandparent-subbranch-container">
                    
                    <ng-container *ngFor="let gpItem of branch.grandparents; let gi = index">
                      
                      <!-- Conector de matrimonio entre Abuelo y Abuela -->
                      <div class="gp-couple-connector-wrap" *ngIf="gi > 0">
                        <div class="couple-connector-inner">
                          <div class="wedding-badge" *ngIf="branch.gpWeddingYear">
                            <span class="wedding-icon">&#x1F48D;</span>
                            <span class="wedding-year">{{ branch.gpWeddingYear }}</span>
                          </div>
                          <div class="h-connector gp-h-line"></div>
                        </div>
                      </div>

                      <!-- Columna de linaje del Abuelo/a (Bisabuelos de este origen ARRIBA, Abuelo/a ABAJO) -->
                      <div class="grandparent-lineage-column">
                        
                        <!-- Cuadro unificado de Bisabuelos de este origen -->
                        <div class="bisabuelos-origin-card" *ngIf="gpItem.bisabuelos">
                          <div class="bisabuelos-origin-header">
                            <span class="origin-badge">Padres de {{ gpItem.gp.nombre }}</span>
                          </div>
                          
                          <div class="bisabuelos-couple-flex">
                            <div class="ancestor-unit">
                              <app-person-node
                                [person]="gpItem.bisabuelos.p1"
                                [role]="'ancestor'"
                                [kinshipLabel]="kinshipLabels.get(gpItem.bisabuelos.p1.id) || ''"
                                [parentCount]="getParentCount(gpItem.bisabuelos.p1)"
                                (nodeClick)="onPersonNodeClick(gpItem.bisabuelos.p1)"
                                (addAction)="openAddRelative(gpItem.bisabuelos.p1, $event.type)"
                              ></app-person-node>
                            </div>

                            <ng-container *ngIf="gpItem.bisabuelos.p2">
                              <div class="couple-connector-wrap">
                                <div class="couple-connector-inner">
                                  <div class="wedding-badge" *ngIf="gpItem.bisabuelos.weddingYear">
                                    <span class="wedding-icon">&#x1F48D;</span>
                                    <span class="wedding-year">{{ gpItem.bisabuelos.weddingYear }}</span>
                                  </div>
                                  <div class="h-connector couple-h-line"></div>
                                </div>
                              </div>
                              <div class="ancestor-unit">
                                <app-person-node
                                  [person]="gpItem.bisabuelos.p2"
                                  [role]="'ancestor'"
                                  [kinshipLabel]="kinshipLabels.get(gpItem.bisabuelos.p2.id) || ''"
                                  [parentCount]="getParentCount(gpItem.bisabuelos.p2)"
                                  (nodeClick)="onPersonNodeClick(gpItem.bisabuelos.p2)"
                                  (addAction)="openAddRelative(gpItem.bisabuelos.p2, $event.type)"
                                ></app-person-node>
                              </div>
                            </ng-container>
                          </div>

                          <!-- Línea vertical que desciende hacia el abuelo correspondiente -->
                          <div class="v-line-bisabuelos"></div>
                        </div>

                        <!-- Nodo del Abuelo / Abuela -->
                        <div class="grandparent-node-unit">
                          <app-person-node
                            [person]="gpItem.gp"
                            [role]="'ancestor'"
                            [kinshipLabel]="kinshipLabels.get(gpItem.gp.id) || ''"
                            [parentCount]="getParentCount(gpItem.gp)"
                            (nodeClick)="onPersonNodeClick(gpItem.gp)"
                            (addAction)="openAddRelative(gpItem.gp, $event.type)"
                          ></app-person-node>
                        </div>

                      </div>

                    </ng-container>
                  </div>

                  <!-- Línea vertical hacia el padre/madre -->
                  <div class="v-line-parent-link"></div>
                </div>

                <!-- Nodo del Padre / Madre -->
                <div class="parent-node-unit">
                  <app-person-node
                    [person]="branch.parent"
                    [role]="'parent'"
                    [kinshipLabel]="kinshipLabels.get(branch.parent.id) || ''"
                    [parentCount]="getParentCount(branch.parent)"
                    (nodeClick)="onPersonNodeClick(branch.parent)"
                    (addAction)="openAddRelative(branch.parent, $event.type)"
                  ></app-person-node>
                </div>

              </div>

              <!-- Conector entre Padre y Madre si hay 2 ramas -->
              <div class="parents-mid-connector-wrap" *ngIf="bi === 0 && parentBranches.length > 1">
                <div class="couple-connector-inner">
                  <div class="wedding-badge" *ngIf="getParentsWeddingYear()">
                    <span class="wedding-icon">&#x1F48D;</span>
                    <span class="wedding-year">{{ getParentsWeddingYear() }}</span>
                  </div>
                  <div class="h-connector parents-h-line"></div>
                </div>
              </div>

            </ng-container>
          </div>

        </div>

        <!-- Connector: parents → center generation (vertical) -->
        <div class="connector-to-root" *ngIf="parents.length > 0">
          <div class="v-line-center"></div>
        </div>

        <!-- ── CENTER GENERATION: Hermanos + Root/Pareja + Hijos ── -->
        <div class="center-generation-wrap">

          <!-- Conector horizontal superior si hay padres y hermanos -->
          <div class="siblings-connector-bar-wrap" *ngIf="parents.length > 0 && siblings.length > 0">
            <div class="siblings-h-bar"></div>
          </div>

          <div class="tree-row center-row">

            <!-- Hermanos del nodo central -->
            <div *ngFor="let sib of siblings" class="sibling-unit">
              <div class="v-line-short" *ngIf="parents.length > 0"></div>
              <app-person-node
                [person]="sib"
                [role]="'sibling'"
                [kinshipLabel]="kinshipLabels.get(sib.id) || 'Hermano/a'"
                [parentCount]="getParentCount(sib)"
                (nodeClick)="onPersonNodeClick(sib)"
                (addAction)="openAddRelative(sib, $event.type)"
              ></app-person-node>
            </div>

            <!-- Unidad Central: Root + Pareja + Hijos -->
            <div class="main-couple-unit">
              <div class="v-line-short" *ngIf="parents.length > 0 && siblings.length > 0"></div>

              <div class="main-couple-flex">
                <!-- Root node -->
                <div class="root-unit">
                  <app-person-node
                    [person]="rootPerson"
                    [role]="'root'"
                    [kinshipLabel]="''"
                    [parentCount]="getParentCount(rootPerson)"
                    (nodeClick)="onPersonNodeClick(rootPerson)"
                    (addAction)="openAddRelative(rootPerson, $event.type)"
                  ></app-person-node>
                </div>

                <!-- H-connector root → partner (with wedding year) -->
                <div class="couple-connector-wrap" *ngIf="partners.length > 0">
                  <div class="couple-connector-inner">
                    <!-- Wedding year badge -->
                    <div class="wedding-badge" *ngIf="getWeddingYear()">
                      <span class="wedding-icon">&#x1F48D;</span>
                      <span class="wedding-year">{{ getWeddingYear() }}</span>
                    </div>
                    <div class="h-connector couple-h-line"></div>
                  </div>
                </div>

                <!-- Partner(s) -->
                <div class="partners-units" *ngIf="partners.length > 0">
                  <ng-container *ngFor="let partner of partners; let i = index">
                    <div class="h-connector" *ngIf="i > 0"></div>
                    <app-person-node
                      [person]="partner"
                      [role]="'partner'"
                      [kinshipLabel]="kinshipLabels.get(partner.id) || ''"
                      [parentCount]="getParentCount(partner)"
                      (nodeClick)="onPersonNodeClick(partner)"
                      (addAction)="openAddRelative(partner, $event.type)"
                    ></app-person-node>
                  </ng-container>
                </div>
              </div>

              <!-- Connector: couple center → children -->
              <div class="connector-to-children" *ngIf="children.length > 0">
                <div class="v-line-center"></div>
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
                    [kinshipLabel]="kinshipLabels.get(child.id) || ''"
                    [parentCount]="getParentCount(child)"
                    (nodeClick)="onPersonNodeClick(child)"
                    (addAction)="openAddRelative(child, $event.type)"
                  ></app-person-node>
                </div>
              </div>

            </div>

          </div>

        </div>

      </div>

      <!-- Empty state -->
      <div *ngIf="!loading && !rootPerson" style="
        display: flex; flex-direction: column; align-items: center; justify-content: center;
        padding: 3.5rem 2rem; text-align: center; background: rgba(255,255,255,0.55);
        backdrop-filter: blur(12px); -webkit-backdrop-filter: blur(12px);
        border-radius: 24px; border: 1.5px dashed rgba(138,154,106,0.45);
        max-width: 420px; margin: 3rem auto; box-shadow: 0 10px 30px rgba(0,0,0,0.04);
      ">
        <div style="font-size: 3rem; margin-bottom: 0.8rem;">🌱</div>
        <h3 style="font-family: 'Georgia', serif; font-size: 1.2rem; color: #3b3a36; font-weight: 700; margin: 0 0 0.5rem; text-transform: uppercase; letter-spacing: 0.08em;">
          Árbol Vacío
        </h3>
        <p style="font-family: 'Georgia', serif; font-size: 0.88rem; color: #7a7368; line-height: 1.6; margin: 0 0 1.8rem;">
          Este árbol aún no tiene integrantes. Agregá a la primera persona para comenzar a construir la genealogía familiar.
        </p>
        <button (click)="openAddFirstPerson()" style="
          font-family: 'Georgia', serif; font-size: 0.85rem; font-weight: 600;
          letter-spacing: 0.12em; text-transform: uppercase; color: white;
          background: linear-gradient(135deg, #7a8c5a, #5a6a42);
          border: none; padding: 0.8em 1.8em; border-radius: 12px; cursor: pointer;
          box-shadow: 0 4px 18px rgba(107,124,85,0.35); transition: transform 0.2s;
        "
        onmouseover="this.style.transform='translateY(-2px)'"
        onmouseout="this.style.transform='translateY(0)'">
          + Agregar primera persona
        </button>
      </div>

    </div>

    <!-- Dialogs -->
    <app-add-relative-dialog
      [isOpen]="isDialogOpen"
      [targetPerson]="dialogTargetPerson"
      [relativeType]="dialogRelativeType"
      [availablePartners]="dialogPartners"
      [targetParents]="dialogTargetParents"
      (closed)="isDialogOpen = false"
      (saved)="onRelativeSaved($event)">
    </app-add-relative-dialog>

    <app-edit-person-dialog
      [isOpen]="isEditPersonDialogOpen"
      [person]="editDialogTargetPerson"
      [parents]="editDialogParents"
      [siblings]="editDialogSiblings"
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

    /* Toast de éxito */
    .success-toast {
      position: fixed;
      top: 80px;
      right: 24px;
      z-index: 100;
      background: #4A7A50;
      color: white;
      padding: 10px 20px;
      border-radius: 12px;
      font-size: 13px;
      font-weight: 500;
      box-shadow: 0 4px 16px rgba(0,0,0,0.15);
      animation: toastFade 2.5s ease forwards;
      pointer-events: none;
    }

    @keyframes toastFade {
      0%   { opacity: 0; transform: translateY(-8px); }
      15%  { opacity: 1; transform: translateY(0); }
      75%  { opacity: 1; }
      100% { opacity: 0; }
    }

    /* ── Main layout (vertical column) ─────────────────── */
    .tree-layout {
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 0;
    }

    /* ── Ancestor Branches Layout ──────────────────────── */
    .ancestor-branches-container {
      display: flex;
      flex-direction: column;
      align-items: center;
      margin-bottom: 0;
    }

    .ancestor-branches-row {
      display: flex;
      flex-direction: row;
      align-items: flex-end;
      justify-content: center;
      gap: 24px;
    }

    .parent-branch-column {
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: flex-end;
    }

    .grandparents-branch-group {
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: flex-end;
    }

    .grandparent-subbranch-container {
      display: flex;
      flex-direction: row;
      align-items: flex-end;
      justify-content: center;
      gap: 16px;
    }

    .grandparent-lineage-column {
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: flex-end;
    }

    /* ── Cuadro de Bisabuelos por Origen ── */
    .bisabuelos-origin-card {
      display: flex;
      flex-direction: column;
      align-items: center;
      background: rgba(255, 252, 245, 0.72);
      border: 1.5px dashed rgba(184, 168, 152, 0.75);
      border-radius: 18px;
      padding: 8px 12px 0 12px;
      margin-bottom: 0;
      box-shadow: 0 4px 16px rgba(100, 90, 70, 0.05);
    }

    .bisabuelos-origin-header {
      margin-bottom: 6px;
    }

    .origin-badge {
      font-size: 9px;
      font-weight: 700;
      letter-spacing: 0.08em;
      text-transform: uppercase;
      color: #7A6040;
      background: rgba(235, 225, 205, 0.85);
      border: 1px solid rgba(195, 180, 155, 0.6);
      border-radius: 999px;
      padding: 2px 8px;
    }

    .bisabuelos-couple-flex {
      display: flex;
      flex-direction: row;
      align-items: center;
      gap: 0;
    }

    .v-line-bisabuelos {
      width: 2px;
      height: 20px;
      background: #B8A898;
      margin-top: 6px;
      align-self: center;
    }

    .v-line-parent-link {
      width: 2px;
      height: 28px;
      background: #B8A898;
      align-self: center;
    }

    .grandparent-node-unit, .parent-node-unit, .ancestor-unit {
      display: flex;
      flex-direction: column;
      align-items: center;
    }

    .gp-couple-connector-wrap {
      display: flex;
      align-items: center;
      align-self: flex-end;
      margin-bottom: 50px;
    }

    .gp-h-line {
      width: 44px;
    }

    .parents-mid-connector-wrap {
      display: flex;
      align-items: center;
      align-self: flex-end;
      margin-bottom: 50px;
    }

    .parents-h-line {
      width: 48px;
    }

    /* ── Rows ───────────────────────────────────────────── */
    .tree-row {
      display: flex;
      flex-direction: row;
      align-items: flex-start;
      justify-content: center;
    }

    .center-generation-wrap {
      display: flex;
      flex-direction: column;
      align-items: center;
      position: relative;
    }

    .siblings-connector-bar-wrap {
      width: 100%;
      position: relative;
      height: 2px;
      margin-bottom: 0;
    }

    .siblings-h-bar {
      position: absolute;
      top: 0;
      left: 15%;
      right: 15%;
      height: 2px;
      background: #B8A898;
    }

    .center-row {
      align-items: flex-start;
      gap: 0;
    }

    .sibling-unit {
      display: flex;
      flex-direction: column;
      align-items: center;
      margin: 0 14px;
    }

    .main-couple-unit {
      display: flex;
      flex-direction: column;
      align-items: center;
      margin: 0 14px;
    }

    .main-couple-flex {
      display: flex;
      flex-direction: row;
      align-items: center;
    }

    .root-unit, .partners-units {
      display: flex;
      align-items: center;
    }

    .children-row {
      position: relative;
      align-items: flex-start;
      gap: 20px;
    }

    .child-unit {
      display: flex;
      flex-direction: column;
      align-items: center;
    }

    /* ── Connectors ─────────────────────────────────────── */
    .h-connector {
      height: 2px;
      background: #B8A898;
      flex-shrink: 0;
      align-self: center;
    }

    .couple-connector-wrap {
      display: flex;
      align-items: center;
    }

    .couple-connector-inner {
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 0;
    }

    .wedding-badge {
      display: flex;
      align-items: center;
      gap: 3px;
      background: #FDF6EC;
      border: 1px solid #E8D0A8;
      border-radius: 10px;
      padding: 2px 7px;
      margin-bottom: 4px;
      white-space: nowrap;
    }

    .wedding-icon {
      font-size: 11px;
    }

    .wedding-year {
      font-size: 11px;
      color: #8B6A3E;
      font-weight: 600;
      letter-spacing: 0.03em;
    }

    .couple-h-line {
      width: 44px;
    }

    .connector-to-root {
      display: flex;
      justify-content: center;
      margin: 0;
    }

    .v-line-center {
      width: 2px;
      height: 32px;
      background: #B8A898;
    }

    .connector-to-children {
      display: flex;
      justify-content: center;
      margin-top: 0;
      position: relative;
    }

    .connector-to-children.with-partner {
      justify-content: flex-start;
      transform: translateX(95px);
    }

    .v-line-short {
      width: 2px;
      height: 20px;
      background: #B8A898;
      align-self: center;
    }

    .children-h-bar {
      position: absolute;
      top: 0;
      left: 15%;
      right: 15%;
      height: 2px;
      background: #B8A898;
    }

    @keyframes pulse {
      0%, 100% { opacity: 1; }
      50% { opacity: 0.4; }
    }
  `]
})
export class TreeContainerComponent implements OnInit, OnChanges {
  private api = inject(ApiService);

  @Input() arbolId: string | null = null;

  allPersons: Persona[] = [];
  allRelations: Relacion[] = [];

  rootPerson: Persona | null = null;

  parentBranches: ParentBranch[] = [];
  parents: Persona[] = [];
  siblings: Persona[] = [];
  partners: Persona[] = [];
  children: Persona[] = [];
  partnerRelation: Relacion | null = null;
  kinshipLabels = new Map<string, string>();

  loading = true;

  // Toast de éxito
  toastMessage = '';
  toastVisible = false;

  // Dialog State
  isDialogOpen = false;
  dialogTargetPerson: Persona | null = null;
  dialogRelativeType: 'PADRE' | 'PAREJA' | 'HIJO' | 'HERMANO' = 'PADRE';
  dialogPartners: Persona[] = [];
  dialogTargetParents: Persona[] = [];

  // Edit dialog state
  isEditPersonDialogOpen = false;
  editDialogTargetPerson: Persona | null = null;
  editDialogParents: Persona[] = [];
  editDialogSiblings: Persona[] = [];

  ngOnInit() {
    this.loadData();
  }

  ngOnChanges(changes: SimpleChanges) {
    if (changes['arbolId'] && !changes['arbolId'].firstChange) {
      this.rootPerson = null;
      this.loadData();
    }
  }

  loadData() {
    this.loading = true;
    this.api.getPersonas(this.arbolId || undefined).subscribe(personas => {
      this.allPersons = personas;
      this.api.getRelaciones().subscribe(relaciones => {
        this.allRelations = relaciones;

        if (this.allPersons.length === 0) {
          this.rootPerson = null;
          this.parentBranches = [];
          this.parents = [];
          this.siblings = [];
          this.partners = [];
          this.children = [];
        } else {
          if (!this.rootPerson || !this.allPersons.some(p => p.id === this.rootPerson?.id)) {
            this.rootPerson = this.allPersons[0];
          }

          if (this.rootPerson) {
            const updatedRoot = this.allPersons.find(p => p.id === this.rootPerson?.id);
            if (updatedRoot) this.rootPerson = updatedRoot;
            this.calculateTree(this.rootPerson);
          }
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
    // 1. Padres de center (PADRE_HIJO: persona_1 = padre, persona_2 = hijo)
    const parentIds = this.allRelations
      .filter(r => r.tipo_relacion === 'PADRE_HIJO' && r.persona_2_id === center.id)
      .map(r => r.persona_1_id);
    let directParents = this.allPersons.filter(p => parentIds.includes(p.id));

    // Si solo hay 1 padre, buscar su pareja
    if (directParents.length === 1) {
      const singleParent = directParents[0];
      const partnerRel = this.allRelations.find(
        r => r.tipo_relacion === 'PAREJA' &&
          (r.persona_1_id === singleParent.id || r.persona_2_id === singleParent.id)
      );
      if (partnerRel) {
        const partnerId = partnerRel.persona_1_id === singleParent.id
          ? partnerRel.persona_2_id
          : partnerRel.persona_1_id;
        if (!directParents.some(p => p.id === partnerId)) {
          const partnerPerson = this.allPersons.find(p => p.id === partnerId);
          if (partnerPerson) {
            directParents.push(partnerPerson);
          }
        }
      }
    }

    // Ordenar padres: M primero, luego F
    directParents.sort((a, b) => {
      if (a.genero === 'M' && b.genero !== 'M') return -1;
      if (a.genero !== 'M' && b.genero === 'M') return 1;
      return 0;
    });
    this.parents = directParents;

    // 2. Para cada padre, construir su rama de abuelos y bisabuelos
    this.parentBranches = [];

    this.parents.forEach(parent => {
      const gpIds = this.allRelations
        .filter(r => r.tipo_relacion === 'PADRE_HIJO' && r.persona_2_id === parent.id)
        .map(r => r.persona_1_id);
      let directGps = this.allPersons.filter(p => gpIds.includes(p.id));

      // Si solo hay 1 abuelo y tiene pareja, agregar su pareja
      if (directGps.length === 1) {
        const singleGp = directGps[0];
        const partnerRel = this.allRelations.find(
          r => r.tipo_relacion === 'PAREJA' &&
            (r.persona_1_id === singleGp.id || r.persona_2_id === singleGp.id)
        );
        if (partnerRel) {
          const partnerId = partnerRel.persona_1_id === singleGp.id
            ? partnerRel.persona_2_id
            : partnerRel.persona_1_id;
          if (!directGps.some(p => p.id === partnerId)) {
            const partnerPerson = this.allPersons.find(p => p.id === partnerId);
            if (partnerPerson) {
              directGps.push(partnerPerson);
            }
          }
        }
      }

      // Ordenar abuelos: M primero, F segundo
      directGps.sort((a, b) => {
        if (a.genero === 'M' && b.genero !== 'M') return -1;
        if (a.genero !== 'M' && b.genero === 'M') return 1;
        return 0;
      });

      // Año de matrimonio entre los abuelos (si hay 2)
      let gpWeddingYear: string | null = null;
      if (directGps.length >= 2) {
        const gpRel = this.allRelations.find(
          r => r.tipo_relacion === 'PAREJA' &&
            ((r.persona_1_id === directGps[0].id && r.persona_2_id === directGps[1].id) ||
             (r.persona_1_id === directGps[1].id && r.persona_2_id === directGps[0].id))
        );
        if (gpRel?.fecha_inicio) {
          try {
            gpWeddingYear = new Date(gpRel.fecha_inicio + 'T00:00:00').getFullYear().toString();
          } catch { gpWeddingYear = null; }
        }
      }

      // Para cada abuelo, buscar sus bisabuelos (padres del abuelo)
      const gpLineages: GrandparentLineage[] = [];

      directGps.forEach(gp => {
        const baIds = this.allRelations
          .filter(r => r.tipo_relacion === 'PADRE_HIJO' && r.persona_2_id === gp.id)
          .map(r => r.persona_1_id);
        let directBas = this.allPersons.filter(p => baIds.includes(p.id));

        // Si solo hay 1 bisabuelo y tiene pareja, agregar su pareja
        if (directBas.length === 1) {
          const singleBa = directBas[0];
          const partnerRel = this.allRelations.find(
            r => r.tipo_relacion === 'PAREJA' &&
              (r.persona_1_id === singleBa.id || r.persona_2_id === singleBa.id)
          );
          if (partnerRel) {
            const partnerId = partnerRel.persona_1_id === singleBa.id
              ? partnerRel.persona_2_id
              : partnerRel.persona_1_id;
            if (!directBas.some(p => p.id === partnerId)) {
              const partnerPerson = this.allPersons.find(p => p.id === partnerId);
              if (partnerPerson) {
                directBas.push(partnerPerson);
              }
            }
          }
        }

        // Ordenar bisabuelos: M primero, F segundo
        directBas.sort((a, b) => {
          if (a.genero === 'M' && b.genero !== 'M') return -1;
          if (a.genero !== 'M' && b.genero === 'M') return 1;
          return 0;
        });

        let bisabuelosGroup: BisabueloGroup | null = null;
        if (directBas.length > 0) {
          const b1 = directBas[0];
          const b2 = directBas.length > 1 ? directBas[1] : null;
          let bWeddingYear: string | null = null;
          if (b2) {
            const bRel = this.allRelations.find(
              r => r.tipo_relacion === 'PAREJA' &&
                ((r.persona_1_id === b1.id && r.persona_2_id === b2.id) ||
                 (r.persona_1_id === b2.id && r.persona_2_id === b1.id))
            );
            if (bRel?.fecha_inicio) {
              try {
                bWeddingYear = new Date(bRel.fecha_inicio + 'T00:00:00').getFullYear().toString();
              } catch { bWeddingYear = null; }
            }
          }
          bisabuelosGroup = { p1: b1, p2: b2, weddingYear: bWeddingYear };
        }

        gpLineages.push({ gp, bisabuelos: bisabuelosGroup });
      });

      this.parentBranches.push({
        parent,
        grandparents: gpLineages,
        gpWeddingYear
      });
    });

    // Hermanos del nodo central (otros hijos de los mismos padres)
    if (this.parents.length > 0) {
      const parentIds = this.parents.map(p => p.id);
      const siblingIds = Array.from(new Set(
        this.allRelations
          .filter(r => r.tipo_relacion === 'PADRE_HIJO' && parentIds.includes(r.persona_1_id) && r.persona_2_id !== center.id)
          .map(r => r.persona_2_id)
      ));
      this.siblings = this.allPersons.filter(p => siblingIds.includes(p.id));
    } else {
      this.siblings = [];
    }

    // Children
    const childIds = this.allRelations
      .filter(r => r.tipo_relacion === 'PADRE_HIJO' && r.persona_1_id === center.id)
      .map(r => r.persona_2_id);
    this.children = this.allPersons.filter(p => childIds.includes(p.id));

    // Partners
    const partnerRelations = this.allRelations.filter(
      r => r.tipo_relacion === 'PAREJA' &&
        (r.persona_1_id === center.id || r.persona_2_id === center.id)
    );
    this.partnerRelation = partnerRelations[0] ?? null;

    const partnerIds = partnerRelations.map(
      r => r.persona_1_id === center.id ? r.persona_2_id : r.persona_1_id
    );
    this.partners = this.allPersons.filter(p => partnerIds.includes(p.id));

    // Compute kinship labels
    this.computeKinship();
  }

  /** Asigna automáticamente el grado de parentesco relativo a la raíz */
  computeKinship() {
    this.kinshipLabels.clear();
    const g = (p: Persona, f: string, m: string, n: string) =>
      p.genero === 'M' ? m : p.genero === 'F' ? f : n;

    // Pareja del nodo raíz
    this.partners.forEach(p =>
      this.kinshipLabels.set(p.id, g(p, 'Esposa', 'Esposo', 'Pareja'))
    );

    // Hermanos / Hermanas del nodo raíz
    this.siblings.forEach(p =>
      this.kinshipLabels.set(p.id, g(p, 'Hermana', 'Hermano', 'Hermano/a'))
    );

    // Hijos / Hijas
    this.children.forEach(p =>
      this.kinshipLabels.set(p.id, g(p, 'Hija', 'Hijo', 'Hijo/a'))
    );

    // Recorrer ramas ascendentes
    this.parentBranches.forEach((branch, bIdx) => {
      const parent = branch.parent;
      this.kinshipLabels.set(parent.id, g(parent, 'Madre', 'Padre', 'Padre/Madre'));

      const lado = parent.genero === 'M' ? 'paterno' : parent.genero === 'F' ? 'materno' : (bIdx === 0 ? 'paterno' : 'materno');
      const s = ` ${lado}`;

      branch.grandparents.forEach(gpLineage => {
        const gp = gpLineage.gp;
        this.kinshipLabels.set(gp.id, g(gp, `Abuela${s}`, `Abuelo${s}`, `Abuelo/a${s}`));

        if (gpLineage.bisabuelos) {
          const b1 = gpLineage.bisabuelos.p1;
          this.kinshipLabels.set(b1.id, g(b1, `Bisabuela${s}`, `Bisabuelo${s}`, `Bisabuelo/a${s}`));
          if (gpLineage.bisabuelos.p2) {
            const b2 = gpLineage.bisabuelos.p2;
            this.kinshipLabels.set(b2.id, g(b2, `Bisabuela${s}`, `Bisabuelo${s}`, `Bisabuelo/a${s}`));
          }
        }
      });
    });
  }

  getParentsWeddingYear(): string | null {
    if (this.parents.length < 2) return null;
    const rel = this.allRelations.find(
      r => r.tipo_relacion === 'PAREJA' &&
        ((r.persona_1_id === this.parents[0].id && r.persona_2_id === this.parents[1].id) ||
         (r.persona_1_id === this.parents[1].id && r.persona_2_id === this.parents[0].id))
    );
    if (!rel?.fecha_inicio) return null;
    try {
      return new Date(rel.fecha_inicio + 'T00:00:00').getFullYear().toString();
    } catch { return null; }
  }

  getWeddingYear(): string | null {
    if (!this.partnerRelation?.fecha_inicio) return null;
    try {
      return new Date(this.partnerRelation.fecha_inicio + 'T00:00:00').getFullYear().toString();
    } catch { return null; }
  }

  getParentCount(person: Persona | null): number {
    if (!person) return 0;
    return this.allRelations.filter(
      r => r.tipo_relacion === 'PADRE_HIJO' && r.persona_2_id === person.id
    ).length;
  }

  showToast(msg: string) {
    this.toastMessage = msg;
    this.toastVisible = true;
    setTimeout(() => this.toastVisible = false, 2500);
  }

  onPersonNodeClick(person: Persona) {
    this.editDialogTargetPerson = person;
    this.editDialogParents = [];
    this.editDialogSiblings = [];

    // Buscar IDs de padres desde las relaciones ya cargadas
    const parentIds = this.allRelations
      .filter(r => r.tipo_relacion === 'PADRE_HIJO' && r.persona_2_id === person.id)
      .map(r => r.persona_1_id);

    // Buscar IDs de hermanos (hijos de los mismos padres, excluyendo a la persona actual)
    let siblingIds: string[] = [];
    if (parentIds.length > 0) {
      siblingIds = Array.from(new Set(
        this.allRelations
          .filter(r => r.tipo_relacion === 'PADRE_HIJO' && parentIds.includes(r.persona_1_id) && r.persona_2_id !== person.id)
          .map(r => r.persona_2_id)
      ));
    }

    if (parentIds.length === 0 && siblingIds.length === 0) {
      this.isEditPersonDialogOpen = true;
      return;
    }

    // Buscar en allPersons primero; si alguno falta, traer del backend
    const neededIds = [...parentIds, ...siblingIds];
    const foundAll = neededIds.every(id => this.allPersons.some(p => p.id === id));

    if (foundAll) {
      this.editDialogParents = this.allPersons.filter(p => parentIds.includes(p.id));
      this.editDialogSiblings = this.allPersons.filter(p => siblingIds.includes(p.id));
      this.isEditPersonDialogOpen = true;
    } else {
      this.api.getPersonas().subscribe(todas => {
        this.allPersons = todas;
        this.editDialogParents = todas.filter(p => parentIds.includes(p.id));
        this.editDialogSiblings = todas.filter(p => siblingIds.includes(p.id));
        this.isEditPersonDialogOpen = true;
      });
    }
  }

  openAddFirstPerson() {
    this.dialogTargetPerson = null;
    this.dialogRelativeType = 'PADRE';
    this.isDialogOpen = true;
  }

  openAddRelative(person: Persona, type: 'PADRE' | 'PAREJA' | 'HIJO' | 'HERMANO') {
    this.dialogTargetPerson = person;
    this.dialogRelativeType = type;
    if (type === 'HIJO') {
      this.dialogPartners = this.getPartnersOf(person);
      this.dialogTargetParents = [];
    } else if (type === 'HERMANO') {
      this.dialogPartners = [];
      const parentIds = this.allRelations
        .filter(r => r.tipo_relacion === 'PADRE_HIJO' && r.persona_2_id === person.id)
        .map(r => r.persona_1_id);
      this.dialogTargetParents = this.allPersons.filter(p => parentIds.includes(p.id));
    } else {
      this.dialogPartners = [];
      this.dialogTargetParents = [];
    }
    this.isDialogOpen = true;
  }

  getPartnersOf(person: Persona): Persona[] {
    const partnerIds = this.allRelations
      .filter(r => r.tipo_relacion === 'PAREJA' &&
        (r.persona_1_id === person.id || r.persona_2_id === person.id))
      .map(r => r.persona_1_id === person.id ? r.persona_2_id : r.persona_1_id);
    return this.allPersons.filter(p => partnerIds.includes(p.id));
  }

  onRelativeSaved(event: {
    personaData: PersonaCreate,
    relativeType: 'PADRE' | 'PAREJA' | 'HIJO' | 'HERMANO',
    fechaMatrimonio?: string,
    otherParentId?: string
  }) {
    const payload = { ...event.personaData };
    if (this.arbolId) {
      payload.arbol_id = this.arbolId;
    }
    if (!payload.fecha_nacimiento) delete payload.fecha_nacimiento;
    if (!payload.fecha_muerte) delete payload.fecha_muerte;
    if (!payload.genero) delete payload.genero;
    if (!payload.lugar_nacimiento) delete payload.lugar_nacimiento;

    if (!this.dialogTargetPerson) {
      this.api.createPersona(payload).subscribe(newPerson => {
        this.isDialogOpen = false;
        this.rootPerson = newPerson;
        this.showToast('✓ Persona inicial agregada');
        this.loadData();
      });
      return;
    }

    const targetPerson = this.dialogTargetPerson;

    // Manejo de HERMANO
    if (event.relativeType === 'HERMANO') {
      const parentRels = this.allRelations.filter(
        r => r.tipo_relacion === 'PADRE_HIJO' && r.persona_2_id === targetPerson.id
      );

      this.api.createPersona(payload).subscribe(newPerson => {
        if (parentRels.length > 0) {
          // Vincular a los mismos padres que targetPerson
          let pending = parentRels.length;
          parentRels.forEach(pRel => {
            this.api.createRelacion({
              tipo_relacion: 'PADRE_HIJO',
              persona_1_id: pRel.persona_1_id,
              persona_2_id: newPerson.id
            }).subscribe(() => {
              pending--;
              if (pending === 0) {
                this.isDialogOpen = false;
                this.showToast('✓ Hermano/a agregado/a con los mismos padres');
                this.loadData();
              }
            });
          });
        } else {
          // Si targetPerson no tenía padres registrados aún, se crea un progenitor común
          const parentData: PersonaCreate = {
            nombre: 'Padre/Madre de',
            apellido: `${targetPerson.nombre} y ${newPerson.nombre}`,
            arbol_id: this.arbolId || undefined
          };
          this.api.createPersona(parentData).subscribe(commonParent => {
            this.api.createRelacion({
              tipo_relacion: 'PADRE_HIJO',
              persona_1_id: commonParent.id,
              persona_2_id: targetPerson.id
            }).subscribe(() => {
              this.api.createRelacion({
                tipo_relacion: 'PADRE_HIJO',
                persona_1_id: commonParent.id,
                persona_2_id: newPerson.id
              }).subscribe(() => {
                this.isDialogOpen = false;
                this.showToast('✓ Hermano/a vinculado/a mediante progenitor común');
                this.loadData();
              });
            });
          });
        }
      });
      return;
    }

    this.api.createPersona(payload).subscribe(newPerson => {
      let relationPayload: any = {
        tipo_relacion: event.relativeType === 'PAREJA' ? 'PAREJA' : 'PADRE_HIJO'
      };

      if (event.relativeType === 'PADRE') {
        relationPayload.persona_1_id = newPerson.id;
        relationPayload.persona_2_id = targetPerson.id;
      } else if (event.relativeType === 'HIJO') {
        relationPayload.persona_1_id = targetPerson.id;
        relationPayload.persona_2_id = newPerson.id;
      } else if (event.relativeType === 'PAREJA') {
        relationPayload.persona_1_id = targetPerson.id;
        relationPayload.persona_2_id = newPerson.id;
        if (event.fechaMatrimonio) {
          relationPayload.fecha_inicio = event.fechaMatrimonio;
        }
      }

      this.api.createRelacion(relationPayload).subscribe(() => {
        if (event.relativeType === 'HIJO' && event.otherParentId) {
          const secondRelation = {
            tipo_relacion: 'PADRE_HIJO' as const,
            persona_1_id: event.otherParentId,
            persona_2_id: newPerson.id,
          };
          this.api.createRelacion(secondRelation).subscribe(() => {
            this.isDialogOpen = false;
            this.showToast('✓ Hijo/a agregado con ambos progenitores');
            this.loadData();
          });
        } else {
          this.isDialogOpen = false;
          this.showToast(event.relativeType === 'PAREJA'
            ? '✓ Pareja agregada'
            : event.relativeType === 'HIJO'
              ? '✓ Hijo/a agregado'
              : '✓ Padre/Madre agregado'
          );
          this.loadData();
        }
      });
    });
  }

  onPersonEdited(updatedData: PersonaCreate) {
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
