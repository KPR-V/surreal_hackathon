"use client";
import { privateKeyToAccount } from "viem/accounts";

// ===================================================================
// OPTIMIZATION: Non-Blocking Task Runner
// This helper function is the key to our optimization.
// It wraps a heavy task in a setTimeout, which pushes the execution
// to the back of the event loop. This gives the browser a moment
// to update the UI (e.g., show a loading spinner) before the
// heavy cryptographic work begins, thus preventing a UI freeze.
// ===================================================================
function runWithoutBlocking<T>(heavyTask: () => Promise<T>): Promise<T> {
  return new Promise((resolve, reject) => {
    setTimeout(() => {
      heavyTask().then(resolve).catch(reject);
    }, 0); // A 0ms delay is all we need to yield to the event loop.
  });
}


// ===================================================================
// INTERNAL CRYPTO HELPERS (Unchanged)
// These are the building blocks. We will wrap the functions that *call* them.
// ===================================================================

// derive an AES-GCM key from password via PBKDF2
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

// Generate deterministic private key from seed
async function generateDeterministicPrivateKey(
  seed: string
): Promise<`0x${string}`> {
  const seedBytes = new TextEncoder().encode(seed);
  const hashBuffer = await crypto.subtle.digest("SHA-256", seedBytes);
  const hashArray = new Uint8Array(hashBuffer);
  const privateKeyHex = ("0x" +
    Array.from(hashArray)
      .map((b) => b.toString(16).padStart(2, "0"))
      .join("")) as `0x${string}`;
  return privateKeyHex;
}

// ===================================================================
// OPTIMIZED PUBLIC API
// The signatures of these exported functions are unchanged.
// ===================================================================

/**
 * OPTIMIZED: Generates an agent private key, encrypts it, and stores it.
 * This function is wrapped to be non-blocking to prevent UI freezes.
 */
export async function createAgentKey(password: string, userAddress: string) {
  // We wrap the entire original function body in our non-blocking runner.
  return runWithoutBlocking(async () => {
    const seed = `agent_key_${userAddress.toLowerCase()}_v1`;

    const privateKey = await generateDeterministicPrivateKey(seed);
    const { address: agentAddress } = privateKeyToAccount(privateKey);

    // This is the slowest part, but it will now run on a subsequent
    // event loop tick, after the UI has had a chance to update.
    const aesKey = await deriveAESKey(password);
    
    const iv = crypto.getRandomValues(new Uint8Array(12));
    const pt = new TextEncoder().encode(privateKey);
    const cipherBuf = await crypto.subtle.encrypt(
      { name: "AES-GCM", iv },
      aesKey,
      pt
    );
    const encryptedHex = Array.from(new Uint8Array(cipherBuf))
      .map((b) => b.toString(16).padStart(2, "0"))
      .join("");
    const ivHex = Array.from(iv)
      .map((b) => b.toString(16).padStart(2, "0"))
      .join("");

    // The synchronous localStorage call is also now inside the non-blocking block.
    localStorage.setItem(
      `agentKey_${agentAddress}`,
      JSON.stringify({ encryptedHex, ivHex, userAddress })
    );

    return agentAddress;
  });
}

/**
 * OPTIMIZED: Decrypts an agent private key when needed.
 * This function is also wrapped to be non-blocking.
 */
export async function decryptAgentKey(agentAddress: string, password: string) {
  // Wrap the body to prevent UI freeze during decryption.
  return runWithoutBlocking(async () => {
    const rec = localStorage.getItem(`agentKey_${agentAddress}`);
    if (!rec) throw new Error("No key found for agent: " + agentAddress);
    
    const { encryptedHex, ivHex } = JSON.parse(rec);
    
    // This is the slow part.
    const aesKey = await deriveAESKey(password);

    const iv = new Uint8Array(
      ivHex.match(/.{1,2}/g)!.map((h: any) => parseInt(h, 16))
    );
    const data = new Uint8Array(
      encryptedHex.match(/.{1,2}/g)!.map((h: any) => parseInt(h, 16))
    );
    const ptBuf = await crypto.subtle.decrypt(
      { name: "AES-GCM", iv },
      aesKey,
      data
    );
    return new TextDecoder().decode(ptBuf);
  });
}

// ===================================================================
// UNCHANGED HELPER FUNCTIONS
// These functions are fast and do not need to be wrapped.
// ===================================================================

// Alternative: Get agent address without creating/storing the key
export async function getAgentAddress(userAddress: string): Promise<string> {
  const seed = `agent_key_${userAddress.toLowerCase()}_v1`;
  const privateKey = await generateDeterministicPrivateKey(seed);
  const { address: agentAddress } = privateKeyToAccount(privateKey);
  return agentAddress;
}

// Helper function to check if agent key exists for a user
export async function hasAgentKey(userAddress: string): Promise<boolean> {
  const agentAddress = await getAgentAddress(userAddress);
  // This is a fast operation and doesn't need wrapping.
  return localStorage.getItem(`agentKey_${agentAddress}`) !== null;
}
