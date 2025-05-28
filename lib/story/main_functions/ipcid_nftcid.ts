import { IpMetadata } from "@story-protocol/core-sdk";
import { uploadJSONToIPFS } from "./uploadtoipfs";
import { createHash } from "crypto";


const ipcid_nftcid = async (ipMetadata?: IpMetadata, nftMetadata?: IpMetadata) => {
  let ipcid, ipHash, nftcid, nftHash;
  if (ipMetadata) {
    ipcid = await uploadJSONToIPFS(ipMetadata);
    ipHash = createHash("sha256")
      .update(JSON.stringify(ipMetadata))
  .digest("hex");
  }
  if (nftMetadata) {
    nftcid = await uploadJSONToIPFS(nftMetadata);
    nftHash = createHash("sha256")
      .update(JSON.stringify(nftMetadata))
  .digest("hex");
  }
  return { ipcid, ipHash, nftcid, nftHash };
};

export default ipcid_nftcid;

