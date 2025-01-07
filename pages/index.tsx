import Head from "next/head";
import { Box, Group, Image, Input, Text, VStack } from "@chakra-ui/react";
import { useAccount } from "wagmi";
import {
  DEFAULT_ENDPOINTS_CONFIG,
  HatsSubgraphClient,
} from "@hatsprotocol/sdk-v1-subgraph";
import { hatIdDecimalToIp } from "@hatsprotocol/sdk-v1-core";
import { sepolia } from "wagmi/chains";

import { Toaster, toaster } from "@/components/ui/toaster";
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
import { useCallback, useMemo, useState } from "react";
import { uriToHttp } from "@/utils/helpers";
import { type HatDetails } from "@/utils/types";

export default function Home() {
  const { address, isConnected } = useAccount();
  const [hatId, setHatId] = useState<string>("");
  const [hatDetails, setHatDetails] = useState<HatDetails | null>(null);

  const onSearch = useCallback(async () => {
    try {
      if (!address) {
        throw new Error("Wallet not connected");
      }

      if (!hatId) {
        throw new Error("Please enter a valid hat ID");
      }

      const hatsSubgraphClient = new HatsSubgraphClient({
        config: DEFAULT_ENDPOINTS_CONFIG,
      });

      const hat = await hatsSubgraphClient.getHat({
        chainId: sepolia.id,
        hatId: BigInt(hatId),
        props: {
          admin: {
            wearers: {
              props: {},
            },
          },
          details: true,
          imageUri: true,
          wearers: {
            props: {},
          },
        },
      });

      const hatImageUrl = hat.imageUri ? uriToHttp(hat.imageUri)[0] : "";
      const hatDetailsUrl = hat.details ? uriToHttp(hat.details)[0] : "";
      const details = await fetch(hatDetailsUrl).then((res) => res.json());

      const adminWearers = hat.admin?.wearers?.map((wearer) => wearer.id);

      if (!adminWearers?.includes(address.toLowerCase() as `0x${string}`)) {
        throw new Error("You are not a wearer of this tree's top hat");
      }

      const _hatDetails = {
        imageUrl: hatImageUrl,
        ipId: hatIdDecimalToIp(BigInt(hatId)),
        name: details.data.name,
        wearers: hat.wearers?.map((wearer) => wearer.id) || [],
      };
      setHatDetails(_hatDetails);
    } catch (e) {
      console.error(e as Error);
      toaster.create({
        description: (e as Error).message,
        type: "error",
      });
    }
  }, [address, hatId]);

  const isStepDisabled = useMemo(() => {
    return !hatDetails;
  }, [hatDetails]);

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
          position="relative"
        >
          {isConnected ? (
            <StepsRoot colorPalette="blue" count={4} defaultValue={1} linear>
              <StepsList>
                <StepsItem index={0} title="Select Hat" />
                <StepsItem index={1} title="Install Discord-gating" />
                <StepsItem index={2} title="Add Bot" />
                <StepsItem index={3} title="Create Role" />
              </StepsList>
              <StepsContent index={0} spaceY={8}>
                <Text>
                  Please paste the hat ID of the tree you would like to connect
                  with Discord. The hat must be minted on the Sepolia test
                  network, and you must be the owner of the tree&apos;s top hat.
                </Text>
                <VStack spaceY={2}>
                  <Field
                    label="Hat ID"
                    invalid={false}
                    errorText="This is error text"
                  >
                    <Input
                      onChange={(e) => setHatId(e.target.value)}
                      value={hatId}
                    />
                  </Field>
                  <Button
                    disabled={!hatId}
                    onClick={onSearch}
                    size="sm"
                    variant="outline"
                  >
                    Search
                  </Button>
                </VStack>
                {hatDetails && (
                  <VStack>
                    <Text fontSize="lg" fontWeight={600}>
                      Hat Details
                    </Text>
                    <VStack>
                      <Box
                        border="1px solid #4A5568"
                        borderRadius="4px"
                        h="110px"
                        w="220px"
                      >
                        <Box borderBottom="1px solid #4A5568" display="flex">
                          <Image
                            alt="Hat Image"
                            height="75px"
                            src={hatDetails.imageUrl}
                            width="75px"
                          />
                          <Box p={2}>
                            <Text fontSize="xs" fontWeight={500}>
                              {hatDetails.ipId}
                            </Text>
                            <Text fontWeight={500}>{hatDetails.name}</Text>
                          </Box>
                        </Box>
                        <Box px={2} py={1}>
                          <Text color="#323131" fontWeight={600}>
                            {hatDetails.wearers.length} Wearer
                            {hatDetails.wearers.length > 1 ? "s" : ""}
                          </Text>
                        </Box>
                      </Box>
                      <Button size="sm" variant="solid">
                        Connect Tree to Discord
                      </Button>
                    </VStack>
                  </VStack>
                )}
              </StepsContent>
              <StepsContent index={1}>Install Discord-gating</StepsContent>
              <StepsContent index={2}>Add Bot</StepsContent>
              <StepsContent index={3}>Create Role</StepsContent>
              <StepsCompletedContent>Complete!</StepsCompletedContent>
              <Group alignSelf="center" bottom={10} mt={4} position="absolute">
                <StepsPrevTrigger asChild>
                  <Button size="sm" variant="outline">
                    Prev
                  </Button>
                </StepsPrevTrigger>
                <StepsNextTrigger asChild>
                  <Button disabled={isStepDisabled} size="sm" variant="outline">
                    Next
                  </Button>
                </StepsNextTrigger>
              </Group>
            </StepsRoot>
          ) : (
            <Text fontSize="lg">Please connect your wallet to continue</Text>
          )}
        </Box>
        <Toaster />
      </main>
    </>
  );
}
