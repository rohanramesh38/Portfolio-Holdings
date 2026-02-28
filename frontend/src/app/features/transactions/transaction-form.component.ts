import { Component, EventEmitter, Output, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, Validators } from '@angular/forms';
import { PortfolioService } from '../../core/services/portfolio.service';

@Component({
  selector: 'app-transaction-form',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  template: `
    <div class="form-card">
      <h3>Add Transaction</h3>
      <form [formGroup]="form" (ngSubmit)="submit()">
        <div class="form-row">
          <label>Type</label>
          <select formControlName="type">
            <option value="BUY">BUY</option>
            <option value="SELL">SELL</option>
          </select>
        </div>
        <div class="form-row">
          <label>Symbol</label>
          <input formControlName="symbol" placeholder="e.g. AAPL" />
          @if (form.get('symbol')?.invalid && form.get('symbol')?.touched) {
            <span class="error">Symbol is required</span>
          }
        </div>
        <div class="form-row">
          <label>Company Name</label>
          <input formControlName="company_name" placeholder="Optional" />
        </div>
        <div class="form-row">
          <label>Quantity</label>
          <input type="number" formControlName="quantity" min="1" />
          @if (form.get('quantity')?.invalid && form.get('quantity')?.touched) {
            <span class="error">Quantity must be &gt; 0</span>
          }
        </div>
        <div class="form-row">
          <label>Price per Share ($)</label>
          <input type="number" formControlName="price" step="0.01" min="0.01" />
          @if (form.get('price')?.invalid && form.get('price')?.touched) {
            <span class="error">Price must be &gt; 0</span>
          }
        </div>
        <div class="form-actions">
          <button type="submit" [disabled]="form.invalid || loading">
            {{ loading ? 'Submitting...' : 'Submit' }}
          </button>
          <button type="button" (click)="reset()">Reset</button>
        </div>
        @if (successMsg) { <p class="success">{{ successMsg }}</p> }
        @if (errorMsg)   { <p class="error">{{ errorMsg }}</p> }
      </form>
    </div>
  `,
  styles: [`
    .form-card { border: 1px solid #ccc; border-radius: 8px; padding: 16px; max-width: 420px; }
    h3 { margin-top: 0; }
    .form-row { display: flex; flex-direction: column; margin-bottom: 12px; }
    label { font-weight: 600; margin-bottom: 4px; font-size: 0.85rem; }
    input, select { padding: 8px; border: 1px solid #bbb; border-radius: 4px; font-size: 0.95rem; }
    .form-actions { display: flex; gap: 8px; }
    button { padding: 8px 16px; cursor: pointer; border-radius: 4px; border: none; }
    button[type=submit] { background: #1976d2; color: #fff; }
    button[type=submit]:disabled { opacity: 0.6; cursor: default; }
    button[type=button] { background: #eee; }
    .error { color: #c62828; font-size: 0.8rem; margin-top: 2px; }
    .success { color: #2e7d32; font-weight: 600; }
  `]
})
export class TransactionFormComponent {
  @Output() submitted = new EventEmitter<void>();

  private fb = inject(FormBuilder);
  private portfolioService = inject(PortfolioService);

  loading = false;
  successMsg = '';
  errorMsg = '';

  form = this.fb.group({
    type:         ['BUY', Validators.required],
    symbol:       ['', [Validators.required, Validators.maxLength(12)]],
    company_name: [''],
    quantity:     [null as number | null, [Validators.required, Validators.min(1)]],
    price:        [null as number | null, [Validators.required, Validators.min(0.01)]]
  });

  constructor() {}

  submit() {
    if (this.form.invalid) return;
    this.loading = true;
    this.successMsg = '';
    this.errorMsg = '';
    const val = this.form.value;
    this.portfolioService.createTransaction({
      user_id: 1,
      type: val.type as 'BUY' | 'SELL',
      symbol: val.symbol!.toUpperCase(),
      company_name: val.company_name || undefined,
      quantity: val.quantity!,
      price: val.price!
    }).subscribe({
      next: () => {
        this.loading = false;
        this.successMsg = 'Transaction recorded successfully!';
        this.form.reset({ type: 'BUY' });
        this.submitted.emit();
      },
      error: (err) => {
        this.loading = false;
        this.errorMsg = err?.error?.detail || 'Failed to submit transaction.';
      }
    });
  }

  reset() {
    this.form.reset({ type: 'BUY' });
    this.successMsg = '';
    this.errorMsg = '';
  }
}