export interface PortfolioSummary {
  user_id: number;
  total_invested: number;
  total_market_value: number;
  unrealized_gain_loss: number;
  gain_loss_pct?: number;
}