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
    if (files.length === 1) {
      const uploadRequest = pinata.upload.public.file(files[0]);
      const response = await uploadRequest;
      console.log("Upload successful:", response);
      return response;
    }
    const uploadRequest = pinata.upload.public.fileArray(files);
    const response = await uploadRequest;

    console.log("Upload successful:", response);
    return response;
  } catch (error) {
    console.error("Error uploading files to Pinata:", error);
    throw error;
  }
}
