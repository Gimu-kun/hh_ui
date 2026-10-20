import { Component, OnInit, inject, signal, effect } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ApiService } from '../../services/api.service';
import { NavService } from '../../services/nav.service';
import { CrudResource } from '../../models/chemistry.models';
import { ChemicalEquationComponent } from '../chemical-equation/chemical-equation.component';
import { toSubscript } from '../../utils/chemistry.utils';

@Component({
  selector: 'app-knowledge-crud',
  standalone: true,
  imports: [CommonModule, FormsModule, ChemicalEquationComponent],
  template: `
    <div class="crud-page">
      <!-- 1. Resource Selector Tabs -->
      <div class="resource-selector-bar">
        @for (res of resources; track res.key) {
          <button
            class="res-tab"
            [class.active]="nav.selectedCrudResource() === res.key"
            (click)="selectResource(res.key)"
          >
            <span class="res-icon">{{ res.icon }}</span>
            <span class="res-label">{{ res.label }}</span>
            <span class="res-symbol">({{ res.symbol }})</span>
          </button>
        }
      </div>

      <!-- 2. Action & Filter Bar -->
      <div class="action-filter-card">
        <div class="filter-left">
          <div class="search-box">
            <span class="search-icon">🔍</span>
            <input
              type="text"
              class="search-input"
              [(ngModel)]="searchQuery"
              (input)="applyFilter()"
              placeholder="Tìm kiếm trong danh sách..."
            />
            @if (searchQuery) {
              <button class="btn-clear" (click)="searchQuery = ''; applyFilter()">✕</button>
            }
          </div>

          <div class="count-badge">
            Tổng cộng: <strong>{{ filteredItems().length }}</strong> mục
          </div>
        </div>

        <div class="filter-right">
          <button class="btn-create" (click)="openCreateModal()">
            <span class="plus-icon">+</span> Thêm {{ getCurrentResourceLabel() }} Mới
          </button>
        </div>
      </div>

      <!-- Toast Feedback Message -->
      @if (feedbackMessage()) {
        <div class="feedback-alert" [class.error]="isFeedbackError()">
          <span>{{ isFeedbackError() ? '⚠️' : '✓' }}</span>
          <span>{{ feedbackMessage() }}</span>
          <button class="btn-close-alert" (click)="feedbackMessage.set(null)">✕</button>
        </div>
      }

      <!-- 3. Dynamic Data Table -->
      <div class="data-table-card">
        @if (loading()) {
          <div class="table-loading">
            <div class="spinner"></div>
            <span>Đang nạp dữ liệu tri thức...</span>
          </div>
        } @else if (filteredItems().length === 0) {
          <div class="table-empty">
            <span class="empty-icon">📂</span>
            <p>Không tìm thấy mục nào phù hợp với bộ lọc.</p>
          </div>
        } @else {
          <div class="table-responsive">
            <table class="crud-table">
              <thead>
                <tr>
                  @for (col of getColumns(); track col.key) {
                    <th>{{ col.label }}</th>
                  }
                  <th class="th-actions">Thao tác</th>
                </tr>
              </thead>
              <tbody>
                @for (item of filteredItems(); track getItemKey(item)) {
                  <tr>
                    @for (col of getColumns(); track col.key) {
                      <td>
                        @switch (col.type) {
                          @case ('formula') {
                            <a
                              class="formula-link"
                              (click)="viewSubstance(item[col.key])"
                              [title]="'Xem chi tiết chất ' + item[col.key]"
                            >
                              {{ toSubscript(item[col.key]) }}
                            </a>
                          }
                          @case ('equation') {
                            <app-chemical-equation
                              [equation]="formatEquation(item)"
                              size="sm"
                            ></app-chemical-equation>
                          }
                          @case ('badge') {
                            <span class="badge" [class]="'badge-' + item[col.key]">
                              {{ item[col.labelKey || col.key] || item[col.key] }}
                            </span>
                          }
                          @case ('number') {
                            <span class="mono-num">{{ item[col.key] }}</span>
                          }
                          @case ('list') {
                            <span class="tag-list">{{ item[col.key]?.join(', ') }}</span>
                          }
                          @default {
                            <span>{{ item[col.key] }}</span>
                          }
                        }
                      </td>
                    }
                    <td class="td-actions">
                      <button
                        class="btn-action edit"
                        (click)="openEditModal(item)"
                        title="Chỉnh sửa"
                      >
                        ✏️ Sửa
                      </button>
                      <button
                        class="btn-action delete"
                        (click)="confirmDelete(item)"
                        title="Xóa khỏi hệ thống"
                      >
                        🗑️ Xóa
                      </button>
                    </td>
                  </tr>
                }
              </tbody>
            </table>
          </div>
        }
      </div>

      <!-- 4. Modal Form (Create / Edit) -->
      @if (showModal()) {
        <div class="modal-backdrop" (click)="closeModal()">
          <div class="modal-card" (click)="$event.stopPropagation()">
            <div class="modal-header">
              <h2>
                {{ isEditMode() ? '✏️ Chỉnh Sửa' : '✨ Thêm Mới' }}
                {{ getCurrentResourceLabel() }}
              </h2>
              <button class="btn-modal-close" (click)="closeModal()">✕</button>
            </div>

            <div class="modal-body">
              <!-- Dynamic Form Fields depending on Resource -->
              @switch (nav.selectedCrudResource()) {
                <!-- ELEMENT FORM -->
                @case ('elements') {
                  <div class="form-grid">
                    <div class="form-group">
                      <label>Ký hiệu nguyên tố (Symbol): *</label>
                      <input
                        type="text"
                        class="form-control"
                        [(ngModel)]="formData.symbol"
                        [disabled]="isEditMode()"
                        placeholder="VD: Fe, Cu, Al..."
                      />
                    </div>
                    <div class="form-group">
                      <label>Tên nguyên tố: *</label>
                      <input
                        type="text"
                        class="form-control"
                        [(ngModel)]="formData.name"
                        placeholder="VD: Sắt, Đồng, Nhôm..."
                      />
                    </div>
                    <div class="form-group">
                      <label>Số hiệu nguyên tử (Z): *</label>
                      <input
                        type="number"
                        class="form-control"
                        [(ngModel)]="formData.z"
                        placeholder="VD: 26"
                      />
                    </div>
                    <div class="form-group">
                      <label>Nguyên tử khối (M): *</label>
                      <input
                        type="number"
                        step="any"
                        class="form-control"
                        [(ngModel)]="formData.mass"
                        placeholder="VD: 56"
                      />
                    </div>
                    <div class="form-group">
                      <label>Loại nguyên tố: *</label>
                      <select class="form-control" [(ngModel)]="formData.type">
                        <option value="kim_loai">Kim loại</option>
                        <option value="phi_kim">Phi kim</option>
                        <option value="khi_hiem">Khí hiếm</option>
                      </select>
                    </div>
                    <div class="form-group">
                      <label>Hóa trị (các số cách nhau bởi dấu phẩy):</label>
                      <input
                        type="text"
                        class="form-control"
                        [(ngModel)]="formData.valenceText"
                        placeholder="VD: 2, 3"
                      />
                    </div>
                    <div class="form-group">
                      <label>Vị trí dãy HĐHH (Activity):</label>
                      <input
                        type="number"
                        class="form-control"
                        [(ngModel)]="formData.activity"
                        placeholder="VD: 8 (hoặc bỏ trống)"
                      />
                    </div>
                  </div>
                }

                <!-- COMPOUND FORM -->
                @case ('compounds') {
                  <div class="form-grid">
                    <div class="form-group">
                      <label>Công thức hóa học (Formula): *</label>
                      <input
                        type="text"
                        class="form-control mono"
                        [(ngModel)]="formData.formula"
                        [disabled]="isEditMode()"
                        placeholder="VD: CaCO3, Al2O3, FeCl2..."
                      />
                    </div>
                    <div class="form-group">
                      <label>Tên gọi tiếng Việt: *</label>
                      <input
                        type="text"
                        class="form-control"
                        [(ngModel)]="formData.name"
                        placeholder="VD: Canxi cacbonat, Nhôm oxit..."
                      />
                    </div>
                    <div class="form-group">
                      <label>Phân loại chất: *</label>
                      <select class="form-control" [(ngModel)]="formData.class">
                        <option value="muoi_trung_hoa">Muối trung hòa</option>
                        <option value="muoi_axit">Muối axit</option>
                        <option value="oxit_bazo">Oxit bazơ</option>
                        <option value="oxit_axit">Oxit axit</option>
                        <option value="oxit_luong_tinh">Oxit lưỡng tính</option>
                        <option value="oxit_trung_tinh">Oxit trung tính</option>
                        <option value="axit">Axit</option>
                        <option value="bazo_tan">Bazơ tan (Kiềm)</option>
                        <option value="bazo_khong_tan">Bazơ không tan</option>
                        <option value="don_chat_kim_loai">Đơn chất kim loại</option>
                        <option value="don_chat_phi_kim">Đơn chất phi kim</option>
                        <option value="don_chat_khi_hiem">Đơn chất khí hiếm</option>
                        <option value="hidrua_kim_loai">Hiđrua kim loại</option>
                        <option value="hop_chat_khac">Hợp chất khác</option>
                      </select>
                    </div>
                    <div class="form-group">
                      <label>Trạng thái tự nhiên: *</label>
                      <select class="form-control" [(ngModel)]="formData.state">
                        <option value="ran">Rắn</option>
                        <option value="long">Lỏng</option>
                        <option value="khi">Khí</option>
                        <option value="dung_dich">Dung dịch</option>
                      </select>
                    </div>
                    <div class="form-group">
                      <label>Độ tan trong nước: *</label>
                      <select class="form-control" [(ngModel)]="formData.soluble">
                        <option value="tan">Tan</option>
                        <option value="it_tan">Ít tan</option>
                        <option value="khong_tan">Không tan (Kết tủa)</option>
                        <option value="phan_ung_nuoc">Phản ứng với nước</option>
                        <option value="chua_ro">Chưa rõ</option>
                      </select>
                    </div>
                    <div class="form-group">
                      <label>Điện tích phân tử / ion:</label>
                      <input
                        type="number"
                        class="form-control"
                        [(ngModel)]="formData.charge"
                        placeholder="0 (với phân tử)"
                      />
                    </div>
                  </div>
                }

                <!-- REACTION FORM -->
                @case ('reactions') {
                  <div class="form-grid">
                    <div class="form-group full-width">
                      <label>Chất tham gia phản ứng (cách nhau bởi dấu phẩy): *</label>
                      <input
                        type="text"
                        class="form-control mono"
                        [(ngModel)]="formData.reactantsText"
                        placeholder="VD: Zn, HCl"
                      />
                    </div>
                    <div class="form-group full-width">
                      <label>Sản phẩm tạo thành (cách nhau bởi dấu phẩy): *</label>
                      <input
                        type="text"
                        class="form-control mono"
                        [(ngModel)]="formData.productsText"
                        placeholder="VD: ZnCl2, H2"
                      />
                    </div>
                    <div class="form-group">
                      <label>Điều kiện phản ứng: *</label>
                      <select class="form-control" [(ngModel)]="formData.condition">
                        <option value="NONE">Không cần điều kiện (NONE)</option>
                        <option value="T">Nhiệt độ đun nóng (T)</option>
                        <option value="XT">Xúc tác (XT)</option>
                        <option value="DP">Điện phân (DP)</option>
                        <option value="AS">Ánh sáng (AS)</option>
                        <option value="DAC">Axit đặc (DAC)</option>
                      </select>
                    </div>
                    <div class="form-group">
                      <label>Loại phản ứng: *</label>
                      <select class="form-control" [(ngModel)]="formData.type">
                        <option value="hoa_hop">Hóa hợp</option>
                        <option value="phan_huy">Phân hủy</option>
                        <option value="the">Thế</option>
                        <option value="trao_doi">Trao đổi</option>
                        <option value="trung_hoa">Trung hòa</option>
                        <option value="oxi_hoa_khu">Oxi hóa - khử</option>
                        <option value="dien_phan">Điện phân</option>
                        <option value="khac">Khác</option>
                      </select>
                    </div>
                  </div>
                }

                <!-- RULE FORM -->
                @case ('rules') {
                  <div class="form-grid">
                    <div class="form-group">
                      <label>Mã luật: *</label>
                      <input
                        type="text"
                        class="form-control"
                        [(ngModel)]="formData.id"
                        [disabled]="isEditMode()"
                        placeholder="VD: L01, L02..."
                      />
                    </div>
                    <div class="form-group">
                      <label>Nhóm luật / Loại:</label>
                      <input
                        type="text"
                        class="form-control"
                        [(ngModel)]="formData.type"
                        placeholder="VD: acid_base, metal_acid..."
                      />
                    </div>
                    <div class="form-group full-width">
                      <label>Điều kiện tiền đề (IF text): *</label>
                      <textarea
                        class="form-control"
                        rows="2"
                        [(ngModel)]="formData.if_text"
                        placeholder="VD: Kim loại đứng trước H + Axit loãng"
                      ></textarea>
                    </div>
                    <div class="form-group full-width">
                      <label>Kết luận hệ quả (THEN text): *</label>
                      <textarea
                        class="form-control"
                        rows="2"
                        [(ngModel)]="formData.then_text"
                        placeholder="VD: Muối kim loại + H2"
                      ></textarea>
                    </div>
                  </div>
                }

                <!-- CONDITION FORM -->
                @case ('conditions') {
                  <div class="form-grid">
                    <div class="form-group">
                      <label>Mã điều kiện (Code): *</label>
                      <input
                        type="text"
                        class="form-control mono"
                        [(ngModel)]="formData.code"
                        [disabled]="isEditMode()"
                        placeholder="VD: T_CAO, XT_PT..."
                      />
                    </div>
                    <div class="form-group">
                      <label>Tên gọi điều kiện: *</label>
                      <input
                        type="text"
                        class="form-control"
                        [(ngModel)]="formData.name"
                        placeholder="VD: Nhiệt độ cao, Xúc tác Platin..."
                      />
                    </div>
                    <div class="form-group">
                      <label>Ký hiệu hiển thị:</label>
                      <input
                        type="text"
                        class="form-control"
                        [(ngModel)]="formData.symbol"
                        placeholder="VD: t°, xt, đp..."
                      />
                    </div>
                    <div class="form-group">
                      <label>Độ phức tạp (Penalties weight): *</label>
                      <input
                        type="number"
                        class="form-control"
                        [(ngModel)]="formData.complexity"
                        placeholder="VD: 1, 2, 3..."
                      />
                    </div>
                  </div>
                }

                <!-- HEURISTIC FORM -->
                @case ('heuristics') {
                  <div class="form-grid">
                    <div class="form-group">
                      <label>Mã Heuristic: *</label>
                      <input
                        type="text"
                        class="form-control"
                        [(ngModel)]="formData.id"
                        [disabled]="isEditMode()"
                        placeholder="VD: H_MIN_STEPS"
                      />
                    </div>
                    <div class="form-group">
                      <label>Tên chiến lược: *</label>
                      <input
                        type="text"
                        class="form-control"
                        [(ngModel)]="formData.name"
                        placeholder="VD: Ưu tiên đường ngắn nhất"
                      />
                    </div>
                    <div class="form-group">
                      <label>Loại heuristic (Kind): *</label>
                      <input
                        type="text"
                        class="form-control"
                        [(ngModel)]="formData.kind"
                        placeholder="VD: min_steps, aux_penalty"
                      />
                    </div>
                    <div class="form-group">
                      <label>Trọng số (Weight):</label>
                      <input
                        type="number"
                        class="form-control"
                        [(ngModel)]="formData.weight"
                        placeholder="VD: 100"
                      />
                    </div>
                  </div>
                }

                <!-- FORMULA FORM -->
                @case ('formulas') {
                  <div class="form-grid">
                    <div class="form-group">
                      <label>Mã công thức: *</label>
                      <input
                        type="text"
                        class="form-control"
                        [(ngModel)]="formData.id"
                        [disabled]="isEditMode()"
                        placeholder="VD: F_M, F_V, F_VM"
                      />
                    </div>
                    <div class="form-group">
                      <label>Biểu thức toán học (Expression): *</label>
                      <input
                        type="text"
                        class="form-control mono"
                        [(ngModel)]="formData.expression"
                        placeholder="VD: n = m / M"
                      />
                    </div>
                    <div class="form-group full-width">
                      <label>Diễn giải công thức: *</label>
                      <input
                        type="text"
                        class="form-control"
                        [(ngModel)]="formData.description"
                        placeholder="VD: Tính số mol qua khối lượng"
                      />
                    </div>
                    <div class="form-group">
                      <label>Giá trị hằng số (nếu có):</label>
                      <input
                        type="number"
                        step="any"
                        class="form-control"
                        [(ngModel)]="formData.value"
                        placeholder="VD: 22.4"
                      />
                    </div>
                  </div>
                }

                <!-- REAGENT FORM -->
                @case ('reagents') {
                  <div class="form-grid">
                    <div class="form-group">
                      <label>Công thức thuốc thử: *</label>
                      <input
                        type="text"
                        class="form-control mono"
                        [(ngModel)]="formData.formula"
                        [disabled]="isEditMode()"
                        placeholder="VD: HCl, NaOH, BaCl2 (phải có trong tập C)"
                      />
                    </div>
                    <div class="form-group">
                      <label>Nhóm thuốc thử:</label>
                      <input
                        type="text"
                        class="form-control"
                        [(ngModel)]="formData.group"
                        placeholder="VD: axit, bazo, muoi"
                      />
                    </div>
                    <div class="form-group full-width">
                      <label>Ghi chú sử dụng:</label>
                      <input
                        type="text"
                        class="form-control"
                        [(ngModel)]="formData.note"
                        placeholder="Ghi chú về thuốc thử..."
                      />
                    </div>
                  </div>
                }

                <!-- TEMPLATE FORM -->
                @case ('templates') {
                  <div class="form-grid">
                    <div class="form-group">
                      <label>Mã Template: *</label>
                      <input
                        type="text"
                        class="form-control"
                        [(ngModel)]="formData.id"
                        [disabled]="isEditMode()"
                        placeholder="VD: balance.intro, chain.step"
                      />
                    </div>
                    <div class="form-group">
                      <label>Loại bài toán (Problem): *</label>
                      <input
                        type="text"
                        class="form-control"
                        [(ngModel)]="formData.problem"
                        placeholder="VD: balance, chain, quantity"
                      />
                    </div>
                    <div class="form-group full-width">
                      <label>Nội dung mẫu diễn giải (Content): *</label>
                      <textarea
                        class="form-control mono"
                        rows="4"
                        [(ngModel)]="formData.content"
                        placeholder="Nội dung template tiếng Việt kèm biến format: {equation}, {mass}..."
                      ></textarea>
                    </div>
                  </div>
                }
              }
            </div>

            <div class="modal-footer">
              <button class="btn-cancel" (click)="closeModal()">Hủy bỏ</button>
              <button class="btn-save" (click)="saveItem()" [disabled]="saving()">
                {{ saving() ? 'Đang lưu...' : 'Lưu Thay Đổi' }}
              </button>
            </div>
          </div>
        </div>
      }
    </div>
  `,
  styles: [
    `
      .crud-page {
        max-width: 1200px;
        margin: 0 auto;
        padding: 24px 20px 80px 20px;
      }

      /* 1. Resource Selector Bar */
      .resource-selector-bar {
        display: flex;
        gap: 6px;
        overflow-x: auto;
        padding-bottom: 12px;
        margin-bottom: 20px;
      }

      .res-tab {
        display: flex;
        align-items: center;
        gap: 6px;
        padding: 8px 14px;
        background: #ffffff;
        border: 1.5px solid #e2e8f0;
        border-radius: 10px;
        font-size: 0.85rem;
        font-weight: 600;
        color: #475569;
        cursor: pointer;
        white-space: nowrap;
        transition: all 0.15s;

        &:hover {
          border-color: #00a859;
          color: #008f4c;
          background: #f0faf4;
        }

        &.active {
          background: #00a859;
          border-color: #00a859;
          color: #ffffff;
          box-shadow: 0 4px 12px rgba(0, 168, 89, 0.25);

          .res-symbol {
            color: rgba(255, 255, 255, 0.8);
          }
        }

        .res-icon {
          font-size: 1rem;
        }

        .res-symbol {
          font-size: 0.75rem;
          color: #94a3b8;
          font-family: 'JetBrains Mono', monospace;
        }
      }

      /* 2. Action & Filter Bar */
      .action-filter-card {
        background: #ffffff;
        border: 1px solid #e5e7eb;
        border-radius: 14px;
        padding: 16px 20px;
        display: flex;
        justify-content: space-between;
        align-items: center;
        gap: 16px;
        margin-bottom: 18px;
        box-shadow: 0 1px 3px rgba(0, 0, 0, 0.03);
        flex-wrap: wrap;

        .filter-left {
          display: flex;
          align-items: center;
          gap: 14px;
          flex: 1;
        }

        .search-box {
          position: relative;
          display: flex;
          align-items: center;
          background: #f8fafc;
          border: 1px solid #d1d5db;
          border-radius: 10px;
          padding: 6px 12px;
          width: 320px;

          &:focus-within {
            border-color: #00a859;
            box-shadow: 0 0 0 2px rgba(0, 168, 89, 0.15);
          }

          .search-icon {
            font-size: 0.85rem;
            margin-right: 6px;
            opacity: 0.5;
          }

          .search-input {
            width: 100%;
            border: none;
            outline: none;
            background: transparent;
            font-size: 0.88rem;
          }

          .btn-clear {
            background: transparent;
            border: none;
            color: #94a3b8;
            cursor: pointer;
            padding: 0 4px;
          }
        }

        .count-badge {
          font-size: 0.84rem;
          color: #64748b;
          strong { color: #008f4c; }
        }

        .btn-create {
          background: linear-gradient(135deg, #00a859 0%, #008f4c 100%);
          color: #ffffff;
          border: none;
          border-radius: 10px;
          padding: 9px 18px;
          font-size: 0.88rem;
          font-weight: 600;
          cursor: pointer;
          display: flex;
          align-items: center;
          gap: 6px;
          box-shadow: 0 3px 10px rgba(0, 168, 89, 0.25);
          transition: all 0.15s;

          &:hover {
            transform: translateY(-1px);
            box-shadow: 0 5px 14px rgba(0, 168, 89, 0.35);
          }

          .plus-icon {
            font-size: 1.1rem;
            font-weight: 800;
          }
        }
      }

      /* Alert Feedback */
      .feedback-alert {
        display: flex;
        align-items: center;
        gap: 10px;
        background: #ecfdf5;
        border: 1px solid #a7f3d0;
        border-radius: 10px;
        padding: 12px 16px;
        margin-bottom: 18px;
        font-size: 0.88rem;
        color: #065f46;
        font-weight: 500;

        &.error {
          background: #fef2f2;
          border-color: #fecaca;
          color: #991b1b;
        }

        .btn-close-alert {
          margin-left: auto;
          background: transparent;
          border: none;
          cursor: pointer;
          font-size: 0.9rem;
          color: inherit;
        }
      }

      /* 3. Table Card */
      .data-table-card {
        background: #ffffff;
        border: 1px solid #e5e7eb;
        border-radius: 14px;
        box-shadow: 0 2px 10px rgba(0, 0, 0, 0.03);
        overflow: hidden;
      }

      .table-loading, .table-empty {
        text-align: center;
        padding: 60px 20px;
        color: #64748b;
      }

      .spinner {
        width: 32px;
        height: 32px;
        border: 3px solid #bbf7d0;
        border-top-color: #00a859;
        border-radius: 50%;
        animation: spin 0.8s linear infinite;
        margin: 0 auto 12px auto;
      }

      @keyframes spin { to { transform: rotate(360deg); } }

      .table-responsive {
        overflow-x: auto;
      }

      .crud-table {
        width: 100%;
        border-collapse: collapse;
        font-size: 0.88rem;

        th, td {
          padding: 12px 16px;
          text-align: left;
          border-bottom: 1px solid #f1f5f9;
        }

        th {
          background: #f8fafc;
          color: #475569;
          font-weight: 700;
          font-size: 0.8rem;
          text-transform: uppercase;
          letter-spacing: 0.4px;
        }

        tr:hover td {
          background: #fcfdfd;
        }

        .th-actions {
          text-align: right;
          width: 160px;
        }

        .td-actions {
          text-align: right;
          display: flex;
          justify-content: flex-end;
          gap: 6px;
        }

        .formula-link {
          font-family: 'JetBrains Mono', monospace;
          font-weight: 700;
          color: #008f4c;
          background: #e6f7ef;
          padding: 2px 8px;
          border-radius: 6px;
          cursor: pointer;
          display: inline-block;

          &:hover {
            background: #00a859;
            color: #ffffff;
          }
        }

        .mono-num {
          font-family: 'JetBrains Mono', monospace;
          font-weight: 600;
        }

        .badge {
          display: inline-block;
          padding: 2px 8px;
          border-radius: 6px;
          font-size: 0.78rem;
          font-weight: 600;
          background: #f1f5f9;
          color: #475569;
        }

        .btn-action {
          border: 1px solid #e2e8f0;
          background: #ffffff;
          padding: 4px 8px;
          border-radius: 6px;
          font-size: 0.78rem;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.15s;

          &.edit:hover {
            background: #e0f2fe;
            color: #0369a1;
            border-color: #7dd3fc;
          }

          &.delete:hover {
            background: #fee2e2;
            color: #991b1b;
            border-color: #fca5a5;
          }
        }
      }

      /* 4. Modal */
      .modal-backdrop {
        position: fixed;
        inset: 0;
        background: rgba(15, 23, 42, 0.45);
        backdrop-filter: blur(4px);
        display: flex;
        align-items: center;
        justify-content: center;
        z-index: 1000;
        padding: 20px;
      }

      .modal-card {
        background: #ffffff;
        border-radius: 18px;
        box-shadow: 0 20px 40px rgba(0, 0, 0, 0.2);
        width: 100%;
        max-width: 650px;
        max-height: 90vh;
        display: flex;
        flex-direction: column;
        overflow: hidden;
      }

      .modal-header {
        display: flex;
        justify-content: space-between;
        align-items: center;
        padding: 20px 24px;
        border-bottom: 1px solid #e5e7eb;

        h2 {
          font-size: 1.25rem;
          font-weight: 700;
          color: #111827;
          margin: 0;
        }

        .btn-modal-close {
          background: transparent;
          border: none;
          font-size: 1.2rem;
          color: #94a3b8;
          cursor: pointer;

          &:hover { color: #1e293b; }
        }
      }

      .modal-body {
        padding: 24px;
        overflow-y: auto;
      }

      .form-grid {
        display: grid;
        grid-template-columns: 1fr 1fr;
        gap: 16px;

        .full-width {
          grid-column: span 2;
        }
      }

      .form-group {
        display: flex;
        flex-direction: column;
        gap: 6px;

        label {
          font-size: 0.85rem;
          font-weight: 600;
          color: #374151;
        }

        .form-control {
          padding: 9px 12px;
          border: 1.5px solid #d1d5db;
          border-radius: 8px;
          font-size: 0.9rem;
          outline: none;
          transition: border-color 0.2s;

          &:focus {
            border-color: #00a859;
          }

          &.mono {
            font-family: 'JetBrains Mono', monospace;
          }
        }
      }

      .modal-footer {
        display: flex;
        justify-content: flex-end;
        gap: 10px;
        padding: 16px 24px;
        border-top: 1px solid #e5e7eb;
        background: #f8fafc;

        .btn-cancel {
          background: #ffffff;
          border: 1px solid #d1d5db;
          padding: 8px 16px;
          border-radius: 8px;
          font-weight: 600;
          cursor: pointer;
        }

        .btn-save {
          background: #00a859;
          color: #ffffff;
          border: none;
          padding: 8px 20px;
          border-radius: 8px;
          font-weight: 600;
          cursor: pointer;

          &:hover {
            background: #008f4c;
          }

          &:disabled {
            opacity: 0.6;
          }
        }
      }
    `,
  ],
})
export class KnowledgeCrudComponent {
  readonly nav = inject(NavService);
  private readonly api = inject(ApiService);

