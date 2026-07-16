export interface BestSeller {
  name: string;
  quantity: number;
  revenue: number;
  profit: number;
}

export interface ProfitReportData {
  totalRevenue: number;
  totalCost: number;
  totalDiscount: number;
  totalProfit: number;
  paymentDistribution: Record<string, number>;
  bestSellers: BestSeller[];
}
