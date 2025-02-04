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
  useBreakpointValue,
} from "@chakra-ui/react";
import { useAccount, useSignMessage, useWalletClient } from "wagmi";
import { getPublicClient, http, createConfig } from "@wagmi/core";
import { createSigner, createGuildClient } from "@guildxyz/sdk";
import {
  DEFAULT_ENDPOINTS_CONFIG,
  HatsSubgraphClient,
} from "@hatsprotocol/sdk-v1-subgraph";
import {
  hatIdDecimalToIp,
  hatIdHexToDecimal,
  HatsClient,
  treeIdHexToDecimal,
  treeIdToTopHatId,
} from "@hatsprotocol/sdk-v1-core";
import { sepolia } from "wagmi/chains";
import { FaExternalLinkAlt, FaCheckCircle } from "react-icons/fa";

import { Checkbox } from "@/components/ui/checkbox";
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
import { useCallback, useEffect, useMemo, useState } from "react";
import { uriToHttp } from "@/utils/helpers";
import { type GuildDetails, type HatDetails } from "@/utils/types";

export default function Home() {
  const { address, isConnected } = useAccount();
  const { signMessageAsync } = useSignMessage();
  const result = useWalletClient();

  const desktop = useBreakpointValue({ base: false, md: true });

  const [step, setStep] = useState<number>(0);

  const [hatId, setHatId] = useState<string>("");
  const [hatDetails, setHatDetails] = useState<HatDetails | null>(null);
  const [isSearching, setIsSearching] = useState<boolean>(false);

  const [serverId, setServerId] = useState<string>("");
  const [isCreatingGuild, setIsCreatingGuild] = useState<boolean>(false);
  const [guildDetails, setGuildDetails] = useState<GuildDetails | null>(null);
  const [isUpdatingTopHatDetails, setIsUpdatingTopHatDetails] =
    useState<boolean>(false);

  const [isBotAdded, setIsBotAdded] = useState<boolean>(false);

  const [roleId, setRoleId] = useState<string>("");
  const [isCreatingReward, setIsCreatingReward] = useState<boolean>(false);
  const [isRewardCreated, setIsRewardCreated] = useState<boolean>(false);

  const storeInLocalStorage = useCallback((key: string, data: unknown) => {
    localStorage.setItem(key, JSON.stringify(data));
  }, []);

  const getFromLocalStorage = useCallback((key: string) => {
    const data = localStorage.getItem(key);
    return data ? JSON.parse(data) : null;
  }, []);

  useEffect(() => {
    const _hatDetails = getFromLocalStorage(`hatDetails-${address}`);
    const _guildDetails = getFromLocalStorage(`guildDetails-${address}`);
    const _botAdded = getFromLocalStorage(`botAdded-${address}`);
    const _rewardDetails = getFromLocalStorage(`rewardDetails-${address}`);

    if (_hatDetails) {
      setHatDetails(_hatDetails);
      setStep(0);
    }

    if (_guildDetails) {
      setGuildDetails(_guildDetails);
      setStep(1);
    }

    if (_botAdded) {
      setIsBotAdded(_botAdded);
      setStep(2);
    }

    if (_rewardDetails) {
      setIsRewardCreated(true);
      setServerId(_rewardDetails.serverId);
      setRoleId(_rewardDetails.roleId);
      setStep(4);
    }
  }, [address, getFromLocalStorage]);

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
          tree: {},
          details: true,
          imageUri: true,
          wearers: {
            props: {},
          },
        },
      });

      if (!hat.tree) {
        throw new Error("Invalid tree");
      }

      const treeId = treeIdHexToDecimal(hat.tree.id);
      const topHatId = treeIdToTopHatId(treeId);

      const topHat = await hatsSubgraphClient.getHat({
        chainId: sepolia.id,
        hatId: topHatId,
        props: {
          details: true,
          wearers: {
            props: {},
          },
        },
      });

      const hatImageUrl = hat.imageUri ? uriToHttp(hat.imageUri)[0] : "";

      const topHatDetailsUrl = topHat?.details
        ? uriToHttp(topHat?.details)[0]
        : "";
      const subHatDetailsUrl = hat.details ? uriToHttp(hat.details)[0] : "";

      if (!topHatDetailsUrl || !subHatDetailsUrl) {
        throw new Error("Invalid hat details");
      }

      const topHatDetails = await fetch(topHatDetailsUrl).then((res) =>
        res.json()
      );
      const subHatDetails = await fetch(subHatDetailsUrl).then((res) =>
        res.json()
      );

      const topHatWearers = topHat?.wearers?.map((wearer) => wearer.id);

      if (!topHatWearers?.includes(address.toLowerCase() as `0x${string}`)) {
        throw new Error("You are not a wearer of this tree's top hat");
      }

      const _hatDetails = {
        decimalId: hatIdHexToDecimal(hat.id).toString(),
        description: subHatDetails.data.description,
        imageUrl: hatImageUrl,
        ipId: hatIdDecimalToIp(BigInt(hatId)),
        name: subHatDetails.data.name,
        topHatDecimalId: hatIdHexToDecimal(topHat?.id).toString(),
        topHatDescription: topHatDetails.data.description,
        topHatName: topHatDetails.data.name,
        topHatJsonDetails: JSON.stringify(topHatDetails),
        wearers: hat.wearers?.map((wearer) => wearer.id) || [],
      };
      setHatDetails(_hatDetails);
      storeInLocalStorage(`hatDetails-${address}`, _hatDetails);
    } catch (e) {
      console.error(e as Error);
      toaster.create({
        description: (e as Error).message,
        type: "error",
      });
    } finally {
      setIsSearching(false);
    }
  }, [address, hatId, storeInLocalStorage]);

  const onCreateGuild = useCallback(async () => {
    try {
      setIsCreatingGuild(true);

      if (!address) {
        throw new Error("Wallet not connected");
      }

      if (!hatDetails) {
        throw new Error("Please select a hat first");
      }

      const guildClient = createGuildClient("Hats Protocol Discord Gating");
      const signerFunction = createSigner.custom(
        (message) => signMessageAsync({ message }),
        address
      );

      const myGuild = await guildClient.guild.create(
        {
          name: hatDetails.topHatName,
          urlName: hatDetails.topHatName.toLowerCase().replace(/\s+/g, "-"),
          description: hatDetails.topHatDescription,
          showMembers: true,
          hideFromExplorer: false,
          roles: [
            {
              name: hatDetails.name,
              description: hatDetails.description,
              requirements: [
                {
                  address: "0x3bc1a0ad72417f2d411118085256fc53cbddd137",
                  chain: "SEPOLIA",
                  data: {
                    ids: [hatDetails.decimalId],
                  },
                  type: "ERC1155",
                },
              ],
            },
          ],
          contacts: [],
        },
        signerFunction
      );

      const guildRoleId = myGuild.roles.find(
        (role) => role.name === hatDetails.name
      )?.id;

      if (!guildRoleId) {
        throw new Error("Guild role not found");
      }

      const _guildDetails = {
        description: myGuild.description,
        guildRoleId,
        id: myGuild.id,
        imageUrl: myGuild.imageUrl,
        name: myGuild.name,
        urlName: myGuild.urlName,
      };
      setGuildDetails(_guildDetails);
      storeInLocalStorage(`guildDetails-${address}`, _guildDetails);

      toaster.create({
        description: "Guild created successfully!",
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
  }, [address, hatDetails, signMessageAsync, storeInLocalStorage]);

  const onUpdateTopHatDetails = useCallback(async () => {
    try {
      setIsUpdatingTopHatDetails(true);

      const config = createConfig({
        chains: [sepolia],
        transports: {
          [sepolia.id]: http(),
        },
      });
      const publicClient = getPublicClient(config);
      if (!publicClient) {
        throw new Error("Public client not found");
      }

      if (!result.data) {
        throw new Error("Wallet client not found");
      }

      if (!hatDetails) {
        throw new Error("Please select a hat first");
      }

      if (!guildDetails) {
        throw new Error("Please create a guild first");
      }

      const hatsClient = new HatsClient({
        chainId: sepolia.id,
        publicClient,
        walletClient: result.data,
      });

      const originalTopHatDetails = JSON.parse(hatDetails.topHatJsonDetails);
      const originalTopHatGuilds = originalTopHatDetails.data.guilds || [];

      if (originalTopHatGuilds.includes(guildDetails.urlName)) {
        throw new Error("Guild already exists in top hat");
      } else {
        originalTopHatGuilds.push(guildDetails.urlName);
        originalTopHatDetails.data.guilds = originalTopHatGuilds;
      }

      const res = await fetch("/api/uploadMetadata?name=hatDetails.json", {
        method: "POST",
        body: JSON.stringify(originalTopHatDetails),
      });
      if (!res.ok)
        throw new Error(
          "Something went wrong uploading your hat new hat details"
        );

      const { cid } = await res.json();

      const txResult = await hatsClient.changeHatDetails({
        account: result.data.account,
        hatId: BigInt(hatDetails.topHatDecimalId),
        newDetails: `ipfs://${cid}`,
      });

      if (!txResult) return;

      const { status } = txResult;

      if (status !== "success") {
        throw new Error("Failed to add guld to top hat");
      }

      toaster.create({
        description: "Guild has been added to top hat!",
        type: "success",
      });
      const newHatDetails = {
        ...hatDetails,
        topHatJsonDetails: JSON.stringify(originalTopHatDetails),
      };
      setHatDetails(newHatDetails);
      storeInLocalStorage(`hatDetails-${address}`, newHatDetails);
    } catch (e) {
      console.error(e as Error);
      toaster.create({
        description: (e as Error).message,
        type: "error",
      });
    } finally {
      setIsUpdatingTopHatDetails(false);
    }
  }, [address, guildDetails, hatDetails, result, storeInLocalStorage]);

  const onCreateReward = useCallback(async () => {
    try {
      setIsCreatingReward(true);

      if (!address) {
        throw new Error("Wallet not connected");
      }

      if (!guildDetails) {
        throw new Error("No guild found");
      }

      if (!serverId) {
        throw new Error("Please enter a valid server ID");
      }

      if (!roleId) {
        throw new Error("Please enter a valid role ID");
      }

      const guildClient = createGuildClient("Hats Protocol Discord Gating");
      const signerFunction = createSigner.custom(
        (message) => signMessageAsync({ message }),
        address
      );

      const {
        guild: {
          role: { reward: rewardClient },
        },
      } = guildClient;

      await rewardClient.create(
        guildDetails.urlName,
        guildDetails.guildRoleId,
        {
          guildPlatform: {
            platformName: "DISCORD",
            platformGuildId: serverId,
          },
          platformRoleId: roleId,
        },
        signerFunction
      );

      toaster.create({
        description: "Role created successfully!",
        type: "success",
      });
      setIsRewardCreated(true);
      storeInLocalStorage(`rewardDetails-${address}`, {
        guildRoleId: guildDetails.guildRoleId,
        roleId,
        serverId,
      });
      setStep(4);
    } catch (e) {
      console.error(e as Error);
      toaster.create({
        description: (e as Error).message,
        type: "error",
      });
    } finally {
      setIsCreatingReward(false);
    }
  }, [
    address,
    guildDetails,
    roleId,
    serverId,
    signMessageAsync,
    storeInLocalStorage,
  ]);

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

    if (step === 3) {
      return !isRewardCreated;
    }

    return step === 4;
  }, [guildDetails, hatDetails, isBotAdded, isRewardCreated, step]);

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
          m={{ base: 4, md: 10 }}
          minH="calc(100vh - 150px)"
          p={{ base: 4, md: 10 }}
          pb={28}
          position="relative"
        >
          {isConnected ? (
            <StepsRoot
              colorPalette="blue"
              count={4}
              linear
              onStepChange={(e) => setStep(e.step)}
              orientation={desktop ? "horizontal" : "vertical"}
              size={{ base: "xs", md: "md" }}
              spaceX={{ base: 2, md: 0 }}
              spaceY={{ base: 0, md: 4 }}
              step={step}
            >
              <StepsList>
                <StepsItem index={0} title="Select Hat" />
                <StepsItem index={1} title="Create Guild" />
                <StepsItem index={2} title="Add Bot" />
                <StepsItem index={3} title="Create Role" />
              </StepsList>
              <StepsContent index={0} spaceY={8}>
                <VStack>
                  <Text fontSize={{ base: "xs", md: "md" }} textAlign="center">
                    Please paste the hat ID of the tree you would like to
                    connect with Discord. The hat must be minted on the Sepolia
                    test network, and you must be the owner of the tree&apos;s
                    top hat.
                  </Text>
                </VStack>
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
                        h={{ base: "90px", md: "110px" }}
                        w={{ base: "150px", md: "220px" }}
                      >
                        <Box borderBottom="1px solid #4A5568" display="flex">
                          <ChakraImage
                            alt="Hat Image"
                            height={{ base: "60px", md: "75px" }}
                            src={hatDetails.imageUrl}
                            width={{ base: "60px", md: "75px" }}
                          />
                          <Box p={2}>
                            <Text fontSize="xs" fontWeight={500}>
                              {hatDetails.ipId}
                            </Text>
                            <Text
                              fontSize={{ base: "xs", md: "md" }}
                              fontWeight={500}
                            >
                              {hatDetails.name}
                            </Text>
                          </Box>
                        </Box>
                        <Box px={2} py={1}>
                          <Text
                            color="#323131"
                            fontSize={{ base: "xs", md: "md" }}
                            fontWeight={600}
                          >
                            {hatDetails.wearers.length} Wearer
                            {hatDetails.wearers.length > 1 ? "s" : ""}
                          </Text>
                        </Box>
                      </Box>
                      <Text
                        fontSize={{ base: "xs", md: "md" }}
                        textAlign="center"
                      >
                        Click &quot;Next&quot; to connect your tree to Discord.
                      </Text>
                    </VStack>
                  </VStack>
                )}
              </StepsContent>
              <StepsContent index={1} spaceY={8}>
                {guildDetails ? (
                  <VStack>
                    <Text fontSize="lg" fontWeight={600}>
                      Guild Details
                    </Text>
                    <Box
                      border="1px solid #4A5568"
                      borderRadius="4px"
                      w={{ base: "150px", md: "250px" }}
                    >
                      <HStack
                        borderBottom="1px solid #4A5568"
                        display="flex"
                        p={{ base: 1, md: 4 }}
                      >
                        {guildDetails.imageUrl ? (
                          <ChakraImage
                            alt="Guild Image"
                            height="75px"
                            src={guildDetails.imageUrl}
                            width="75px"
                          />
                        ) : (
                          <Box w={{ base: "25px", md: "40px" }}>
                            <svg viewBox="0 0 16 16" focusable="false">
                              <path
                                fillRule="evenodd"
                                clipRule="evenodd"
                                d="M4.99416 6.97535V8.00729L4.00709 8.02078C4.00709 8.02078 4.00459 8.65815 4.00459 8.98991H2.99869V9.9577H1.98764V8.00363H0.999999V14.9771H5.97837V9.98678H7.00751V9.00776H8.98476V9.9789H10.0006V14.9752H15V8.00342H14.0172V9.96519H13.015V9.00625H12.0136V7.99323H11.0083V6.9827H10.0124V3.9933H8.99008V2.95792C8.99008 2.95792 9.68474 2.96253 9.99326 2.96253V1.99065H8.99008V1H7.00648V1.99065H6.00655V2.99836H7.02186L7.02134 3.98593H5.99081C5.99317 4.58091 5.9912 5.17589 5.98922 5.77087C5.98789 6.17237 5.98656 6.57386 5.98656 6.97535H4.99416ZM3.995 11.5045L3.99495 11.864L3.9949 12.4777H3.00979V11.5045H3.995ZM13.0081 11.864L13.0082 11.5045H12.023V12.4777H13.0081L13.0081 11.864ZM7.0219 1.96106H8.97871V2.96877H7.0219V1.96106Z"
                                fill="black"
                              />
                            </svg>
                          </Box>
                        )}
                        <Box p={{ base: 0, md: 2 }}>
                          <Text
                            fontSize={{ base: "xs", md: "md" }}
                            fontWeight={500}
                          >
                            {guildDetails.name}
                          </Text>
                          <Link
                            color="blue"
                            fontSize={{ base: "xs", md: "md" }}
                            href={`https://guild.xyz/${guildDetails.urlName}`}
                            rel="noreferrer"
                            target="_blank"
                          >
                            View Guild <FaExternalLinkAlt />
                          </Link>
                        </Box>
                      </HStack>
                      <Box p={2}>
                        <Text
                          color="#323131"
                          fontSize={{ base: "xs", md: "md" }}
                        >
                          {guildDetails.description}
                        </Text>
                      </Box>
                    </Box>
                    <Text
                      fontSize={{ base: "xs", md: "md" }}
                      textAlign="center"
                    >
                      Click &quot;Next&quot; to add the Guild.xyz bot to your
                      server.
                    </Text>

                    <Text
                      fontSize={{ base: "md", md: "lg" }}
                      fontWeight={600}
                      mt={8}
                      textAlign="center"
                    >
                      Add Guild to Hat Details (optional)
                    </Text>
                    <Text
                      fontSize={{ base: "xs", md: "md" }}
                      textAlign="center"
                    >
                      Add your new Guild.xyz guild to your top hat details.
                      While not necessary, it will automatically keep your
                      Discord-gated authorities up-to-date in the Hats Protocol
                      dashboard.
                    </Text>
                    <Button
                      loading={isUpdatingTopHatDetails}
                      onClick={onUpdateTopHatDetails}
                      size="sm"
                      variant="outline"
                    >
                      Add Guild
                    </Button>
                  </VStack>
                ) : (
                  <VStack spaceY={4}>
                    <Text
                      fontSize={{ base: "xs", md: "md" }}
                      textAlign="center"
                    >
                      In order to connect your tree to Discord, you will need to
                      create a guild on Guild.xyz. Clicking &quot;Create
                      Guild&quot; below will create a guild based on your hat
                      tree&apos;s data. This will require you to sign a message
                      with your wallet.
                    </Text>
                    <Button
                      loading={isCreatingGuild}
                      onClick={onCreateGuild}
                      size="sm"
                      variant="outline"
                    >
                      Create Guild
                    </Button>
                  </VStack>
                )}
              </StepsContent>
              <StepsContent index={2} spaceY={8}>
                <VStack spaceY={2}>
                  <Text fontSize={{ base: "xs", md: "md" }} textAlign="center">
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
                    onCheckedChange={(e) => {
                      setIsBotAdded(!!e.checked);
                      storeInLocalStorage(`botAdded-${address}`, e.checked);
                    }}
                    size={{ base: "xs", md: "md" }}
                    variant="subtle"
                  >
                    I have added the Guild.xyz bot to my server
                  </Checkbox>
                </VStack>
              </StepsContent>
              <StepsContent index={3} spaceY={8}>
                <VStack spaceY={2} textAlign="center">
                  <Text fontSize={{ base: "xs", md: "md" }}>
                    The final step is associating your hat with a Discord role.
                    To do this, you will need your server ID and role ID.
                  </Text>
                  <Text fontSize={{ base: "xs", md: "md" }}>
                    To get your server ID, go to any channel in your Discord
                    server, and copy the first set of numbers in the URL.{" "}
                    <strong>
                      You must have admin privileges in your Discord server.
                    </strong>
                  </Text>
                  <ChakraImage
                    alt="Discord IDs Example"
                    height={{ base: "auto", md: 50 }}
                    src="/discord_ids.png"
                    w={{ base: "100%", md: "auto" }}
                  />
                  <Text fontSize={{ base: "xs", md: "md" }}>
                    To get your Discord role ID, go into any Discord channel and
                    post a message with the role tag preceded by a backslash.
                    For example, if your role is called &quot;Member&quot;, you
                    would type &quot;\@Member&quot; in the channel. When the
                    message posts, it will be replace the role name with the ID
                    number. Copy and paste it below.
                  </Text>
                </VStack>
                <VStack pb={{ base: 0, md: 16 }} spaceY={2}>
                  <Field
                    label="Server ID"
                    invalid={false}
                    errorText="This is error text"
                  >
                    <Input
                      disabled={isCreatingReward}
                      onChange={(e) => setServerId(e.target.value)}
                      value={serverId}
                    />
                  </Field>
                  <Field
                    label="Role ID"
                    invalid={false}
                    errorText="This is error text"
                  >
                    <Input
                      disabled={isCreatingReward}
                      onChange={(e) => setRoleId(e.target.value)}
                      value={roleId}
                    />
                  </Field>
                  <Button
                    disabled={!serverId || !roleId}
                    loading={isCreatingReward}
                    onClick={onCreateReward}
                    size="sm"
                    variant="outline"
                  >
                    Link Role
                  </Button>
                </VStack>
              </StepsContent>
              <StepsCompletedContent h="100%">
                <HStack h="100%" justifyContent="center">
                  <FaCheckCircle color="green" size="40px" />
                  <Text>
                    You have successfully gated Discord through Hats Protocol!
                  </Text>
                </HStack>
              </StepsCompletedContent>
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
