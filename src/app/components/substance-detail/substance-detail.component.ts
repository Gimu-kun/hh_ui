import { Component, Input, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ApiService } from '../../services/api.service';
import { TabService } from '../../services/tab.service';
import { CompoundData, ElementData, ReactionData } from '../../models/chemistry.models';
import { ChemicalEquationComponent } from '../chemical-equation/chemical-equation.component';
import { toSubscript } from '../../utils/chemistry.utils';

interface ElementPercent {
  symbol: string;
  count: number;
  atomicMass: number;
  totalMass: number;
  percent: number;
}

@Component({
  selector: 'app-substance-detail',
  standalone: true,
  imports: [CommonModule, ChemicalEquationComponent],
  template: `
    <div class="substance-page">
      @if (loading()) {
        <div class="loading-state">
          <div class="spinner-large"></div>
          <p>Đang nạp tri thức về chất {{ formula }}...</p>
        </div>
      } @else if (errorMessage()) {
        <div class="error-card">
          <span class="err-icon">⚠️</span>
          <h2>Không tìm thấy dữ liệu</h2>
          <p>{{ errorMessage() }}</p>
          <button class="btn-back" (click)="searchAlternative()">Tìm kiếm chất khác</button>
        </div>
      } @else if (compound(); as item) {
        <!-- Substance Hero Header -->
        <div class="hero-card">
          <div class="hero-top">
            <div class="title-group">
              <span class="formula-title">{{ toSubscript(item.formula) }}</span>
              <h1 class="vietnamese-name">{{ item.name || item.formula }}</h1>
            </div>

            <div class="badges-group">
              <span class="badge class-badge">
                🏷️ {{ item.class_label || item.class }}
              </span>
              <span class="badge state-badge" [class]="'state-' + item.state">
                {{ item.state_label || item.state }}
              </span>
              <span class="badge soluble-badge" [class]="'sol-' + item.soluble">
                💧 {{ item.soluble_label || item.soluble }}
              </span>
            </div>
          </div>

          <!-- Quick Action Buttons -->
          <div class="hero-actions">
            <button class="btn-action" (click)="startChainFrom(item.formula)">
              🔗 Tìm chuỗi điều chế TỪ chất này
            </button>
            <button class="btn-action" (click)="startChainTo(item.formula)">
              🎯 Tìm chuỗi điều chế TẠO RA chất này
            </button>
            <button class="btn-action-outline" (click)="openInExternalTab(item.formula)" title="Mở trang trong cửa sổ/tab trình duyệt độc lập">
              🌐 Mở tab trình duyệt ngoài ↗
            </button>
          </div>
        </div>

        <!-- 2 Columns: Properties & Elemental Composition -->
        <div class="details-grid">
          <!-- Column 1: Physical & Chemical Properties -->
          <div class="info-card">
            <h2 class="card-heading">
              <span>📊</span> Thông số hóa lý đặc trưng
            </h2>

            <div class="prop-table">
              <div class="prop-row">
                <span class="prop-label">Công thức phân tử:</span>
                <span class="prop-val mono highlight">{{ item.formula }}</span>
              </div>
              <div class="prop-row">
                <span class="prop-label">Tên gọi tiếng Việt:</span>
                <span class="prop-val">{{ item.name }}</span>
              </div>
              <div class="prop-row">
                <span class="prop-label">Phân tử khối (M):</span>
                <span class="prop-val highlight">{{ item.molar_mass || 'Chưa rõ' }} g/mol</span>
              </div>
              <div class="prop-row">
                <span class="prop-label">Phân loại chất:</span>
                <span class="prop-val">{{ item.class_label }}</span>
              </div>
              <div class="prop-row">
                <span class="prop-label">Trạng thái tự nhiên:</span>
                <span class="prop-val">{{ item.state_label }}</span>
              </div>
              <div class="prop-row">
                <span class="prop-label">Độ tan trong nước:</span>
                <span class="prop-val">{{ item.soluble_label }}</span>
              </div>
              <div class="prop-row">
                <span class="prop-label">Điện tích phân tử/ion:</span>
                <span class="prop-val">{{ item.charge }}</span>
              </div>
              @if (item.ontology && item.ontology.length > 0) {
                <div class="prop-row ontology-row">
                  <span class="prop-label">Phân cấp bản thể học (Ontology):</span>
                  <div class="ontology-breadcrumb">
                    @for (node of item.ontology; track node) {
                      <span class="onto-node">{{ node }}</span>
                      @if (!$last) { <span class="onto-sep">➔</span> }
                    }
                  </div>
                </div>
              }
            </div>
          </div>

          <!-- Column 2: Elemental Mass Percentages -->
          <div class="info-card">
            <h2 class="card-heading">
              <span>⚛️</span> Thành phần nguyên tố & Tỉ lệ % khối lượng
            </h2>

            @if (elementPercents().length > 0) {
              <!-- Stacked Progress Bar -->
              <div class="percent-bar-container">
                @for (ep of elementPercents(); track ep.symbol; let i = $index) {
                  <div
                    class="percent-bar-segment"
                    [style.width.%]="ep.percent"
                    [style.background-color]="getColorForIndex(i)"
                    [title]="ep.symbol + ': ' + ep.percent.toFixed(1) + '%'"
                  >
                    @if (ep.percent > 8) {
                      <span>{{ ep.symbol }} {{ ep.percent.toFixed(0) }}%</span>
                    }
                  </div>
                }
              </div>

              <!-- Composition Table -->
              <div class="composition-table">
                @for (ep of elementPercents(); track ep.symbol; let i = $index) {
                  <div class="comp-row">
                    <div class="comp-symbol-group">
                      <span
                        class="color-dot"
                        [style.background-color]="getColorForIndex(i)"
                      ></span>
                      <strong class="comp-symbol">{{ ep.symbol }}</strong>
                      <span class="comp-count">× {{ ep.count }}</span>
                    </div>

                    <span class="comp-mass">NTK = {{ ep.atomicMass }}</span>
                    <span class="comp-percent">{{ ep.percent.toFixed(1) }}%</span>
                  </div>
                }
              </div>
            } @else {
              <p class="empty-text">Chất đơn giản hoặc chưa có phân tích thành phần chi tiết.</p>
            }
          </div>
        </div>

        <!-- Section: Reactions Repository -->
        <div class="reactions-section">
          <div class="section-header">
            <h2 class="section-title">
              <span>⚗️</span> Các phản ứng hóa học liên quan ({{ reactions().length }})
            </h2>
            <div class="filter-tabs">
              <button
                class="filter-tab"
                [class.active]="reactionFilter() === 'all'"
                (click)="reactionFilter.set('all')"
              >
                Tất cả ({{ reactions().length }})
              </button>
              <button
                class="filter-tab"
                [class.active]="reactionFilter() === 'reactant'"
                (click)="reactionFilter.set('reactant')"
              >
                Chất phản ứng ({{ reactantReactions().length }})
              </button>
              <button
                class="filter-tab"
                [class.active]="reactionFilter() === 'product'"
                (click)="reactionFilter.set('product')"
              >
                Sản phẩm tạo thành ({{ productReactions().length }})
              </button>
            </div>
          </div>

          @if (filteredReactions().length === 0) {
            <div class="empty-card">
              <p>Chưa có dữ liệu phản ứng nào cho mục này trong kho tri thức.</p>
            </div>
          } @else {
            <div class="rxn-cards-grid">
              @for (rxn of filteredReactions(); track rxn.id) {
                <div class="rxn-card">
                  <div class="rxn-top">
                    <span class="rxn-role" [class.is-reactant]="isReactant(rxn, item.formula)">
                      {{ isReactant(rxn, item.formula) ? 'Chất phản ứng' : 'Sản phẩm tạo thành' }}
                    </span>
                    <span class="rxn-type">{{ rxn.type_label || rxn.type }}</span>
                    @if (rxn.condition && rxn.condition !== 'NONE') {
                      <span class="rxn-cond">⚡ {{ rxn.condition_label || rxn.condition }}</span>
                    }
                  </div>

                  <div class="rxn-equation-wrapper">
                    <app-chemical-equation
                      [equation]="formatReactionEquation(rxn)"
                      [condition]="rxn.condition_label"
                      size="sm"
                    ></app-chemical-equation>
                  </div>

                  <div class="rxn-footer">
                    <button class="btn-balance-this" (click)="balanceThis(rxn)">
                      ⚖️ Cân bằng phản ứng này
                    </button>
                  </div>
                </div>
              }
            </div>
          }
        </div>
      }
    </div>
  `,
  styles: [
    `
      .substance-page {
        max-width: 1060px;
        margin: 0 auto;
        padding: 30px 20px 80px 20px;
      }

      .loading-state {
        text-align: center;
        padding: 80px 20px;
        color: #4b5563;

        .spinner-large {
          width: 40px;
          height: 40px;
          border: 3px solid #bbf7d0;
          border-top-color: #00a859;
          border-radius: 50%;
          animation: spin 0.8s linear infinite;
          margin: 0 auto 16px auto;
        }
      }

      @keyframes spin {
        to {
          transform: rotate(360deg);
        }
      }

      .error-card {
        background: #ffffff;
        border: 1px solid #e5e7eb;
        border-radius: 16px;
        padding: 40px;
        text-align: center;
        max-width: 500px;
        margin: 40px auto;

        .err-icon {
          font-size: 3rem;
          margin-bottom: 12px;
          display: block;
        }

        h2 {
          font-size: 1.3rem;
          color: #111827;
          margin-bottom: 8px;
        }

        p {
          color: #6b7280;
          margin-bottom: 20px;
        }

        .btn-back {
          background: #00a859;
          color: #ffffff;
          border: none;
          padding: 10px 20px;
          border-radius: 10px;
          font-weight: 600;
          cursor: pointer;
        }
      }

      /* Hero Header */
      .hero-card {
        background: linear-gradient(135deg, #ffffff 0%, #f6fcf8 100%);
        border: 2px solid #bbf7d0;
        border-radius: 20px;
        padding: 28px 32px;
        margin-bottom: 24px;
        box-shadow: 0 10px 30px rgba(0, 168, 89, 0.08);
      }

      .hero-top {
        display: flex;
        justify-content: space-between;
        align-items: flex-start;
        margin-bottom: 22px;
        flex-wrap: wrap;
        gap: 16px;
      }

      .title-group {
        .formula-title {
          font-family: 'JetBrains Mono', monospace;
          font-size: 2.4rem;
          font-weight: 900;
          color: #008f4c;
          letter-spacing: -0.5px;
          display: block;
          margin-bottom: 4px;
        }

        .vietnamese-name {
          font-size: 1.4rem;
          font-weight: 700;
          color: #111827;
          margin: 0;
        }
      }

      .badges-group {
        display: flex;
        gap: 8px;
        flex-wrap: wrap;

        .badge {
          padding: 6px 14px;
          border-radius: 20px;
          font-size: 0.85rem;
          font-weight: 600;
          display: inline-flex;
          align-items: center;
          gap: 4px;

          &.class-badge {
            background: #e6f7ef;
            color: #008f4c;
            border: 1px solid #b7ebd1;
          }

          &.state-ran {
            background: #f1f5f9;
            color: #334155;
          }
          &.state-long {
            background: #e0f2fe;
            color: #0369a1;
          }
          &.state-khi {
            background: #fef3c7;
            color: #92400e;
          }

          &.sol-tan {
            background: #dcfce7;
            color: #15803d;
          }
          &.sol-khong_tan {
            background: #fee2e2;
            color: #991b1b;
          }
          &.sol-it_tan {
            background: #ffedd5;
            color: #9a3412;
          }
        }
      }

      .hero-actions {
        display: flex;
        gap: 12px;
        flex-wrap: wrap;
        border-top: 1px solid #f1f5f9;
        padding-top: 18px;

        .btn-action {
          background: #00a859;
          color: #ffffff;
          border: none;
          border-radius: 10px;
          padding: 10px 18px;
          font-size: 0.9rem;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.2s;

          &:hover {
            background: #008f4c;
            transform: translateY(-1.5px);
            box-shadow: 0 4px 12px rgba(0, 168, 89, 0.3);
          }
        }

        .btn-action-outline {
          background: #ffffff;
          color: #475569;
          border: 1.5px solid #cbd5e1;
          border-radius: 10px;
          padding: 10px 16px;
          font-size: 0.88rem;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.2s;

          &:hover {
            border-color: #00a859;
            color: #008f4c;
          }
        }
      }

      /* Grid Details */
      .details-grid {
        display: grid;
        grid-template-columns: 1fr 1fr;
        gap: 20px;
        margin-bottom: 28px;

        @media (max-width: 820px) {
          grid-template-columns: 1fr;
        }
      }

      .info-card {
        background: #ffffff;
        border: 1px solid #e5e7eb;
        border-radius: 16px;
        padding: 22px;
        box-shadow: 0 2px 10px rgba(0, 0, 0, 0.03);

        .card-heading {
          font-size: 1.15rem;
          font-weight: 700;
          color: #111827;
          margin-bottom: 18px;
          display: flex;
          align-items: center;
          gap: 8px;
        }
      }

      .prop-table {
        display: flex;
        flex-direction: column;
        gap: 12px;

        .prop-row {
          display: flex;
          justify-content: space-between;
          align-items: baseline;
          padding-bottom: 8px;
          border-bottom: 1px solid #f3f4f6;
          font-size: 0.9rem;

          .prop-label {
            color: #64748b;
          }

          .prop-val {
            font-weight: 600;
            color: #1e293b;

            &.mono {
              font-family: 'JetBrains Mono', monospace;
            }

            &.highlight {
              color: #008f4c;
            }
          }

          &.ontology-row {
            flex-direction: column;
            gap: 8px;
            align-items: flex-start;
          }
        }
      }

      .ontology-breadcrumb {
        display: flex;
        align-items: center;
        gap: 6px;
        flex-wrap: wrap;

        .onto-node {
          background: #f1f5f9;
          padding: 3px 8px;
          border-radius: 6px;
          font-size: 0.8rem;
          font-weight: 600;
          color: #475569;
        }

        .onto-sep {
          color: #94a3b8;
          font-size: 0.8rem;
        }
      }

      /* Elemental Percentages */
      .percent-bar-container {
        display: flex;
        height: 28px;
        border-radius: 10px;
        overflow: hidden;
        margin-bottom: 20px;
        box-shadow: inset 0 1px 3px rgba(0, 0, 0, 0.1);

        .percent-bar-segment {
          display: flex;
          align-items: center;
          justify-content: center;
          color: #ffffff;
          font-size: 0.78rem;
          font-weight: 700;
          font-family: 'JetBrains Mono', monospace;
          transition: width 0.4s ease;
        }
      }

      .composition-table {
        display: flex;
        flex-direction: column;
        gap: 10px;

        .comp-row {
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 8px 12px;
          background: #f8fafc;
          border-radius: 8px;
          font-size: 0.9rem;

          .comp-symbol-group {
            display: flex;
            align-items: center;
            gap: 8px;

            .color-dot {
              width: 10px;
              height: 10px;
              border-radius: 50%;
            }

            .comp-symbol {
              font-family: 'JetBrains Mono', monospace;
              color: #0f172a;
              font-size: 1rem;
            }

            .comp-count {
              color: #64748b;
              font-size: 0.85rem;
            }
          }

          .comp-mass {
            font-size: 0.82rem;
            color: #64748b;
          }

          .comp-percent {
            font-weight: 700;
            color: #008f4c;
            font-family: 'JetBrains Mono', monospace;
          }
        }
      }

      /* Reactions Section */
      .reactions-section {
        margin-top: 24px;
      }

      .section-header {
        display: flex;
        justify-content: space-between;
        align-items: center;
        margin-bottom: 18px;
        flex-wrap: wrap;
        gap: 12px;

        .section-title {
          font-size: 1.3rem;
          font-weight: 700;
          color: #111827;
          margin: 0;
          display: flex;
          align-items: center;
          gap: 8px;
        }
      }

      .filter-tabs {
        display: flex;
        gap: 6px;

        .filter-tab {
          background: #f1f5f9;
          border: none;
          padding: 6px 14px;
          border-radius: 8px;
          font-size: 0.85rem;
          font-weight: 600;
          color: #475569;
          cursor: pointer;
          transition: all 0.15s;

          &:hover {
            background: #e2e8f0;
          }

          &.active {
            background: #00a859;
            color: #ffffff;
          }
        }
      }

      .empty-card {
        background: #ffffff;
        border: 1px dashed #cbd5e1;
        border-radius: 14px;
        padding: 32px;
        text-align: center;
        color: #64748b;
      }

      .rxn-cards-grid {
        display: grid;
        grid-template-columns: 1fr 1fr;
        gap: 16px;

        @media (max-width: 800px) {
          grid-template-columns: 1fr;
        }
      }

      .rxn-card {
        background: #ffffff;
        border: 1px solid #e5e7eb;
        border-radius: 14px;
        padding: 18px;
        box-shadow: 0 2px 6px rgba(0, 0, 0, 0.02);
        display: flex;
        flex-direction: column;
        gap: 12px;
        transition: all 0.2s;

        &:hover {
          border-color: #bbf7d0;
          box-shadow: 0 4px 14px rgba(0, 168, 89, 0.06);
        }

        .rxn-top {
          display: flex;
          gap: 6px;
          flex-wrap: wrap;
          font-size: 0.75rem;

          .rxn-role {
            padding: 2px 8px;
            border-radius: 6px;
            font-weight: 700;
            background: #e0f2fe;
            color: #0369a1;

            &.is-reactant {
              background: #fef3c7;
              color: #92400e;
            }
          }

          .rxn-type {
            background: #f1f5f9;
            color: #475569;
            padding: 2px 6px;
            border-radius: 4px;
          }

          .rxn-cond {
            background: #fef08a;
            color: #713f12;
            padding: 2px 6px;
            border-radius: 4px;
            font-weight: 600;
          }
        }

        .rxn-footer {
          margin-top: auto;
          display: flex;
          justify-content: flex-end;

          .btn-balance-this {
            background: #f0faf4;
            color: #008f4c;
            border: 1px solid #c7f1dc;
            padding: 4px 10px;
            border-radius: 6px;
            font-size: 0.8rem;
            font-weight: 600;
            cursor: pointer;
            transition: all 0.15s;

            &:hover {
              background: #00a859;
              color: #ffffff;
            }
          }
        }
      }
    `,
  ],
})
export class SubstanceDetailComponent implements OnInit {
  @Input() formula = 'CaCO3';