  readonly toSubscript = toSubscript;

  resources: { key: CrudResource; label: string; symbol: string; icon: string }[] = [
    { key: 'elements', label: 'Nguyên tố', symbol: 'E', icon: '⚛️' },
    { key: 'compounds', label: 'Hợp chất', symbol: 'C', icon: '🧪' },
    { key: 'reactions', label: 'Phản ứng', symbol: 'R', icon: '⚗️' },
    { key: 'rules', label: 'Hệ luật', symbol: 'L', icon: '📜' },
    { key: 'conditions', label: 'Điều kiện', symbol: 'Cond', icon: '🌡️' },
    { key: 'heuristics', label: 'Chiến lược', symbol: 'H', icon: '🧠' },
    { key: 'formulas', label: 'Công thức', symbol: 'F', icon: '📐' },
    { key: 'reagents', label: 'Thuốc thử', symbol: 'Reagent', icon: '🧴' },
    { key: 'templates', label: 'Mẫu lời giải', symbol: 'Template', icon: '📝' },
  ];

  items = signal<any[]>([]);
  filteredItems = signal<any[]>([]);
  loading = signal(false);
  searchQuery = '';

  showModal = signal(false);
  isEditMode = signal(false);
  saving = signal(false);
  formData: any = {};

  feedbackMessage = signal<string | null>(null);
  isFeedbackError = signal(false);

