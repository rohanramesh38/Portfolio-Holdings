import { Injectable } from '@angular/core';
import { ApiService } from './api.service';
import { Transaction } from '../../models/transaction.model';
import { Holding } from '../../models/holding.model';
import { PortfolioSummary } from '../../models/summary.model';

@Injectable({
  providedIn: 'root'
})
export class PortfolioService {

  private userId = 1;

  constructor(private api: ApiService) {}

  getHoldings() {
    return this.api.get<Holding[]>(`/holdings?user_id=${this.userId}`);
  }

  getSummary() {
    return this.api.get<PortfolioSummary>(`/summary?user_id=${this.userId}`);
  }

  getTransactions(limit = 20) {
    return this.api.get<Transaction[]>(`/transactions?user_id=${this.userId}&limit=${limit}`);
  }

  createTransaction(tx: Transaction) {
    return this.api.post(`/transactions`, tx);
  }

  updateMarketPrice(symbol: string, price: number) {
    return this.api.patch(
      `/holdings/${symbol}/market-price?user_id=${this.userId}`,
      { market_price: price }
    );
  }
}