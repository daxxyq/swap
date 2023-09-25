import { StargateClient } from '@cosmjs/stargate';
// @ts-ignore
import { addressInfoForCoin } from '@pioneer-platform/pioneer-coins';
import { AssetAtom, GaiaToolbox, getDenom } from '@thorswap-lib/toolbox-cosmos';
import type { TxParams } from '@thorswap-lib/types';
import { Chain, RPCUrl } from '@thorswap-lib/types';

export type SignTransactionTransferParams = {
  asset: string;
  amount: any;
  to: string;
  from: string;
  memo: string | undefined;
};

type CosmosWalletMethodsParams = {
  wallet: any;
  api?: any;
};

export const cosmosWalletMethods: any = async function (params: CosmosWalletMethodsParams) {
  try {
    let { wallet, api } = params;
    const toolbox = GaiaToolbox({ server: api });
    const getAddress = async () =>
      await wallet.cosmosGetAddress({
        addressNList: addressInfoForCoin(Chain.Cosmos, false).address_n,
      });

    let signTransactionTransfer = async function (params: SignTransactionTransferParams) {
      try {
        const { amount, to, from, memo } = params;
        const accountInfo = await toolbox.getAccount(from);

        const body = {
          signDoc: {
            // TODO: Have gas passed in as a param, ideally a value from a real-time API
            fee: {
              gas: '290000',
              amount: [
                {
                  denom: 'uatom',
                  amount: '5000',
                },
              ],
            },
            msgs: [
              {
                value: {
                  amount: [
                    {
                      denom: 'uatom',
                      amount,
                    },
                  ],
                  to_address: to,
                  from_address: from,
                },
                type: 'cosmos-sdk/MsgSend',
              },
            ],
            memo,
            sequence: accountInfo?.sequence.toString(),
            chain_id: 'cosmoshub-4',
            account_number: accountInfo?.accountNumber.toString(),
          },
          signerAddress: from,
        };

        // @ts-ignore
        const keepKeySignedTx = await wallet.cosmosSignTx(body);

        const decodedBytes = atob(keepKeySignedTx.serialized);
        const uint8Array = new Uint8Array(decodedBytes.length);
        for (let i = 0; i < decodedBytes.length; i++) {
          uint8Array[i] = decodedBytes.charCodeAt(i);
        }

        const client = await StargateClient.connect(RPCUrl.Cosmos);
        const response = await client.broadcastTx(uint8Array);

        return response.transactionHash;
      } catch (e) {
        console.error(e);
        throw e;
      }
    };

    const transfer = async ({ asset, amount, recipient, memo }: TxParams) => {
      let from = await getAddress();
      const response = await signTransactionTransfer({
        from,
        to: recipient,
        asset: getDenom(asset || AssetAtom),
        amount: amount.amount().toString(),
        memo,
      });

      return response;
    };

    return {
      ...toolbox,
      getAddress,
      transfer,
    };
  } catch (e) {
    console.error(e);
    throw e;
  }
};
