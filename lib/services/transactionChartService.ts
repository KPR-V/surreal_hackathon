interface TransactionChartResponse {
  chart_data: Array<{
    date: string;
    transactions_count: number;
    transaction_count: number;
  }>;
}

interface TransactionChartData {
  date: string;
  count: number;
}

export class TransactionChartService {
  private static readonly API_URL = 'https://aeneid.storyscan.io/api/v2/stats/charts/transactions';

  static async fetchTransactionChart(): Promise<TransactionChartData[]> {
    try {
      console.log('Fetching transaction chart data from API...');

      const response = await fetch(this.API_URL, {
        method: 'GET',
        headers: {
          'accept': 'application/json',
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
          'Cache-Control': 'no-cache'
        }
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data: TransactionChartResponse = await response.json();
      console.log('Raw chart data received:', data);
      
      if (!data.chart_data || !Array.isArray(data.chart_data)) {
        throw new Error('Invalid chart data structure received');
      }

      // Transform the data to use transaction_count (which seems to be the primary field)
      const formattedData: TransactionChartData[] = data.chart_data
        .map(item => {
          // Use transaction_count as primary, fall back to transactions_count
          const count = item.transaction_count || item.transactions_count;
          
          if (typeof count !== 'number' || isNaN(count)) {
            console.warn('Invalid transaction count:', { item, count });
            return null;
          }

          return {
            date: item.date,
            count: count
          };
        })
        .filter(item => item !== null) // Remove invalid entries
        .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()); // Sort by date ascending

      console.log('Formatted chart data:', formattedData);

      if (formattedData.length === 0) {
        throw new Error('No valid transaction data found in response');
      }

      return formattedData;
    } catch (error) {
      console.error('Error fetching transaction chart:', error);
      throw error;
    }
  }

  static formatDate(dateString: string): string {
    try {
      const date = new Date(dateString);
      if (isNaN(date.getTime())) {
        return dateString;
      }
      return date.toLocaleDateString('en-US', { 
        month: 'short', 
        day: 'numeric' 
      });
    } catch {
      return dateString;
    }
  }

  static formatFullDate(dateString: string): string {
    try {
      const date = new Date(dateString);
      if (isNaN(date.getTime())) {
        return dateString;
      }
      return date.toLocaleDateString('en-US', { 
        weekday: 'short',
        month: 'short', 
        day: 'numeric',
        year: 'numeric'
      });
    } catch {
      return dateString;
    }
  }
}