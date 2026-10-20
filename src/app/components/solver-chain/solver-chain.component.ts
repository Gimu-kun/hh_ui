import { Component, Input, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ApiService } from '../../services/api.service';
import { TabService } from '../../services/tab.service';
import { ChainSolution } from '../../models/chemistry.models';
import { ChemicalEquationComponent } from '../chemical-equation/chemical-equation.component';
import { ChemicalTextComponent } from '../chemical-text/chemical-text.component';

@Component({
  selector: 'app-solver-chain',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    ChemicalEquationComponent,
    ChemicalTextComponent,
  ],
  template: `
    <div class="solver-page">
      <!-- Title & Hero -->
      <div class="solver-header">
        <div class="badge-tag">Mô hình K = (E, C, R, L, Cond, H) • Heuristic Search</div>
        <h1 class="solver-title">
          <span class="icon-bubble">🔗</span>
          Tìm Chuỗi Phản Ứng Hóa Học Vô Cơ
        </h1>
        <p class="solver-subtitle">
          Tìm đường đi tối ưu từ chất xuất phát đến chất đích trên đồ thị tri thức, áp dụng tập luật L và ưu tiên điều chế ít bước, điều kiện đơn giản.
        </p>
      </div>

      <!-- Main Input Card -->
      <div class="input-card">
        <div class="inputs-grid">
          <div class="form-group">
            <label for="start-substance">Chất xuất phát (Start):</label>
            <input
              id="start-substance"
              type="text"
              class="form-control formula-input"
              [(ngModel)]="start"
              placeholder="VD: CaCO3, Fe2O3, Cu, Na..."
            />
          </div>

          <div class="arrow-indicator">➔</div>

          <div class="form-group">
            <label for="target-substance">Chất mục tiêu (Target):</label>
            <input
              id="target-substance"
              type="text"
              class="form-control formula-input"
              [(ngModel)]="target"
              placeholder="VD: Ca(OH)2, Fe, Cu(OH)2, NaCl..."
            />
          </div>

          <div class="form-group steps-group">
            <label for="max-steps">Số bước tối đa: <strong>{{ maxSteps }}</strong></label>
            <input
              id="max-steps"
              type="range"
              class="form-range"
              min="1"
              max="10"
              [(ngModel)]="maxSteps"
            />
          </div>
        </div>

        <div class="action-row">
          <!-- Preset Examples -->
          <div class="presets-row">
            <span class="presets-label">Chuỗi phổ biến:</span>
            <div class="presets-list">
              @for (item of samples; track item.label) {
                <button
                  type="button"
                  class="btn-sample"
                  (click)="loadSample(item.start, item.target)"
                >
                  {{ item.label }}
                </button>
              }
            </div>
          </div>

          <button
            class="btn-solve"
            (click)="solve()"
            [disabled]="loading() || !start.trim() || !target.trim()"
          >
            @if (loading()) {
              <span class="spinner"></span> Đang tìm chuỗi...
            } @else {
              <span>🔍 Tìm chuỗi phản ứng</span>
            }
          </button>
        </div>
      </div>

      <!-- Error Alert -->
      @if (errorMessage()) {
        <div class="error-alert">
          <span class="error-icon">⚠️</span>
          <div>
            <strong>Không tìm thấy chuỗi:</strong> {{ errorMessage() }}
            <p class="error-tip">Thử tăng số bước tối đa hoặc kiểm tra xem chất có trong cơ sở tri thức hay không.</p>
          </div>
        </div>
      }

      <!-- Solution Result Section -->
      @if (solution(); as res) {
        @if (!res.found) {
          <div class="not-found-card">
            <span class="nf-icon">🔍</span>
            <h3>Không tìm thấy chuỗi phản ứng phù hợp</h3>
            <p>Hệ thống không tìm được đường đi từ <strong>{{ res.start }}</strong> tới <strong>{{ res.target }}</strong> trong giới hạn {{ maxSteps }} bước với kho thuốc thử hiện tại.</p>
          </div>
        } @else {
          <div class="solution-section">
            <!-- Chain Diagram / Pathway Banner -->
            <div class="pathway-card">
              <div class="pathway-header">
                <span class="badge-success">Đã tìm thấy chuỗi {{ res.reactions.length }} bước</span>
                <span class="pathway-summary">{{ res.start }} ➔ {{ res.target }}</span>
              </div>

              <div class="flow-diagram">
                <div class="node start-node" (click)="openSubstance(res.start)">
                  <span class="node-label">Xuất phát</span>
                  <span class="node-formula">{{ res.start }}</span>
                </div>

                @for (step of res.reactions; track step.index) {
                  <div class="flow-arrow">
                    <span class="arrow-condition">{{ step.condition_label }}</span>
                    <span class="arrow-symbol">➔</span>
                  </div>
                  <div
                    class="node intermediate-node"
                    [class.target-node]="step.to === res.target"
                    (click)="openSubstance(step.to)"
                  >
                    <span class="node-label">
                      {{ step.to === res.target ? 'Mục tiêu' : 'Bước ' + step.index }}
                    </span>
                    <span class="node-formula">{{ step.to }}</span>
                  </div>
                }
              </div>
            </div>

            <!-- Detailed Reactions List -->
            <div class="reactions-list">
              <h2 class="section-title">
                <span>🧪</span> Chi tiết các phản ứng trong chuỗi
              </h2>

              @for (item of res.reactions; track item.index) {
                <div class="reaction-card">
                  <div class="reaction-header">
                    <span class="rxn-index">Phản ứng {{ item.index }}</span>
                    <span class="rxn-type-badge">{{ item.type_label || 'Phản ứng vô cơ' }}</span>
                    @if (item.condition_label && item.condition_label !== 'không cần điều kiện') {
                      <span class="rxn-condition-badge">⚡ {{ item.condition_label }}</span>
                    }
                  </div>

                  <div class="rxn-equation">
                    <app-chemical-equation
                      [equation]="item.equation"
                      [condition]="item.condition_label"
                      size="md"
                    ></app-chemical-equation>
                  </div>

                  <div class="rxn-metadata">
                    @if (item.auxiliaries.length > 0) {
                      <div class="meta-item">
                        <span class="meta-label">Thuốc thử tham gia:</span>
                        <div class="meta-tags">
                          @for (aux of item.auxiliaries; track aux) {
                            <span class="meta-badge clickable" (click)="openSubstance(aux)">{{ aux }}</span>
                          }
                        </div>
                      </div>
                    }

                    @if (item.byproducts.length > 0) {
                      <div class="meta-item">
                        <span class="meta-label">Sản phẩm phụ:</span>
                        <div class="meta-tags">
                          @for (bp of item.byproducts; track bp) {
                            <span class="meta-badge clickable" (click)="openSubstance(bp)">{{ bp }}</span>
                          }
                        </div>
                      </div>
                    }

                    @if (item.rule_text) {
                      <div class="meta-item rule-item">
                        <span class="meta-label">Quy luật hóa học:</span>
                        <span class="rule-text">💡 {{ item.rule_text }}</span>
                      </div>
                    }
                  </div>
                </div>
              }
            </div>

            <!-- Step by Step Pedagogical Explanation -->
            <div class="steps-container">
              <div class="steps-heading">
                <span class="steps-icon">📝</span>
                <h2>Lời giải & Diễn giải sư phạm từng bước</h2>
              </div>

              <div class="steps-list">
                @for (step of res.steps; track $index) {
                  <div class="step-card">
                    <div class="step-header">
                      <span class="step-number">{{ $index + 1 }}</span>
                      <span class="step-title">Bước {{ $index + 1 }}</span>
                    </div>
                    <div class="step-body">
                      @for (line of getStepLines(step); track $index) {
                        <div class="step-line">
                          <app-chemical-text [text]="line"></app-chemical-text>
                        </div>
                      }
                    </div>
                  </div>
                }
              </div>
            </div>
          </div>
        }
      }
    </div>
  `,
  styles: [
    `
      .solver-page {
        max-width: 1040px;
        margin: 0 auto;
        padding: 32px 20px 80px 20px;
      }

      .solver-header {
        text-align: center;
        margin-bottom: 28px;

        .badge-tag {
          display: inline-block;
          font-size: 0.8rem;
          font-weight: 600;
          color: #008f4c;
          background-color: #e6f7ef;
          border: 1px solid #b7ebd1;
          padding: 4px 12px;
          border-radius: 20px;
          margin-bottom: 12px;
        }

        .solver-title {
          font-size: 1.85rem;
          font-weight: 800;
          color: #111827;
          margin: 0 0 8px 0;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 12px;
        }

        .icon-bubble {
          font-size: 2rem;
        }

        .solver-subtitle {
          font-size: 0.95rem;
          color: #4b5563;
          max-width: 680px;
          margin: 0 auto;
          line-height: 1.5;
        }
      }

      .input-card {
        background: #ffffff;
        border: 1px solid #e5e7eb;
        border-radius: 18px;
        padding: 24px;
        box-shadow: 0 4px 20px rgba(0, 0, 0, 0.04);
        margin-bottom: 24px;
      }

      .inputs-grid {
        display: flex;
        align-items: center;
        gap: 16px;
        margin-bottom: 20px;
        flex-wrap: wrap;

        .form-group {
          flex: 1;
          min-width: 180px;

          label {
            display: block;
            font-size: 0.88rem;
            font-weight: 600;
            color: #374151;
            margin-bottom: 8px;
          }
        }

        .arrow-indicator {
          font-size: 1.5rem;
          color: #00a859;
          font-weight: 800;
          margin-top: 24px;
        }

        .steps-group {
          flex: 0 0 160px;
        }
      }

      .formula-input {
        width: 100%;
        padding: 10px 14px;
        font-family: 'JetBrains Mono', monospace;
        font-size: 1.1rem;
        font-weight: 600;
        color: #111827;
        background: #f9fafb;
        border: 1.5px solid #d1d5db;
        border-radius: 10px;
        outline: none;
        transition: all 0.2s;

        &:focus {
          background: #ffffff;
          border-color: #00a859;
          box-shadow: 0 0 0 3px rgba(0, 168, 89, 0.15);
        }
      }

      .form-range {
        width: 100%;
        accent-color: #00a859;
        margin-top: 8px;
      }

      .action-row {
        display: flex;
        justify-content: space-between;
        align-items: center;
        gap: 16px;
        flex-wrap: wrap;
        border-top: 1px solid #f3f4f6;
        padding-top: 16px;
      }

      .presets-row {
        display: flex;
        align-items: center;
        gap: 8px;
        font-size: 0.85rem;
        flex-wrap: wrap;

        .presets-label {
          color: #6b7280;
          font-weight: 500;
        }

        .presets-list {
          display: flex;
          flex-wrap: wrap;
          gap: 6px;
        }

        .btn-sample {
          background: #f0faf4;
          border: 1px solid #c7f1dc;
          border-radius: 8px;
          padding: 3px 9px;
          font-family: 'JetBrains Mono', monospace;
          font-size: 0.8rem;
          color: #008f4c;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.15s;

          &:hover {
            background: #00a859;
            color: #ffffff;
          }
        }
      }

      .btn-solve {
        background: linear-gradient(135deg, #00a859 0%, #008f4c 100%);
        color: #ffffff;
        border: none;
        border-radius: 12px;
        padding: 12px 24px;
        font-size: 1rem;
        font-weight: 600;
        cursor: pointer;
        display: flex;
        align-items: center;
        gap: 8px;
        box-shadow: 0 4px 14px rgba(0, 168, 89, 0.3);
        transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
        white-space: nowrap;

        &:hover:not(:disabled) {
          transform: translateY(-1.5px);
          box-shadow: 0 6px 18px rgba(0, 168, 89, 0.4);
        }

        &:disabled {
          opacity: 0.6;
          cursor: not-allowed;
        }
      }

      .spinner {
        width: 16px;
        height: 16px;
        border: 2px solid #ffffff;
        border-top-color: transparent;
        border-radius: 50%;
        animation: spin 0.8s linear infinite;
      }

      @keyframes spin {
        to {
          transform: rotate(360deg);
        }
      }

      .error-alert {
        display: flex;
        gap: 14px;
        background: #fef2f2;
        border: 1.5px solid #fecaca;
        border-radius: 14px;
        padding: 16px 20px;
        margin-bottom: 24px;
        color: #991b1b;

        .error-icon {
          font-size: 1.5rem;
        }

        .error-tip {
          font-size: 0.85rem;
          color: #b91c1c;
          margin: 6px 0 0 0;
        }
      }

      .not-found-card {
        background: #ffffff;
        border: 1px solid #e5e7eb;
        border-radius: 16px;
        padding: 32px;
        text-align: center;
        color: #4b5563;

        .nf-icon {
          font-size: 2.5rem;
          margin-bottom: 12px;
          display: block;
        }

        h3 {
          font-size: 1.2rem;
          color: #1f2937;
          margin-bottom: 8px;
        }
      }

      /* Flow Diagram */
      .pathway-card {
        background: linear-gradient(180deg, #ffffff 0%, #f6fbf8 100%);
        border: 2px solid #a7f3d0;
        border-radius: 18px;
        padding: 24px;
        margin-bottom: 28px;
        box-shadow: 0 10px 28px rgba(0, 168, 89, 0.08);
      }

      .pathway-header {
        display: flex;
        justify-content: space-between;
        align-items: center;
        margin-bottom: 20px;

        .badge-success {
          background: #d1fae5;
          color: #065f46;
          font-weight: 700;
          font-size: 0.85rem;
          padding: 4px 12px;
          border-radius: 12px;
        }

        .pathway-summary {
          font-family: 'JetBrains Mono', monospace;
          font-weight: 700;
          font-size: 1.1rem;
          color: #008f4c;
        }
      }

      .flow-diagram {
        display: flex;
        align-items: center;
        gap: 10px;
        overflow-x: auto;
        padding: 12px 6px;

        .node {
          display: flex;
          flex-direction: column;
          align-items: center;
          padding: 12px 18px;
          border-radius: 14px;
          min-width: 90px;
          cursor: pointer;
          transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);

          &:hover {
            transform: translateY(-2px);
            box-shadow: 0 6px 16px rgba(0, 0, 0, 0.1);
          }

          .node-label {
            font-size: 0.72rem;
            text-transform: uppercase;
            font-weight: 700;
            margin-bottom: 4px;
            letter-spacing: 0.5px;
          }

          .node-formula {
            font-family: 'JetBrains Mono', monospace;
            font-size: 1.15rem;
            font-weight: 800;
          }

          &.start-node {
            background: #e0f2fe;
            border: 1.5px solid #7dd3fc;
            color: #0369a1;
          }

          &.intermediate-node {
            background: #f0fdf4;
            border: 1.5px solid #86efac;
            color: #15803d;
          }

          &.target-node {
            background: #dcfce7;
            border: 2px solid #22c55e;
            color: #166534;
          }
        }

        .flow-arrow {
          display: flex;
          flex-direction: column;
          align-items: center;

          .arrow-condition {
            font-size: 0.72rem;
            font-weight: 700;
            color: #d97706;
            white-space: nowrap;
          }

          .arrow-symbol {
            font-size: 1.4rem;
            color: #00a859;
            font-weight: 800;
          }
        }
      }

      /* Reactions List */
      .reactions-list {
        margin-bottom: 28px;

        .section-title {
          font-size: 1.25rem;
          font-weight: 700;
          color: #111827;
          margin-bottom: 16px;
          display: flex;
          align-items: center;
          gap: 8px;
        }
      }

      .reaction-card {
        background: #ffffff;
        border: 1px solid #e5e7eb;
        border-radius: 14px;
        padding: 18px 22px;
        margin-bottom: 14px;
        box-shadow: 0 2px 8px rgba(0, 0, 0, 0.03);

        .reaction-header {
          display: flex;
          align-items: center;
          gap: 10px;
          margin-bottom: 12px;

          .rxn-index {
            font-weight: 700;
            color: #008f4c;
            font-size: 0.95rem;
          }

          .rxn-type-badge {
            background: #f1f5f9;
            color: #475569;
            font-size: 0.78rem;
            font-weight: 600;
            padding: 2px 8px;
            border-radius: 6px;
          }

          .rxn-condition-badge {
            background: #fef3c7;
            color: #92400e;
            font-size: 0.78rem;
            font-weight: 700;
            padding: 2px 8px;
            border-radius: 6px;
          }
        }

        .rxn-equation {
          margin-bottom: 14px;
        }

        .rxn-metadata {
          display: flex;
          flex-direction: column;
          gap: 8px;
          border-top: 1px dashed #f1f5f9;
          padding-top: 12px;
          font-size: 0.86rem;

          .meta-item {
            display: flex;
            align-items: center;
            gap: 10px;
          }

          .meta-label {
            color: #6b7280;
            font-weight: 500;
            min-width: 140px;
          }

          .meta-tags {
            display: flex;
            gap: 6px;
          }

          .meta-badge {
            font-family: 'JetBrains Mono', monospace;
            font-weight: 700;
            padding: 2px 8px;
            background: #e6f7ef;
            color: #008f4c;
            border-radius: 6px;
            font-size: 0.85rem;

            &.clickable {
              cursor: pointer;
              transition: all 0.15s;
              &:hover {
                background: #00a859;
                color: #ffffff;
              }
            }
          }

          .rule-text {
            color: #1e293b;
            font-weight: 500;
          }
        }
      }

      /* Steps */
      .steps-container {
        margin-top: 24px;
      }

      .steps-heading {
        display: flex;
        align-items: center;
        gap: 10px;
        margin-bottom: 18px;

        .steps-icon {
          font-size: 1.4rem;
        }

        h2 {
          font-size: 1.25rem;
          font-weight: 700;
          color: #111827;
          margin: 0;
        }
      }

      .steps-list {
        display: flex;
        flex-direction: column;
        gap: 16px;
      }

      .step-card {
        background: #ffffff;
        border: 1px solid #e5e7eb;
        border-radius: 14px;
        padding: 18px 22px;
        box-shadow: 0 2px 8px rgba(0, 0, 0, 0.03);
      }

      .step-header {
        display: flex;
        align-items: center;
        gap: 10px;
        margin-bottom: 10px;

        .step-number {
          width: 24px;
          height: 24px;
          border-radius: 50%;
          background: #e6f7ef;
          color: #008f4c;
          font-size: 0.82rem;
          font-weight: 700;
          display: flex;
          align-items: center;
          justify-content: center;
        }

        .step-title {
          font-size: 0.95rem;
          font-weight: 700;
          color: #1f2937;
        }
      }

      .step-body {
        display: flex;
        flex-direction: column;
        gap: 6px;
        padding-left: 34px;
      }

      .step-line {
        font-size: 0.95rem;
        line-height: 1.6;
        color: #374151;
      }
    `,
  ],
})
export class SolverChainComponent implements OnInit {
  @Input() initialStart?: string;
  @Input() initialTarget?: string;

