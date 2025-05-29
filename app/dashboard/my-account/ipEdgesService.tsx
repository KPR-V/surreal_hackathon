export interface IPEdge {
  blockNumber: string;
  blockTime: string;
  ipId: string;
  licenseTemplate: string;
  licenseTermsId: string;
  licenseTokenId: string;
  parentIpId: string;
  transactionHash: string;
  transactionIndex: string;
}

export interface IPLicenseTerms {
  blockNumber: string;
  blockTime: string;
  disabled: boolean;
  id: string;
  ipId: string;
  licenseTemplate: string;
  licenseTermsId: string;
  licensingConfig: {
    commercialRevShare: number;
    disabled: boolean;
    expectGroupRewardPool: string;
    expectMinimumGroupRewardShare: number;
    hookData: string;
    isSet: boolean;
    licensingHook: string;
    mintingFee: string;
  };
}

export interface DetailedIPLicenseTerms {
  disabled: boolean;
  id: string;
  ipId: string;
  licenseTemplate: {
    blockNumber: string;
    blockTime: string;
    id: string;
    metadataUri: string;
    name: string;
    url: string;
  };
  licenseTerms: {
    blockNumber: string;
    blockTime: string;
    commercialAttribution: boolean;
    commercialRevCeiling: string;
    commercialRevShare: number;
    commercialUse: boolean;
    commercializerChecker: string;
    commercializerCheckerData: string;
    currency: string;
    derivativesAllowed: boolean;
    derivativesApproval: boolean;
    derivativesAttribution: boolean;
    derivativesReciprocal: boolean;
    expiration: string;
    id: string;
    licenseTemplate: string;
    mintingFee: string;
    royaltyPolicy: string;
    transferable: boolean;
    uri: string;
  };
}

export interface IPRelationships {
  parents: IPEdge[];
  children: IPEdge[];
  allRelationships: IPEdge[];
}

export interface ComprehensiveLicensingInfo {
  basicLicenses: IPEdge[];
  licenseTerms: IPLicenseTerms[];
  detailedTerms: DetailedIPLicenseTerms[];
  licenseTemplates: string[];
  licenseTermsIds: string[];
  totalLicenses: number;
  commercialUseAllowed: boolean;
  derivativesAllowed: boolean;
  totalRevShare: number;
  mintingFees: string[];
}

export interface Dispute {
  arbitrationPolicy: string;
  blockNumber: number;
  blockTimestamp: number;
  counterEvidenceHash: string;
  currentTag: string;
  data: string;
  deletedAt: number | null;
  disputeTimestamp: number;
  evidenceHash: string;
  id: string;
  initiator: string;
  liveness: number;
  logIndex: number;
  status: string;
  targetIpId: string;
  targetTag: string;
  transactionHash: string;
  umaLink: string;
}

export interface DisputeInfo {
  hasDisputes: boolean;
  activeDisputes: Dispute[];
  resolvedDisputes: Dispute[];
  totalDisputes: number;
  isInitiator: boolean;
  isTarget: boolean;
}

export class IPEdgesService {
  private static readonly API_BASE_URL = 'https://api.storyapis.com/api/v3';
  private static readonly API_KEY = process.env.NEXT_PUBLIC_STORY_API_KEY || 'MhBsxkU1z9fG6TofE59KqiiWV-YlYE8Q4awlLQehF3U';
  private static readonly CHAIN = 'story-aeneid';

  // Get all edges for a specific IP asset (both as child and parent)
  static async getIPRelationships(ipId: string): Promise<IPRelationships> {
    try {
      console.log('Fetching relationships for IP:', ipId);
      
      // Get edges where this IP is a child (to find parents)
      const parentsData = await this.fetchEdges({ ipId });
      console.log('Parents found:', parentsData.length);
      
      // Get edges where this IP is a parent (to find children)  
      const childrenData = await this.fetchEdges({ parentIpId: ipId });
      console.log('Children found:', childrenData.length);

      return {
        parents: parentsData,
        children: childrenData,
        allRelationships: [...parentsData, ...childrenData]
      };
    } catch (error) {
      console.error('Error fetching IP relationships:', error);
      return { parents: [], children: [], allRelationships: [] };
    }
  }

