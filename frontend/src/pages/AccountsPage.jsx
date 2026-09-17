import React, { useContext, useState, useEffect } from 'react';
import { CurrencyContext } from '../context/CurrencyContext';
import { Modal } from '../components/Modal';
import { EmptyState } from '../components/EmptyState';
import api from '../services/api';
import { Wallet, Plus, ArrowLeftRight, CreditCard, Landmark, PiggyBank, Smartphone } from 'lucide-react';

export const AccountsPage = () => {
  const { formatCurrency } = useContext(CurrencyContext);
  const [accounts, setAccounts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showTransferModal, setShowTransferModal] = useState(false);

  // New Account Form
  const [name, setName] = useState('');
  const [accountType, setAccountType] = useState('bank');
  const [initialBalance, setInitialBalance] = useState('');

  // Transfer Form
  const [fromAccount, setFromAccount] = useState('');
  const [toAccount, setToAccount] = useState('');
  const [transferAmount, setTransferAmount] = useState('');
  const [transferDesc, setTransferDesc] = useState('');

  const fetchAccounts = async () => {
    try {
      const res = await api.get('/accounts/');
      setAccounts(res.data);
    } catch (err) {
      console.error('Error fetching accounts:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAccounts();
  }, []);

  const handleCreateAccount = async (e) => {
    e.preventDefault();
    try {
      await api.post('/accounts/', {
        name,
        account_type: accountType,
        initial_balance: initialBalance || '0.00',
      });
      setShowAddModal(false);
      setName('');
      setInitialBalance('');
      fetchAccounts();
    } catch (err) {
      alert('Failed to create account. Check parameters.');
    }
  };

  const handleTransfer = async (e) => {
    e.preventDefault();
    if (fromAccount === toAccount) {
      alert('Source and destination accounts must be different.');
      return;
    }
    try {
      await api.post('/transactions/', {
        transaction_type: 'transfer',
        amount: transferAmount,
        account: fromAccount,
        to_account: toAccount,
        description: transferDesc || 'Account Transfer',
        date: new Date().toISOString().split('T')[0],
        payment_method: 'Transfer',
      });
      setShowTransferModal(false);
      setTransferAmount('');
      setTransferDesc('');
      fetchAccounts();
    } catch (err) {
      alert(err.response?.data?.to_account || 'Failed to complete transfer.');
    }
  };

  const getAccountIcon = (type) => {
    switch (type) {
      case 'bank': return Landmark;
      case 'savings': return PiggyBank;
      case 'upi':
      case 'wallet': return Smartphone;
      case 'credit_card': return CreditCard;
      default: return Wallet;
    }
  };

  return (
    <div>
      <div className="section-header">
        <div>
          <h1 className="section-title">Financial Accounts</h1>
          <p className="section-desc">Manage bank accounts, wallets, cash, and credit cards</p>
        </div>
        <div style={{ display: 'flex', gap: '12px' }}>
          <button className="btn btn-secondary" onClick={() => setShowTransferModal(true)}>
            <ArrowLeftRight size={16} /> Transfer Money
          </button>
          <button className="btn btn-primary" onClick={() => setShowAddModal(true)}>
            <Plus size={16} /> Add Account
          </button>
        </div>
      </div>

      {accounts.length > 0 ? (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '20px' }}>
          {accounts.map((acc) => {
            const Icon = getAccountIcon(acc.account_type);
            const isNegative = Number(acc.current_balance) < 0;
            return (
              <div key={acc.id} className="card">
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <div
                      style={{
                        width: '42px',
                        height: '42px',
                        borderRadius: 'var(--radius-md)',
                        backgroundColor: isNegative ? '#FEF2F2' : '#ECFDF5',
                        color: isNegative ? '#EF4444' : '#10B981',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                      }}
                    >
                      <Icon size={22} />
                    </div>
                    <div>
                      <h3 style={{ fontSize: '1rem', fontWeight: '700' }}>{acc.name}</h3>
                      <span className="badge badge-info">{acc.account_type_display}</span>
                    </div>
                  </div>
                </div>

                <div style={{ marginTop: '12px' }}>
                  <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Current Calculated Balance</div>
                  <div
                    style={{
                      fontSize: '1.6rem',
                      fontWeight: '800',
                      color: isNegative ? '#EF4444' : 'var(--text-main)',
                      fontFamily: 'var(--font-heading)',
                    }}
                  >
                    {formatCurrency(acc.current_balance)}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <EmptyState
          title="No accounts created yet"
          message="Create your first bank or wallet account to start tracking transactions."
          actionText="Add Account"
          onAction={() => setShowAddModal(true)}
        />
      )}

      {/* Add Account Modal */}
      <Modal isOpen={showAddModal} onClose={() => setShowAddModal(false)} title="Create New Account">
        <form onSubmit={handleCreateAccount}>
          <div className="form-group">
            <label>Account Name</label>
            <input
              type="text"
              className="form-control"
              placeholder="e.g. HDFC Bank, SBI Savings, Cash"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
            />
          </div>
          <div className="form-group">
            <label>Account Type</label>
            <select
              className="form-control"
              value={accountType}
              onChange={(e) => setAccountType(e.target.value)}
            >
              <option value="bank">Bank Account</option>
              <option value="savings">Savings Account</option>
              <option value="cash">Cash</option>
              <option value="upi">UPI Wallet</option>
              <option value="wallet">Digital Wallet</option>
              <option value="credit_card">Credit Card</option>
            </select>
          </div>
          <div className="form-group">
            <label>Initial Starting Balance (₹)</label>
            <input
              type="number"
              step="0.01"
              className="form-control"
              placeholder="0.00"
              value={initialBalance}
              onChange={(e) => setInitialBalance(e.target.value)}
            />
          </div>
          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px', marginTop: '20px' }}>
            <button type="button" className="btn btn-secondary" onClick={() => setShowAddModal(false)}>
              Cancel
            </button>
            <button type="submit" className="btn btn-primary">
              Create Account
            </button>
          </div>
        </form>
      </Modal>

      {/* Transfer Modal */}
      <Modal isOpen={showTransferModal} onClose={() => setShowTransferModal(false)} title="Transfer Money Between Accounts">
        <form onSubmit={handleTransfer}>
          <div className="form-group">
            <label>From Account (Source)</label>
            <select
              className="form-control"
              value={fromAccount}
              onChange={(e) => setFromAccount(e.target.value)}
              required
            >
              <option value="">Select source account...</option>
              {accounts.map((a) => (
                <option key={a.id} value={a.id}>
                  {a.name} ({formatCurrency(a.current_balance)})
                </option>
              ))}
            </select>
          </div>

          <div className="form-group">
            <label>To Account (Destination)</label>
            <select
              className="form-control"
              value={toAccount}
              onChange={(e) => setToAccount(e.target.value)}
              required
            >
              <option value="">Select destination account...</option>
              {accounts.map((a) => (
                <option key={a.id} value={a.id}>
                  {a.name} ({formatCurrency(a.current_balance)})
                </option>
              ))}
            </select>
          </div>

          <div className="form-group">
            <label>Transfer Amount (₹)</label>
            <input
              type="number"
              step="0.01"
              className="form-control"
              placeholder="0.00"
              value={transferAmount}
              onChange={(e) => setTransferAmount(e.target.value)}
              required
            />
          </div>

          <div className="form-group">
            <label>Description / Reason</label>
            <input
              type="text"
              className="form-control"
              placeholder="e.g. Monthly Savings allocation"
              value={transferDesc}
              onChange={(e) => setTransferDesc(e.target.value)}
            />
          </div>

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px', marginTop: '20px' }}>
            <button type="button" className="btn btn-secondary" onClick={() => setShowTransferModal(false)}>
              Cancel
            </button>
            <button type="submit" className="btn btn-primary">
              Execute Transfer
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
