import React, { useContext, useState, useEffect } from 'react';
import { CurrencyContext } from '../context/CurrencyContext';
import { DateContext } from '../context/DateContext';
import { Modal } from '../components/Modal';
import { EmptyState } from '../components/EmptyState';
import api from '../services/api';
import { Plus, PieChart, AlertTriangle, AlertCircle, CheckCircle2 } from 'lucide-react';

export const BudgetsPage = () => {
  const { formatCurrency } = useContext(CurrencyContext);
  const { monthNum, monthName, yearNum } = useContext(DateContext);

  const [budgets, setBudgets] = useState([]);
  const [categories, setCategories] = useState([]);
  const [currentBudget, setCurrentBudget] = useState(null);
  const [showBudgetModal, setShowBudgetModal] = useState(false);
  const [showCategoryBudgetModal, setShowCategoryBudgetModal] = useState(false);

  // Form State
  const [totalAmount, setTotalAmount] = useState('');
  const [selectedCat, setSelectedCat] = useState('');
  const [catAllocated, setCatAllocated] = useState('');

  const fetchData = async () => {
    try {
      const [bRes, cRes] = await Promise.all([
        api.get('/budgets/'),
        api.get('/categories/'),
      ]);
      setBudgets(bRes.data);
      setCategories(cRes.data.filter((c) => c.category_type === 'expense' || c.category_type === 'both'));

      const active = bRes.data.find((b) => b.month === monthNum && b.year === yearNum);
      if (active) {
        setCurrentBudget(active);
      } else if (bRes.data.length > 0) {
        setCurrentBudget(bRes.data[0]);
      }
    } catch (err) {
      console.error('Error fetching budgets:', err);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleCreateOverallBudget = async (e) => {
    e.preventDefault();
    try {
      await api.post('/budgets/', {
        month: monthNum,
        year: yearNum,
        total_amount: totalAmount,
      });
      setShowBudgetModal(false);
      setTotalAmount('');
      fetchData();
    } catch (err) {
      alert('Failed to set budget. Note: Budget for current month may already exist.');
    }
  };

  const handleAddCategoryBudget = async (e) => {
    e.preventDefault();
    if (!currentBudget) return;
    try {
      await api.post('/budget-categories/', {
        budget: currentBudget.id,
        category: selectedCat,
        allocated_amount: catAllocated,
      });
      setShowCategoryBudgetModal(false);
      setCatAllocated('');
      fetchData();
    } catch (err) {
      alert('Failed to add category budget.');
    }
  };

  const totalBudgetAmt = currentBudget ? Number(currentBudget.total_amount) : 0;
  const totalSpentAmt = currentBudget ? Number(currentBudget.total_spent) : 0;
  const remainingAmt = totalBudgetAmt - totalSpentAmt;
  const pctUsed = totalBudgetAmt > 0 ? Math.min(roundVal((totalSpentAmt / totalBudgetAmt) * 100), 100) : 0;
  const rawPct = totalBudgetAmt > 0 ? (totalSpentAmt / totalBudgetAmt) * 100 : 0;

  function roundVal(v) {
    return Math.round(v * 10) / 10;
  }

  return (
    <div>
      <div className="section-header">
        <div>
          <h1 className="section-title">Budgeting & Limits</h1>
          <p className="section-desc">Set spending targets for {monthName} {yearNum}</p>
        </div>
        <div style={{ display: 'flex', gap: '12px' }}>
          {currentBudget && (
            <button className="btn btn-secondary" onClick={() => setShowCategoryBudgetModal(true)}>
              <Plus size={16} /> Category Target
            </button>
          )}
          <button className="btn btn-primary" onClick={() => setShowBudgetModal(true)}>
            <Plus size={16} /> Set Overall Budget
          </button>
        </div>
      </div>

      {currentBudget ? (
        <>
          {/* Main Monthly Budget Card */}
          <div className="card" style={{ marginBottom: '28px' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
              <div>
                <h3 style={{ fontSize: '1.2rem', fontWeight: '700' }}>
                  {monthName} {yearNum} Overall Target
                </h3>
                <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>
                  Total Monthly Expenditure Target
                </div>
              </div>

              <div>
                {rawPct >= 100 ? (
                  <span className="badge badge-danger" style={{ fontSize: '0.85rem', padding: '6px 12px' }}>
                    🔴 Budget Exceeded
                  </span>
                ) : rawPct >= 80 ? (
                  <span className="badge badge-warning" style={{ fontSize: '0.85rem', padding: '6px 12px' }}>
                    ⚠️ 80% Budget Warning
                  </span>
                ) : (
                  <span className="badge badge-success" style={{ fontSize: '0.85rem', padding: '6px 12px' }}>
                    ✅ Budget On Track
                  </span>
                )}
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '16px', marginBottom: '20px' }}>
              <div>
                <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Budget Target</div>
                <div style={{ fontSize: '1.5rem', fontWeight: '800', fontFamily: 'var(--font-heading)' }}>
                  {formatCurrency(totalBudgetAmt)}
                </div>
              </div>
              <div>
                <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Total Spent</div>
                <div style={{ fontSize: '1.5rem', fontWeight: '800', color: rawPct >= 100 ? '#EF4444' : 'var(--text-main)', fontFamily: 'var(--font-heading)' }}>
                  {formatCurrency(totalSpentAmt)}
                </div>
              </div>
              <div>
                <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Remaining Target</div>
                <div style={{ fontSize: '1.5rem', fontWeight: '800', color: remainingAmt < 0 ? '#EF4444' : '#10B981', fontFamily: 'var(--font-heading)' }}>
                  {formatCurrency(remainingAmt)}
                </div>
              </div>
              <div>
                <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Budget Utilization</div>
                <div style={{ fontSize: '1.5rem', fontWeight: '800', fontFamily: 'var(--font-heading)' }}>
                  {roundVal(rawPct)}%
                </div>
              </div>
            </div>

            <div className="progress-container" style={{ height: '12px' }}>
              <div
                className={`progress-bar ${rawPct >= 100 ? 'danger' : rawPct >= 80 ? 'warning' : ''}`}
                style={{ width: `${Math.min(rawPct, 100)}%` }}
              ></div>
            </div>
          </div>

          {/* Category Budgets Grid */}
          <div style={{ marginBottom: '16px' }}>
            <h3 style={{ fontSize: '1.1rem', fontWeight: '700', marginBottom: '16px' }}>Category Level Budgets</h3>

            {currentBudget.category_budgets && currentBudget.category_budgets.length > 0 ? (
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '20px' }}>
                {currentBudget.category_budgets.map((cb) => {
                  const cbAlloc = Number(cb.allocated_amount);
                  const cbSpent = Number(cb.spent_amount);
                  const cbPct = cbAlloc > 0 ? (cbSpent / cbAlloc) * 100 : 0;
                  return (
                    <div key={cb.id} className="card">
                      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                        <span style={{ fontWeight: '700', fontSize: '0.95rem' }}>{cb.category_name}</span>
                        <span style={{ fontSize: '0.85rem', fontWeight: '700', color: cbPct >= 100 ? '#EF4444' : cbPct >= 80 ? '#F59E0B' : '#10B981' }}>
                          {roundVal(cbPct)}%
                        </span>
                      </div>

                      <div className="progress-container">
                        <div
                          className={`progress-bar ${cbPct >= 100 ? 'danger' : cbPct >= 80 ? 'warning' : ''}`}
                          style={{ width: `${Math.min(cbPct, 100)}%` }}
                        ></div>
                      </div>

                      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8rem', color: 'var(--text-muted)', marginTop: '8px' }}>
                        <span>Spent: {formatCurrency(cbSpent)}</span>
                        <span>Target: {formatCurrency(cbAlloc)}</span>
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <EmptyState
                title="No category budgets configured"
                message="Add specific category budgets for Food, Transport, Shopping to track itemized limits."
                actionText="Add Category Target"
                onAction={() => setShowCategoryBudgetModal(true)}
              />
            )}
          </div>
        </>
      ) : (
        <EmptyState
          title={`No budget set for ${monthName} ${yearNum}`}
          message="Set your overall monthly spending limit to track progress and receive warning alerts."
          actionText="Set Monthly Budget"
          onAction={() => setShowBudgetModal(true)}
        />
      )}

      {/* Set Overall Budget Modal */}
      <Modal isOpen={showBudgetModal} onClose={() => setShowBudgetModal(false)} title={`Set Monthly Budget (${monthName} ${yearNum})`}>
        <form onSubmit={handleCreateOverallBudget}>
          <div className="form-group">
            <label>Total Monthly Limit (₹)</label>
            <input
              type="number"
              step="0.01"
              className="form-control"
              placeholder="e.g. 25000.00"
              value={totalAmount}
              onChange={(e) => setTotalAmount(e.target.value)}
              required
            />
          </div>
          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px', marginTop: '20px' }}>
            <button type="button" className="btn btn-secondary" onClick={() => setShowBudgetModal(false)}>Cancel</button>
            <button type="submit" className="btn btn-primary">Save Target</button>
          </div>
        </form>
      </Modal>

      {/* Add Category Budget Modal */}
      <Modal isOpen={showCategoryBudgetModal} onClose={() => setShowCategoryBudgetModal(false)} title="Add Category Budget Target">
        <form onSubmit={handleAddCategoryBudget}>
          <div className="form-group">
            <label>Category</label>
            <select className="form-control" value={selectedCat} onChange={(e) => setSelectedCat(e.target.value)} required>
              <option value="">Select Category...</option>
              {categories.map((c) => (
                <option key={c.id} value={c.id}>{c.name}</option>
              ))}
            </select>
          </div>
          <div className="form-group">
            <label>Category Budget Limit (₹)</label>
            <input
              type="number"
              step="0.01"
              className="form-control"
              placeholder="e.g. 5000.00"
              value={catAllocated}
              onChange={(e) => setCatAllocated(e.target.value)}
              required
            />
          </div>
          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px', marginTop: '20px' }}>
            <button type="button" className="btn btn-secondary" onClick={() => setShowCategoryBudgetModal(false)}>Cancel</button>
            <button type="submit" className="btn btn-primary">Save Category Limit</button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
