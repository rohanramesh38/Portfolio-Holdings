import { Component, EventEmitter, Input, OnChanges, Output, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, Validators } from '@angular/forms';
import { Holding } from '../../models/holding.model';
import { PortfolioService } from '../../core/services/portfolio.service';

@Component({
  selector: 'app-holdings-table',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  template: `
    <div class="holdings-section">
      @if (!holdings.length) {
        <p>No holdings yet. Add a BUY transaction to get started.</p>
      }
      @if (holdings.length) {
        <table>
          <thead>
            <tr>
              <th>Symbol</th>
              <th>Company</th>
              <th>Qty</th>
              <th>Avg Cost</th>
              <th>Market Price</th>
              <th>Market Value</th>
              <th>Gain/Loss</th>
              <th>Update Price</th>
            </tr>
          </thead>
          <tbody>
            @for (h of holdings; track h.symbol) {
              <tr>
                <td><strong>{{ h.symbol }}</strong></td>
                <td>{{ h.company_name || '—' }}</td>
                <td>{{ h.quantity }}</td>
                <td>{{ h.avg_cost | number:'1.2-2' }}</td>
                <td>{{ h.market_price | number:'1.2-2' }}</td>
                <td>{{ h.market_value | number:'1.2-2' }}</td>
                <td [class]="gainLossClass(h)">{{ gainLoss(h) | number:'1.2-2' }}</td>
                <td>
                  @if (editingSymbol === h.symbol) {
                    <form [formGroup]="priceForm" (ngSubmit)="savePrice(h.symbol)" style="display:flex;gap:4px">
                      <input type="number" formControlName="price" step="0.01" style="width:80px" />
                      <button type="submit" [disabled]="priceForm.invalid || saving">✓</button>
                      <button type="button" (click)="cancelEdit()">✕</button>
                    </form>
                  } @else {
                    <button (click)="startEdit(h.symbol, h.market_price)">Edit</button>
                  }
                </td>
              </tr>
            }
          </tbody>
        </table>
      }
    </div>
  `,
  styles: [`
    table { width: 100%; border-collapse: collapse; font-size: 0.9rem; }
    th, td { padding: 8px 10px; border: 1px solid #ddd; text-align: right; }
    th { background: #f5f5f5; text-align: center; font-weight: 600; }
    td:first-child, td:nth-child(2) { text-align: left; }
    .positive { color: #2e7d32; font-weight: 600; }
    .negative { color: #c62828; font-weight: 600; }
    button { padding: 4px 10px; cursor: pointer; border-radius: 4px; border: 1px solid #bbb; }
    input[type=number] { padding: 4px; border: 1px solid #bbb; border-radius: 4px; }
  `]
})
export class HoldingsTableComponent implements OnChanges {
  @Input() holdings: Holding[] = [];
  @Output() priceUpdated = new EventEmitter<void>();

  private fb = inject(FormBuilder);
  private portfolioService = inject(PortfolioService);

  editingSymbol: string | null = null;
  saving = false;

  priceForm = this.fb.group({
    price: [null as number | null, [Validators.required, Validators.min(0.01)]]
  });

  constructor() {}

  ngOnChanges() { this.cancelEdit(); }

  gainLoss(h: Holding): number {
    return h.market_value - h.total_invested;
  }

  gainLossClass(h: Holding): string {
    return this.gainLoss(h) >= 0 ? 'positive' : 'negative';
  }

  startEdit(symbol: string, currentPrice: number) {
    this.editingSymbol = symbol;
    this.priceForm.reset({ price: currentPrice });
  }

  cancelEdit() {
    this.editingSymbol = null;
    this.priceForm.reset();
  }

  savePrice(symbol: string) {
    if (this.priceForm.invalid) return;
    this.saving = true;
    this.portfolioService.updateMarketPrice(symbol, this.priceForm.value.price!)
      .subscribe({
        next: () => {
          this.saving = false;
          this.cancelEdit();
          this.priceUpdated.emit();
        },
        error: () => { this.saving = false; }
      });
  }
}