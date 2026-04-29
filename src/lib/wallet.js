import { BrowserProvider } from 'ethers';
import { BASE_SEPOLIA_CHAIN_ID_HEX } from './contracts';

const BASE_SEPOLIA_PARAMS = {
  chainId: BASE_SEPOLIA_CHAIN_ID_HEX,
  chainName: 'Base Sepolia',
  nativeCurrency: { name: 'Ether', symbol: 'ETH', decimals: 18 },
  rpcUrls: ['https://sepolia.base.org'],
  blockExplorerUrls: ['https://sepolia.basescan.org']
};

function getProviderByName(name) {
  if (!window.ethereum) return null;

  const providers = window.ethereum.providers;
  if (providers && Array.isArray(providers)) {
    if (name === 'metamask') {
      return providers.find((p) => p.isMetaMask && !p.isPhantom) || null;
    }
    if (name === 'coinbase') {
      return providers.find((p) => p.isCoinbaseWallet) || null;
    }
  }

  // Fallback — only one wallet or old-style injection
  if (name === 'metamask' && window.ethereum.isMetaMask) return window.ethereum;
  if (name === 'coinbase' && window.ethereum.isCoinbaseWallet) return window.ethereum;

  return window.ethereum;
}

export async function connectMetaMask() {
  const eth = getProviderByName('metamask');
  if (!eth) {
    throw new Error('Please install MetaMask');
  }

  const accounts = await eth.request({ method: 'eth_requestAccounts' });
  await ensureBaseSepolia(eth);
  const provider = new BrowserProvider(eth);
  const signer = await provider.getSigner();
  return { provider, signer, address: accounts[0] };
}

export async function connectCoinbaseWallet() {
  const eth = getProviderByName('coinbase');
  if (!eth) {
    throw new Error('Please install Coinbase Wallet');
  }

  const accounts = await eth.request({ method: 'eth_requestAccounts' });
  await ensureBaseSepolia(eth);
  const provider = new BrowserProvider(eth);
  const signer = await provider.getSigner();
  return { provider, signer, address: accounts[0] };
}

async function ensureBaseSepolia(eth) {
  try {
    await eth.request({
      method: 'wallet_switchEthereumChain',
      params: [{ chainId: BASE_SEPOLIA_CHAIN_ID_HEX }]
    });
  } catch (err) {
    if (err.code === 4902) {
      await eth.request({
        method: 'wallet_addEthereumChain',
        params: [BASE_SEPOLIA_PARAMS]
      });
    } else {
      throw err;
    }
  }
}

export function shortAddress(addr) {
  if (!addr) return '';
  return `${addr.slice(0, 6)}…${addr.slice(-4)}`;
}
