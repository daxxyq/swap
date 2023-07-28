import { Provider } from '@ethersproject/abstract-provider';
import { Signer } from '@ethersproject/abstract-signer';
import { getAddress } from '@ethersproject/address';
import { BigNumber, BigNumberish } from '@ethersproject/bignumber';
import { hexlify } from '@ethersproject/bytes';
import { MaxInt256 } from '@ethersproject/constants';
import { Contract, ContractInterface, PopulatedTransaction } from '@ethersproject/contracts';
import { JsonRpcSigner, Web3Provider } from '@ethersproject/providers';
import { toUtf8Bytes } from '@ethersproject/strings';
import {
  Amount,
  AssetAmount,
  AssetEntity,
  getSignatureAssetFor,
  isGasAsset,
} from '@thorswap-lib/swapkit-entities';
import {
  Asset,
  Chain,
  ContractAddress,
  EIP1559TxParams,
  erc20ABI,
  EVMChain,
  EVMTxParams,
  FeeOption,
  LegacyEVMTxParams,
  WalletOption,
  WalletTxParams,
} from '@thorswap-lib/types';

import {
  ApprovedParams,
  ApproveParams,
  CallParams,
  EstimateCallParams,
  IsApprovedParams,
  JsonFragment,
  TransferParams,
} from '../types/clientTypes.js';

export const MAX_APPROVAL = MaxInt256;

const baseAssetAddress: Record<EVMChain, string> = {
  [Chain.Arbitrum]: ContractAddress.ARB,
  [Chain.Ethereum]: ContractAddress.ETH,
  [Chain.Avalanche]: ContractAddress.AVAX,
  [Chain.BinanceSmartChain]: ContractAddress.BSC,
  [Chain.Polygon]: ContractAddress.MATIC,
  [Chain.Optimism]: ContractAddress.OP,
};

const stateMutable = ['payable', 'nonpayable'];
const nonStateMutable = ['view', 'pure'];

const isEIP1559Transaction = (tx: EVMTxParams) =>
  (tx as EIP1559TxParams).type === 2 ||
  !!(tx as EIP1559TxParams).maxFeePerGas ||
  !!(tx as EIP1559TxParams).maxPriorityFeePerGas;

const isWeb3Provider = (provider: any) => !!provider.provider || !!provider.jsonRpcFetchFunc;
const createContract = (address: string, abi: any, provider: Provider) =>
  new Contract(address, abi, provider);

const validateAddress = (address: string) => {
  try {
    getAddress(address);
    return true;
  } catch (error) {
    return false;
  }
};

const isStateChangingCall = (abi: ContractInterface, functionName: string) => {
  const abiFragment = (abi as JsonFragment[]).find(
    (fragment: any) => fragment.name === functionName,
  );
  if (!abiFragment) throw new Error(`No ABI fragment found for function ${functionName}`);
  return (
    !abiFragment.stateMutability ||
    (stateMutable.includes(abiFragment.stateMutability) &&
      nonStateMutable.includes(abiFragment.stateMutability))
  );
};

const getAssetEntity = (asset: Asset | undefined) =>
  asset
    ? new AssetEntity(asset.chain, asset.symbol, asset.synth, asset.ticker)
    : getSignatureAssetFor(Chain.Ethereum);

type WithSigner<T> = T & { signer?: Signer };

/**
 * @info call contract function
 * When using this method to make a non state changing call to the blockchain, like a isApproved call,
 * the signer needs to be set to undefined
 */
