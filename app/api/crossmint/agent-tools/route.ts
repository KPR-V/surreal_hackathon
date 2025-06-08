import { openai } from "@ai-sdk/openai";
import { generateText } from "ai";
import { createWalletClient, http } from "viem";
import { privateKeyToAccount } from "viem/accounts";
import { storyAeneid } from "viem/chains"; 
import * as dotenv from "dotenv";
import { NextRequest, NextResponse } from "next/server";
import { getOnChainTools } from "@goat-sdk/adapter-vercel-ai";
import { viem } from "@goat-sdk/wallet-viem";
import { Tool } from "ai";
import { sendETH } from "@goat-sdk/wallet-evm";
import { erc20, Token} from "@goat-sdk/plugin-erc20";
import { tavilyPlugin } from "../../../../lib/goat-plugins/tavily-plugin/src/index";
import { storyKitTool } from "../../../../lib/storykit-tool";
dotenv.config();

const WIP_TOKEN: Token = {
  name: "WIP",
  symbol: "WIP",
  decimals: 18,
  chains: {
    [storyAeneid.id]: { 
      contractAddress: "0x1514000000000000000000000000000000000000" 
    }
  },
};
const IP_TOKEN: Token = {
  name: "ip",
  symbol: "ip",
  decimals: 18,
  chains: {
    [storyAeneid.id]: { 
      contractAddress: "0x1514000000000000000000000000000000000000" 
    }
  },
};
const MERC20_TOKEN: Token = {
  name: "MERC20",
  symbol: "MERC20",
  decimals: 18,
  chains: {
    [storyAeneid.id]: { 
      contractAddress: "0xF2104833d386a2734a4eB3B8ad6FC6812F29E38E" 
    }
  },
};
async function deriveAESKey(password: string, salt = "static-salt") {
  const pwUtf8 = new TextEncoder().encode(password);
  const baseKey = await crypto.subtle.importKey(
    "raw",
    pwUtf8,
    "PBKDF2",
    false,
    ["deriveKey"]
  );
  return crypto.subtle.deriveKey(
    {
      name: "PBKDF2",
      salt: new TextEncoder().encode(salt),
      iterations: 100_000,
      hash: "SHA-256",
    },
    baseKey,
    { name: "AES-GCM", length: 256 },
    false,
    ["encrypt", "decrypt"]
  );
}

// In-memory cache for decrypted keys (with TTL)
const keyCache = new Map<string, { key: string, expiry: number }>();
const CACHE_TTL = 50 * 60 * 1000; // 50 minutes

