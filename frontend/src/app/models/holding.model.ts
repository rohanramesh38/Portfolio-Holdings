export interface Holding {
  user_id: number;
  symbol: string;
  company_name?: string;
  quantity: number;
  avg_cost: number;
  total_invested: number;
  market_price: number;
  market_value: number;
}