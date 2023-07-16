import { isDetected } from '@thorswap-lib/toolbox-evm';
import { Chain, WalletOption } from '@thorswap-lib/types';

import { getWalletMethodsForChain, XDEFIConfig } from './helpers.js';
import { getXDEFIAddress } from './walletHelpers.js';

const XDEFI_SUPPORTED_CHAINS = [
  Chain.Avalanche,
  Chain.Binance,
  Chain.BinanceSmartChain,
  Chain.Bitcoin,
  Chain.BitcoinCash,
  Chain.Dogecoin,
  Chain.Ethereum,
  Chain.Litecoin,
  Chain.THORChain,
] as const;

const connectXDEFI =
  ({
    addChain,
    config: { covalentApiKey, ethplorerApiKey, utxoApiKey },
  }: {
    addChain: any;
    config: XDEFIConfig;
  }) =>
  async (chains: (typeof XDEFI_SUPPORTED_CHAINS)[number][]) => {
    const promises = chains.map(async (chain) => {
      const address = await getXDEFIAddress(chain);
      const walletMethods = await getWalletMethodsForChain({
        chain,
        utxoApiKey,
        covalentApiKey,
        ethplorerApiKey,
      });

      addChain({
        chain,
        walletMethods: { ...walletMethods, getAddress: () => address },
        wallet: { address, balance: [], walletType: WalletOption.XDEFI },
      });
    });

    await Promise.all(promises);

    return true;
  };

export const xdefiWallet = {
  connectMethodName: 'connectXDEFI' as const,
  connect: connectXDEFI,
  isDetected,
};
