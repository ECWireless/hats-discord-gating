import { Button, Flex } from "@chakra-ui/react";
import { ConnectButton } from "@rainbow-me/rainbowkit";

export const ConnectWalletButton: React.FC = () => {
  return (
    <ConnectButton.Custom>
      {({
        account,
        chain,
        openAccountModal,
        openChainModal,
        openConnectModal,
        mounted,
      }) => {
        const connected = mounted && account && chain;

        return (
          <Flex
            align="center"
            cursor="pointer"
            gap={3}
            {...(!mounted && {
              "aria-hidden": true,
              style: {
                opacity: 0,
                pointerEvents: "none",
                userSelect: "none",
              },
            })}
          >
            {(() => {
              if (!connected) {
                return (
                  <Button
                    fontWeight={600}
                    onClick={openConnectModal}
                    size="lg"
                    variant="outline"
                  >
                    Connect Wallet
                  </Button>
                );
              }

              if (chain.unsupported) {
                return (
                  <Button
                    fontWeight={600}
                    onClick={openChainModal}
                    size="lg"
                    variant="outline"
                  >
                    Wrong Network
                  </Button>
                );
              }

              return (
                <Button
                  fontWeight={600}
                  onClick={openAccountModal}
                  size="lg"
                  variant="outline"
                >
                  {account.displayName}
                </Button>
              );
            })()}
          </Flex>
        );
      }}
    </ConnectButton.Custom>
  );
};
