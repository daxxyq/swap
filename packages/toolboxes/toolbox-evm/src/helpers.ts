import { AssetValue, SwapKitNumber } from '@thorswap-lib/swapkit-helpers';
import { Chain, ChainId, ChainToHexChainId, FeeOption, WalletOption } from '@thorswap-lib/types';
import type { BrowserProvider, Eip1193Provider } from 'ethers';

import type { EVMMaxSendableAmountsParams } from './index.ts';
import { AVAXToolbox, BSCToolbox, ETHToolbox } from './index.ts';

type NetworkParams = {
  chainId: ChainId;
  chainName: string;
  nativeCurrency: {
    name: string;
    symbol: string;
    decimals: number;
  };
  rpcUrls: string[];
  blockExplorerUrls: string[];
};

type ProviderRequestParams = {
  provider?: BrowserProvider;
  params?: any;
  method:
    | 'wallet_addEthereumChain'
    | 'wallet_switchEthereumChain'
    | 'eth_requestAccounts'
    | 'eth_sendTransaction'
    | 'eth_signTransaction';
};

const methodsToWrap = [
  'approve',
  'approvedAmount',
  'call',
  'sendTransaction',
  'transfer',
  'getBalance',
  'isApproved',
  'approvedAmount',
  'EIP1193SendTransaction',
  'getFeeData',
  'broadcastTransaction',
  'estimateCall',
  'estimateGasLimit',
  'estimateGasPrices',
  'createContractTxObject',
];

export const prepareNetworkSwitch = <T extends { [key: string]: (...args: any[]) => any }>({
  toolbox,
  chainId,
  provider = window.ethereum,
}: {
  toolbox: T;
  chainId: ChainId;
  provider?: BrowserProvider;
}) => {
  const wrappedMethods = methodsToWrap.reduce((object, methodName) => {
    if (!toolbox[methodName]) return object;
    const method = toolbox[methodName];

    return {
      ...object,
      [methodName]: wrapMethodWithNetworkSwitch<typeof method>(method, provider, chainId),
    };
  }, {});

  return { ...toolbox, ...wrappedMethods };
};

export const wrapMethodWithNetworkSwitch = <T extends (...args: any[]) => any>(
  func: T,
  provider: BrowserProvider,
  chainId: ChainId,
) =>
  (async (...args: any[]) => {
    try {
      await switchEVMWalletNetwork(provider, chainId);
    } catch (error) {
      throw new Error(`Failed to switch network: ${error}`);
    }
    return func(...args);
  }) as unknown as T;

const providerRequest = async ({ provider, params, method }: ProviderRequestParams) => {
  if (!provider?.send) throw new Error('Provider not found');

  const providerParams = params ? (Array.isArray(params) ? params : [params]) : [];
  return provider.send(method, providerParams);
};

export const addEVMWalletNetwork = (provider: BrowserProvider, networkParams: NetworkParams) =>
  providerRequest({ provider, method: 'wallet_addEthereumChain', params: [networkParams] });

export const switchEVMWalletNetwork = (provider: BrowserProvider, chainId = ChainId.EthereumHex) =>
  providerRequest({ provider, method: 'wallet_switchEthereumChain', params: [{ chainId }] });

export const getWeb3WalletMethods = async ({
  ethereumWindowProvider,
  chain,
  covalentApiKey,
  ethplorerApiKey,
}: {
  ethereumWindowProvider: Eip1193Provider | undefined;
  chain: Chain;
  covalentApiKey?: string;
  ethplorerApiKey?: string;
}) => {
  if (!ethereumWindowProvider) throw new Error('Requested web3 wallet is not installed');

  if (
    (chain !== Chain.Ethereum && !covalentApiKey) ||
    (chain === Chain.Ethereum && !ethplorerApiKey)
  ) {
    throw new Error(`Missing API key for ${chain} chain`);
  }

  const { BrowserProvider } = await import('ethers/providers');

  const provider = new BrowserProvider(ethereumWindowProvider, 'any');

  const toolboxParams = {
    provider,
    signer: await provider.getSigner(),
    ethplorerApiKey: ethplorerApiKey as string,
    covalentApiKey: covalentApiKey as string,
  };

  const toolbox =
    chain === Chain.Ethereum
      ? ETHToolbox(toolboxParams)
      : chain === Chain.Avalanche
      ? AVAXToolbox(toolboxParams)
      : BSCToolbox(toolboxParams);

  try {
    chain !== Chain.Ethereum &&
      (await addEVMWalletNetwork(
        provider,
        (
          toolbox as ReturnType<typeof AVAXToolbox> | ReturnType<typeof BSCToolbox>
        ).getNetworkParams(),
      ));
  } catch (error) {
    throw new Error(`Failed to add/switch ${chain} network: ${chain}`);
  }
  return prepareNetworkSwitch<typeof toolbox>({
    toolbox: { ...toolbox },
    chainId: ChainToHexChainId[chain],
    provider,
  });
};

