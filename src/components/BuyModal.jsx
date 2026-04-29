import { useState, useEffect } from 'react';
import { Contract, parseUnits, formatUnits, BrowserProvider } from 'ethers';
import {
  CONTRACTS,
  DVP_SETTLEMENT_ABI,
  SECURITY_TOKEN_ABI
} from '../lib/contracts';

// Minimal USDC ABI for approve + balance
const USDC_ABI = [
  'function balanceOf(address) view returns (uint256)',
  'function allowance(address owner, address spender) view returns (uint256)',
  'function approve(address spender, uint256 amount) returns (bool)'
];

export default function BuyModal({ asset, provider, address, onClose, onSuccess }) {
  const [tokenAmount, setTokenAmount]   = useState('1');
  const [usdcBalance, setUsdcBalance]   = useState('0');
  const [allowance, setAllowance]       = useState('0');
  const [step, setStep]                 = useState('input'); // input | approving | buying | success | error
  const [txHash, setTxHash]             = useState(null);
  const [errorMsg, setErrorMsg]         = useState('');
  const [loading, setLoading]           = useState(false);

  // For testnet — the seller is the admin wallet (you)
  // In production, this would come from an orderbook
  const SELLER_ADDRESS = '0x3058d50F1C81BC57A74419F68C56e2638cAA65f9';

  const usdcAmount = Number(tokenAmount) * asset.price;
  const feeAmount  = usdcAmount * 0.003;  // 0.3%
  const totalCost  = usdcAmount;  // buyer pays usdc, fee comes out of seller's share

  useEffect(() => {
    if (!provider || !address) return;
    loadBalances();
  }, [provider, address]);

  async function loadBalances() {
    try {
      const usdc = new Contract(CONTRACTS.USDC, USDC_ABI, provider);
      const balance = await usdc.balanceOf(address);
      const allow   = await usdc.allowance(address, CONTRACTS.DVP_SETTLEMENT);

      setUsdcBalance(formatUnits(balance, 6));
      setAllowance(formatUnits(allow, 6));
    } catch (err) {
      console.error('Balance load error:', err);
    }
  }

  async function handleApprove() {
    setStep('approving');
    setLoading(true);
    setErrorMsg('');
    try {
      const signer = await provider.getSigner();
      const usdc = new Contract(CONTRACTS.USDC, USDC_ABI, signer);
      const amount = parseUnits(totalCost.toString(), 6);

      const tx = await usdc.approve(CONTRACTS.DVP_SETTLEMENT, amount);
      await tx.wait();

      await loadBalances();
      setStep('input');
    } catch (err) {
      console.error('Approve error:', err);
      setErrorMsg(err?.reason || err?.message || 'Approval failed');
      setStep('error');
    } finally {
      setLoading(false);
    }
  }

  async function handleBuy() {
    setStep('buying');
    setLoading(true);
    setErrorMsg('');
    try {
      const signer = await provider.getSigner();
      const dvp = new Contract(CONTRACTS.DVP_SETTLEMENT, DVP_SETTLEMENT_ABI, signer);

      const tokenAmt = parseUnits(tokenAmount, 18);
      const usdcAmt  = parseUnits(totalCost.toString(), 6);

      const tx = await dvp.settleTradeAtomic(
        SELLER_ADDRESS,
        asset.address,
        tokenAmt,
        usdcAmt
      );

      const receipt = await tx.wait();
      setTxHash(receipt.hash);
      setStep('success');

      if (onSuccess) onSuccess(receipt.hash);
    } catch (err) {
      console.error('Buy error:', err);
      setErrorMsg(err?.reason || err?.shortMessage || err?.message || 'Trade failed');
      setStep('error');
    } finally {
      setLoading(false);
    }
  }

  const needsApproval = Number(allowance) < totalCost;
  const hasBalance    = Number(usdcBalance) >= totalCost;

  return (
    <div className="modal-backdrop" onClick={step === 'success' ? onClose : undefined}>
      <div className="modal buy-modal" onClick={(e) => e.stopPropagation()}>

        {/* ─── HEADER ─── */}
        {step !== 'success' && (
          <div className="buy-header">
            <div className="buy-asset">
              <div className="asset-avatar-sm">{asset.symbol}</div>
              <div>
                <div className="buy-asset-name">{asset.name}</div>
                <div className="buy-asset-sub">${asset.price.toFixed(2)} per token</div>
              </div>
            </div>
            <button className="close-btn" onClick={onClose}>×</button>
          </div>
        )}

        {/* ─── INPUT STEP ─── */}
        {(step === 'input' || step === 'approving' || step === 'buying') && (
          <>
            <div className="buy-input-section">
              <label className="buy-label">Amount to buy</label>
              <div className="buy-input-wrap">
                <input
                  type="number"
                  value={tokenAmount}
                  onChange={(e) => setTokenAmount(e.target.value)}
                  min="1"
                  step="1"
                  disabled={loading}
                  className="buy-input"
                />
                <span className="buy-unit">{asset.symbol}</span>
              </div>
              <div className="buy-balance">
                Your USDC: <strong>${Number(usdcBalance).toFixed(2)}</strong>
              </div>
            </div>

            {/* Trade summary */}
            <div className="buy-summary">
              <div className="summary-row">
                <span>You pay</span>
                <span><strong>${usdcAmount.toFixed(2)}</strong> USDC</span>
              </div>
              <div className="summary-row">
                <span>You receive</span>
                <span><strong>{tokenAmount}</strong> {asset.symbol}</span>
              </div>
              <div className="summary-row muted">
                <span>Platform fee (0.3%)</span>
                <span>${feeAmount.toFixed(4)}</span>
              </div>
              <div className="summary-row muted">
                <span>Settlement</span>
                <span>Instant · Atomic DvP</span>
              </div>
            </div>

            {/* Balance warning */}
            {!hasBalance && (
              <div className="buy-warning">
                You need {(totalCost - Number(usdcBalance)).toFixed(2)} more USDC on Base Sepolia.
                <br />
                <a href="https://faucet.circle.com" target="_blank" rel="noreferrer">
                  Get testnet USDC →
                </a>
              </div>
            )}

            {/* Action button */}
            {hasBalance && (
              <>
                {needsApproval ? (
                  <button
                    className="btn-primary btn-full"
                    onClick={handleApprove}
                    disabled={loading || !tokenAmount || Number(tokenAmount) <= 0}
                  >
                    {step === 'approving' ? 'Approving USDC...' : 'Step 1 — Approve USDC'}
                  </button>
                ) : (
                  <button
                    className="btn-primary btn-full"
                    onClick={handleBuy}
                    disabled={loading || !tokenAmount || Number(tokenAmount) <= 0}
                  >
                    {step === 'buying' ? 'Settling trade...' : `Buy ${tokenAmount} ${asset.symbol}`}
                  </button>
                )}
                {needsApproval && (
                  <p className="step-note">Two transactions needed: approval, then the trade itself.</p>
                )}
              </>
            )}
          </>
        )}

        {/* ─── SUCCESS STEP ─── */}
        {step === 'success' && (
          <div className="success-screen">
            <div className="success-icon">
              <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M20 6L9 17l-5-5"/>
              </svg>
            </div>
            <h2>Trade settled</h2>
            <p>You now own {tokenAmount} {asset.symbol}. Tokens are in your wallet.</p>

            <div className="success-details">
              <div className="detail-row">
                <span>Amount</span>
                <span>{tokenAmount} {asset.symbol}</span>
              </div>
              <div className="detail-row">
                <span>Paid</span>
                <span>${usdcAmount.toFixed(2)} USDC</span>
              </div>
              <div className="detail-row">
                <span>Network</span>
                <span>Base Sepolia</span>
              </div>
            </div>

            <a
              href={`https://sepolia.basescan.org/tx/${txHash}`}
              target="_blank"
              rel="noreferrer"
              className="btn-secondary btn-full"
            >
              View on BaseScan →
            </a>
            <button className="btn-primary btn-full" onClick={onClose}>
              Done
            </button>
          </div>
        )}

        {/* ─── ERROR STEP ─── */}
        {step === 'error' && (
          <div className="error-screen">
            <div className="error-icon">
              <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="12" cy="12" r="10"/>
                <line x1="12" y1="8" x2="12" y2="12"/>
                <line x1="12" y1="16" x2="12.01" y2="16"/>
              </svg>
            </div>
            <h2>Something went wrong</h2>
            <p className="error-message">{errorMsg}</p>
            <div className="error-actions">
              <button className="btn-secondary btn-full" onClick={() => setStep('input')}>
                Try again
              </button>
              <button className="btn-primary btn-full" onClick={onClose}>
                Close
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
