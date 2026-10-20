import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { NavService } from '../../services/nav.service';
import { ApiService } from '../../services/api.service';
import { CompoundData } from '../../models/chemistry.models';

@Component({
  selector: 'app-header',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <header class="app-header">
      <!-- Left: Mobile Toggle & Page Title -->
      <div class="header-left">
        <button
          type="button"
          class="btn-hamburger"
          (click)="nav.toggleSidebar()"
          title="Thu gọn / Mở menu"
        >
          ☰
        </button>

        <div class="title-breadcrumbs">
          <span class="view-icon">{{ getViewIcon() }}</span>
          <div class="title-text-group">
            <h1 class="page-title">{{ getViewTitle() }}</h1>
            <span class="page-desc">{{ getViewDescription() }}</span>
          </div>
        </div>
      </div>

      <!-- Center: Global Quick Search Bar -->
      <div class="header-search-container">
        <div class="search-input-wrapper">
          <span class="search-icon">🔍</span>
          <input
            type="text"
            class="header-search-input"
            [(ngModel)]="searchQuery"
            (input)="onSearchInput()"
            (keydown.enter)="onSearchEnter()"
            placeholder="Tra cứu nhanh hơn 450 chất (VD: CaCO3, Fe2O3, H2SO4, NaOH...)"
          />
          @if (searchQuery) {
            <button class="btn-clear" (click)="clearSearch()">✕</button>
          }

          <!-- Autocomplete Dropdown -->
          @if (searchResults().length > 0) {
            <div class="search-results-dropdown">
              <div class="dropdown-header">Gợi ý từ cơ sở tri thức (Tập C):</div>
              @for (item of searchResults(); track item.formula) {
                <div class="search-result-item" (click)="selectSubstance(item.formula)">
                  <span class="formula-pill">{{ item.formula }}</span>
                  <span class="name-text">{{ item.name }}</span>
                  <span class="class-label">{{ item.class_label }}</span>
                  <span class="molar-mass">M = {{ item.molar_mass || '?' }}</span>
                </div>
              }
            </div>
          }
        </div>
      </div>

      <!-- Right: Quick Shortcuts & Actions -->
      <div class="header-right">
        <button
          class="btn-header-shortcut"
          (click)="nav.navigateTo('periodic')"
          title="Mở Bảng tuần hoàn nguyên tố"
        >
          ⚛️ Bảng tuần hoàn
        </button>
        <button
          class="btn-header-shortcut"
          (click)="nav.navigateTo('activity')"
          title="Dãy hoạt động kim loại & Bảng tính tan"
        >
          ⚡ Dãy hoạt động
        </button>
      </div>
    </header>
  `,
  styles: [
    `
      .app-header {
        height: 68px;
        background: #ffffff;
        border-bottom: 1px solid #e2e8f0;
        display: flex;
        align-items: center;
        justify-content: space-between;
        padding: 0 24px;
        gap: 18px;
        position: sticky;
        top: 0;
        z-index: 80;
        box-shadow: 0 1px 3px rgba(0, 0, 0, 0.03);
      }

      .header-left {
        display: flex;
        align-items: center;
        gap: 14px;
        min-width: 260px;
      }

      .btn-hamburger {
        background: #f8fafc;
        border: 1px solid #e2e8f0;
        border-radius: 8px;
        width: 34px;
        height: 34px;
        display: flex;
        align-items: center;
        justify-content: center;
        cursor: pointer;
        font-size: 1.1rem;
        color: #475569;
        transition: all 0.15s;

        &:hover {
          background: #e6f7ef;
          color: #008f4c;
          border-color: #b7ebd1;
        }
      }

      .title-breadcrumbs {
        display: flex;
        align-items: center;
        gap: 10px;

        .view-icon {
          font-size: 1.5rem;
          line-height: 1;
        }

        .title-text-group {
          display: flex;
          flex-direction: column;

          .page-title {
            font-size: 1.05rem;
            font-weight: 700;
            color: #111827;
            margin: 0;
            line-height: 1.2;
          }

          .page-desc {
            font-size: 0.74rem;
            color: #64748b;
          }
        }
      }

      .header-search-container {
        flex: 1;
        max-width: 520px;
        position: relative;
      }

      .search-input-wrapper {
        position: relative;
        display: flex;
        align-items: center;
        background: #f8fafc;
        border: 1.5px solid #e2e8f0;
        border-radius: 12px;
        padding: 6px 14px;
        transition: all 0.2s;

        &:focus-within {
          background: #ffffff;
          border-color: #00a859;
          box-shadow: 0 0 0 3px rgba(0, 168, 89, 0.15);
        }

        .search-icon {
          font-size: 0.95rem;
          margin-right: 8px;
          opacity: 0.6;
        }

        .header-search-input {
          width: 100%;
          border: none;
          outline: none;
          background: transparent;
          font-size: 0.88rem;
          color: #1e293b;
          font-family: inherit;

          &::placeholder {
            color: #94a3b8;
          }
        }

        .btn-clear {
          background: transparent;
          border: none;
          color: #94a3b8;
          cursor: pointer;
          font-size: 0.9rem;
          padding: 0 4px;

          &:hover {
            color: #475569;
          }
        }
      }

      .search-results-dropdown {
        position: absolute;
        top: 44px;
        left: 0;
        right: 0;
        background: #ffffff;
        border: 1px solid #e2e8f0;
        border-radius: 14px;
        box-shadow: 0 12px 28px rgba(0, 0, 0, 0.12);
        padding: 8px;
        max-height: 340px;
        overflow-y: auto;
        z-index: 200;

        .dropdown-header {
          font-size: 0.74rem;
          text-transform: uppercase;
          color: #64748b;
          font-weight: 700;
          padding: 6px 10px;
        }

        .search-result-item {
          display: flex;
          align-items: center;
          gap: 10px;
          padding: 8px 12px;
          border-radius: 8px;
          cursor: pointer;
          transition: background 0.15s;

          &:hover {
            background: #e6f7ef;
          }

          .formula-pill {
            font-family: 'JetBrains Mono', monospace;
            font-weight: 700;
            color: #008f4c;
            background: #d1fae5;
            padding: 2px 8px;
            border-radius: 6px;
            font-size: 0.84rem;
          }

          .name-text {
            font-size: 0.88rem;
            color: #1e293b;
            font-weight: 500;
          }

          .class-label {
            font-size: 0.75rem;
            color: #64748b;
            background: #f1f5f9;
            padding: 2px 6px;
            border-radius: 4px;
            margin-left: auto;
          }

          .molar-mass {
            font-size: 0.78rem;
            color: #0284c7;
            font-weight: 600;
          }
        }
      }

      .header-right {
        display: flex;
        align-items: center;
        gap: 10px;

        .btn-header-shortcut {
          background: #f0faf4;
          color: #008f4c;
          border: 1px solid #b7ebd1;
          padding: 7px 14px;
          border-radius: 10px;
          font-size: 0.82rem;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.15s;
          white-space: nowrap;

          &:hover {
            background: #00a859;
            color: #ffffff;
            box-shadow: 0 2px 8px rgba(0, 168, 89, 0.25);
          }
        }
      }
    `,
  ],
})
export class AppHeaderComponent implements OnInit {
  readonly nav = inject(NavService);
  private readonly api = inject(ApiService);

  searchQuery = '';
  searchResults = signal<CompoundData[]>([]);

  ngOnInit() {}

  getViewIcon(): string {
    const v = this.nav.currentView();
    switch (v) {
      case 'balance': return '⚖️';
      case 'chain': return '🔗';
      case 'quantity': return '🧮';
      case 'substance': return '🧪';
      case 'periodic': return '⚛️';
      case 'activity': return '⚡';
      case 'crud': return '🛠️';
      default: return '🌿';
    }
  }

  getViewTitle(): string {
    const v = this.nav.currentView();
    switch (v) {
      case 'balance': return 'Cân Bằng Phương Trình';
      case 'chain': return 'Chuỗi Phản Ứng Điều Chế';
      case 'quantity': return 'Giải Toán Đại Lượng Theo Phương Trình';
      case 'substance': return `Chi Tiết Chất: ${this.nav.selectedSubstanceFormula()}`;
      case 'periodic': return 'Bảng Tuần Hoàn Nguyên Tố';
      case 'activity': return 'Dãy Hoạt Động & Bảng Tính Tan';
      case 'crud':
        return `Quản Trị Cơ Sở Tri Thức: ${this.getCrudResourceName()}`;
      default: return 'Cơ Sở Tri Thức Hóa Học Vô Cơ';
    }
  }

  getViewDescription(): string {
    const v = this.nav.currentView();
    switch (v) {
      case 'balance': return 'Giải thuật đại số bảo toàn nguyên tố và tối giản ước chung';
      case 'chain': return 'Tìm kiếm đường đi phản ứng tối ưu trên đồ thị tri thức';
      case 'quantity': return 'Tính khối lượng (m), thể tích đktc (V), số mol (n)';
      case 'substance': return 'Thông số hóa lý, tỉ lệ khối lượng và kho phản ứng';
      case 'periodic': return '118 nguyên tố hóa học THPT';
      case 'activity': return 'Quy luật phản ứng kim loại và độ tan trong nước';
      case 'crud': return 'Thêm, sửa, xóa các thành phần của mô hình K = (E, C, R, L, Cond, H)';
      default: return '';
    }
  }

  getCrudResourceName(): string {
    const r = this.nav.selectedCrudResource();
    switch (r) {
      case 'elements': return 'Nguyên tố (E)';
      case 'compounds': return 'Hợp chất (C)';
      case 'reactions': return 'Phản ứng (R)';
      case 'rules': return 'Hệ luật (L)';
      case 'conditions': return 'Điều kiện (Cond)';
      case 'heuristics': return 'Chiến lược (H)';
      case 'formulas': return 'Công thức (F)';
      case 'reagents': return 'Kho thuốc thử';
      case 'templates': return 'Mẫu diễn giải';
      default: return '';
    }
  }

  onSearchInput() {
    const q = this.searchQuery.trim();
    if (!q) {
      this.searchResults.set([]);
      return;
    }
    this.api.searchCompounds(q).subscribe({
      next: (items) => this.searchResults.set(items.slice(0, 8)),
      error: () => this.searchResults.set([]),
    });
  }

  onSearchEnter() {
    const q = this.searchQuery.trim();
    if (!q) return;

    if (q.includes('→') || q.includes('+') || q.includes('->')) {
      this.nav.navigateTo('balance', { equation: q });
      this.clearSearch();
    } else {
      this.selectSubstance(q);
    }
  }

  selectSubstance(formula: string) {
    this.nav.openSubstance(formula);
    this.clearSearch();
  }

  clearSearch() {
    this.searchQuery = '';
    this.searchResults.set([]);
  }
}
