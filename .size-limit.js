module.exports = [
  { path: './packages/swapkit/swapkit-api/dist/index.cjs', name: 'api(cjs)', limit: '5 KB' },
  { path: './packages/swapkit/swapkit-api/dist/index.es.js', name: 'api(esm)', limit: '5 KB' },
  { path: './packages/swapkit/swapkit-core/dist/index.cjs', name: 'core(cjs)', limit: '50 KB' },
  { path: './packages/swapkit/swapkit-core/dist/index.es.js', name: 'core(esm)', limit: '50 KB' },
  { path: './packages/swapkit/swapkit-entities/dist/index.cjs', name: 'entities(cjs)', limit: '10 KB' },
  { path: './packages/swapkit/swapkit-entities/dist/index.es.js', name: 'entities(esm)', limit: '10 KB' },
  { path: './packages/swapkit/swapkit-explorers/dist/index.cjs', name: 'explorers(cjs)', limit: '2 KB' },
  { path: './packages/swapkit/swapkit-explorers/dist/index.es.js', name: 'explorers(esm)', limit: '2 KB' },
  { path: './packages/swapkit/swapkit-sdk/dist/index.cjs', name: 'swapkit-sdk(cjs)', limit: '4 MB' },
  { path: './packages/swapkit/swapkit-sdk/dist/index.es.js', name: 'swapkit-sdk(esm)', limit: '5 MB' },
  { path: './packages/swapkit/types/dist/index.cjs', name: 'types(cjs)', limit: '10 KB' },
  { path: './packages/swapkit/types/dist/index.es.js', name: 'types(esm)', limit: '10 KB' },
  { path: './packages/toolboxes/toolbox-cosmos/dist/index.cjs', name: 'toolbox-cosmos(cjs)', limit: '850 KB', },
  { path: './packages/toolboxes/toolbox-cosmos/dist/index.es.js', name: 'toolbox-cosmos(esm)', limit: '1 MB', },
  { path: './packages/toolboxes/toolbox-evm/dist/index.cjs', name: 'toolbox-evm(cjs)', limit: '150 KB' },
  { path: './packages/toolboxes/toolbox-evm/dist/index.es.js', name: 'toolbox-evm(esm)', limit: '150 KB' },
  { path: './packages/toolboxes/toolbox-utxo/dist/index.cjs', name: 'toolbox-utxo(cjs)', limit: '350 KB' },
  { path: './packages/toolboxes/toolbox-utxo/dist/index.es.js', name: 'toolbox-utxo(esm)', limit: '350 KB' },
  { path: './packages/wallets/evm-web3-wallets/dist/index.cjs', name: 'web3-wallets(cjs)', limit: '5 KB' },
  { path: './packages/wallets/evm-web3-wallets/dist/index.es.js', name: 'web3-wallets(esm)', limit: '5 KB' },
  { path: './packages/wallets/keplr/dist/index.cjs', name: 'keplr(cjs)', limit: '5 KB' },
  { path: './packages/wallets/keplr/dist/index.es.js', name: 'keplr(esm)', limit: '5 KB' },
  { path: './packages/wallets/keystore/dist/index.cjs', name: 'keystore(cjs)', limit: '100 KB' },
  { path: './packages/wallets/keystore/dist/index.es.js', name: 'keystore(esm)', limit: '100 KB' },
  { path: './packages/wallets/ledger/dist/index.cjs', name: 'ledger(cjs)', limit: '1.2 MB' },
  { path: './packages/wallets/ledger/dist/index.es.js', name: 'ledger(esm)', limit: '1.2 MB' },
  { path: './packages/wallets/trezor/dist/index.cjs', name: 'trezor(cjs)', limit: '450 KB' },
  { path: './packages/wallets/trezor/dist/index.es.js', name: 'trezor(esm)', limit: '500 KB' },
  { path: './packages/wallets/trustwallet/dist/index.cjs', name: 'trustwallet(cjs)', limit: '250 KB' },
  { path: './packages/wallets/trustwallet/dist/index.es.js', name: 'trustwallet(esm)', limit: '300 KB' },
  { path: './packages/wallets/walletconnect/dist/index.cjs', name: 'walletconnect(cjs)', limit: '750 KB' },
  { path: './packages/wallets/walletconnect/dist/index.es.js', name: 'walletconnect(esm)', limit: '800 KB' },
  { path: './packages/wallets/xdefi/dist/index.cjs', name: 'xdefi(cjs)', limit: '5 KB' },
  { path: './packages/wallets/xdefi/dist/index.es.js', name: 'xdefi(esm)', limit: '5 KB' },
];
