import { useEffect, useState } from 'react';
import { Contract, formatUnits } from 'ethers';
import {
  CONTRACTS,
  KYC_REGISTRY_ABI,
  SECURITY_TOKEN_ABI,
  DVP_SETTLEMENT_ABI
} from '../lib/contracts';
import { shortAddress } from '../lib/wallet';

const ADMIN_WALLET = '0x3058d50F1C81BC57A74419F68C56e2638cAA65f9';
const PENDING_KEY  = 'verlo_pending_kyc';

export default function AdminPanel({ provider, address }) {
  const [pending, setPending]     = useState([]);
  const [verified, setVerified]   = useState([]);
  const [stats, setStats]         = useState({ trades: 0, volume: '0', fees: '0' });
  const [loading, setLoading]     = useState(false);
  const [activeTab, setActiveTab] = useState('pending');
  const [actionMsg, setActionMsg] = useState('');

  const isAdmin = address?.toLowerCase() === ADMIN_WALLET.toLowerCase();

  useEffect(() => {
    if (!provider || !address || !isAdmin) return;
    loadAll();
  }, [provider, address]);

  async function loadAll() {
    setLoading(true);
    try {
      // Load pending from localStorage
      const stored = localStorage.getItem(PENDING_KEY);
      const list = stored ? JSON.parse(stored) : [];
      setPending(list);

      // Load platform stats
      const dvp = new Contract(CONTRACTS.DVP_SETTLEMENT, DVP_SETTLEMENT_ABI, provider);
      const [vol, trades, fees] = await Promise.all([
        dvp.totalVolumeSettled(),
        dvp.tradeCount(),
        dvp.totalFeesCollected()
      ]);
      setStats({
        volume: formatUnits(vol, 6),
        trades: trades.toString(),
        fees:   formatUnits(fees, 6)
      });

      // Load verified count from contract
      const kyc = new Contract(CONTRACTS.KYC_REGISTRY, KYC_REGISTRY_ABI, provider);
      const totalVerified = await kyc.totalVerified();
      setVerified([{ count: totalVerified.toString() }]);
    } catch (err) {
      console.error('Load error:', err);
    } finally {
      setLoading(false);
    }
  }

  async function handleApprove(walletAddr) {
    setLoading(true);
    setActionMsg('Approving...');
    try {
      const signer = await provider.getSigner();
      const kyc = new Contract(CONTRACTS.KYC_REGISTRY, KYC_REGISTRY_ABI, signer);

      const tx = await kyc.verifyWallet(walletAddr);
      await tx.wait();

      // Remove from pending list
      const updated = pending.filter((p) => p.address !== walletAddr);
      localStorage.setItem(PENDING_KEY, JSON.stringify(updated));
      setPending(updated);

      setActionMsg(`Approved ${shortAddress(walletAddr)}`);
      setTimeout(() => setActionMsg(''), 3000);
      loadAll();
    } catch (err) {
      console.error('Approve error:', err);
      setActionMsg(`Error: ${err?.reason || err?.message || 'Failed'}`);
      setTimeout(() => setActionMsg(''), 5000);
    } finally {
      setLoading(false);
    }
  }

  function handleReject(walletAddr) {
    const updated = pending.filter((p) => p.address !== walletAddr);
    localStorage.setItem(PENDING_KEY, JSON.stringify(updated));
    setPending(updated);
    setActionMsg(`Rejected ${shortAddress(walletAddr)}`);
    setTimeout(() => setActionMsg(''), 3000);
  }

  // Access denied for non-admin
  if (!isAdmin) {
    return (
      <section className="dashboard">
        <div className="container" style={{ textAlign: 'center', padding: '120px 0' }}>
          <div style={{ fontSize: 48, marginBottom: 12 }}>🔒</div>
          <h1 style={{ fontSize: 26, marginBottom: 8 }}>Access denied</h1>
          <p style={{ color: 'var(--gray-500)' }}>
            Admin panel is restricted to the Verlo admin wallet.
          </p>
          <p style={{ color: 'var(--gray-400)', marginTop: 8, fontSize: 13 }}>
            Connected as {shortAddress(address)}
          </p>
        </div>
      </section>
    );
  }

  return (
    <section className="dashboard">
      <div className="container">
        <div className="dashboard-header">
          <h1>Admin Panel</h1>
          <p>Verlo platform administration · {shortAddress(address)}</p>
        </div>

        {/* Stats */}
        <div className="dashboard-grid">
          <div className="stat-card">
            <div className="stat-label">Pending approvals</div>
            <div className="stat-value">{pending.length}</div>
            <div className="stat-sub">Awaiting KYC verification</div>
          </div>
          <div className="stat-card">
            <div className="stat-label">Total verified users</div>
            <div className="stat-value">{verified[0]?.count || '0'}</div>
            <div className="stat-sub">KYC approved on-chain</div>
          </div>
          <div className="stat-card">
            <div className="stat-label">Platform volume</div>
            <div className="stat-value">${Number(stats.volume).toFixed(2)}</div>
            <div className="stat-sub">{stats.trades} trades settled</div>
          </div>
          <div className="stat-card">
            <div className="stat-label">Treasury earnings</div>
            <div className="stat-value">${Number(stats.fees).toFixed(2)}</div>
            <div className="stat-sub">Lifetime fees collected</div>
          </div>
        </div>

        {/* Action message */}
        {actionMsg && (
          <div style={{
            marginTop: 20,
            padding: 12,
            background: actionMsg.startsWith('Error') ? '#FEE2E2' : '#DCFCE7',
            color: actionMsg.startsWith('Error') ? '#991B1B' : '#166534',
            borderRadius: 8,
            fontSize: 14,
            textAlign: 'center'
          }}>
            {actionMsg}
          </div>
        )}

        {/* Tabs */}
        <div style={{
          display: 'flex',
          gap: 4,
          marginTop: 32,
          borderBottom: '1px solid var(--gray-100)'
        }}>
          <button
            onClick={() => setActiveTab('pending')}
            style={{
              background: 'none',
              border: 'none',
              padding: '12px 16px',
              fontSize: 14,
              fontWeight: 600,
              color: activeTab === 'pending' ? 'var(--blue-600)' : 'var(--gray-500)',
              borderBottom: activeTab === 'pending' ? '2px solid var(--blue-600)' : '2px solid transparent',
              cursor: 'pointer',
              marginBottom: -1
            }}
          >
            Pending ({pending.length})
          </button>
          <button
            onClick={() => setActiveTab('history')}
            style={{
              background: 'none',
              border: 'none',
              padding: '12px 16px',
              fontSize: 14,
              fontWeight: 600,
              color: activeTab === 'history' ? 'var(--blue-600)' : 'var(--gray-500)',
              borderBottom: activeTab === 'history' ? '2px solid var(--blue-600)' : '2px solid transparent',
              cursor: 'pointer',
              marginBottom: -1
            }}
          >
            How it works
          </button>
        </div>

        {/* Tab content */}
        {activeTab === 'pending' && (
          <div style={{ marginTop: 24 }}>
            {pending.length === 0 ? (
              <div style={{
                padding: '48px 24px',
                textAlign: 'center',
                background: 'var(--gray-50)',
                borderRadius: 'var(--radius-md)',
                color: 'var(--gray-500)'
              }}>
                <div style={{ fontSize: 32, marginBottom: 8 }}>✨</div>
                <div style={{ fontSize: 15, fontWeight: 500, color: 'var(--gray-700)' }}>
                  No pending requests
                </div>
                <div style={{ fontSize: 13, marginTop: 4 }}>
                  When users request KYC, they will appear here.
                </div>
              </div>
            ) : (
              <div className="asset-section" style={{ marginTop: 0 }}>
                {pending.map((req) => (
                  <div key={req.address} className="asset-row">
                    <div className="asset-name">
                      <div className="asset-avatar" style={{ background: 'var(--gray-100)' }}>
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                          <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/>
                          <circle cx="12" cy="7" r="4"/>
                        </svg>
                      </div>
                      <div className="asset-info">
                        <div className="asset-title" style={{ fontFamily: '"SF Mono", monospace', fontSize: 14 }}>
                          {req.address}
                        </div>
                        <div className="asset-sub">
                          Submitted {new Date(req.timestamp).toLocaleString()}
                        </div>
                      </div>
                    </div>
                    <div style={{ display: 'flex', gap: 8 }}>
                      <button
                        onClick={() => handleReject(req.address)}
                        disabled={loading}
                        style={{
                          padding: '8px 16px',
                          background: 'white',
                          border: '1px solid var(--gray-200)',
                          borderRadius: 8,
                          fontSize: 13,
                          fontWeight: 500,
                          color: 'var(--gray-700)',
                          cursor: 'pointer'
                        }}
                      >
                        Reject
                      </button>
                      <button
                        onClick={() => handleApprove(req.address)}
                        disabled={loading}
                        className="btn-buy"
                      >
                        Approve
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {activeTab === 'history' && (
          <div style={{
            marginTop: 24,
            padding: 24,
            background: 'var(--gray-50)',
            borderRadius: 'var(--radius-md)',
            fontSize: 14,
            color: 'var(--gray-700)',
            lineHeight: 1.7
          }}>
            <div style={{ fontWeight: 600, color: 'var(--gray-900)', marginBottom: 12 }}>
              How KYC works on Verlo
            </div>
            <div style={{ marginBottom: 8 }}>
              1. User connects wallet on Verlo → sees "Not verified" status
            </div>
            <div style={{ marginBottom: 8 }}>
              2. User clicks "Request KYC" → wallet address added to pending list
            </div>
            <div style={{ marginBottom: 8 }}>
              3. Admin reviews request in this panel → clicks Approve
            </div>
            <div style={{ marginBottom: 8 }}>
              4. Verlo's KYCRegistry contract verifies the wallet on-chain
            </div>
            <div style={{ marginBottom: 8 }}>
              5. User can now trade tokenized assets immediately
            </div>
            <div style={{
              marginTop: 16,
              padding: 12,
              background: 'var(--blue-50)',
              borderRadius: 8,
              fontSize: 13,
              color: 'var(--blue-900)'
            }}>
              <strong>Note:</strong> v1.1 will add automated KYC via Persona/Sumsub.
              For launch, wallet-level verification is sufficient.
            </div>
          </div>
        )}
      </div>
    </section>
  );
}
