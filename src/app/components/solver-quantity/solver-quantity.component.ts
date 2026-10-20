import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ApiService } from '../../services/api.service';
import { TabService } from '../../services/tab.service';
import { QuantitySolution } from '../../models/chemistry.models';
import { ChemicalTextComponent } from '../chemical-text/chemical-text.component';

@Component({
  selector: 'app-solver-quantity',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    ChemicalTextComponent,
  ],
  template: `
    <div class="solver-page">
      <!-- Title & Hero -->
      <div class="solver-header">
        <div class="badge-tag">Mô hình K = (E, C, R, L, Cond, H) • Định luật bảo toàn & Tỉ lệ mol</div>
        <h1 class="solver-title">
          <span class="icon-bubble">🧮</span>
          Giải Bài Toán Đại Lượng Theo Phương Trình
        </h1>
        <p class="solver-subtitle">
          Tính khối lượng (m), thể tích khí đktc (V) hoặc số mol (n) theo phương trình phản ứng hóa học vô cơ với lời giải 4 bước sư phạm chuẩn mực.
        </p>
      </div>

      <!-- Main Input Card -->
      <div class="input-card">
        <!-- 1. Equation Input -->
        <div class="form-group mb-4">
          <label class="form-label" for="quantity-equation">1. Phương trình phản ứng:</label>
          <input
            id="quantity-equation"
            type="text"
            class="form-control equation-input"
            [(ngModel)]="equation"
            placeholder="Ví dụ: Zn + HCl → ZnCl2 + H2"
          />
        </div>

        <!-- 2. Known & Find Parameters Grid -->
        <div class="params-grid">
          <!-- Known box -->
          <div class="param-box known-box">
            <div class="box-title">
              <span class="box-icon">📌</span>
              <span>Đại lượng ĐÃ BIẾT:</span>
            </div>
            <div class="param-fields">
              <div class="field-item">
                <label>Chất đã biết:</label>
                <input
                  type="text"
                  class="form-control"
                  [(ngModel)]="knownFormula"
                  placeholder="VD: Zn"
                />
              </div>
              <div class="field-item">
                <label>Loại đại lượng:</label>
                <select class="form-select" [(ngModel)]="knownKind">
                  <option value="mass">Khối lượng m (gam)</option>
                  <option value="volume">Thể tích khí V (lít, đktc)</option>
                  <option value="mole">Số mol n (mol)</option>
                </select>
              </div>
              <div class="field-item">
                <label>Giá trị số:</label>
                <input
                  type="number"
                  step="any"
                  class="form-control"
                  [(ngModel)]="knownValue"
                  placeholder="VD: 13"
                />
              </div>
            </div>
          </div>

          <!-- Find box -->
          <div class="param-box find-box">
            <div class="box-title">
              <span class="box-icon">🎯</span>
              <span>Đại lượng CẦN TÌM:</span>
            </div>
            <div class="param-fields">
              <div class="field-item">
                <label>Chất cần tìm:</label>
                <input
                  type="text"
                  class="form-control"
                  [(ngModel)]="findFormula"
                  placeholder="VD: ZnCl2 hoặc H2"
                />
              </div>
              <div class="field-item">
                <label>Loại đại lượng:</label>
                <select class="form-select" [(ngModel)]="findKind">
                  <option value="mass">Khối lượng m (gam)</option>
                  <option value="volume">Thể tích khí V (lít, đktc)</option>
                  <option value="mole">Số mol n (mol)</option>
                </select>
              </div>
            </div>
          </div>
        </div>

        <!-- Action Row & Presets -->
        <div class="action-row">
          <div class="presets-row">
            <span class="presets-label">Bài mẫu:</span>
            <div class="presets-list">
              @for (item of samples; track item.label) {
                <button
                  type="button"
                  class="btn-sample"
                  (click)="loadSample(item)"
                >
                  {{ item.label }}
                </button>
              }
            </div>
          </div>

          <button
            class="btn-solve"
            (click)="solve()"
            [disabled]="loading() || !equation.trim() || !knownFormula.trim() || !findFormula.trim()"
          >
            @if (loading()) {
              <span class="spinner"></span> Đang tính toán...
            } @else {
              <span>✨ Giải bài toán</span>
            }
          </button>
        </div>
      </div>

      <!-- Error Alert -->
      @if (errorMessage()) {
        <div class="error-alert">
          <span class="error-icon">⚠️</span>
          <div>
            <strong>Không thể giải bài toán:</strong> {{ errorMessage() }}
          </div>
        </div>
      }

      <!-- Solution Result Section -->
      @if (solution(); as res) {
        <div class="solution-section">
          <!-- Final Answer Spotlight Card -->
          <div class="answer-card">
            <div class="answer-top">
              <span class="answer-badge">🎯 Đáp Số Bài Toán</span>
              <span class="balanced-summary">
                Phương trình: <strong>{{ res.balanced }}</strong>
              </span>
            </div>

            <div class="answer-display">
              <span class="find-label">
                {{ res.find.kind === 'mass' ? 'Khối lượng' : res.find.kind === 'volume' ? 'Thể tích đktc' : 'Số mol' }}
                của {{ res.find.formula }}:
              </span>
              <span class="value-highlight">{{ res.find.display }}</span>
            </div>

            <div class="stats-row">
              <div class="stat-pill">
                <span class="stat-name">Số mol đã biết:</span>
                <span class="stat-val">{{ res.known.moles }} mol ({{ res.known.formula }})</span>
              </div>
              <div class="stat-pill">
                <span class="stat-name">Số mol cần tìm:</span>
                <span class="stat-val">{{ res.find.moles }} mol ({{ res.find.formula }})</span>
              </div>
              <div class="stat-pill">
                <span class="stat-name">Khối lượng mol M:</span>
                <span class="stat-val">{{ res.find.molar_mass }} g/mol</span>
              </div>
            </div>
          </div>

          <!-- Step-by-Step Pedagogical Explanation -->
          <div class="steps-container">
            <div class="steps-heading">
              <span class="steps-icon">📝</span>
              <h2>Các bước giải toán chi tiết (Mô phỏng bài giảng sư phạm)</h2>
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

      .form-label {
        display: block;
        font-size: 0.9rem;
        font-weight: 600;
        color: #374151;
        margin-bottom: 8px;
      }

      .equation-input {
        width: 100%;
        padding: 12px 16px;
        font-family: 'JetBrains Mono', 'Be Vietnam Pro', monospace;
        font-size: 1.15rem;
        color: #111827;
        background: #f9fafb;
        border: 1.5px solid #d1d5db;
        border-radius: 12px;
        outline: none;
        transition: all 0.2s;

        &:focus {
          background: #ffffff;
          border-color: #00a859;
          box-shadow: 0 0 0 3px rgba(0, 168, 89, 0.15);
        }
      }

      .params-grid {
        display: grid;
        grid-template-columns: 1fr 1fr;
        gap: 16px;
        margin-top: 18px;
        margin-bottom: 20px;

        @media (max-width: 768px) {
          grid-template-columns: 1fr;
        }
      }

      .param-box {
        border-radius: 14px;
        padding: 18px;

        .box-title {
          display: flex;
          align-items: center;
          gap: 8px;
          font-weight: 700;
          font-size: 0.95rem;
          margin-bottom: 14px;
        }

        &.known-box {
          background: #f0fdf4;
          border: 1.5px solid #bbf7d0;
          .box-title {
            color: #15803d;
          }
        }

        &.find-box {
          background: #f0f9ff;
          border: 1.5px solid #bae6fd;
          .box-title {
            color: #0369a1;
          }
        }
      }

      .param-fields {
        display: flex;
        flex-direction: column;
        gap: 10px;

        .field-item {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 10px;

          label {
            font-size: 0.85rem;
            color: #475569;
            font-weight: 500;
            min-width: 110px;
          }

          .form-control,
          .form-select {
            flex: 1;
            padding: 8px 12px;
            font-size: 0.9rem;
            border: 1px solid #cbd5e1;
            border-radius: 8px;
            background: #ffffff;
            outline: none;

            &:focus {
              border-color: #00a859;
            }
          }
        }
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
      }

      /* Answer Card */
      .answer-card {
        background: linear-gradient(135deg, #065f46 0%, #047857 50%, #00a859 100%);
        color: #ffffff;
        border-radius: 18px;
        padding: 26px 28px;
        margin-bottom: 28px;
        box-shadow: 0 12px 30px rgba(0, 168, 89, 0.25);

        .answer-top {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 14px;

          .answer-badge {
            background: rgba(255, 255, 255, 0.2);
            padding: 4px 12px;
            border-radius: 20px;
            font-size: 0.85rem;
            font-weight: 700;
            backdrop-filter: blur(4px);
          }

          .balanced-summary {
            font-size: 0.95rem;
            opacity: 0.95;
            font-family: 'JetBrains Mono', monospace;
          }
        }

        .answer-display {
          display: flex;
          align-items: baseline;
          gap: 12px;
          margin-bottom: 18px;

          .find-label {
            font-size: 1.2rem;
            font-weight: 600;
            opacity: 0.9;
          }

          .value-highlight {
            font-size: 2.2rem;
            font-weight: 900;
            letter-spacing: -0.5px;
            color: #fef08a;
            text-shadow: 0 2px 8px rgba(0, 0, 0, 0.2);
          }
        }

        .stats-row {
          display: flex;
          gap: 12px;
          flex-wrap: wrap;

          .stat-pill {
            background: rgba(0, 0, 0, 0.15);
            padding: 6px 14px;
            border-radius: 10px;
            font-size: 0.85rem;
            display: flex;
            gap: 6px;

            .stat-name {
              opacity: 0.75;
            }

            .stat-val {
              font-weight: 700;
              color: #a7f3d0;
            }
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
export class SolverQuantityComponent implements OnInit {
  private readonly api = inject(ApiService);
  private readonly tabService = inject(TabService);

  equation = 'Zn + HCl → ZnCl2 + H2';
  knownFormula = 'Zn';
  knownKind = 'mass';
  knownValue = 13;
  findFormula = 'ZnCl2';
  findKind = 'mass';

  loading = signal(false);
  errorMessage = signal<string | null>(null);
  solution = signal<QuantitySolution | null>(null);

  samples = [
    {
      label: '13g Zn ➔ ?g ZnCl₂',
      eq: 'Zn + HCl → ZnCl2 + H2',
      kf: 'Zn',
      kk: 'mass',
      kv: 13,
      ff: 'ZnCl2',
      fk: 'mass',
    },
    {
      label: '13g Zn ➔ ? lít H₂ (đktc)',
      eq: 'Zn + HCl → ZnCl2 + H2',
      kf: 'Zn',
      kk: 'mass',
      kv: 13,
      ff: 'H2',
      fk: 'volume',
    },
    {
      label: '16g Fe₂O₃ ➔ ?g Fe',
      eq: 'Fe2O3 + H2 → Fe + H2O',
      kf: 'Fe2O3',
      kk: 'mass',
      kv: 16,
      ff: 'Fe',
      fk: 'mass',
    },
    {
      label: '5.4g Al ➔ ?g Al₂(SO₄)₃',
      eq: 'Al + H2SO4 → Al2(SO4)3 + H2',
      kf: 'Al',
      kk: 'mass',
      kv: 5.4,
      ff: 'Al2(SO4)3',
      fk: 'mass',
    },
  ];

  ngOnInit() {
    this.solve();
  }

  loadSample(s: any) {
    this.equation = s.eq;
    this.knownFormula = s.kf;
    this.knownKind = s.kk;
    this.knownValue = s.kv;
    this.findFormula = s.ff;
    this.findKind = s.fk;
    this.solve();
  }

  solve() {
    if (!this.equation || !this.knownFormula || !this.findFormula) return;

    this.loading.set(true);
    this.errorMessage.set(null);

    this.api
      .solveQuantity({
        equation: this.equation.trim(),
        known: {
          formula: this.knownFormula.trim(),
          kind: this.knownKind,
          value: Number(this.knownValue),
        },
        find: {
          formula: this.findFormula.trim(),
          kind: this.findKind,
        },
      })
      .subscribe({
        next: (res) => {
          this.loading.set(false);
          this.solution.set(res);
          this.tabService.updateTabTitle(
            this.tabService.activeTabId(),
            `Toán: ${this.findFormula} = ${res.find.display}`
          );
        },
        error: (err) => {
          this.loading.set(false);
          this.errorMessage.set(err.message || 'Lỗi khi tính đại lượng.');
        },
      });
  }

  getStepLines(stepText: string): string[] {
    return stepText.split('\n').filter((l) => l.trim().length > 0);
  }
}
