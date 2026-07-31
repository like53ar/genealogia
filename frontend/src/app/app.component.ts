import { Component, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ApiService, Arbol } from './core/api.service';
import { TreeContainerComponent } from './features/family-tree/tree-container.component';

type Vista = 'home' | 'tree';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [CommonModule, FormsModule, TreeContainerComponent],
  template: `
    <main class="w-full min-h-screen font-zen overflow-hidden relative"
          style="background-image: url('zen-bg.png'); background-size: cover; background-position: center; background-attachment: fixed; min-height: 100vh;">
      
      <!-- Background overlay -->
      <div style="position: absolute; inset: 0; background: rgba(240,238,232,0.12); z-index: 0;"></div>

      <!-- ═══════════ PANTALLA DE INICIO ═══════════ -->
      <div *ngIf="vista === 'home'"
        style="
          position: relative;
          z-index: 10;
          min-height: 100vh;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          padding: 2rem;
        ">

        <!-- Título principal -->
        <div style="display: flex; flex-direction: column; align-items: center; margin-bottom: 3rem;">
          <h1 style="
            font-family: 'Georgia', 'Times New Roman', serif;
            font-size: clamp(2rem, 5.5vw, 4.2rem);
            font-weight: 700;
            letter-spacing: 0.22em;
            color: #3b3a36;
            text-shadow: 0 2px 24px rgba(255,255,255,0.92), 0 1px 4px rgba(120,110,90,0.18);
            margin: 0;
            padding: 0.55em 1.6em;
            background: rgba(255,255,255,0.48);
            backdrop-filter: blur(12px);
            -webkit-backdrop-filter: blur(12px);
            border-radius: 20px;
            border: 1px solid rgba(255,255,255,0.7);
            text-transform: uppercase;
            white-space: nowrap;
            text-align: center;
          ">ÁRBOL GENEALÓGICO</h1>
          
          <div style="height: 3px; width: 160px; background: linear-gradient(90deg, transparent, #8a9a6a, transparent); margin-top: 1.2rem; border-radius: 2px;"></div>
          
          <p style="
            margin-top: 0.9rem;
            font-family: 'Georgia', serif;
            font-size: 0.9rem;
            color: #6b6a62;
            letter-spacing: 0.2em;
            text-transform: uppercase;
            background: rgba(255,255,255,0.35);
            padding: 0.35em 1.4em;
            border-radius: 999px;
            backdrop-filter: blur(4px);
            -webkit-backdrop-filter: blur(4px);
            border: 1px solid rgba(255,255,255,0.45);
          ">Tu historia familiar</p>
        </div>

        <!-- Botones de acción -->
        <div style="
          display: flex;
          flex-direction: column;
          gap: 1rem;
          align-items: stretch;
          width: 100%;
          max-width: 320px;
        ">
          <!-- CREAR ÁRBOL -->
          <button (click)="abrirModalCrear()" class="btn-zen-accion" id="btn-crear-arbol">
            <span style="font-size: 1.3rem;">🌱</span>
            <span style="flex: 1; text-align: center; letter-spacing: 0.18em;">CREAR ÁRBOL</span>
            <span style="opacity: 0.6; font-size: 1.1rem;">›</span>
          </button>

          <!-- EDITAR ÁRBOL -->
          <button (click)="abrirArbol()" class="btn-zen-accion btn-zen-editar" id="btn-editar-arbol">
            <span style="font-size: 1.3rem;">✏️</span>
            <span style="flex: 1; text-align: center; letter-spacing: 0.18em;">EDITAR ÁRBOL</span>
            <span style="opacity: 0.6; font-size: 1.1rem;">›</span>
          </button>

          <!-- BORRAR ÁRBOL -->
          <button (click)="confirmarBorrado()" class="btn-zen-accion btn-zen-borrar" id="btn-borrar-arbol">
            <span style="font-size: 1.3rem;">🍂</span>
            <span style="flex: 1; text-align: center; letter-spacing: 0.18em;">BORRAR ÁRBOL</span>
            <span style="opacity: 0.6; font-size: 1.1rem;">›</span>
          </button>
        </div>

        <!-- Ornamento decorativo -->
        <div style="margin-top: 3rem; display: flex; align-items: center; gap: 0.8rem; opacity: 0.45;">
          <div style="height: 1px; width: 55px; background: #8a9a6a;"></div>
          <span style="font-family: 'Georgia', serif; color: #8a9a6a; font-size: 1.1rem;">❧</span>
          <div style="height: 1px; width: 55px; background: #8a9a6a;"></div>
        </div>
      </div>

      <!-- ═══════════ VISTA DEL ÁRBOL ═══════════ -->
      <div *ngIf="vista === 'tree'" style="position: relative; z-index: 10; min-height: 100vh;">
        <header style="
          position: fixed; top: 0; left: 0; right: 0; z-index: 30;
          padding: 0.8rem 1.5rem;
          display: flex; align-items: center; justify-content: space-between;
          background: rgba(255,255,255,0.38);
          backdrop-filter: blur(12px); -webkit-backdrop-filter: blur(12px);
          border-bottom: 1px solid rgba(255,255,255,0.55);
        ">
          <div style="display: flex; flex-direction: column;">
            <h1 style="font-family: 'Georgia', serif; font-size: 1.2rem; font-weight: 700; letter-spacing: 0.18em; color: #3b3a36; margin: 0; text-transform: uppercase;">
              ÁRBOL GENEALÓGICO
            </h1>
            <span *ngIf="arbolActivo" style="font-family: 'Georgia', serif; font-size: 0.78rem; color: #7a7368; letter-spacing: 0.1em; margin-top: 0.1rem;">
              {{ arbolActivo.nombre }}
            </span>
          </div>
          <button (click)="volverInicio()" id="btn-volver-inicio" style="
            font-family: 'Georgia', serif; font-size: 0.78rem; letter-spacing: 0.12em;
            text-transform: uppercase; color: #6b6a62;
            background: rgba(255,255,255,0.45); border: 1px solid rgba(139,130,110,0.3);
            padding: 0.4em 1.2em; border-radius: 999px; cursor: pointer; transition: all 0.2s;
          "
          onmouseover="this.style.background='rgba(255,255,255,0.7)'"
          onmouseout="this.style.background='rgba(255,255,255,0.45)'">
            ← Inicio
          </button>
        </header>
        <div style="padding-top: 64px;">
          <app-tree-container></app-tree-container>
        </div>
      </div>

      <!-- ═══════════ MODAL: CREAR ÁRBOL ═══════════ -->
      <div *ngIf="mostrarModalCrear"
        style="
          position: fixed; inset: 0; z-index: 100;
          background: rgba(55,50,40,0.52);
          backdrop-filter: blur(6px); -webkit-backdrop-filter: blur(6px);
          display: flex; align-items: center; justify-content: center; padding: 1rem;
        "
        (click)="cerrarModalCrear()">
        
        <div style="
          background: rgba(252,250,245,0.96);
          backdrop-filter: blur(16px); -webkit-backdrop-filter: blur(16px);
          border: 1px solid rgba(255,255,255,0.8);
          border-radius: 24px;
          padding: 2.5rem 2.5rem 2rem;
          max-width: 460px; width: 100%;
          box-shadow: 0 16px 56px rgba(70,60,40,0.22);
          position: relative;
        "
        (click)="$event.stopPropagation()">

          <!-- Cerrar -->
          <button (click)="cerrarModalCrear()" style="
            position: absolute; top: 1.2rem; right: 1.2rem;
            background: rgba(200,195,185,0.35); border: none;
            width: 30px; height: 30px; border-radius: 50%;
            font-size: 1rem; color: #7a7368; cursor: pointer;
            display: flex; align-items: center; justify-content: center;
            transition: background 0.2s;
          "
          onmouseover="this.style.background='rgba(200,195,185,0.6)'"
          onmouseout="this.style.background='rgba(200,195,185,0.35)'">✕</button>

          <!-- Encabezado del modal -->
          <div style="text-align: center; margin-bottom: 2rem;">
            <div style="font-size: 2.2rem; margin-bottom: 0.6rem;">🌳</div>
            <h2 style="
              font-family: 'Georgia', 'Times New Roman', serif;
              font-size: 1.35rem; font-weight: 700;
              letter-spacing: 0.16em; color: #3b3a36;
              text-transform: uppercase; margin: 0 0 0.4rem;
            ">Nuevo Árbol Familiar</h2>
            <div style="height: 2px; width: 80px; background: linear-gradient(90deg, transparent, #8a9a6a, transparent); margin: 0 auto;"></div>
            <p style="
              margin-top: 0.7rem; font-family: 'Georgia', serif;
              font-size: 0.85rem; color: #8a8278; letter-spacing: 0.06em; line-height: 1.5;
            ">Ingresá el nombre de la familia para comenzar a construir tu historia.</p>
          </div>

          <!-- Formulario -->
          <form (ngSubmit)="guardarArbol()" #formArbol="ngForm">
            
            <!-- Campo: Nombre de la familia -->
            <div style="margin-bottom: 1.3rem;">
              <label style="
                display: block; font-family: 'Georgia', serif;
                font-size: 0.75rem; letter-spacing: 0.14em;
                text-transform: uppercase; color: #6b6a62; margin-bottom: 0.5rem;
              ">Nombre de la familia *</label>
              <input
                type="text"
                id="input-nombre-familia"
                name="nombreFamilia"
                [(ngModel)]="nuevoArbol.nombre"
                required
                placeholder="Ej: Familia García"
                style="
                  width: 100%; box-sizing: border-box;
                  padding: 0.75em 1em;
                  font-family: 'Georgia', serif; font-size: 1rem;
                  color: #3b3a36;
                  background: rgba(255,255,255,0.7);
                  border: 1.5px solid rgba(138,154,106,0.4);
                  border-radius: 10px;
                  outline: none; transition: border-color 0.2s, box-shadow 0.2s;
                "
                onfocus="this.style.borderColor='rgba(107,124,85,0.7)'; this.style.boxShadow='0 0 0 3px rgba(138,154,106,0.15)'"
                onblur="this.style.borderColor='rgba(138,154,106,0.4)'; this.style.boxShadow='none'"/>
            </div>

            <!-- Campo: Descripción (opcional) -->
            <div style="margin-bottom: 2rem;">
              <label style="
                display: block; font-family: 'Georgia', serif;
                font-size: 0.75rem; letter-spacing: 0.14em;
                text-transform: uppercase; color: #6b6a62; margin-bottom: 0.5rem;
              ">Descripción <span style="opacity: 0.6; font-size: 0.85em;">(opcional)</span></label>
              <textarea
                name="descripcion"
                [(ngModel)]="nuevoArbol.descripcion"
                rows="3"
                placeholder="Origen, región, época, datos de interés..."
                style="
                  width: 100%; box-sizing: border-box;
                  padding: 0.75em 1em;
                  font-family: 'Georgia', serif; font-size: 0.9rem;
                  color: #3b3a36;
                  background: rgba(255,255,255,0.7);
                  border: 1.5px solid rgba(138,154,106,0.4);
                  border-radius: 10px;
                  outline: none; resize: vertical;
                  transition: border-color 0.2s, box-shadow 0.2s;
                "
                onfocus="this.style.borderColor='rgba(107,124,85,0.7)'; this.style.boxShadow='0 0 0 3px rgba(138,154,106,0.15)'"
                onblur="this.style.borderColor='rgba(138,154,106,0.4)'; this.style.boxShadow='none'"></textarea>
            </div>

            <!-- Mensaje de error -->
            <div *ngIf="errorCrear" style="
              margin-bottom: 1rem; padding: 0.6em 1em;
              background: rgba(154,80,70,0.1); border: 1px solid rgba(154,80,70,0.3);
              border-radius: 8px; font-family: 'Georgia', serif;
              font-size: 0.85rem; color: #7a3a30; text-align: center;
            ">{{ errorCrear }}</div>

            <!-- Botones del formulario -->
            <div style="display: flex; gap: 0.8rem;">
              <button type="button" (click)="cerrarModalCrear()" style="
                flex: 1; font-family: 'Georgia', serif; font-size: 0.85rem;
                letter-spacing: 0.1em; text-transform: uppercase;
                color: #7a7368; background: rgba(255,255,255,0.65);
                border: 1px solid rgba(139,130,110,0.35);
                padding: 0.75em; border-radius: 10px; cursor: pointer; transition: all 0.2s;
              "
              onmouseover="this.style.background='rgba(255,255,255,0.9)'"
              onmouseout="this.style.background='rgba(255,255,255,0.65)'">
                Cancelar
              </button>

              <button type="submit" [disabled]="!nuevoArbol.nombre.trim() || guardando" style="
                flex: 2; font-family: 'Georgia', serif; font-size: 0.9rem;
                font-weight: 600; letter-spacing: 0.12em; text-transform: uppercase;
                color: white;
                background: linear-gradient(135deg, #7a8c5a, #5a6a42);
                border: none; padding: 0.75em; border-radius: 10px;
                cursor: pointer; transition: all 0.2s;
                box-shadow: 0 3px 16px rgba(107,124,85,0.35);
                opacity: 1;
              "
              [style.opacity]="(!nuevoArbol.nombre.trim() || guardando) ? '0.55' : '1'"
              onmouseover="if(!this.disabled) this.style.transform='translateY(-1px)'"
              onmouseout="this.style.transform='translateY(0)'">
                {{ guardando ? 'Guardando...' : '🌱 Crear Árbol' }}
              </button>
            </div>
          </form>
        </div>
      </div>

      <!-- ═══════════ MODAL: CONFIRMACIÓN BORRADO ═══════════ -->
      <div *ngIf="mostrarConfirmBorrado"
        style="
          position: fixed; inset: 0; z-index: 100;
          background: rgba(55,50,40,0.5);
          backdrop-filter: blur(5px); -webkit-backdrop-filter: blur(5px);
          display: flex; align-items: center; justify-content: center; padding: 1rem;
        ">
        <div style="
          background: rgba(252,250,245,0.94);
          backdrop-filter: blur(14px); -webkit-backdrop-filter: blur(14px);
          border: 1px solid rgba(255,255,255,0.75); border-radius: 24px;
          padding: 2.5rem 2.5rem 2rem; max-width: 380px; width: 100%;
          text-align: center; box-shadow: 0 12px 48px rgba(70,60,40,0.2);
        ">
          <div style="font-size: 2.8rem; margin-bottom: 0.8rem;">🍂</div>
          <h2 style="font-family: 'Georgia', serif; font-size: 1.15rem; letter-spacing: 0.14em; color: #3b3a36; text-transform: uppercase; margin: 0 0 0.7rem;">¿Borrar el árbol?</h2>
          <p style="font-family: 'Georgia', serif; color: #7a7368; font-size: 0.9rem; line-height: 1.65; margin: 0 0 2rem;">Esta acción eliminará todos los datos del árbol genealógico de forma permanente.</p>
          <div style="display: flex; gap: 0.8rem; justify-content: center;">
            <button (click)="cancelarBorrado()" style="
              font-family: 'Georgia', serif; font-size: 0.83rem; letter-spacing: 0.1em;
              text-transform: uppercase; color: #7a7368;
              background: rgba(255,255,255,0.65); border: 1px solid rgba(139,130,110,0.35);
              padding: 0.6em 1.5em; border-radius: 999px; cursor: pointer; transition: all 0.2s;
            "
            onmouseover="this.style.background='rgba(255,255,255,0.95)'"
            onmouseout="this.style.background='rgba(255,255,255,0.65)'">Cancelar</button>
            <button (click)="borrarArbol()" id="btn-confirmar-borrado" style="
              font-family: 'Georgia', serif; font-size: 0.83rem; letter-spacing: 0.1em;
              text-transform: uppercase; color: white;
              background: linear-gradient(135deg, #9a6a5a, #7a4a3a);
              border: none; padding: 0.6em 1.6em; border-radius: 999px;
              cursor: pointer; transition: opacity 0.2s;
              box-shadow: 0 2px 14px rgba(154,106,90,0.4);
            "
            onmouseover="this.style.opacity='0.82'"
            onmouseout="this.style.opacity='1'">Sí, borrar</button>
          </div>
        </div>
      </div>

    </main>
  `,
  styleUrl: './app.component.css'
})
export class AppComponent implements OnInit {
  private api = inject(ApiService);

