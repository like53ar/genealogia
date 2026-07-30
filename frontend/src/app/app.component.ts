import { Component, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ApiService } from './core/api.service';
import { OnboardingComponent } from './features/onboarding/onboarding.component';
import { TreeContainerComponent } from './features/family-tree/tree-container.component';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [CommonModule, OnboardingComponent, TreeContainerComponent],
  template: `
    <main class="w-full min-h-screen bg-zen-background text-zen-text font-zen overflow-hidden relative"
          style="background-image: url('zen-bg.png'); background-size: cover; background-position: center; background-attachment: fixed;">
      
      <!-- Top Title Bar -->
      <header class="absolute top-0 left-0 w-full p-6 text-center z-20 pointer-events-none">
        <h1 class="text-4xl font-light text-zen-text tracking-widest opacity-80" style="font-family: 'Georgia', serif;">Raíces</h1>
        <div class="h-px w-24 bg-zen-text/20 mx-auto mt-2"></div>
      </header>

      <!-- Loading State -->
      <div *ngIf="loading" class="flex h-screen items-center justify-center">
        <div class="text-zen-textMuted animate-pulse text-lg tracking-widest bg-white/50 backdrop-blur px-8 py-4 rounded-full shadow-sm border border-white">Respirando vida en el árbol...</div>
      </div>
      
      <!-- Content -->
      <div class="relative z-10 pt-20"> <!-- Added padding top for header -->
        <ng-container *ngIf="!loading">
          <app-onboarding *ngIf="!hasData" (personaCreated)="onPersonaCreated()"></app-onboarding>
          <app-tree-container *ngIf="hasData"></app-tree-container>
        </ng-container>
      </div>
    </main>
  `,
  styleUrl: './app.component.css'
})
export class AppComponent implements OnInit {
  private api = inject(ApiService);
  
  hasData = false;
  loading = true;

  ngOnInit() {
    this.checkData();
  }

  checkData() {
    this.api.getPersonas().subscribe({
      next: (personas) => {
        this.hasData = personas.length > 0;
        this.loading = false;
      },
      error: (err) => {
        console.error('Error fetching personas', err);
        this.loading = false;
      }
    });
  }

  onPersonaCreated() {
    this.hasData = true;
  }
}
