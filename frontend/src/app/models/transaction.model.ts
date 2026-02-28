export interface Transaction {
  id?: number;
  user_id: number;
  type: 'BUY' | 'SELL';
  symbol: string;
  company_name?: string;
  quantity: number;
  price: number;
  timestamp?: string;
}