export const estimateMaxSendableAmount = async ({
  toolbox,
  from,
  memo = '',
  feeOptionKey = FeeOption.Fastest,
  asset,
  abi,
  funcName,
  funcParams,
  contractAddress,
  txOverrides,
}: EVMMaxSendableAmountsParams) => {
  const assetEntity =
    //TODO fix typing
    typeof asset === 'string' ? await AssetValue.fromIdentifier(asset as any) : asset;
  const balance = (await toolbox.getBalance(from)).find((balance) =>
    assetEntity
      ? balance.symbol === assetEntity.symbol
      : balance.symbol === AssetValue.fromChainOrSignature(balance.chain)?.symbol,
  );

  if (!balance) return new SwapKitNumber(0);

  if (
    assetEntity &&
    (balance.chain !== assetEntity.chain || balance.symbol !== assetEntity?.symbol)
  ) {
    return balance;
  }

  if ([abi, funcName, funcParams, contractAddress].some((param) => !param)) {
    throw new Error('Missing required parameters for smart contract estimateMaxSendableAmount');
  }

  const gasLimit =
    abi && funcName && funcParams && contractAddress
      ? await toolbox.estimateCall({
          contractAddress,
          abi,
          funcName,
          funcParams,
          txOverrides,
        })
      : await toolbox.estimateGasLimit({
          from,
          recipient: from,
          memo,
          // TODO fix typing
          //@ts-expect-error
          amount: new SwapKitNumber({ value: '1', decimal: 18 }),
        });

  const fees = (await toolbox.estimateGasPrices())[feeOptionKey];

  const isFeeEIP1559Compatible = 'maxFeePerGas' in fees;
  const isFeeEVMLegacyCompatible = 'gasPrice' in fees;

  if (!isFeeEVMLegacyCompatible && !isFeeEIP1559Compatible)
    throw new Error('Could not fetch fee data');

  const fee =
    gasLimit *
    (isFeeEIP1559Compatible
      ? fees.maxFeePerGas! + (fees.maxPriorityFeePerGas! || 1n)
      : fees.gasPrice!);
  const maxSendableAmount = SwapKitNumber.fromBigInt(balance.baseValueBigInt).sub(fee.toString());

  return AssetValue.fromChainOrSignature(balance.chain, maxSendableAmount.value);
};

export const addAccountsChangedCallback = (callback: () => void) => {
  window.ethereum?.on('accountsChanged', () => callback());
  window.xfi?.ethereum.on('accountsChanged', () => callback());
};

export const getETHDefaultWallet = () => {
  const { isTrust, isBraveWallet, __XDEFI, overrideIsMetaMask, selectedProvider } =
    window?.ethereum || {};
  if (isTrust) return WalletOption.TRUSTWALLET_WEB;
  if (isBraveWallet) return WalletOption.BRAVE;
  if (overrideIsMetaMask && selectedProvider?.isCoinbaseWallet) return WalletOption.COINBASE_WEB;
  if (__XDEFI) WalletOption.XDEFI;
  return WalletOption.METAMASK;
};

export const isDetected = (walletOption: WalletOption) => {
  return listWeb3EVMWallets().includes(walletOption);
};

const listWeb3EVMWallets = () => {
  const metamaskEnabled = window?.ethereum && !window.ethereum?.isBraveWallet;
  const xdefiEnabled = window?.xfi || window?.ethereum?.__XDEFI;
  const braveEnabled = window?.ethereum?.isBraveWallet;
  const trustEnabled = window?.ethereum?.isTrust || window?.trustwallet;
  const coinbaseEnabled =
    (window?.ethereum?.overrideIsMetaMask &&
      window?.ethereum?.selectedProvider?.isCoinbaseWallet) ||
    window?.coinbaseWalletExtension;

  const wallets = [];
  if (metamaskEnabled) wallets.push(WalletOption.METAMASK);
  if (xdefiEnabled) wallets.push(WalletOption.XDEFI);
  if (braveEnabled) wallets.push(WalletOption.BRAVE);
  if (trustEnabled) wallets.push(WalletOption.TRUSTWALLET_WEB);
  if (coinbaseEnabled) wallets.push(WalletOption.COINBASE_WEB);

  return wallets;
};

export const isWeb3Detected = () => {
  return typeof window.ethereum !== 'undefined';
};