const call = async <T>(
  provider: Provider,
  {
    callProvider,
    signer,
    contractAddress,
    abi,
    funcName,
    funcParams = [],
    txOverrides,
  }: WithSigner<CallParams>,
): Promise<T> => {
  const contractProvider = callProvider || provider;
  if (!contractAddress) throw new Error('contractAddress must be provided');

  const isStateChanging = isStateChangingCall(abi, funcName);

  if (isStateChanging && isWeb3Provider(contractProvider) && signer) {
    const txObject = await createContractTxObject(contractProvider, {
      contractAddress,
      abi,
      funcName,
      funcParams,
      txOverrides,
    });

    return EIP1193SendTransaction(contractProvider, txObject) as Promise<T>;
  }

  const contract = createContract(contractAddress, abi, contractProvider);

  // only use signer if the contract function is state changing
  if (isStateChanging && signer) {
    const address = txOverrides?.from || await signer.getAddress();

    if (!address) throw new Error('No signer address found');

    return contract.connect(signer)[funcName](...funcParams, {
      ...txOverrides,
      /**
       * nonce must be set due to a possible bug with ethers.js,
       * expecting a synchronous nonce while the JsonRpcProvider delivers Promise
       */
      nonce: txOverrides?.nonce || (await contractProvider.getTransactionCount(address)),
    });
  }

  if (isStateChanging && !signer) throw new Error('Signer is not defined');

  const result = await contract[funcName](...funcParams, txOverrides);

  return typeof result?.hash === 'string' ? result?.hash : result;
};

const createContractTxObject = async (
  provider: Provider,
  { contractAddress, abi, funcName, funcParams = [], txOverrides }: CallParams,
) =>
  createContract(contractAddress, abi, provider).populateTransaction[funcName](
    ...funcParams,
    txOverrides,
  );

const approvedAmount = async (
  provider: Provider,
  { assetAddress, spenderAddress, from }: IsApprovedParams,
) =>
  BigNumber.from(
    await call<BigNumberish>(provider, {
      contractAddress: assetAddress,
      abi: erc20ABI,
      funcName: 'allowance',
      funcParams: [from, spenderAddress],
    }),
  ).toString();

const isApproved = async (
  provider: Provider,
  { assetAddress, spenderAddress, from, amount = MAX_APPROVAL }: IsApprovedParams,
) =>
  BigNumber.from(
    await call<BigNumberish>(provider, {
      contractAddress: assetAddress,
      abi: erc20ABI,
      funcName: 'allowance',
      funcParams: [from, spenderAddress],
    }),
  ).gte(amount);

const approve = async (
  provider: Provider,
  {
    assetAddress,
    spenderAddress,
    feeOptionKey = FeeOption.Fast,
    amount = MAX_APPROVAL,
    gasLimitFallback,
    from,
    nonce,
  }: ApproveParams,
  signer?: Signer,
  isEIP1559Compatible = true,
) => {
  if (!amount) throw new Error('amount must be provided');
  const funcParams = [spenderAddress, BigNumber.from(amount)];
  const txOverrides = { from };

  const functionCallParams = {
    contractAddress: assetAddress,
    abi: erc20ABI,
    funcName: 'approve',
    funcParams,
    signer,
    txOverrides,
  };

  if (isWeb3Provider(provider)) {
    return EIP1193SendTransaction(
      provider,
      await createContractTxObject(provider, functionCallParams),
    );
  }

  const { maxFeePerGas, maxPriorityFeePerGas, gasPrice } = (
    await estimateGasPrices(provider, isEIP1559Compatible)
  )[feeOptionKey];

  const gasLimit = await estimateCall(provider, functionCallParams).catch(() =>
    BigNumber.from(gasLimitFallback),
  );

  return call<string>(provider, {
    ...functionCallParams,
    funcParams,
    txOverrides: {
      from,
      maxFeePerGas,
      maxPriorityFeePerGas,
      gasPrice,
      gasLimit,
      nonce,
    },
  });
};

const transfer = async (
  provider: Provider | Web3Provider,
  {
    asset,
    memo,
    amount,
    recipient,
    feeOptionKey = FeeOption.Fast,
    data,
    from,
    ...tx
  }: TransferParams,
  signer?: Signer,
  isEIP1559Compatible = true,
) => {
  const txAmount = amount.amount();
  const parsedAsset: AssetEntity = getAssetEntity(asset);
  const chain = parsedAsset.L1Chain as EVMChain;

  if (!isGasAsset(parsedAsset)) {
    const contractAddress = await getTokenAddress(parsedAsset, chain);
    if (!contractAddress) throw new Error('No contract address found');
    // Transfer ERC20
    return call(provider, {
      signer,
      contractAddress,
      abi: erc20ABI,
      funcName: 'transfer',
      funcParams: [recipient, txAmount],
      txOverrides: { from },
    });
  }

  // Transfer ETH
  const txObject = {
    ...tx,
    from,
    to: recipient,
    value: txAmount,
    data: data || hexlify(toUtf8Bytes(memo || '')),
  };

  return sendTransaction(provider, txObject, feeOptionKey, signer, isEIP1559Compatible);
};

