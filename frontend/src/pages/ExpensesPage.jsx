import React, { useContext, useState, useEffect } from 'react';
import { CurrencyContext } from '../context/CurrencyContext';
import { Modal } from '../components/Modal';
import { EmptyState } from '../components/EmptyState';
import api from '../services/api';
import { Plus, TrendingDown, Tag, ShoppingBag, ShieldCheck, HeartHandshake } from 'lucide-react';

export const ExpensesPage = () => {
  const { formatCurrency } = useContext(CurrencyContext);
  const [expenses, setExpenses] = useState([]);
  const [categories, setCategories] = useState([]);
  const [accounts, setAccounts] = useState([]);
  const [showModal, setShowModal] = useState(false);

  // Form State
  const [amount, setAmount] = useState('');
  const [category, setCategory] = useState('');
  const [account, setAccount] = useState('');
  const [description, setDescription] = useState('');
  const [merchant, setMerchant] = useState('');
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [paymentMethod, setPaymentMethod] = useState('UPI');
  const [isNeed, setIsNeed] = useState(true);

  const fetchData = async () => {
    try {
      const [expRes, catRes, accRes] = await Promise.all([
        api.get('/transactions/?type=expense'),
        api.get('/categories/'),
        api.get('/accounts/'),
      ]);
      setExpenses(expRes.data);
      setCategories(catRes.data.filter((c) => c.category_type === 'expense' || c.category_type === 'both'));
      setAccounts(accRes.data);
    } catch (err) {
      console.error('Error fetching expenses:', err);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await api.post('/transactions/', {
        transaction_type: 'expense',
        amount,
        category,
        account,
        description,
        merchant,
        date,
        payment_method: paymentMethod,
        is_need: isNeed,
      });
      setShowModal(false);
      setAmount('');
      setDescription('');
      setMerchant('');
      fetchData();
    } catch (err) {
      alert('Failed to log expense.');
    }
  };

  const totalExpense = expenses.reduce((acc, curr) => acc + Number(curr.amount), 0);

  return (
    <div>
      <div className="section-header">
        <div>
          <h1 className="section-title">Expense Management</h1>
          <p className="section-desc">Track and analyze personal daily expenditures</p>
        </div>
        <button className="btn btn-primary" onClick={() => setShowModal(true)}>
          <Plus size={16} /> Log Expense
        </button>
      </div>

      <div className="card" style={{ marginBottom: '24px', background: 'linear-gradient(135deg, #FEF2F2, #FFF5F5)', borderColor: '#FCA5A5' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div>
            <div style={{ fontSize: '0.875rem', color: '#991B1B', fontWeight: '600' }}>Total Period Expense</div>
            <div style={{ fontSize: '2rem', fontWeight: '800', color: '#7F1D1D', fontFamily: 'var(--font-heading)' }}>
              {formatCurrency(totalExpense)}
            </div>
          </div>
          <TrendingDown size={40} color="#EF4444" />
        </div>
      </div>

      {expenses.length > 0 ? (
        <div className="table-responsive">
          <table className="custom-table">
            <thead>
              <tr>
                <th>Date</th>
                <th>Merchant & Description</th>
                <th>Category</th>
                <th>Account</th>
                <th>Classification</th>
                <th>Payment Method</th>
                <th style={{ textAlign: 'right' }}>Amount</th>
              </tr>
            </thead>
            <tbody>
              {expenses.map((exp) => (
                <tr key={exp.id}>
                  <td style={{ fontWeight: '500', fontSize: '0.85rem' }}>{exp.date}</td>
                  <td>
                    <div style={{ fontWeight: '600' }}>{exp.description}</div>
                    {exp.merchant && <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{exp.merchant}</div>}
                  </td>
                  <td>
                    <span className="badge badge-info">{exp.category_name || 'Expense'}</span>
                  </td>
                  <td>{exp.account_name}</td>
                  <td>
                    <span className={`badge ${exp.is_need ? 'badge-success' : 'badge-warning'}`}>
                      {exp.is_need ? 'Need' : 'Want'}
                    </span>
                  </td>
                  <td>{exp.payment_method}</td>
                  <td style={{ textAlign: 'right', fontWeight: '700', color: '#EF4444' }}>
                    -{formatCurrency(exp.amount)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <EmptyState
          title="No expenses logged yet"
          message="Click below to add your first expense record."
          actionText="Log Expense"
          onAction={() => setShowModal(true)}
        />
      )}

      <Modal isOpen={showModal} onClose={() => setShowModal(false)} title="Record Expense">
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label>Amount (₹)</label>
            <input type="number" step="0.01" className="form-control" placeholder="0.00" value={amount} onChange={(e) => setAmount(e.target.value)} required />
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
            <label>Description</label>
            <input type="text" className="form-control" placeholder="e.g. Swiggy Gourmet Lunch" value={description} onChange={(e) => setDescription(e.target.value)} required />
          </div>
          <div className="form-group">
            <label>Merchant / Store</label>
            <input type="text" className="form-control" placeholder="e.g. Swiggy, Amazon, Shell" value={merchant} onChange={(e) => setMerchant(e.target.value)} />
          </div>
          <div className="form-group">
            <label>Need vs Want Classification</label>
            <select className="form-control" value={isNeed ? 'true' : 'false'} onChange={(e) => setIsNeed(e.target.value === 'true')}>
              <option value="true">Need (Essential)</option>
              <option value="false">Want (Discretionary)</option>
            </select>
          </div>
          <div className="form-group">
            <label>Date</label>
            <input type="date" className="form-control" value={date} onChange={(e) => setDate(e.target.value)} required />
          </div>
          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px', marginTop: '20px' }}>
            <button type="button" className="btn btn-secondary" onClick={() => setShowModal(false)}>Cancel</button>
            <button type="submit" className="btn btn-primary">Save Expense</button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
