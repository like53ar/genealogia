import { Component, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ApiService } from './core/api.service';
import { TreeContainerComponent } from './features/family-tree/tree-container.component';

type Vista = 'home' | 'tree';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [CommonModule, TreeContainerComponent],
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
          <button
            (click)="abrirArbol()"
            class="btn-zen-accion"
            id="btn-crear-arbol">
            <span style="font-size: 1.3rem;">🌱</span>
            <span style="flex: 1; text-align: center; letter-spacing: 0.18em;">CREAR ÁRBOL</span>
            <span style="opacity: 0.6; font-size: 1.1rem;">›</span>
          </button>

          <!-- EDITAR ÁRBOL -->
          <button
            (click)="abrirArbol()"
            class="btn-zen-accion btn-zen-editar"
            id="btn-editar-arbol">
            <span style="font-size: 1.3rem;">✏️</span>
            <span style="flex: 1; text-align: center; letter-spacing: 0.18em;">EDITAR ÁRBOL</span>
            <span style="opacity: 0.6; font-size: 1.1rem;">›</span>
          </button>

          <!-- BORRAR ÁRBOL -->
          <button
            (click)="confirmarBorrado()"
            class="btn-zen-accion btn-zen-borrar"
            id="btn-borrar-arbol">
            <span style="font-size: 1.3rem;">🍂</span>
            <span style="flex: 1; text-align: center; letter-spacing: 0.18em;">BORRAR ÁRBOL</span>
            <span style="opacity: 0.6; font-size: 1.1rem;">›</span>
          </button>

        </div>

        <!-- Ornamento decorativo inferior -->
        <div style="margin-top: 3rem; display: flex; align-items: center; gap: 0.8rem; opacity: 0.45;">
          <div style="height: 1px; width: 55px; background: #8a9a6a;"></div>
          <span style="font-family: 'Georgia', serif; color: #8a9a6a; font-size: 1.1rem;">❧</span>
          <div style="height: 1px; width: 55px; background: #8a9a6a;"></div>
        </div>
      </div>

      <!-- ═══════════ VISTA DEL ÁRBOL ═══════════ -->
      <div *ngIf="vista === 'tree'" style="position: relative; z-index: 10; min-height: 100vh;">

        <!-- Barra superior -->
        <header style="
          position: fixed;
          top: 0; left: 0; right: 0;
          z-index: 30;
          padding: 0.8rem 1.5rem;
          display: flex;
          align-items: center;
          justify-content: space-between;
          background: rgba(255,255,255,0.38);
          backdrop-filter: blur(12px);
          -webkit-backdrop-filter: blur(12px);
          border-bottom: 1px solid rgba(255,255,255,0.55);
        ">
          <h1 style="
            font-family: 'Georgia', 'Times New Roman', serif;
            font-size: 1.25rem;
            font-weight: 700;
            letter-spacing: 0.18em;
            color: #3b3a36;
            margin: 0;
            text-transform: uppercase;
          ">ÁRBOL GENEALÓGICO</h1>

          <button
            (click)="volverInicio()"
            id="btn-volver-inicio"
            style="
              font-family: 'Georgia', serif;
              font-size: 0.78rem;
              letter-spacing: 0.12em;
              text-transform: uppercase;
              color: #6b6a62;
              background: rgba(255,255,255,0.45);
              border: 1px solid rgba(139,130,110,0.3);
              padding: 0.4em 1.2em;
              border-radius: 999px;
              cursor: pointer;
              transition: all 0.2s;
              backdrop-filter: blur(4px);
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

      <!-- ═══════════ MODAL CONFIRMACIÓN BORRADO ═══════════ -->
      <div *ngIf="mostrarConfirmBorrado"
        style="
          position: fixed; inset: 0; z-index: 100;
          background: rgba(55,50,40,0.5);
          backdrop-filter: blur(5px);
          -webkit-backdrop-filter: blur(5px);
          display: flex; align-items: center; justify-content: center;
          padding: 1rem;
        ">
        <div style="
          background: rgba(252,250,245,0.94);
          backdrop-filter: blur(14px);
          -webkit-backdrop-filter: blur(14px);
          border: 1px solid rgba(255,255,255,0.75);
          border-radius: 24px;
          padding: 2.5rem 2.5rem 2rem;
          max-width: 380px;
          width: 100%;
          text-align: center;
          box-shadow: 0 12px 48px rgba(70,60,40,0.2);
        ">
          <div style="font-size: 2.8rem; margin-bottom: 0.8rem;">🍂</div>
          <h2 style="
            font-family: 'Georgia', serif;
            font-size: 1.15rem;
            letter-spacing: 0.14em;
            color: #3b3a36;
            text-transform: uppercase;
            margin: 0 0 0.7rem;
          ">¿Borrar el árbol?</h2>
          <p style="
            font-family: 'Georgia', serif;
            color: #7a7368;
            font-size: 0.9rem;
            line-height: 1.65;
            margin: 0 0 2rem;
          ">Esta acción eliminará todos los datos del árbol genealógico de forma permanente.</p>
          <div style="display: flex; gap: 0.8rem; justify-content: center;">
            <button
              (click)="cancelarBorrado()"
              id="btn-cancelar-borrado"
              style="
                font-family: 'Georgia', serif;
                font-size: 0.83rem;
                letter-spacing: 0.1em;
                text-transform: uppercase;
                color: #7a7368;
                background: rgba(255,255,255,0.65);
                border: 1px solid rgba(139,130,110,0.35);
                padding: 0.6em 1.5em;
                border-radius: 999px;
                cursor: pointer;
                transition: all 0.2s;
              "
              onmouseover="this.style.background='rgba(255,255,255,0.95)'"
              onmouseout="this.style.background='rgba(255,255,255,0.65)'">
              Cancelar
            </button>
            <button
              (click)="borrarArbol()"
              id="btn-confirmar-borrado"
              style="
                font-family: 'Georgia', serif;
                font-size: 0.83rem;
                letter-spacing: 0.1em;
                text-transform: uppercase;
                color: white;
                background: linear-gradient(135deg, #9a6a5a, #7a4a3a);
                border: none;
                padding: 0.6em 1.6em;
                border-radius: 999px;
                cursor: pointer;
                transition: opacity 0.2s;
                box-shadow: 0 2px 14px rgba(154,106,90,0.4);
              "
              onmouseover="this.style.opacity='0.82'"
              onmouseout="this.style.opacity='1'">
              Sí, borrar
            </button>
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
  mostrarConfirmBorrado = false;

  ngOnInit() {}

  abrirArbol() {
    this.vista = 'tree';
  }

  volverInicio() {
    this.vista = 'home';
  }

  confirmarBorrado() {
    this.mostrarConfirmBorrado = true;
  }

  cancelarBorrado() {
    this.mostrarConfirmBorrado = false;
  }

  borrarArbol() {
    // TODO: conectar con API para borrar todos los datos
    this.mostrarConfirmBorrado = false;
    console.log('Árbol borrado');
  }
}
