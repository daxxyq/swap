import { BaseDecimal, Chain, ChainId, ChainToExplorerUrl } from "@swapkit/helpers";
import type { BrowserProvider, JsonRpcProvider, Signer } from "ethers";

import type { CovalentApiType } from "../api/covalentApi.ts";
import { covalentApi } from "../api/covalentApi.ts";
import { getBalance } from "../index.ts";

import { BaseEVMToolbox } from "./BaseEVMToolbox.ts";

const getNetworkParams = () => ({
  chainId: ChainId.Mantle,
  chainName: "Mantle",
  nativeCurrency: { name: "Mantle", symbol: Chain.Mantle, decimals: BaseDecimal.MNT },
  // Use external rpc URL so wallets don't throw warning to user
  rpcUrls: ["https://mantle.drpc.org"],
  blockExplorerUrls: [ChainToExplorerUrl[Chain.Mantle]],
});

export const MNTToolbox = ({
  api,
  provider,
  signer,
  covalentApiKey,
}: {
  api?: CovalentApiType;
  covalentApiKey: string;
  signer: Signer;
  provider: JsonRpcProvider | BrowserProvider;
}) => {
  const mntApi = api || covalentApi({ apiKey: covalentApiKey, chainId: ChainId.Mantle });
  const baseToolbox = BaseEVMToolbox({ provider, signer });

  return {
    ...baseToolbox,
    getNetworkParams,
    getBalance: (
      address: string,
      potentialScamFilter = true,
      overwriteProvider?: JsonRpcProvider | BrowserProvider,
    ) =>
      getBalance({
        provider: overwriteProvider || provider,
        api: mntApi,
        address,
        chain: Chain.Mantle,
        potentialScamFilter,
      }),
  };
};