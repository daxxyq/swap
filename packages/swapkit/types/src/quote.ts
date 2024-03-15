import type { ChainId } from "./network.ts";

// TODO remove after OSS of provider package
export enum ProviderName {
  CHAINFLIP = "CHAINFLIP",
  TRADERJOE_V1 = "TRADERJOE_V1",
  PANGOLIN_V1 = "PANGOLIN_V1",
  UNISWAP_V2 = "UNISWAP_V2",
  THORCHAIN = "THORCHAIN",
  MAYACHAIN = "MAYACHAIN",
  ONEINCH = "ONEINCH",
  SUSHISWAP_V2 = "SUSHISWAP_V2",
  WOOFI_V2 = "WOOFI_V2",
}

export enum FeeType {
  NETWORK = "NETWORK",
  INBOUND = "INBOUND",
  OUTBOUND = "OUTBOUND",
  LIQUIDITY = "LIQUIDITY",
  AFFILIATE = "AFFILIATE",
}

export type Fee = {
  type: FeeType;
  amount: string;
  asset: string;
  chain: ChainId;
  provider: ProviderName;
};

export type leg = {
  buyAsset: string;
  buyAmount: string;
  buyAmountUSD: string;
  destinationAddress: string;
  fees: Fee[];
  provider: ProviderName;
  sellAsset: string;
  sellAmount: number;
  sellAmountUSD: number;
  sourceAddress: string;
};

export type EVMTransactionDetails = {
  contractAddress: string;
  contractMethod: string;
  contractParams: (number | string)[];
  contractParamsStreaming: (number | string)[];
  contractParamsNames: string[];
  approvalToken: undefined | string; // not set in case of gas asset
  approvalSpender: undefined | string; // not set in case of gas asset
};

export type QuoteRouteV2 = {
  buyAsset: string;
  expectedBuyAmount: string;
  expectedBuyAmountUSD: string;
  destinationAddress: string;
  sellAsset: string;
  sellAmount: string;
  evmTransactionDetails: undefined | EVMTransactionDetails;
  memo: undefined | EVMTransactionDetails;
  sourceAddress: string;
};
