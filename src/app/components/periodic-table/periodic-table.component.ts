import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ApiService } from '../../services/api.service';
import { TabService } from '../../services/tab.service';
import { ElementData } from '../../models/chemistry.models';

@Component({
  selector: 'app-periodic-table',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="periodic-page">
      <div class="page-header">
        <div class="badge-tag">Tập hợp nguyên tố E trong mô hình K</div>
        <h1 class="page-title">
          <span>⚛️</span> Bảng Tuần Hoàn Nguyên Tố Hóa Học THPT
        </h1>
        <p class="page-subtitle">
          Khám phá số hiệu nguyên tử (Z), nguyên tử khối (M), hóa trị và vị trí trong dãy hoạt động hóa học.
        </p>
      </div>

      <!-- Filter / Legend Bar -->
      <div class="legend-bar">
        <div class="legend-item"><span class="dot kim-loai"></span> Kim loại</div>
        <div class="legend-item"><span class="dot phi-kim"></span> Phi kim</div>
        <div class="legend-item"><span class="dot khi-hiem"></span> Khí hiếm</div>
        <div class="legend-item"><span class="dot kiem"></span> Kim loại kiềm</div>
        <div class="legend-item"><span class="dot kiem-tho"></span> Kim loại kiềm thổ</div>
      </div>

      <!-- Elements Grid -->
      @if (loading()) {
        <div class="loading-box">Đang tải bảng nguyên tố...</div>
      } @else {
        <div class="elements-grid">
          @for (el of elements(); track el.symbol) {
            <div
              class="element-tile"
              [class]="getTypeClass(el)"
              (click)="openElementSubstance(el.symbol)"
              [title]="el.name + ' (Z=' + el.z + ', M=' + el.mass + ')'"
            >
              <div class="tile-top">
                <span class="atomic-num">{{ el.z }}</span>
                <span class="atomic-mass">{{ el.mass }}</span>
              </div>
              <div class="tile-symbol">{{ el.symbol }}</div>
              <div class="tile-name">{{ el.name }}</div>
              <div class="tile-footer">
                @if (el.valence.length > 0) {
                  <span class="val-tag">HT: {{ el.valence.join(', ') }}</span>
                }
              </div>
            </div>
          }
        </div>
      }
    </div>
  `,
  styles: [
    `
      .periodic-page {
        max-width: 1100px;
        margin: 0 auto;
        padding: 30px 20px 80px 20px;
      }

      .page-header {
        text-align: center;
        margin-bottom: 24px;

        .badge-tag {
          display: inline-block;
          font-size: 0.8rem;
          font-weight: 600;
          color: #008f4c;
          background: #e6f7ef;
          border: 1px solid #b7ebd1;
          padding: 4px 12px;
          border-radius: 20px;
          margin-bottom: 12px;
        }

        .page-title {
          font-size: 1.8rem;
          font-weight: 800;
          color: #111827;
          margin: 0 0 8px 0;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 10px;
        }

        .page-subtitle {
          font-size: 0.95rem;
          color: #4b5563;
        }
      }

      .legend-bar {
        display: flex;
        justify-content: center;
        gap: 18px;
        margin-bottom: 24px;
        flex-wrap: wrap;
        background: #ffffff;
        padding: 12px 20px;
        border-radius: 12px;
        border: 1px solid #e5e7eb;

        .legend-item {
          display: flex;
          align-items: center;
          gap: 6px;
          font-size: 0.85rem;
          color: #374151;
          font-weight: 500;
        }

        .dot {
          width: 12px;
          height: 12px;
          border-radius: 4px;

          &.kim-loai { background: #e0f2fe; border: 1px solid #7dd3fc; }
          &.phi-kim { background: #fef3c7; border: 1px solid #fde047; }
          &.khi-hiem { background: #f3e8ff; border: 1px solid #d8b4fe; }
          &.kiem { background: #fee2e2; border: 1px solid #fca5a5; }
          &.kiem-tho { background: #ffedd5; border: 1px solid #fdba74; }
        }
      }

      .loading-box {
        text-align: center;
        padding: 60px;
        color: #6b7280;
      }

      .elements-grid {
        display: grid;
        grid-template-columns: repeat(auto-fill, minmax(95px, 1fr));
        gap: 10px;
      }

      .element-tile {
        background: #ffffff;
        border: 1.5px solid #e2e8f0;
        border-radius: 12px;
        padding: 10px 8px;
        display: flex;
        flex-direction: column;
        align-items: center;
        cursor: pointer;
        transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
        text-align: center;

        &:hover {
          transform: translateY(-3px) scale(1.03);
          box-shadow: 0 8px 18px rgba(0, 0, 0, 0.08);
          border-color: #00a859;
          z-index: 2;
        }

        &.type-kim_loai {
          background: #f0f9ff;
          border-color: #bae6fd;
          .tile-symbol { color: #0284c7; }
        }

        &.type-phi_kim {
          background: #fffbeb;
          border-color: #fde68a;
          .tile-symbol { color: #d97706; }
        }

        &.type-khi_hiem {
          background: #faf5ff;
          border-color: #e9d5ff;
          .tile-symbol { color: #9333ea; }
        }

        &.group-kiem {
          background: #fef2f2;
          border-color: #fecaca;
          .tile-symbol { color: #dc2626; }
        }

        &.group-kiem_tho {
          background: #fff7ed;
          border-color: #fed7aa;
          .tile-symbol { color: #ea580c; }
        }

        .tile-top {
          width: 100%;
          display: flex;
          justify-content: space-between;
          font-size: 0.7rem;
          color: #64748b;
          font-family: 'JetBrains Mono', monospace;
          margin-bottom: 2px;
        }

        .tile-symbol {
          font-family: 'JetBrains Mono', monospace;
          font-size: 1.45rem;
          font-weight: 800;
          line-height: 1.2;
        }

        .tile-name {
          font-size: 0.74rem;
          color: #334155;
          font-weight: 600;
          margin-bottom: 4px;
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
          width: 100%;
        }

        .tile-footer {
          margin-top: auto;
          .val-tag {
            font-size: 0.68rem;
            color: #64748b;
            font-weight: 500;
          }
        }
      }
    `,
  ],
})
export class PeriodicTableComponent implements OnInit {
  private readonly api = inject(ApiService);
  private readonly tabService = inject(TabService);

  loading = signal(true);
  elements = signal<ElementData[]>([]);

  ngOnInit() {
    this.api.listElements().subscribe({
      next: (items) => {
        // Sort by atomic number Z
        const sorted = [...items].sort((a, b) => a.z - b.z);
        this.elements.set(sorted);
        this.loading.set(false);
      },
      error: () => this.loading.set(false),
    });
  }

  getTypeClass(el: ElementData): string {
    if (el.groups?.includes('kiem')) return 'group-kiem';
    if (el.groups?.includes('kiem_tho')) return 'group-kiem_tho';
    return `type-${el.type}`;
  }

  openElementSubstance(symbol: string) {
    this.tabService.openSubstanceTab(symbol, true);
  }
}
