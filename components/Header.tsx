import { Box, HStack, Text } from "@chakra-ui/react";
import Image from "next/image";
import { ConnectWalletButton } from "@/components/ConnectWalletButton";

export const Header = () => {
  return (
    <Box
      alignItems="center"
      as="header"
      bgColor="white"
      boxShadow="0 4px 6px -1px rgba(0,0,0,.1),0 2px 4px -2px rgba(0,0,0,.1)"
      display="flex"
      h="75px"
      justifyContent="space-between"
      px={6}
    >
      <Image
        alt="Hats Protocol Logo"
        height={65}
        src="/hats_icon.jpeg"
        width={65}
      />
      <HStack>
        <Text
          border="1px solid #e4e4e7"
          borderRadius="0.25rem"
          p={3}
          fontSize="xs"
        >
          Sepolia
        </Text>
        <ConnectWalletButton />
      </HStack>
    </Box>
  );
};
