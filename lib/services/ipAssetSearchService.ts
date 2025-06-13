interface IPAssetSearchResponse {
  data: Array<{
    id: string;
    ipId: string;
    descendantCount: number;
    ancestorCount: number;
    rootIpIds: string[];
    blockNumber: string;
    blockTimestamp: string;
    childrenCount: number;
    parentCount: number;
    isGroup: boolean;
    transactionHash: string;
    nftMetadata: {
      name: string;
      chainId: string;
      tokenContract: string;
      tokenId: string;
      tokenUri: string;
      imageUrl: string;
    };
    latestArbitrationPolicy: string;
    rootCount: number;
  }>;
  prev: string;
  next: string;
  hasNextPage: boolean;
  hasPreviousPage: boolean;
}

interface SearchOptions {
  ipId?: string;
  tokenContract?: string;
  tokenId?: string;
  blockNumber?: string;
  blockNumberGte?: string;
  blockNumberLte?: string;
  orderBy?: 'blockNumber' | 'blockTimestamp';
  orderDirection?: 'asc' | 'desc';
  limit?: number;
  after?: string;
  before?: string;
}

export class IPAssetSearchService {
  private static readonly API_BASE = 'https://api.storyapis.com/api/v3';
  private static readonly API_KEY = 'MhBsxkU1z9fG6TofE59KqiiWV-YlYE8Q4awlLQehF3U';
  private static readonly CHAIN = 'story-aeneid';

