export type ThornodeEndpointParams = {
  type?: "thorchain" | "mayachain";
  stagenet?: boolean;
};

export type ThornodePoolItem = {
  asset: string;
  short_code: string;
  pending_inbound_asset: string;
  pending_inbound_rune: string;
  balance_asset: string;
  balance_rune: string;
  pool_units: string;
  LP_units: string;
  synth_units: string;
  synth_supply: string;
  savers_depth: string;
  savers_units: string;
  synth_mint_paused: boolean;
  synth_supply_remaining: string;
  loan_collateral: string;
  loan_collateral_remaining: string;
  loan_cr: string;
  derived_depth_bps: string;
};

export type InboundAddressesItem = {
  address: string;
  chain: string;
  gas_rate?: string;
  halted: boolean;
  pub_key: string;
  router?: string;
};

export type LastBlockItem = {
  chain: string;
  last_observed_in: number;
  last_signed_out: number;
  thorchain: number;
};

export type NodeItem = {
  active_block_height: number;
  bond_address: string;
  current_award: string;
  forced_to_leave: boolean;
  ip_address: string;
  leave_height: number;
  node_address: string;
  requested_to_leave: boolean;
  signer_membership: string[];
  slash_points: number;
  status: string;
  status_since: number;
  total_bond: string;
  validator_cons_pub_key: string;
  version: string;
  jail: Todo;
  preflight_status: Todo;
  pub_key_set: Todo;
  observe_chains: {
    chain: string;
    height: number;
  }[];
};

