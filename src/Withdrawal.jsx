import { useEffect, useMemo, useState } from 'react'
import './Withdrawal.css'
import BottomNavigation from './BottomNavigation'
import { providerApi } from './apiClient'

const formatCurrency = (value) =>
  new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 0
  }).format(Number(value || 0))

const defaultWallet = {
  balance: 0,
  pending_withdrawals: 0,
  transactions: []
}

function Withdrawal({ onBack, activeNavTab, onNavChange, userData }) {
  const [activeNav, setActiveNav] = useState(activeNavTab || 'Withdrawal')
  const [wallet, setWallet] = useState(defaultWallet)
  const [withdrawals, setWithdrawals] = useState([])
  const [withdrawAmount, setWithdrawAmount] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState('')

  const providerId =
    userData?.providerDetails?.id ||
    userData?.provider_id ||
    userData?.providerId ||
    userData?.providerDetails?.provider_id ||
    null
  const token = userData?.token

  useEffect(() => {
    if (!providerId || !token) return
    fetchWallet()
  }, [providerId, token])

  const fetchWallet = async () => {
    try {
      setIsLoading(true)
      setError('')
      const response = await providerApi.getWalletSummary({ providerId, token })
      setWallet({
        balance: response.wallet?.balance || 0,
        pending_withdrawals: response.wallet?.pending_withdrawals || 0,
        transactions: response.wallet?.transactions || []
      })
      setWithdrawals(response.withdrawals || [])
    } catch (fetchError) {
      console.error('Failed to load wallet info:', fetchError)
      setError(fetchError.message || 'Unable to load wallet information')
    } finally {
      setIsLoading(false)
    }
  }

  const handleWithdraw = async (event) => {
    event.preventDefault()
    if (!providerId || !token) {
      setError('Please login again to request withdrawal.')
      return
    }
    const amount = Number(withdrawAmount)
    if (!amount || amount <= 0) {
      setError('Enter a valid amount.')
      return
    }
    if (amount > wallet.balance) {
      setError('Amount exceeds available balance.')
      return
    }
    try {
      setIsSubmitting(true)
      setError('')
      await providerApi.requestWithdrawal({ providerId, amount, token })
      setWithdrawAmount('')
      fetchWallet()
    } catch (submitError) {
      console.error('Withdrawal request failed:', submitError)
      setError(submitError.message || 'Unable to submit withdrawal request')
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleNavChange = (tab) => {
    setActiveNav(tab)
    if (onNavChange) {
      onNavChange(tab)
    }
    if (tab === 'Home') {
      onBack()
    }
  }

  const latestTransactions = useMemo(() => wallet.transactions || [], [wallet.transactions])

  return (
    <div className="withdrawal-container">
      <div className="withdrawal-content">
        <div className="withdrawal-header">
          <button className="withdrawal-back-button" onClick={onBack}>
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <line x1="18" y1="12" x2="6" y2="12" stroke="black" strokeWidth="2" strokeLinecap="round" />
              <path d="M6 12L12 6M6 12L12 18" stroke="black" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </button>
          <h1 className="withdrawal-title">Wallet & Withdrawals</h1>
        </div>

        <div className="withdrawal-body">
          {error && <div className="withdrawal-alert">{error}</div>}

          <div className="wallet-summary-grid">
            <div className="wallet-card">
              <p className="wallet-card-label">Available balance</p>
              <p className="wallet-card-value">{formatCurrency(wallet.balance)}</p>
              <p className="wallet-card-helper">Net of commissions</p>
            </div>
            <div className="wallet-card">
              <p className="wallet-card-label">Pending withdrawals</p>
              <p className="wallet-card-value">{wallet.pending_withdrawals}</p>
              <p className="wallet-card-helper">Awaiting admin payout</p>
            </div>
          </div>

          <form className="withdrawal-form" onSubmit={handleWithdraw}>
            <div className="form-group">
              <label htmlFor="withdrawAmount">Request withdrawal</label>
              <div className="input-with-addon">
                <span>₹</span>
                <input
                  id="withdrawAmount"
                  type="number"
                  min="0"
                  step="100"
                  placeholder="Enter amount"
                  value={withdrawAmount}
                  onChange={(e) => setWithdrawAmount(e.target.value)}
                  disabled={isSubmitting}
                />
              </div>
            </div>
            <button className="withdrawal-submit-btn" type="submit" disabled={isSubmitting || isLoading}>
              {isSubmitting ? 'Submitting...' : 'Send request'}
            </button>
          </form>

          <section className="transactions-section">
            <div className="transactions-heading-row">
              <h2 className="transactions-heading">Recent transactions</h2>
              <button className="refresh-button" onClick={fetchWallet} disabled={isLoading}>
                Refresh
              </button>
            </div>
            {latestTransactions.length === 0 ? (
              <p className="empty-state">No transactions recorded yet.</p>
            ) : (
              <div className="transactions-table-container">
                <table className="transactions-table">
                  <thead>
                    <tr>
                      <th>Date</th>
                      <th>Type</th>
                      <th>Description</th>
                      <th>Amount</th>
                    </tr>
                  </thead>
                  <tbody>
                    {latestTransactions.map((txn) => (
                      <tr key={txn.id}>
                        <td>{new Date(txn.created_at).toLocaleString()}</td>
                        <td className={txn.transaction_type === 'credit' ? 'text-success' : 'text-danger'}>
                          {txn.transaction_type === 'credit' ? 'Credit' : 'Debit'}
                        </td>
                        <td>{txn.description || '-'}</td>
                        <td className={txn.transaction_type === 'credit' ? 'text-success' : 'text-danger'}>
                          {txn.transaction_type === 'credit' ? '+' : '-'}
                          {formatCurrency(txn.amount)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </section>

          <section className="transactions-section">
            <h2 className="transactions-heading">Withdrawal requests</h2>
            {withdrawals.length === 0 ? (
              <p className="empty-state">You have not raised any withdrawal requests yet.</p>
            ) : (
              <div className="transactions-table-container">
                <table className="transactions-table">
                  <thead>
                    <tr>
                      <th>Requested on</th>
                      <th>Amount</th>
                      <th>Status</th>
                      <th>Reference</th>
                    </tr>
                  </thead>
                  <tbody>
                    {withdrawals.map((withdrawal) => (
                      <tr key={withdrawal.id}>
                        <td>{new Date(withdrawal.created_at).toLocaleString()}</td>
                        <td>{formatCurrency(withdrawal.amount)}</td>
                        <td>
                          <span className={`status-pill status-${withdrawal.status}`}>
                            {withdrawal.status}
                          </span>
                        </td>
                        <td>{withdrawal.reference_number || '-'}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </section>
        </div>

        <BottomNavigation activeTab={activeNav} onTabChange={handleNavChange} />
      </div>
    </div>
  )
}

export default Withdrawal