  vista: Vista = 'home';
  arbolActivo: Arbol | null = null;

  // Modal crear
  mostrarModalCrear = false;
  nuevoArbol = { nombre: '', descripcion: '' };
  guardando = false;
  errorCrear = '';

  // Modal borrar
  mostrarConfirmBorrado = false;

  ngOnInit() {}

  // ── Crear Árbol ──────────────────────────────────────
  abrirModalCrear() {
    this.nuevoArbol = { nombre: '', descripcion: '' };
    this.errorCrear = '';
    this.mostrarModalCrear = true;
  }

  cerrarModalCrear() {
    if (!this.guardando) {
      this.mostrarModalCrear = false;
      this.errorCrear = '';
    }
  }

  guardarArbol() {
    if (!this.nuevoArbol.nombre.trim()) return;
    this.guardando = true;
    this.errorCrear = '';

    this.api.createArbol({
      nombre: this.nuevoArbol.nombre.trim(),
      descripcion: this.nuevoArbol.descripcion.trim() || undefined
    }).subscribe({
      next: (arbol) => {
        this.guardando = false;
        this.mostrarModalCrear = false;
        this.arbolActivo = arbol;
        this.vista = 'tree'; // Navega automáticamente al árbol recién creado
      },
      error: (err) => {
        this.guardando = false;
        this.errorCrear = 'No se pudo guardar el árbol. Verificá que el servidor esté activo.';
        console.error(err);
      }
    });
  }

  // ── Navegar ──────────────────────────────────────────
  abrirArbol() {
    this.vista = 'tree';
  }

  volverInicio() {
    this.vista = 'home';
  }

  // ── Borrar Árbol ─────────────────────────────────────
  confirmarBorrado() {
    this.mostrarConfirmBorrado = true;
  }

  cancelarBorrado() {
    this.mostrarConfirmBorrado = false;
  }

  borrarArbol() {
    // TODO: conectar con API para borrar el árbol activo
    this.mostrarConfirmBorrado = false;
    console.log('Árbol borrado');
  }
}
