import { useEffect, useState } from 'react';
import { Contract, formatUnits } from 'ethers';
import {
  CONTRACTS,
  KYC_REGISTRY_ABI,
  SECURITY_TOKEN_ABI,
  DVP_SETTLEMENT_ABI,
  LISTED_ASSETS
} from '../lib/contracts';
import { shortAddress } from '../lib/wallet';
import BuyModal from '../components/BuyModal';

const PENDING_KEY = 'verlo_pending_kyc';

export default function Dashboard({ provider, address }) {
  const [isVerified, setIsVerified]     = useState(null);
  const [isPending, setIsPending]       = useState(false);
  const [tokenBalance, setTokenBalance] = useState('0');
  const [platformStats, setPlatformStats] = useState({
    volume: '0',
    trades: '0',
    fees: '0'
  });
  const [loading, setLoading] = useState(true);
  const [selectedAsset, setSelectedAsset] = useState(null);
  const [refreshKey, setRefreshKey] = useState(0);
  const [requestMsg, setRequestMsg] = useState('');

  useEffect(() => {
    if (!provider || !address) return;
    loadData();
  }, [provider, address, refreshKey]);

  async function loadData() {
    setLoading(true);
    try {
      const kyc = new Contract(CONTRACTS.KYC_REGISTRY, KYC_REGISTRY_ABI, provider);
      const verified = await kyc.isVerified(address);
      setIsVerified(verified);

      // Check pending list
      const stored = localStorage.getItem(PENDING_KEY);
      const list = stored ? JSON.parse(stored) : [];
      setIsPending(list.some((p) => p.address.toLowerCase() === address.toLowerCase()));

      const token = new Contract(CONTRACTS.SECURITY_TOKEN, SECURITY_TOKEN_ABI, provider);
      const balance = await token.balanceOf(address);
      setTokenBalance(formatUnits(balance, 18));

      const dvp = new Contract(CONTRACTS.DVP_SETTLEMENT, DVP_SETTLEMENT_ABI, provider);
      const [volume, trades, fees] = await Promise.all([
        dvp.totalVolumeSettled(),
        dvp.tradeCount(),
        dvp.totalFeesCollected()
      ]);

      setPlatformStats({
        volume: formatUnits(volume, 6),
        trades: trades.toString(),
        fees: formatUnits(fees, 6)
      });
    } catch (err) {
      console.error('Load error:', err);
    } finally {
      setLoading(false);
    }
  }

  function handleRequestKYC() {
    const stored = localStorage.getItem(PENDING_KEY);
    const list = stored ? JSON.parse(stored) : [];

    // Check if already pending
    if (list.some((p) => p.address.toLowerCase() === address.toLowerCase())) {
      setRequestMsg('Your KYC request is already pending review.');
      setTimeout(() => setRequestMsg(''), 3000);
      return;
    }

    list.push({
      address,
      timestamp: Date.now()
    });
    localStorage.setItem(PENDING_KEY, JSON.stringify(list));
    setIsPending(true);
    setRequestMsg('KYC request submitted. The Verlo team will review shortly.');
    setTimeout(() => setRequestMsg(''), 4000);
  }

  function handleTradeSuccess() {
    setTimeout(() => setRefreshKey((k) => k + 1), 1500);
  }

  return (
    <section className="dashboard">
      <div className="container">
        <div className="dashboard-header">
          <h1>Dashboard</h1>
          <p>Connected as <strong>{shortAddress(address)}</strong> on Base Sepolia</p>
        </div>

        <div className="dashboard-grid">
          <div className="stat-card">
            <div className="stat-label">KYC status</div>
            <div className="stat-value" style={{ fontSize: 18, marginTop: 4 }}>
              {loading ? 'Checking...' : (isVerified ? 'Verified' : 'Not verified')}
            </div>
            {!loading && (
              <span className={`kyc-badge ${isVerified ? 'kyc-verified' : 'kyc-pending'}`}>
                {isVerified ? '● Approved by Verlo' : (isPending ? '● Awaiting approval' : '● Action required')}
              </span>
            )}
          </div>

          <div className="stat-card">
            <div className="stat-label">Your holdings (VTE)</div>
            <div className="stat-value">
              {loading ? '—' : Number(tokenBalance).toFixed(2)}
            </div>
            <div className="stat-sub">Verlo Test Equity tokens</div>
          </div>

          <div className="stat-card">
            <div className="stat-label">Total platform volume</div>
            <div className="stat-value">
              ${loading ? '—' : Number(platformStats.volume).toFixed(2)}
            </div>
            <div className="stat-sub">{platformStats.trades} trades settled</div>
          </div>

          <div className="stat-card">
            <div className="stat-label">Fees collected</div>
            <div className="stat-value">
              ${loading ? '—' : Number(platformStats.fees).toFixed(2)}
            </div>
            <div className="stat-sub">Treasury revenue · buyback fund</div>
          </div>
        </div>

        {/* Action message */}
        {requestMsg && (
          <div style={{
            marginTop: 20,
            padding: 12,
            background: '#DCFCE7',
            color: '#166534',
            borderRadius: 8,
            fontSize: 14,
            textAlign: 'center'
          }}>
            {requestMsg}
          </div>
        )}

        {/* KYC request banner */}
        {!loading && !isVerified && !isPending && (
          <div style={{
            marginTop: 24,
            padding: 24,
            background: '#FEF3C7',
            borderRadius: 'var(--radius-md)',
            border: '1px solid #FCD34D',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            flexWrap: 'wrap',
            gap: 16
          }}>
            <div>
              <div style={{ fontSize: 15, fontWeight: 600, color: '#78350F', marginBottom: 4 }}>
                KYC required to trade
              </div>
              <div style={{ fontSize: 13, color: '#92400E', lineHeight: 1.5 }}>
                Verlo only allows KYC-verified wallets to trade tokenized assets.
                Click below to request approval.
              </div>
            </div>
            <button
              className="btn-primary"
              onClick={handleRequestKYC}
            >
              Request KYC
            </button>
          </div>
        )}

        {!loading && !isVerified && isPending && (
          <div style={{
            marginTop: 24,
            padding: 16,
            background: '#FEF3C7',
            borderRadius: 'var(--radius-md)',
            border: '1px solid #FCD34D',
            fontSize: 13,
            color: '#92400E',
            textAlign: 'center'
          }}>
            Your KYC request is being reviewed by the Verlo team. You'll be able to trade once approved.
          </div>
        )}

        <div className="asset-section">
          <div className="asset-header">
            <h2>Available assets</h2>
            <span style={{ fontSize: 13, color: 'var(--gray-500)' }}>
              {LISTED_ASSETS.length} listed
            </span>
          </div>

          {LISTED_ASSETS.map((asset) => (
            <div key={asset.address} className="asset-row">
              <div className="asset-name">
                <div className="asset-avatar">{asset.symbol}</div>
                <div className="asset-info">
                  <div className="asset-title">{asset.name}</div>
                  <div className="asset-sub">{asset.description}</div>
                </div>
              </div>

              <div className="asset-cell">
                <span className="label">Type</span>
                {asset.type}
              </div>

              <div className="asset-cell">
                <span className="label">Price</span>
                ${asset.price.toFixed(2)}
              </div>

              <div className="asset-cell asset-price">
                <span className="label">Min invest</span>
                ${asset.price.toFixed(2)}
              </div>

              <div style={{ display: 'flex', gap: 8 }}>
          <button
            className="btn-buy"
            onClick={() => setSelectedAsset(asset)}
            disabled={!isVerified}
            title={!isVerified ? 'Complete KYC to trade' : ''}
          >
            Buy
          </button>
          <button
            onClick={() => window.open('https://bankr.bot/terminal', '_blank')}
            style={{
              padding: '10px 16px',
              background: 'white',
              color: '#0F172A',
              border: '1px solid #E5E7EB',
              borderRadius: 8,
              fontSize: 13,
              fontWeight: 600,
              cursor: 'pointer'
            }}
            title="Trade via Bankr"
          >
            via Bankr ↗
          </button>
        </div>
            </div>
          ))}
        </div>

        <div style={{
          marginTop: 32,
          padding: 20,
          background: 'var(--blue-50)',
          borderRadius: 'var(--radius-md)',
          border: '1px solid var(--blue-100)'
        }}>
          <div style={{ fontSize: 14, fontWeight: 600, color: 'var(--blue-900)', marginBottom: 6 }}>
            This is Verlo on Base Sepolia testnet
          </div>
          <div style={{ fontSize: 13, color: 'var(--gray-600)', lineHeight: 1.6 }}>
            All assets, trades, and balances shown here are on Base Sepolia testnet.
            Nothing has real monetary value. The contracts are fully functional and
            ready to be deployed to Base mainnet once testing is complete.
          </div>
        </div>
      </div>

      {selectedAsset && (
        <BuyModal
          asset={selectedAsset}
          provider={provider}
          address={address}
          onClose={() => setSelectedAsset(null)}
          onSuccess={handleTradeSuccess}
        />
      )}
    </section>
  );
}