  // In-memory cache for instantaneous tab switching with 0 latency
  private readonly cache = new Map<CrudResource, any[]>();
  // Request sequence ID to prevent race conditions from delayed responses
  private currentRequestId = 0;

  constructor() {
    // Automatically reacts whenever selectedCrudResource changes (from sidebar OR top tabs)
    effect(() => {
      const r = this.nav.selectedCrudResource();
      this.searchQuery = '';
      this.loadDataForResource(r);
    });
  }

  selectResource(resource: CrudResource) {
    if (this.nav.selectedCrudResource() === resource) {
      // Re-clicking current tab forces refresh and cache invalidation
      this.cache.delete(resource);
      this.searchQuery = '';
      this.loadDataForResource(resource);
    } else {
      this.nav.setCrudResource(resource);
    }
  }

  getCurrentResourceLabel(): string {
    const found = this.resources.find((r) => r.key === this.nav.selectedCrudResource());
    return found ? found.label : 'Mục';
  }

  loadData(forceRefresh = false) {
    const r = this.nav.selectedCrudResource();
    if (forceRefresh) {
      this.cache.delete(r);
    }
    this.loadDataForResource(r);
  }

  loadDataForResource(r: CrudResource) {
    const reqId = ++this.currentRequestId;

    // If data is already in cache, display immediately without flashing an empty screen
    if (this.cache.has(r)) {
      this.items.set(this.cache.get(r)!);
      this.applyFilter();
      this.loading.set(false);
    } else {
      // Clear out previous resource's items so columns and keys don't mismatch
      this.items.set([]);
      this.filteredItems.set([]);
      this.loading.set(true);
    }

    const handler = (data: any[]) => {
      // Discard stale response if user switched tabs in the meantime
      if (reqId !== this.currentRequestId) return;
      const list = data || [];
      this.cache.set(r, list);
      this.items.set(list);
      this.applyFilter();
      this.loading.set(false);
    };

    const errorHandler = (err: any) => {
      if (reqId !== this.currentRequestId) return;
      this.loading.set(false);
      this.showToast(err.message || 'Lỗi khi tải dữ liệu.', true);
    };

    switch (r) {
      case 'elements':
        this.api.listElements().subscribe({ next: handler, error: errorHandler });
        break;
      case 'compounds':
        this.api.listCompounds().subscribe({ next: handler, error: errorHandler });
        break;
      case 'reactions':
        this.api.listReactions().subscribe({ next: handler, error: errorHandler });
        break;
      case 'rules':
        this.api.listRules().subscribe({ next: handler, error: errorHandler });
        break;
      case 'conditions':
        this.api.listConditions().subscribe({ next: handler, error: errorHandler });
        break;
      case 'heuristics':
        this.api.listHeuristics().subscribe({ next: handler, error: errorHandler });
        break;
      case 'formulas':
        this.api.listFormulas().subscribe({ next: handler, error: errorHandler });
        break;
      case 'reagents':
        this.api.listReagents().subscribe({ next: handler, error: errorHandler });
        break;
      case 'templates':
        this.api.listTemplates().subscribe({ next: handler, error: errorHandler });
        break;
    }
  }

