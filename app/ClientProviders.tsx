'use client'; 
import React from 'react';
import dynamic from 'next/dynamic';
import { Toaster } from "../components/ui/toaster";
import { LoadingScreen } from '../components/loading-screen';
const WalletProvider = dynamic(
  () => import('../components/providers/wallet-provider').then((mod) => mod.WalletProvider),
  {
    ssr: false,
    loading: () => <LoadingScreen onComplete={() => {}} />,
  }
);

export function ClientProviders({ children }: { children: React.ReactNode }) {
  return (
    <WalletProvider>
      {children}
      <Toaster />
    </WalletProvider>
  );
}
