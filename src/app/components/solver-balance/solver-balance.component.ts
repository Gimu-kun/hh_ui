import { Component, Input, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ApiService } from '../../services/api.service';
import { TabService } from '../../services/tab.service';
import { BalanceSolution } from '../../models/chemistry.models';
import { ChemicalEquationComponent } from '../chemical-equation/chemical-equation.component';
import { ChemicalTextComponent } from '../chemical-text/chemical-text.component';

@Component({
  selector: 'app-solver-balance',
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
        <div class="badge-tag">Mô hình K = (E, C, R, L, Cond, H)</div>
        <h1 class="solver-title">
          <span class="icon-bubble">⚖️</span>
          Cân Bằng Phương Trình Phản Ứng Hóa Học
        </h1>
        <p class="solver-subtitle">
          Thuật toán đại số cân bằng bảo toàn nguyên tử, tối giản ước chung (GCD) và giải thích chi tiết từng bước.
        </p>
      </div>

      <!-- Main Input Card -->
      <div class="input-card">
        <label class="input-label" for="equation-input">
          Nhập phương trình hóa học (chưa cân bằng):
        </label>
        <div class="input-row">
          <div class="input-field-wrapper">
            <input
              id="equation-input"
              type="text"
              class="equation-input"
              [(ngModel)]="equation"
              (keydown.enter)="solve()"
              placeholder="Ví dụ: Al + O2 → Al2O3 hoặc Fe2O3 + CO -> Fe + CO2"
            />
            @if (equation) {
              <button class="btn-clear" (click)="equation = ''" title="Xóa">✕</button>
            }
          </div>
          <button
            class="btn-solve"
            (click)="solve()"
            [disabled]="loading() || !equation.trim()"
          >
            @if (loading()) {
              <span class="spinner"></span> Đang giải...
            } @else {
              <span>✨ Cân bằng ngay</span>
            }
          </button>
        </div>

        <!-- Chemical Quick Keypad -->
        <div class="keypad-row">
          <span class="keypad-label">Phím ký hiệu nhanh:</span>
          <div class="keypad-buttons">
            <button (click)="insert(' → ')">→</button>
            <button (click)="insert(' + ')">+</button>
            <button (click)="insert('2')">₂</button>
            <button (click)="insert('3')">₃</button>
            <button (click)="insert('4')">₄</button>
            <button (click)="insert('5')">₅</button>
            <button (click)="insert('(')">(</button>
            <button (click)="insert(')')">)</button>
          </div>
        </div>

        <!-- Preset Examples -->
        <div class="presets-row">
          <span class="presets-label">Ví dụ mẫu THPT:</span>
          <div class="presets-list">
            @for (item of samples; track item) {
              <button
                type="button"
                class="btn-sample"
                (click)="loadSample(item)"
              >
                {{ item }}
              </button>
            }
          </div>
        </div>
      </div>

      <!-- Error Alert -->
      @if (errorMessage()) {
        <div class="error-alert">
          <span class="error-icon">⚠️</span>
          <div class="error-content">
            <strong>Không thể cân bằng:</strong> {{ errorMessage() }}
            <p class="error-tip">Mẹo: Đảm bảo các nguyên tố ở vế trái và vế phải giống nhau (ví dụ: Zn + HCl → ZnCl2 + H2).</p>
          </div>
        </div>
      }

      <!-- Solution Result Section -->
      @if (solution(); as res) {
        <div class="solution-section">
          <!-- Result Card -->
          <div class="result-highlight-card">
            <div class="result-header">
              <span class="check-icon">✓</span>
              <div>
                <span class="result-badge">Phương trình đã cân bằng tối giản</span>
                <p class="result-hint">Nhấp vào bất kỳ chất nào để mở trang chi tiết tri thức về chất đó trong tab mới.</p>
              </div>
              <button class="btn-copy" (click)="copyResult(res.balanced)">
                {{ copied() ? '✓ Đã sao chép' : '📋 Sao chép' }}
              </button>
            </div>

            <div class="equation-display">
              <app-chemical-equation
                [equation]="res.balanced"
                size="lg"
              ></app-chemical-equation>
            </div>
          </div>

          <!-- Step-by-Step Pedagogical Explanation -->
          <div class="steps-container">
            <div class="steps-heading">
              <span class="steps-icon">📝</span>
              <h2>Các bước giải thích chi tiết (Mô phỏng tư duy con người)</h2>
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
          max-width: 650px;
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

      .input-label {
        display: block;
        font-size: 0.9rem;
        font-weight: 600;
        color: #374151;
        margin-bottom: 10px;
      }

      .input-row {
        display: flex;
        gap: 12px;
        margin-bottom: 16px;
      }

      .input-field-wrapper {
        flex: 1;
        position: relative;
        display: flex;
        align-items: center;
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

      .btn-clear {
        position: absolute;
        right: 12px;
        background: transparent;
        border: none;
        color: #9ca3af;
        cursor: pointer;
        font-size: 1rem;
        padding: 4px;

        &:hover {
          color: #4b5563;
        }
      }

      .btn-solve {
        background: linear-gradient(135deg, #00a859 0%, #008f4c 100%);
        color: #ffffff;
        border: none;
        border-radius: 12px;
        padding: 0 24px;
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

      .keypad-row {
        display: flex;
        align-items: center;
        gap: 10px;
        margin-bottom: 14px;
        font-size: 0.85rem;

        .keypad-label {
          color: #6b7280;
          font-weight: 500;
        }

        .keypad-buttons {
          display: flex;
          gap: 6px;

          button {
            background: #f3f4f6;
            border: 1px solid #e5e7eb;
            border-radius: 8px;
            padding: 4px 10px;
            font-family: 'JetBrains Mono', monospace;
            font-size: 0.95rem;
            font-weight: 700;
            color: #374151;
            cursor: pointer;
            transition: all 0.15s;

            &:hover {
              background: #00a859;
              color: #ffffff;
              border-color: #008f4c;
            }
          }
        }
      }

      .presets-row {
        display: flex;
        align-items: center;
        gap: 10px;
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
          padding: 4px 10px;
          font-family: 'JetBrains Mono', monospace;
          font-size: 0.82rem;
          color: #008f4c;
          font-weight: 500;
          cursor: pointer;
          transition: all 0.15s;

          &:hover {
            background: #00a859;
            color: #ffffff;
          }
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

      /* Result Section */
      .solution-section {
        animation: fadeIn 0.3s ease-out;
      }

      @keyframes fadeIn {
        from {
          opacity: 0;
          transform: translateY(10px);
        }
        to {
          opacity: 1;
          transform: translateY(0);
        }
      }

      .result-highlight-card {
        background: linear-gradient(180deg, #ffffff 0%, #f6fbf8 100%);
        border: 2px solid #a7f3d0;
        border-radius: 18px;
        padding: 24px;
        margin-bottom: 28px;
        box-shadow: 0 10px 28px rgba(0, 168, 89, 0.08);
      }

      .result-header {
        display: flex;
        align-items: center;
        gap: 14px;
        margin-bottom: 18px;

        .check-icon {
          width: 32px;
          height: 32px;
          border-radius: 50%;
          background: #00a859;
          color: #ffffff;
          display: flex;
          align-items: center;
          justify-content: center;
          font-weight: 700;
          font-size: 1.1rem;
        }

        .result-badge {
          font-size: 1.05rem;
          font-weight: 700;
          color: #008f4c;
        }

        .result-hint {
          font-size: 0.82rem;
          color: #6b7280;
          margin: 2px 0 0 0;
        }

        .btn-copy {
          margin-left: auto;
          background: #ffffff;
          border: 1px solid #d1d5db;
          border-radius: 8px;
          padding: 6px 14px;
          font-size: 0.85rem;
          font-weight: 600;
          color: #374151;
          cursor: pointer;
          transition: all 0.15s;

          &:hover {
            border-color: #00a859;
            color: #008f4c;
          }
        }
      }

      .equation-display {
        display: flex;
        justify-content: center;
        padding: 10px 0;
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
        transition: border-color 0.2s;

        &:hover {
          border-color: #bbf7d0;
        }
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
export class SolverBalanceComponent implements OnInit {
  @Input() initialEquation?: string;

  private readonly api = inject(ApiService);
  private readonly tabService = inject(TabService);

  equation = 'Al + O2 → Al2O3';
  loading = signal(false);
  errorMessage = signal<string | null>(null);
  solution = signal<BalanceSolution | null>(null);
  copied = signal(false);

  samples = [
    'Al + O2 → Al2O3',
    'KMnO4 → K2MnO4 + MnO2 + O2',
    'Fe2O3 + CO → Fe + CO2',
    'NO2 + O2 + H2O → HNO3',
    'Al + H2SO4 → Al2(SO4)3 + H2',
    'P + O2 → P2O5',
    'MgCl2 + KOH → Mg(OH)2 + KCl',
  ];

  ngOnInit() {
    if (this.initialEquation) {
      this.equation = this.initialEquation;
      this.solve();
    } else {
      this.solve();
    }
  }

  insert(text: string) {
    this.equation += text;
  }

  loadSample(sample: string) {
    this.equation = sample;
    this.solve();
  }

  solve() {
    const eq = this.equation.trim();
    if (!eq) return;

    this.loading.set(true);
    this.errorMessage.set(null);

    this.api.solveBalance(eq).subscribe({
      next: (res) => {
        this.loading.set(false);
        this.solution.set(res);
        this.tabService.updateTabTitle(
          this.tabService.activeTabId(),
          `Cân bằng: ${res.balanced.split('→')[0].trim()}`
        );
      },
      error: (err) => {
        this.loading.set(false);
        this.errorMessage.set(err.message || 'Lỗi khi cân bằng phản ứng.');
      },
    });
  }

  getStepLines(stepText: string): string[] {
    return stepText.split('\n').filter((l) => l.trim().length > 0);
  }

  copyResult(text: string) {
    navigator.clipboard.writeText(text);
    this.copied.set(true);
    setTimeout(() => this.copied.set(false), 2000);
  }
}
