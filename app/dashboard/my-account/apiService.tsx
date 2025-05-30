"use client";

export interface PaginationOptions {
  limit?: number;
  after?: string;
  before?: string;
}

export interface PaginatedResponse<T> {
  data: T[];
  hasNext: boolean;
  hasPrevious: boolean;
  next?: string;
  previous?: string;
  total?: number;
}

// Centralized API service for all Story Protocol APIs
export class StoryAPIService {
  private static async makeRequest(endpoint: string, options: any = {}) {
    const response = await fetch(endpoint, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      ...options
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();
    
    // Return structured pagination response
    return {
      data: data.data || data,
      hasNext: !!data.next,
      hasPrevious: !!data.previous,
      next: data.next,
      previous: data.previous,
      total: data.total
    };
  }

  private static async makeGetRequest(endpoint: string) {
    const response = await fetch(endpoint);
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    const data = await response.json();
    return data.data || data;
  }

  // Assets with pagination
  static async fetchAssets(options: any = {}, pagination?: PaginationOptions): Promise<PaginatedResponse<any>> {
    return this.makeRequest('/api/assets', {
      body: JSON.stringify({ 
        options: { 
          pagination: { limit: 20, ...pagination }, 
          ...options 
        } 
      })
    });
  }

  static async fetchAssetDetails(assetId: string) {
    return this.makeGetRequest(`/api/assets/${assetId}`);
  }

  // License Tokens with pagination
  static async fetchLicenseTokens(options: any = {}, pagination?: PaginationOptions): Promise<PaginatedResponse<any>> {
    return this.makeRequest('/api/licenses/tokens', {
      body: JSON.stringify({ 
        options: { 
          pagination: { limit: 20, ...pagination }, 
          ...options 
        } 
      })
    });
  }

  static async fetchLicenseTokenDetails(tokenId: string) {
    return this.makeGetRequest(`/api/licenses/tokens/${tokenId}`);
  }

  static async fetchLicenseTerms(termId: string) {
    return this.makeGetRequest(`/api/licenses/terms/${termId}`);
  }

  // Transactions with pagination
  static async fetchTransactions(options: any = {}, endpoint = 'transactions', pagination?: PaginationOptions): Promise<PaginatedResponse<any>> {
    return this.makeRequest('/api/transactions', {
      body: JSON.stringify({ 
        endpoint: endpoint === 'latest' ? 'latest' : undefined,
        options: { 
          pagination: { limit: 20, ...pagination }, 
          ...options 
        } 
      })
    });
  }

  static async fetchTransactionDetails(txId: string) {
    return this.makeGetRequest(`/api/transactions/${txId}`);
  }

  // Relationships
  static async fetchRelationships(ipId: string) {
    return this.makeGetRequest(`/api/ip-edges?action=relationships&ipId=${ipId}`);
  }

  // Disputes with pagination
  static async fetchDisputes(options: any = {}, pagination?: PaginationOptions): Promise<PaginatedResponse<any>> {
    return this.makeRequest('/api/disputes', {
      body: JSON.stringify({ 
        options: { 
          pagination: { limit: 20, ...pagination }, 
          ...options 
        } 
      })
    });
  }
}