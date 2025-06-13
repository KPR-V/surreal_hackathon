interface IPMetadata {
  id: string;
  metadataHash: string;
  metadataJson?: any;
  metadataUri: string;
  nftMetadataHash: string;
  nftTokenUri: string;
  registrationDate: string;
}

interface NFTMetadata {
  name?: string;
  description?: string;
  image?: string;
  attributes?: Array<{
    trait_type: string;
    value: string | number;
  }>;
  external_url?: string;
  animation_url?: string;
  background_color?: string;
  [key: string]: any;
}

interface IPAssetMetadata {
  title?: string;
  description?: string;
  ipType?: string;
  creators?: Array<{
    name: string;
    address: string;
  }>;
  rights?: string;
  commercialRights?: boolean;
  derivativeRights?: boolean;
  [key: string]: any;
}

export class MetadataService {
  private static readonly API_BASE = 'https://api.storyapis.com/api/v3';
  private static readonly API_KEY = 'MhBsxkU1z9fG6TofE59KqiiWV-YlYE8Q4awlLQehF3U';
  private static readonly CHAIN = 'story-aeneid';

  static async getIPAssetMetadata(assetId: string): Promise<IPMetadata | null> {
    try {
      const response = await fetch(`${this.API_BASE}/assets/${assetId}/metadata`, {
        method: 'GET',
        headers: {
          'X-Api-Key': this.API_KEY,
          'X-Chain': this.CHAIN,
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        console.error(`Failed to fetch IP metadata: ${response.status}`);
        return null;
      }

      const data = await response.json();
      return data;
    } catch (error) {
      console.error('Error fetching IP asset metadata:', error);
      return null;
    }
  }

  static async fetchJSONFromIPFS(ipfsUrl: string): Promise<any | null> {
    try {
      // Handle different IPFS URL formats
      let fetchUrl = ipfsUrl;
      if (ipfsUrl.startsWith('ipfs://')) {
        fetchUrl = ipfsUrl.replace('ipfs://', 'https://ipfs.io/ipfs/');
      }

      const response = await fetch(fetchUrl);
      if (!response.ok) {
        console.error(`Failed to fetch IPFS content: ${response.status}`);
        return null;
      }

      const data = await response.json();
      return data;
    } catch (error) {
      console.error('Error fetching IPFS content:', error);
      return null;
    }
  }

  static async getCompleteAssetMetadata(assetId: string): Promise<{
    ipMetadata: IPMetadata | null;
    ipAssetData: IPAssetMetadata | null;
    nftMetadata: NFTMetadata | null;
  }> {
    try {
      // Get the basic IP metadata first
      const ipMetadata = await this.getIPAssetMetadata(assetId);
      
      if (!ipMetadata) {
        return { ipMetadata: null, ipAssetData: null, nftMetadata: null };
      }

      // Fetch IP asset metadata from metadataUri
      let ipAssetData = null;
      if (ipMetadata.metadataUri) {
        ipAssetData = await this.fetchJSONFromIPFS(ipMetadata.metadataUri);
      }

      // Fetch NFT metadata from nftTokenUri
      let nftMetadata = null;
      if (ipMetadata.nftTokenUri) {
        nftMetadata = await this.fetchJSONFromIPFS(ipMetadata.nftTokenUri);
      }

      return {
        ipMetadata,
        ipAssetData,
        nftMetadata
      };
    } catch (error) {
      console.error('Error getting complete asset metadata:', error);
      return { ipMetadata: null, ipAssetData: null, nftMetadata: null };
    }
  }

  static getImageUrl(imageUri?: string): string | null {
    if (!imageUri) return null;
    
    // Handle IPFS URLs
    if (imageUri.startsWith('ipfs://')) {
      return imageUri.replace('ipfs://', 'https://ipfs.io/ipfs/');
    }
    
    // Handle regular URLs
    if (imageUri.startsWith('http')) {
      return imageUri;
    }
    
    // Handle relative IPFS paths
    if (imageUri.startsWith('Qm') || imageUri.startsWith('baf')) {
      return `https://ipfs.io/ipfs/${imageUri}`;
    }
    
    return imageUri;
  }
}