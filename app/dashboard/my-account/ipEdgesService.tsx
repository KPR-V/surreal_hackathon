"use client";

import { 
  IPEdge, 
  IPLicenseTerms, 
  DetailedIPLicenseTerms, 
  IPRelationships, 
  DisputeInfo, 
  Dispute,
  ComprehensiveLicensingInfo 
} from './types';

// Function to get relationships (parents and children) for an IP asset
export async function getIPRelationships(ipId: string): Promise<IPRelationships> {
  try {
    console.log('Fetching relationships for IP:', ipId);

    const response = await fetch(`/api/ip-edges?action=relationships&ipId=${ipId}`);

    if (!response.ok) {
      console.warn('IP edges API not available or no relationships found');
      return {
        parentEdges: [],
        childEdges: [],
        allRelationships: [],
        hasParents: false,
        hasChildren: false,
        totalRelationships: 0,
        ancestorCount: 0,
        descendantCount: 0
      };
    }

    const data = await response.json();
    console.log('IP relationships data:', data);

    const parentEdges: IPEdge[] = data.parents || [];
    const childEdges: IPEdge[] = data.children || [];
    const allRelationships: IPEdge[] = [...parentEdges, ...childEdges];

    return {
      parentEdges,
      childEdges,
      allRelationships,
      hasParents: parentEdges.length > 0,
      hasChildren: childEdges.length > 0,
      totalRelationships: allRelationships.length,
      ancestorCount: parentEdges.length,
      descendantCount: childEdges.length
    };
  } catch (error) {
    console.error('Error fetching IP relationships:', error);
    return {
      parentEdges: [],
      childEdges: [],
      allRelationships: [],
      hasParents: false,
      hasChildren: false,
      totalRelationships: 0,
      ancestorCount: 0,
      descendantCount: 0
    };
  }
}

// Get dispute information for an IP asset
export async function getIPDisputes(ipId: string): Promise<DisputeInfo> {
  try {
    console.log('Fetching disputes for IP:', ipId);

    const response = await fetch('/api/disputes', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        options: {
          where: { targetIpId: ipId },
          pagination: { limit: 100 }
        }
      })
    });

    if (!response.ok) {
      console.warn('Disputes API not available or no disputes found');
      return {
        hasDisputes: false,
        activeDisputes: [],
        resolvedDisputes: [],
        totalDisputes: 0,
        isInitiator: false,
        isTarget: false
      };
    }

    const data = await response.json();
    const disputes = data.data || [];

    const activeDisputes = disputes.filter((dispute: Dispute) => 
      dispute.status.toLowerCase() === 'active' || dispute.status.toLowerCase() === 'pending'
    );
    const resolvedDisputes = disputes.filter((dispute: Dispute) => 
      dispute.status.toLowerCase() === 'resolved' || dispute.status.toLowerCase() === 'dismissed'
    );

    return {
      hasDisputes: disputes.length > 0,
      activeDisputes,
      resolvedDisputes,
      totalDisputes: disputes.length,
      isInitiator: disputes.some((d: Dispute) => d.initiator === ipId),
      isTarget: disputes.length > 0
    };
  } catch (error) {
    console.error('Error fetching disputes:', error);
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

// Get comprehensive licensing information
export async function getComprehensiveLicensingInfo(ipId: string): Promise<ComprehensiveLicensingInfo> {
  try {
    // Get basic licensing relationships
    const relationshipData = await getIPRelationships(ipId);
    
    // Get IP license terms
    const ipLicenseResponse = await fetch(`/api/licenses/ip/terms/${ipId}`);
    let ipLicenseTerms: IPLicenseTerms[] = [];
    if (ipLicenseResponse.ok) {
      const ipLicenseData = await ipLicenseResponse.json();
      ipLicenseTerms = ipLicenseData.data || [];
    }

    // Get detailed license terms
    const licenseTermsIds = [...new Set([
      ...relationshipData.allRelationships.map(edge => edge.licenseTermsId),
      ...ipLicenseTerms.map(term => term.licenseTermsId)
    ].filter(Boolean))];

    let detailedTerms: DetailedIPLicenseTerms[] = [];
    if (licenseTermsIds.length > 0) {
      const detailedResponse = await fetch('/api/detailed-ip-license-terms', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          ipIds: [ipId]
        })
      });
      if (detailedResponse.ok) {
        const detailedData = await detailedResponse.json();
        detailedTerms = detailedData.data || [];
      }
    }

    // Analyze licensing information
    const commercialUseAllowed = detailedTerms.some(term => term.licenseTerms?.commercialUse);
    const derivativesAllowed = detailedTerms.some(term => term.licenseTerms?.derivativesAllowed);
    const totalRevShare = detailedTerms.reduce((sum, term) => sum + (term.licenseTerms?.commercialRevShare || 0), 0);
    
    const mintingFees = [
      ...ipLicenseTerms.map(term => term.licensingConfig?.mintingFee).filter(Boolean),
      ...detailedTerms.map(term => term.licenseTerms?.mintingFee).filter(Boolean)
    ] as string[];

    return {
      basicLicenses: relationshipData.allRelationships,
      licenseTerms: ipLicenseTerms,
      detailedTerms,
      licenseTemplates: [...new Set(relationshipData.allRelationships.map(edge => edge.licenseTemplate).filter(Boolean))],
      licenseTermsIds,
      totalLicenses: relationshipData.allRelationships.length + ipLicenseTerms.length,
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

// Test API connection
export async function testConnection(): Promise<boolean> {
  try {
    const response = await fetch('/api/ip-edges?action=test');
    return response.ok;
  } catch (error) {
    console.error('API connection test failed:', error);
    return false;
  }
}

// Legacy IPEdgesService class for backward compatibility
export class IPEdgesService {
  static async getIPRelationships(ipId: string) {
    return getIPRelationships(ipId);
  }

  static async getAllRelationships(): Promise<IPEdge[]> {
    try {
      const response = await fetch('/api/ip-edges?action=all');
      if (!response.ok) return [];
      return await response.json();
    } catch (error) {
      console.error('Error fetching all relationships:', error);
      return [];
    }
  }

  static async getLicensingInfo(ipId: string) {
    try {
      const response = await fetch(`/api/ip-edges?action=licensing&ipId=${ipId}`);
      if (!response.ok) {
        return { licenses: [], licenseTemplates: [], licenseTerms: [] };
      }
      return await response.json();
    } catch (error) {
      console.error('Error fetching licensing info:', error);
      return { licenses: [], licenseTemplates: [], licenseTerms: [] };
    }
  }
}