export type MimirData = {
  ADR012: number;
  ASGARDSIZE: number;
  BADVALIDATORREDLINE: number;
  BURNSYNTHS: number;
  CHURNINTERVAL: number;
  CLOUTLIMIT: number;
  CONFMULTIPLIERBASISPOINTS: number;
  DEPRECATEILP: number;
  DERIVEDDEPTHBASISPTS: number;
  DERIVEDMINDEPTH: number;
  DESIREDVALIDATORSET: number;
  DYNAMICMAXANCHORTARGET: number;
  EMISSIONCURVE: number;
  ENABLEAVAXCHAIN: number;
  ENABLEBSC: number;
  ENABLESAVINGSVAULTS: number;
  FULLIMPLOSSPROTECTIONBLOCKS: number;
  FUNDMIGRATIONINTERVAL: number;
  HALTAVAXCHAIN: number;
  HALTAVAXTRADING: number;
  HALTBCHCHAIN: number;
  HALTBCHTRADING: number;
  HALTBNBCHAIN: number;
  HALTBNBTRADING: number;
  HALTBSCCHAIN: number;
  HALTBSCTRADING: number;
  HALTBTCCHAIN: number;
  HALTBTCTRADING: number;
  HALTCHAINGLOBAL: number;
  HALTCHURNING: number;
  HALTDOGECHAIN: number;
  HALTDOGETRADING: number;
  HALTETHCHAIN: number;
  HALTETHTRADING: number;
  HALTGAIACHAIN: number;
  HALTGAIATRADING: number;
  HALTLTCCHAIN: number;
  HALTLTCTRADING: number;
  HALTSIGNING: number;
  HALTSIGNINGAVAX: number;
  HALTSIGNINGBCH: number;
  HALTSIGNINGBNB: number;
  HALTSIGNINGBSC: number;
  HALTSIGNINGBTC: number;
  HALTSIGNINGDOGE: number;
  HALTSIGNINGETH: number;
  HALTSIGNINGGAIA: number;
  HALTSIGNINGLTC: number;
  HALTSIGNINGTERRA: number;
  HALTTERRACHAIN: number;
  HALTTERRATRADING: number;
  HALTTHORCHAIN: number;
  HALTTRADING: number;
  ILPCUTOFF: number;
  KEYGENRETRYINTERVAL: number;
  KILLSWITCHSTART: number;
  "LENDING-THOR-BTC": number;
  "LENDING-THOR-ETH": number;
  LENDINGLEVER: number;
  LOANREPAYMENTMATURITY: number;
  LOANSTREAMINGSWAPSINTERVAL: number;
  MAXANCHORBLOCKS: number;
  MAXANCHORSLIP: number;
  MAXBONDPROVIDERS: number;
  MAXCONFIRMATIONS: number;
  MAXCR: number;
  MAXIMUMLIQUIDITYRUNE: number;
  MAXNODETOCHURNOUTFORLOWVERSION: number;
  MAXOUTBOUNDATTEMPTS: number;
  MAXOUTBOUNDFEEMULTIPLIERBASISPOINTS: number;
  MAXRUNESUPPLY: number;
  MAXSYNTHPERPOOLDEPTH: number;
  MAXSYNTHSFORSAVERSYIELD: number;
  MAXUTXOSTOSPEND: number;
  MINCR: number;
  MINIMUMBONDINRUNE: number;
  MINIMUML1OUTBOUNDFEEUSD: number;
  MINOUTBOUNDFEEMULTIPLIERBASISPOINTS: number;
  MINRUNEPOOLDEPTH: number;
  MINTSYNTHS: number;
  NODEOPERATORFEE: number;
  NODEPAUSECHAINGLOBAL: number;
  NUMBEROFNEWNODESPERCHURN: number;
  OBSERVATIONDELAYFLEXIBILITY: number;
  "PAUSEASYMWITHDRAWAL-TERRA": number;
  PAUSELOANS: number;
  PAUSELP: number;
  PAUSELPAVAX: number;
  PAUSELPBCH: number;
  PAUSELPBNB: number;
  PAUSELPBSC: number;
  PAUSELPBTC: number;
  PAUSELPDOGE: number;
  PAUSELPETH: number;
  PAUSELPGAIA: number;
  PAUSELPLTC: number;
  PAUSELPTERRA: number;
  PAUSEUNBOND: number;
  PENDINGLIQUIDITYAGELIMIT: number;
  "POL-AVAX-AVAX": number;
  "POL-AVAX-USDC-0XB97EF9EF8734C71904D8002F8B6BC66DD9C48A6E": number;
  "POL-BCH-BCH": number;
  "POL-BNB-BNB": number;
  "POL-BNB-BUSD-BD1": number;
  "POL-BSC-BNB": number;
  "POL-BSC-USDC-0X8AC76A51CC950D9822D68B83FE1AD97B32CD580D": number;
  "POL-BTC-BTC": number;
  "POL-DOGE-DOGE": number;
  "POL-ETH-DAI-0X6B175474E89094C44DA98B954EEDEAC495271D0F": number;
  "POL-ETH-ETH": number;
  "POL-ETH-USDC-0XA0B86991C6218B36C1D19D4A2E9EB0CE3606EB48": number;
  "POL-ETH-USDT-0XDAC17F958D2EE523A2206206994597C13D831EC7": number;
  "POL-GAIA-ATOM": number;
  "POL-LTC-LTC": number;
  POLBUFFER: number;
  POLMAXNETWORKDEPOSIT: number;
  POLMAXPOOLMOVEMENT: number;
  POLTARGETSYNTHPERPOOLDEPTH: number;
  POOLCYCLE: number;
  POOLDEPTHFORYGGFUNDINGMIN: number;
  PREFERREDASSETOUTBOUNDFEEMULTIPLIER: number;
  "RAGNAROK-BNB-AVA-645": number;
  "RAGNAROK-BNB-BAT-07A": number;
  "RAGNAROK-BNB-BNB": number;
  "RAGNAROK-BNB-BTCB-1DE": number;
  "RAGNAROK-BNB-BUSD-BD1": number;
  "RAGNAROK-BNB-CAKE-435": number;
  "RAGNAROK-BNB-EQL-586": number;
  "RAGNAROK-BNB-ETH-1C9": number;
  "RAGNAROK-BNB-ETHBULL-D33": number;
  "RAGNAROK-BNB-NEXO-A84": number;
  "RAGNAROK-BNB-RUNE": number;
  "RAGNAROK-BNB-TWT-8C2": number;
  "RAGNAROK-BNB-USDT-6D8": number;
  "RAGNAROK-BNB-XRP-BF2": number;
  "RAGNAROK-TERRA-LUNA": number;
  "RAGNAROK-TERRA-UST": number;
  RESCHEDULECOALESCEBLOCKS: number;
  SAVERSSTREAMINGSWAPSINTERVAL: number;
  SIGNERCONCURRENCY: number;
  SLASHPENALTY: number;
  SOLVENCYHALTAVAXCHAIN: number;
  SOLVENCYHALTBCHCHAIN: number;
  SOLVENCYHALTBSCCHAIN: number;
  SOLVENCYHALTDOGECHAIN: number;
  SOLVENCYHALTETHCHAIN: number;
  SOLVENCYHALTGAIACHAIN: number;
  SOLVENCYHALTTERRACHAIN: number;
  STOPFUNDYGGDRASIL: number;
  STOPSOLVENCYCHECK: number;
  STOPSOLVENCYCHECKAVAX: number;
  STOPSOLVENCYCHECKBNB: number;
  STOPSOLVENCYCHECKBSC: number;
  STOPSOLVENCYCHECKDOGE: number;
  STOPSOLVENCYCHECKETH: number;
  STOPSOLVENCYCHECKGAIA: number;
  STOPSOLVENCYCHECKTERRA: number;
  STREAMINGSWAPMINBPFEE: number;
  SYNTHYIELDBASISPOINTS: number;
  THORNAMES: number;
  "TORANCHOR-AVAX-USDC-0XB97EF9EF8734C71904D8002F8B6BC66DD9C48A6E": number;
  "TORANCHOR-AVAX-USDT-0X9702230A8EA53601F5CD2DC00FDBC13D4DF4A8C7": number;
  "TORANCHOR-BNB-BUSD-BD1": number;
  "TORANCHOR-BSC-USDC-0X8AC76A51CC950D9822D68B83FE1AD97B32CD580D": number;
  "TORANCHOR-ETH-DAI-0X6B175474E89094C44DA98B954EEDEAC495271D0F": number;
  "TORANCHOR-ETH-USDC-0XA0B86991C6218B36C1D19D4A2E9EB0CE3606EB48": number;
  "TORANCHOR-ETH-USDT-0XDAC17F958D2EE523A2206206994597C13D831EC7": number;
  TXOUTDELAYRATE: number;
  VIRTUALMULTSYNTHS: number;
  VOTEDOFM: number;
  VOTELENDING: number;
  VOTEMAXSYNTHSFORSAVERSYIELD: number;
  YGGFUNDLIMIT: number;
  YGGFUNDRETRY: number;
};
