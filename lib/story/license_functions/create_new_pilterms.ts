
import { zeroAddress } from "viem";
import { LicenseTerms, StoryClient, WIP_TOKEN_ADDRESS } from "@story-protocol/core-sdk";
const Merc20_TOKEN_ADDRESS="0xF2104833d386a2734a4eB3B8ad6FC6812F29E38E"
import {uploadJSONToIPFS} from "../main_functions/uploadtoipfs"



const offchainterms = (territory?:string[],channelsOfDistribution?:string[],attribution?:boolean,contentStandards?:string[],sublicensable?:boolean,aiLearningModels?:boolean,restrictionOnCrossPlatformUse?:boolean,governingLaw?:string,additionalParameters?:object)=>{
  return {
  "territory":territory ? territory : [],
  "channelsOfDistribution":channelsOfDistribution ? channelsOfDistribution : [],
  "attribution":attribution ? attribution : false,
  "contentStandards":contentStandards ? contentStandards : [],
  "sublicensable":sublicensable ? sublicensable : false,
  "aiLearningModels":aiLearningModels ? aiLearningModels : false,
  "restrictionOnCrossPlatformUse":restrictionOnCrossPlatformUse ? restrictionOnCrossPlatformUse : false,
  "governingLaw":governingLaw ? governingLaw : "California, USA",
  "additionalParameters":additionalParameters ? additionalParameters : {},
  "PILUri":"https://github.com/piplabs/pil-document/blob/v1.3.0/Story%20Foundation%20-%20Programmable%20IP%20License%20(1.31.25).pdf"
} ;

}





export const createnewpilterms = async (transferable: boolean,client: StoryClient, commercialUse: boolean, commercialAttribution: boolean, commercialRevShare: number, derivativesAllowed: boolean, derivativesAttribution: boolean, derivativesApproval: boolean, derivativesReciprocal: boolean , royaltyPolicy?: string , defaultMintingFee?: bigint,expiration?: bigint,commercialRevCeiling?: bigint,derivativeRevCeiling?: bigint, usewip?: boolean ,territory?:string[],channelsOfDistribution?:string[],attribution?:boolean,contentStandards?:string[],sublicensable?:boolean,aiLearningModels?:boolean,restrictionOnCrossPlatformUse?:boolean,governingLaw?:string,additionalParameters?:object,) => {  
  try {
  const licenseTerms: LicenseTerms = {
    transferable: transferable,
    royaltyPolicy: royaltyPolicy ? royaltyPolicy.startsWith("0x") ? royaltyPolicy as `0x${string}` : `0x${royaltyPolicy}` as `0x${string}` : "0xBe54FB168b3c982b7AaE60dB6CF75Bd8447b390E" as `0x${string}`  , 
    defaultMintingFee: defaultMintingFee ? defaultMintingFee : 0n,
    expiration: expiration ? expiration : 0n,
    commercialUse: commercialUse,
    commercialAttribution: commercialAttribution,
    commercializerChecker: zeroAddress,
    commercializerCheckerData: "0x",
    commercialRevShare: commercialRevShare, 
    commercialRevCeiling: commercialRevCeiling ? commercialRevCeiling : 0n,
    derivativesAllowed: derivativesAllowed,
    derivativesAttribution: derivativesAttribution,
    derivativesApproval: derivativesApproval,
    derivativesReciprocal: derivativesReciprocal,
    derivativeRevCeiling: derivativeRevCeiling ? derivativeRevCeiling : 0n,
    currency: (usewip ? WIP_TOKEN_ADDRESS :Merc20_TOKEN_ADDRESS) || WIP_TOKEN_ADDRESS, 
    uri: "https://ipfs.io/ipfs/"+await uploadJSONToIPFS(offchainterms(territory,channelsOfDistribution,attribution,contentStandards,sublicensable,aiLearningModels,restrictionOnCrossPlatformUse,governingLaw,additionalParameters)),
  };
  
    const response = await client.license.registerPILTerms({
      ...licenseTerms,
      txOptions: { waitForTransaction: true },
    });
  
    return `PIL Terms registered at transaction hash ${response.txHash}, License Terms ID: ${response.licenseTermsId}`;
  } catch (error) {
    console.error("PIL Terms registration failed:", error instanceof Error ? error.message : String(error));
  }
}
  