  applyFilter() {
    const q = this.searchQuery.trim().toLowerCase();
    if (!q) {
      this.filteredItems.set(this.items());
      return;
    }

    const filtered = this.items().filter((item) => {
      return JSON.stringify(item).toLowerCase().includes(q);
    });
    this.filteredItems.set(filtered);
  }

  getColumns(): { key: string; label: string; type?: string; labelKey?: string }[] {
    const r = this.nav.selectedCrudResource();
    switch (r) {
      case 'elements':
        return [
          { key: 'symbol', label: 'Ký hiệu', type: 'formula' },
          { key: 'name', label: 'Tên nguyên tố' },
          { key: 'z', label: 'Số hiệu (Z)', type: 'number' },
          { key: 'mass', label: 'NTK (M)', type: 'number' },
          { key: 'type', label: 'Phân loại', type: 'badge', labelKey: 'type_label' },
          { key: 'valence', label: 'Hóa trị', type: 'list' },
        ];
      case 'compounds':
        return [
          { key: 'formula', label: 'Công thức', type: 'formula' },
          { key: 'name', label: 'Tên chất' },
          { key: 'class', label: 'Phân loại', type: 'badge', labelKey: 'class_label' },
          { key: 'state', label: 'Trạng thái', type: 'badge', labelKey: 'state_label' },
          { key: 'soluble', label: 'Độ tan', type: 'badge', labelKey: 'soluble_label' },
          { key: 'molar_mass', label: 'PTK (M)', type: 'number' },
        ];
      case 'reactions':
        return [
          { key: 'id', label: 'Mã' },
          { key: 'reactants', label: 'Phương trình phản ứng', type: 'equation' },
          { key: 'condition', label: 'Điều kiện', type: 'badge', labelKey: 'condition_label' },
          { key: 'type', label: 'Loại phản ứng', type: 'badge', labelKey: 'type_label' },
        ];
      case 'rules':
        return [
          { key: 'id', label: 'Mã luật' },
          { key: 'group', label: 'Nhóm luật' },
          { key: 'if_text', label: 'Điều kiện (IF)' },
          { key: 'then_text', label: 'Hệ quả (THEN)' },
          { key: 'type', label: 'Loại phản ứng', type: 'badge' },
        ];
      case 'conditions':
        return [
          { key: 'code', label: 'Mã code' },
          { key: 'name', label: 'Tên điều kiện' },
          { key: 'symbol', label: 'Ký hiệu' },
          { key: 'complexity', label: 'Độ phức tạp', type: 'number' },
          { key: 'description', label: 'Mô tả' },
        ];
      case 'heuristics':
        return [
          { key: 'id', label: 'Mã Heuristic' },
          { key: 'name', label: 'Tên chiến lược' },
          { key: 'kind', label: 'Phân loại', type: 'badge' },
          { key: 'weight', label: 'Trọng số', type: 'number' },
          { key: 'description', label: 'Ý nghĩa' },
        ];
      case 'formulas':
        return [
          { key: 'id', label: 'Mã' },
          { key: 'name', label: 'Tên công thức' },
          { key: 'expression', label: 'Biểu thức' },
          { key: 'description', label: 'Ý nghĩa' },
          { key: 'value', label: 'Hằng số', type: 'number' },
        ];
      case 'reagents':
        return [
          { key: 'formula', label: 'Thuốc thử', type: 'formula' },
          { key: 'group', label: 'Nhóm', type: 'badge' },
          { key: 'note', label: 'Ghi chú & Hiện tượng' },
        ];
      case 'templates':
        return [
          { key: 'id', label: 'Mã Template' },
          { key: 'problem', label: 'Bài toán', type: 'badge' },
          { key: 'description', label: 'Mô tả bước' },
          { key: 'content', label: 'Nội dung mẫu diễn giải' },
        ];
    }
  }

