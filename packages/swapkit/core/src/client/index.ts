import { AssetValue, type QuoteRoute, SwapKitError } from "@swapkit/helpers";
import { Chain, type QuoteRouteV2 } from "@swapkit/types";
import {
  getExplorerAddressUrl as getAddressUrl,
  getExplorerTxUrl as getTxUrl,
} from "../helpers/explorerUrls.ts";
import type {
  ChainWallet,
  ConnectWalletParamsLocal as ConnectWalletParams,
  SwapWithRouteParams,
} from "../types.ts";

export type PluginName = "thorchain" | "chainflip" | "mayachain";

export enum ApproveMode {
  Approve = "approve",
  CheckOnly = "checkOnly",
}

export type ApproveReturnType<T extends ApproveMode> = T extends "checkOnly" ? boolean : string;

type SwapKitPlugins = {
  [K in PluginName]?: PluginMethods;
};

export type SwapParams<T extends QuoteRoute | QuoteRouteV2 = QuoteRoute> =
  SwapWithRouteParams<T> & {
    provider?: {
      name: PluginName;
      config: Record<string, any>;
    };
  };

export type SwapKitReturnType = SwapKitPlugins & {
  getAddress: (chain: Chain) => string;
  getWallet: (chain: Chain) => ChainWallet<Chain> | undefined;
  getWalletWithBalance: (
    chain: Chain,
    potentialScamFilter?: boolean,
  ) => Promise<ChainWallet<Chain>>;
  getBalance: (chain: Chain, potentialScamFilter?: boolean) => AssetValue[];
  getExplorerTxUrl: (chain: Chain, txHash: string) => string;
  getExplorerAddressUrl: (chain: Chain, address: string) => string;
  swap: (params: SwapParams) => Promise<string>;
  validateAddress: (params: { address: string; chain: Chain }) =>
    | boolean
    | Promise<boolean>
    | undefined;
  approveAssetValue: (assetValue: AssetValue, contractAddress: string) => boolean | Promise<string>;
  isAssetValueApproved: (
    assetValue: AssetValue,
    contractAddress: string,
  ) => boolean | Promise<boolean>;
};

export type Wallets = { [K in Chain]?: ChainWallet<K> };
export type availablePlugins<T> = T | { [K in PluginName]?: PluginMethods };
export type PluginMethods = {
  swap: (swapParams: SwapParams) => Promise<string>;
  getSpender?: (chain: Chain) => Promise<string>;
  [key: string]: any;
};

export type SwapKitPlugin = ({ wallets, stagenet }: { wallets: Wallets; stagenet?: boolean }) => {
  name: PluginName;
  methods: PluginMethods;
};

export type SwapKitWallet = {
  connectMethodName: string;
  connect: (params: ConnectWalletParams) => (connectParams: any) => void;
};

export function SwapKit<
  ExtendedPlugins extends {},
  ConnectWalletMethods extends Record<string, ReturnType<SwapKitWallet["connect"]>>,
