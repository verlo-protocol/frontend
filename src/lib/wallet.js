import { BrowserProvider } from 'ethers';

export function shortAddress(address) {
  if (!address) return '';
  return `${address.slice(0, 6)}…${address.slice(-4)}`;
}

export function getProviderByName(name) {
  if (typeof window === 'undefined' || !window.ethereum) return null;

  const eth = window.ethereum;

  if (name === 'metamask') {
    if (eth.providers && Array.isArray(eth.providers)) {
      const mm = eth.providers.find((p) => p.isMetaMask && !p.isPhantom);
      if (mm) return mm;
    }
    if (eth.isMetaMask && !eth.isPhantom) return eth;
    return null;
  }

  if (name === 'coinbase') {
    if (eth.providers && Array.isArray(eth.providers)) {
      const cb = eth.providers.find((p) => p.isCoinbaseWallet);
      if (cb) return cb;
    }
    if (eth.isCoinbaseWallet) return eth;
    return null;
  }

  return eth;
}

async function connect(walletName, opts = {}) {
  const { forcePicker = false } = opts;
  const eth = getProviderByName(walletName);

  if (!eth) {
    throw new Error(
      walletName === 'metamask'
        ? 'MetaMask not detected. Install from metamask.io'
        : 'Coinbase Wallet not detected. Install from coinbase.com/wallet'
    );
  }

  if (forcePicker) {
    try {
      await eth.request({
        method: 'wallet_revokePermissions',
        params: [{ eth_accounts: {} }]
      });
    } catch (err) {
      // wallet_revokePermissions isn't supported in older versions — ignore
    }

    try {
      await eth.request({
        method: 'wallet_requestPermissions',
        params: [{ eth_accounts: {} }]
      });
    } catch (err) {
      if (err.code === 4001) throw new Error('Wallet selection cancelled');
      throw err;
    }
  }

  const accounts = await eth.request({ method: 'eth_requestAccounts' });

  if (!accounts || accounts.length === 0) {
    throw new Error('No accounts returned from wallet');
  }

  const provider = new BrowserProvider(eth);
  return { provider, address: accounts[0] };
}

export async function connectMetaMask() {
  return connect('metamask');
}

export async function connectCoinbaseWallet() {
  return connect('coinbase');
}

export async function connectWallet(walletName, opts = {}) {
  return connect(walletName, opts);
}

export async function switchAccount(walletName = 'metamask') {
  return connect(walletName, { forcePicker: true });
}
