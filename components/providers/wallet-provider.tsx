"use client";
import '@tomo-inc/tomo-evm-kit/styles.css';
import { getDefaultConfig, TomoEVMKitProvider } from "@tomo-inc/tomo-evm-kit";
import { metaMaskWallet, rainbowWallet, walletConnectWallet } from '@tomo-inc/tomo-evm-kit/wallets';
import {argentWallet, berasigWallet, bestWallet, bifrostWallet, binanceWallet, bitgetWallet, bitskiWallet, bitverseWallet, bloomWallet, braveWallet, bybitWallet, clvWallet, coin98Wallet, coinbaseWallet, compassWallet, coreWallet, dawnWallet, desigWallet, enkryptWallet, foxWallet, frameWallet, frontierWallet, gateWallet, imTokenWallet, injectedWallet, iopayWallet, kaiaWallet, kaikasWallet, krakenWallet, kresusWallet, ledgerWallet, magicEdenWallet,  mewWallet, nestWallet, oktoWallet, okxWallet, omniWallet, oneInchWallet, oneKeyWallet, paraSwapWallet, phantomWallet, rabbyWallet,  ramperWallet, roninWallet, safeWallet, safeheronWallet, safepalWallet, seifWallet, subWallet, tahoWallet, talismanWallet, tokenaryWallet, tokenPocketWallet, trustWallet, uniswapWallet} from '@tomo-inc/tomo-evm-kit/wallets';
import { WagmiProvider } from "wagmi";
import { QueryClientProvider, QueryClient } from "@tanstack/react-query";
import { PropsWithChildren } from "react";
import { aeneid } from "@story-protocol/core-sdk";
import {mainnet, polygon, optimism, arbitrum, base} from "wagmi/chains"
const config = getDefaultConfig({
  appName: "MintMatrix",
  clientId: process.env.NEXT_PUBLIC_TOMO_CLIENT_ID as string,
  projectId: process.env.NEXT_PUBLIC_WALLET_CONNECT_PROJECT_ID as string,
  chains: [aeneid,mainnet, polygon, optimism, arbitrum, base],
  wallets:[{
    groupName:"Popular",
    wallets:[
      metaMaskWallet, rainbowWallet, walletConnectWallet
    ],
  },
{
  groupName:"more wallets",
  wallets:[
    argentWallet, berasigWallet, bestWallet, bifrostWallet, binanceWallet, bitgetWallet, bitskiWallet, bitverseWallet, bloomWallet, braveWallet, bybitWallet, clvWallet, coin98Wallet, coinbaseWallet, compassWallet, coreWallet, dawnWallet, desigWallet, enkryptWallet, foxWallet, frameWallet, frontierWallet, gateWallet, imTokenWallet, injectedWallet, iopayWallet, kaiaWallet, kaikasWallet, krakenWallet, kresusWallet, ledgerWallet, magicEdenWallet,  mewWallet, nestWallet, oktoWallet, okxWallet, omniWallet, oneInchWallet, oneKeyWallet, paraSwapWallet, phantomWallet, rabbyWallet,  ramperWallet, roninWallet, safeWallet, safeheronWallet, safepalWallet, seifWallet, subWallet, tahoWallet, talismanWallet, tokenaryWallet, tokenPocketWallet, trustWallet, uniswapWallet
  ],
},

],
  ssr: true, 
});

const queryClient = new QueryClient();

export function WalletProvider({ children }: PropsWithChildren) {
  return (
    <WagmiProvider config={config}>
      <QueryClientProvider client={queryClient}>
        <TomoEVMKitProvider>
          {children}
        </TomoEVMKitProvider>
      </QueryClientProvider>
    </WagmiProvider>
  );
}