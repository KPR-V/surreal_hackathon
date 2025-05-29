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



// Get all edges for a specific IP asset (both as child and parent)
export async function getIPRelationships(ipId: string): Promise<IPRelationships> {
  try {
    console.log('Fetching relationships for IP:', ipId);
    
    const response = await fetch(`/api/ip-edges?action=relationships&ipId=${encodeURIComponent(ipId)}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json'
      }
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(`API error: ${errorData.error || 'Unknown error'}`);
    }

    const data = await response.json();
    console.log('Parents found:', data.parents.length);
    console.log('Children found:', data.children.length);

    return {
      parents: data.parents,
      children: data.children,
      allRelationships: [...data.parents, ...data.children]
    };
    } catch (error) {
      console.error('Error fetching IP relationships:', error);
      return { parents: [], children: [], allRelationships: [] };
    }
  }

// Get all relationships in the network (for family tree analysis)
export async function getAllRelationships(): Promise<IPEdge[]> {
  try {
    console.log('Fetching all relationships...');

    const response = await fetch('/api/ip-edges?action=all', {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json'
      }
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(`API error: ${errorData.error || 'Unknown error'}`);
    }

    const allEdges = await response.json();
    console.log(`Fetched ${allEdges.length} total relationships`);
    
    return allEdges;
  } catch (error) {
    console.error('Error fetching all relationships:', error);
    return [];
  }
}

// Test API connectivity
export async function testConnection(): Promise<boolean> {
  try {
    const response = await fetch('/api/ip-edges?action=test', {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json'
      }
    });

    if (response.ok) {
      const data = await response.json();
      console.log('Test connection successful:', data);
      return data.success;
    } else {
      const errorData = await response.json();
      console.error('Test connection failed:', errorData);
      return false;
    }
  } catch (error) {
    console.error('Test connection error:', error);
    return false;
  }
}

// Get licensing information for an IP asset
export async function getLicensingInfo(ipId: string): Promise<{
  licenses: IPEdge[];
  licenseTemplates: string[];
  licenseTerms: string[];
}> {
  try {
    console.log('Fetching licensing info for IP:', ipId);

    const response = await fetch(`/api/ip-edges?action=licensing&ipId=${encodeURIComponent(ipId)}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json'
      }
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(`API error: ${errorData.error || 'Unknown error'}`);
    }

    const data = await response.json();
    console.log('Licensing info fetched:', {
      licensesCount: data.licenses.length,
      templatesCount: data.licenseTemplates.length,
      termsCount: data.licenseTerms.length
    });

    return {
      licenses: data.licenses,
      licenseTemplates: data.licenseTemplates,
      licenseTerms: data.licenseTerms
    };
  } catch (error) {
    console.error('Error fetching licensing info:', error);
    return { licenses: [], licenseTemplates: [], licenseTerms: [] };
  }
}