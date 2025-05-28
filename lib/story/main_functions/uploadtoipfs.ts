import { PinataSDK } from "pinata";
import dotenv from "dotenv";

dotenv.config();

const pinata = new PinataSDK({
  pinataJwt: process.env.PINATA_JWT,
  pinataGateway: "bronze-genetic-salamander-893.mypinata.cloud",
});

export async function uploadJSONToIPFS(jsonMetadata: any): Promise<string> {
  try {
    const { cid } = await pinata.upload.public.json(jsonMetadata);
    return cid;
  } catch (error) {
    console.error("Upload to IPFS failed:", error);
    return "Upload to IPFS failed";
  }
}