import { Injectable, signal } from '@angular/core';
import { AppView, CrudResource } from '../models/chemistry.models';

@Injectable({
  providedIn: 'root',
})
export class NavService {
  readonly currentView = signal<AppView>('balance');
  readonly selectedSubstanceFormula = signal<string>('CaCO3');
  readonly selectedCrudResource = signal<CrudResource>('elements');
  readonly sidebarCollapsed = signal<boolean>(false);
  readonly viewData = signal<any>(null);

  navigateTo(view: AppView, data?: any) {
    if (view === 'substance' && data?.formula) {
      const clean = String(data.formula).trim().replace(/^\d+/, '');
      this.selectedSubstanceFormula.set(clean);
    }
    if (view === 'crud' && data?.resource) {
      this.selectedCrudResource.set(data.resource);
    }
    this.viewData.set(data || null);
    this.currentView.set(view);
  }

  openSubstance(formula: string) {
    this.navigateTo('substance', { formula });
  }

  openSubstanceExternal(formula: string) {
    const clean = String(formula).trim().replace(/^\d+/, '');
    window.open(`/substance/${encodeURIComponent(clean)}`, '_blank');
  }

  setCrudResource(resource: CrudResource) {
    this.selectedCrudResource.set(resource);
    this.currentView.set('crud');
  }

  toggleSidebar() {
    this.sidebarCollapsed.update((v) => !v);
  }
}
