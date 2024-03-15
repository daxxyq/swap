import {
  type ChainWallet,
  type CoreTxParams,
  EVMChains,
  type EVMWallet,
  type SwapParams,
  type ThorchainWallet,
} from "@swapkit/core";
import type { ErrorKeys } from "@swapkit/helpers";
import { AssetValue, SwapKitError } from "@swapkit/helpers";
import type { ETHToolbox } from "@swapkit/toolbox-evm";
import type { EVMChain } from "@swapkit/types";
import { Chain, MayaEthereumVaultAbi, type QuoteRouteV2 } from "@swapkit/types";
import { getInboundData } from "./node.ts";

type Wallets = { [K in Chain]?: ChainWallet<K> };

const validateAddressType = ({
  chain,
  address,
}: {
  chain: Chain;
  address?: string;
}) => {
  if (!address) return false;

  switch (chain) {
    case Chain.Bitcoin:
      // filter out taproot addresses
      return !address.startsWith("bc1p");
    default:
      return true;
  }
};

const getAddress = (wallets: Wallets, chain: Chain) => wallets[chain]?.address || "";

const prepareTxParams = (
  wallets: Wallets,
  { assetValue, ...restTxParams }: CoreTxParams & { router?: string },
) => ({
  ...restTxParams,
  memo: restTxParams.memo || "",
  from: getAddress(wallets, assetValue.chain),
  assetValue,
});

export const MayaPlugin = ({
  wallets,
  stagenet = false,
}: {
  wallets: Wallets;
  stagenet?: boolean;
}) => {
  async function deposit({
    assetValue,
    recipient,
    router,
    ...rest
  }: CoreTxParams & { router?: string }): Promise<string> {
    const { chain, symbol, ticker } = assetValue;
    const walletInstance = wallets[chain];
    const isAddressValidated = await validateAddressType({
      address: walletInstance?.address,
      chain,
    });

    if (!isAddressValidated) {
      throw new SwapKitError("core_transaction_invalid_sender_address");
    }

    if (!walletInstance) throw new SwapKitError("core_wallet_connection_not_found");

    const params = prepareTxParams(wallets, {
      assetValue,
      recipient,
      router,
      ...rest,
    });

    try {
      switch (chain) {
        case Chain.THORChain:
        case Chain.Maya: {
          const wallet = walletInstance as ThorchainWallet;
          return await (recipient === "" ? wallet.deposit(params) : wallet.transfer(params));
        }

        case Chain.Ethereum: {
          const { getChecksumAddressFromAsset } = await import("@swapkit/toolbox-evm");

          const abi = MayaEthereumVaultAbi;

          const response = await (walletInstance as EVMWallet<typeof ETHToolbox>).call({
            abi,
            contractAddress:
              router || ((await getInboundDataByChain(chain as EVMChain)).router as string),
            funcName: "depositWithExpiry",
            funcParams: [
              recipient,
              getChecksumAddressFromAsset({ chain, symbol, ticker }, chain),
              assetValue.getBaseValue("string"),
              params.memo,
              rest.expiration ||
                Number.parseInt(`${(new Date().getTime() + 15 * 60 * 1000) / 1000}`),
            ],
            txOverrides: {
              from: params.from,
              value: assetValue.isGasAsset ? assetValue.getBaseValue("bigint") : undefined,
            },
          });

          return response as string;
        }

        default: {
          if (walletInstance) {
            return walletInstance.transfer(params);
          }
          throw new SwapKitError("core_wallet_connection_not_found");
        }
      }
    } catch (error: any) {
      const errorMessage =
        typeof error === "string" ? error.toLowerCase() : error?.message.toLowerCase();
      const isInsufficientFunds = errorMessage?.includes("insufficient funds");
      const isGas = errorMessage?.includes("gas");
      const isServer = errorMessage?.includes("server");
      const isUserRejected = errorMessage?.includes("user rejected");
      const errorKey: ErrorKeys = isInsufficientFunds
        ? "core_transaction_deposit_insufficient_funds_error"
        : isGas
          ? "core_transaction_deposit_gas_error"
          : isServer
            ? "core_transaction_deposit_server_error"
            : isUserRejected
              ? "core_transaction_user_rejected"
              : "core_transaction_deposit_error";

      throw new SwapKitError(errorKey, error);
    }
  }

  async function swap({ route, ...rest }: SwapParams<QuoteRouteV2>) {
    if (!route.sellAsset) throw new SwapKitError("core_swap_asset_not_recognized");
    const assetValue = await AssetValue.fromString(route.sellAsset, route.sellAmount);
    if (!assetValue) throw new SwapKitError("core_swap_asset_not_recognized");

    const isEVMChain = EVMChains.includes(assetValue.chain as EVMChain);
    const { address: recipient } = await getInboundDataByChain(assetValue.chain);
    const { evmTransactionDetails } = route;

    if (!(isEVMChain && evmTransactionDetails)) {
      return deposit({
        assetValue,
        recipient,
        memo: route.memo || "",
        from: route.sourceAddress,
        feeOptionKey: rest.feeOptionKey,
      });
    }

    const wallet = wallets[assetValue.chain] as EVMWallet<typeof ETHToolbox>;

    if (!wallet) throw new SwapKitError("core_wallet_connection_not_found");

    return wallet.call({
      abi: MayaEthereumVaultAbi,
      contractAddress: evmTransactionDetails.contractAddress,
      funcName: evmTransactionDetails.contractMethod,
      funcParams: evmTransactionDetails.contractParams,
      txOverrides: {
        from: route.sourceAddress,
        value: assetValue.isGasAsset ? assetValue.getBaseValue("bigint") : undefined,
      },
      feeOption: rest.feeOptionKey,
    });
  }

  async function getApprovalTarget({
    assetValue,
  }: {
    assetValue: AssetValue;
  }) {
    return (await getInboundDataByChain(assetValue.chain)).router as string;
  }

  async function getInboundDataByChain(chain: Chain) {
    switch (chain) {
      case Chain.Maya:
      case Chain.THORChain:
        return { gas_rate: "0", router: "", address: "", halted: false, chain };

      default: {
        const inboundData = await getInboundData(Chain.Maya, stagenet);
        const chainAddressData = inboundData.find((item) => item.chain === chain);

        if (!chainAddressData) throw new SwapKitError("core_inbound_data_not_found");
        if (chainAddressData?.halted) throw new SwapKitError("core_chain_halted");

        return chainAddressData;
      }
    }
  }

  return {
    name: "mayachain",
    methods: {
      deposit,
      swap,
      getApprovalTarget,
      getInboundDataByChain,
    },
  };
};
