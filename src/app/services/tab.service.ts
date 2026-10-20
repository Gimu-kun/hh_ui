import { Injectable, inject } from '@angular/core';
import { NavService } from './nav.service';
import { AppView } from '../models/chemistry.models';

@Injectable({
  providedIn: 'root',
})
export class TabService {
  private readonly nav = inject(NavService);

  openSubstanceTab(formula: string, _activate = true): string {
    this.nav.openSubstance(formula);
    return formula;
  }

  openTab(type: any, _title: string, data?: any): string {
    this.nav.navigateTo(type as AppView, data);
    return type;
  }

  updateTabTitle(_id: string, _title: string) {}

  selectTab(id: string) {
    this.nav.navigateTo(id as AppView);
  }

  activeTabId() {
    return this.nav.currentView();
  }
}