  // Get IP License Terms for a specific IP (using the GET endpoint)
  static async getIPLicenseTerms(ipId: string): Promise<IPLicenseTerms[]> {
    try {
      console.log('Fetching license terms for IP:', ipId);
      
      const options = {
        method: 'GET',
        headers: {
          'X-Api-Key': this.API_KEY,
          'X-Chain': this.CHAIN
        }
      };

      const response = await fetch(`${this.API_BASE_URL}/licenses/ip/terms/${ipId}`, options);
      
      if (!response.ok) {
        if (response.status === 404) {
          console.log('No license terms found for this IP');
          return [];
        }
        const errorText = await response.text();
        console.error('Error fetching license terms:', response.status, errorText);
        return [];
      }
      
      const data = await response.json();
      console.log('License terms response:', data);
      
      return data.data || [];
    } catch (error) {
      console.error('Error fetching IP license terms:', error);
      return [];
    }
  }

  // Get detailed IP License Terms (using the POST endpoint)
  static async getDetailedIPLicenseTerms(ipIds: string[]): Promise<DetailedIPLicenseTerms[]> {
    try {
      console.log('Fetching detailed license terms for IPs:', ipIds);
      
      const requestBody = {
        options: {
          where: {
            ipIds: ipIds
          }
        }
      };

      const options = {
        method: 'POST',
        headers: {
          'X-Api-Key': this.API_KEY,
          'X-Chain': this.CHAIN,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(requestBody)
      };

      const response = await fetch(`${this.API_BASE_URL}/detailed-ip-license-terms`, options);
      
      if (!response.ok) {
        if (response.status === 404) {
          console.log('No detailed license terms found for these IPs');
          return [];
        }
        const errorText = await response.text();
        console.error('Error fetching detailed license terms:', response.status, errorText);
        return [];
      }
      
      const data = await response.json();
      console.log('Detailed license terms response:', data);
      
      return data.data || [];
    } catch (error) {
      console.error('Error fetching detailed IP license terms:', error);
      return [];
    }
  }

  // Get comprehensive licensing information for an IP asset
  static async getComprehensiveLicensingInfo(ipId: string): Promise<ComprehensiveLicensingInfo> {
    try {
      console.log('Fetching comprehensive licensing info for:', ipId);
      
      // Get basic relationship data (edges)
      const relationships = await this.getIPRelationships(ipId);
      
      // Get IP license terms
      const licenseTerms = await this.getIPLicenseTerms(ipId);
      
      // Get detailed license terms for this IP and related IPs
      const relatedIpIds = [
        ipId,
        ...relationships.parents.map(edge => edge.parentIpId),
        ...relationships.children.map(edge => edge.ipId)
      ];
      const uniqueIpIds = [...new Set(relatedIpIds)];
      const detailedTerms = await this.getDetailedIPLicenseTerms(uniqueIpIds);

      // Analyze the licensing data
      const licenseTemplates = [...new Set([
        ...relationships.allRelationships.map(edge => edge.licenseTemplate).filter(Boolean),
        ...licenseTerms.map(term => term.licenseTemplate).filter(Boolean)
      ])];

      const licenseTermsIds = [...new Set([
        ...relationships.allRelationships.map(edge => edge.licenseTermsId).filter(Boolean),
        ...licenseTerms.map(term => term.licenseTermsId).filter(Boolean)
      ])];

      // Analyze commercial use and derivatives permissions
      const commercialUseAllowed = detailedTerms.some(term => 
        term.licenseTerms?.commercialUse === true
      );

      const derivativesAllowed = detailedTerms.some(term => 
        term.licenseTerms?.derivativesAllowed === true
      );

      // Calculate total revenue share
      const totalRevShare = licenseTerms.reduce((sum, term) => 
        sum + (term.licensingConfig?.commercialRevShare || 0), 0
      );

      // Get minting fees
      const mintingFees = [...new Set([
        ...licenseTerms.map(term => term.licensingConfig?.mintingFee).filter(Boolean),
        ...detailedTerms.map(term => term.licenseTerms?.mintingFee).filter(Boolean)
      ])];

      return {
        basicLicenses: relationships.allRelationships,
        licenseTerms,
        detailedTerms,
        licenseTemplates,
        licenseTermsIds,
        totalLicenses: relationships.allRelationships.length + licenseTerms.length,
        commercialUseAllowed,
        derivativesAllowed,
        totalRevShare,
        mintingFees
      };
    } catch (error) {
      console.error('Error fetching comprehensive licensing info:', error);
      return {
        basicLicenses: [],
        licenseTerms: [],
        detailedTerms: [],
        licenseTemplates: [],
        licenseTermsIds: [],
        totalLicenses: 0,
        commercialUseAllowed: false,
        derivativesAllowed: false,
        totalRevShare: 0,
        mintingFees: []
      };
    }
  }

  // Get all relationships in the network (for family tree analysis)
  static async getAllRelationships(): Promise<IPEdge[]> {
    try {
      let allEdges: IPEdge[] = [];
      let hasNextPage = true;
      let nextCursor = null;
      let retryCount = 0;
      const maxRetries = 3;

      while (hasNextPage && retryCount < maxRetries) {
        try {
          const requestBody: any = {
            options: {
              orderBy: "blockTime",
              orderDirection: "desc",
              pagination: {
                limit: 100,
                ...(nextCursor && { after: nextCursor })
              }
            }
          };

          const options = {
            method: 'POST',
            headers: {
              'X-Api-Key': this.API_KEY,
              'X-Chain': this.CHAIN,
              'Content-Type': 'application/json'
            },
            body: JSON.stringify(requestBody)
          };

          const response = await fetch(`${this.API_BASE_URL}/assets/edges`, options);
          
          if (!response.ok) {
            const errorText = await response.text();
            console.error('API Error Response:', response.status, errorText);
            throw new Error(`HTTP error! status: ${response.status}, body: ${errorText}`);
          }
          
          const data = await response.json();
          const batchEdges = Array.isArray(data) ? data : (data.data || []);
          allEdges = [...allEdges, ...batchEdges];
          
          hasNextPage = data.next ? true : false;
          nextCursor = data.next;
          
          if (!hasNextPage || allEdges.length >= 500) {
            break;
          }
          
          retryCount = 0;
        } catch (error) {
          retryCount++;
          console.error(`Attempt ${retryCount} failed:`, error);
          if (retryCount >= maxRetries) {
            throw error;
          }
          await new Promise(resolve => setTimeout(resolve, 1000 * retryCount));
        }
      }

      return allEdges;
    } catch (error) {
      console.error('Error fetching all relationships:', error);
      return [];
    }
  }

  // Fetch edges with specific filters
  private static async fetchEdges(whereClause: Partial<{
    blockNumber: string;
    ipId: string;
    licenseTermsId: string;
    licenseTokenId: string;
    parentIpId: string;
    transactionHash: string;
  }>): Promise<IPEdge[]> {
    try {
      let allEdges: IPEdge[] = [];
      let hasNextPage = true;
      let nextCursor = null;
      let retryCount = 0;
      const maxRetries = 3;

      // Filter out empty/undefined values from whereClause
      const cleanWhereClause = Object.fromEntries(
        Object.entries(whereClause).filter(([_, value]) => value != null && value !== '')
      );

      console.log('Fetching edges with where clause:', cleanWhereClause);

      while (hasNextPage && retryCount < maxRetries) {
        try {
          const requestBody = {
            options: {
              orderBy: "blockTime",
              orderDirection: "desc",
              pagination: {
                limit: 50,
                ...(nextCursor && { after: nextCursor })
              },
              ...(Object.keys(cleanWhereClause).length > 0 && { where: cleanWhereClause })
            }
          };

          console.log('Request body:', JSON.stringify(requestBody, null, 2));

          const options: any = {
            method: 'POST',
            headers: {
              'X-Api-Key': this.API_KEY,
              'X-Chain': this.CHAIN,
              'Content-Type': 'application/json'
            },
            body: JSON.stringify(requestBody)
          };

          const response = await fetch(`${this.API_BASE_URL}/assets/edges`, options);
          
          if (!response.ok) {
            const errorText = await response.text();
            
            if (response.status === 400) {
              console.log('400 error - trying without where clause or with simplified request');
              // Try with a simpler request structure
              const simpleRequestBody = {
                options: {
                  pagination: {
                    limit: 50
                  }
                }
              };
              
              const simpleResponse = await fetch(`${this.API_BASE_URL}/assets/edges`, {
                ...options,
                body: JSON.stringify(simpleRequestBody)
              });
              
              if (!simpleResponse.ok) {
                const simpleErrorText = await simpleResponse.text();
                throw new Error(`HTTP error! status: ${simpleResponse.status}, body: ${simpleErrorText}`);
              }
              
              const simpleData = await simpleResponse.json();
              console.log('Simple request successful:', simpleData);
              
              // Filter the results manually if needed
              let filteredEdges = Array.isArray(simpleData) ? simpleData : (simpleData.data || []);
              
              // Apply manual filtering
              if (cleanWhereClause.ipId) {
                filteredEdges = filteredEdges.filter((edge: IPEdge) => edge.ipId === cleanWhereClause.ipId);
              }
              if (cleanWhereClause.parentIpId) {
                filteredEdges = filteredEdges.filter((edge: IPEdge) => edge.parentIpId === cleanWhereClause.parentIpId);
              }
              
              return filteredEdges;
            }
            
            throw new Error(`HTTP error! status: ${response.status}, body: ${errorText}`);
          }
          
          const data = await response.json();
          console.log('Successful response:', data);
          
          const batchEdges = Array.isArray(data) ? data : (data.data || []);
          allEdges = [...allEdges, ...batchEdges];
          
          hasNextPage = data.next ? true : false;
          nextCursor = data.next;
          
          if (!hasNextPage || allEdges.length >= 100) {
            break;
          }
          
          retryCount = 0;
        } catch (error) {
          retryCount++;
          console.error(`Attempt ${retryCount} failed for where clause ${JSON.stringify(cleanWhereClause)}:`, error);
          if (retryCount >= maxRetries) {
            console.log('Max retries reached, returning empty array');
            return [];
          }
          // Wait before retry
          await new Promise(resolve => setTimeout(resolve, 1000 * retryCount));
        }
      }

      console.log(`Fetched ${allEdges.length} edges for where clause:`, cleanWhereClause);
      return allEdges;
    } catch (error) {
      console.error('Error fetching edges:', error);
      return [];
    }
  }

  // Get all disputes for a specific IP asset
  static async getIPDisputes(ipId: string): Promise<DisputeInfo> {
    try {
      console.log('Fetching disputes for IP:', ipId);
      
      // Get disputes where this IP is the target
      const targetDisputes = await this.fetchDisputes({ targetIpId: ipId });
      
      // Get disputes where this IP owner is the initiator (would need wallet address)
      // For now, we'll focus on disputes targeting this IP
      
      const activeDisputes = targetDisputes.filter(dispute => 
        dispute.status !== 'RESOLVED' && dispute.status !== 'DISMISSED'
      );
      
      const resolvedDisputes = targetDisputes.filter(dispute => 
        dispute.status === 'RESOLVED' || dispute.status === 'DISMISSED'
      );

      return {
        hasDisputes: targetDisputes.length > 0,
        activeDisputes,
        resolvedDisputes,
        totalDisputes: targetDisputes.length,
        isInitiator: false, // Would need to check against user's wallet
        isTarget: targetDisputes.length > 0
      };
    } catch (error) {
      console.error('Error fetching IP disputes:', error);
      return {
        hasDisputes: false,
        activeDisputes: [],
        resolvedDisputes: [],
        totalDisputes: 0,
        isInitiator: false,
        isTarget: false
      };
    }
  }

  // Get a specific dispute by ID
  static async getDispute(disputeId: string): Promise<Dispute | null> {
    try {
      console.log('Fetching dispute:', disputeId);
      
      const options = {
        method: 'GET',
        headers: {
          'X-Api-Key': this.API_KEY,
          'X-Chain': this.CHAIN
        }
      };

      const response = await fetch(`${this.API_BASE_URL}/disputes/${disputeId}`, options);
      
      if (!response.ok) {
        if (response.status === 404) {
          console.log('Dispute not found');
          return null;
        }
        const errorText = await response.text();
        console.error('Error fetching dispute:', response.status, errorText);
        return null;
      }
      
      const data = await response.json();
      console.log('Dispute response:', data);
      
      return data.data || null;
    } catch (error) {
      console.error('Error fetching dispute:', error);
      return null;
    }
  }

  // Fetch disputes with specific filters
  private static async fetchDisputes(whereClause: Partial<{
    blockNumber: string;
    blockNumberLte: string;
    id: string;
    initiator: string;
    targetIpId: string;
  }>): Promise<Dispute[]> {
    try {
      let allDisputes: Dispute[] = [];
      let hasNextPage = true;
      let nextCursor = null;
      let retryCount = 0;
      const maxRetries = 3;

      // Filter out empty/undefined values from whereClause
      const cleanWhereClause = Object.fromEntries(
        Object.entries(whereClause).filter(([_, value]) => value != null && value !== '')
      );

      console.log('Fetching disputes with where clause:', cleanWhereClause);

      while (hasNextPage && retryCount < maxRetries) {
        try {
          const requestBody: any = {
            options: {
              orderBy: "disputeTimestamp",
              orderDirection: "desc",
              pagination: {
                limit: 50,
                ...(nextCursor && { after: nextCursor })
              },
              ...(Object.keys(cleanWhereClause).length > 0 && { where: cleanWhereClause })
            }
          };

          console.log('Dispute request body:', JSON.stringify(requestBody, null, 2));

          const options = {
            method: 'POST',
            headers: {
              'X-Api-Key': this.API_KEY,
              'X-Chain': this.CHAIN,
              'Content-Type': 'application/json'
            },
            body: JSON.stringify(requestBody)
          };

          const response = await fetch(`${this.API_BASE_URL}/disputes`, options);
          
          if (!response.ok) {
            const errorText = await response.text();
            console.error('Disputes API Error:', {
              status: response.status,
              statusText: response.statusText,
              body: errorText,
              requestBody: requestBody
            });
            
            // If it's a 400 error, try with a simpler request
            if (response.status === 400) {
              console.log('400 error - trying simplified request');
              const simpleRequestBody = {
                options: {
                  pagination: {
                    limit: 50
                  }
                }
              };
              
              const simpleResponse = await fetch(`${this.API_BASE_URL}/disputes`, {
                ...options,
                body: JSON.stringify(simpleRequestBody)
              });
              
              if (!simpleResponse.ok) {
                const simpleErrorText = await simpleResponse.text();
                throw new Error(`HTTP error! status: ${simpleResponse.status}, body: ${simpleErrorText}`);
              }
              
              const simpleData = await simpleResponse.json();
              console.log('Simple disputes request successful:', simpleData);
              
              // Filter the results manually if needed
              let filteredDisputes = Array.isArray(simpleData) ? simpleData : (simpleData.data || []);
              
              // Apply manual filtering
              if (cleanWhereClause.targetIpId) {
                filteredDisputes = filteredDisputes.filter((dispute: Dispute) => 
                  dispute.targetIpId === cleanWhereClause.targetIpId
                );
              }
              if (cleanWhereClause.initiator) {
                filteredDisputes = filteredDisputes.filter((dispute: Dispute) => 
                  dispute.initiator === cleanWhereClause.initiator
                );
              }
              
              return filteredDisputes;
            }
            
            throw new Error(`HTTP error! status: ${response.status}, body: ${errorText}`);
          }
          
          const data = await response.json();
          console.log('Disputes response successful:', data);
          
          const batchDisputes = Array.isArray(data) ? data : (data.data || []);
          allDisputes = [...allDisputes, ...batchDisputes];
          
          hasNextPage = data.next ? true : false;
          nextCursor = data.next;
          
          if (!hasNextPage || allDisputes.length >= 100) {
            break;
          }
          
          retryCount = 0; // Reset retry count on success
        } catch (error) {
          retryCount++;
          console.error(`Dispute fetch attempt ${retryCount} failed:`, error);
          if (retryCount >= maxRetries) {
            console.log('Max retries reached for disputes, returning empty array');
            return [];
          }
          // Wait before retry
          await new Promise(resolve => setTimeout(resolve, 1000 * retryCount));
        }
      }

      console.log(`Fetched ${allDisputes.length} disputes for where clause:`, cleanWhereClause);
      return allDisputes;
    } catch (error) {
      console.error('Error fetching disputes:', error);
      return [];
    }
  }

  // Get comprehensive info including disputes
  static async getComprehensiveAssetInfo(ipId: string): Promise<{
    relationships: IPRelationships;
    licensing: ComprehensiveLicensingInfo;
    disputes: DisputeInfo;
  }> {
    try {
      const [relationships, licensing, disputes] = await Promise.all([
        this.getIPRelationships(ipId),
        this.getComprehensiveLicensingInfo(ipId),
        this.getIPDisputes(ipId)
      ]);

      return {
        relationships,
        licensing,
        disputes
      };
    } catch (error) {
      console.error('Error fetching comprehensive asset info:', error);
      return {
        relationships: { parents: [], children: [], allRelationships: [] },
        licensing: {
          basicLicenses: [],
          licenseTerms: [],
          detailedTerms: [],
          licenseTemplates: [],
          licenseTermsIds: [],
          totalLicenses: 0,
          commercialUseAllowed: false,
          derivativesAllowed: false,
          totalRevShare: 0,
          mintingFees: []
        },
        disputes: {
          hasDisputes: false,
          activeDisputes: [],
          resolvedDisputes: [],
          totalDisputes: 0,
          isInitiator: false,
          isTarget: false
        }
      };
    }
  }

  // Test API connectivity
  static async testConnection(): Promise<boolean> {
    try {
      const options = {
        method: 'POST',
        headers: {
          'X-Api-Key': this.API_KEY,
          'X-Chain': this.CHAIN,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          options: {
            pagination: {
              limit: 1
            }
          }
        })
      };

      const response = await fetch(`${this.API_BASE_URL}/assets/edges`, options);
      console.log('Test connection response:', response.status);
      
      if (response.ok) {
        const data = await response.json();
        console.log('Test connection data:', data);
        return true;
      }
      
      const errorText = await response.text();
      console.error('Test connection failed:', response.status, errorText);
      return false;
    } catch (error) {
      console.error('Test connection error:', error);
      return false;
    }
  }

  // Legacy method for backward compatibility
  static async getLicensingInfo(ipId: string): Promise<{
    licenses: IPEdge[];
    licenseTemplates: string[];
    licenseTerms: string[];
  }> {
    try {
      const relationships = await this.getIPRelationships(ipId);
      const allEdges = relationships.allRelationships;

      const licenseTemplates = [...new Set(allEdges.map(edge => edge.licenseTemplate).filter(Boolean))];
      const licenseTerms = [...new Set(allEdges.map(edge => edge.licenseTermsId).filter(Boolean))];

      return {
        licenses: allEdges,
        licenseTemplates,
        licenseTerms
      };
    } catch (error) {
      console.error('Error fetching licensing info:', error);
      return { licenses: [], licenseTemplates: [], licenseTerms: [] };
    }
  }
}