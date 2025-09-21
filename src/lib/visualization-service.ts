import { getAllDocuments } from './database';

export interface ChartData {
  type: 'bar' | 'line' | 'pie';
  title: string;
  data: Array<{
    label: string;
    value: number;
    color?: string;
  }>;
  description: string;
}

export interface MonthlySpendingData {
  month: string;
  amount: number;
  transactionCount: number;
}

export interface VendorSpendingData {
  vendor: string;
  totalAmount: number;
  transactionCount: number;
  averageAmount: number;
}

// Generate monthly spending trend data
export async function generateMonthlySpendingTrend(): Promise<ChartData> {
  console.log('Generating monthly spending trend...');
  
  const documents = await getAllDocuments();
  
  // Group by month
  const monthlyData: { [key: string]: { amount: number; count: number } } = {};
  
  documents.forEach(doc => {
    if (doc.amount && doc.date) {
      // Parse date and extract month-year
      const date = new Date(doc.date);
      const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
      const monthName = date.toLocaleDateString('en-US', { month: 'short', year: 'numeric' });
      
      if (!monthlyData[monthKey]) {
        monthlyData[monthKey] = { amount: 0, count: 0 };
      }
      
      monthlyData[monthKey].amount += doc.amount;
      monthlyData[monthKey].count += 1;
    }
  });
  
  // Convert to chart data
  const chartData = Object.entries(monthlyData)
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([monthKey, data]) => {
      const date = new Date(monthKey + '-01');
      const monthName = date.toLocaleDateString('en-US', { month: 'short', year: 'numeric' });
      
      return {
        label: monthName,
        value: data.amount,
        color: `hsl(${Math.random() * 360}, 70%, 50%)`
      };
    });
  
  return {
    type: 'line',
    title: 'Monthly Spending Trend',
    data: chartData,
    description: `Shows your spending pattern over ${chartData.length} months, with total amounts per month.`
  };
}

// Generate vendor spending breakdown
export async function generateVendorSpendingBreakdown(): Promise<ChartData> {
  console.log('Generating vendor spending breakdown...');
  
  const documents = await getAllDocuments();
  
  // Group by vendor
  const vendorData: { [key: string]: { amount: number; count: number } } = {};
  
  documents.forEach(doc => {
    if (doc.amount && doc.vendor) {
      const vendor = doc.vendor.trim();
      
      if (!vendorData[vendor]) {
        vendorData[vendor] = { amount: 0, count: 0 };
      }
      
      vendorData[vendor].amount += doc.amount;
      vendorData[vendor].count += 1;
    }
  });
  
  // Convert to chart data, limit to top 10 vendors
  const chartData = Object.entries(vendorData)
    .sort(([, a], [, b]) => b.amount - a.amount)
    .slice(0, 10)
    .map(([vendor, data]) => ({
      label: vendor,
      value: data.amount,
      color: `hsl(${Math.random() * 360}, 70%, 50%)`
    }));
  
  return {
    type: 'bar',
    title: 'Top Vendors by Spending',
    data: chartData,
    description: `Shows your top ${chartData.length} vendors by total spending amount.`
  };
}

// Generate spending distribution pie chart
export async function generateSpendingDistribution(): Promise<ChartData> {
  console.log('Generating spending distribution...');
  
  const documents = await getAllDocuments();
  
  // Categorize spending by amount ranges
  const ranges = [
    { min: 0, max: 10, label: '$0-$10' },
    { min: 10, max: 25, label: '$10-$25' },
    { min: 25, max: 50, label: '$25-$50' },
    { min: 50, max: 100, label: '$50-$100' },
    { min: 100, max: Infinity, label: '$100+' }
  ];
  
  const rangeData: { [key: string]: { amount: number; count: number } } = {};
  
  documents.forEach(doc => {
    if (doc.amount) {
      const range = ranges.find(r => doc.amount >= r.min && doc.amount < r.max);
      if (range) {
        if (!rangeData[range.label]) {
          rangeData[range.label] = { amount: 0, count: 0 };
        }
        rangeData[range.label].amount += doc.amount;
        rangeData[range.label].count += 1;
      }
    }
  });
  
  // Convert to chart data
  const chartData = Object.entries(rangeData)
    .map(([label, data]) => ({
      label: `${label} (${data.count} transactions)`,
      value: data.amount,
      color: `hsl(${Math.random() * 360}, 70%, 50%)`
    }));
  
  return {
    type: 'pie',
    title: 'Spending Distribution by Amount Range',
    data: chartData,
    description: `Shows how your spending is distributed across different amount ranges.`
  };
}

// Generate comprehensive spending analysis
export async function generateSpendingAnalysis(): Promise<{
  monthlyTrend: ChartData;
  vendorBreakdown: ChartData;
  spendingDistribution: ChartData;
  summary: {
    totalSpending: number;
    totalTransactions: number;
    averageTransaction: number;
    topVendor: string;
    topVendorAmount: number;
  };
}> {
  console.log('Generating comprehensive spending analysis...');
  
  const documents = await getAllDocuments();
  
  // Calculate summary statistics
  const totalSpending = documents.reduce((sum, doc) => sum + (doc.amount || 0), 0);
  const totalTransactions = documents.length;
  const averageTransaction = totalTransactions > 0 ? totalSpending / totalTransactions : 0;
  
  // Find top vendor
  const vendorTotals: { [key: string]: number } = {};
  documents.forEach(doc => {
    if (doc.vendor && doc.amount) {
      vendorTotals[doc.vendor] = (vendorTotals[doc.vendor] || 0) + doc.amount;
    }
  });
  
  const topVendorEntry = Object.entries(vendorTotals)
    .sort(([, a], [, b]) => b - a)[0];
  
  const topVendor = topVendorEntry ? topVendorEntry[0] : 'N/A';
  const topVendorAmount = topVendorEntry ? topVendorEntry[1] : 0;
  
  // Generate all charts
  const [monthlyTrend, vendorBreakdown, spendingDistribution] = await Promise.all([
    generateMonthlySpendingTrend(),
    generateVendorSpendingBreakdown(),
    generateSpendingDistribution()
  ]);
  
  return {
    monthlyTrend,
    vendorBreakdown,
    spendingDistribution,
    summary: {
      totalSpending,
      totalTransactions,
      averageTransaction,
      topVendor,
      topVendorAmount
    }
  };
}

// Tool function to create visualization
export async function createVisualization(chartType: 'monthly' | 'vendor' | 'distribution' | 'all'): Promise<ChartData | any> {
  switch (chartType) {
    case 'monthly':
      return await generateMonthlySpendingTrend();
    case 'vendor':
      return await generateVendorSpendingBreakdown();
    case 'distribution':
      return await generateSpendingDistribution();
    case 'all':
      return await generateSpendingAnalysis();
    default:
      throw new Error(`Unknown chart type: ${chartType}`);
  }
}
