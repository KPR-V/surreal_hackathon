import { PinataSDK } from "pinata";
import dotenv from "dotenv";

dotenv.config();

const pinata = new PinataSDK({
  pinataJwt: process.env.PINATA_JWT,
  pinataGateway: "bronze-genetic-salamander-893.mypinata.cloud",
});

export async function uploadFilesToPinata(files: File[]) {
  try {
    if (!Array.isArray(files) || files.length === 0) {
      throw new Error("No files provided for upload.");
    }
    const urlRequest = await fetch("/api/url"); 
    const urlResponse = await urlRequest.json(); 
    if (files.length === 1) {
      const uploadRequest = pinata.upload.public.file(files[0]).url(urlResponse.url);
      const response = await uploadRequest;
      console.log("Upload successful:", response);
      return response;
    }
    const uploadRequest = pinata.upload.public.fileArray(files).url(urlResponse.url);
    const response = await uploadRequest;

    console.log("Upload successful:", response);
    return response;
  } catch (error) {
    console.error("Error uploading files to Pinata:", error);
    throw error;
  }
}
