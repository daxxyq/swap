import { ApiUrl } from '@thorswap-lib/types';

import type { ApiParams, CachedPricesParams, CachedPricesResponse } from './types/index.ts';

type RequestConfig = {
  onError?: (error: any) => void;
  headers?: Record<string, string>;
};

const paramsToString = (params: { [key: string]: any }) => {
  if ('recipientAddress' in params && params.recipientAddress) {
    params.recipientAddress = params.recipientAddress.replace(/(bchtest:|bitcoincash:)/, '');
  }

  return new URLSearchParams(params).toString();
};

/**
 * Api Wrapper helpers
 */
export const ApiEndpoints = {
  CachedPrices: `${ApiUrl.ThorswapApi}/tokenlist/cached-price`,
  GasRates: `${ApiUrl.ThorswapApi}/resource-worker/gasPrice/getAll`,
  Quote: `${ApiUrl.ThorswapApi}/aggregator/tokens/quote`,
  Txn: `${ApiUrl.ThorswapApi}/apiusage/v2/txn`,
  TokenlistProviders: `${ApiUrl.ThorswapApi}/tokenlist/providers`,
  TokenList: `${ApiUrl.ThorswapStatic}/token-list`,
  Thorname: `${ApiUrl.ThorswapApi}/thorname`,
};

const postWrapper = <T>(url: string, params: ApiParams | string, config?: RequestConfig) =>
  fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', ...(config?.headers || {}) },
    body: typeof params === 'string' ? params : paramsToString(params),
  }).then((res) => res.json() as Promise<T>);

export const fetchWrapper = <T>(url: string, params?: ApiParams, config?: RequestConfig) =>
  fetch(`${url}${params ? `?${paramsToString(params)}` : ''}`)
    .then((res) => res.json() as Promise<T>)
    .catch((error) => {
      console.error(error);
      config?.onError?.(error);
      return Promise.reject(error);
    });

export const getCachedPrices = ({ tokens, ...options }: CachedPricesParams) => {
  const body = new URLSearchParams();
  tokens
    .filter((token, index, sourceArr) => sourceArr.findIndex((t) => t === token) === index)
    .forEach((token) => body.append('tokens', JSON.stringify(token)));

  if (options.metadata) body.append('metadata', 'true');
  if (options.lookup) body.append('lookup', 'true');
  if (options.sparkline) body.append('sparkline', 'true');

  return postWrapper<CachedPricesResponse[]>(ApiEndpoints.CachedPrices, body.toString(), {
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
  });
};
