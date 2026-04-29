import { useState, useEffect, useRef } from 'react';
import { shortAddress, getProviderByName } from '../lib/wallet';

const ADMIN_WALLET = '0x3058d50F1C81BC57A74419F68C56e2638cAA65f9';

export default function Navbar({ address, onConnectClick, onNavigate, onDisconnect, page }) {
  const [menuOpen, setMenuOpen] = useState(false);
  const [copied, setCopied]     = useState(false);
  const menuRef = useRef(null);

  const isAdmin = address?.toLowerCase() === ADMIN_WALLET.toLowerCase();

  useEffect(() => {
    function handleClickOutside(e) {
      if (menuRef.current && !menuRef.current.contains(e.target)) {
        setMenuOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  async function handleCopy() {
    try {
      await navigator.clipboard.writeText(address);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch (err) {
      console.error('Copy failed:', err);
    }
  }

  async function handleDisconnect() {
    setMenuOpen(false);

    // Try to revoke MetaMask permissions so picker shows next time
    const eth = getProviderByName('metamask');
    if (eth) {
      try {
        await eth.request({
          method: 'wallet_revokePermissions',
          params: [{ eth_accounts: {} }]
        });
      } catch (err) {
        // older MetaMask doesn't support — ignore
      }
    }

    if (onDisconnect) onDisconnect();
  }

  function handleViewOnExplorer() {
    setMenuOpen(false);
    window.open(`https://sepolia.basescan.org/address/${address}`, '_blank');
  }

  const navLinkStyle = (isActive) => ({
    color: isActive ? '#2563EB' : 'var(--gray-700)',
    fontWeight: isActive ? '600' : '500'
  });

  return (
    <nav className="navbar">
      <div className="container nav-inner">
        <a href="#" className="logo" onClick={(e) => { e.preventDefault(); onNavigate('home'); }}>
          <div className="logo-mark">V</div>
          Verlo
        </a>

        <div className="nav-links">
          {address && (
            <a href="#"
               className="nav-link"
               style={navLinkStyle(page === 'dashboard')}
               onClick={(e) => { e.preventDefault(); onNavigate('dashboard'); }}>
              Dashboard
            </a>
          )}

          {isAdmin && (
            <a href="#"
               className="nav-link"
               style={navLinkStyle(page === 'admin')}
               onClick={(e) => { e.preventDefault(); onNavigate('admin'); }}>
              Admin
            </a>
          )}

          <a href="https://sepolia.basescan.org/address/0xab634e36Fa5adc9eB60021d0f2dcC9299cC5c572"
             className="nav-link"
             target="_blank"
             rel="noreferrer">
            Contracts
          </a>

          {address ? (
            <div className="wallet-menu-wrap" ref={menuRef}>
              <button className="wallet-pill-btn" onClick={() => setMenuOpen(!menuOpen)}>
                <span className="status-dot"></span>
                {shortAddress(address)}
              </button>

              {menuOpen && (
                <div className="wallet-menu">
                  <div className="wallet-menu-header">
                    <div className="wallet-menu-label">Connected wallet</div>
                    <div className="wallet-menu-address">{address.slice(0, 10)}…{address.slice(-8)}</div>
                  </div>

                  <button className="wallet-menu-item" onClick={handleCopy}>
                    <span>{copied ? 'Copied!' : 'Copy address'}</span>
                  </button>

                  <button className="wallet-menu-item" onClick={handleViewOnExplorer}>
                    <span>View on BaseScan</span>
                  </button>

                  <div className="wallet-menu-divider"></div>

                  <button className="wallet-menu-item danger" onClick={handleDisconnect}>
                    <span>Disconnect</span>
                  </button>

                  <div className="wallet-menu-hint">
                    To switch accounts, open MetaMask and pick a different wallet there.
                  </div>
                </div>
              )}
            </div>
          ) : (
            <button className="btn-primary" onClick={onConnectClick}>
              Connect wallet
            </button>
          )}
        </div>
      </div>
    </nav>
  );
}
