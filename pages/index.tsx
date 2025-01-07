import Head from "next/head";
import { Box, Group, Input, Text } from "@chakra-ui/react";
import { useAccount } from "wagmi";

import { Button } from "@/components/ui/button";
import { Field } from "@/components/ui/field";
import {
  StepsCompletedContent,
  StepsContent,
  StepsItem,
  StepsList,
  StepsNextTrigger,
  StepsPrevTrigger,
  StepsRoot,
} from "@/components/ui/steps";
import { Header } from "@/components/Header";

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
        <Header />
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
              <StepsContent index={0} spaceY={4}>
                <Text>
                  Please paste the hat ID of the tree you would like to connect
                  with Discord. The hat must be minted on the Sepolia test
                  network, and you must be the owner of the tree&apos;s top hat.
                </Text>
                <Box spaceY={2}>
                  <Field
                    label="Hat ID"
                    invalid={false}
                    errorText="This is error text"
                  >
                    <Input />
                  </Field>
                  <Button variant="outline" size="sm">
                    Search
                  </Button>
                </Box>
              </StepsContent>
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
