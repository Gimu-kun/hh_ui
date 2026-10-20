import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { NavService } from '../../services/nav.service';
import { ApiService } from '../../services/api.service';
import { AppView, CrudResource, MetaData } from '../../models/chemistry.models';

@Component({
  selector: 'app-sidebar',
  standalone: true,
  imports: [CommonModule],
  template: `
    <aside class="app-sidebar" [class.collapsed]="nav.sidebarCollapsed()">
      <!-- Brand Logo & Header -->
      <div class="sidebar-brand">
        <div class="brand-logo-icon">🌿</div>
        @if (!nav.sidebarCollapsed()) {
          <div class="brand-info">
            <span class="brand-title">Cốc Cốc <strong>Hóa Học</strong></span>
            <span class="brand-badge">THPT Tri Thức</span>
          </div>
        }
        <button
          type="button"
          class="btn-toggle-sidebar"
          (click)="nav.toggleSidebar()"
          [title]="nav.sidebarCollapsed() ? 'Mở rộng sidebar' : 'Thu gọn sidebar'"
        >
          {{ nav.sidebarCollapsed() ? '➔' : '✕' }}
        </button>
      </div>

      <!-- Navigation Menu Groups -->
      <div class="sidebar-nav-container">
        <!-- GROUP 1: SOLVERS -->
        <div class="nav-group">
          @if (!nav.sidebarCollapsed()) {
            <div class="group-label">BỘ GIẢI BÀI TOÁN</div>
          }
          <button
            class="nav-item"
            [class.active]="nav.currentView() === 'balance'"
            (click)="selectView('balance')"
            title="Cân bằng phản ứng"
          >
            <span class="item-icon">⚖️</span>
            @if (!nav.sidebarCollapsed()) {
              <span class="item-text">Cân bằng phản ứng</span>
            }
          </button>

          <button
            class="nav-item"
            [class.active]="nav.currentView() === 'chain'"
            (click)="selectView('chain')"
            title="Chuỗi phản ứng điều chế"
          >
            <span class="item-icon">🔗</span>
            @if (!nav.sidebarCollapsed()) {
              <span class="item-text">Chuỗi phản ứng</span>
            }
          </button>

          <button
            class="nav-item"
            [class.active]="nav.currentView() === 'quantity'"
            (click)="selectView('quantity')"
            title="Giải bài toán đại lượng (m, V, n)"
          >
            <span class="item-icon">🧮</span>
            @if (!nav.sidebarCollapsed()) {
              <span class="item-text">Giải toán đại lượng</span>
            }
          </button>
        </div>

        <!-- GROUP 2: EXPLORE & LOOKUP -->
        <div class="nav-group">
          @if (!nav.sidebarCollapsed()) {
            <div class="group-label">KHÁM PHÁ & TRA CỨU</div>
          }
          <button
            class="nav-item"
            [class.active]="nav.currentView() === 'substance'"
            (click)="selectView('substance')"
            title="Chi tiết chất hóa học"
          >
            <span class="item-icon">🧪</span>
            @if (!nav.sidebarCollapsed()) {
              <span class="item-text">Chi tiết chất & hợp chất</span>
            }
          </button>

          <button
            class="nav-item"
            [class.active]="nav.currentView() === 'periodic'"
            (click)="selectView('periodic')"
            title="Bảng tuần hoàn nguyên tố"
          >
            <span class="item-icon">⚛️</span>
            @if (!nav.sidebarCollapsed()) {
              <span class="item-text">Bảng tuần hoàn</span>
            }
          </button>

          <button
            class="nav-item"
            [class.active]="nav.currentView() === 'activity'"
            (click)="selectView('activity')"
            title="Dãy hoạt động & Bảng tính tan"
          >
            <span class="item-icon">⚡</span>
            @if (!nav.sidebarCollapsed()) {
              <span class="item-text">Dãy HĐ & Tính tan</span>
            }
          </button>
        </div>

        <!-- GROUP 3: CRUD KNOWLEDGE BASE -->
        <div class="nav-group">
          @if (!nav.sidebarCollapsed()) {
            <div class="group-label">QUẢN TRỊ TRI THỨC (CRUD)</div>
          }
          <button
            class="nav-item"
            [class.active]="isCrudActive('elements')"
            (click)="selectCrud('elements')"
            title="Quản lý Nguyên tố E"
          >
            <span class="item-icon">⚛️</span>
            @if (!nav.sidebarCollapsed()) {
              <span class="item-text">Nguyên tố (E)</span>
              @if (meta) {
                <span class="item-count">{{ meta.counts.elements }}</span>
              }
            }
          </button>

          <button
            class="nav-item"
            [class.active]="isCrudActive('compounds')"
            (click)="selectCrud('compounds')"
            title="Quản lý Hợp chất C"
          >
            <span class="item-icon">🧪</span>
            @if (!nav.sidebarCollapsed()) {
              <span class="item-text">Hợp chất (C)</span>
              @if (meta) {
                <span class="item-count">{{ meta.counts.compounds }}</span>
              }
            }
          </button>

          <button
            class="nav-item"
            [class.active]="isCrudActive('reactions')"
            (click)="selectCrud('reactions')"
            title="Quản lý Phản ứng R"
          >
            <span class="item-icon">⚗️</span>
            @if (!nav.sidebarCollapsed()) {
              <span class="item-text">Phản ứng (R)</span>
              @if (meta) {
                <span class="item-count">{{ meta.counts.reactions }}</span>
              }
            }
          </button>

          <button
            class="nav-item"
            [class.active]="isCrudActive('rules')"
            (click)="selectCrud('rules')"
            title="Quản lý Hệ luật L"
          >
            <span class="item-icon">📜</span>
            @if (!nav.sidebarCollapsed()) {
              <span class="item-text">Hệ luật (L)</span>
              @if (meta) {
                <span class="item-count">{{ meta.counts.rules }}</span>
              }
            }
          </button>

          <button
            class="nav-item"
            [class.active]="isCrudActive('conditions')"
            (click)="selectCrud('conditions')"
            title="Quản lý Điều kiện Cond"
          >
            <span class="item-icon">🌡️</span>
            @if (!nav.sidebarCollapsed()) {
              <span class="item-text">Điều kiện (Cond)</span>
              @if (meta) {
                <span class="item-count">{{ meta.counts.conditions }}</span>
              }
            }
          </button>

          <button
            class="nav-item"
            [class.active]="isCrudActive('heuristics')"
            (click)="selectCrud('heuristics')"
            title="Quản lý Heuristic H"
          >
            <span class="item-icon">🧠</span>
            @if (!nav.sidebarCollapsed()) {
              <span class="item-text">Chiến lược (H)</span>
              @if (meta) {
                <span class="item-count">{{ meta.counts.heuristics }}</span>
              }
            }
          </button>

          <button
            class="nav-item"
            [class.active]="isCrudActive('formulas')"
            (click)="selectCrud('formulas')"
            title="Quản lý Công thức F"
          >
            <span class="item-icon">📐</span>
            @if (!nav.sidebarCollapsed()) {
              <span class="item-text">Công thức (F)</span>
              @if (meta) {
                <span class="item-count">{{ meta.counts.formulas }}</span>
              }
            }
          </button>

          <button
            class="nav-item"
            [class.active]="isCrudActive('reagents')"
            (click)="selectCrud('reagents')"
            title="Quản lý Thuốc thử Reagents"
          >
            <span class="item-icon">🧴</span>
            @if (!nav.sidebarCollapsed()) {
              <span class="item-text">Kho thuốc thử</span>
              @if (meta) {
                <span class="item-count">{{ meta.counts.reagents }}</span>
              }
            }
          </button>

          <button
            class="nav-item"
            [class.active]="isCrudActive('templates')"
            (click)="selectCrud('templates')"
            title="Quản lý Mẫu diễn giải Templates"
          >
            <span class="item-icon">📝</span>
            @if (!nav.sidebarCollapsed()) {
              <span class="item-text">Mẫu diễn giải</span>
              @if (meta) {
                <span class="item-count">{{ meta.counts.templates }}</span>
              }
            }
          </button>
        </div>
      </div>

      <!-- Footer Info -->
      @if (!nav.sidebarCollapsed()) {
        <div class="sidebar-footer">
          <div class="status-indicator-pill">
            <span class="status-dot online"></span>
            <span>FastAPI: Đang kết nối</span>
          </div>
          <div class="model-code">Mô hình: K = (E, C, R, L, Cond, H)</div>
        </div>
      }
    </aside>
  `,
  styles: [
    `
      .app-sidebar {
        width: 260px;
        background: #ffffff;
        border-right: 1px solid #e2e8f0;
        display: flex;
        flex-direction: column;
        height: 100vh;
        position: sticky;
        top: 0;
        z-index: 90;
        transition: width 0.25s cubic-bezier(0.4, 0, 0.2, 1);
        user-select: none;
        flex-shrink: 0;

        &.collapsed {
          width: 72px;

          .sidebar-brand {
            padding: 16px 12px;
            justify-content: center;
          }

          .btn-toggle-sidebar {
            display: none;
          }

          .sidebar-brand:hover .btn-toggle-sidebar {
            display: flex;
          }

          .nav-item {
            justify-content: center;
            padding: 12px;
          }
        }
      }

      .sidebar-brand {
        display: flex;
        align-items: center;
        gap: 12px;
        padding: 18px 20px;
        border-bottom: 1px solid #f1f5f9;
        background: linear-gradient(180deg, #ffffff 0%, #fafffc 100%);

        .brand-logo-icon {
          font-size: 1.6rem;
          line-height: 1;
        }

        .brand-info {
          display: flex;
          flex-direction: column;
          flex: 1;

          .brand-title {
            font-size: 1.05rem;
            color: #111827;
            font-weight: 500;

            strong {
              color: #00a859;
              font-weight: 800;
            }
          }

          .brand-badge {
            font-size: 0.72rem;
            color: #64748b;
            font-weight: 600;
            text-transform: uppercase;
            letter-spacing: 0.5px;
          }
        }

        .btn-toggle-sidebar {
          background: #f1f5f9;
          border: 1px solid #e2e8f0;
          border-radius: 8px;
          width: 28px;
          height: 28px;
          display: flex;
          align-items: center;
          justify-content: center;
          cursor: pointer;
          font-size: 0.8rem;
          color: #64748b;
          transition: all 0.15s;

          &:hover {
            background: #e6f7ef;
            color: #008f4c;
            border-color: #b7ebd1;
          }
        }
      }

      .sidebar-nav-container {
        flex: 1;
        overflow-y: auto;
        padding: 14px 12px;
        display: flex;
        flex-direction: column;
        gap: 18px;

        &::-webkit-scrollbar {
          width: 4px;
        }
      }

      .nav-group {
        display: flex;
        flex-direction: column;
        gap: 3px;

        .group-label {
          font-size: 0.68rem;
          font-weight: 800;
          color: #94a3b8;
          text-transform: uppercase;
          letter-spacing: 0.6px;
          padding: 6px 12px 4px 12px;
        }
      }

      .nav-item {
        display: flex;
        align-items: center;
        gap: 10px;
        padding: 9px 12px;
        background: transparent;
        border: none;
        border-radius: 10px;
        cursor: pointer;
        color: #475569;
        font-size: 0.88rem;
        font-weight: 500;
        text-align: left;
        transition: all 0.15s ease;
        position: relative;

        &:hover:not(.active) {
          background: #f8fafc;
          color: #0f172a;
        }

        &.active {
          background: #e6f7ef;
          color: #008f4c;
          font-weight: 700;

          &::before {
            content: '';
            position: absolute;
            left: 0;
            top: 6px;
            bottom: 6px;
            width: 3.5px;
            background: #00a859;
            border-radius: 0 4px 4px 0;
          }
        }

        .item-icon {
          font-size: 1.1rem;
          line-height: 1;
        }

        .item-text {
          flex: 1;
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
        }

        .item-count {
          font-size: 0.75rem;
          font-weight: 700;
          background: #f1f5f9;
          color: #64748b;
          padding: 2px 7px;
          border-radius: 10px;
          font-family: 'JetBrains Mono', monospace;
        }

        &.active .item-count {
          background: #c7f1dc;
          color: #008f4c;
        }
      }

      .sidebar-footer {
        padding: 14px 16px;
        border-top: 1px solid #f1f5f9;
        background: #fbfcfd;

        .status-indicator-pill {
          display: flex;
          align-items: center;
          gap: 8px;
          font-size: 0.8rem;
          color: #1e293b;
          font-weight: 600;
          margin-bottom: 4px;

          .status-dot {
            width: 8px;
            height: 8px;
            border-radius: 50%;
            background: #00a859;
            box-shadow: 0 0 6px rgba(0, 168, 89, 0.6);
          }
        }

        .model-code {
          font-size: 0.72rem;
          color: #64748b;
          font-family: 'JetBrains Mono', monospace;
        }
      }
    `,
  ],
})
export class AppSidebarComponent implements OnInit {
  readonly nav = inject(NavService);
  private readonly api = inject(ApiService);

  meta: MetaData | null = null;

  ngOnInit() {
    this.api.getMeta().subscribe({
      next: (data) => (this.meta = data),
    });
  }

  selectView(view: AppView) {
    this.nav.navigateTo(view);
  }

  selectCrud(resource: CrudResource) {
    this.nav.setCrudResource(resource);
  }

  isCrudActive(resource: CrudResource): boolean {
    return this.nav.currentView() === 'crud' && this.nav.selectedCrudResource() === resource;
  }
}
