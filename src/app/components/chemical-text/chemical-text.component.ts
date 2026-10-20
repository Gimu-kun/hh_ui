import { Component, Input, OnChanges, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { TabService } from '../../services/tab.service';
import { TextToken, tokenizeChemicalText } from '../../utils/chemistry.utils';

@Component({
  selector: 'app-chemical-text',
  standalone: true,
  imports: [CommonModule],
  template: `
    <span class="chemical-text-container">
      @for (token of tokens; track $index) {
        @if (token.type === 'substance') {
          <a
            class="chemical-badge-link"
            (click)="openSubstance($event, token.formula!)"
            [title]="'Nhấn để xem chi tiết chất ' + token.formula"
          >
            <span class="substance-name">{{ token.subscript }}</span>
            <span class="link-icon">↗</span>
          </a>
        } @else {
          <span class="plain-text">{{ token.content }}</span>
        }
      }
    </span>
  `,
  styles: [
    `
      .chemical-text-container {
        display: inline;
        line-height: 1.6;
      }

      .plain-text {
        white-space: pre-wrap;
      }

      .chemical-badge-link {
        display: inline-flex;
        align-items: center;
        gap: 2px;
        padding: 1px 6px;
        margin: 0 2px;
        background-color: #e6f7ef;
        color: #008f4c;
        border: 1px solid #b7ebd1;
        border-radius: 6px;
        font-family: 'JetBrains Mono', monospace;
        font-weight: 600;
        font-size: 0.95em;
        text-decoration: none;
        cursor: pointer;
        transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
        vertical-align: baseline;

        &:hover {
          background-color: #00a859;
          color: #ffffff;
          border-color: #008f4c;
          box-shadow: 0 2px 8px rgba(0, 168, 89, 0.3);
          transform: translateY(-1px);

          .link-icon {
            opacity: 1;
            transform: translate(1px, -1px);
          }
        }

        &:active {
          transform: translateY(0);
        }
      }

      .link-icon {
        font-size: 0.75em;
        opacity: 0.6;
        transition: all 0.2s ease;
      }
    `,
  ],
})
export class ChemicalTextComponent implements OnChanges {
  @Input() text = '';

  private readonly tabService = inject(TabService);
  tokens: TextToken[] = [];

  ngOnChanges() {
    this.tokens = tokenizeChemicalText(this.text || '');
  }

  openSubstance(event: MouseEvent, formula: string) {
    event.preventDefault();
    event.stopPropagation();
    this.tabService.openSubstanceTab(formula, true);
  }
}
