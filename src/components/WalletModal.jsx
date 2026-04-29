import { connectMetaMask, connectCoinbaseWallet } from '../lib/wallet';

export default function WalletModal({ onClose, onConnected }) {
  async function handleMetaMask() {
    try {
      const res = await connectMetaMask();
      onConnected(res);
    } catch (err) {
      alert(err.message || 'Failed to connect MetaMask');
    }
  }

  async function handleCoinbase() {
    try {
      const res = await connectCoinbaseWallet();
      onConnected(res);
    } catch (err) {
      alert(err.message || 'Failed to connect Coinbase Wallet');
    }
  }

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal" onClick={(e) => e.stopPropagation()}>
        <h2>Connect a wallet</h2>
        <p>Choose how you'd like to connect to Verlo on Base Sepolia.</p>

        <button className="wallet-option" onClick={handleMetaMask}>
          <img
            src="https://upload.wikimedia.org/wikipedia/commons/3/36/MetaMask_Fox.svg"
            alt="MetaMask"
            width="36"
            height="36"
            style={{ flexShrink: 0 }}
          />
          <div className="wallet-option-text">
            <div className="name">MetaMask</div>
            <div className="desc">Browser extension · Most popular</div>
          </div>
        </button>

        <button className="wallet-option" onClick={handleCoinbase}>
          <img
            src="https://avatars.githubusercontent.com/u/18060234?s=200&v=4"
            alt="Coinbase Wallet"
            width="36"
            height="36"
            style={{ flexShrink: 0, borderRadius: 8 }}
          />
          <div className="wallet-option-text">
            <div className="name">Coinbase Wallet</div>
            <div className="desc">Native to Base · Recommended</div>
          </div>
        </button>
      </div>
    </div>
  );
}