  private readonly api = inject(ApiService);
  private readonly tabService = inject(TabService);

  loading = signal(true);
  errorMessage = signal<string | null>(null);
  compound = signal<CompoundData | null>(null);
  reactions = signal<ReactionData[]>([]);
  reactionFilter = signal<'all' | 'reactant' | 'product'>('all');

  elementPercents = signal<ElementPercent[]>([]);

  readonly toSubscript = toSubscript;

  private readonly colorPalette = [
    '#00a859',
    '#0284c7',
    '#f59e0b',
    '#8b5cf6',
    '#ec4899',
    '#14b8a6',
    '#64748b',
  ];

  ngOnInit() {
    this.loadData();
  }

  loadData() {
    this.loading.set(true);
    this.errorMessage.set(null);

    this.api.getCompound(this.formula).subscribe({
      next: (comp) => {
        this.compound.set(comp);
        this.computeComposition(comp);
        this.loadReactions(comp.formula);
        this.tabService.updateTabTitle(
          this.tabService.activeTabId(),
          `Chất: ${this.toSubscript(comp.formula)}`
        );
      },
      error: (err) => {
        this.loading.set(false);
        this.errorMessage.set(
          err.message || `Không tìm thấy chất '${this.formula}' trong cơ sở tri thức.`
        );
      },
    });
  }

