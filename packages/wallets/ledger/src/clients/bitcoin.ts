import { derivationPathToString } from '@swapkit/helpers';
import type { DerivationPathArray } from '@swapkit/types';
import { NetworkDerivationPath } from '@swapkit/types';
import { networks } from '@swapkit/toolbox-utxo';

import { getWalletFormatFor } from '../helpers/derivationPath.ts';
import { UTXOLedgerInterface } from '../interfaces/LedgerInterfaces.ts';

export class BitcoinLedger extends UTXOLedgerInterface {
  constructor(derivationPath: DerivationPathArray = NetworkDerivationPath.BTC) {
    super();
    this.addressNetwork = networks.bitcoin;
    this.chain = 'bitcoin';
    this.derivationPath = derivationPathToString(derivationPath);
    this.walletFormat = getWalletFormatFor(this.derivationPath) as 'legacy' | 'bech32' | 'p2sh';
  }
}
