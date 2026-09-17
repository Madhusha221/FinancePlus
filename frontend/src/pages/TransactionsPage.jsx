import React, { useContext, useState, useEffect } from 'react';
import { CurrencyContext } from '../context/CurrencyContext';
import { Modal } from '../components/Modal';
import { EmptyState } from '../components/EmptyState';
import api from '../services/api';
import { Plus, Search, Filter, Trash2, Edit3, ArrowUpRight, ArrowDownLeft, RefreshCw } from 'lucide-react';

export const TransactionsPage = ({ searchQuery, setSearchQuery }) => {
  const { formatCurrency } = useContext(CurrencyContext);
  const [transactions, setTransactions] = useState([]);
  const [categories, setCategories] = useState([]);
  const [accounts, setAccounts] = useState([]);
  const [loading, setLoading] = useState(true);

  // Filters
  const [filterType, setFilterType] = useState('');
  const [filterCategory, setFilterCategory] = useState('');
  const [filterAccount, setFilterAccount] = useState('');
  const [filterNeed, setFilterNeed] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');

  // Modal State
  const [showModal, setShowModal] = useState(false);
  const [editingTx, setEditingTx] = useState(null);

  // Form Fields
  const [txType, setTxType] = useState('expense');
  const [amount, setAmount] = useState('');
  const [category, setCategory] = useState('');
  const [account, setAccount] = useState('');
  const [toAccount, setToAccount] = useState('');
  const [description, setDescription] = useState('');
  const [merchant, setMerchant] = useState('');
  const [txDate, setTxDate] = useState(new Date().toISOString().split('T')[0]);
  const [paymentMethod, setPaymentMethod] = useState('UPI');
  const [isNeed, setIsNeed] = useState(true);
  const [notes, setNotes] = useState('');

  const fetchData = async () => {
    try {
      let queryParams = [];
      if (filterType) queryParams.push(`type=${filterType}`);
      if (filterCategory) queryParams.push(`category=${filterCategory}`);
      if (filterAccount) queryParams.push(`account=${filterAccount}`);
      if (filterNeed) queryParams.push(`is_need=${filterNeed}`);
      if (startDate) queryParams.push(`start_date=${startDate}`);
      if (endDate) queryParams.push(`end_date=${endDate}`);
      if (searchQuery) queryParams.push(`search=${encodeURIComponent(searchQuery)}`);

      const queryString = queryParams.length ? `?${queryParams.join('&')}` : '';

      const [txRes, catRes, accRes] = await Promise.all([
        api.get(`/transactions/${queryString}`),
        api.get('/categories/'),
        api.get('/accounts/'),
      ]);

      setTransactions(txRes.data);
      setCategories(catRes.data);
      setAccounts(accRes.data);
    } catch (err) {
      console.error('Error fetching transactions:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [filterType, filterCategory, filterAccount, filterNeed, startDate, endDate, searchQuery]);

  const handleOpenAddModal = () => {
    setEditingTx(null);
    setTxType('expense');
    setAmount('');
    setCategory(categories.length > 0 ? categories[0].id : '');
    setAccount(accounts.length > 0 ? accounts[0].id : '');
    setToAccount('');
    setDescription('');
    setMerchant('');
    setTxDate(new Date().toISOString().split('T')[0]);
    setPaymentMethod('UPI');
    setIsNeed(true);
    setNotes('');
    setShowModal(true);
  };

  const handleOpenEditModal = (tx) => {
    setEditingTx(tx);
    setTxType(tx.transaction_type);
    setAmount(tx.amount);
    setCategory(tx.category || '');
    setAccount(tx.account || '');
    setToAccount(tx.to_account || '');
    setDescription(tx.description);
    setMerchant(tx.merchant || '');
    setTxDate(tx.date);
    setPaymentMethod(tx.payment_method || 'UPI');
    setIsNeed(tx.is_need);
    setNotes(tx.notes || '');
    setShowModal(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const payload = {
      transaction_type: txType,
      amount,
      category: txType === 'transfer' ? null : category || null,
      account,
      to_account: txType === 'transfer' ? toAccount : null,
      description,
      merchant,
      date: txDate,
      payment_method: paymentMethod,
      is_need: isNeed,
      notes,
    };

    try {
      if (editingTx) {
        await api.put(`/transactions/${editingTx.id}/`, payload);
      } else {
        await api.post('/transactions/', payload);
      }
      setShowModal(false);
      fetchData();
    } catch (err) {
      alert(err.response?.data?.detail || 'Failed to save transaction. Verify input values.');
    }
  };

  const handleDelete = async (id) => {
    if (window.confirm('Are you sure you want to delete this transaction? Account balance will be recalculated automatically.')) {
      try {
        await api.delete(`/transactions/${id}/`);
        fetchData();
      } catch (err) {
        alert('Failed to delete transaction.');
      }
    }
  };

  return (
    <div>
      <div className="section-header">
        <div>
          <h1 className="section-title">Transactions</h1>
          <p className="section-desc">Unified record of income, expenses, and account transfers</p>
        </div>
        <button className="btn btn-primary" onClick={handleOpenAddModal}>
          <Plus size={16} /> Add Transaction
        </button>
      </div>

      {/* Filter Controls Card */}
      <div className="card" style={{ marginBottom: '24px', padding: '16px' }}>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: '12px' }}>
          <div>
            <label style={{ fontSize: '0.75rem', fontWeight: '600', color: 'var(--text-muted)' }}>Type</label>
            <select className="form-control" value={filterType} onChange={(e) => setFilterType(e.target.value)}>
              <option value="">All Types</option>
              <option value="income">Income</option>
              <option value="expense">Expense</option>
              <option value="transfer">Transfer</option>
            </select>
          </div>

          <div>
            <label style={{ fontSize: '0.75rem', fontWeight: '600', color: 'var(--text-muted)' }}>Category</label>
            <select className="form-control" value={filterCategory} onChange={(e) => setFilterCategory(e.target.value)}>
              <option value="">All Categories</option>
              {categories.map((c) => (
                <option key={c.id} value={c.id}>{c.name}</option>
              ))}
            </select>
          </div>

          <div>
            <label style={{ fontSize: '0.75rem', fontWeight: '600', color: 'var(--text-muted)' }}>Account</label>
            <select className="form-control" value={filterAccount} onChange={(e) => setFilterAccount(e.target.value)}>
              <option value="">All Accounts</option>
              {accounts.map((a) => (
                <option key={a.id} value={a.id}>{a.name}</option>
              ))}
            </select>
          </div>

          <div>
            <label style={{ fontSize: '0.75rem', fontWeight: '600', color: 'var(--text-muted)' }}>Need vs Want</label>
            <select className="form-control" value={filterNeed} onChange={(e) => setFilterNeed(e.target.value)}>
              <option value="">All</option>
              <option value="true">Needs Only</option>
              <option value="false">Wants Only</option>
            </select>
          </div>

          <div>
            <label style={{ fontSize: '0.75rem', fontWeight: '600', color: 'var(--text-muted)' }}>Start Date</label>
            <input type="date" className="form-control" value={startDate} onChange={(e) => setStartDate(e.target.value)} />
          </div>

          <div>
            <label style={{ fontSize: '0.75rem', fontWeight: '600', color: 'var(--text-muted)' }}>End Date</label>
            <input type="date" className="form-control" value={endDate} onChange={(e) => setEndDate(e.target.value)} />
          </div>
        </div>
      </div>

      {/* Transactions Table */}
      {transactions.length > 0 ? (
        <div className="table-responsive">
          <table className="custom-table">
            <thead>
              <tr>
                <th>Date</th>
                <th>Description</th>
                <th>Type</th>
                <th>Category</th>
                <th>Account</th>
                <th>Classification</th>
                <th>Amount</th>
                <th style={{ textAlign: 'right' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {transactions.map((tx) => (
                <tr key={tx.id}>
                  <td style={{ fontWeight: '500', fontSize: '0.85rem' }}>{tx.date}</td>
                  <td>
                    <div style={{ fontWeight: '600' }}>{tx.description}</div>
                    {tx.merchant && <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{tx.merchant}</div>}
                  </td>
                  <td>
                    <span className={`badge ${tx.transaction_type === 'income' ? 'badge-success' : tx.transaction_type === 'expense' ? 'badge-danger' : 'badge-info'}`}>
                      {tx.transaction_type.toUpperCase()}
                    </span>
                  </td>
                  <td>{tx.category_name || '-'}</td>
                  <td>{tx.account_name} {tx.to_account_name ? `➔ ${tx.to_account_name}` : ''}</td>
                  <td>
                    {tx.transaction_type === 'expense' ? (
                      <span className={`badge ${tx.is_need ? 'badge-info' : 'badge-warning'}`}>
                        {tx.is_need ? 'Need' : 'Want'}
                      </span>
                    ) : '-'}
                  </td>
                  <td style={{ fontWeight: '700', color: tx.transaction_type === 'income' ? '#10B981' : tx.transaction_type === 'expense' ? '#EF4444' : '#3B82F6' }}>
                    {tx.transaction_type === 'income' ? '+' : tx.transaction_type === 'expense' ? '-' : ''}
                    {formatCurrency(tx.amount)}
                  </td>
                  <td style={{ textAlign: 'right' }}>
                    <button style={{ background: 'none', border: 'none', cursor: 'pointer', marginRight: '10px', color: 'var(--text-muted)' }} onClick={() => handleOpenEditModal(tx)}>
                      <Edit3 size={16} />
                    </button>
                    <button style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#EF4444' }} onClick={() => handleDelete(tx.id)}>
                      <Trash2 size={16} />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <EmptyState
          title="No transactions found"
          message="No records match your criteria. Add your first expense or income."
          actionText="Add Transaction"
          onAction={handleOpenAddModal}
        />
      )}

      {/* Add / Edit Transaction Modal */}
      <Modal isOpen={showModal} onClose={() => setShowModal(false)} title={editingTx ? "Edit Transaction" : "Record New Transaction"}>
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label>Transaction Type</label>
            <select className="form-control" value={txType} onChange={(e) => setTxType(e.target.value)}>
              <option value="expense">Expense</option>
              <option value="income">Income</option>
              <option value="transfer">Transfer</option>
            </select>
          </div>

          <div className="form-group">
            <label>Amount (₹)</label>
            <input type="number" step="0.01" className="form-control" placeholder="0.00" value={amount} onChange={(e) => setAmount(e.target.value)} required />
          </div>

          <div className="form-group">
            <label>Description</label>
            <input type="text" className="form-control" placeholder="e.g. Swiggy Dinner, Salary Credit, Rent" value={description} onChange={(e) => setDescription(e.target.value)} required />
          </div>

          {txType !== 'transfer' && (
            <div className="form-group">
              <label>Category</label>
              <select className="form-control" value={category} onChange={(e) => setCategory(e.target.value)} required>
                <option value="">Select Category...</option>
                {categories
                  .filter((c) => c.category_type === txType || c.category_type === 'both')
                  .map((c) => (
                    <option key={c.id} value={c.id}>{c.name}</option>
                  ))}
              </select>
            </div>
          )}

          <div className="form-group">
            <label>{txType === 'transfer' ? 'From Account' : 'Account'}</label>
            <select className="form-control" value={account} onChange={(e) => setAccount(e.target.value)} required>
              <option value="">Select Account...</option>
              {accounts.map((a) => (
                <option key={a.id} value={a.id}>{a.name} ({formatCurrency(a.current_balance)})</option>
              ))}
            </select>
          </div>

          {txType === 'transfer' && (
            <div className="form-group">
              <label>To Account (Destination)</label>
              <select className="form-control" value={toAccount} onChange={(e) => setToAccount(e.target.value)} required>
                <option value="">Select Destination Account...</option>
                {accounts.map((a) => (
                  <option key={a.id} value={a.id}>{a.name} ({formatCurrency(a.current_balance)})</option>
                ))}
              </select>
            </div>
          )}

          <div className="form-group">
            <label>Date</label>
            <input type="date" className="form-control" value={txDate} onChange={(e) => setTxDate(e.target.value)} required />
          </div>

          {txType === 'expense' && (
            <>
              <div className="form-group">
                <label>Merchant / Payee</label>
                <input type="text" className="form-control" placeholder="e.g. Swiggy, Amazon, Shell" value={merchant} onChange={(e) => setMerchant(e.target.value)} />
              </div>

              <div className="form-group">
                <label>Classification (Need vs Want)</label>
                <select className="form-control" value={isNeed ? 'true' : 'false'} onChange={(e) => setIsNeed(e.target.value === 'true')}>
                  <option value="true">Need (Essential)</option>
                  <option value="false">Want (Discretionary)</option>
                </select>
              </div>
            </>
          )}

          <div className="form-group">
            <label>Payment Method</label>
            <select className="form-control" value={paymentMethod} onChange={(e) => setPaymentMethod(e.target.value)}>
              <option value="UPI">UPI</option>
              <option value="Debit Card">Debit Card</option>
              <option value="Credit Card">Credit Card</option>
              <option value="Net Banking">Net Banking</option>
              <option value="Cash">Cash</option>
            </select>
          </div>

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px', marginTop: '20px' }}>
            <button type="button" className="btn btn-secondary" onClick={() => setShowModal(false)}>Cancel</button>
            <button type="submit" className="btn btn-primary">{editingTx ? "Save Changes" : "Create Record"}</button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
