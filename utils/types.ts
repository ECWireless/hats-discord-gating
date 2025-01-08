export type GuildDetails = {
  description: string;
  guildRoleId: number;
  id: number;
  imageUrl: string;
  name: string;
  urlName: string;
};

export type HatDetails = {
  decimalId: bigint;
  description: string;
  imageUrl: string;
  ipId: string;
  name: string;
  topHatDescription: string;
  topHatName: string;
  wearers: string[];
};
