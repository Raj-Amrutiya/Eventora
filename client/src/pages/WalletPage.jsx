import { useEffect, useMemo, useState } from 'react';
import dayjs from 'dayjs';
import http from '../api/http';

function WalletPage() {
  const [wallet, setWallet] = useState(null);
  const [transactions, setTransactions] = useState([]);
  const [amount, setAmount] = useState('500');
  const [bonusAmount, setBonusAmount] = useState('0');
  const [paymentMethod, setPaymentMethod] = useState('upi');
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [lastUpdated, setLastUpdated] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState('');

  const loadWallet = async ({ silent = false } = {}) => {
    try {
      if (silent) {
        setRefreshing(true);
      } else {
        setLoading(true);
      }
      const response = await http.get('/wallet/me');
      setWallet(response.data.data.wallet);
      setTransactions(response.data.data.transactions || []);
      setLastUpdated(new Date());
    } catch (error) {
      setMessage(error.response?.data?.message || 'Unable to load wallet.');
    } finally {
      if (silent) {
        setRefreshing(false);
      } else {
        setLoading(false);
      }
    }
  };

  useEffect(() => {
    loadWallet();
  }, []);

  const summary = useMemo(
    () => [
      { label: 'Wallet balance', value: `INR ${wallet?.balance || 0}` },
      { label: 'Transactions', value: transactions.length },
      { label: 'Currency', value: wallet?.currency || 'INR' },
    ],
    [wallet, transactions]
  );

  const totalCredited = useMemo(
    () => transactions.filter((transaction) => transaction.type === 'credit').reduce((sum, transaction) => sum + Number(transaction.amount || 0), 0),
    [transactions]
  );

  const totalDebited = useMemo(
    () => transactions.filter((transaction) => transaction.type === 'debit').reduce((sum, transaction) => sum + Number(transaction.amount || 0), 0),
    [transactions]
  );

  const submitTopUp = async () => {
    try {
      setSubmitting(true);
      setMessage('');
      await http.post('/wallet/top-up', {
        amount: Number(amount),
        bonusAmount: Number(bonusAmount || 0),
        paymentMethod,
      });
      setMessage('Wallet updated successfully.');
      await loadWallet();
    } catch (error) {
      setMessage(error.response?.data?.message || 'Wallet top-up failed.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="page-shell wallet-page">
      <section className="hero-block wallet-hero">
        <div className="section-head">
          <div>
            <p className="kicker">Digital wallet</p>
            <h1>Campus Wallet</h1>
            <p>Add money, pay for tickets faster, and get refunds back instantly into your wallet.</p>
          </div>
          <div className="wallet-head-tools">
            <button type="button" className={`btn ghost ${refreshing ? 'is-refreshing' : ''}`} onClick={() => loadWallet({ silent: true })} disabled={loading || refreshing}>
              {refreshing ? 'Refreshing...' : 'Refresh'}
            </button>
            <p className="wallet-refresh-meta">
              {lastUpdated ? `Last updated: ${dayjs(lastUpdated).format('DD MMM, hh:mm A')}` : 'Not synced yet'}
            </p>
          </div>
        </div>

        <div className="wallet-summary-grid">
          {summary.map((item) => (
            <article key={item.label} className="wallet-summary-card">
              <span>{item.label}</span>
              <strong>{item.value}</strong>
            </article>
          ))}
        </div>
      </section>

      <section className="wallet-layout">
        <article className="card wallet-panel">
          <div className="section-head">
            <div>
              <h2>Top Up Wallet</h2>
              <p>Use this balance for ticket payments and instant refund credits.</p>
            </div>
          </div>

          <div className="wallet-quick-topup">
            <button type="button" className={`chip ${amount === '200' ? 'active' : ''}`} onClick={() => setAmount('200')}>INR 200</button>
            <button type="button" className={`chip ${amount === '500' ? 'active' : ''}`} onClick={() => setAmount('500')}>INR 500</button>
            <button type="button" className={`chip ${amount === '1000' ? 'active' : ''}`} onClick={() => setAmount('1000')}>INR 1000</button>
            <button type="button" className={`chip ${amount === '2000' ? 'active' : ''}`} onClick={() => setAmount('2000')}>INR 2000</button>
          </div>

          <div className="wallet-form-grid">
            <label>
              Amount
              <input type="number" min="1" value={amount} onChange={(event) => setAmount(event.target.value)} />
            </label>
            <label>
              Bonus Amount
              <input type="number" min="0" value={bonusAmount} onChange={(event) => setBonusAmount(event.target.value)} />
            </label>
            <label>
              Payment Method
              <select value={paymentMethod} onChange={(event) => setPaymentMethod(event.target.value)}>
                <option value="upi">UPI</option>
                <option value="card">Card</option>
                <option value="netbanking">Net Banking</option>
              </select>
            </label>
          </div>

          <button type="button" className="btn wallet-add-btn" onClick={submitTopUp} disabled={submitting}>
            {submitting ? 'Updating Wallet...' : 'Add Money'}
          </button>

          {message ? <p className="wallet-message">{message}</p> : null}
        </article>

        <article className="card wallet-panel">
          <div className="section-head">
            <div>
              <h2>Transaction History</h2>
              <p>Credits, debits, refunds, and bonus additions are tracked here.</p>
            </div>
          </div>

          <div className="wallet-trx-summary">
            <article>
              <span>Total Credited</span>
              <strong className="wallet-credit">+INR {totalCredited}</strong>
            </article>
            <article>
              <span>Total Debited</span>
              <strong className="wallet-debit">-INR {totalDebited}</strong>
            </article>
          </div>

          {loading ? <p className="loading-shell">Loading wallet activity...</p> : null}

          {!loading && transactions.length === 0 ? (
            <div className="history-empty">
              <p>No wallet transactions yet.</p>
              <small>Top up your wallet to start using quick checkout.</small>
            </div>
          ) : null}

          {!loading && transactions.length > 0 ? (
            <div className="wallet-transaction-list">
              {transactions.map((transaction) => (
                <article key={transaction._id} className="wallet-transaction-card">
                  <div>
                    <span className={`status-pill ${transaction.type === 'credit' ? 'approved' : 'failed'}`}>
                      {transaction.type}
                    </span>
                    <h4>{transaction.description}</h4>
                    <p>{dayjs(transaction.createdAt).format('DD MMM YYYY, hh:mm A')}</p>
                  </div>
                  <strong className={transaction.type === 'credit' ? 'wallet-credit' : 'wallet-debit'}>
                    {transaction.type === 'credit' ? '+' : '-'}INR {transaction.amount}
                  </strong>
                </article>
              ))}
            </div>
          ) : null}
        </article>
      </section>
    </div>
  );
}

export default WalletPage;