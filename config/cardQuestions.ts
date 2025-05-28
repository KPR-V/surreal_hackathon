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
  submitFunction: string; // Function identifier for backend
}

export const cardConfigurations: Record<string, CardConfig> = {
  "register-ip": {
    id: "register-ip",
    title: "Register/Batch Register IP",
    description: "I have an NFT and just need to register it as intellectual property.",
    submitFunction: "register",
    questions: [
      {
        id: "nft_contract",
        type: "text",
        question: "Enter the NFT Contract Address",
        required: true,
      },
      {
        id: "token_id",
        type: "text",
        question: "Enter the Token ID",
        required: true,
      },
      {
        id: "ip_title",
        type: "text",
        question: "IP Asset Title",
        required: true,
      },
      {
        id: "ip_description",
        type: "textarea",
        question: "IP Asset Description",
        required: true,
      },
      {
        id: "external_url",
        type: "text",
        question: "External URL (optional)",
        required: false,
      },
      {
        id: "image_url",
        type: "text",
        question: "Image URL (optional)",
        required: false,
      },
      {
        id: "attach_pil",
        type: "radio",
        question: "Do you want to attach PIL terms as well?",
        options: ["Yes", "No"],
        required: true,
      },
    ],
  },
  "mint-and-register-ip": {
    id: "mint-and-register-ip",
    title: "Mint and Register IP",
    description: "I have content that needs to be minted as an NFT and registered as IP in a single transaction.",
    submitFunction: "mintAndRegisterIP",
    questions: [
      {
        id: "spg_nft_contract",
        type: "text",
        question: "SPG NFT Contract Address (optional - uses default if empty)",
        required: false,
      },
      {
        id: "ip_title",
        type: "text",
        question: "IP Asset Title",
        required: true,
      },
      {
        id: "ip_description",
        type: "textarea",
        question: "IP Asset Description",
        required: true,
      },
      {
        id: "ip_external_url",
        type: "text",
        question: "IP Asset External URL (optional)",
        required: false,
      },
      {
        id: "ip_image",
        type: "text",
        question: "IP Asset Image URL (optional)",
        required: false,
      },
      {
        id: "nft_name",
        type: "text",
        question: "NFT Name",
        required: true,
      },
      {
        id: "nft_description",
        type: "textarea",
        question: "NFT Description",
        required: true,
      },
      {
        id: "nft_external_url",
        type: "text",
        question: "NFT External URL (optional)",
        required: false,
      },
      {
        id: "nft_image",
        type: "text",
        question: "NFT Image URL (optional)",
        required: false,
      },
      {
        id: "metadata_type",
        type: "radio",
        question: "What metadata do you want to include?",
        options: ["Both IP and NFT metadata", "Only IP metadata", "Only NFT metadata", "No metadata"],
        required: true,
      },
      {
        id: "attach_pil",
        type: "radio",
        question: "Do you want to attach PIL terms as well?",
        options: ["Yes", "No"],
        required: true,
      },
    ],
  },
  "register-derivative-ip": {
    id: "register-derivative-ip",
    title: "Register Derivative IP",
    description: "Register an NFT as IP and link it as a derivative of another IP Asset without using license tokens.",
    submitFunction: "registerDerivativeIP",
    questions: [
      {
        id: "nft_contract",
        type: "text",
        question: "Enter the NFT Contract Address",
        required: true,
      },
      {
        id: "token_id",
        type: "text",
        question: "Enter the Token ID",
        required: true,
      },
      {
        id: "ip_title",
        type: "text",
        question: "Derivative IP Asset Title",
        required: true,
      },
      {
        id: "ip_description",
        type: "textarea",
        question: "Derivative IP Asset Description",
        required: true,
      },
      {
        id: "ip_external_url",
        type: "text",
        question: "IP Asset External URL (optional)",
        required: false,
      },
      {
        id: "ip_image",
        type: "text",
        question: "IP Asset Image URL (optional)",
        required: false,
      },
      {
        id: "nft_name",
        type: "text",
        question: "NFT Name (optional)",
        required: false,
      },
      {
        id: "nft_description",
        type: "textarea",
        question: "NFT Description (optional)",
        required: false,
      },
      {
        id: "nft_external_url",
        type: "text",
        question: "NFT External URL (optional)",
        required: false,
      },
      {
        id: "nft_image",
        type: "text",
        question: "NFT Image URL (optional)",
        required: false,
      },
      {
        id: "parent_ip_ids",
        type: "textarea",
        question: "Parent IP IDs (comma-separated list of parent IP asset IDs)",
        required: true,
      },
      {
        id: "license_terms_ids",
        type: "textarea",
        question: "License Terms IDs (comma-separated list corresponding to each parent IP)",
        required: true,
      },
      {
        id: "metadata_type",
        type: "radio",
        question: "What metadata do you want to include?",
        options: ["Both IP and NFT metadata", "Only IP metadata", "Only NFT metadata", "No metadata"],
        required: true,
      },
    ],
  },
  "mint-and-register-derivative-ip": {
    id: "mint-and-register-derivative-ip",
    title: "Mint and Register Derivative IP",
    description: "Mint new derivative content as an NFT and register it as a derivative IP in a single transaction.",
    submitFunction: "mintAndRegisterDerivativeIP",
    questions: [
      {
        id: "spg_nft_contract",
        type: "text",
        question: "SPG NFT Contract Address (optional - uses default if empty)",
        required: false,
      },
      {
        id: "ip_title",
        type: "text",
        question: "Derivative IP Asset Title",
        required: true,
      },
      {
        id: "ip_description",
        type: "textarea",
        question: "Derivative IP Asset Description",
        required: true,
      },
      {
        id: "ip_external_url",
        type: "text",
        question: "IP Asset External URL (optional)",
        required: false,
      },
      {
        id: "ip_image",
        type: "text",
        question: "IP Asset Image URL (optional)",
        required: false,
      },
      {
        id: "nft_name",
        type: "text",
        question: "NFT Name",
        required: true,
      },
      {
        id: "nft_description",
        type: "textarea",
        question: "NFT Description",
        required: true,
      },
      {
        id: "nft_external_url",
        type: "text",
        question: "NFT External URL (optional)",
        required: false,
      },
      {
        id: "nft_image",
        type: "text",
        question: "NFT Image URL (optional)",
        required: false,
      },
      {
        id: "parent_ip_ids",
        type: "textarea",
        question: "Parent IP IDs (comma-separated list of parent IP asset IDs)",
        required: true,
      },
      {
        id: "license_terms_ids",
        type: "textarea",
        question: "License Terms IDs (comma-separated list corresponding to each parent IP)",
        required: true,
      },
      {
        id: "metadata_type",
        type: "radio",
        question: "What metadata do you want to include?",
        options: ["Both IP and NFT metadata", "Only IP metadata", "Only NFT metadata", "No metadata"],
        required: true,
      },
    ],
  },
  "mint-nft": {
    id: "mint-nft",
    title: "Mint IP as NFT",
    description: "Convert your registered intellectual property into tradeable NFTs with embedded licensing terms and royalty mechanisms.",
    submitFunction: "mintNFT",
    questions: [
      {
        id: "ip_title",
        type: "text",
        question: "NFT Title",
        required: true,
      },
      {
        id: "ip_description",
        type: "textarea",
        question: "NFT Description",
        required: true,
      },
      {
        id: "image_file",
        type: "file",
        question: "Upload NFT Image",
        required: true,
      },
      {
        id: "royalty_percentage",
        type: "text",
        question: "Royalty Percentage (0-100)",
        required: true,
      },
      {
        id: "mint_price",
        type: "text",
        question: "Mint Price (in ETH)",
        required: true,
      },
    ],
  },
  "create-pil": {
    id: "create-pil",
    title: "Create PIL License",
    description: "Design and deploy Programmable IP Licenses with automated enforcement, royalty distribution, and usage tracking.",
    submitFunction: "createPIL",
    questions: [
      {
        id: "license_name",
        type: "text",
        question: "License Name",
        required: true,
      },
      {
        id: "commercial_use",
        type: "radio",
        question: "Allow Commercial Use?",
        options: ["Yes", "No"],
        required: true,
      },
      {
        id: "attribution_required",
        type: "radio",
        question: "Require Attribution?",
        options: ["Yes", "No"],
        required: true,
      },
      {
        id: "derivatives_allowed",
        type: "radio",
        question: "Allow Derivative Works?",
        options: ["Yes", "No"],
        required: true,
      },
      {
        id: "royalty_rate",
        type: "text",
        question: "Royalty Rate (%)",
        required: true,
      },
      {
        id: "currency",
        type: "radio",
        question: "Currency for Payments",
        options: ["ETH", "USDC", "Custom Token"],
        required: true,
      },
    ],
  },
  "register-derivative": {
    id: "register-derivative",
    title: "Link as Derivative",
    description: "Establish parent-child relationship between existing IP assets without using license tokens.",
    submitFunction: "registerDerivative",
    questions: [
      {
        id: "child_ip_id",
        type: "text",
        question: "Child IP Asset ID (The IP that will become a derivative)",
        required: true,
      },
      {
        id: "parent_ip_ids",
        type: "textarea",
        question: "Parent IP IDs (comma-separated list of parent IP asset IDs)",
        required: true,
      },
      {
        id: "license_terms_ids",
        type: "textarea",
        question: "License Terms IDs (comma-separated list corresponding to each parent IP)",
        required: true,
      },
    ],
  },
  "mint-and-register-derivative-with-license-tokens": {
    id: "mint-and-register-derivative-with-license-tokens",
    title: "Mint and Register Derivative with License Tokens",
    description: "Create a derivative IP by minting new content and using license tokens from parent IPs.",
    submitFunction: "mintAndRegisterDerivativeWithLicenseTokens",
    questions: [
      {
        id: "spg_nft_contract",
        type: "text",
        question: "SPG NFT Contract Address",
        required: true,
      },
      {
        id: "license_token_ids",
        type: "textarea",
        question: "License Token IDs (comma-separated list of license token IDs to be burned)",
        required: true,
      },
      {
        id: "max_rts",
        type: "text",
        question: "Maximum Royalty Tokens (0-100,000,000)",
        required: true,
      },
      {
        id: "ip_title",
        type: "text",
        question: "Derivative IP Asset Title",
        required: true,
      },
      {
        id: "ip_description",
        type: "textarea",
        question: "Derivative IP Asset Description",
        required: true,
      },
      {
        id: "ip_external_url",
        type: "text",
        question: "IP Asset External URL (optional)",
        required: false,
      },
      {
        id: "ip_image",
        type: "text",
        question: "IP Asset Image URL (optional)",
        required: false,
      },
      {
        id: "nft_name",
        type: "text",
        question: "NFT Name",
        required: true,
      },
      {
        id: "nft_description",
        type: "textarea",
        question: "NFT Description",
        required: true,
      },
      {
        id: "nft_external_url",
        type: "text",
        question: "NFT External URL (optional)",
        required: false,
      },
      {
        id: "nft_image",
        type: "text",
        question: "NFT Image URL (optional)",
        required: false,
      },
      {
        id: "metadata_type",
        type: "radio",
        question: "What metadata do you want to include?",
        options: ["Both IP and NFT metadata", "Only IP metadata", "Only NFT metadata", "No metadata"],
        required: true,
      },
    ],
  },
  "register-ip-and-make-derivative-with-license-tokens": {
    id: "register-ip-and-make-derivative-with-license-tokens",
    title: "Register IP and Make Derivative with License Tokens",
    description: "Register an existing NFT as IP and then make it a derivative using license tokens from parent IPs.",
    submitFunction: "registerIPAndMakeDerivativeWithLicenseTokens",
    questions: [
      {
        id: "nft_contract",
        type: "text",
        question: "Enter the NFT Contract Address",
        required: true,
      },
      {
        id: "token_id",
        type: "text",
        question: "Enter the Token ID",
        required: true,
      },
      {
        id: "license_token_ids",
        type: "textarea",
        question: "License Token IDs (comma-separated list of license token IDs to be burned)",
        required: true,
      },
      {
        id: "max_rts",
        type: "text",
        question: "Maximum Royalty Tokens (0-100,000,000)",
        required: true,
      },
      {
        id: "ip_title",
        type: "text",
        question: "IP Asset Title",
        required: true,
      },
      {
        id: "ip_description",
        type: "textarea",
        question: "IP Asset Description",
        required: true,
      },
      {
        id: "ip_external_url",
        type: "text",
        question: "IP Asset External URL (optional)",
        required: false,
      },
      {
        id: "ip_image",
        type: "text",
        question: "IP Asset Image URL (optional)",
        required: false,
      },
      {
        id: "nft_name",
        type: "text",
        question: "NFT Name (optional)",
        required: false,
      },
      {
        id: "nft_description",
        type: "textarea",
        question: "NFT Description (optional)",
        required: false,
      },
      {
        id: "nft_external_url",
        type: "text",
        question: "NFT External URL (optional)",
        required: false,
      },
      {
        id: "nft_image",
        type: "text",
        question: "NFT Image URL (optional)",
        required: false,
      },
      {
        id: "metadata_type",
        type: "radio",
        question: "What metadata do you want to include?",
        options: ["Both IP and NFT metadata", "Only IP metadata", "Only NFT metadata", "No metadata"],
        required: true,
      },
    ],
  },
  "register-derivative-with-license-tokens": {
    id: "register-derivative-with-license-tokens",
    title: "Register Derivative with License Tokens",
    description: "Register an existing IP as a derivative of parent IPs using license tokens.",
    submitFunction: "registerDerivativeWithLicenseTokens",
    questions: [
      {
        id: "child_ip_id",
        type: "text",
        question: "Child IP Asset ID (The IP that will become a derivative)",
        required: true,
      },
      {
        id: "license_token_ids",
        type: "textarea",
        question: "License Token IDs (comma-separated list of license token IDs to be burned)",
        required: true,
      },
      {
        id: "max_rts",
        type: "text",
        question: "Maximum Royalty Tokens (0-100,000,000)",
        required: true,
      },
    ],
  },
  "attach-pil-to-ip": {
    id: "attach-pil-to-ip",
    title: "Attach PIL Terms to Existing IP",
    description: "Attach existing PIL license terms or create new PIL terms for an already registered IP asset.",
    submitFunction: "attachPILToIP",
    questions: [
      {
        id: "ip_id",
        type: "text",
        question: "Enter the IP Asset ID",
        required: true,
      },
      {
        id: "pil_option",
        type: "radio",
        question: "How would you like to handle PIL terms?",
        options: ["I already have license terms created", "I want to create new PIL terms and attach"],
        required: true,
      },
      {
        id: "license_terms_id",
        type: "text",
        question: "Enter the License Terms ID",
        required: true, // Only required if pil_option is "I already have license terms created"
      },
    ],
  },
};