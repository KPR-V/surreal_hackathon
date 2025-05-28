import { custom } from 'viem';
import { useWalletClient } from "wagmi";
import { StoryClient, StoryConfig } from "@story-protocol/core-sdk";

export function useStoryClient() {
  const { data: wallet, isLoading } = useWalletClient();

  async function getStoryClient(): Promise<StoryClient | null> {
    if (!wallet) return null;
    
    const config: StoryConfig = {
      wallet: wallet,
      transport: custom(wallet.transport),
      chainId: "aeneid",
    };
    
    return StoryClient.newClient(config);
  }

  return {
    getStoryClient,
    isLoading,
    isReady: !!wallet
  };
}