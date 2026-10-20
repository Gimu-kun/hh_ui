import { Component, Input, OnChanges, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { TabService } from '../../services/tab.service';
import { EquationPart, parseEquationLine } from '../../utils/chemistry.utils';

@Component({
  selector: 'app-chemical-equation',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="equation-box" [class.size-lg]="size === 'lg'" [class.size-sm]="size === 'sm'">
      @for (part of parts; track $index) {
        @if (part.type === 'coefficient') {
          <span class="part-coefficient">{{ part.text }}</span>
        } @else if (part.type === 'substance') {
          <button
            type="button"
            class="part-substance"
            (click)="openSubstance($event, part.formula!)"
            [title]="'Xem chi tiết chất ' + part.formula"
          >
            <span>{{ part.text }}</span>
            <span class="badge-dot"></span>
          </button>
        } @else if (part.type === 'operator') {
          <span class="part-operator">{{ part.text }}</span>
        } @else if (part.type === 'arrow') {
          <div class="arrow-container">
            @if (condition) {
              <span class="arrow-condition">{{ condition }}</span>
            }
            <span class="part-arrow">→</span>
          </div>
        }
      }
    </div>
  `,
  styles: [
    `
      .equation-box {
        display: inline-flex;
        flex-wrap: wrap;
        align-items: center;
        gap: 6px;
        font-family: 'JetBrains Mono', 'Be Vietnam Pro', monospace;
        font-size: 1.15rem;
        font-weight: 500;
        color: #1e293b;
        padding: 8px 14px;
        background: #ffffff;
        border: 1px solid #e2e8f0;
        border-radius: 12px;
        box-shadow: 0 1px 3px rgba(0, 0, 0, 0.04);
        transition: all 0.2s ease;

        &:hover {
          border-color: #b7ebd1;
          box-shadow: 0 4px 12px rgba(0, 168, 89, 0.08);
        }

        &.size-lg {
          font-size: 1.35rem;
          padding: 12px 18px;
          border-width: 1.5px;
          border-color: #a7f3d0;
          background: linear-gradient(180deg, #ffffff 0%, #f6fdf9 100%);
        }

        &.size-sm {
          font-size: 0.95rem;
          padding: 4px 10px;
          border-radius: 8px;
        }
      }

      .part-coefficient {
        font-weight: 700;
        color: #0284c7;
        font-size: 1.1em;
      }

      .part-substance {
        display: inline-flex;
        align-items: center;
        gap: 4px;
        padding: 2px 8px;
        background: #f0faf4;
        color: #008f4c;
        border: 1px solid #c7f1dc;
        border-radius: 8px;
        font-weight: 700;
        font-family: inherit;
        font-size: inherit;
        cursor: pointer;
        transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);

        &:hover {
          background: #00a859;
          color: #ffffff;
          border-color: #008f4c;
          transform: translateY(-1.5px);
          box-shadow: 0 3px 10px rgba(0, 168, 89, 0.35);

          .badge-dot {
            background-color: #ffffff;
          }
        }

        &:active {
          transform: translateY(0);
        }
      }

      .badge-dot {
        width: 5px;
        height: 5px;
        border-radius: 50%;
        background-color: #00a859;
        transition: background-color 0.2s ease;
      }

      .part-operator {
        color: #64748b;
        font-weight: 600;
        margin: 0 2px;
      }

      .arrow-container {
        display: inline-flex;
        flex-direction: column;
        align-items: center;
        justify-content: center;
        margin: 0 6px;
      }

      .arrow-condition {
        font-size: 0.75rem;
        font-weight: 700;
        color: #d97706;
        line-height: 1;
        margin-bottom: 2px;
        letter-spacing: 0.5px;
      }

      .part-arrow {
        color: #00a859;
        font-weight: 800;
        font-size: 1.2em;
        line-height: 1;
      }
    `,
  ],
})
export class ChemicalEquationComponent implements OnChanges {
  @Input() equation = '';
  @Input() condition?: string;
  @Input() size: 'sm' | 'md' | 'lg' = 'md';

  private readonly tabService = inject(TabService);
  parts: EquationPart[] = [];

  ngOnChanges() {
    this.parts = parseEquationLine(this.equation || '');
  }

  openSubstance(event: MouseEvent, formula: string) {
    event.preventDefault();
    event.stopPropagation();
    this.tabService.openSubstanceTab(formula, true);
  }
}
