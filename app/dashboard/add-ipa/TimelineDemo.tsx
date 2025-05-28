'use client';
import React, { useState } from "react";
import { Timeline } from "../../../components/ui/timeline";
import { SummaryModal } from "../../../components/ui/SummaryModal";
import { MultiStepLoader } from "../../../components/ui/multi-step-loader";
import { PILModal } from "../../../components/ui/PILModal";

// Import backend functions - you'll need to add these imports
// import { register, batchRegister } from "../../../main_functions/register";
// import { register_pilterms } from "../../../main_functions/register_pilterms";
// import { mintandregisterip } from "../../../main_functions/mintandregisterip";
// import { mint_register_pilterms } from "../../../main_functions/mint_register_pilterms";
// import { register_derivative_ip, batch_register_derivative_ip } from "../../../main_functions/register_derivative_ip";
// import { mint_registerIp_makederivative, batch_mint_registerIp_makederivative } from "../../../main_functions/mint_registerIp_makederivative";
// import { register_derivative } from "../../../main_functions/register_derivative";
//import { mint_registerIp_makederivative_licensetokens } from "../../../main_functions/mint_registerIp_makederivative_licensetokens";

interface Question {
  id: string;
  type: "radio" | "text" | "textarea" | "file" | "checkbox";
  question: string;
  options?: string[];
  required: boolean;
}

interface CardConfig {
  id: string;
  title: string;
  description: string;
  questions: Question[];
  submitFunction: string;
}

interface TimelineDemoProps {
  cardConfig: CardConfig;
  onBack: () => void;
}

