const API_BASE_URL = 'https://api.storyapis.com/api/v3';
const API_KEY = process.env.NEXT_PUBLIC_STORY_API_KEY || 'MhBsxkU1z9fG6TofE59KqiiWV-YlYE8Q4awlLQehF3U';
const CHAIN = 'story-aeneid';

export interface ServiceIPAssetDetails {
  id: string;
  name: string;
  ancestorCount: number;
  parentCount: number;
  childrenCount: number;
  descendantCount: number;
  rootIpIds: string[];
  blockNumber: string;
  blockTimestamp: string;
  transactionHash: string;
  tokenContract: string;
  tokenId: string;
  registrant: string;
  registrationDate: string;
  nftMetadata: {
    name: string;
    imageUrl: string;
    description?: string;
  };
}

export interface IPEdge {
  ipId: string;
  parentIpId: string;
  blockNumber: string;
  blockTime: string;
  licenseTemplate: string;
  licenseTermsId: string;
  licenseTokenId: string;
  transactionHash: string;
  transactionIndex: string;
}

export interface IPEdgesResponse {
  data: IPEdge[];
  next?: string;
  prev?: string;
}

export class IPAssetService {
  /**
   * Fetch IP asset details including counts and metadata
   */
  static async getIPAssetDetails(ipId: string): Promise<ServiceIPAssetDetails | null> {
    try {
      console.log(`Fetching IP asset details for: ${ipId}`);
      
      const response = await fetch(`${API_BASE_URL}/assets/${ipId}`, {
        method: 'GET',
        headers: {
          'X-Api-Key': API_KEY,
          'X-Chain': CHAIN,
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        console.error(`Failed to fetch IP asset details: ${response.status}`);
        return null;
      }

      const result = await response.json();
      console.log('IP asset details response:', result);
      
      return result.data || null;
    } catch (error) {
      console.error('Error fetching IP asset details:', error);
      return null;
    }
  }

  /**
   * Fetch IP edges (relationships) for a specific IP ID
   */
  static async getIPEdges(ipId: string, options?: {
    parentIpId?: string;
    limit?: number;
    orderBy?: 'id' | 'blockNumber' | 'blockTime';
    orderDirection?: 'asc' | 'desc';
  }): Promise<IPEdgesResponse | null> {
    try {
      console.log(`Fetching IP edges for: ${ipId}`);
      
      const requestBody = {
        options: {
          orderBy: options?.orderBy || 'blockNumber',
          orderDirection: options?.orderDirection || 'desc',
          pagination: {
            limit: options?.limit || 50
          },
          where: {
            ipId: ipId,
            ...(options?.parentIpId && { parentIpId: options.parentIpId })
          }
        }
      };

      const response = await fetch(`${API_BASE_URL}/assets/edges`, {
        method: 'POST',
        headers: {
          'X-Api-Key': API_KEY,
          'X-Chain': CHAIN,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(requestBody)
      });

      if (!response.ok) {
        console.error(`Failed to fetch IP edges: ${response.status}`);
        return null;
      }

      const result = await response.json();
      console.log('IP edges response:', result);
      
      return result;
    } catch (error) {
      console.error('Error fetching IP edges:', error);
      return null;
    }
  }

  /**
   * Fetch parent relationships for an IP ID
   */
  static async getParentEdges(ipId: string): Promise<IPEdge[]> {
    try {
      console.log(`Fetching parent edges for: ${ipId}`);
      
      const requestBody = {
        options: {
          orderBy: 'blockNumber',
          orderDirection: 'desc',
          pagination: {
            limit: 100
          },
          where: {
            ipId: ipId
          }
        }
      };

      const response = await fetch(`${API_BASE_URL}/assets/edges`, {
        method: 'POST',
        headers: {
          'X-Api-Key': API_KEY,
          'X-Chain': CHAIN,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(requestBody)
      });

      if (!response.ok) {
        console.error(`Failed to fetch parent edges: ${response.status}`);
        return [];
      }

      const result = await response.json();
      
      // Filter for edges where this ipId is the child (has parents)
      const parentEdges = result.data?.filter((edge: IPEdge) => edge.ipId === ipId) || [];
      
      console.log(`Found ${parentEdges.length} parent edges for ${ipId}`);
      return parentEdges;
    } catch (error) {
      console.error('Error fetching parent edges:', error);
      return [];
    }
  }

  /**
   * Fetch child relationships for an IP ID
   */
  static async getChildEdges(ipId: string): Promise<IPEdge[]> {
    try {
      console.log(`Fetching child edges for: ${ipId}`);
      
      const requestBody = {
        options: {
          orderBy: 'blockNumber',
          orderDirection: 'desc',
          pagination: {
            limit: 100
          },
          where: {
            parentIpId: ipId
          }
        }
      };

      const response = await fetch(`${API_BASE_URL}/assets/edges`, {
        method: 'POST',
        headers: {
          'X-Api-Key': API_KEY,
          'X-Chain': CHAIN,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(requestBody)
      });

      if (!response.ok) {
        console.error(`Failed to fetch child edges: ${response.status}`);
        return [];
      }

      const result = await response.json();
      
      // All returned edges should be children since we filtered by parentIpId
      const childEdges = result.data || [];
      
      console.log(`Found ${childEdges.length} child edges for ${ipId}`);
      return childEdges;
    } catch (error) {
      console.error('Error fetching child edges:', error);
      return [];
    }
  }

  /**
   * Get comprehensive relationship data for an IP asset
   */
  static async getIPRelationships(ipId: string): Promise<{
    assetDetails: ServiceIPAssetDetails | null;
    parentEdges: IPEdge[];
    childEdges: IPEdge[];
  }> {
    try {
      console.log(`Fetching comprehensive relationships for: ${ipId}`);
      
      // Fetch all data in parallel
      const [assetDetails, parentEdges, childEdges] = await Promise.all([
        this.getIPAssetDetails(ipId),
        this.getParentEdges(ipId),
        this.getChildEdges(ipId)
      ]);

      return {
        assetDetails,
        parentEdges,
        childEdges
      };
    } catch (error) {
      console.error('Error fetching IP relationships:', error);
      return {
        assetDetails: null,
        parentEdges: [],
        childEdges: []
      };
    }
  }

  /**
   * Test API connectivity
   */
  static async testConnection(): Promise<boolean> {
    try {
      const response = await fetch(`${API_BASE_URL}/assets`, {
        method: 'POST',
        headers: {
          'X-Api-Key': API_KEY,
          'X-Chain': CHAIN,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          options: {
            pagination: { limit: 1 }
          }
        })
      });

      return response.ok;
    } catch (error) {
      console.error('API connection test failed:', error);
      return false;
    }
  }
}