>({
  stagenet,
  wallets,
  plugins,
  config = {},
  apis,
  rpcUrls,
}: {
  plugins: SwapKitPlugin[];
  stagenet: boolean;
  wallets: SwapKitWallet[];
  config?: Record<string, any>;
  apis: Record<string, any>;
  rpcUrls: Record<string, any>;
}): SwapKitReturnType & ConnectWalletMethods & availablePlugins<ExtendedPlugins> {
  const connectedWallets: Wallets = {};
  const availablePlugins: availablePlugins<ExtendedPlugins> = {};

  for (const plugin of plugins) {
    const { name, methods } = plugin({ wallets: connectedWallets, stagenet });

    availablePlugins[name] = methods;
  }

  const connectWalletMethods = wallets.reduce((acc, wallet) => {
    (acc[wallet.connectMethodName] as ReturnType<SwapKitWallet["connect"]>) = wallet.connect({
      addChain,
      config,
      apis,
      rpcUrls,
    });

    return acc;
  }, {} as ConnectWalletMethods);

  /**
   * @Private
   * Internal helpers
   */
  function getSwapKitPlugin(pluginName?: PluginName) {
    const plugin =
      (availablePlugins as SwapKitPlugins)[pluginName as PluginName] ||
      Object.values(availablePlugins)[0];

    if (!plugin) {
      throw new SwapKitError("core_plugin_not_found", "Could not find the requested plugin");
    }

    return plugin;
  }

  function addChain(connectWallet: ChainWallet<Chain>) {
    (connectedWallets[connectWallet.chain as Chain] as ChainWallet<Chain>) = connectWallet;
  }

  /**
   * @Private
   * Wallet interaction helpers
   */
  async function approve<T extends ApproveMode>({
    assetValue,
    type = "checkOnly" as T,
    contractAddressOrPlugin,
  }: {
    type: T;
    assetValue: AssetValue;
    contractAddressOrPlugin: string;
  }): Promise<ApproveReturnType<T>> {
    const { address, chain, isGasAsset, isSynthetic } = assetValue;
    const isEVMChain = [Chain.Ethereum, Chain.Avalanche, Chain.BinanceSmartChain].includes(chain);
    const isNativeEVM = isEVMChain && isGasAsset;

    if (isNativeEVM || !isEVMChain || isSynthetic) {
      return Promise.resolve(type === "checkOnly" ? true : "approved") as Promise<
        ApproveReturnType<T>
      >;
    }

    const walletMethods =
      connectedWallets[chain as Chain.Ethereum | Chain.BinanceSmartChain | Chain.Avalanche];

    const walletAction = type === "checkOnly" ? walletMethods?.isApproved : walletMethods?.approve;

    if (!walletAction) throw new SwapKitError("core_wallet_connection_not_found");

    const from = getAddress(chain);

    if (!(address && from)) throw new SwapKitError("core_approve_asset_address_or_from_not_found");

    const spenderAddress =
      contractAddressOrPlugin in availablePlugins &&
      getSwapKitPlugin(contractAddressOrPlugin as PluginName).getSpender
        ? // @ts-expect-error cant infer
          await getSwapKitPlugin(contractAddressOrPlugin as PluginName).getSpender(assetValue.chain)
        : contractAddressOrPlugin;

    return walletAction({
      amount: assetValue.getBaseValue("bigint"),
      assetAddress: address,
      from,
      spenderAddress,
    }) as Promise<ApproveReturnType<T>>;
  }

  /**
   * @Public
   * Wallet helpers
   */
  function getWallet(chain: Chain) {
    return connectedWallets[chain];
  }
  function getAddress(chain: Chain) {
    return getWallet(chain)?.address || "";
  }
  function getBalance(chain: Chain) {
    return getWallet(chain)?.balance || [];
  }
  function getExplorerTxUrl(chain: Chain, txHash: string) {
    return getTxUrl({ chain, txHash });
  }
  function getExplorerAddressUrl(chain: Chain, address: string) {
    return getAddressUrl({ chain, address });
  }
  /**
   * TODO: Figure out validation without connecting to wallet
   */
  function validateAddress({ address, chain }: { address: string; chain: Chain }) {
    return getWallet(chain)?.validateAddress?.(address);
  }

  async function getWalletWithBalance(chain: Chain, potentialScamFilter?: boolean) {
    const defaultBalance = [AssetValue.fromChainOrSignature(chain)];
    const wallet = getWallet(chain);

    try {
      if (!wallet) throw new SwapKitError("core_wallet_connection_not_found");
      const balance = await wallet?.getBalance(wallet.address, potentialScamFilter);

      wallet.balance = balance?.length ? balance : defaultBalance;

      return wallet;
    } catch (error) {
      throw new SwapKitError("core_wallet_connection_not_found", error);
    }
  }

  function approveAssetValue(assetValue: AssetValue, contractAddressOrPlugin: string) {
    return approve({
      assetValue,
      contractAddressOrPlugin,
      type: ApproveMode.Approve,
    });
  }

  function isAssetValueApproved(assetValue: AssetValue, contractAddressOrPlugin: string) {
    return approve({
      assetValue,
      contractAddressOrPlugin,
      type: ApproveMode.CheckOnly,
    });
  }

  function swap({ provider, ...rest }: SwapParams) {
    if (!("route" in rest)) throw new SwapKitError("core_swap_invalid_params");

    const plugin = getSwapKitPlugin(provider?.name);

    return plugin.swap({ provider, ...rest });
  }

  return {
    ...availablePlugins,
    ...connectWalletMethods,
    approveAssetValue,
    getAddress,
    getBalance,
    getExplorerAddressUrl,
    getExplorerTxUrl,
    getWallet,
    getWalletWithBalance,
    isAssetValueApproved,
    swap,
    validateAddress,
  };
}
