import { Component, EventEmitter, Output, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, Validators } from '@angular/forms';
import { PortfolioService } from '../../core/services/portfolio.service';

@Component({
  selector: 'app-add-holding-form',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  template: `
    <div class="form-card">
      <h3>Add Holding</h3>
      <form [formGroup]="form" (ngSubmit)="submit()">
        <div class="form-row">
          <label>Symbol <span class="required">*</span></label>
          <input
            formControlName="symbol"
            placeholder="e.g. AAPL"
            (input)="toUpperCase()"
          />
          @if (form.get('symbol')?.invalid && form.get('symbol')?.touched) {
            <span class="error">Symbol is required (max 12 chars)</span>
          }
        </div>

        <div class="form-row">
          <label>Company Name</label>
          <input formControlName="company_name" placeholder="Optional" />
        </div>

        <div class="form-row">
          <label>Quantity <span class="required">*</span></label>
          <input type="number" formControlName="quantity" min="1" placeholder="e.g. 10" />
          @if (form.get('quantity')?.invalid && form.get('quantity')?.touched) {
            <span class="error">Quantity must be at least 1</span>
          }
        </div>

        <div class="form-row">
          <label>Purchase Price per Share ($) <span class="required">*</span></label>
          <input type="number" formControlName="price" step="0.01" min="0.01" placeholder="e.g. 150.00" />
          @if (form.get('price')?.invalid && form.get('price')?.touched) {
            <span class="error">Price must be greater than 0</span>
          }
        </div>

        @if (form.valid && form.get('quantity')?.value && form.get('price')?.value) {
          <div class="total-preview">
            Total Cost: <strong>\${{ totalCost | number:'1.2-2' }}</strong>
          </div>
        }

        <div class="form-actions">
          <button type="submit" [disabled]="form.invalid || loading">
            {{ loading ? 'Adding...' : 'Add Holding' }}
          </button>
          <button type="button" (click)="reset()">Reset</button>
        </div>

        @if (successMsg) { <p class="success">{{ successMsg }}</p> }
        @if (errorMsg)   { <p class="error-msg">{{ errorMsg }}</p> }
      </form>
    </div>
  `,
  styles: [`
    .form-card {
      border: 1px solid #ccc;
      border-radius: 8px;
      padding: 20px 24px;
      max-width: 460px;
      background: #fafafa;
    }
    h3 { margin-top: 0; margin-bottom: 16px; font-size: 1.1rem; color: #1565c0; }
    .form-row { display: flex; flex-direction: column; margin-bottom: 14px; }
    label { font-weight: 600; margin-bottom: 4px; font-size: 0.85rem; color: #333; }
    .required { color: #c62828; }
    input { padding: 8px 10px; border: 1px solid #bbb; border-radius: 4px; font-size: 0.95rem; }
    input:focus { outline: none; border-color: #1976d2; box-shadow: 0 0 0 2px rgba(25,118,210,.15); }
    .total-preview {
      background: #e3f2fd;
      border-radius: 4px;
      padding: 8px 12px;
      margin-bottom: 14px;
      font-size: 0.9rem;
      color: #0d47a1;
    }
    .form-actions { display: flex; gap: 8px; }
    button { padding: 8px 18px; cursor: pointer; border-radius: 4px; border: none; font-size: 0.9rem; }
    button[type=submit] { background: #1976d2; color: #fff; font-weight: 600; }
    button[type=submit]:disabled { opacity: 0.6; cursor: default; }
    button[type=button] { background: #eeeeee; color: #333; }
    .error { color: #c62828; font-size: 0.8rem; margin-top: 2px; }
    .error-msg { color: #c62828; font-weight: 600; margin-top: 8px; }
    .success { color: #2e7d32; font-weight: 600; margin-top: 8px; }
  `]
})
export class AddHoldingFormComponent {
  @Output() holdingAdded = new EventEmitter<void>();

  private fb = inject(FormBuilder);
  private portfolioService = inject(PortfolioService);

  loading = false;
  successMsg = '';
  errorMsg = '';

  form = this.fb.group({
    symbol:       ['', [Validators.required, Validators.maxLength(12)]],
    company_name: [''],
    quantity:     [null as number | null, [Validators.required, Validators.min(1)]],
    price:        [null as number | null, [Validators.required, Validators.min(0.01)]]
  });

  get totalCost(): number {
    const qty = this.form.get('quantity')?.value ?? 0;
    const price = this.form.get('price')?.value ?? 0;
    return (qty ?? 0) * (price ?? 0);
  }

  toUpperCase() {
    const ctrl = this.form.get('symbol');
    if (ctrl) {
      ctrl.setValue(ctrl.value?.toUpperCase() ?? '', { emitEvent: false });
    }
  }

  submit() {
    if (this.form.invalid) return;
    this.loading = true;
    this.successMsg = '';
    this.errorMsg = '';

    const val = this.form.value;
    this.portfolioService.createTransaction({
      user_id: 1,
      type: 'BUY',
      symbol: val.symbol!.toUpperCase(),
      company_name: val.company_name || undefined,
      quantity: val.quantity!,
      price: val.price!
    }).subscribe({
      next: () => {
        this.loading = false;
        this.successMsg = `${val.symbol!.toUpperCase()} holding added successfully!`;
        this.form.reset();
        this.holdingAdded.emit();
      },
      error: (err) => {
        this.loading = false;
        this.errorMsg = err?.error?.detail ?? 'Failed to add holding. Please try again.';
      }
    });
  }

  reset() {
    this.form.reset();
    this.successMsg = '';
    this.errorMsg = '';
  }
}
