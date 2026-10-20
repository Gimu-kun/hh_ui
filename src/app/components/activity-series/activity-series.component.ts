import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { TabService } from '../../services/tab.service';

@Component({
  selector: 'app-activity-series',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="activity-page">
      <div class="page-header">
        <div class="badge-tag">Quy luật & Kiến thức cốt lõi THPT</div>
        <h1 class="page-title">
          <span>⚡</span> Dãy Hoạt Động Hóa Học Của Kim Loại & Bảng Tính Tan
        </h1>
        <p class="page-subtitle">
          Cơ sở của hệ luật suy diễn (L2, L3, L8) trong bài toán chuỗi phản ứng và phản ứng thế kim loại.
        </p>
      </div>

      <!-- 1. Activity Series Track -->
      <div class="series-card">
        <div class="series-title-row">
          <h2>Dãy hoạt động hóa học kim loại</h2>
          <span class="trend-badge">← Tính kim loại giảm dần</span>
        </div>

        <div class="series-track">
          @for (item of metals; track item.symbol; let i = $index) {
            <div
              class="metal-card"
              [class.is-h]="item.symbol === 'H'"
              [class.is-alkali]="i < 4"
              (click)="openSubstance(item.symbol)"
              [title]="'Nhấp để xem chất ' + item.symbol"
            >
              <span class="metal-rank">#{{ i + 1 }}</span>
              <span class="metal-sym">{{ item.symbol }}</span>
              <span class="metal-name">{{ item.name }}</span>
              <span class="mnemonic-word">"{{ item.word }}"</span>
            </div>
          }
        </div>

        <div class="mnemonic-box">
          <span class="mn-icon">💡</span>
          <div>
            <strong>Câu thơ mẹo nhớ truyền thống:</strong>
            <p>"Khi (K) Bà (Ba) Con (Ca) Nào (Na) May (Mg) Áo (Al) Giáp (Zn) Sắt (Fe) Nên (Ni) Sang (Sn) Phố (Pb) Hỏi (H) Cửa (Cu) Hàng (Hg) Á (Ag) Phi (Pt) Âu (Au)"</p>
          </div>
        </div>

        <!-- Rules Explanation -->
        <div class="rules-grid">
          <div class="rule-box green">
            <h3>💧 Tác dụng với H₂O ở nhiệt độ thường</h3>
            <p><strong>K, Ba, Ca, Na</strong> tác dụng mãnh liệt với nước tạo dung dịch kiềm (Bazơ) và giải phóng khí H₂.</p>
          </div>
          <div class="rule-box blue">
            <h3>🧪 Tác dụng với Axit loãng (HCl, H₂SO₄ loãng)</h3>
            <p>Các kim loại <strong>đứng trước H</strong> (từ K đến Pb) đẩy được H ra khỏi axit, giải phóng khí H₂.</p>
          </div>
          <div class="rule-box amber">
            <h3>🔄 Kim loại đẩy kim loại khỏi dung dịch muối</h3>
            <p>Kim loại đứng trước (từ Mg trở đi) đẩy được kim loại đứng sau ra khỏi dung dịch muối của chúng.</p>
          </div>
        </div>
      </div>

      <!-- 2. Solubility Table -->
      <div class="solubility-card">
        <h2>💧 Bảng Tính Tan Cơ Bản Trong Nước</h2>
        <div class="table-responsive">
          <table class="sol-table">
            <thead>
              <tr>
                <th>Gốc Axit / Bazơ</th>
                <th>Quy tắc tính tan</th>
                <th>Ngoại lệ không tan (Kết tủa)</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td><strong>Axit (-NO₃, -CH₃COO)</strong></td>
                <td>Tất cả các muối Nitrat và Axetat đều <strong>tan tốt</strong>.</td>
                <td>Hầu như không có ngoại lệ.</td>
              </tr>
              <tr>
                <td><strong>Gốc Clorua (-Cl)</strong></td>
                <td>Hầu hết đều <strong>tan tốt</strong>.</td>
                <td><span class="precipitate">AgCl (Trắng)</span>, <span class="precipitate">PbCl₂ (Ít tan)</span>.</td>
              </tr>
              <tr>
                <td><strong>Gốc Sunfat (-SO₄)</strong></td>
                <td>Đa số đều <strong>tan tốt</strong>.</td>
                <td><span class="precipitate">BaSO₄ (Trắng)</span>, <span class="precipitate">PbSO₄</span>, <span class="precipitate">CaSO₄ (Ít tan)</span>.</td>
              </tr>
              <tr>
                <td><strong>Gốc Cacbonat (-CO₃)</strong></td>
                <td>Chỉ muối của <strong>Na⁺, K⁺, NH₄⁺</strong> tan.</td>
                <td>Hầu hết các kim loại khác đều tạo kết tủa: <span class="precipitate">CaCO₃</span>, <span class="precipitate">BaCO₃</span>, <span class="precipitate">MgCO₃</span>...</td>
              </tr>
              <tr>
                <td><strong>Nhóm Hiđroxit (-OH)</strong></td>
                <td>Bazơ của <strong>K, Na, Ba, Ca</strong> tan (hoặc ít tan).</td>
                <td>Các bazơ kim loại khác kết tủa: <span class="precipitate">Cu(OH)₂ (Xanh lam)</span>, <span class="precipitate">Fe(OH)₃ (Nâu đỏ)</span>, <span class="precipitate">Al(OH)₃ (Keo trắng)</span>.</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>
  `,
  styles: [
    `
      .activity-page {
        max-width: 1080px;
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

      .series-card, .solubility-card {
        background: #ffffff;
        border: 1px solid #e5e7eb;
        border-radius: 18px;
        padding: 26px;
        margin-bottom: 28px;
        box-shadow: 0 4px 20px rgba(0, 0, 0, 0.04);

        h2 {
          font-size: 1.25rem;
          font-weight: 700;
          color: #111827;
          margin: 0;
        }
      }

      .series-title-row {
        display: flex;
        justify-content: space-between;
        align-items: center;
        margin-bottom: 20px;

        .trend-badge {
          background: #fee2e2;
          color: #991b1b;
          padding: 4px 12px;
          border-radius: 12px;
          font-size: 0.82rem;
          font-weight: 700;
        }
      }

      .series-track {
        display: flex;
        gap: 8px;
        overflow-x: auto;
        padding-bottom: 12px;
        margin-bottom: 20px;
      }

      .metal-card {
        flex: 0 0 74px;
        background: #f8fafc;
        border: 1.5px solid #cbd5e1;
        border-radius: 12px;
        padding: 10px 4px;
        display: flex;
        flex-direction: column;
        align-items: center;
        text-align: center;
        cursor: pointer;
        transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);

        &:hover {
          transform: translateY(-3px);
          border-color: #00a859;
          box-shadow: 0 6px 16px rgba(0, 168, 89, 0.15);
        }

        &.is-alkali {
          background: #f0fdf4;
          border-color: #86efac;
          .metal-sym { color: #166534; }
        }

        &.is-h {
          background: #fef3c7;
          border-color: #fde047;
          .metal-sym { color: #b45309; }
        }

        .metal-rank {
          font-size: 0.68rem;
          color: #94a3b8;
          font-weight: 700;
        }

        .metal-sym {
          font-family: 'JetBrains Mono', monospace;
          font-size: 1.35rem;
          font-weight: 800;
          color: #0f172a;
          margin: 2px 0;
        }

        .metal-name {
          font-size: 0.72rem;
          color: #475569;
          font-weight: 600;
          white-space: nowrap;
        }

        .mnemonic-word {
          font-size: 0.7rem;
          color: #008f4c;
          font-weight: 700;
          margin-top: 4px;
        }
      }

      .mnemonic-box {
        display: flex;
        align-items: flex-start;
        gap: 12px;
        background: #f0faf4;
        border: 1.5px solid #b7ebd1;
        border-radius: 12px;
        padding: 14px 18px;
        margin-bottom: 22px;
        color: #065f46;

        .mn-icon {
          font-size: 1.4rem;
        }

        p {
          margin: 4px 0 0 0;
          font-style: italic;
          font-size: 0.95rem;
        }
      }

      .rules-grid {
        display: grid;
        grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
        gap: 14px;

        .rule-box {
          border-radius: 12px;
          padding: 16px;

          h3 {
            font-size: 0.95rem;
            margin: 0 0 8px 0;
            font-weight: 700;
          }

          p {
            font-size: 0.88rem;
            line-height: 1.5;
            margin: 0;
          }

          &.green {
            background: #f0fdf4;
            border: 1px solid #bbf7d0;
            color: #166534;
          }
          &.blue {
            background: #f0f9ff;
            border: 1px solid #bae6fd;
            color: #075985;
          }
          &.amber {
            background: #fffbeb;
            border: 1px solid #fde68a;
            color: #92400e;
          }
        }
      }

      /* Solubility Table */
      .table-responsive {
        overflow-x: auto;
        margin-top: 16px;
      }

      .sol-table {
        width: 100%;
        border-collapse: collapse;
        font-size: 0.9rem;

        th, td {
          padding: 12px 14px;
          border-bottom: 1px solid #e2e8f0;
          text-align: left;
        }

        th {
          background: #f8fafc;
          color: #475569;
          font-weight: 700;
        }

        .precipitate {
          display: inline-block;
          background: #fee2e2;
          color: #991b1b;
          font-weight: 600;
          padding: 2px 6px;
          border-radius: 4px;
          margin-right: 4px;
          font-family: 'JetBrains Mono', monospace;
        }
      }
    `,
  ],
})
export class ActivitySeriesComponent {
  private readonly tabService = inject(TabService);

  metals = [
    { symbol: 'K', name: 'Kali', word: 'Khi' },
    { symbol: 'Ba', name: 'Bari', word: 'Bà' },
    { symbol: 'Ca', name: 'Canxi', word: 'Con' },
    { symbol: 'Na', name: 'Natri', word: 'Nào' },
    { symbol: 'Mg', name: 'Magiê', word: 'May' },
    { symbol: 'Al', name: 'Nhôm', word: 'Áo' },
    { symbol: 'Zn', name: 'Kẽm', word: 'Giáp' },
    { symbol: 'Fe', name: 'Sắt', word: 'Sắt' },
    { symbol: 'Ni', name: 'Niken', word: 'Nên' },
    { symbol: 'Sn', name: 'Thiếc', word: 'Sang' },
    { symbol: 'Pb', name: 'Chì', word: 'Phố' },
    { symbol: 'H', name: 'Hiđro', word: 'Hỏi' },
    { symbol: 'Cu', name: 'Đồng', word: 'Cửa' },
    { symbol: 'Hg', name: 'Thủy ngân', word: 'Hàng' },
    { symbol: 'Ag', name: 'Bạc', word: 'Á' },
    { symbol: 'Pt', name: 'Bạch kim', word: 'Phi' },
    { symbol: 'Au', name: 'Vàng', word: 'Âu' },
  ];

  openSubstance(symbol: string) {
    this.tabService.openSubstanceTab(symbol, true);
  }
}
