import type { AppProps } from "next/app";
import {
  ChakraProvider,
  createSystem,
  defaultConfig,
  defineConfig,
} from "@chakra-ui/react";
import { Web3Provider } from "@/contexts/Web3Provider";

import "@rainbow-me/rainbowkit/styles.css";

const config = defineConfig({
  globalCss: {
    "html, body": {
      background: "rgb(219 234 254/100%)",
      margin: 0,
      padding: 0,
    },
  },
});

const system = createSystem(defaultConfig, config);

export default function App({ Component, pageProps }: AppProps) {
  return (
    <ChakraProvider value={system}>
      <Web3Provider>
        <Component {...pageProps} />
      </Web3Provider>
    </ChakraProvider>
  );
}
