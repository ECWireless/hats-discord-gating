import Head from "next/head";
import { Box, Group, HStack, Text } from "@chakra-ui/react";
import Image from "next/image";
import { useAccount } from "wagmi";

import { ConnectWalletButton } from "@/components/ConnectWalletButton";
import { Button } from "@/components/ui/button";
import {
  StepsCompletedContent,
  StepsContent,
  StepsItem,
  StepsList,
  StepsNextTrigger,
  StepsPrevTrigger,
  StepsRoot,
} from "@/components/ui/steps";

export default function Home() {
  const { isConnected } = useAccount();

  return (
    <>
      <Head>
        <title>Hats Protocol Discord Gating</title>
        <meta
          name="description"
          content="Proof-of-concept for adding a Discord-gated authority without the Guild.xyz UI"
        />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <link rel="icon" href="/favicon.ico" />
      </Head>
      <main>
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
        <Box
          justifyContent="center"
          bgColor="#ffffff80"
          display="flex"
          m={10}
          minH="calc(100vh - 150px)"
          p={10}
        >
          {isConnected ? (
            <StepsRoot colorPalette="blue" count={4} defaultValue={1}>
              <StepsList>
                <StepsItem index={0} title="Select Hat" />
                <StepsItem index={1} title="Install Discord-gating" />
                <StepsItem index={2} title="Add Bot" />
                <StepsItem index={3} title="Create Role" />
              </StepsList>
              <StepsContent index={0}>Select Hat</StepsContent>
              <StepsContent index={1}>Install Discord-gating</StepsContent>
              <StepsContent index={2}>Add Bot</StepsContent>
              <StepsContent index={3}>Create Role</StepsContent>
              <StepsCompletedContent>Complete!</StepsCompletedContent>
              <Group>
                <StepsPrevTrigger asChild>
                  <Button variant="outline" size="sm">
                    Prev
                  </Button>
                </StepsPrevTrigger>
                <StepsNextTrigger asChild>
                  <Button variant="outline" size="sm">
                    Next
                  </Button>
                </StepsNextTrigger>
              </Group>
            </StepsRoot>
          ) : (
            <Text fontSize="lg">Please connect your wallet to continue</Text>
          )}
        </Box>
      </main>
    </>
  );
}
