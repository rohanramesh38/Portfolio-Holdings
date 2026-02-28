import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { PortfolioService } from '../../core/services/portfolio.service';
import { Holding } from '../../models/holding.model';
import { PortfolioSummary } from '../../models/summary.model';
import { Transaction } from '../../models/transaction.model';
import { TransactionFormComponent } from '../transactions/transaction-form.component';
import { HoldingsTableComponent } from '../holdings/holdings-table.component';
import { AddHoldingFormComponent } from '../holdings/add-holding-form.component';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule, TransactionFormComponent, HoldingsTableComponent, AddHoldingFormComponent],
  templateUrl: './dashboard.component.html',
  styleUrl: './dashboard.css'
})
export class DashboardComponent implements OnInit {

  holdings: Holding[] = [];
  summary?: PortfolioSummary;
  transactions: Transaction[] = [];
  showTransactionForm = false;
  showAddHoldingForm = false;

  constructor(private portfolioService: PortfolioService) {}

  ngOnInit() {
    this.loadData();
  }

  loadData() {
    this.portfolioService.getHoldings()
      .subscribe(data => this.holdings = data);

    this.portfolioService.getSummary()
      .subscribe(data => this.summary = data);

    this.portfolioService.getTransactions()
      .subscribe(data => this.transactions = data);
  }

  onTransactionSubmitted() {
    this.showTransactionForm = false;
    this.loadData();
  }

  onPriceUpdated() {
    this.loadData();
  }

  onHoldingAdded() {
    this.showAddHoldingForm = false;
    this.loadData();
  }

  get gainLossPct(): number {
    if (!this.summary || !this.summary.total_invested) return 0;
    return (this.summary.unrealized_gain_loss / this.summary.total_invested) * 100;
  }
}