  computeComposition(comp: CompoundData) {
    if (!comp.composition) {
      this.elementPercents.set([]);
      return;
    }

    // Load elements to compute atomic masses
    this.api.listElements().subscribe({
      next: (elements) => {
        const elemMap = new Map<string, ElementData>(
          elements.map((e) => [e.symbol, e])
        );

        const list: ElementPercent[] = [];
        let total = 0;

        for (const [sym, count] of Object.entries(comp.composition || {})) {
          const el = elemMap.get(sym);
          const mass = el?.mass || 1;
          const subtotal = count * mass;
          total += subtotal;
          list.push({
            symbol: sym,
            count,
            atomicMass: mass,
            totalMass: subtotal,
            percent: 0,
          });
        }

        if (total > 0) {
          list.forEach((item) => {
            item.percent = (item.totalMass / total) * 100;
          });
        }

        this.elementPercents.set(list);
      },
    });
  }

  loadReactions(formula: string) {
    this.api.getReactionsForSubstance(formula).subscribe({
      next: (items) => {
        this.reactions.set(items);
        this.loading.set(false);
      },
      error: () => {
        this.loading.set(false);
      },
    });
  }

  isReactant(rxn: ReactionData, formula: string): boolean {
    return rxn.reactants.includes(formula);
  }

