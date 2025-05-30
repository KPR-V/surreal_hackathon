export interface Dispute {
  id: string;
  status: string;
  initiator: string;
  targetTag: string;
  currentTag: string;
  evidenceHash: string;
  counterEvidenceHash: string;
  arbitrationPolicy: string;
  disputeTimestamp: number;
  transactionHash: string;
  blockNumber: string;
  blockTimestamp: string;
  data: any;
  deletedAt?: string;
  logIndex: string;
  targetIpId: string;
  umaLink?: string;
  liveness?: number;
}

export interface DisputeInfo {
  hasDisputes: boolean;
  activeDisputes: Dispute[];
  resolvedDisputes: Dispute[];
  totalDisputes: number;
  isInitiator: boolean;
  isTarget: boolean;
}

export interface IPAsset {
  id: string;
  name: string;
  type: string;
  status: string;
  pilAttached: boolean;
  revenue: string;
  derivatives: number;
  image: string;
  ipId: string;
  tokenContract: string;
  tokenId: string;
  blockNumber: string;
  nftMetadata: {
    name: string;
    imageUrl: string;
    tokenContract: string;
    tokenId: string;
    chainId?: string;
    tokenUri?: string;
  };
  ancestorCount?: number;
  descendantCount?: number;
  childrenCount?: number;
  parentCount?: number;
  blockTimestamp?: string;
  transactionHash?: string;
  disputeInfo?: DisputeInfo;
}

export interface LicenseToken {
  id: string;
  licensorIpId: string;
  licenseTemplate: string;
  licenseTermsId: string;
  owner: string;
  transferable: string;
  blockNumber: string;
  blockTime: string;
  burntAt?: string;
  licensorName?: string;
  isActive: boolean;
  createdDate: string;
}

export interface Transaction {
  actionType: string;
  blockNumber: string;
  blockTimestamp: string;
  createdAt: string;
  id: string;
  initiator: string;
  ipId: string;
  logIndex: string;
  resourceId: string;
  resourceType: string;
  transactionIndex: string;
  txHash: string;
}

export interface IPEdge {
  id: string;
  parentIpId: string;
  childIpId: string;
  licenseTemplate: string;
  licenseTermsId: string;
  transferable: boolean;
  blockNumber: string;
  blockTimestamp: string;
  transactionHash: string;
  logIndex: string;
  ancestorCount?: number;
  descendantCount?: number;
}

export interface IPLicenseTerms {
  id: string;
  ipId: string;
  licenseTermsId: string;
  transferable: boolean;
  blockNumber: string;
  blockTimestamp: string;
  transactionHash: string;
  logIndex: string;
  licensingConfig?: {
    mintingFee?: string;
    commercialRevShare?: number;
    royaltyPolicy?: string;
    currencyToken?: string;
    uri?: string;
  };
}

export interface DetailedIPLicenseTerms {
  id: string;
  ipId: string;
  licenseTermsId: string;
  licenseTerms?: {
    commercialUse?: boolean;
    derivativesAllowed?: boolean;
    commercialRevShare?: number;
    mintingFee?: string;
    expiration?: string;
    commercialAttribution?: boolean;
    derivativeRevShare?: number;
  };
  transferable: boolean;
  blockNumber: string;
  blockTimestamp: string;
  transactionHash: string;
  logIndex: string;
}

export interface IPRelationships {
  parentEdges: IPEdge[];
  childEdges: IPEdge[];
  allRelationships: IPEdge[];
  hasParents: boolean;
  hasChildren: boolean;
  totalRelationships: number;
  ancestorCount: number;
  descendantCount: number;
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