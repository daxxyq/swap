import { derivationPathToString } from '@thorswap-lib/helpers';
import type { DerivationPathArray } from '@thorswap-lib/types';
import { NetworkDerivationPath } from '@thorswap-lib/types';
// @ts-expect-error
import coininfo from 'coininfo';

import { getWalletFormatFor } from '../helpers/derivationPath.ts';
import { UTXOLedgerInterface } from '../interfaces/LedgerInterfaces.ts';

export class BitcoinCashLedger extends UTXOLedgerInterface {
  constructor(derivationPath: DerivationPathArray = NetworkDerivationPath.BCH) {
    super();
    this.additionalSignParams = { segwit: false, additionals: ['abc'], sigHashType: 0x41 };
    this.addressNetwork = coininfo.bitcoincash.main.toBitcoinJS();
    this.chain = 'bch';
    this.derivationPath = derivationPathToString(derivationPath);
    this.walletFormat = getWalletFormatFor(this.derivationPath) as 'legacy' | 'bech32';
  }
}