export async function POST(req: NextRequest) {
  try {
    const { 
      password,
      messages, 
      smartWallet, 
      userAddress, 
      encryptedRecord
    } = await req.json();

    if (!password || !userAddress || !encryptedRecord) {
      return NextResponse.json(
        { error: "Missing required authentication parameters or encrypted record" }, 
        { status: 400 }
      );
    }
    
    let agentPrivateKey = null;
    const cacheKey = `${userAddress}`;
    
    // 1. Check cache first
    const cached = keyCache.get(cacheKey);
    if (cached && cached.expiry > Date.now()) {
      agentPrivateKey = cached.key;
    } else {
      // 2. If not in cache, decrypt using the provided record
      try {
        const { encryptedHex, ivHex } = encryptedRecord;
        const aesKey = await deriveAESKey(password);
        const iv = new Uint8Array(ivHex.match(/.{1,2}/g)!.map((h: any) => parseInt(h, 16)));
        const data = new Uint8Array(encryptedHex.match(/.{1,2}/g)!.map((h: any) => parseInt(h, 16)));
        
        const ptBuf = await crypto.subtle.decrypt(
          { name: "AES-GCM", iv },
          aesKey,
          data
        );
        
        agentPrivateKey = new TextDecoder().decode(ptBuf);

        // 3. Store the newly decrypted key in the cache
        keyCache.set(cacheKey, {
          key: agentPrivateKey,
          expiry: Date.now() + CACHE_TTL
        });

      } catch (error) {
        console.error("Decryption failed on server:", error);
        return NextResponse.json(
          { error: "Failed to decrypt agent key. The password may be incorrect." }, 
          { status: 401 }
        );
      }
    }

    // 4. Proceed with the rest of the logic
    const account = privateKeyToAccount(agentPrivateKey as `0x${string}`);
    const walletClient = createWalletClient({
      account,
      chain: storyAeneid,
      transport: http(process.env.RPC_PROVIDER_URL), 
    });
  
    const tools = await getOnChainTools({
      wallet: viem(walletClient),
      plugins: [
        sendETH(),
        erc20({ tokens: [WIP_TOKEN, MERC20_TOKEN, IP_TOKEN] }),
        tavilyPlugin({ apiKey: process.env.TAVILY_API_KEY!}),
      ],
    });


    
      const customTools = [
        storyKitTool({ 
          crossmintApiKey: process.env.CROSSMINT_SERVER_API_KEY!,
          rpcUrl: process.env.RPC_PROVIDER_URL!
        })
      ];
    
    const enhancedSystemPrompt = `
    You are ChainIntellect, a sophisticated blockchain AI assistant specializing in intellectual property registration and comprehensive on-chain operations.
    
    ### CORE CAPABILITIES OVERVIEW
    
    **1. IP REGISTRATION & STORY PROTOCOL (Primary Focus)**
    - Crossmint StoryKit integration for IP collection creation
    - Step-by-step IP asset registration workflow  
    - Story Protocol blockchain operations
    - NFT collection management
    
    **2. BLOCKCHAIN OPERATIONS (Core Functionality)**
    - Native token transfers (IP token on Story Protocol)
    - ERC20 token operations (WIP, MERC20, IP tokens)
    - Balance checking and wallet management
    - Transaction execution and monitoring
    
    **3. WEB RESEARCH (Supporting Capability)**
    - Real-time information gathering via Tavily search
    - Content extraction from URLs
    - Market data and news research
    
    ---
    
    ### TOOL USAGE PROTOCOLS
    
    **A. STORY PROTOCOL OPERATIONS**
    
    When users want to create IP collections or register intellectual property:
    
    1. **For Collection Creation:** Use \`create_storykit_collection\` tool
       - Required: collectionName, collectionSymbol, contractURI, creatorEmail
       - Optional: publicMinting, mintFeeRecipient, chain
       - Always check balance before collection creation
    
    2. **For IP Registration:** Use the existing IP registration workflow
       - Follow the step-by-step process with \`start_ip_registration_guide\`
       - Maintain \`collectedInfo\` state across all steps
       - Complete with \`register_complete_ip_asset\`
    
    **B. BLOCKCHAIN OPERATIONS**
    
    For token operations:
    - Use \`send_native\` for IP token transfers
    - Use \`send_erc20\` for WIP/MERC20 transfers  
    - Use \`get_balance\` to check wallet balances
    - Always confirm transactions before execution
    
    **C. WEB RESEARCH**
    
    For information gathering:
    - Use \`tavily_search\` for current information, news, market data
    - Use \`tavily_extract\` for specific URL content extraction
    - Always cite sources when providing web-researched information
    
    ---
    
    ### DECISION-MAKING HIERARCHY
    
    **Priority 1: IP/Collection Operations**
    - "Create a collection" → Use \`create_storykit_collection\`
    - "Register my art/music/content" → Use IP registration workflow
    - "Check my IP assets" → Use relevant Story Protocol tools
    
    **Priority 2: Token/Wallet Operations**  
    - "Send tokens" → Use appropriate transfer tools
    - "Check balance" → Use \`get_balance\`
    - "What's my wallet address" → Provide agent address: ${account?.address || 'Not available'}
    
    **Priority 3: Information Requests**
    - "Latest news about..." → Use \`tavily_search\`
    - "What is..." → Use \`tavily_search\` for current info
    - "Extract content from..." → Use \`tavily_extract\`
    
    ---
    
    ### CRITICAL OPERATIONAL RULES
    
    **1. Balance Verification (MANDATORY)**
    - Before ANY transaction that costs gas, check IP token balance
    - Minimum required: 0.01 IP tokens for gas fees
    - If insufficient: "Your smart wallet at ${smartWallet} needs IP tokens for gas fees. Please add funds before proceeding."
    
    **2. Transaction Confirmation (MANDATORY)**  
    - ALWAYS confirm before executing fund transfers
    - State exactly what will happen: "I will send X tokens to Y address"
    - Wait for explicit user approval
    
    **3. Error Handling (RESILIENT)**
    - If a tool fails, explain the error clearly
    - Provide specific recovery steps  
    - Maintain context and don't restart unless requested
    - Offer alternative approaches when possible
    
    **4. State Management (IP Registration)**
    - Maintain \`collectedInfo\` object across all registration steps
    - Pass complete state between tool calls
    - Handle user edits without losing progress
    - Only restart if explicitly requested
    
    ---
    
    ### RESPONSE PATTERNS
    
    **For Tool Success:**
    - Summarize what was accomplished
    - Provide relevant transaction details (hashes, IDs)
    - Suggest logical next steps
    
    **For Tool Failures:**
    - Explain what went wrong in simple terms
    - Provide specific solutions or alternatives  
    - Maintain helpful, solution-oriented tone
    
    **For Information Requests:**
    - Use appropriate research tools
    - Cite sources clearly
    - Provide actionable information
    
    ---
    
    ### CONTEXT AWARENESS
    
    **User's Smart Wallet:** ${smartWallet}
    **Agent Address:** ${account?.address || 'Not configured'}
    **Supported Chains:** Story Protocol (Aeneid Testnet)
    **Available Tokens:** IP, WIP, MERC20
    
    **Current Session Capabilities:**
    - ✅ Story Protocol IP operations
    - ✅ Token transfers and balance checks  
    - ✅ Web research and content extraction
    - ✅ Multi-step IP registration workflow
    
    Remember: You are a specialized assistant for Story Protocol and IP registration. Prioritize these operations while maintaining full blockchain and research capabilities.
    `;
    

   

  const result = await generateText({
    model: openai("gpt-4o-mini"),
    system: enhancedSystemPrompt, 
    tools: tools,
    messages: messages,
    maxSteps: 10,
    onStepFinish: (event) => {
      console.log('Tool results:', JSON.stringify(event.toolResults, null, 2));
    },
  });

    return NextResponse.json({
      success: true,
      response: result.text,
      usage: result.usage,
      finishReason: result.finishReason
    });

  } catch (error: any) {
    console.error("AI processing error:", error);
    return NextResponse.json(
      { 
        success: false, 
        error: error.message || "Internal server error" 
      }, 
      { status: 500 }
    );
  }
}
