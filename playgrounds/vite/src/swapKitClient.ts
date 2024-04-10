import { ChainflipPlugin } from "@swapkit/chainflip";
import { SwapKit } from "@swapkit/core";
import { ThorchainPlugin } from "@swapkit/thorchain";
import { coinbaseWallet } from "@swapkit/wallet-coinbase";
import { evmWallet } from "@swapkit/wallet-evm-extensions";
import { keepkeyWallet } from "@swapkit/wallet-keepkey";
import { keplrWallet } from "@swapkit/wallet-keplr";
import { keystoreWallet } from "@swapkit/wallet-keystore";
import { ledgerWallet } from "@swapkit/wallet-ledger";
import { okxWallet } from "@swapkit/wallet-okx";
import { trezorWallet } from "@swapkit/wallet-trezor";
import { walletconnectWallet } from "@swapkit/wallet-wc";
import { xdefiWallet } from "@swapkit/wallet-xdefi";

const wallets = {
  ...evmWallet,
  ...keepkeyWallet,
  ...keplrWallet,
  ...keystoreWallet,
  ...ledgerWallet,
  ...okxWallet,
  ...trezorWallet,
  ...walletconnectWallet,
  ...xdefiWallet,
  ...coinbaseWallet,
} as const;

const plugins = {
  ...ThorchainPlugin,
  chainflip: { ...ChainflipPlugin.chainflip, config: { brokerEndpoint: "" } },
} as const;

type Client = ReturnType<typeof SwapKit<typeof plugins, typeof wallets>>;

const clientCache = new Map<string, Client>();

export const getSwapKitClient = (
  params: {
    ethplorerApiKey?: string;
    covalentApiKey?: string;
    blockchairApiKey?: string;
    walletConnectProjectId?: string;
    stagenet?: boolean;
  } = {},
) => {
  const key = JSON.stringify(params);

  if (clientCache.has(key)) {
    return clientCache.get(key);
  }

  const client = SwapKit({
    stagenet: params.stagenet,
    plugins,
    wallets,
    config: {
      ...params,
      keepkeyConfig: {
        apiKey: localStorage.getItem("keepkeyApiKey") || "1234",
        pairingInfo: {
          name: "swapKit-demo-app",
          imageUrl:
            "https://repository-images.githubusercontent.com/587472295/feec8a61-39b2-4615-b293-145e97f49b5a",
          basePath: "http://localhost:1646/spec/swagger.json",
          url: "http://localhost:1646",
        },
      },
    },
  });

  clientCache.set(key, client);

  return client;
};
