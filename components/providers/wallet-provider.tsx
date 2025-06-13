"use client";
import '@tomo-inc/tomo-evm-kit/styles.css';
import { lightTheme, getDefaultConfig, TomoEVMKitProvider } from "@tomo-inc/tomo-evm-kit";
import { metaMaskWallet, rainbowWallet, walletConnectWallet } from '@tomo-inc/tomo-evm-kit/wallets';
const FALLBACK_AVATAR_SRC = "/anura-image-1748291204826.png";
import {argentWallet, berasigWallet, bestWallet, bifrostWallet, binanceWallet, bitgetWallet, bitskiWallet, bitverseWallet, bloomWallet, braveWallet, bybitWallet, clvWallet, coin98Wallet, coinbaseWallet, compassWallet, coreWallet, dawnWallet, desigWallet, enkryptWallet, foxWallet, frameWallet, frontierWallet, gateWallet, imTokenWallet, injectedWallet, iopayWallet, kaiaWallet, kaikasWallet, krakenWallet, kresusWallet, ledgerWallet, magicEdenWallet,  mewWallet, nestWallet, oktoWallet, okxWallet, omniWallet, oneInchWallet, oneKeyWallet, paraSwapWallet, phantomWallet, rabbyWallet,  ramperWallet, roninWallet, safeWallet, safeheronWallet, safepalWallet, seifWallet, subWallet, tahoWallet, talismanWallet, tokenaryWallet, tokenPocketWallet, trustWallet, uniswapWallet} from '@tomo-inc/tomo-evm-kit/wallets';
import { WagmiProvider } from "wagmi";
import { QueryClientProvider, QueryClient } from "@tanstack/react-query";
import { PropsWithChildren, useEffect, useState } from "react";
import { aeneid } from "@story-protocol/core-sdk";
import {
  // Mainnets
  mainnet, 
  bsc, 
  arbitrum,
  avalanche,
  b3,
  base,
  bitlayer,
  blast,
  gravity,
  merlin,
  neoxMainnet,
  optimism,
  polygon,
  scroll,
  worldchain,
  opBNB,
  zksync, 
  corn,
  berachain,
  mantle,
  xLayer,
  polygonZkEvm,
  
  // Testnets
  botanixTestnet,
  berachainTestnetbArtio,
  monadTestnet,
  storyAeneid} from "wagmi/chains"


const queryClient = new QueryClient();

const config = getDefaultConfig({
  appName: "MintMatrix",
  clientId: process.env.NEXT_PUBLIC_TOMO_CLIENT_ID as string,
  projectId: process.env.NEXT_PUBLIC_WALLET_CONNECT_PROJECT_ID as string,
  chains: [aeneid,mainnet, polygon, optimism, arbitrum, base,berachain,bsc,avalanche,b3,bitlayer,blast,gravity,merlin,neoxMainnet,opBNB,zksync,corn,mantle,xLayer,polygonZkEvm,botanixTestnet,berachainTestnetbArtio,monadTestnet,scroll,worldchain],
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
  }],
  ssr: false, 
});

export function WalletProvider({ children }: PropsWithChildren) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return null;
  }

  return (
    <WagmiProvider config={config}>
      <QueryClientProvider client={queryClient}>
        <TomoEVMKitProvider 
          avatar={
            ({ address, ensImage, size }) => {
              const src = (ensImage && ensImage.trim() !== '') ? ensImage : FALLBACK_AVATAR_SRC;
              
              if (!src) {
                return null; 
              }

              return src ? (
                <img
                  src={src}
                  width={size}
                  height={size}
                  style={{ borderRadius: 999 }}
                />
              ) : (
                <div
                  style={{
                    backgroundColor: 'black',
                    borderRadius: 999,
                    height: size,
                    width: size,
                  }}
                >
                
                </div>
              );
            }
          }
          theme={lightTheme({
            accentColor: 'black',
            accentColorForeground: 'gray',
            borderRadius: 'large',
            fontStack: 'system',
            overlayBlur: 'small',
          })}
          initialChain={storyAeneid}
        >
          {children}
        </TomoEVMKitProvider>
      </QueryClientProvider>
    </WagmiProvider>
  );
}