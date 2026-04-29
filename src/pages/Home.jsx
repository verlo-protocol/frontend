export default function Home({ onConnectClick, onGoDashboard, isConnected }) {
  return (
    <>
      <section className="hero">
        <div className="container">
          <div className="hero-badge">
            <span className="hero-dot"></span>
            Live on Base Sepolia · Testnet
          </div>

          <h1>
            Real-world assets.
            <br />
            <span className="accent">Settled instantly.</span>
          </h1>

          <p>
            The first compliant securities platform on Base. On-chain KYC,
            atomic DvP settlement in USDC, and full transparency. Trade
            tokenized equity, funds, and real estate in seconds.
          </p>

          <div className="hero-cta">
            {isConnected ? (
              <button className="btn-primary btn-large" onClick={onGoDashboard}>
                Go to dashboard
              </button>
            ) : (
              <button className="btn-primary btn-large" onClick={onConnectClick}>
                Connect wallet to start
              </button>
            )}
            <a
              href="https://sepolia.basescan.org/address/0xab634e36Fa5adc9eB60021d0f2dcC9299cC5c572"
              target="_blank"
              rel="noreferrer"
              className="btn-secondary btn-large"
            >
              View contracts →
            </a>
          </div>
        </div>
      </section>

      <section className="trust-bar">
        <div className="container">
          <div className="trust-grid">
            <div className="trust-item">
              <h3>10s</h3>
              <p>Settlement time</p>
            </div>
            <div className="trust-item">
              <h3>0.3%</h3>
              <p>Platform fee</p>
            </div>
            <div className="trust-item">
              <h3>100%</h3>
              <p>On-chain compliance</p>
            </div>
            <div className="trust-item">
              <h3>$6</h3>
              <p>Minimum investment</p>
            </div>
          </div>
        </div>
      </section>

      <section className="features">
        <div className="container">
          <div className="section-header">
            <div className="section-tag">How Verlo works</div>
            <h2>Institutional-grade, built for everyone</h2>
            <p>
              Three primitives that make compliant on-chain securities possible — 
              all deployed on Base and verified on-chain.
            </p>
          </div>

          <div className="feature-grid">
            <div className="feature-card">
              <div className="feature-icon">
                <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M9 12l2 2 4-4"/>
                  <path d="M21 12c0 4.97-4.03 9-9 9s-9-4.03-9-9 4.03-9 9-9c1.66 0 3.22.45 4.56 1.23"/>
                </svg>
              </div>
              <h3>On-chain KYC</h3>
              <p>
                Users verify once, trade forever. Identity attestations live on-chain
                — no central database, no middleman can revoke access.
              </p>
            </div>

            <div className="feature-card">
              <div className="feature-icon">
                <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M16 3h5v5M21 3l-7 7M8 21H3v-5M3 21l7-7"/>
                </svg>
              </div>
              <h3>Atomic DvP settlement</h3>
              <p>
                Buyer sends USDC, seller sends security token — in one transaction.
                Either both happen or neither does. No counterparty risk, ever.
              </p>
            </div>

            <div className="feature-card">
              <div className="feature-icon">
                <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <rect x="3" y="3" width="18" height="18" rx="2"/>
                  <path d="M9 9h6v6H9z"/>
                </svg>
              </div>
              <h3>ERC-3643 tokens</h3>
              <p>
                Security tokens with transfer restrictions baked into the contract.
                Only verified wallets can hold them — compliance at the protocol level.
              </p>
            </div>
          </div>
        </div>
      </section>
    </>
  );
}