  getItemKey(item: any): string {
    return item.id || item.symbol || item.formula || item.code || JSON.stringify(item);
  }

  formatEquation(rxn: any): string {
    if (!rxn || !rxn.reactants || !rxn.products) return '';
    const coeffs = rxn.coefficients || [];
    const rLen = rxn.reactants.length;
    const rStr = rxn.reactants
      .map((s: string, i: number) => {
        const c = coeffs[i];
        return (c && c > 1 ? c : '') + s;
      })
      .join(' + ');
    const pStr = rxn.products
      .map((s: string, i: number) => {
        const c = coeffs[rLen + i];
        return (c && c > 1 ? c : '') + s;
      })
      .join(' + ');
    return `${rStr} → ${pStr}`;
  }

  viewSubstance(formula: string) {
    this.nav.openSubstance(formula);
  }

  openCreateModal() {
    this.isEditMode.set(false);
    this.formData = this.getDefaultFormData();
    this.showModal.set(true);
  }

  openEditModal(item: any) {
    this.isEditMode.set(true);
    this.formData = { ...item };
    if (item.valence && Array.isArray(item.valence)) {
      this.formData.valenceText = item.valence.join(', ');
    }
    if (item.reactants && Array.isArray(item.reactants)) {
      this.formData.reactantsText = item.reactants.join(', ');
    }
    if (item.products && Array.isArray(item.products)) {
      this.formData.productsText = item.products.join(', ');
    }
    this.showModal.set(true);
  }

