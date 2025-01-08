import Head from "next/head";
import {
  Box,
  Group,
  Image as ChakraImage,
  Input,
  Link,
  Text,
  VStack,
  HStack,
} from "@chakra-ui/react";
import { useAccount, useSignMessage } from "wagmi";
import { createSigner, createGuildClient } from "@guildxyz/sdk";
import {
  DEFAULT_ENDPOINTS_CONFIG,
  HatsSubgraphClient,
} from "@hatsprotocol/sdk-v1-subgraph";
import { hatIdDecimalToIp } from "@hatsprotocol/sdk-v1-core";
import { sepolia } from "wagmi/chains";
import { FaExternalLinkAlt } from "react-icons/fa";

import { Checkbox } from "@/components/ui/checkbox";
import { Status } from "@/components/ui/status";
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
import { type GuildDetails, type HatDetails } from "@/utils/types";

export default function Home() {
  const { address, isConnected } = useAccount();
  const { signMessageAsync } = useSignMessage();

  const [step, setStep] = useState<number>(0);

  const [hatId, setHatId] = useState<string>("");
  const [hatDetails, setHatDetails] = useState<HatDetails | null>(null);
  const [isSearching, setIsSearching] = useState<boolean>(false);

  const [serverId, setServerId] = useState<string>("");
  const [inviteChannelId, setInviteChannelId] = useState<string>("");
  const [isCreatingGuild, setIsCreatingGuild] = useState<boolean>(false);
  const [guildDetails, setGuildDetails] = useState<GuildDetails | null>(null);

  const [isBotAdded, setIsBotAdded] = useState<boolean>(false);

  const onSearch = useCallback(async () => {
    try {
      setIsSearching(true);

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
    } finally {
      setIsSearching(false);
    }
  }, [address, hatId]);

  const onCreateGuild = useCallback(async () => {
    try {
      setIsCreatingGuild(true);

      if (!address) {
        throw new Error("Wallet not connected");
      }

      if (!serverId || !inviteChannelId) {
        throw new Error("Please enter a valid server ID and invite channel ID");
      }

      const guildClient = createGuildClient("Hats Protocol Discord Gating");
      const signerFunction = createSigner.custom(
        (message) => signMessageAsync({ message }),
        address
      );

      const myGuild = await guildClient.guild.create(
        {
          name: "Test Hats Guild",
          urlName: "test-hats-guild",
          description: "Cool stuff",
          showMembers: true,
          hideFromExplorer: false,
          guildPlatforms: [
            {
              platformName: "DISCORD",
              platformGuildId: serverId,
              platformGuildData: { inviteChannel: inviteChannelId },
            },
          ],
          roles: [
            {
              name: "My new role",
              requirements: [{ type: "FREE" }],
            },
          ],
          contacts: [],
        },
        signerFunction
      );

      const _guildDetails = {
        description: myGuild.description,
        id: myGuild.id,
        imageUrl: myGuild.imageUrl,
        name: myGuild.name,
        urlName: myGuild.urlName,
      };
      setGuildDetails(_guildDetails);

      toaster.create({
        description: "Guild created successfully!",
        type: "success",
      });

      await guildClient.guild.join(myGuild.id, signerFunction);

      toaster.create({
        description: "Joined guild successfully!",
        type: "success",
      });
    } catch (e) {
      console.error(e as Error);
      toaster.create({
        description: (e as Error).message,
        type: "error",
      });
    } finally {
      setIsCreatingGuild(false);
    }
  }, [address, serverId, inviteChannelId, signMessageAsync]);

  const isStepDisabled = useMemo(() => {
    if (step === 0) {
      return !hatDetails;
    }

    if (step === 1) {
      return !guildDetails;
    }

    if (step === 2) {
      return !isBotAdded;
    }

    return false;
  }, [guildDetails, hatDetails, isBotAdded, step]);

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
            <StepsRoot
              colorPalette="blue"
              count={4}
              linear
              onStepChange={(e) => setStep(e.step)}
              step={step}
            >
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
                      disabled={isSearching}
                      onChange={(e) => setHatId(e.target.value)}
                      value={hatId}
                    />
                  </Field>
                  <Button
                    disabled={!hatId}
                    loading={isSearching}
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
                          <ChakraImage
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
                      <Text>
                        Click &quot;Next&quot; to connect your tree to Discord.
                      </Text>
                    </VStack>
                  </VStack>
                )}
              </StepsContent>
              <StepsContent index={1} spaceY={8}>
                <Status value={guildDetails ? "success" : "warning"}>
                  {guildDetails
                    ? "Connected to Guild.xyz"
                    : "Not connected to Guild.xyz"}
                </Status>
                {guildDetails ? (
                  <VStack>
                    <Text fontSize="lg" fontWeight={600}>
                      Guild Details
                    </Text>
                    <Box
                      border="1px solid #4A5568"
                      borderRadius="4px"
                      w="250px"
                    >
                      <HStack
                        borderBottom="1px solid #4A5568"
                        display="flex"
                        p={4}
                      >
                        {guildDetails.imageUrl ? (
                          <ChakraImage
                            alt="Guild Image"
                            height="75px"
                            src={guildDetails.imageUrl}
                            width="75px"
                          />
                        ) : (
                          <Box w="40px">
                            <svg viewBox="0 0 16 16" focusable="false">
                              <path
                                fill-rule="evenodd"
                                clip-rule="evenodd"
                                d="M4.99416 6.97535V8.00729L4.00709 8.02078C4.00709 8.02078 4.00459 8.65815 4.00459 8.98991H2.99869V9.9577H1.98764V8.00363H0.999999V14.9771H5.97837V9.98678H7.00751V9.00776H8.98476V9.9789H10.0006V14.9752H15V8.00342H14.0172V9.96519H13.015V9.00625H12.0136V7.99323H11.0083V6.9827H10.0124V3.9933H8.99008V2.95792C8.99008 2.95792 9.68474 2.96253 9.99326 2.96253V1.99065H8.99008V1H7.00648V1.99065H6.00655V2.99836H7.02186L7.02134 3.98593H5.99081C5.99317 4.58091 5.9912 5.17589 5.98922 5.77087C5.98789 6.17237 5.98656 6.57386 5.98656 6.97535H4.99416ZM3.995 11.5045L3.99495 11.864L3.9949 12.4777H3.00979V11.5045H3.995ZM13.0081 11.864L13.0082 11.5045H12.023V12.4777H13.0081L13.0081 11.864ZM7.0219 1.96106H8.97871V2.96877H7.0219V1.96106Z"
                                fill="black"
                              />
                            </svg>
                          </Box>
                        )}
                        <Box p={2}>
                          <Text fontWeight={500}>{guildDetails.name}</Text>
                          <Link
                            color="blue"
                            href={`https://guild.xyz/${guildDetails.urlName}`}
                            rel="noreferrer"
                            target="_blank"
                          >
                            View Guild <FaExternalLinkAlt />
                          </Link>
                        </Box>
                      </HStack>
                      <Box p={2}>
                        <Text color="#323131">{guildDetails.description}</Text>
                      </Box>
                    </Box>
                    <Text>
                      Click &quot;Next&quot; to add the Guild.xyz bot to your
                      server.
                    </Text>
                  </VStack>
                ) : (
                  <>
                    <VStack alignItems="start" spaceY={2}>
                      <Text>
                        In order to connect your tree to Discord, you will need
                        to create a guild on Guild.xyz. To do so you, you will
                        need to paste your Discord server ID and the welcome
                        channel ID of that server.{" "}
                        <strong>
                          You must have admin privileges in your Discord server.
                        </strong>
                      </Text>
                      <Text>
                        To get your server ID, go to the welcome channel of your
                        Discord server, and copy the first set of numbers in the
                        URL. The welcome channel ID will be the second set of
                        numbers in the URL.
                      </Text>
                      <ChakraImage
                        alt="Discord IDs Example"
                        height={50}
                        src="/discord_ids.png"
                      />
                      <Text>
                        When you click &quot;Create Guild&quot;, you will be
                        prompted to sign a message to create the guild, as well
                        a second message to join the guild.
                      </Text>
                    </VStack>
                    <VStack spaceY={2}>
                      <Field
                        label="Server ID"
                        invalid={false}
                        errorText="This is error text"
                      >
                        <Input
                          disabled={isCreatingGuild}
                          onChange={(e) => setServerId(e.target.value)}
                          value={serverId}
                        />
                      </Field>
                      <Field
                        label="Invite Channel ID"
                        invalid={false}
                        errorText="This is error text"
                      >
                        <Input
                          disabled={isCreatingGuild}
                          onChange={(e) => setInviteChannelId(e.target.value)}
                          value={inviteChannelId}
                        />
                      </Field>
                      <Button
                        disabled={!serverId || !inviteChannelId}
                        loading={isCreatingGuild}
                        onClick={onCreateGuild}
                        size="sm"
                        variant="outline"
                      >
                        Create Guild
                      </Button>
                    </VStack>
                  </>
                )}
              </StepsContent>
              <StepsContent index={2} spaceY={8}>
                <VStack spaceY={2}>
                  <Text>
                    Make sure that the Guild.xyz bot is a member of your Discord
                    server, so that it will be able to manage your roles.
                  </Text>
                  <Link
                    color="blue"
                    href="https://discord.com/oauth2/authorize?client_id=868172385000509460&permissions=268716145&scope=bot%20applications.commands"
                    rel="noreferrer"
                    target="_blank"
                  >
                    Add Guild.xyz bot
                    <FaExternalLinkAlt />
                  </Link>
                  <Checkbox
                    checked={isBotAdded}
                    onCheckedChange={(e) => setIsBotAdded(!!e.checked)}
                    variant="subtle"
                  >
                    I have added the Guild.xyz bot to my server
                  </Checkbox>
                </VStack>
              </StepsContent>
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
