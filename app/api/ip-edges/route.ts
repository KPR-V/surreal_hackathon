import { NextRequest, NextResponse } from 'next/server';

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

const API_BASE_URL = 'https://api.storyapis.com/api/v3';
const API_KEY = process.env.STORY_API_KEY || 'MhBsxkU1z9fG6TofE59KqiiWV-YlYE8Q4awlLQehF3U';
const CHAIN = 'story-aeneid';

// Helper function to fetch edges with filters
async function fetchEdges(whereClause: Partial<{
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
            orderBy: "blockNumber",
            orderDirection: "desc",
            pagination: {
              limit: 50,
              ...(nextCursor && { after: nextCursor })
            },
            ...(Object.keys(cleanWhereClause).length > 0 && { where: cleanWhereClause })
          }
        };

        const options: any = {
          method: 'POST',
          headers: {
            'X-Api-Key': API_KEY,
            'X-Chain': CHAIN,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify(requestBody)
        };

        const response = await fetch(`${API_BASE_URL}/assets/edges`, options);
        if (response.status === 404) {
          return [];
        }
        if (!response.ok) {
          const errorText = await response.text();
          console.error('API Error Response:', {
            status: response.status,
            statusText: response.statusText,
            body: errorText,
            requestBody: requestBody
          });
          
          // If it's a 400 error, try with simpler request
          if (response.status === 400) {
            console.log('400 error - trying without where clause or with simplified request');
            const simpleRequestBody = {
              options: {
                pagination: {
                  limit: 50
                }
              }
            };
            
            const simpleResponse = await fetch(`${API_BASE_URL}/assets/edges`, {
              ...options,
              body: JSON.stringify(simpleRequestBody)
            });
            
            if (!simpleResponse.ok) {
              const simpleErrorText = await simpleResponse.text();
              throw new Error(`HTTP error! status: ${simpleResponse.status}, body: ${simpleErrorText}`);
            }
            
            const simpleData = await simpleResponse.json();
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

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const action = searchParams.get('action');
  const ipId = searchParams.get('ipId');

  try {
    switch (action) {
      case 'relationships':
        if (!ipId) {
          return NextResponse.json({ error: 'ipId is required for relationships' }, { status: 400 });
        }

        console.log('Fetching relationships for IP:', ipId);
        
        // Get edges where this IP is a child (to find parents)
        const parentsData = await fetchEdges({ ipId });
        console.log('Parents found:', parentsData.length);
        
        // Get edges where this IP is a parent (to find children)  
        const childrenData = await fetchEdges({ parentIpId: ipId });
        console.log('Children found:', childrenData.length);

        return NextResponse.json({
          parents: parentsData,
          children: childrenData,
          allRelationships: [...parentsData, ...childrenData]
        });

      case 'all':
        let allEdges: IPEdge[] = [];
        let hasNextPage = true;
        let nextCursor = null;
        let retryCount = 0;
        const maxRetries = 3;

        while (hasNextPage && retryCount < maxRetries) {
          try {
            const requestBody: any = {
              options: {
                orderBy: "blockNumber",
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
                'X-Api-Key': API_KEY,
                'X-Chain': CHAIN,
                'Content-Type': 'application/json'
              },
              body: JSON.stringify(requestBody)
            };

            const response = await fetch(`${API_BASE_URL}/assets/edges`, options);
            
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

        return NextResponse.json(allEdges);

      case 'test':
        const testOptions = {
          method: 'POST',
          headers: {
            'X-Api-Key': API_KEY,
            'X-Chain': CHAIN,
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

        const testResponse = await fetch(`${API_BASE_URL}/assets/edges`, testOptions);
        console.log('Test connection response:', testResponse.status);
        
        if (testResponse.ok) {
          const testData = await testResponse.json();
          return NextResponse.json({ success: true, data: testData });
        } else {
          const errorText = await testResponse.text();
          return NextResponse.json({ success: false, error: errorText }, { status: testResponse.status });
        }

      case 'licensing':
        if (!ipId) {
          return NextResponse.json({ error: 'ipId is required for licensing info' }, { status: 400 });
        }

        // Get relationships first
        const parentsForLicensing = await fetchEdges({ ipId });
        const childrenForLicensing = await fetchEdges({ parentIpId: ipId });
        const allRelationships = [...parentsForLicensing, ...childrenForLicensing];

        const licenseTemplates = [...new Set(allRelationships.map(edge => edge.licenseTemplate).filter(Boolean))];
        const licenseTerms = [...new Set(allRelationships.map(edge => edge.licenseTermsId).filter(Boolean))];

        return NextResponse.json({
          licenses: allRelationships,
          licenseTemplates,
          licenseTerms
        });

      default:
        return NextResponse.json({ error: 'Invalid action parameter' }, { status: 400 });
    }
  } catch (error) {
    console.error('API Error:', error);
    return NextResponse.json(
      { error: 'Internal server error', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}