  /**
   * Search for IP assets by IP ID or other criteria
   */
  static async searchIPAssets(searchOptions: SearchOptions): Promise<IPAssetSearchResponse | null> {
    try {
      console.log('Searching IP assets with options:', searchOptions);

      const requestBody = {
        options: {
          tokenContractIds: [],
          tokenIds: [],
          where: {
            ...(searchOptions.ipId && { ipId: searchOptions.ipId }),
            ...(searchOptions.tokenContract && { tokenContract: searchOptions.tokenContract }),
            ...(searchOptions.tokenId && { tokenId: searchOptions.tokenId }),
            ...(searchOptions.blockNumber && { blockNumber: searchOptions.blockNumber }),
            ...(searchOptions.blockNumberGte && { blockNumberGte: searchOptions.blockNumberGte }),
            ...(searchOptions.blockNumberLte && { blockNumberLte: searchOptions.blockNumberLte }),
          },
          ...(searchOptions.orderBy && { orderBy: searchOptions.orderBy }),
          ...(searchOptions.orderDirection && { orderDirection: searchOptions.orderDirection }),
          ...(searchOptions.limit || searchOptions.after || searchOptions.before) && {
            pagination: {
              ...(searchOptions.limit && { limit: searchOptions.limit }),
              ...(searchOptions.after && { after: searchOptions.after }),
              ...(searchOptions.before && { before: searchOptions.before }),
            }
          }
        }
      };

      console.log('Request body:', JSON.stringify(requestBody, null, 2));

      const response = await fetch(`${this.API_BASE}/assets`, {
        method: 'POST',
        headers: {
          'X-Api-Key': this.API_KEY,
          'X-Chain': this.CHAIN,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(requestBody)
      });

      if (!response.ok) {
        throw new Error(`API request failed: ${response.status} ${response.statusText}`);
      }

      const data: IPAssetSearchResponse = await response.json();
      console.log('Search API response:', data);

      return data;

    } catch (error) {
      console.error('Error searching IP assets:', error);
      throw error;
    }
  }

  /**
   * Search for a specific IP asset by exact IP ID
   */
  static async searchByIPId(ipId: string): Promise<IPAssetSearchResponse | null> {
    if (!ipId || !ipId.trim()) {
      throw new Error('IP ID is required');
    }

    return this.searchIPAssets({ 
      ipId: ipId.trim(),
      limit: 1 
    });
  }

  /**
   * Search for IP assets with partial IP ID matching (for broader search)
   */
  static async searchByPartialIPId(partialIpId: string, limit: number = 10): Promise<IPAssetSearchResponse | null> {
    if (!partialIpId || !partialIpId.trim()) {
      throw new Error('Partial IP ID is required');
    }

    // Since the API doesn't support partial matching directly,
    // we'll need to fetch multiple results and filter client-side
    return this.searchIPAssets({ 
      limit: limit,
      orderBy: 'blockTimestamp',
      orderDirection: 'desc'
    });
  }

  /**
   * Transform API response to IPAsset format for UI components
   */
  static transformToIPAsset(apiAsset: IPAssetSearchResponse['data'][0]): any {
    return {
      id: apiAsset.id,
      name: apiAsset.nftMetadata?.name || `IP Asset ${apiAsset.id.slice(0, 8)}...`,
      type: this.determineAssetType(apiAsset.nftMetadata?.tokenUri),
      status: 'Active',
      image: apiAsset.nftMetadata?.imageUrl || '',
      ipId: apiAsset.ipId,
      tokenContract: apiAsset.nftMetadata?.tokenContract || '',
      tokenId: apiAsset.nftMetadata?.tokenId || '',
      blockNumber: parseInt(apiAsset.blockNumber) || 0,
      nftMetadata: {
        name: apiAsset.nftMetadata?.name || '',
        imageUrl: apiAsset.nftMetadata?.imageUrl || '',
        tokenContract: apiAsset.nftMetadata?.tokenContract || '',
        tokenId: apiAsset.nftMetadata?.tokenId || '',
        chainId: apiAsset.nftMetadata?.chainId,
        tokenUri: apiAsset.nftMetadata?.tokenUri
      },
      blockTimestamp: apiAsset.blockTimestamp,
      transactionHash: apiAsset.transactionHash,
      // Additional metadata from search API
      descendantCount: apiAsset.descendantCount,
      ancestorCount: apiAsset.ancestorCount,
      childrenCount: apiAsset.childrenCount,
      parentCount: apiAsset.parentCount,
      rootCount: apiAsset.rootCount,
      rootIpIds: apiAsset.rootIpIds,
      isGroup: apiAsset.isGroup,
      latestArbitrationPolicy: apiAsset.latestArbitrationPolicy
    };
  }

  /**
   * Determine asset type from token URI
   */
  private static determineAssetType(tokenUri?: string): string {
    if (!tokenUri) return 'Digital Asset';
    const uri = tokenUri.toLowerCase();
    if (uri.includes('image') || uri.includes('.jpg') || uri.includes('.png') || uri.includes('.gif')) return 'Image';
    if (uri.includes('video') || uri.includes('.mp4') || uri.includes('.webm') || uri.includes('.mov')) return 'Video';
    if (uri.includes('audio') || uri.includes('.mp3') || uri.includes('.wav')) return 'Audio';
    return 'Digital Asset';
  }

  /**
   * Validate IP ID format
   */
  static isValidIPId(ipId: string): boolean {
    // Check if it's a valid Ethereum address format
    const ethAddressRegex = /^0x[a-fA-F0-9]{40}$/;
    return ethAddressRegex.test(ipId);
  }

  /**
   * Search with multiple strategies (exact, partial, etc.)
   */
  static async comprehensiveSearch(searchTerm: string): Promise<any[]> {
    const results: any[] = [];
    const cleanSearchTerm = searchTerm.trim();

    try {
      // Strategy 1: Exact IP ID match
      if (this.isValidIPId(cleanSearchTerm)) {
        console.log('Attempting exact IP ID search...');
        const exactMatch = await this.searchByIPId(cleanSearchTerm);
        if (exactMatch?.data && exactMatch.data.length > 0) {
          const transformedAssets = exactMatch.data.map(asset => this.transformToIPAsset(asset));
          results.push(...transformedAssets);
          console.log(`Found ${transformedAssets.length} exact matches`);
          return results; // Return early if exact match found
        }
      }

      // Strategy 2: Partial matching by fetching recent assets and filtering
      console.log('Attempting partial search...');
      const partialResults = await this.searchByPartialIPId(cleanSearchTerm, 100);
      if (partialResults?.data && partialResults.data.length > 0) {
        const filtered = partialResults.data.filter(asset => {
          const assetIpId = asset.ipId?.toLowerCase() || '';
          const searchLower = cleanSearchTerm.toLowerCase();
          return assetIpId.includes(searchLower);
        });

        if (filtered.length > 0) {
          const transformedAssets = filtered.map(asset => this.transformToIPAsset(asset));
          results.push(...transformedAssets);
          console.log(`Found ${transformedAssets.length} partial matches`);
        }
      }

      return results;

    } catch (error) {
      console.error('Error in comprehensive search:', error);
      throw new Error(`Search failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }
}