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

export interface IPRelationships {
  parents: IPEdge[];
  children: IPEdge[];
  allRelationships: IPEdge[];
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

          console.log('Fetching all relationships with body:', JSON.stringify(requestBody, null, 2));

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
          console.log('API Response structure:', data);
          
          const batchEdges = Array.isArray(data) ? data : (data.data || []);
          allEdges = [...allEdges, ...batchEdges];
          
          hasNextPage = data.next ? true : false;
          nextCursor = data.next;
          
          if (!hasNextPage || allEdges.length >= 500) {
            break;
          }
          
          retryCount = 0; // Reset retry count on success
        } catch (error) {
          retryCount++;
          console.error(`Attempt ${retryCount} failed:`, error);
          if (retryCount >= maxRetries) {
            throw error;
          }
          // Wait before retry
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
            console.error('API Error Response:', {
              status: response.status,
              statusText: response.statusText,
              body: errorText,
              requestBody: requestBody
            });
            
            // If it's a 400 error, it might be due to invalid where clause
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
          
          retryCount = 0; // Reset retry count on success
        } catch (error) {
          retryCount++;
          console.error(`Attempt ${retryCount} failed for where clause ${JSON.stringify(cleanWhereClause)}:`, error);
          if (retryCount >= maxRetries) {
            // Return empty array instead of throwing to prevent UI crashes
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

  // Get licensing information for an IP asset
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