  private readonly api = inject(ApiService);
  private readonly tabService = inject(TabService);

  start = 'CaCO3';
  target = 'Ca(OH)2';
  maxSteps = 6;

  loading = signal(false);
  errorMessage = signal<string | null>(null);
  solution = signal<ChainSolution | null>(null);

  samples = [
    { label: 'CaCO₃ ➔ Ca(OH)₂', start: 'CaCO3', target: 'Ca(OH)2' },
    { label: 'Fe₂O₃ ➔ Fe', start: 'Fe2O3', target: 'Fe' },
    { label: 'Na ➔ NaCl', start: 'Na', target: 'NaCl' },
    { label: 'Cu ➔ Cu(OH)₂', start: 'Cu', target: 'Cu(OH)2' },
    { label: 'S ➔ H₂SO₄', start: 'S', target: 'H2SO4' },
    { label: 'Zn ➔ Cu', start: 'Zn', target: 'Cu' },
    { label: 'P ➔ H₃PO₄', start: 'P', target: 'H3PO4' },
  ];

  ngOnInit() {
    if (this.initialStart) this.start = this.initialStart;
    if (this.initialTarget) this.target = this.initialTarget;
    this.solve();
  }

  loadSample(start: string, target: string) {
    this.start = start;
    this.target = target;
    this.solve();
  }

  solve() {
    const s = this.start.trim();
    const t = this.target.trim();
    if (!s || !t) return;

    this.loading.set(true);
    this.errorMessage.set(null);

    this.api.solveChain(s, t, this.maxSteps).subscribe({
      next: (res) => {
        this.loading.set(false);
        this.solution.set(res);
        this.tabService.updateTabTitle(
          this.tabService.activeTabId(),
          `Chuỗi: ${s} → ${t}`
        );
      },
      error: (err) => {
        this.loading.set(false);
        this.errorMessage.set(err.message || 'Lỗi khi tìm chuỗi phản ứng.');
      },
    });
  }

  openSubstance(formula: string) {
    this.tabService.openSubstanceTab(formula, true);
  }

  getStepLines(stepText: string): string[] {
    return stepText.split('\n').filter((l) => l.trim().length > 0);
  }
}
