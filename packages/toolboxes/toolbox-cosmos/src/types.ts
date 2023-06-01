import { OfflineDirectSigner } from '@cosmjs/proto-signing';
import { StdFee } from '@cosmjs/amino';
import { proto } from '@cosmos-client/core';
import { Chain } from '@thorswap-lib/types';

export type CosmosSDKClientParams = {
  server: string;
  chainId: string;
  prefix?: string;
};

export type TransferParams = {
  privkey?: proto.cosmos.crypto.secp256k1.PrivKey | Uint8Array;
  signer?: OfflineDirectSigner;
  from: string;
  to: string;
  amount: string;
  asset: string;
  memo?: string;
  fee?: proto.cosmos.tx.v1beta1.Fee | StdFee;
};

export const AssetAtom = {
  chain: Chain.Cosmos,
  symbol: 'ATOM',
  ticker: 'ATOM',
  synth: false,
};
export const AssetMuon = {
  chain: Chain.Cosmos,
  symbol: 'MUON',
  ticker: 'MUON',
  synth: false,
};

export const AssetRuneNative = {
  chain: Chain.THORChain,
  symbol: 'RUNE',
  ticker: 'RUNE',
};