const estimateGasPrices = async (provider: Provider, isEIP1559Compatible = true) => {
  try {
    const { maxFeePerGas, maxPriorityFeePerGas, gasPrice } = await provider.getFeeData();

    switch (isEIP1559Compatible) {
      case true:
        if (!maxFeePerGas || !maxPriorityFeePerGas) throw new Error('No fee data available');

        return {
          [FeeOption.Average]: {
            maxFeePerGas,
            maxPriorityFeePerGas,
          },
          [FeeOption.Fast]: {
            maxFeePerGas: maxFeePerGas.mul(15).div(10),
            maxPriorityFeePerGas: maxPriorityFeePerGas.mul(15).div(10),
          },
          [FeeOption.Fastest]: {
            maxFeePerGas: maxFeePerGas.mul(2),
            maxPriorityFeePerGas: maxPriorityFeePerGas.mul(2),
          },
        };

      case false:
        if (!gasPrice) throw new Error('No fee data available');

        return {
          [FeeOption.Average]: {
            gasPrice,
          },
          [FeeOption.Fast]: {
            gasPrice: gasPrice.mul(15).div(10),
          },
          [FeeOption.Fastest]: {
            gasPrice: gasPrice.mul(2),
          },
        };
    }
  } catch (error) {
    throw new Error(
      `Failed to estimate gas price: ${(error as any).msg ?? (error as any).toString()}`,
    );
  }
};

const estimateCall = async (
  provider: Provider,
  {
    signer,
    contractAddress,
    abi,
    funcName,
    funcParams = [],
    txOverrides,
  }: EstimateCallParams & { signer?: Signer },
) => {
  if (!contractAddress) throw new Error('contractAddress must be provided');

  const contract = createContract(contractAddress, abi, provider);
  return signer
    ? contract.connect(signer).estimateGas[funcName](...funcParams, txOverrides)
    : contract.estimateGas[funcName](...funcParams, txOverrides);
};

const estimateGasLimit = async (
  provider: Provider,
  {
    asset,
    recipient,
    amount,
    memo,
    from,
    funcName,
    funcParams,
    txOverrides,
    signer,
  }: WalletTxParams & {
    funcName?: string;
    funcParams?: unknown[];
    signer?: Signer;
    txOverrides?: EVMTxParams;
  },
) => {
  const value = amount.amount();
  const parsedAsset = getAssetEntity(asset);
  const assetAddress = !isGasAsset(parsedAsset)
    ? getTokenAddress(parsedAsset, parsedAsset.L1Chain as EVMChain)
    : null;

  if (assetAddress && funcName) {
    // ERC20 gas estimate
    return estimateCall(provider, {
      contractAddress: assetAddress,
      abi: erc20ABI,
      funcName,
      funcParams,
      txOverrides,
      signer,
    });
  } else {
    return provider.estimateGas({
      from,
      to: recipient,
      value,
      data: memo ? toUtf8Bytes(memo) : undefined,
    });
  }
};

