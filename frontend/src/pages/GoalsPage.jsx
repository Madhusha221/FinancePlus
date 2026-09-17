import React, { useContext, useState, useEffect } from 'react';
import { CurrencyContext } from '../context/CurrencyContext';
import { Modal } from '../components/Modal';
import { EmptyState } from '../components/EmptyState';
import api from '../services/api';
import { Plus, Target, PiggyBank, Calendar, Clock, AlertCircle, ArrowUpRight } from 'lucide-react';

export const GoalsPage = () => {
  const { formatCurrency } = useContext(CurrencyContext);
  const [goals, setGoals] = useState([]);
  const [accounts, setAccounts] = useState([]);
  const [loading, setLoading] = useState(true);

  // Add Goal Form
  const [showGoalModal, setShowGoalModal] = useState(false);
  const [name, setName] = useState('');
  const [goalType, setGoalType] = useState('laptop');
  const [targetAmount, setTargetAmount] = useState('');
  const [initialAmount, setInitialAmount] = useState('');
  const [targetDate, setTargetDate] = useState('');
  const [priority, setPriority] = useState('medium');
  const [description, setDescription] = useState('');

  // Contribution Form
  const [showContribModal, setShowContribModal] = useState(false);
  const [selectedGoal, setSelectedGoal] = useState(null);
  const [contribAmount, setContribAmount] = useState('');
  const [fromAccount, setFromAccount] = useState('');
  const [contribNotes, setContribNotes] = useState('');

  const fetchData = async () => {
    try {
      const [gRes, aRes] = await Promise.all([
        api.get('/goals/'),
        api.get('/accounts/'),
      ]);
      setGoals(gRes.data);
      setAccounts(aRes.data);
    } catch (err) {
      console.error('Error fetching goals:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleCreateGoal = async (e) => {
    e.preventDefault();
    try {
      await api.post('/goals/', {
        name,
        goal_type: goalType,
        target_amount: targetAmount,
        current_amount: initialAmount || '0.00',
        target_date: targetDate,
        priority,
        description,
      });
      setShowGoalModal(false);
      setName('');
      setTargetAmount('');
      setInitialAmount('');
      fetchData();
    } catch (err) {
      alert('Failed to create goal.');
    }
  };

  const handleOpenContribModal = (goal) => {
    setSelectedGoal(goal);
    setContribAmount('');
    setFromAccount(accounts.length > 0 ? accounts[0].id : '');
    setContribNotes('');
    setShowContribModal(true);
  };

  const handleAddContribution = async (e) => {
    e.preventDefault();
    if (!selectedGoal) return;
    try {
      await api.post(`/goals/${selectedGoal.id}/add_contribution/`, {
        amount: contribAmount,
        from_account: fromAccount,
        notes: contribNotes,
        date: new Date().toISOString().split('T')[0],
      });
      setShowContribModal(false);
      fetchData();
    } catch (err) {
      alert('Failed to record contribution.');
    }
  };

  return (
    <div>
      <div className="section-header">
        <div>
          <h1 className="section-title">Savings & Target Goals</h1>
          <p className="section-desc">Plan and allocate funds for future major purchases and milestones</p>
        </div>
        <button className="btn btn-primary" onClick={() => setShowGoalModal(true)}>
          <Plus size={16} /> Create Savings Goal
        </button>
      </div>

      {goals.length > 0 ? (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '24px' }}>
          {goals.map((goal) => {
            const isCompleted = goal.current_amount >= goal.target_amount;
            return (
              <div key={goal.id} className="card" style={{ display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '12px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                      <div
                        style={{
                          width: '40px',
                          height: '40px',
                          borderRadius: 'var(--radius-md)',
                          backgroundColor: isCompleted ? '#ECFDF5' : '#F0FDF4',
                          color: '#10B981',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                        }}
                      >
                        <Target size={22} />
                      </div>
                      <div>
                        <h3 style={{ fontSize: '1.05rem', fontWeight: '700' }}>{goal.name}</h3>
                        <span className={`badge ${goal.priority === 'high' ? 'badge-danger' : 'badge-info'}`}>
                          {goal.priority.toUpperCase()} PRIORITY
                        </span>
                      </div>
                    </div>
                    <span style={{ fontSize: '1.25rem', fontWeight: '800', color: '#10B981', fontFamily: 'var(--font-heading)' }}>
                      {goal.progress_percentage}%
                    </span>
                  </div>

                  <div className="progress-container" style={{ height: '10px' }}>
                    <div className="progress-bar" style={{ width: `${goal.progress_percentage}%` }}></div>
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginTop: '16px', padding: '12px', backgroundColor: 'var(--bg-main)', borderRadius: 'var(--radius-sm)' }}>
                    <div>
                      <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Saved Amount</div>
                      <div style={{ fontWeight: '700', fontSize: '1rem', color: '#10B981' }}>{formatCurrency(goal.current_amount)}</div>
                    </div>
                    <div>
                      <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Target Amount</div>
                      <div style={{ fontWeight: '700', fontSize: '1rem' }}>{formatCurrency(goal.target_amount)}</div>
                    </div>
                  </div>

                  <div style={{ marginTop: '14px', fontSize: '0.825rem', color: 'var(--text-muted)', display: 'flex', flexDirection: 'column', gap: '6px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <Calendar size={14} /> Target Date: <strong>{goal.target_date}</strong> ({goal.days_remaining} days left)
                    </div>
                    {!isCompleted && goal.required_monthly_savings > 0 && (
                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: '#D97706', fontWeight: '600' }}>
                        <Clock size={14} /> Required Saving: <strong>{formatCurrency(goal.required_monthly_savings)} / month</strong>
                      </div>
                    )}
                  </div>
                </div>

                <div style={{ marginTop: '20px', paddingTop: '16px', borderTop: '1px solid var(--border)' }}>
                  <button
                    className="btn btn-primary"
                    style={{ width: '100%', justifyContent: 'center' }}
                    onClick={() => handleOpenContribModal(goal)}
                    disabled={isCompleted}
                  >
                    <PiggyBank size={16} /> {isCompleted ? 'Goal Achieved 🎉' : 'Add Contribution'}
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <EmptyState
          title="No savings goals created yet"
          message="Create your first goal (e.g., New Laptop, Vacation, Emergency Fund) to track target savings."
          actionText="Create Savings Goal"
          onAction={() => setShowGoalModal(true)}
        />
      )}

      {/* Create Goal Modal */}
      <Modal isOpen={showGoalModal} onClose={() => setShowGoalModal(false)} title="Create New Savings Goal">
        <form onSubmit={handleCreateGoal}>
          <div className="form-group">
            <label>Goal Name</label>
            <input type="text" className="form-control" placeholder="e.g. New MacBook Pro, Goa Trip" value={name} onChange={(e) => setName(e.target.value)} required />
          </div>
          <div className="form-group">
            <label>Goal Type</label>
            <select className="form-control" value={goalType} onChange={(e) => setGoalType(e.target.value)}>
              <option value="laptop">New Laptop</option>
              <option value="phone">New Phone</option>
              <option value="trip">Vacation/Trip</option>
              <option value="emergency">Emergency Fund</option>
              <option value="education">Education</option>
              <option value="vehicle">Bike/Vehicle</option>
              <option value="other">Other</option>
            </select>
          </div>
          <div className="form-group">
            <label>Target Amount (₹)</label>
            <input type="number" step="0.01" className="form-control" placeholder="60000.00" value={targetAmount} onChange={(e) => setTargetAmount(e.target.value)} required />
          </div>
          <div className="form-group">
            <label>Current Saved Starting Amount (₹)</label>
            <input type="number" step="0.01" className="form-control" placeholder="0.00" value={initialAmount} onChange={(e) => setInitialAmount(e.target.value)} />
          </div>
          <div className="form-group">
            <label>Target Target Completion Date</label>
            <input type="date" className="form-control" value={targetDate} onChange={(e) => setTargetDate(e.target.value)} required />
          </div>
          <div className="form-group">
            <label>Priority</label>
            <select className="form-control" value={priority} onChange={(e) => setPriority(e.target.value)}>
              <option value="low">Low</option>
              <option value="medium">Medium</option>
              <option value="high">High</option>
            </select>
          </div>
          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px', marginTop: '20px' }}>
            <button type="button" className="btn btn-secondary" onClick={() => setShowGoalModal(false)}>Cancel</button>
            <button type="submit" className="btn btn-primary">Save Goal</button>
          </div>
        </form>
      </Modal>

      {/* Add Contribution Modal */}
      <Modal isOpen={showContribModal} onClose={() => setShowContribModal(false)} title={`Add Money to: ${selectedGoal?.name}`}>
        <form onSubmit={handleAddContribution}>
          <div className="form-group">
            <label>Contribution Amount (₹)</label>
            <input type="number" step="0.01" className="form-control" placeholder="5000.00" value={contribAmount} onChange={(e) => setContribAmount(e.target.value)} required />
          </div>
          <div className="form-group">
            <label>Deduct From Account</label>
            <select className="form-control" value={fromAccount} onChange={(e) => setFromAccount(e.target.value)} required>
              <option value="">Select source account...</option>
              {accounts.map((a) => (
                <option key={a.id} value={a.id}>{a.name} ({formatCurrency(a.current_balance)})</option>
              ))}
            </select>
          </div>
          <div className="form-group">
            <label>Notes / Tag</label>
            <input type="text" className="form-control" placeholder="e.g. Monthly salary savings contribution" value={contribNotes} onChange={(e) => setContribNotes(e.target.value)} />
          </div>
          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px', marginTop: '20px' }}>
            <button type="button" className="btn btn-secondary" onClick={() => setShowContribModal(false)}>Cancel</button>
            <button type="submit" className="btn btn-primary">Submit Contribution</button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
