"use client";

import {
  connectorsForWallets,
  darkTheme,
  getDefaultWallets,
  RainbowKitProvider,
} from "@rainbow-me/rainbowkit";
import { http } from "viem";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { createConfig, WagmiProvider } from "wagmi";

import {
  SUPPORTED_CHAINS,
  WALLET_CONNECT_PROJECT_ID,
} from "@/lib/web3/constants";

const { wallets } = getDefaultWallets();

const connectors = connectorsForWallets(wallets, {
  appName: "Hats Protocol Discord Gating",
  projectId: WALLET_CONNECT_PROJECT_ID,
});

const wagmiConfig = createConfig({
  chains: SUPPORTED_CHAINS,
  connectors,
  ssr: true,
  transports: [http()],
});

const queryClient = new QueryClient();

export const Web3Provider: React.FC<React.PropsWithChildren> = ({
  children,
}) => {
  return (
    <WagmiProvider config={wagmiConfig}>
      <QueryClientProvider client={queryClient}>
        <RainbowKitProvider theme={darkTheme()}>{children}</RainbowKitProvider>
      </QueryClientProvider>
    </WagmiProvider>
  );
};
