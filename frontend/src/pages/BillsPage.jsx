import React, { useContext, useState, useEffect } from 'react';
import { CurrencyContext } from '../context/CurrencyContext';
import { Modal } from '../components/Modal';
import { EmptyState } from '../components/EmptyState';
import api from '../services/api';
import { Plus, FileText, CheckCircle, AlertCircle, Clock } from 'lucide-react';

export const BillsPage = () => {
  const { formatCurrency } = useContext(CurrencyContext);
  const [bills, setBills] = useState([]);
  const [accounts, setAccounts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [showModal, setShowModal] = useState(false);

  // Form State
  const [name, setName] = useState('');
  const [amount, setAmount] = useState('');
  const [dueDate, setDueDate] = useState('');
  const [frequency, setFrequency] = useState('monthly');
  const [account, setAccount] = useState('');
  const [category, setCategory] = useState('');

  const fetchData = async () => {
    try {
      const [bRes, aRes, cRes] = await Promise.all([
        api.get('/bills/'),
        api.get('/accounts/'),
        api.get('/categories/'),
      ]);
      setBills(bRes.data);
      setAccounts(aRes.data);
      setCategories(cRes.data);
    } catch (err) {
      console.error('Error fetching bills:', err);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleCreateBill = async (e) => {
    e.preventDefault();
    try {
      await api.post('/bills/', {
        name,
        amount,
        due_date: dueDate,
        recurring_frequency: frequency,
        account: account || null,
        category: category || null,
      });
      setShowModal(false);
      setName('');
      setAmount('');
      fetchData();
    } catch (err) {
      alert('Failed to add bill.');
    }
  };

  const handleMarkPaid = async (bill) => {
    const defaultAcc = accounts.length > 0 ? accounts[0].id : null;
    try {
      await api.post(`/bills/${bill.id}/mark_paid/`, {
        account: defaultAcc,
        date: new Date().toISOString().split('T')[0],
      });
      fetchData();
    } catch (err) {
      alert('Failed to mark bill as paid.');
    }
  };

  return (
    <div>
      <div className="section-header">
        <div>
          <h1 className="section-title">Bills & Payment Reminders</h1>
          <p className="section-desc">Track electricity, broadband, rent, EMI, and subscription bills</p>
        </div>
        <button className="btn btn-primary" onClick={() => setShowModal(true)}>
          <Plus size={16} /> Add Bill
        </button>
      </div>

      {bills.length > 0 ? (
        <div className="table-responsive">
          <table className="custom-table">
            <thead>
              <tr>
                <th>Bill Name</th>
                <th>Due Date</th>
                <th>Frequency</th>
                <th>Associated Account</th>
                <th>Status</th>
                <th>Amount</th>
                <th style={{ textAlign: 'right' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {bills.map((bill) => (
                <tr key={bill.id}>
                  <td>
                    <div style={{ fontWeight: '600' }}>{bill.name}</div>
                  </td>
                  <td style={{ fontWeight: '500' }}>{bill.due_date}</td>
                  <td style={{ textTransform: 'capitalize' }}>{bill.recurring_frequency}</td>
                  <td>{bill.account_name || 'Default Account'}</td>
                  <td>
                    <span
                      className={`badge ${
                        bill.status === 'paid'
                          ? 'badge-success'
                          : bill.status === 'overdue'
                          ? 'badge-danger'
                          : 'badge-warning'
                      }`}
                    >
                      {bill.status.toUpperCase()}
                    </span>
                  </td>
                  <td style={{ fontWeight: '700' }}>{formatCurrency(bill.amount)}</td>
                  <td style={{ textAlign: 'right' }}>
                    {bill.status !== 'paid' && (
                      <button
                        className="btn btn-primary"
                        style={{ padding: '4px 10px', fontSize: '0.775rem' }}
                        onClick={() => handleMarkPaid(bill)}
                      >
                        Mark Paid
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <EmptyState
          title="No bills registered"
          message="Keep track of due dates for electricity, internet, rent, and subscriptions."
          actionText="Add Bill"
          onAction={() => setShowModal(true)}
        />
      )}

      <Modal isOpen={showModal} onClose={() => setShowModal(false)} title="Register Bill">
        <form onSubmit={handleCreateBill}>
          <div className="form-group">
            <label>Bill Name</label>
            <input type="text" className="form-control" placeholder="e.g. Airtel Fiber, Electricity" value={name} onChange={(e) => setName(e.target.value)} required />
          </div>
          <div className="form-group">
            <label>Amount (₹)</label>
            <input type="number" step="0.01" className="form-control" placeholder="799.00" value={amount} onChange={(e) => setAmount(e.target.value)} required />
          </div>
          <div className="form-group">
            <label>Due Date</label>
            <input type="date" className="form-control" value={dueDate} onChange={(e) => setDueDate(e.target.value)} required />
          </div>
          <div className="form-group">
            <label>Frequency</label>
            <select className="form-control" value={frequency} onChange={(e) => setFrequency(e.target.value)}>
              <option value="monthly">Monthly</option>
              <option value="quarterly">Quarterly</option>
              <option value="yearly">Yearly</option>
              <option value="one_time">One-Time</option>
            </select>
          </div>
          <div className="form-group">
            <label>Payment Account</label>
            <select className="form-control" value={account} onChange={(e) => setAccount(e.target.value)}>
              <option value="">Select Account...</option>
              {accounts.map((a) => (
                <option key={a.id} value={a.id}>{a.name}</option>
              ))}
            </select>
          </div>
          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px', marginTop: '20px' }}>
            <button type="button" className="btn btn-secondary" onClick={() => setShowModal(false)}>Cancel</button>
            <button type="submit" className="btn btn-primary">Save Bill</button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