const sendTransaction = async (
  provider: Provider | Web3Provider,
  tx: EVMTxParams,
  feeOptionKey: FeeOption = FeeOption.Fast,
  signer?: Signer,
  isEIP1559Compatible = true,
) => {
  if (!signer) throw new Error('Signer is not defined');
  const { from, to, data, value, ...transaction } = tx;
  if (!to) throw new Error('No to address provided');

  const parsedTxObject = {
    ...transaction,
    data: data || '0x',
    to,
    from,
    value: BigNumber.from(value || 0).toHexString(),
  };

  // early return to skip gas estimation if provider is EIP-1193
  if (isWeb3Provider(provider)) {
    return EIP1193SendTransaction(provider, parsedTxObject);
  }

  const address = from || (await signer.getAddress());
  const nonce = tx.nonce || (await provider.getTransactionCount(address));
  const chainId = (await provider.getNetwork()).chainId;

  const isEIP1559 = isEIP1559Transaction(tx) || isEIP1559Compatible;

  const feeData =
    (isEIP1559 &&
      (!(tx as EIP1559TxParams).maxFeePerGas || !(tx as EIP1559TxParams).maxPriorityFeePerGas)) ||
    !(tx as LegacyEVMTxParams).gasPrice
      ? Object.entries(
          (await estimateGasPrices(provider, isEIP1559Compatible))[feeOptionKey],
        ).reduce(
          (acc, [k, v]) => ({ ...acc, [k]: BigNumber.from(v).toHexString() }),
          {} as {
            maxFeePerGas?: string;
            maxPriorityFeePerGas?: string;
            gasPrice?: string;
          },
        )
      : {};

  let gasLimit: string;
  try {
    gasLimit = BigNumber.from(
      tx.gasLimit || (await provider.estimateGas(tx)).mul(110).div(100),
    ).toHexString();
  } catch (error) {
    throw new Error(`Error estimating gas limit: ${JSON.stringify(error)}`);
  }

  try {
    const txObject = {
      ...parsedTxObject,
      chainId,
      type: isEIP1559 ? 2 : 0,
      gasLimit,
      nonce,
      ...feeData,
    };

    try {
      const txHex = await signer.signTransaction(txObject);
      const response = await provider.sendTransaction(txHex);

      return typeof response?.hash === 'string' ? response.hash : response;
    } catch (error) {
      const response = await signer.sendTransaction(txObject);

      return typeof response?.hash === 'string' ? response.hash : response;
    }
  } catch (error) {
    throw new Error(`Error sending transaction: ${JSON.stringify(error)}`);
  }
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

const isWeb3Detected = () => {
  return typeof window.ethereum !== 'undefined';
};

/**
 * Exported helper functions
 */
export const getBigNumberFrom = (value: string | number | BigNumber) => BigNumber.from(value);
export const toChecksumAddress = (address: string) => getAddress(address);
export const isDetected = (walletOption: WalletOption) => {
  return listWeb3EVMWallets().includes(walletOption);
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

export const EIP1193SendTransaction = async (
  provider: Provider | Web3Provider,
  { from, to, data, value }: EVMTxParams,
): Promise<string> => {
  if (!isWeb3Provider(provider)) throw new Error('Provider is not EIP-1193 compatible');
  return (provider as Web3Provider).provider?.request?.({
    method: 'eth_sendTransaction',
    params: [{ value: BigNumber.from(value || 0).toHexString(), from, to, data }],
  });
};

export const getChecksumAddressFromAsset = (asset: Asset, chain: EVMChain) => {
  const parsedAsset = getAssetEntity(asset);
  const assetAddress = getTokenAddress(parsedAsset, chain);

  if (assetAddress) {
    return getAddress(assetAddress.toLowerCase());
  }

  throw new Error('invalid gas asset address');
};

export const getTokenAddress = ({ chain, symbol, ticker }: Asset, baseAssetChain: EVMChain) => {
  try {
    if (chain === baseAssetChain && symbol === baseAssetChain && ticker === baseAssetChain) {
      return baseAssetAddress[baseAssetChain];
    }

    // strip 0X only - 0x is still valid
    return getAddress(symbol.slice(ticker.length + 1).replace(/^0X/, ''));
  } catch (err) {
    return null;
  }
};

export const getFeeForTransaction = async (
  txObject: PopulatedTransaction | EIP1559TxParams,
  feeOption: FeeOption,
  provider: Provider | Web3Provider,
  isEIP1559Compatible: boolean,
) => {
  const gasPrices = (await estimateGasPrices(provider, isEIP1559Compatible))[feeOption];
  const gasLimit = await provider.estimateGas(txObject);

  if (!isEIP1559Compatible) {
    return gasPrices.gasPrice!.mul(gasLimit);
  }

  return gasPrices.maxFeePerGas!.add(gasPrices.maxPriorityFeePerGas!).mul(gasLimit);
};

export const estimateMaxSendableAmount = async (
  provider: Provider | Web3Provider,
  {
    from,
    recipient,
    memo = '',
    feeOptionKey = FeeOption.Fastest,
    asset,
    balanceAmount,
    ...rest
  }: WalletTxParams & {
    balanceAmount: Amount;
    funcName?: string;
    funcParams?: unknown[];
  },
  isEIP1559Compatible: boolean,
  signer?: Signer,
) => {
  if (!asset) throw new Error('Asset must be provided');
  const assetEntity = new AssetEntity(asset.chain, asset.symbol, asset.synth, asset.ticker);
  if (
    asset &&
    !getSignatureAssetFor(asset.chain).shallowEq(
      new AssetEntity(asset.chain, asset.symbol, asset.synth, asset.ticker),
    )
  ) {
    return new AssetAmount(assetEntity, balanceAmount);
  }

  const { gasPrice, maxFeePerGas, maxPriorityFeePerGas } = (
    await estimateGasPrices(provider, isEIP1559Compatible)
  )[feeOptionKey];

  const gasLimit = await estimateGasLimit(provider, { from, recipient, memo, signer, ...rest });

  if (!isEIP1559Compatible && !gasPrice) throw new Error('No gas price available');
  if (isEIP1559Compatible && !maxFeePerGas) throw new Error('No maxFeePerGas available');
  const fee = BigNumber.from(gasLimit).mul(
    isEIP1559Compatible ? maxFeePerGas!.add(maxPriorityFeePerGas || 1) : gasPrice!,
  );
  const maxSendableAmount = BigNumber.from(balanceAmount.baseAmount.toString()).sub(fee);

  return new AssetAmount(
    assetEntity,
    Amount.fromBaseAmount(
      maxSendableAmount.gt(0) ? maxSendableAmount.toString() : '0',
      balanceAmount.decimal,
    ),
  );
};

export const BaseEVMToolbox = ({
  provider,
  signer,
  isEIP1559Compatible = true,
}: {
  signer?: Signer | JsonRpcSigner;
  provider: Provider | Web3Provider;
  isEIP1559Compatible?: boolean;
}) => ({
  addAccountsChangedCallback,
  broadcastTransaction: provider.sendTransaction,
  createContract,
  getETHDefaultWallet,
  isDetected,
  isWeb3Detected,
  listWeb3EVMWallets,
  validateAddress,
  approve: (params: ApproveParams) => approve(provider, params, signer, isEIP1559Compatible),
  approvedAmount: (params: ApprovedParams) => approvedAmount(provider, params),
  call: (params: CallParams) => call(provider, { ...params, signer }),
  createContractTxObject: (params: CallParams) => createContractTxObject(provider, params),
  EIP1193SendTransaction: (tx: EIP1559TxParams) => EIP1193SendTransaction(provider, tx),
  estimateGasPrices: () => estimateGasPrices(provider, isEIP1559Compatible),
  estimateCall: (params: EstimateCallParams) => estimateCall(provider, { ...params, signer }),
  estimateGasLimit: ({ asset, recipient, amount, memo }: WalletTxParams) =>
    estimateGasLimit(provider, { asset, recipient, amount, memo, signer }),
  isApproved: (params: IsApprovedParams) => isApproved(provider, params),
  transfer: (params: TransferParams) => transfer(provider, params, signer, isEIP1559Compatible),
  sendTransaction: (params: EIP1559TxParams, feeOption: FeeOption) =>
    sendTransaction(provider, params, feeOption, signer, isEIP1559Compatible),
  /**
   * Estimate fee for transaction
   */
  getFeeForTransaction: (txObject: PopulatedTransaction | EIP1559TxParams, feeOption: FeeOption) =>
    getFeeForTransaction(txObject, feeOption, provider, isEIP1559Compatible),
  estimateMaxSendableAmount: (
    params: WalletTxParams & {
      balanceAmount: Amount;
    },
  ): Promise<AssetAmount> =>
    estimateMaxSendableAmount(provider, params, isEIP1559Compatible, signer),
});