export function TimelineDemo({ cardConfig, onBack }: TimelineDemoProps) {
  const [currentStep, setCurrentStep] = useState(0);
  const [formData, setFormData] = useState<Record<string, any>>({});
  const [batchFormData, setBatchFormData] = useState<Record<string, any>[]>([]);
  const [maxReachedStep, setMaxReachedStep] = useState(0);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isCreateIPEnabled, setIsCreateIPEnabled] = useState(false);
  const [showTooltip, setShowTooltip] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  
  // PIL Modal states
  const [isPILModalOpen, setIsPILModalOpen] = useState(false);
  const [pilTerms, setPilTerms] = useState<any>(null);

  // Loading states for MultiStepLoader
  const loadingStates = [
    {
      text: `Processing ${cardConfig.title}`,
    },
    {
      text: "Validating form data...",
    },
    {
      text: "Connecting to blockchain",
    },
    {
      text: "Processing transaction",
    },
    {
      text: "Finalizing registration",
    },
    {
      text: "Complete!",
    },
  ];

  // Handle form submission based on card type
  const handleSubmit = async (formData: Record<string, any>) => {
    console.log(`Submitting ${cardConfig.submitFunction} with data:`, formData);
    
    // Check for batch functionality
    const supportsBatch = ["register-ip", "register-derivative-ip", "mint-and-register-derivative-ip"];
    
    if (supportsBatch.includes(cardConfig.id) && batchFormData.length > 0) {
      // Include current form data in batch
      const allBatchData = [...batchFormData, formData];
      
      if (cardConfig.id === "register-ip") {
        // Check if any item in the batch has PIL terms attached
        const hasPilTerms = allBatchData.some(data => data.attach_pil === "Yes" && data.pilTerms);
        
        if (hasPilTerms) {
          await handleBatchRegisterWithPIL(allBatchData);
        } else {
          await handleBatchRegister(allBatchData);
        }
      } else if (cardConfig.id === "register-derivative-ip") {
        await handleBatchRegisterDerivativeIP(allBatchData);
      } else if (cardConfig.id === "mint-and-register-derivative-ip") {
        await handleBatchMintAndRegisterDerivativeIP(allBatchData);
      }
    } else {
      // Function routing for different card types
      switch (cardConfig.submitFunction) {
        case "register":
          // Check if PIL terms are attached
          if (formData.attach_pil === "Yes" && pilTerms) {
            await handleRegisterWithPIL({ ...formData, pilTerms });
          } else {
            await handleRegisterIP(formData);
          }
          break;
        case "mintAndRegisterIP":
          // Check if PIL terms are attached
          if (formData.attach_pil === "Yes" && pilTerms) {
            await handleMintRegisterPIL({ ...formData, pilTerms });
            
          } else {
            await handleMintAndRegisterIP(formData);
          }
          break;
           case "attachPILToIP":
          return await handleAttachPILToIP(formData);
        case "registerDerivativeIP":
          await handleRegisterDerivativeIP(formData);
          break;
        case "mintAndRegisterDerivativeIP":
          await handleMintAndRegisterDerivativeIP(formData);
          break;
        case "registerDerivative":
          await handleRegisterDerivative(formData);
          break;
        case "mintNFT":
          await handleMintNFT(formData);
          break;
        case "createPIL":
          await handleCreatePIL(formData);
          break;
        case "mintAndRegisterDerivativeWithLicenseTokens":
          await handleMintAndRegisterDerivativeWithLicenseTokens(formData);
          break;
           case "registerIPAndMakeDerivativeWithLicenseTokens":
        await handleRegisterIPAndMakeDerivativeWithLicenseTokens(formData);
        break;
          case "registerDerivativeWithLicenseTokens":
          return await handleRegisterDerivativeWithLicenseTokens(formData);
          break;
         
        default:
          console.log("Unknown submit function:", cardConfig.submitFunction);
      }
    }
  };

  // Mint and Register Derivative IP
  const handleMintAndRegisterDerivativeIP = async (data: Record<string, any>) => {
    console.log("Mint and Register Derivative IP function called with:", data);
    
    try {
      const spgnftcontract = data.spg_nft_contract || undefined;
      
      // Parse parent IP IDs and license terms IDs from comma-separated strings
      const parentIpIds = data.parent_ip_ids.split(',').map((id: string) => id.trim()).filter(Boolean);
      const licenseTermsIds = data.license_terms_ids.split(',').map((id: string) => id.trim()).filter(Boolean);
      
      // Validate that arrays have same length
      if (parentIpIds.length !== licenseTermsIds.length) {
        throw new Error("Number of parent IP IDs must match number of license terms IDs");
      }
      
      // Build IP metadata based on user selection
      let ipMetadata = undefined;
      let nftMetadata = undefined;
      
      const metadataType = data.metadata_type;
      
      if (metadataType === "Both IP and NFT metadata" || metadataType === "Only IP metadata") {
        ipMetadata = {
          title: data.ip_title,
          description: data.ip_description,
          external_url: data.ip_external_url || "",
          image: data.ip_image || ""
        };
      }
      
      if (metadataType === "Both IP and NFT metadata" || metadataType === "Only NFT metadata") {
        nftMetadata = {
          name: data.nft_name,
          description: data.nft_description,
          external_url: data.nft_external_url || "",
          image: data.nft_image || ""
        };
      }

      // Call the backend function
      // const result = await mint_registerIp_makederivative(spgnftcontract, parentIpIds, licenseTermsIds, ipMetadata, nftMetadata);
      // console.log("Mint and register derivative IP successful:", result);
      // return result;
    } catch (error) {
      console.error("Mint and register derivative IP failed:", error);
      throw error;
    }
  };

  // Batch mint and register derivative IP
  const handleBatchMintAndRegisterDerivativeIP = async (batchData: Record<string, any>[]) => {
    console.log("Batch Mint and Register Derivative IP function called with:", batchData);
    
    try {
      const items = batchData.map(data => {
        const parentIpIds = data.parent_ip_ids.split(',').map((id: string) => id.trim()).filter(Boolean);
        const licenseTermsIds = data.license_terms_ids.split(',').map((id: string) => id.trim()).filter(Boolean);
        
        // Build IP metadata based on user selection
        let ipMetadata = undefined;
        let nftMetadata = undefined;
        
        const metadataType = data.metadata_type;
        
        if (metadataType === "Both IP and NFT metadata" || metadataType === "Only IP metadata") {
          ipMetadata = {
            title: data.ip_title,
            description: data.ip_description,
            external_url: data.ip_external_url || "",
            image: data.ip_image || ""
          };
        }
        
        if (metadataType === "Both IP and NFT metadata" || metadataType === "Only NFT metadata") {
          nftMetadata = {
            name: data.nft_name,
            description: data.nft_description,
            external_url: data.nft_external_url || "",
            image: data.nft_image || ""
          };
        }
        
        return {
          spgNftContract: data.spg_nft_contract || "default", // Use default if not specified
          parentIpIds,
          licenseTermsIds,
          ipMetadata,
          nftMetadata
        };
      });

      // Call the backend function
      // const result = await batch_mint_registerIp_makederivative(items);
      // console.log("Batch mint and register derivative IP successful:", result);
      // return result;
    } catch (error) {
      console.error("Batch mint and register derivative IP failed:", error);
      throw error;
    }
  };

  // Register Derivative IP
  const handleRegisterDerivativeIP = async (data: Record<string, any>) => {
    console.log("Register Derivative IP function called with:", data);
    
    try {
      const nftContract = data.nft_contract;
      const tokenId = data.token_id;
      
      // Parse parent IP IDs and license terms IDs from comma-separated strings
      const parentIpIds = data.parent_ip_ids.split(',').map((id: string) => id.trim()).filter(Boolean);
      const licenseTermsIds = data.license_terms_ids.split(',').map((id: string) => id.trim()).filter(Boolean);
      
      // Validate that arrays have same length
      if (parentIpIds.length !== licenseTermsIds.length) {
        throw new Error("Number of parent IP IDs must match number of license terms IDs");
      }
      
      // Build IP metadata based on user selection
      let ipMetadata = undefined;
      let nftMetadata = undefined;
      
      const metadataType = data.metadata_type;
      
      if (metadataType === "Both IP and NFT metadata" || metadataType === "Only IP metadata") {
        ipMetadata = {
          title: data.ip_title,
          description: data.ip_description,
          external_url: data.ip_external_url || "",
          image: data.ip_image || ""
        };
      }
      
      if (metadataType === "Both IP and NFT metadata" || metadataType === "Only NFT metadata") {
        nftMetadata = {
          name: data.nft_name || "",
          description: data.nft_description || "",
          external_url: data.nft_external_url || "",
          image: data.nft_image || ""
        };
      }

      // Call the backend function
      // const result = await register_derivative_ip(nftContract, tokenId, parentIpIds, licenseTermsIds, ipMetadata, nftMetadata);
      // console.log("Register derivative IP successful:", result);
      // return result;
    } catch (error) {
      console.error("Register derivative IP failed:", error);
      throw error;
    }
  };

  // Batch register derivative IP
  const handleBatchRegisterDerivativeIP = async (batchData: Record<string, any>[]) => {
    console.log("Batch Register Derivative IP function called with:", batchData);
    
    try {
      // For batch_register_derivative_ip, we need already registered child IPs
      // This function is different from register_derivative_ip as it works with existing IPs
      
      const childIpIds: string[] = [];
      const parentIpIdsArray: string[][] = [];
      const licenseTermsIdsArray: (string[] | bigint[] | number[])[] = [];
      
      batchData.forEach(data => {
        // Note: This assumes the NFTs are already registered as IPs
        // You might need to first register them as IPs and get their IP IDs
        const childIpId = `0x${data.nft_contract}_${data.token_id}`; // This would be the actual IP ID
        const parentIpIds = data.parent_ip_ids.split(',').map((id: string) => id.trim()).filter(Boolean);
        const licenseTermsIds = data.license_terms_ids.split(',').map((id: string) => id.trim()).filter(Boolean);
        
        childIpIds.push(childIpId);
        parentIpIdsArray.push(parentIpIds);
        licenseTermsIdsArray.push(licenseTermsIds);
      });

      // Call the backend function
      // const result = await batch_register_derivative_ip(childIpIds, parentIpIdsArray, licenseTermsIdsArray);
      // console.log("Batch register derivative IP successful:", result);
      // return result;
    } catch (error) {
      console.error("Batch register derivative IP failed:", error);
      throw error;
    }
  };

  // Register Derivative (Link existing IPs) - Single operation only
  const handleRegisterDerivative = async (data: Record<string, any>) => {
    console.log("Register Derivative function called with:", data);
    
    try {
      const childIpId = data.child_ip_id;
      
      // Parse parent IP IDs and license terms IDs from comma-separated strings
      const parentIpIds = data.parent_ip_ids.split(',').map((id: string) => id.trim()).filter(Boolean);
      const licenseTermsIds = data.license_terms_ids.split(',').map((id: string) => id.trim()).filter(Boolean);
      
      // Validate that arrays have same length
      if (parentIpIds.length !== licenseTermsIds.length) {
        throw new Error("Number of parent IP IDs must match number of license terms IDs");
      }

      // Call the backend function
      // const result = await register_derivative(childIpId, parentIpIds, licenseTermsIds);
      // console.log("Register derivative successful:", result);
      // return result;
    } catch (error) {
      console.error("Register derivative failed:", error);
      throw error;
    }
  };

  // Register IP without PIL terms
  const handleRegisterIP = async (data: Record<string, any>) => {
    console.log("Register IP function called with:", data);
    
    try {
      const nftContract = data.nft_contract;
      const tokenId = data.token_id;
      
      // Build IP metadata
      const ipMetadata = {
        title: data.ip_title,
        description: data.ip_description,
        external_url: data.external_url || "",
        image: data.image_url || ""
      };

      // Call the backend function
      // const result = await register(nftContract, tokenId, ipMetadata);
      // console.log("Register successful:", result);
      // return result;
    } catch (error) {
      console.error("Register failed:", error);
      throw error;
    }
  };

  // Register IP with PIL terms
  const handleRegisterWithPIL = async (data: Record<string, any>) => {
    console.log("Register with PIL function called with:", data);
    
    try {
      const nftContract = data.nft_contract;
      const tokenId = data.token_id;
      
      // Build license terms from pilTerms
      const terms = {
        transferable: data.pilTerms.transferable || true,
        royaltyPolicy: data.pilTerms.royaltyPolicy || "0x0000000000000000000000000000000000000000",
        mintingFee: data.pilTerms.mintingFeeAmount ? parseInt(data.pilTerms.mintingFeeAmount) : (data.pilTerms.mintingFee || 0),
        expiration: data.pilTerms.expiration || 0,
        commercialUse: data.pilTerms.commercialUse || false,
        commercialAttribution: data.pilTerms.commercialAttribution || true,
        commercializerChecker: data.pilTerms.commercializerChecker || "0x0000000000000000000000000000000000000000",
        commercializerCheckerData: data.pilTerms.commercializerCheckerData || "0x",
        commercialRevCeiling: data.pilTerms.commercialRevCeiling || 0,
        commercialRevShare: data.pilTerms.commercialRevShare || 0,
        derivativesAllowed: data.pilTerms.derivativesAllowed || false,
        derivativesAttribution: data.pilTerms.derivativesAttribution || true,
        derivativesApproval: data.pilTerms.derivativesApproval || false,
        derivativesReciprocal: data.pilTerms.derivativesReciprocal || false,
        currency: data.pilTerms.currency || "0x0000000000000000000000000000000000000000",
      };

      // Build IP metadata
      const ipMetadata = {
        title: data.ip_title,
        description: data.ip_description,
        external_url: data.external_url || "",
        image: data.image_url || ""
      };

      // Call the backend function
      // const result = await register_pilterms(nftContract, tokenId, terms, ipMetadata);
      // console.log("Register with PIL successful:", result);
      // return result;
    } catch (error) {
      console.error("Register with PIL failed:", error);
      throw error;
    }
  };

  // Batch register without PIL terms
  const handleBatchRegister = async (batchData: Record<string, any>[]) => {
    console.log("Batch Register function called with:", batchData);
    
    try {
      const batchItems = batchData.map(data => ({
        nftContract: data.nft_contract,
        tokenId: data.token_id,
        ipMetadata: {
          title: data.ip_title,
          description: data.ip_description,
          external_url: data.external_url || "",
          image: data.image_url || ""
        }
      }));

      // Call the backend function
      // const result = await batchRegister(batchItems);
      // console.log("Batch register successful:", result);
      // return result;
    } catch (error) {
      console.error("Batch register failed:", error);
      throw error;
    }
  };

  // Batch register with PIL terms (process individually for now)
  const handleBatchRegisterWithPIL = async (batchData: Record<string, any>[]) => {
    console.log("Batch Register with PIL function called with:", batchData);
    
    try {
      const results = [];
      
      for (const data of batchData) {
        if (data.attach_pil === "Yes" && data.pilTerms) {
          // Process with PIL terms
          const result = await handleRegisterWithPIL(data);
          results.push(result);
        } else {
          // Process without PIL terms
          const result = await handleRegisterIP(data);
          results.push(result);
        }
      }
      
      console.log("Batch register with PIL successful:", results);
      return results;
    } catch (error) {
      console.error("Batch register with PIL failed:", error);
      throw error;
    }
  };

  const handleMintAndRegisterIP = async (data: Record<string, any>) => {
    console.log("Mint and Register IP function called with:", data);
    
    try {
      const spgnftcontract = data.spg_nft_contract || undefined;
      
      // Build IP metadata based on user selection
      let ipMetadata = undefined;
      let nftMetadata = undefined;
      
      const metadataType = data.metadata_type;
      
      if (metadataType === "Both IP and NFT metadata" || metadataType === "Only IP metadata") {
        ipMetadata = {
          title: data.ip_title,
          description: data.ip_description,
          external_url: data.ip_external_url || "",
          image: data.ip_image || ""
        };
      }
      
      if (metadataType === "Both IP and NFT metadata" || metadataType === "Only NFT metadata") {
        nftMetadata = {
          name: data.nft_name,
          description: data.nft_description,
          external_url: data.nft_external_url || "",
          image: data.nft_image || ""
        };
      }
      
      // Call the backend function
      // const result = await mintandregisterip(ipMetadata, nftMetadata, spgnftcontract);
      // console.log("Mint and register successful:", result);
      // return result;
    } catch (error) {
      console.error("Mint and register failed:", error);
      throw error;
    }
  };

  const handleMintRegisterPIL = async (data: Record<string, any>) => {
    console.log("Mint Register PIL function called with:", data);
    
    try {
      // Build license terms from pilTerms (since this is only called when PIL terms are attached)
      const terms = {
        transferable: data.pilTerms.transferable || true,
        royaltyPolicy: data.pilTerms.royaltyPolicy || "0x0000000000000000000000000000000000000000",
        mintingFee: data.pilTerms.mintingFeeAmount ? parseInt(data.pilTerms.mintingFeeAmount) : (data.pilTerms.mintingFee || 0),
        expiration: data.pilTerms.expiration || 0,
        commercialUse: data.pilTerms.commercialUse || false,
        commercialAttribution: data.pilTerms.commercialAttribution || true,
        commercializerChecker: data.pilTerms.commercializerChecker || "0x0000000000000000000000000000000000000000",
        commercializerCheckerData: data.pilTerms.commercializerCheckerData || "0x",
        commercialRevCeiling: data.pilTerms.commercialRevCeiling || 0,
        commercialRevShare: data.pilTerms.commercialRevShare || 0,
        derivativesAllowed: data.pilTerms.derivativesAllowed || false,
        derivativesAttribution: data.pilTerms.derivativesAttribution || true,
        derivativesApproval: data.pilTerms.derivativesApproval || false,
        derivativesReciprocal: data.pilTerms.derivativesReciprocal || false,
        currency: data.pilTerms.currency || "0x0000000000000000000000000000000000000000",
      };

      const spgnftcontract = data.spg_nft_contract || undefined;
      
      // Build IP metadata based on user selection
      let ipMetadata = undefined;
      let nftMetadata = undefined;
      
      const metadataType = data.metadata_type;
      
      if (metadataType === "Both IP and NFT metadata" || metadataType === "Only IP metadata") {
        ipMetadata = {
          title: data.ip_title,
          description: data.ip_description,
          external_url: data.ip_external_url || "",
          image: data.ip_image || ""
        };
      }
      
      if (metadataType === "Both IP and NFT metadata" || metadataType === "Only NFT metadata") {
        nftMetadata = {
          name: data.nft_name,
          description: data.nft_description,
          external_url: data.nft_external_url || "",
          image: data.nft_image || ""
        };
      }
      
      // Call the backend function
      // const result = await mint_register_pilterms(terms, spgnftcontract, ipMetadata, nftMetadata);
      // console.log("Mint register PIL successful:", result);
      // return result;
    } catch (error) {
      console.error("Mint register PIL failed:", error);
      throw error;
    }
  };

  const handleMintNFT = async (data: Record<string, any>) => {
    // TODO: Implement mintNFT function
    console.log("Mint NFT function called with:", data);
  };

  const handleCreatePIL = async (data: Record<string, any>) => {
    // TODO: Implement createPIL function
    console.log("Create PIL function called with:", data);
  };

  // Mint and Register Derivative IP with License Tokens
  const handleMintAndRegisterDerivativeWithLicenseTokens = async (data: Record<string, any>) => {
    console.log("Mint and Register Derivative IP with License Tokens function called with:", data);
    
    try {
      const spgnftcontract = data.spg_nft_contract;
      const maxRts = parseInt(data.max_rts);
      
      // Validate maxRts range
      if (isNaN(maxRts) || maxRts < 0 || maxRts > 100000000) {
        throw new Error("Maximum royalty tokens must be between 0 and 100,000,000");
      }
      
      // Parse license token IDs from comma-separated string
      const licenseTokenIds = data.license_token_ids.split(',').map((id: string) => id.trim()).filter(Boolean);
      
      if (licenseTokenIds.length === 0) {
        throw new Error("At least one license token ID is required");
      }
      
      // Build IP metadata based on user selection
      let ipMetadata = undefined;
      let nftMetadata = undefined;
      
      const metadataType = data.metadata_type;
      
      if (metadataType === "Both IP and NFT metadata" || metadataType === "Only IP metadata") {
        ipMetadata = {
          title: data.ip_title,
          description: data.ip_description,
          external_url: data.ip_external_url || "",
          image: data.ip_image || ""
        };
      }
      
      if (metadataType === "Both IP and NFT metadata" || metadataType === "Only NFT metadata") {
        nftMetadata = {
          name: data.nft_name,
          description: data.nft_description,
          external_url: data.nft_external_url || "",
          image: data.nft_image || ""
        };
      }

      // Call the backend function
      // const result = await mint_registerIp_makederivative_licensetokens(
      //   spgnftcontract,
      //   licenseTokenIds,
      //   maxRts,
      //   ipMetadata,
      //   nftMetadata
      // );
      // console.log("Mint and register derivative IP with license tokens successful:", result);
      // return result;
    } catch (error) {
      console.error("Mint and register derivative IP with license tokens failed:", error);
      throw error;
    }
  };

  const handleRegisterIPAndMakeDerivativeWithLicenseTokens = async (data: Record<string, any>) => {
    console.log("Register IP and Make Derivative with License Tokens function called with:", data);
    
    try {
      const nftContract = data.nft_contract;
      const tokenId = data.token_id;
      const maxRts = parseInt(data.max_rts);
      
      // Validate maxRts range
      if (isNaN(maxRts) || maxRts < 0 || maxRts > 100000000) {
        throw new Error("Maximum royalty tokens must be between 0 and 100,000,000");
      }
      
      // Parse license token IDs from comma-separated string
      const licenseTokenIds = data.license_token_ids.split(',').map((id: string) => id.trim()).filter(Boolean);
      
      if (licenseTokenIds.length === 0) {
        throw new Error("At least one license token ID is required");
      }
      
      // Build IP metadata based on user selection
      let ipMetadata = undefined;
      let nftMetadata = undefined;
      
      const metadataType = data.metadata_type;
      
      if (metadataType === "Both IP and NFT metadata" || metadataType === "Only IP metadata") {
        ipMetadata = {
          title: data.ip_title,
          description: data.ip_description,
          external_url: data.ip_external_url || "",
          image: data.ip_image || ""
        };
      }
      
      if (metadataType === "Both IP and NFT metadata" || metadataType === "Only NFT metadata") {
        nftMetadata = {
          name: data.nft_name,
          description: data.nft_description,
          external_url: data.nft_external_url || "",
          image: data.nft_image || ""
        };
      }

      // Call the backend function
      // const result = await register_ip_make_derivative_licensetoken(
      //   nftContract,
      //   tokenId,
      //   licenseTokenIds,
      //   maxRts,
      //   ipMetadata,
      //   nftMetadata
      // );
      // console.log("Register IP and make derivative with license tokens successful:", result);
      // return result;
    } catch (error) {
      console.error("Register IP and make derivative with license tokens failed:", error);
      throw error;
    }
  };

  const handleAttachPILToIP = async (data: Record<string, any>) => {
    console.log("Attach PIL to IP function called with:", data);
    
    try {
      const ipId = data.ip_id;
      const pilOption = data.pil_option;
      
      if (pilOption === "I already have license terms created") {
        // Option 1: Attach existing license terms
        const licenseTermsId = data.license_terms_id;
        
        if (!licenseTermsId) {
          throw new Error("License Terms ID is required when using existing license terms");
        }
        
        // Call the attachpilterms function
        // const result = await attachpilterms(licenseTermsId, ipId);
        // console.log("Attach PIL terms successful:", result);
        // return result;
        
      } else if (pilOption === "I want to create new PIL terms and attach") {
        // Option 2: Create new PIL terms and attach
        if (!pilTerms) {
          throw new Error("PIL terms must be created first. Please use the PIL modal to create terms.");
        }
        
        // First create new PIL terms
        const transferable = pilTerms.transferable || true;
        const commercialUse = pilTerms.commercialUse || false;
        const commercialAttribution = pilTerms.commercialAttribution || true;
        const commercialRevShare = pilTerms.commercialRevShare || 0;
        const derivativesAllowed = pilTerms.derivativesAllowed || false;
        const derivativesAttribution = pilTerms.derivativesAttribution || true;
        const derivativesApproval = pilTerms.derivativesApproval || false;
        const derivativesReciprocal = pilTerms.derivativesReciprocal || false;
        
        // Optional parameters
        const royaltyPolicy = pilTerms.royaltyPolicy !== "0x0000000000000000000000000000000000000000" ? pilTerms.royaltyPolicy : undefined;
        const defaultMintingFee = pilTerms.mintingFee ? BigInt(pilTerms.mintingFee) : undefined;
        const expiration = pilTerms.expiration ? BigInt(pilTerms.expiration) : undefined;
        const commercialRevCeiling = pilTerms.commercialRevCeiling ? BigInt(pilTerms.commercialRevCeiling) : undefined;
        const derivativeRevCeiling = undefined; // Not in current PIL modal
        const usewip = pilTerms.currency === "0x0000000000000000000000000000000000000000"; // Use WIP if zero address
        
        // Call the createnewpilterms function
        // const result = await createnewpilterms(
        //   transferable,
        //   commercialUse,
        //   commercialAttribution,
        //   commercialRevShare,
        //   derivativesAllowed,
        //   derivativesAttribution,
        //   derivativesApproval,
        //   derivativesReciprocal,
        //   royaltyPolicy,
        //   defaultMintingFee,
        //   expiration,
        //   commercialRevCeiling,
        //   derivativeRevCeiling,
        //   usewip
        // );
        // console.log("Create and attach PIL terms successful:", result);
        // return result;
      }
      
    } catch (error) {
      console.error("Attach PIL to IP failed:", error);
      throw error;
    }
  };

  const handleRegisterDerivativeWithLicenseTokens = async (data: Record<string, any>) => {
    console.log("Register Derivative with License Tokens function called with:", data);
    
    try {
      const childIpId = data.child_ip_id;
      const maxRts = parseInt(data.max_rts);
      
      // Validate maxRts range
      if (isNaN(maxRts) || maxRts < 0 || maxRts > 100000000) {
        throw new Error("Maximum royalty tokens must be between 0 and 100,000,000");
      }
      
      // Parse license token IDs from comma-separated string
      const licenseTokenIds = data.license_token_ids.split(',').map((id: string) => id.trim()).filter(Boolean);
      
      if (licenseTokenIds.length === 0) {
        throw new Error("At least one license token ID is required");
      }

      // Call the backend function
      // const result = await register_derivative_License_tokens(
      //   childIpId,
      //   licenseTokenIds,
      //   maxRts
      // );
      // console.log("Register derivative with license tokens successful:", result);
      // return result;
    } catch (error) {
      console.error("Register derivative with license tokens failed:", error);
      throw error;
    }
  };

  const handleInputChange = (questionId: string, value: any) => {
    setFormData(prev => ({
      ...prev,
      [questionId]: value
    }));
  };

  const isQuestionAnswered = (question: Question) => {
    // Special handling for attach-pil-to-ip card
    if (cardConfig.id === "attach-pil-to-ip" && question.id === "license_terms_id") {
      const pilOption = formData["pil_option"];
      if (pilOption === "I want to create new PIL terms and attach") {
        // For this option, we need PIL terms to be created instead of license_terms_id
        return !!pilTerms;
      } else if (pilOption === "I already have license terms created") {
        // For this option, we need license_terms_id to be filled
        const answer = formData[question.id];
        return answer && answer.trim().length > 0;
      }
      // If no option selected yet, consider it unanswered
      return false;
    }
    
    const answer = formData[question.id];
    if (!answer) return false;
    
    if (question.type === "text" || question.type === "textarea") {
      return answer.trim().length > 0;
    }
    
    if (question.type === "radio") {
      return !!answer;
    }
    
    if (question.type === "checkbox") {
      return Array.isArray(answer) ? answer.length > 0 : false;
    }
    
    if (question.type === "file") {
      return !!answer;
    }
    
    return true;
  };

  const calculateCompletionPercentage = () => {
    let answeredQuestions = 0;
    
    for (let i = 0; i < cardConfig.questions.length; i++) {
      if (isQuestionAnswered(cardConfig.questions[i])) {
        answeredQuestions++;
      }
    }
    
    return Math.round((answeredQuestions / cardConfig.questions.length) * 100);
  };

  const canGoNext = () => {
    const currentQuestion = cardConfig.questions[currentStep];
    if (!currentQuestion.required) return true;
    
    // Special handling for attach-pil-to-ip card
    if (cardConfig.id === "attach-pil-to-ip" && currentQuestion.id === "license_terms_id") {
      const pilOption = formData["pil_option"];
      if (pilOption === "I want to create new PIL terms and attach") {
        return !!pilTerms; // Need PIL terms to be created
      } else if (pilOption === "I already have license terms created") {
        return isQuestionAnswered(currentQuestion); // Need license_terms_id
      }
      return false;
    }
    
    return isQuestionAnswered(currentQuestion);
  };

  const handleNext = () => {
    if (currentStep < cardConfig.questions.length - 1 && canGoNext()) {
      const nextStep = currentStep + 1;
      setCurrentStep(nextStep);
      setMaxReachedStep(Math.max(maxReachedStep, nextStep));
    }
  };

  const handlePrevious = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handleViewSummary = () => {
    setIsModalOpen(true);
  };

  const handleModalClose = () => {
    setIsModalOpen(false);
  };

  const handleModalConfirm = () => {
    setIsModalOpen(false);
    setIsCreateIPEnabled(true);
  };

  const handleModalEdit = () => {
    setIsModalOpen(false);
  };

  const handlePILModalOpen = () => {
    setIsPILModalOpen(true);
  };

  const handlePILModalClose = () => {
    setIsPILModalOpen(false);
  };

  const handleAttachPIL = (pilTermsData: any) => {
    setPilTerms(pilTermsData);
    setIsPILModalOpen(false);
  };

  // Handle "Register More" functionality - for cards that support batching
  const handleRegisterMore = () => {
    // Add current form data to batch (including PIL terms if attached for both cards)
    const formDataWithPIL = { ...formData };
    if (pilTerms && (cardConfig.id === "register-ip" || cardConfig.id === "mint-and-register-ip")) {
      formDataWithPIL.pilTerms = pilTerms;
    }
    
    setBatchFormData(prev => [...prev, formDataWithPIL]);
    
    // Reset form for new entry
    setFormData({});
    if (cardConfig.id === "register-ip" || cardConfig.id === "mint-and-register-ip") {
      setPilTerms(null); // Reset PIL terms for new entry
    }
    setCurrentStep(0);
    setMaxReachedStep(0);
    setIsModalOpen(false);
    setIsCreateIPEnabled(false);
  };

  const handleCreateIP = async () => {
    if (isCreateIPEnabled) {
      setIsLoading(true);
      
      try {
        // Add PIL terms to form data if attached for both cards
        const finalFormData = { ...formData };
        if (pilTerms && (cardConfig.id === "register-ip" || cardConfig.id === "mint-and-register-ip")) {
          finalFormData.pilTerms = pilTerms;
        }
        
        await handleSubmit(finalFormData);
        
        setTimeout(() => {
          setIsLoading(false);
          alert(`${cardConfig.title} completed successfully!`);
          onBack(); // Return to tabs view
        }, 6000);
      } catch (error) {
        setIsLoading(false);
        console.error("Error:", error);
        alert("An error occurred. Please try again.");
      }
    }
  };

  const renderFormField = (question: Question) => {
    const value = formData[question.id];

    switch (question.type) {
      case "radio":
        return (
          <div className="space-y-3">
            {question.options?.map((option, index) => (
              <label key={index} className="flex items-center space-x-3 cursor-pointer">
                <input
                  type="radio"
                  name={question.id}
                  value={option}
                  checked={value === option}
                  onChange={(e) => {
                    handleInputChange(question.id, e.target.value);
                    // Show PIL modal when "Yes" is selected for attach_pil in both register-ip and mint-and-register-ip cards
                    if (question.id === "attach_pil" && e.target.value === "Yes" && 
                        (cardConfig.id === "register-ip" || cardConfig.id === "mint-and-register-ip")) {
                      setTimeout(() => handlePILModalOpen(), 100);
                    }
                    // Also handle PIL modal for attach-pil-to-ip card
                    if (question.id === "pil_option" && e.target.value === "I want to create new PIL terms and attach" && 
                        cardConfig.id === "attach-pil-to-ip") {
                      setTimeout(() => handlePILModalOpen(), 100);
                    }
                  }}
                  className="w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 focus:ring-blue-500 dark:focus:ring-blue-600 dark:ring-offset-gray-800 focus:ring-2 dark:bg-gray-700 dark:border-gray-600"
                />
                <span className="text-sm text-neutral-700 dark:text-neutral-300">{option}</span>
              </label>
            ))}

      
            
            {/* Show PIL status with green success UI when PIL terms are created for attach-pil-to-ip card */}
            {cardConfig.id === "attach-pil-to-ip" && question.id === "pil_option" && value === "I want to create new PIL terms and attach" && pilTerms && (
              <div className="mt-4 p-3 bg-green-500/10 border border-green-500/30 rounded-lg">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <svg className="w-5 h-5 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                    <span className="text-green-400 text-sm font-medium">PIL Terms Created and Ready to Attach</span>
                  </div>
                  <button
                    onClick={handlePILModalOpen}
                    className="text-green-400 hover:text-green-300 text-sm underline"
                  >
                    Edit PIL Terms
                  </button>
                </div>
                <div className="mt-2 text-green-300 text-xs space-y-1">
                  <p>
                    Commercial Use: {pilTerms.commercialUse ? "Yes" : "No"} | 
                    Derivatives: {pilTerms.derivativesAllowed ? "Yes" : "No"} | 
                    Attribution: {pilTerms.commercialAttribution ? "Yes" : "No"}
                  </p>
                  <div className="flex flex-wrap gap-4">
                    {pilTerms.mintingFeeAmount && pilTerms.mintingFeeAmount !== "0" && (
                      <span>Minting Fee: {pilTerms.mintingFeeAmount}</span>
                    )}
                    {pilTerms.revenueSharePercentage && pilTerms.revenueSharePercentage !== "0" && (
                      <span>Revenue Share: {pilTerms.revenueSharePercentage}%</span>
                    )}
                    {pilTerms.commercialRevShare > 0 && !pilTerms.revenueSharePercentage && (
                      <span>Revenue Share: {pilTerms.commercialRevShare / 100}%</span>
                    )}
                  </div>
                </div>
              </div>
            )}
            
            {/* Show PIL status if PIL terms are attached for both register-ip and mint-and-register-ip cards */}
            {question.id === "attach_pil" && value === "Yes" && pilTerms && 
             (cardConfig.id === "register-ip" || cardConfig.id === "mint-and-register-ip") && (
              <div className="mt-4 p-3 bg-green-500/10 border border-green-500/30 rounded-lg">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <svg className="w-5 h-5 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                    <span className="text-green-400 text-sm font-medium">PIL Terms Attached Successfully</span>
                  </div>
                  <button
                    onClick={handlePILModalOpen}
                    className="text-green-400 hover:text-green-300 text-sm underline"
                  >
                    Edit PIL Terms
                  </button>
                </div>
                <div className="mt-2 text-green-300 text-xs space-y-1">
                  <p>
                    Commercial Use: {pilTerms.commercialUse ? "Yes" : "No"} | 
                    Derivatives: {pilTerms.derivativesAllowed ? "Yes" : "No"} | 
                    Attribution: {pilTerms.commercialAttribution ? "Yes" : "No"}
                  </p>
                  <div className="flex flex-wrap gap-4">
                    {pilTerms.mintingFeeAmount && pilTerms.mintingFeeAmount !== "0" && (
                      <span>Minting Fee: {pilTerms.mintingFeeAmount}</span>
                    )}
                    {pilTerms.revenueSharePercentage && pilTerms.revenueSharePercentage !== "0" && (
                      <span>Revenue Share: {pilTerms.revenueSharePercentage}%</span>
                    )}
                    {pilTerms.commercialRevShare > 0 && !pilTerms.revenueSharePercentage && (
                      <span>Revenue Share: {pilTerms.commercialRevShare / 100}%</span>
                    )}
                  </div>
                </div>
              </div>
            )}
          </div>
        );

      case "checkbox":
        return (
          <div className="space-y-3">
            {question.options?.map((option, index) => (
              <label key={index} className="flex items-center space-x-3 cursor-pointer">
                <input
                  type="checkbox"
                  value={option}
                  checked={Array.isArray(value) ? value.includes(option) : false}
                  onChange={(e) => {
                    const currentValues = Array.isArray(value) ? value : [];
                    if (e.target.checked) {
                      handleInputChange(question.id, [...currentValues, option]);
                    } else {
                      handleInputChange(question.id, currentValues.filter(v => v !== option));
                    }
                  }}
                  className="w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 rounded focus:ring-blue-500 dark:focus:ring-blue-600 dark:ring-offset-gray-800 focus:ring-2 dark:bg-gray-700 dark:border-gray-600"
                />
                <span className="text-sm text-neutral-700 dark:text-neutral-300">{option}</span>
              </label>
            ))}
          </div>
        );

      case "text":
                  // Special conditional rendering for license_terms_id
        if (question.id === "license_terms_id" && cardConfig.id === "attach-pil-to-ip") {
          const pilOption = formData["pil_option"];
          if (pilOption !== "I already have license terms created") {
            return null; // Don't show this field if user wants to create new PIL terms
          }
        }

        return (
          <div>
            <input
              type="text"
              value={value || ""}
              onChange={(e) => handleInputChange(question.id, e.target.value)}
              className="w-full px-3 py-2 border border-zinc-300 dark:border-zinc-600 bg-transparent rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:text-white text-gray-900 placeholder-gray-500 dark:placeholder-gray-400"
              placeholder="Enter your answer..."
            />

            {/* Batch indication if applicable */}
            {batchFormData.length > 0 && ["register-ip", "register-derivative-ip", "mint-and-register-derivative-ip"].includes(cardConfig.id) && currentStep === 0 && (
              <div className="mt-4 p-3 relative overflow-hidden rounded-xl">
                <div className="absolute inset-0 bg-gradient-to-r from-pink-500/10 via-rose-500/15 to-pink-500/10 blur-sm"></div>
                <div className="absolute inset-0 border border-pink-400/30 dark:border-pink-300/40 rounded-xl shadow-[0_0_20px_rgba(236,72,153,0.3)] dark:shadow-[0_0_25px_rgba(244,114,182,0.4)]"></div>
                
                {/* Content */}
                <div className="relative z-10 flex items-center space-x-3">
                  <div className="w-8 h-8 bg-pink-300/30 dark:bg-pink-400/40 backdrop-blur-sm border border-pink-400/50 dark:border-pink-300/60 rounded-full flex items-center justify-center flex-shrink-0 shadow-[0_0_15px_rgba(236,72,153,0.4)]">
                    <svg className="w-4 h-4 text-pink-600 dark:text-pink-200" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                  </div>
                  <p className="text-sm font-medium text-pink-700 dark:text-pink-200 drop-shadow-sm">
                    You have <span className="font-bold text-pink-800 dark:text-pink-100">{batchFormData.length}</span> previous {cardConfig.id.includes('derivative') ? 'derivative' : 'registration'}{batchFormData.length > 1 ? 's' : ''} saved. 
                    This will be {cardConfig.id.includes('derivative') ? 'derivative' : 'registration'} <span className="font-bold text-pink-800 dark:text-pink-100">#{batchFormData.length + 1}</span>.
                  </p>
                </div>
                
                {/* Additional subtle glow effects */}
                <div className="absolute top-0 left-0 w-full h-px bg-gradient-to-r from-transparent via-pink-400/60 to-transparent"></div>
                <div className="absolute bottom-0 left-0 w-full h-px bg-gradient-to-r from-transparent via-pink-400/60 to-transparent"></div>
              </div>
            )}
          </div>
        );

      case "textarea":
        return (
          <textarea
            value={value || ""}
            onChange={(e) => handleInputChange(question.id, e.target.value)}
            rows={4}
            className="w-full px-3 py-2 border border-zinc-300 dark:border-zinc-600 bg-transparent rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:text-white text-gray-900 placeholder-gray-500 dark:placeholder-gray-400"
            placeholder="Enter your detailed answer..."
          />
        );

      case "file":
        return (
          <input
            type="file"
            onChange={(e) => handleInputChange(question.id, e.target.files?.[0])}
            className="w-full px-3 py-2 border border-zinc-300 dark:border-zinc-600 bg-transparent rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:text-white text-gray-900"
          />
        );

      default:
        return null;
    }
  };

  const getNextButtonText = () => {
    if (currentStep === cardConfig.questions.length - 1) {
      return "Submit";
    }
    
    return "Next";
  };

  const isLastStep = currentStep === cardConfig.questions.length - 1;

  // Create timeline data AFTER all functions are defined
  const data = cardConfig.questions.map((question, index) => ({
    title: `Step ${index + 1}`,
    content: (
      <div className="space-y-6">
        <div>
          <h3 className="text-lg font-semibold text-neutral-800 dark:text-neutral-200 mb-4">
            {question.question}
            {question.required && <span className="text-red-500 ml-1">*</span>}
          </h3>
          {renderFormField(question)}
        </div>
        
        <div className="flex items-center justify-between pt-6">
          <div className="flex items-center space-x-3">
            <button
              onClick={handlePrevious}
              disabled={currentStep === 0}
              className="px-6 py-2 bg-zinc-800 text-white rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-zinc-700 transition-colors"
            >
              Previous
            </button>
          </div>
          
          {!isLastStep ? (
            <button
              onClick={handleNext}
              disabled={!canGoNext()}
              className="px-6 py-2 bg-blue-500 text-white rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-blue-600 transition-colors"
            >
              {getNextButtonText()}
            </button>
          ) : (
            <div className="flex space-x-3">
              <button
                onClick={handleViewSummary}
                className="px-6 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded-lg transition-colors duration-200 shadow-md hover:shadow-lg"
              >
                View Summary
              </button>
              
              <div className="relative">
                <button
                  onClick={handleCreateIP}
                  disabled={!isCreateIPEnabled}
                  className={`
                    group w-40 py-2 px-6 text-white font-medium rounded-lg relative overflow-hidden
                    transition-all duration-300
                    bg-gradient-to-r from-zinc-900 to-zinc-900 hover:from-zinc-900 hover:to-zinc-900
                    disabled:opacity-50 disabled:cursor-not-allowed
                    before:absolute before:inset-0 before:bg-gradient-to-r before:from-transparent before:via-blue-500/10 before:to-transparent
                    before:translate-x-[-200%] ${isCreateIPEnabled ? 'before:animate-none hover:before:animate-[shimmer_1.5s_ease-in-out]' : ''}
                    after:absolute after:inset-0 after:bg-gradient-to-r after:from-transparent after:via-pink-500/10 after:to-transparent
                    after:translate-x-[-200%] ${isCreateIPEnabled ? 'after:animate-none hover:after:animate-[shimmer_1.5s_ease-in-out_0.2s]' : ''}
                  `}
                  onMouseEnter={() => !isCreateIPEnabled && setShowTooltip(true)}
                  onMouseLeave={() => setShowTooltip(false)}
                >
                  <div className="absolute top-0 left-0 w-full h-px bg-gradient-to-r from-transparent via-pink-500/50 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                  <div className="absolute bottom-0 left-0 w-full h-px bg-gradient-to-r from-transparent via-blue-500/50 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                  
                  <span className="relative z-10 flex items-center justify-center gap-2">
                    <span className="transition-transform duration-500">
                      <div className="flex items-center space-x-2">
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                        </svg>
                          <span className="font-light">Proceed</span> 
                      </div>
                    </span>
                  </span>
                </button>
                
                {showTooltip && !isCreateIPEnabled && (
                  <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-3 py-2 bg-gray-800 text-white text-sm rounded-lg shadow-lg whitespace-nowrap z-50">
                    Check form summary first
                    <div className="absolute top-full left-1/2 transform -translate-x-1/2 border-4 border-transparent border-t-gray-800"></div>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    ),
  }));

  return (
    <div className="relative w-full overflow-hidden">
      <Timeline 
        data={data} 
        currentStep={currentStep} 
        completionPercentage={calculateCompletionPercentage()}
        title={cardConfig.title}
      />
      
      <SummaryModal
      isOpen={isModalOpen}
      onClose={handleModalClose}
      onConfirm={handleModalConfirm}
      onEdit={handleModalEdit}
      formData={formData}
      questions={cardConfig.questions}
      batchFormData={(cardConfig.id === "register-ip" || cardConfig.id === "register-derivative-ip" || cardConfig.id === "mint-and-register-derivative-ip" || cardConfig.id === "mint-and-register-ip") ? batchFormData : undefined}
      onRegisterMore={(cardConfig.id === "register-ip" || cardConfig.id === "register-derivative-ip" || cardConfig.id === "mint-and-register-derivative-ip" || cardConfig.id === "mint-and-register-ip") ? handleRegisterMore : undefined}
      pilTerms={pilTerms}
      onPilTermsUpdate={setPilTerms} // Add this to sync PIL terms back
    />
      
      {/* PIL Modal - for cards that support PIL */}
      {(cardConfig.id === "register-ip" || cardConfig.id === "mint-and-register-ip" || cardConfig.id === "attach-pil-to-ip") && (
        <PILModal
          isOpen={isPILModalOpen}
          onClose={handlePILModalClose}
          onAttachPIL={handleAttachPIL}
        />
      )}
      
      {isLoading && (
        <div className="absolute inset-0 flex items-center justify-center bg-black bg-opacity-50 z-50">
          <MultiStepLoader loadingStates={loadingStates} loading={true} />
        </div>
      )}
    </div>
  );
}