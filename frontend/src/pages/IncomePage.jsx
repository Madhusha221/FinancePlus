import React, { useContext, useState, useEffect } from 'react';
import { CurrencyContext } from '../context/CurrencyContext';
import { Modal } from '../components/Modal';
import { EmptyState } from '../components/EmptyState';
import api from '../services/api';
import { Plus, TrendingUp, DollarSign } from 'lucide-react';

export const IncomePage = () => {
  const { formatCurrency } = useContext(CurrencyContext);
  const [incomes, setIncomes] = useState([]);
  const [categories, setCategories] = useState([]);
  const [accounts, setAccounts] = useState([]);
  const [showModal, setShowModal] = useState(false);

  // Form State
  const [amount, setAmount] = useState('');
  const [category, setCategory] = useState('');
  const [account, setAccount] = useState('');
  const [description, setDescription] = useState('');
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [paymentMethod, setPaymentMethod] = useState('Net Banking');
  const [notes, setNotes] = useState('');

  const fetchData = async () => {
    try {
      const [incRes, catRes, accRes] = await Promise.all([
        api.get('/transactions/?type=income'),
        api.get('/categories/'),
        api.get('/accounts/'),
      ]);
      setIncomes(incRes.data);
      setCategories(catRes.data.filter((c) => c.category_type === 'income' || c.category_type === 'both'));
      setAccounts(accRes.data);
    } catch (err) {
      console.error('Error fetching income records:', err);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await api.post('/transactions/', {
        transaction_type: 'income',
        amount,
        category,
        account,
        description,
        date,
        payment_method: paymentMethod,
        notes,
      });
      setShowModal(false);
      setAmount('');
      setDescription('');
      fetchData();
    } catch (err) {
      alert('Failed to record income.');
    }
  };

  const totalIncome = incomes.reduce((acc, curr) => acc + Number(curr.amount), 0);

  return (
    <div>
      <div className="section-header">
        <div>
          <h1 className="section-title">Income Management</h1>
          <p className="section-desc">Record salary, freelance work, business income, and dividends</p>
        </div>
        <button className="btn btn-primary" onClick={() => setShowModal(true)}>
          <Plus size={16} /> Record Income
        </button>
      </div>

      <div className="card" style={{ marginBottom: '24px', background: 'linear-gradient(135deg, #ECFDF5, #F0FDF4)', borderColor: '#A7F3D0' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div>
            <div style={{ fontSize: '0.875rem', color: '#065F46', fontWeight: '600' }}>Total Period Income</div>
            <div style={{ fontSize: '2rem', fontWeight: '800', color: '#047857', fontFamily: 'var(--font-heading)' }}>
              {formatCurrency(totalIncome)}
            </div>
          </div>
          <TrendingUp size={40} color="#10B981" />
        </div>
      </div>

      {incomes.length > 0 ? (
        <div className="table-responsive">
          <table className="custom-table">
            <thead>
              <tr>
                <th>Date</th>
                <th>Source / Description</th>
                <th>Category</th>
                <th>Destination Account</th>
                <th>Payment Method</th>
                <th style={{ textAlign: 'right' }}>Amount</th>
              </tr>
            </thead>
            <tbody>
              {incomes.map((inc) => (
                <tr key={inc.id}>
                  <td style={{ fontWeight: '500', fontSize: '0.85rem' }}>{inc.date}</td>
                  <td>
                    <div style={{ fontWeight: '600' }}>{inc.description}</div>
                    {inc.notes && <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{inc.notes}</div>}
                  </td>
                  <td>
                    <span className="badge badge-success">{inc.category_name || 'Income'}</span>
                  </td>
                  <td>{inc.account_name}</td>
                  <td>{inc.payment_method}</td>
                  <td style={{ textAlign: 'right', fontWeight: '700', color: '#10B981' }}>
                    +{formatCurrency(inc.amount)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <EmptyState
          title="No income records logged yet"
          message="Record salary or freelance payouts to increase your account balances."
          actionText="Record Income"
          onAction={() => setShowModal(true)}
        />
      )}

      <Modal isOpen={showModal} onClose={() => setShowModal(false)} title="Record Income Entry">
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label>Amount (₹)</label>
            <input type="number" step="0.01" className="form-control" placeholder="0.00" value={amount} onChange={(e) => setAmount(e.target.value)} required />
          </div>
          <div className="form-group">
            <label>Source Category</label>
            <select className="form-control" value={category} onChange={(e) => setCategory(e.target.value)} required>
              <option value="">Select Source Category...</option>
              {categories.map((c) => (
                <option key={c.id} value={c.id}>{c.name}</option>
              ))}
            </select>
          </div>
          <div className="form-group">
            <label>Deposit Account</label>
            <select className="form-control" value={account} onChange={(e) => setAccount(e.target.value)} required>
              <option value="">Select Destination Account...</option>
              {accounts.map((a) => (
                <option key={a.id} value={a.id}>{a.name}</option>
              ))}
            </select>
          </div>
          <div className="form-group">
            <label>Description</label>
            <input type="text" className="form-control" placeholder="e.g. Monthly Base Salary Credit" value={description} onChange={(e) => setDescription(e.target.value)} required />
          </div>
          <div className="form-group">
            <label>Date Received</label>
            <input type="date" className="form-control" value={date} onChange={(e) => setDate(e.target.value)} required />
          </div>
          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px', marginTop: '20px' }}>
            <button type="button" className="btn btn-secondary" onClick={() => setShowModal(false)}>Cancel</button>
            <button type="submit" className="btn btn-primary">Save Income Entry</button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
