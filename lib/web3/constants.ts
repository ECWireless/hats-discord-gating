import { Chain } from "viem";
import { sepolia } from "wagmi/chains";

export const WALLET_CONNECT_PROJECT_ID: string =
  process.env.NEXT_PUBLIC_WALLET_CONNECT_PROJECT_ID!;

export const EXPLORER_URLS: { [key: number]: string } = {
  [sepolia.id]: "https://sepolia.etherscan.io",
};

export const CHAINS: { [key: number]: Chain } = {
  [sepolia.id]: sepolia,
};

export const CHAIN_LABEL_TO_ID: { [key: string]: number } = {
  sepolia: sepolia.id,
};

export const CHAIN_ID_TO_LABEL: { [key: number]: string } = {
  [sepolia.id]: "sepolia",
};

type _chains = readonly [Chain, ...Chain[]];

export const SUPPORTED_CHAINS: _chains = [sepolia];

const validateConfig = () => {
  SUPPORTED_CHAINS.forEach((chain) => {
    if (!EXPLORER_URLS[chain.id]) {
      throw new Error(`EXPLORER_URLS[${chain.id}] is not set`);
    }

    if (!CHAIN_ID_TO_LABEL[chain.id]) {
      throw new Error(`CHAIN_ID_TO_LABEL[${chain.id}] is not set`);
    }

    if (
      !CHAIN_LABEL_TO_ID[CHAIN_ID_TO_LABEL[chain.id]] ||
      CHAIN_LABEL_TO_ID[CHAIN_ID_TO_LABEL[chain.id]] !== chain.id
    ) {
      throw new Error(
        `CHAIN_LABEL_TO_ID[${
          CHAIN_ID_TO_LABEL[chain.id]
        }] is not set or does not match ${chain.id}`
      );
    }
  });
};

validateConfig();
