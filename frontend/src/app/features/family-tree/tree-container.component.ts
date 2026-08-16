import { Component, inject, OnInit, Input, OnChanges, SimpleChanges, ElementRef, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ApiService, Persona, Relacion, PersonaCreate } from '../../core/api.service';
import { PersonNodeComponent, NodeRole } from './person-node.component';
import { AddRelativeDialogComponent } from '../../shared/add-relative-dialog/add-relative-dialog.component';
import { EditPersonDialogComponent } from '../../shared/edit-person-dialog/edit-person-dialog.component';
import { TimelineDialogComponent } from '../../shared/timeline-dialog/timeline-dialog.component';
import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';

export interface AncestorCoupleGroup {
  p1: Persona;
  p2: Persona | null;
  weddingYear: string | null;
  p1Ancestors?: AncestorCoupleGroup | null;
  p2Ancestors?: AncestorCoupleGroup | null;
}

export interface GrandparentLineage {
  gp: Persona;
  ancestors: AncestorCoupleGroup | null;
}

export interface ParentBranch {
  parent: Persona;
  parentSiblings: Persona[];
  grandparents: GrandparentLineage[];
  gpWeddingYear: string | null;
}

@Component({
  selector: 'app-tree-container',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    PersonNodeComponent,
    AddRelativeDialogComponent,
    EditPersonDialogComponent,
    TimelineDialogComponent
  ],
  template: `
    <div
      class="tree-viewport"
      #treeViewport
      (wheel)="onWheel($event)"
      (mousedown)="onMouseDown($event)"
      (mousemove)="onMouseMove($event)"
      (mouseup)="onMouseUp()"
      (mouseleave)="onMouseUp()"
      [class.cursor-grabbing]="isDragging"
    >

      <!-- Toast de éxito -->
      <div class="success-toast" *ngIf="toastVisible">
        {{ toastMessage }}
      </div>

      <!-- Barra de herramientas superior: selector rápido de familiares, exportación y cronología -->
      <div class="tree-toolbar" *ngIf="!loading && allPersons.length > 0">
        
        <div class="toolbar-left-group">
          <div class="member-selector-wrap">
            <label class="member-selector-label">🎯 Centrar en:</label>
            <select
              [ngModel]="rootPerson?.id"
              (ngModelChange)="onRootSelected($event)"
              class="member-select"
            >
              <option *ngFor="let p of allPersons" [value]="p.id">
                {{ p.nombre }} {{ p.apellido }}
              </option>
            </select>
          </div>

          <div class="total-members-badge">
            👥 {{ allPersons.length }} familiares
          </div>
        </div>

        <div class="toolbar-right-group">
          <!-- Botón Línea de Tiempo -->
          <button (click)="isTimelineOpen = true" class="toolbar-btn timeline-btn" title="Ver cronología histórica">
            ⏳ Línea de Tiempo
          </button>

          <!-- Dropdown Exportar -->
          <div class="export-dropdown-wrap">
            <button (click)="toggleExportMenu()" class="toolbar-btn export-btn">
              📥 Exportar ▼
            </button>
            <div *ngIf="isExportMenuOpen" class="export-menu animate-scale-up" (click)="$event.stopPropagation()">
              <button (click)="exportAsImage()" class="export-item" [disabled]="isExporting">
                📷 Descargar como Imagen PNG
              </button>
              <button (click)="exportAsPDF()" class="export-item" [disabled]="isExporting">
                📄 Descargar como PDF listo para imprimir
              </button>
              <button (click)="printTree()" class="export-item" [disabled]="isExporting">
                🖨️ Imprimir Árbol
              </button>
            </div>
          </div>
        </div>

      </div>

      <!-- Loading -->
      <div *ngIf="loading" class="loading-msg">
        Cargando tu historia...
      </div>

      <!-- Exporting Indicator -->
      <div *ngIf="isExporting" class="exporting-overlay">
        <div class="exporting-card">
          <span class="exporting-spinner">⏳</span>
          <p>Generando archivo en alta resolución...</p>
        </div>
      </div>

      <!-- Template recursivo para ancestros (Bisabuelos, Tatarabuelos, Trastatarabuelos, etc.) -->
      <ng-template #ancestorCard let-group="group" let-targetName="targetName">
        <div class="ancestor-origin-card" *ngIf="group">
          
          <div class="ancestor-origin-header">
            <span class="origin-badge">Padres de {{ targetName }}</span>
          </div>

          <div class="ancestor-couple-flex">

            <!-- Columna para P1 (con sus propios ancestros arriba si los tiene) -->
            <div class="ancestor-subcolumn">
              <ng-container *ngIf="group.p1Ancestors">
                <ng-container *ngTemplateOutlet="ancestorCard; context: { group: group.p1Ancestors, targetName: group.p1.nombre }"></ng-container>
                <div class="v-line-ancestor"></div>
              </ng-container>

              <div class="ancestor-unit">
                <app-person-node
                  [person]="group.p1"
                  [role]="'ancestor'"
                  [kinshipLabel]="kinshipLabels.get(group.p1.id) || ''"
                  [parentCount]="getParentCount(group.p1)"
                  (nodeClick)="onPersonNodeClick(group.p1)"
                  (addAction)="openAddRelative(group.p1, $event.type)"
                ></app-person-node>
              </div>
            </div>

            <!-- Conector de matrimonio entre P1 y P2 -->
            <ng-container *ngIf="group.p2">
              <div class="couple-connector-wrap ancestor-connector-wrap">
                <div class="couple-connector-inner">
                  <div class="wedding-badge" *ngIf="group.weddingYear">
                    <span class="wedding-icon">&#x1F48D;</span>
                    <span class="wedding-year">{{ group.weddingYear }}</span>
                  </div>
                  <div class="h-connector couple-h-line"></div>
                </div>
              </div>

              <!-- Columna para P2 (con sus propios ancestros arriba si los tiene) -->
              <div class="ancestor-subcolumn">
                <ng-container *ngIf="group.p2Ancestors">
                  <ng-container *ngTemplateOutlet="ancestorCard; context: { group: group.p2Ancestors, targetName: group.p2.nombre }"></ng-container>
                  <div class="v-line-ancestor"></div>
                </ng-container>

                <div class="ancestor-unit">
                  <app-person-node
                    [person]="group.p2"
                    [role]="'ancestor'"
                    [kinshipLabel]="kinshipLabels.get(group.p2.id) || ''"
                    [parentCount]="getParentCount(group.p2)"
                    (nodeClick)="onPersonNodeClick(group.p2)"
                    (addAction)="openAddRelative(group.p2, $event.type)"
                  ></app-person-node>
                </div>
              </div>
            </ng-container>

          </div>

          <!-- Línea vertical que desciende hacia el descendiente -->
          <div class="v-line-bisabuelos"></div>
        </div>
      </ng-template>

      <!-- Tree Layout with Pan & Zoom Transform -->
      <div
        #treeLayout
        *ngIf="!loading && rootPerson"
        class="tree-layout"
        [style.transform]="'translate(' + panX + 'px, ' + panY + 'px) scale(' + zoomLevel + ')'"
        [style.transform-origin]="'top center'"
        [style.transition]="isDragging ? 'none' : 'transform 0.15s ease-out'"
      >

        <!-- ── ANCESTOR BRANCHES: Tatarabuelos, Bisabuelos, Abuelos y Tíos ── -->
        <div class="ancestor-branches-container" *ngIf="parentBranches.length > 0">
          
          <div class="ancestor-branches-row">
            <ng-container *ngFor="let branch of parentBranches; let bi = index">

              <div class="parent-branch-column">
                
                <!-- Subárbol de Abuelos y Ancestros de este Progenitor -->
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

                      <!-- Columna de linaje del Abuelo/a (Ancestros ARRIBA, Abuelo/a ABAJO) -->
                      <div class="grandparent-lineage-column">
                        
                        <!-- Cuadro recursivo de Ancestros (Bisabuelos, Tatarabuelos, etc.) -->
                        <ng-container *ngIf="gpItem.ancestors">
                          <ng-container *ngTemplateOutlet="ancestorCard; context: { group: gpItem.ancestors, targetName: gpItem.gp.nombre }"></ng-container>
                        </ng-container>

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

                  <!-- Línea vertical hacia la fila del padre/madre y tíos -->
                  <div class="v-line-parent-link"></div>
                </div>

                <!-- Fila de la generación del Progenitor y sus Hermanos (Tíos/Tías) -->
                <div class="parent-generation-row">
                  
                  <!-- Tíos / Tías (Hermanos del Progenitor) -->
                  <div *ngFor="let uncle of branch.parentSiblings" class="parent-sibling-unit">
                    <div class="v-line-short" *ngIf="branch.grandparents.length > 0"></div>
                    <app-person-node
                      [person]="uncle"
                      [role]="'sibling'"
                      [kinshipLabel]="kinshipLabels.get(uncle.id) || 'Tío/a'"
                      [parentCount]="getParentCount(uncle)"
                      (nodeClick)="onPersonNodeClick(uncle)"
                      (addAction)="openAddRelative(uncle, $event.type)"
                    ></app-person-node>
                  </div>

                  <!-- Nodo del Padre / Madre -->
                  <div class="parent-node-unit">
                    <div class="v-line-short" *ngIf="branch.grandparents.length > 0 && branch.parentSiblings.length > 0"></div>
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
      <div *ngIf="!loading && !rootPerson" class="empty-state-card">
        <div style="font-size: 3rem; margin-bottom: 0.8rem;">🌱</div>
        <h3 style="font-family: 'Georgia', serif; font-size: 1.2rem; color: #F8ECD5; font-weight: 700; margin: 0 0 0.5rem; text-transform: uppercase; letter-spacing: 0.08em;">
          Árbol Vacío
        </h3>
        <p style="font-family: 'Georgia', serif; font-size: 0.88rem; color: #DFC090; line-height: 1.6; margin: 0 0 1.8rem;">
          Este árbol aún no tiene integrantes. Agregá a la primera persona para comenzar a construir la genealogía familiar.
        </p>
        <button (click)="openAddFirstPerson()" style="
          font-family: 'Georgia', serif; font-size: 0.85rem; font-weight: 600;
          letter-spacing: 0.12em; text-transform: uppercase; color: #2E1A0C;
          background: linear-gradient(135deg, #EAD5A8, #D4AF7A);
          border: none; padding: 0.8em 1.8em; border-radius: 12px; cursor: pointer;
          box-shadow: 0 4px 18px rgba(0,0,0,0.35); transition: transform 0.2s;
        "
        onmouseover="this.style.transform='translateY(-2px)'"
        onmouseout="this.style.transform='translateY(0)'">
          + Agregar primera persona
        </button>
      </div>

      <!-- Controles flotantes de Zoom y Pan (esquina inferior derecha) -->
      <div class="zoom-floating-controls" *ngIf="!loading && rootPerson">
        <button (click)="zoomIn()" class="zoom-btn" title="Acercar (Zoom In)">+</button>
        <button (click)="zoomOut()" class="zoom-btn" title="Alejar (Zoom Out)">−</button>
        <button (click)="resetZoom()" class="zoom-btn zoom-btn-text" title="Restablecer tamaño (100%)">
          {{ Math.round(zoomLevel * 100) }}%
        </button>
        <button (click)="centerView()" class="zoom-btn zoom-btn-text" title="Centrar vista">
          🎯 Centrar
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
      [availableUncles]="dialogAvailableUncles"
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

    <app-timeline-dialog
      [isOpen]="isTimelineOpen"
      [allPersons]="allPersons"
      (closed)="isTimelineOpen = false"
      (personSelected)="setRoot($event)">
    </app-timeline-dialog>
  `,
  styles: [`
    /* ── Viewport ──────────────────────────────────────── */
    .tree-viewport {
      width: 100%;
      min-height: 80vh;
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: flex-start;
      padding: 24px 16px 50px;
      overflow: hidden;
      position: relative;
      cursor: grab;
      user-select: none;
    }

    .cursor-grabbing {
      cursor: grabbing !important;
    }

    .loading-msg {
      color: #DFC090;
      font-size: 14px;
      font-family: 'Georgia', serif;
      animation: pulse 1.5s ease-in-out infinite;
      margin-top: 3rem;
    }

    /* ── Toolbar superior ───────────────────────────────── */
    .tree-toolbar {
      display: flex;
      align-items: center;
      justify-content: space-between;
      width: 100%;
      max-width: 960px;
      margin: 0 auto 20px;
      padding: 8px 16px;
      background: rgba(30, 20, 13, 0.86);
      backdrop-filter: blur(14px);
      -webkit-backdrop-filter: blur(14px);
      border-radius: 16px;
      border: 1px solid rgba(212, 175, 120, 0.45);
      box-shadow: 0 6px 24px rgba(0, 0, 0, 0.4);
      gap: 12px;
      flex-wrap: wrap;
      z-index: 20;
    }

    .toolbar-left-group, .toolbar-right-group {
      display: flex;
      align-items: center;
      gap: 10px;
      flex-wrap: wrap;
    }

    .member-selector-wrap {
      display: flex;
      align-items: center;
      gap: 8px;
    }

    .member-selector-label {
      font-size: 11px;
      font-weight: 700;
      color: #F8ECD5;
      text-transform: uppercase;
      letter-spacing: 0.06em;
      text-shadow: 0 1px 2px rgba(0,0,0,0.5);
    }

    .member-select {
      background: #FAF3E6;
      border: 1.5px solid #C8A265;
      border-radius: 8px;
      padding: 4px 10px;
      font-size: 12px;
      color: #302010;
      font-family: 'Georgia', serif;
      outline: none;
      cursor: pointer;
      box-shadow: 0 1px 4px rgba(0, 0, 0, 0.15);
      transition: border-color 0.2s;
    }

    .member-select:focus {
      border-color: #D4AF37;
    }

    .total-members-badge {
      font-size: 11px;
      color: #E6CEAA;
      font-weight: 600;
      background: rgba(55, 38, 24, 0.8);
      padding: 4px 10px;
      border-radius: 8px;
      border: 1px solid rgba(212, 175, 120, 0.4);
    }

    .toolbar-btn {
      font-family: 'Georgia', serif;
      font-size: 11.5px;
      font-weight: 600;
      color: #F8ECD5;
      background: rgba(212, 175, 120, 0.2);
      border: 1px solid rgba(212, 175, 120, 0.45);
      border-radius: 8px;
      padding: 5px 12px;
      cursor: pointer;
      transition: all 0.2s;
      white-space: nowrap;
    }

    .toolbar-btn:hover {
      background: #D4AF37;
      color: #2E1A0C;
    }

    .export-dropdown-wrap {
      position: relative;
    }

    .export-menu {
      position: absolute;
      top: calc(100% + 6px);
      right: 0;
      background: rgba(36, 24, 15, 0.96);
      border: 1.5px solid rgba(212, 175, 120, 0.5);
      border-radius: 12px;
      box-shadow: 0 10px 30px rgba(0, 0, 0, 0.5);
      min-width: 220px;
      padding: 6px;
      display: flex;
      flex-direction: column;
      gap: 4px;
      z-index: 50;
    }

    .export-item {
      background: transparent;
      border: none;
      color: #F8ECD5;
      font-family: 'Georgia', serif;
      font-size: 11.5px;
      text-align: left;
      padding: 8px 10px;
      border-radius: 8px;
      cursor: pointer;
      transition: all 0.2s;
    }

    .export-item:hover {
      background: rgba(212, 175, 120, 0.3);
      color: #FFE6B0;
    }

    /* ── Exporting Overlay ── */
    .exporting-overlay {
      position: fixed;
      inset: 0;
      z-index: 100;
      background: rgba(10, 6, 4, 0.7);
      backdrop-filter: blur(6px);
      display: flex;
      align-items: center;
      justify-content: center;
    }

    .exporting-card {
      background: rgba(40, 26, 16, 0.95);
      border: 1.5px solid #D4AF37;
      border-radius: 18px;
      padding: 1.5rem 2rem;
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 10px;
      color: #F8ECD5;
      font-family: 'Georgia', serif;
      box-shadow: 0 15px 40px rgba(0,0,0,0.6);
    }

    .exporting-spinner {
      font-size: 2.2rem;
      animation: spin 2s linear infinite;
    }

    @keyframes spin {
      0% { transform: rotate(0deg); }
      100% { transform: rotate(360deg); }
    }

    /* ── Floating Zoom Controls ── */
    .zoom-floating-controls {
      position: fixed;
      bottom: 24px;
      right: 24px;
      z-index: 40;
      display: flex;
      align-items: center;
      gap: 6px;
      background: rgba(30, 20, 13, 0.88);
      border: 1.5px solid rgba(212, 175, 120, 0.45);
      border-radius: 14px;
      padding: 6px 10px;
      box-shadow: 0 6px 20px rgba(0, 0, 0, 0.45);
      backdrop-filter: blur(10px);
    }

    .zoom-btn {
      width: 30px;
      height: 30px;
      background: rgba(212, 175, 120, 0.2);
      border: 1px solid rgba(212, 175, 120, 0.35);
      border-radius: 8px;
      color: #F8ECD5;
      font-weight: 700;
      font-size: 15px;
      display: flex;
      align-items: center;
      justify-content: center;
      cursor: pointer;
      transition: all 0.2s;
    }

    .zoom-btn:hover {
      background: #D4AF37;
      color: #2E1A0C;
    }

    .zoom-btn-text {
      width: auto;
      padding: 0 8px;
      font-size: 11px;
      font-family: 'Georgia', serif;
    }

    /* Toast de éxito */
    .success-toast {
      position: fixed;
      top: 80px;
      right: 24px;
      z-index: 100;
      background: #3B6B40;
      color: white;
      padding: 8px 16px;
      border-radius: 10px;
      font-size: 12px;
      font-weight: 500;
      box-shadow: 0 4px 16px rgba(0,0,0,0.25);
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
      transform-origin: top center;
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
      gap: 16px;
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
      gap: 10px;
    }

    .grandparent-lineage-column {
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: flex-end;
    }

    /* ── Cuadro de Ancestros por Origen (Bisabuelos, Tatarabuelos, etc.) ── */
    .ancestor-origin-card {
      display: flex;
      flex-direction: column;
      align-items: center;
      background: rgba(28, 19, 12, 0.65);
      border: 1.5px dashed rgba(212, 175, 120, 0.6);
      border-radius: 14px;
      padding: 6px 8px 0 8px;
      margin-bottom: 0;
      box-shadow: 0 4px 16px rgba(0,0,0,0.25);
    }

    .ancestor-origin-header {
      margin-bottom: 4px;
    }

    .origin-badge {
      font-size: 8px;
      font-weight: 700;
      letter-spacing: 0.06em;
      text-transform: uppercase;
      color: #F8ECD5;
      background: rgba(212, 175, 120, 0.25);
      border: 1px solid rgba(212, 175, 120, 0.6);
      border-radius: 999px;
      padding: 1px 6px;
    }

    .ancestor-couple-flex {
      display: flex;
      flex-direction: row;
      align-items: flex-end;
      justify-content: center;
      gap: 0;
    }

    .ancestor-subcolumn {
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: flex-end;
    }

    .ancestor-connector-wrap {
      align-self: flex-end;
      margin-bottom: 30px;
    }

    .v-line-ancestor {
      width: 2px;
      height: 12px;
      background: #D4AF37;
      box-shadow: 0 0 3px rgba(212, 175, 55, 0.4);
      margin-top: 4px;
      align-self: center;
    }

    .v-line-bisabuelos {
      width: 2px;
      height: 14px;
      background: #D4AF37;
      box-shadow: 0 0 3px rgba(212, 175, 55, 0.4);
      margin-top: 4px;
      align-self: center;
    }

    .v-line-parent-link {
      width: 2px;
      height: 18px;
      background: #D4AF37;
      box-shadow: 0 0 3px rgba(212, 175, 55, 0.4);
      align-self: center;
    }

    .grandparent-node-unit, .parent-node-unit, .ancestor-unit {
      display: flex;
      flex-direction: column;
      align-items: center;
    }

    .parent-generation-row {
      display: flex;
      flex-direction: row;
      align-items: flex-start;
      justify-content: center;
      gap: 8px;
    }

    .parent-sibling-unit {
      display: flex;
      flex-direction: column;
      align-items: center;
    }

    .gp-couple-connector-wrap {
      display: flex;
      align-items: center;
      align-self: flex-end;
      margin-bottom: 35px;
    }

    .gp-h-line {
      width: 28px;
    }

    .parents-mid-connector-wrap {
      display: flex;
      align-items: center;
      align-self: flex-end;
      margin-bottom: 35px;
    }

    .parents-h-line {
      width: 32px;
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
      background: #D4AF37;
      box-shadow: 0 0 4px rgba(212, 175, 55, 0.45);
    }

    .center-row {
      align-items: flex-start;
      gap: 0;
    }

    .sibling-unit {
      display: flex;
      flex-direction: column;
      align-items: center;
      margin: 0 10px;
    }

    .main-couple-unit {
      display: flex;
      flex-direction: column;
      align-items: center;
      margin: 0 10px;
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
      gap: 14px;
      margin-top: 0;
    }

    .child-unit {
      display: flex;
      flex-direction: column;
      align-items: center;
    }

    /* ── Connectors ─────────────────────────────────────── */
    .h-connector {
      height: 2px;
      background: #D4AF37;
      box-shadow: 0 0 4px rgba(212, 175, 55, 0.45);
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
      gap: 2px;
      background: rgba(32, 22, 14, 0.9);
      border: 1px solid #D4AF37;
      color: #F5E6CC;
      box-shadow: 0 2px 8px rgba(0,0,0,0.3);
      border-radius: 8px;
      padding: 1px 5px;
      margin-bottom: 3px;
      white-space: nowrap;
    }

    .wedding-icon {
      font-size: 10px;
    }

    .wedding-year {
      font-size: 9.5px;
      color: #E6C88B;
      font-weight: 600;
      letter-spacing: 0.02em;
    }

    .couple-h-line {
      width: 28px;
    }

    .connector-to-root {
      display: flex;
      justify-content: center;
      margin: 0;
    }

    .v-line-center {
      width: 2px;
      height: 20px;
      background: #D4AF37;
      box-shadow: 0 0 4px rgba(212, 175, 55, 0.45);
    }

    .connector-to-children {
      display: flex;
      justify-content: center;
      margin-top: 0;
      position: relative;
    }

    .v-line-short {
      width: 2px;
      height: 14px;
      background: #D4AF37;
      box-shadow: 0 0 4px rgba(212, 175, 55, 0.45);
      align-self: center;
    }

    .children-h-bar {
      position: absolute;
      top: 0;
      left: 15%;
      right: 15%;
      height: 2px;
      background: #D4AF37;
      box-shadow: 0 0 4px rgba(212, 175, 55, 0.45);
    }

    .empty-state-card {
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      padding: 3.5rem 2rem;
      text-align: center;
      background: rgba(30, 20, 13, 0.85);
      backdrop-filter: blur(14px);
      -webkit-backdrop-filter: blur(14px);
      border-radius: 24px;
      border: 1.5px dashed rgba(212, 175, 120, 0.5);
      max-width: 420px;
      margin: 3rem auto;
      box-shadow: 0 10px 30px rgba(0,0,0,0.4);
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
  @ViewChild('treeLayout') treeLayoutEl?: ElementRef<HTMLElement>;
  @ViewChild('treeViewport') treeViewportEl?: ElementRef<HTMLElement>;

  Math = Math;

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

  // Pan & Zoom State
  zoomLevel = 1;
  panX = 0;
  panY = 0;
  isDragging = false;
  dragStartX = 0;
  dragStartY = 0;

  // Export State
  isExportMenuOpen = false;
  isExporting = false;

  // Timeline State
  isTimelineOpen = false;

  // Toast de éxito
  toastMessage = '';
  toastVisible = false;

  // Dialog State
  isDialogOpen = false;
  dialogTargetPerson: Persona | null = null;
  dialogRelativeType: 'PADRE' | 'PAREJA' | 'HIJO' | 'HERMANO' | 'PRIMO' = 'PADRE';
  dialogPartners: Persona[] = [];
  dialogTargetParents: Persona[] = [];
  dialogAvailableUncles: Persona[] = [];

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
      this.resetZoom();
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

  onRootSelected(personId: string) {
    const target = this.allPersons.find(p => p.id === personId);
    if (target) {
      this.setRoot(target);
    }
  }

  /* ── Pan & Zoom Methods ────────────────────────────────────────── */
  zoomIn() {
    this.zoomLevel = Math.min(2.0, +(this.zoomLevel + 0.15).toFixed(2));
  }

  zoomOut() {
    this.zoomLevel = Math.max(0.35, +(this.zoomLevel - 0.15).toFixed(2));
  }

  resetZoom() {
    this.zoomLevel = 1;
    this.panX = 0;
    this.panY = 0;
  }

  centerView() {
    this.panX = 0;
    this.panY = 0;
  }

  onWheel(event: WheelEvent) {
    event.preventDefault();
    const delta = event.deltaY < 0 ? 0.1 : -0.1;
    const newZoom = Math.min(2.0, Math.max(0.35, +(this.zoomLevel + delta).toFixed(2)));
    this.zoomLevel = newZoom;
  }

  onMouseDown(event: MouseEvent) {
    // Solo iniciar drag si no se hace clic sobre un botón o selector interactivo
    const target = event.target as HTMLElement;
    if (target.closest('button') || target.closest('select') || target.closest('input') || target.closest('.node-card')) {
      return;
    }
    this.isDragging = true;
    this.dragStartX = event.clientX - this.panX;
    this.dragStartY = event.clientY - this.panY;
  }

  onMouseMove(event: MouseEvent) {
    if (!this.isDragging) return;
    this.panX = event.clientX - this.dragStartX;
    this.panY = event.clientY - this.dragStartY;
  }

  onMouseUp() {
    this.isDragging = false;
  }

  /* ── Export Methods (PNG / PDF / Print) ────────────────────────── */
  toggleExportMenu() {
    this.isExportMenuOpen = !this.isExportMenuOpen;
  }

  async exportAsImage() {
    this.isExportMenuOpen = false;
    if (!this.treeLayoutEl) return;
    this.isExporting = true;

    try {
      // Guardar transformación actual y resetear para captura limpia
      const origTransform = this.treeLayoutEl.nativeElement.style.transform;
      this.treeLayoutEl.nativeElement.style.transform = 'none';

      const canvas = await html2canvas(this.treeLayoutEl.nativeElement, {
        scale: 2,
        backgroundColor: '#23180F',
        useCORS: true,
        logging: false
      });

      // Restaurar transformación
      this.treeLayoutEl.nativeElement.style.transform = origTransform;

      const link = document.createElement('a');
      link.download = `Arbol_Genealogico_${this.rootPerson?.nombre || 'Familia'}.png`;
      link.href = canvas.toDataURL('image/png');
      link.click();
      this.showToast('✓ Imagen PNG descargada en alta resolución');
    } catch (err) {
      console.error('Error al exportar imagen:', err);
      this.showToast('⚠️ No se pudo generar la imagen');
    } finally {
      this.isExporting = false;
    }
  }

  async exportAsPDF() {
    this.isExportMenuOpen = false;
    if (!this.treeLayoutEl) return;
    this.isExporting = true;

    try {
      const origTransform = this.treeLayoutEl.nativeElement.style.transform;
      this.treeLayoutEl.nativeElement.style.transform = 'none';

      const canvas = await html2canvas(this.treeLayoutEl.nativeElement, {
        scale: 2,
        backgroundColor: '#23180F',
        useCORS: true,
        logging: false
      });

      this.treeLayoutEl.nativeElement.style.transform = origTransform;

      const imgData = canvas.toDataURL('image/jpeg', 0.95);
      const isLandscape = canvas.width > canvas.height;
      const pdf = new jsPDF({
        orientation: isLandscape ? 'landscape' : 'portrait',
        unit: 'px',
        format: [canvas.width, canvas.height]
      });

      pdf.addImage(imgData, 'JPEG', 0, 0, canvas.width, canvas.height);
      pdf.save(`Arbol_Genealogico_${this.rootPerson?.nombre || 'Familia'}.pdf`);
      this.showToast('✓ Archivo PDF generado exitosamente');
    } catch (err) {
      console.error('Error al exportar PDF:', err);
      this.showToast('⚠️ No se pudo generar el PDF');
    } finally {
      this.isExporting = false;
    }
  }

  printTree() {
    this.isExportMenuOpen = false;
    window.print();
  }

  /** Construye recursivamente el grupo de ancestros para cualquier persona */
  buildAncestorGroup(person: Persona): AncestorCoupleGroup | null {
    const parentIds = this.allRelations
      .filter(r => r.tipo_relacion === 'PADRE_HIJO' && r.persona_2_id === person.id)
      .map(r => r.persona_1_id);
    let directParents = this.allPersons.filter(p => parentIds.includes(p.id));

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

    if (directParents.length === 0) {
      return null;
    }

    directParents.sort((a, b) => {
      if (a.genero === 'M' && b.genero !== 'M') return -1;
      if (a.genero !== 'M' && b.genero === 'M') return 1;
      return 0;
    });

    const p1 = directParents[0];
    const p2 = directParents.length > 1 ? directParents[1] : null;

    let weddingYear: string | null = null;
    if (p2) {
      const pairRel = this.allRelations.find(
        r => r.tipo_relacion === 'PAREJA' &&
          ((r.persona_1_id === p1.id && r.persona_2_id === p2.id) ||
           (r.persona_1_id === p2.id && r.persona_2_id === p1.id))
      );
      if (pairRel?.fecha_inicio) {
        try {
          weddingYear = new Date(pairRel.fecha_inicio + 'T00:00:00').getFullYear().toString();
        } catch { weddingYear = null; }
      }
    }

    return {
      p1,
      p2,
      weddingYear,
      p1Ancestors: this.buildAncestorGroup(p1),
      p2Ancestors: p2 ? this.buildAncestorGroup(p2) : null
    };
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

    // 2. Para cada padre, construir su rama de abuelos, ancestros y sus hermanos (Tíos/Tías)
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

      // Hermanos del padre/madre (Tíos y Tías del nodo central)
      let parentSiblings: Persona[] = [];
      const allGpIds = directGps.map(g => g.id);
      if (allGpIds.length > 0) {
        const uncleIds = Array.from(new Set(
          this.allRelations
            .filter(r => r.tipo_relacion === 'PADRE_HIJO' && allGpIds.includes(r.persona_1_id) && r.persona_2_id !== parent.id)
            .map(r => r.persona_2_id)
        ));
        parentSiblings = this.allPersons.filter(p => uncleIds.includes(p.id));
      }

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

      // Para cada abuelo, buscar sus ancestros recursivamente (Bisabuelos, Tatarabuelos, etc.)
      const gpLineages: GrandparentLineage[] = [];

      directGps.forEach(gp => {
        const ancestors = this.buildAncestorGroup(gp);
        gpLineages.push({ gp, ancestors });
      });

      this.parentBranches.push({
        parent,
        parentSiblings,
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
      const sideStr = ` ${lado}`;

      // Asignar etiquetas a tíos/tías (hermanos del progenitor)
      branch.parentSiblings.forEach(uncle => {
        const uncleLabel = uncle.genero === 'F'
          ? `Tía${sideStr}`
          : `Tío${sideStr}`;
        this.kinshipLabels.set(uncle.id, uncleLabel);
      });

      branch.grandparents.forEach(gpLineage => {
        const gp = gpLineage.gp;
        this.kinshipLabels.set(gp.id, g(gp, `Abuela${sideStr}`, `Abuelo${sideStr}`, `Abuelo/a${sideStr}`));

        if (gpLineage.ancestors) {
          this.assignAncestorKinship(gpLineage.ancestors, 3, sideStr);
        }
      });
    });
  }

  /** Asigna etiquetas a ancestros recursivamente (Bisabuelos depth=3, Tatarabuelos depth=4, etc.) */
  assignAncestorKinship(group: AncestorCoupleGroup, depth: number, sideStr: string) {
    let labelPrefix = 'Ancestro';
    if (depth === 2) labelPrefix = 'Abuelo';
    else if (depth === 3) labelPrefix = 'Bisabuelo';
    else if (depth === 4) labelPrefix = 'Tatarabuelo';
    else if (depth === 5) labelPrefix = 'Trastatarabuelo';
    else if (depth > 5) labelPrefix = `${depth}º Ancestro`;

    const p1Label = group.p1.genero === 'M'
      ? `${labelPrefix}${sideStr}`
      : `${labelPrefix.replace(/o$/, 'a')}${sideStr}`;
    this.kinshipLabels.set(group.p1.id, p1Label);

    if (group.p1Ancestors) {
      this.assignAncestorKinship(group.p1Ancestors, depth + 1, sideStr);
    }

    if (group.p2) {
      const p2Label = group.p2.genero === 'F'
        ? `${labelPrefix.replace(/o$/, 'a')}${sideStr}`
        : `${labelPrefix}${sideStr}`;
      this.kinshipLabels.set(group.p2.id, p2Label);

      if (group.p2Ancestors) {
        this.assignAncestorKinship(group.p2Ancestors, depth + 1, sideStr);
      }
    }
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

  openAddRelative(person: Persona, type: 'PADRE' | 'PAREJA' | 'HIJO' | 'HERMANO' | 'PRIMO') {
    this.dialogTargetPerson = person;
    this.dialogRelativeType = type;
    this.dialogPartners = [];
    this.dialogTargetParents = [];
    this.dialogAvailableUncles = [];

    if (type === 'HIJO') {
      this.dialogPartners = this.getPartnersOf(person);
    } else if (type === 'HERMANO') {
      const parentIds = this.allRelations
        .filter(r => r.tipo_relacion === 'PADRE_HIJO' && r.persona_2_id === person.id)
        .map(r => r.persona_1_id);
      this.dialogTargetParents = this.allPersons.filter(p => parentIds.includes(p.id));
    } else if (type === 'PRIMO') {
      // Buscar padres de person
      const parentIds = this.allRelations
        .filter(r => r.tipo_relacion === 'PADRE_HIJO' && r.persona_2_id === person.id)
        .map(r => r.persona_1_id);
      // Buscar abuelos de person
      const gpIds = this.allRelations
        .filter(r => r.tipo_relacion === 'PADRE_HIJO' && parentIds.includes(r.persona_2_id))
        .map(r => r.persona_1_id);
      // Buscar tíos (hijos de los abuelos que no son el padre directo ni person)
      if (gpIds.length > 0) {
        const uncleIds = Array.from(new Set(
          this.allRelations
            .filter(r => r.tipo_relacion === 'PADRE_HIJO' && gpIds.includes(r.persona_1_id) && !parentIds.includes(r.persona_2_id) && r.persona_2_id !== person.id)
            .map(r => r.persona_2_id)
        ));
        this.dialogAvailableUncles = this.allPersons.filter(p => uncleIds.includes(p.id));
      }
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
    relativeType: 'PADRE' | 'PAREJA' | 'HIJO' | 'HERMANO' | 'PRIMO',
    fechaMatrimonio?: string,
    otherParentId?: string,
    selectedUncleId?: string,
    nuevoTioNombre?: string
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

    // Manejo de PRIMO
    if (event.relativeType === 'PRIMO') {
      this.api.createPersona(payload).subscribe(newCousin => {
        if (event.selectedUncleId) {
          // Vincular directamente al tío seleccionado
          this.api.createRelacion({
            tipo_relacion: 'PADRE_HIJO',
            persona_1_id: event.selectedUncleId,
            persona_2_id: newCousin.id
          }).subscribe(() => {
            this.isDialogOpen = false;
            this.showToast('✓ Primo/a vinculado/a mediante su progenitor (Tío/a)');
            this.loadData();
          });
        } else {
          // Crear un nuevo Tío/Tía para el primo
          const tioNombre = event.nuevoTioNombre && event.nuevoTioNombre.trim()
            ? event.nuevoTioNombre.trim()
            : `Tío/a de ${targetPerson.nombre}`;

          const tioData: PersonaCreate = {
            nombre: tioNombre,
            apellido: targetPerson.apellido,
            arbol_id: this.arbolId || undefined
          };

          this.api.createPersona(tioData).subscribe(newUncle => {
            // Relación Tío -> Primo
            this.api.createRelacion({
              tipo_relacion: 'PADRE_HIJO',
              persona_1_id: newUncle.id,
              persona_2_id: newCousin.id
            }).subscribe(() => {
              // Si targetPerson tiene abuelos, vincular los abuelos -> nuevo Tío
              const parentIds = this.allRelations
                .filter(r => r.tipo_relacion === 'PADRE_HIJO' && r.persona_2_id === targetPerson.id)
                .map(r => r.persona_1_id);
              const gpIds = this.allRelations
                .filter(r => r.tipo_relacion === 'PADRE_HIJO' && parentIds.includes(r.persona_2_id))
                .map(r => r.persona_1_id);

              if (gpIds.length > 0) {
                let pending = gpIds.length;
                gpIds.forEach(gpId => {
                  this.api.createRelacion({
                    tipo_relacion: 'PADRE_HIJO',
                    persona_1_id: gpId,
                    persona_2_id: newUncle.id
                  }).subscribe(() => {
                    pending--;
                    if (pending === 0) {
                      this.isDialogOpen = false;
                      this.showToast('✓ Primo/a y Tío/a agregados a la rama familiar');
                      this.loadData();
                    }
                  });
                });
              } else {
                this.isDialogOpen = false;
                this.showToast('✓ Primo/a y Tío/a agregados a la rama familiar');
                this.loadData();
              }
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
