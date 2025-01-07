const IPFS_GATEWAYS = [
  `https://ipfs.io`,
  `https://w3s.link`,
  `https://cloudflare-ipfs.com`,
  `https://dweb.link`,
  `https://flk-ipfs.xyz`,
];

/**
 * Given a URI that may be ipfs, ipns, http, https, ar, or data protocol, return the fetch-able http(s) URLs for the same content
 * @param uri to convert to fetch-able http url
 */
export const uriToHttp = (uri: string): string[] => {
  try {
    const protocol = uri.split(":")[0].toLowerCase();
    switch (protocol) {
      case "blob":
        return [uri];
      case "data":
        return [uri];
      case "https":
        return [uri];
      case "http":
        return ["https" + uri.substring(4), uri];
      case "ipfs": {
        const hash = uri.match(/^ipfs:(\/\/)?(.*)$/i)?.[2];
        return IPFS_GATEWAYS.map((g) => `${g}/ipfs/${hash}`);
      }
      case "ipns": {
        const name = uri.match(/^ipns:(\/\/)?(.*)$/i)?.[2];
        return IPFS_GATEWAYS.map((g) => `${g}/ipns/${name}`);
      }
      case "ar": {
        const tx = uri.match(/^ar:(\/\/)?(.*)$/i)?.[2];
        return [`https://arweave.net/${tx}`];
      }
      default:
        return [""];
    }
  } catch (e) {
    console.error(e);
    return [""];
  }
};
