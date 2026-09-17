import React, { useContext, useState, useEffect } from 'react';
import { CurrencyContext } from '../context/CurrencyContext';
import { Modal } from '../components/Modal';
import { EmptyState } from '../components/EmptyState';
import api from '../services/api';
import { Plus, Repeat, Play } from 'lucide-react';

export const RecurringPage = () => {
  const { formatCurrency } = useContext(CurrencyContext);
  const [recurringList, setRecurringList] = useState([]);
  const [accounts, setAccounts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [showModal, setShowModal] = useState(false);

  // Form State
  const [title, setTitle] = useState('');
  const [txType, setTxType] = useState('expense');
  const [amount, setAmount] = useState('');
  const [frequency, setFrequency] = useState('monthly');
  const [startDate, setStartDate] = useState(new Date().toISOString().split('T')[0]);
  const [account, setAccount] = useState('');
  const [category, setCategory] = useState('');

  const fetchData = async () => {
    try {
      const [rRes, aRes, cRes] = await Promise.all([
        api.get('/recurring/'),
        api.get('/accounts/'),
        api.get('/categories/'),
      ]);
      setRecurringList(rRes.data);
      setAccounts(aRes.data);
      setCategories(cRes.data);
    } catch (err) {
      console.error('Error fetching recurring transactions:', err);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleCreateRecurring = async (e) => {
    e.preventDefault();
    try {
      await api.post('/recurring/', {
        title,
        transaction_type: txType,
        amount,
        frequency,
        start_date: startDate,
        next_occurrence: startDate,
        account,
        category,
      });
      setShowModal(false);
      setTitle('');
      setAmount('');
      fetchData();
    } catch (err) {
      alert('Failed to set recurring rule.');
    }
  };

  const handleProcessDue = async () => {
    try {
      const res = await api.post('/recurring/process_due/');
      alert(res.data.message);
      fetchData();
    } catch (err) {
      alert('Failed to process recurring transactions.');
    }
  };

  return (
    <div>
      <div className="section-header">
        <div>
          <h1 className="section-title">Recurring Transactions</h1>
          <p className="section-desc">Automate recurring salary, subscriptions, rent, and utility rules</p>
        </div>
        <div style={{ display: 'flex', gap: '12px' }}>
          <button className="btn btn-secondary" onClick={handleProcessDue}>
            <Play size={16} /> Process Due Rules
          </button>
          <button className="btn btn-primary" onClick={() => setShowModal(true)}>
            <Plus size={16} /> Add Recurring Rule
          </button>
        </div>
      </div>

      {recurringList.length > 0 ? (
        <div className="table-responsive">
          <table className="custom-table">
            <thead>
              <tr>
                <th>Title</th>
                <th>Type</th>
                <th>Frequency</th>
                <th>Next Occurrence</th>
                <th>Account</th>
                <th>Category</th>
                <th style={{ textAlign: 'right' }}>Amount</th>
              </tr>
            </thead>
            <tbody>
              {recurringList.map((rec) => (
                <tr key={rec.id}>
                  <td style={{ fontWeight: '600' }}>{rec.title}</td>
                  <td>
                    <span className={`badge ${rec.transaction_type === 'income' ? 'badge-success' : 'badge-danger'}`}>
                      {rec.transaction_type.toUpperCase()}
                    </span>
                  </td>
                  <td style={{ textTransform: 'capitalize' }}>{rec.frequency}</td>
                  <td style={{ fontWeight: '500' }}>{rec.next_occurrence}</td>
                  <td>{rec.account_name}</td>
                  <td>{rec.category_name}</td>
                  <td style={{ textAlign: 'right', fontWeight: '700', color: rec.transaction_type === 'income' ? '#10B981' : '#EF4444' }}>
                    {rec.transaction_type === 'income' ? '+' : '-'}{formatCurrency(rec.amount)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <EmptyState
          title="No recurring rules active"
          message="Setup automated monthly rent, netflix, internet, or salary posting."
          actionText="Add Recurring Rule"
          onAction={() => setShowModal(true)}
        />
      )}

      <Modal isOpen={showModal} onClose={() => setShowModal(false)} title="Configure Recurring Transaction">
        <form onSubmit={handleCreateRecurring}>
          <div className="form-group">
            <label>Rule Title</label>
            <input type="text" className="form-control" placeholder="e.g. Netflix Subscription, House Rent" value={title} onChange={(e) => setTitle(e.target.value)} required />
          </div>
          <div className="form-group">
            <label>Transaction Type</label>
            <select className="form-control" value={txType} onChange={(e) => setTxType(e.target.value)}>
              <option value="expense">Expense</option>
              <option value="income">Income</option>
            </select>
          </div>
          <div className="form-group">
            <label>Amount (₹)</label>
            <input type="number" step="0.01" className="form-control" placeholder="649.00" value={amount} onChange={(e) => setAmount(e.target.value)} required />
          </div>
          <div className="form-group">
            <label>Frequency</label>
            <select className="form-control" value={frequency} onChange={(e) => setFrequency(e.target.value)}>
              <option value="daily">Daily</option>
              <option value="weekly">Weekly</option>
              <option value="monthly">Monthly</option>
              <option value="yearly">Yearly</option>
            </select>
          </div>
          <div className="form-group">
            <label>Start Date</label>
            <input type="date" className="form-control" value={startDate} onChange={(e) => setStartDate(e.target.value)} required />
          </div>
          <div className="form-group">
            <label>Account</label>
            <select className="form-control" value={account} onChange={(e) => setAccount(e.target.value)} required>
              <option value="">Select Account...</option>
              {accounts.map((a) => (
                <option key={a.id} value={a.id}>{a.name}</option>
              ))}
            </select>
          </div>
          <div className="form-group">
            <label>Category</label>
            <select className="form-control" value={category} onChange={(e) => setCategory(e.target.value)} required>
              <option value="">Select Category...</option>
              {categories.map((c) => (
                <option key={c.id} value={c.id}>{c.name}</option>
              ))}
            </select>
          </div>
          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px', marginTop: '20px' }}>
            <button type="button" className="btn btn-secondary" onClick={() => setShowModal(false)}>Cancel</button>
            <button type="submit" className="btn btn-primary">Save Recurring Rule</button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