  closeModal() {
    this.showModal.set(false);
    this.formData = {};
  }

  getDefaultFormData(): any {
    const r = this.nav.selectedCrudResource();
    switch (r) {
      case 'elements':
        return { symbol: '', name: '', z: 1, mass: 1, type: 'kim_loai', valenceText: '1', activity: null };
      case 'compounds':
        return { formula: '', name: '', class: 'muoi_trung_hoa', state: 'ran', soluble: 'tan', charge: 0 };
      case 'reactions':
        return { reactantsText: '', productsText: '', condition: 'NONE', type: 'hoa_hop' };
      case 'rules':
        return { id: '', if_text: '', then_text: '', type: 'general' };
      case 'conditions':
        return { code: '', name: '', symbol: '', complexity: 1 };
      case 'heuristics':
        return { id: '', name: '', kind: 'min_steps', weight: 100 };
      case 'formulas':
        return { id: '', expression: '', description: '', value: null };
      case 'reagents':
        return { formula: '', group: '', note: '' };
      case 'templates':
        return { id: '', problem: 'balance', content: '' };
    }
  }

  saveItem() {
    const r = this.nav.selectedCrudResource();
    const payload = { ...this.formData };

    if (payload.valenceText) {
      payload.valence = payload.valenceText
        .split(',')
        .map((s: string) => parseInt(s.trim(), 10))
        .filter((n: number) => !isNaN(n));
      delete payload.valenceText;
    }

    if (payload.reactantsText) {
      payload.reactants = payload.reactantsText
        .split(',')
        .map((s: string) => s.trim())
        .filter((s: string) => s.length > 0);
      delete payload.reactantsText;
    }

    if (payload.productsText) {
      payload.products = payload.productsText
        .split(',')
        .map((s: string) => s.trim())
        .filter((s: string) => s.length > 0);
      delete payload.productsText;
    }

    this.saving.set(true);

    const onDone = () => {
      this.saving.set(false);
      this.closeModal();
      this.showToast('Thao tác lưu dữ liệu thành công!');
      this.loadData(true);
    };

    const onError = (err: any) => {
      this.saving.set(false);
      this.showToast(err.message || 'Lỗi khi lưu dữ liệu.', true);
    };

    if (this.isEditMode()) {
      // UPDATE
      switch (r) {
        case 'elements':
          this.api.updateElement(payload.symbol, payload).subscribe({ next: onDone, error: onError });
          break;
        case 'compounds':
          this.api.updateCompound(payload.formula, payload).subscribe({ next: onDone, error: onError });
          break;
        case 'reactions':
          this.api.updateReaction(payload.id, payload).subscribe({ next: onDone, error: onError });
          break;
        case 'rules':
          this.api.updateRule(payload.id, payload).subscribe({ next: onDone, error: onError });
          break;
        case 'conditions':
          this.api.updateCondition(payload.code, payload).subscribe({ next: onDone, error: onError });
          break;
        case 'heuristics':
          this.api.updateHeuristic(payload.id, payload).subscribe({ next: onDone, error: onError });
          break;
        case 'formulas':
          this.api.updateFormula(payload.id, payload).subscribe({ next: onDone, error: onError });
          break;
        case 'reagents':
          this.api.updateReagent(payload.formula, payload).subscribe({ next: onDone, error: onError });
          break;
        case 'templates':
          this.api.updateTemplate(payload.id, payload).subscribe({ next: onDone, error: onError });
          break;
      }
    } else {
      // CREATE
      switch (r) {
        case 'elements':
          this.api.createElement(payload).subscribe({ next: onDone, error: onError });
          break;
        case 'compounds':
          this.api.createCompound(payload).subscribe({ next: onDone, error: onError });
          break;
        case 'reactions':
          this.api.createReaction(payload).subscribe({ next: onDone, error: onError });
          break;
        case 'rules':
          this.api.createRule(payload).subscribe({ next: onDone, error: onError });
          break;
        case 'conditions':
          this.api.createCondition(payload).subscribe({ next: onDone, error: onError });
          break;
        case 'heuristics':
          this.api.createHeuristic(payload).subscribe({ next: onDone, error: onError });
          break;
        case 'formulas':
          this.api.createFormula(payload).subscribe({ next: onDone, error: onError });
          break;
        case 'reagents':
          this.api.createReagent(payload).subscribe({ next: onDone, error: onError });
          break;
        case 'templates':
          this.api.createTemplate(payload).subscribe({ next: onDone, error: onError });
          break;
      }
    }
  }

