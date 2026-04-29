export const BASE_SEPOLIA_CHAIN_ID = 84532;
export const BASE_SEPOLIA_CHAIN_ID_HEX = '0x14a34';

export const CONTRACTS = {
  KYC_REGISTRY: '0xab634e36Fa5adc9eB60021d0f2dcC9299cC5c572',
  SECURITY_TOKEN: '0xFEA2A98bb8b387Fd1C9509ccDf42476ABf037761',
  DVP_SETTLEMENT: '0xBE857F0d91d1ff276EAc74e81E57f90D5F0511A2',
  USDC: '0x036CbD53842c5426634e7929541eC2318f3dCF7e'
};

export const KYC_REGISTRY_ABI = [
  'function isVerified(address wallet) view returns (bool)',
  'function totalVerified() view returns (uint256)',
  'function verifyWallet(address wallet) external',
  'function revokeWallet(address wallet) external',
  'function verifyWalletBatch(address[] wallets) external',
  'function admin() view returns (address)'
];

export const SECURITY_TOKEN_ABI = [
  'function name() view returns (string)',
  'function symbol() view returns (string)',
  'function decimals() view returns (uint8)',
  'function totalSupply() view returns (uint256)',
  'function balanceOf(address) view returns (uint256)',
  'function pricePerToken() view returns (uint256)',
  'function assetDescription() view returns (string)',
  'function assetType() view returns (string)',
  'function paused() view returns (bool)',
  'function transfer(address to, uint256 amount) returns (bool)',
  'function approve(address spender, uint256 amount) returns (bool)'
];

export const DVP_SETTLEMENT_ABI = [
  'function totalVolumeSettled() view returns (uint256)',
  'function totalFeesCollected() view returns (uint256)',
  'function tradeCount() view returns (uint256)',
  'function previewFee(uint256 usdcAmount, address wallet) view returns (uint256, bool)',
  'function settleTradeAtomic(address seller, address securityToken, uint256 tokenAmount, uint256 usdcAmount)'
];

export const LISTED_ASSETS = [
  {
    address: CONTRACTS.SECURITY_TOKEN,
    name: 'Verlo Test Equity',
    symbol: 'VTE',
    type: 'Equity',
    description: 'Sample tokenized equity asset for Verlo testnet',
    price: 6
  }
];
