import { useState, useEffect, useRef } from 'react';
import { BrowserProvider } from 'ethers';
import Navbar from './components/Navbar';
import WalletModal from './components/WalletModal';
import Home from './pages/Home';
import Dashboard from './pages/Dashboard';
import AdminPanel from './pages/AdminPanel';
import { getProviderByName } from './lib/wallet';

export default function App() {
  const [page, setPage]           = useState('home');
  const [showModal, setShowModal] = useState(false);
  const [provider, setProvider]   = useState(null);
  const [address, setAddress]     = useState(null);

  const ethRef = useRef(null);

  useEffect(() => {
    autoReconnect();

    const eth = getProviderByName('metamask') || window.ethereum;
    ethRef.current = eth;

    if (eth && eth.on) {
      eth.on('accountsChanged', handleAccountsChanged);
      eth.on('chainChanged', handleChainChanged);
    }

    return () => {
      if (ethRef.current?.removeListener) {
        ethRef.current.removeListener('accountsChanged', handleAccountsChanged);
        ethRef.current.removeListener('chainChanged', handleChainChanged);
      }
    };
    // eslint-disable-next-line
  }, []);

  async function autoReconnect() {
    const eth = getProviderByName('metamask') || window.ethereum;
    if (!eth) return;
    try {
      const accounts = await eth.request({ method: 'eth_accounts' });
      if (accounts && accounts.length > 0) {
        const prov = new BrowserProvider(eth);
        setProvider(prov);
        setAddress(accounts[0]);
      }
    } catch (err) {
      console.debug('Auto-reconnect: no existing session');
    }
  }

  function handleAccountsChanged(accounts) {
    if (!accounts || accounts.length === 0) {
      setProvider(null);
      setAddress(null);
      setPage('home');
      return;
    }

    // Rebuild the provider with the new active account
    const eth = ethRef.current || getProviderByName('metamask') || window.ethereum;
    if (eth) {
      const prov = new BrowserProvider(eth);
      setProvider(prov);
    }
    setAddress(accounts[0]);
  }

  function handleChainChanged() {
    // When chain changes, rebuild provider so reads use the new chain
    const eth = ethRef.current || getProviderByName('metamask') || window.ethereum;
    if (eth) {
      const prov = new BrowserProvider(eth);
      setProvider(prov);
    }
  }

  function handleConnected({ provider, address }) {
    setProvider(provider);
    setAddress(address);
    setShowModal(false);
    setPage('dashboard');
  }

  function handleDisconnect() {
    setProvider(null);
    setAddress(null);
    setPage('home');
  }

  return (
    <>
      <Navbar
        address={address}
        onConnectClick={() => setShowModal(true)}
        onNavigate={setPage}
        onDisconnect={handleDisconnect}
        page={page}
      />

      {page === 'home' && (
        <Home
          onConnectClick={() => setShowModal(true)}
          onGoDashboard={() => setPage('dashboard')}
          isConnected={!!address}
        />
      )}

      {page === 'dashboard' && address && (
        <Dashboard provider={provider} address={address} />
      )}

      {page === 'admin' && address && (
        <AdminPanel provider={provider} address={address} />
      )}

      {(page === 'dashboard' || page === 'admin') && !address && (
        <div className="dashboard">
          <div className="container" style={{ textAlign: 'center', padding: '80px 0' }}>
            <h1 style={{ fontSize: 26, marginBottom: 12 }}>Connect your wallet</h1>
            <p style={{ color: 'var(--gray-500)', marginBottom: 24 }}>
              Connect a wallet to continue.
            </p>
            <button className="btn-primary btn-large" onClick={() => setShowModal(true)}>
              Connect wallet
            </button>
          </div>
        </div>
      )}

      <footer className="footer">
        <div className="container footer-inner">
          <div>© 2026 Verlo · Built on Base</div>
          <div className="footer-links">
            <a href="https://sepolia.basescan.org" target="_blank" rel="noreferrer">BaseScan</a>
            <a href="https://base.org" target="_blank" rel="noreferrer">Base</a>
            <a href="https://x.com/verloonbase" target="_blank" rel="noreferrer">Twitter</a>
          </div>
        </div>
      </footer>

      {showModal && (
        <WalletModal
          onClose={() => setShowModal(false)}
          onConnected={handleConnected}
        />
      )}
    </>
  );
}
