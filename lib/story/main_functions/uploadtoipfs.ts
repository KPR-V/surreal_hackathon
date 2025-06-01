import { PinataSDK } from "pinata";
import dotenv from "dotenv";

dotenv.config();

export const pinata = new PinataSDK({
  pinataJwt: process.env.PINATA_JWT,
  pinataGateway: "bronze-genetic-salamander-893.mypinata.cloud",
});

export async function uploadJSONToIPFS(jsonMetadata: any): Promise<string> {
  try {
    const urlRequest = await fetch("/api/url"); 
    const urlResponse = await urlRequest.json(); 
      const { cid } = await pinata.upload.public.json(jsonMetadata).url(urlResponse.url);
    return cid;
  } catch (error) {
    console.error("Upload to IPFS failed:", error);
    return "Upload to IPFS failed";
  }
}