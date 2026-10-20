import { Component, OnInit, inject } from '@angular/core';
import { CommonModule, isPlatformBrowser } from '@angular/common';
import { PLATFORM_ID } from '@angular/core';
import { NavService } from './services/nav.service';
import { ApiService } from './services/api.service';
import { AppSidebarComponent } from './components/app-sidebar/app-sidebar.component';
import { AppHeaderComponent } from './components/app-header/app-header.component';
import { SolverBalanceComponent } from './components/solver-balance/solver-balance.component';
import { SolverChainComponent } from './components/solver-chain/solver-chain.component';
import { SolverQuantityComponent } from './components/solver-quantity/solver-quantity.component';
import { SubstanceDetailComponent } from './components/substance-detail/substance-detail.component';
import { PeriodicTableComponent } from './components/periodic-table/periodic-table.component';
import { ActivitySeriesComponent } from './components/activity-series/activity-series.component';
import { KnowledgeCrudComponent } from './components/knowledge-crud/knowledge-crud.component';
import { MetaData } from './models/chemistry.models';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [
    CommonModule,
    AppSidebarComponent,
    AppHeaderComponent,
    SolverBalanceComponent,
    SolverChainComponent,
    SolverQuantityComponent,
    SubstanceDetailComponent,
    PeriodicTableComponent,
    ActivitySeriesComponent,
    KnowledgeCrudComponent,
  ],
  templateUrl: './app.html',
  styleUrl: './app.scss',
})
export class App implements OnInit {
  readonly nav = inject(NavService);
  private readonly api = inject(ApiService);
  private readonly platformId = inject(PLATFORM_ID);

  metaData: MetaData | null = null;
  backendOnline = false;

  ngOnInit() {
    if (isPlatformBrowser(this.platformId)) {
      // Check if current URL contains /substance/:formula
      const pathname = window.location.pathname;
      const match = pathname.match(/\/substance\/(.+)$/);
      if (match && match[1]) {
        const decoded = decodeURIComponent(match[1]);
        this.nav.openSubstance(decoded);
      }

      // Check backend meta
      this.api.getMeta().subscribe({
        next: (data) => {
          this.metaData = data;
          this.backendOnline = true;
        },
        error: () => {
          this.backendOnline = false;
        },
      });
    }
  }
}
