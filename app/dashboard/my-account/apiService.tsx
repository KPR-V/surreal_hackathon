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

// Helper functions (internal use only)
async function makeRequest(endpoint: string, options: any = {}) {
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

async function makeGetRequest(endpoint: string) {
  const response = await fetch(endpoint);
  if (!response.ok) {
    throw new Error(`HTTP error! status: ${response.status}`);
  }
  const data = await response.json();
  return data.data || data;
}

// Exported API functions (same names as class methods)

// Assets with pagination
export async function fetchAssets(options: any = {}, pagination?: PaginationOptions): Promise<PaginatedResponse<any>> {
  return makeRequest('/api/assets', {
    body: JSON.stringify({ 
      options: { 
        pagination: { limit: 20, ...pagination }, 
        ...options 
      } 
    })
  });
}

export async function fetchAssetDetails(assetId: string) {
  return makeGetRequest(`/api/assets/${assetId}`);
}

// License Tokens with pagination
export async function fetchLicenseTokens(options: any = {}, pagination?: PaginationOptions): Promise<PaginatedResponse<any>> {
  return makeRequest('/api/licenses/tokens', {
    body: JSON.stringify({ 
      options: { 
        pagination: { limit: 20, ...pagination }, 
        ...options 
      } 
    })
  });
}

export async function fetchLicenseTokenDetails(tokenId: string) {
  return makeGetRequest(`/api/licenses/tokens/${tokenId}`);
}

export async function fetchLicenseTerms(termId: string) {
  return makeGetRequest(`/api/licenses/terms/${termId}`);
}

// Transactions with pagination
export async function fetchTransactions(options: any = {}, endpoint = 'transactions', pagination?: PaginationOptions): Promise<PaginatedResponse<any>> {
  return makeRequest('/api/transactions', {
    body: JSON.stringify({ 
      endpoint: endpoint === 'latest' ? 'latest' : undefined,
      options: { 
        pagination: { limit: 20, ...pagination }, 
        ...options 
      } 
    })
  });
}

export async function fetchTransactionDetails(txId: string) {
  return makeGetRequest(`/api/transactions/${txId}`);
}

// Relationships
export async function fetchRelationships(ipId: string) {
  return makeGetRequest(`/api/ip-edges?action=relationships&ipId=${ipId}`);
}

// Disputes with pagination
export async function fetchDisputes(options: any = {}, pagination?: PaginationOptions): Promise<PaginatedResponse<any>> {
  return makeRequest('/api/disputes', {
    body: JSON.stringify({ 
      options: { 
        pagination: { limit: 20, ...pagination }, 
        ...options 
      } 
    })
  });
}

// Optional: Create a grouped export object for easier migration
export const StoryAPIService = {
  fetchAssets,
  fetchAssetDetails,
  fetchLicenseTokens,
  fetchLicenseTokenDetails,
  fetchLicenseTerms,
  fetchTransactions,
  fetchTransactionDetails,
  fetchRelationships,
  fetchDisputes
};
