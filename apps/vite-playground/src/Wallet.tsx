import type { WalletDataType } from './types';

type Props = {
  walletData: WalletDataType;
  setAsset: (asset: any) => void;
};

export const Wallet = ({ walletData, setAsset }: Props) => {
  if (!walletData) return null;

  return (
    <div style={{ paddingBottom: '16px' }}>
      <div>
        <span>
          {walletData?.walletType} {walletData?.balance?.[0]?.asset.L1Chain} wallet address:{' '}
          {walletData?.address}
        </span>
      </div>

      <span>Balances:</span>

      {walletData?.balance?.map((b) => (
        <div key={b.asset.toString()}>
          <button onClick={() => setAsset(b)} type="button">
            {b.amount.toSignificant(6)} {b.asset.ticker}
          </button>
        </div>
      ))}
    </div>
  );
};