  filteredReactions(): ReactionData[] {
    const f = this.reactionFilter();
    const curr = this.compound()?.formula || '';
    if (f === 'reactant') return this.reactions().filter((r) => r.reactants.includes(curr));
    if (f === 'product') return this.reactions().filter((r) => r.products.includes(curr));
    return this.reactions();
  }

  reactantReactions(): ReactionData[] {
    const curr = this.compound()?.formula || '';
    return this.reactions().filter((r) => r.reactants.includes(curr));
  }

  productReactions(): ReactionData[] {
    const curr = this.compound()?.formula || '';
    return this.reactions().filter((r) => r.products.includes(curr));
  }

  formatReactionEquation(rxn: ReactionData): string {
    const reactants = rxn.reactants.join(' + ');
    const products = rxn.products.join(' + ');
    return `${reactants} → ${products}`;
  }

  balanceThis(rxn: ReactionData) {
    const eq = `${rxn.reactants.join(' + ')} → ${rxn.products.join(' + ')}`;
    this.tabService.openTab('balance', `Cân bằng: ${rxn.reactants.join(' + ')}`, {
      equation: eq,
    });
  }

  startChainFrom(formula: string) {
    this.tabService.openTab('chain', `Chuỗi từ ${formula}`, {
      start: formula,
      target: 'CaCl2',
    });
  }

  startChainTo(formula: string) {
    this.tabService.openTab('chain', `Chuỗi tạo ${formula}`, {
      start: 'CaCO3',
      target: formula,
    });
  }

  openInExternalTab(formula: string) {
    // Allows opening a standalone browser tab
    window.open(`/substance/${encodeURIComponent(formula)}`, '_blank');
  }

  getColorForIndex(index: number): string {
    return this.colorPalette[index % this.colorPalette.length];
  }

  searchAlternative() {
    this.tabService.openTab('balance', 'Cân bằng phản ứng');
  }
}