  confirmDelete(item: any) {
    const id = this.getItemKey(item);
    const label = item.name || item.formula || item.symbol || item.code || item.id;
    if (!confirm(`Bạn có chắc chắn muốn xóa '${label}' khỏi cơ sở tri thức?`)) {
      return;
    }

    const r = this.nav.selectedCrudResource();
    const onDone = () => {
      this.showToast(`Đã xóa '${label}' thành công.`);
      this.loadData(true);
    };
    const onError = (err: any) => {
      this.showToast(err.message || 'Lỗi khi xóa mục này.', true);
    };

    switch (r) {
      case 'elements':
        this.api.deleteElement(item.symbol).subscribe({ next: onDone, error: onError });
        break;
      case 'compounds':
        this.api.deleteCompound(item.formula).subscribe({ next: onDone, error: onError });
        break;
      case 'reactions':
        this.api.deleteReaction(item.id).subscribe({ next: onDone, error: onError });
        break;
      case 'rules':
        this.api.deleteRule(item.id).subscribe({ next: onDone, error: onError });
        break;
      case 'conditions':
        this.api.deleteCondition(item.code).subscribe({ next: onDone, error: onError });
        break;
      case 'heuristics':
        this.api.deleteHeuristic(item.id).subscribe({ next: onDone, error: onError });
        break;
      case 'formulas':
        this.api.deleteFormula(item.id).subscribe({ next: onDone, error: onError });
        break;
      case 'reagents':
        this.api.deleteReagent(item.formula).subscribe({ next: onDone, error: onError });
        break;
      case 'templates':
        this.api.deleteTemplate(item.id).subscribe({ next: onDone, error: onError });
        break;
    }
  }

  showToast(msg: string, isError = false) {
    this.feedbackMessage.set(msg);
    this.isFeedbackError.set(isError);
    setTimeout(() => {
      if (this.feedbackMessage() === msg) {
        this.feedbackMessage.set(null);
      }
    }, 4000);
  }
}
