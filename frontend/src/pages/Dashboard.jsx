import React, { useContext, useState, useEffect } from 'react';
import { CurrencyContext } from '../context/CurrencyContext';
import { DateContext } from '../context/DateContext';
import { StatCard } from '../components/StatCard';
import { EmptyState } from '../components/EmptyState';
import api from '../services/api';
import {
  Wallet,
  TrendingUp,
  TrendingDown,
  PiggyBank,
  Plus,
  Sparkles,
  ArrowRight,
  Target,
  AlertCircle
} from 'lucide-react';
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid
} from 'recharts';

export const Dashboard = ({ setActiveTab }) => {
  const { formatCurrency } = useContext(CurrencyContext);
  const { formattedDate } = useContext(DateContext);

  const [summary, setSummary] = useState(null);
  const [charts, setCharts] = useState({ daily_spending: [] });
  const [insights, setInsights] = useState([]);
  const [recentTxs, setRecentTxs] = useState([]);
  const [goals, setGoals] = useState([]);
  const [period, setPeriod] = useState('this_month');
  const [loading, setLoading] = useState(true);

  const fetchDashboardData = async () => {
    setLoading(true);
    try {
      const [analyticsRes, txRes, goalRes] = await Promise.all([
        api.get(`/analytics/summary/?period=${period}`),
        api.get('/transactions/?page=1'),
        api.get('/goals/')
      ]);
      setSummary(analyticsRes.data.summary);
      setCharts(analyticsRes.data.charts);
      setInsights(analyticsRes.data.insights);
      setRecentTxs(txRes.data.slice(0, 5));
      setGoals(goalRes.data.slice(0, 3));
    } catch (err) {
      console.error('Error fetching dashboard data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboardData();
  }, [period]);

  return (
    <div>
      <div className="section-header">
        <div>
          <h1 className="section-title">Financial Dashboard</h1>
          <p className="section-desc">Real-time overview for {formattedDate}</p>
        </div>
        <div style={{ display: 'flex', gap: '12px' }}>
          <button className="btn btn-secondary" onClick={() => setActiveTab('transactions')}>
            <Plus size={16} /> Add Transaction
          </button>
          <button className="btn btn-primary" onClick={() => setActiveTab('expenses')}>
            <Plus size={16} /> Add Expense
          </button>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="metrics-grid">
        <StatCard
          title="Total Balance"
          value={formatCurrency(summary?.total_balance || 0)}
          icon={Wallet}
          iconClass="icon-balance"
          subtitle="Across all accounts"
        />
        <StatCard
          title="Total Income"
          value={formatCurrency(summary?.income || 0)}
          icon={TrendingUp}
          iconClass="icon-income"
          subtitle="Selected period"
        />
        <StatCard
          title="Total Expenses"
          value={formatCurrency(summary?.expenses || 0)}
          icon={TrendingDown}
          iconClass="icon-expense"
          subtitle="Selected period"
        />
        <StatCard
          title="Savings"
          value={formatCurrency(summary?.savings || 0)}
          icon={PiggyBank}
          iconClass="icon-savings"
          subtitle="Net cash flow"
        />
      </div>

      {/* Financial Insights */}
      {insights.length > 0 && (
        <div
          className="card"
          style={{
            marginBottom: '28px',
            background: 'linear-gradient(135deg, #ECFDF5 0%, #F0FDF4 100%)',
            borderColor: '#A7F3D0',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '12px' }}>
            <Sparkles size={20} color="#10B981" />
            <h3 style={{ fontSize: '1rem', fontWeight: '700', color: '#047857' }}>
              Data-Driven Financial Insights
            </h3>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '12px' }}>
            {insights.map((insight, idx) => (
              <div
                key={idx}
                style={{
                  padding: '12px 16px',
                  backgroundColor: 'white',
                  borderRadius: 'var(--radius-sm)',
                  border: '1px solid #D1FAE5',
                  fontSize: '0.875rem',
                  fontWeight: '500',
                  color: '#064E3B',
                }}
              >
                {insight}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Chart Section */}
      <div className="card" style={{ marginBottom: '28px' }}>
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            marginBottom: '20px',
            flexWrap: 'wrap',
            gap: '12px',
          }}
        >
          <div>
            <h3 style={{ fontSize: '1.1rem', fontWeight: '700' }}>Monthly Spending Trend</h3>
            <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Daily spending activity breakdown</p>
          </div>

          <div style={{ display: 'flex', gap: '8px' }}>
            {[
              { id: 'this_month', label: 'This Month' },
              { id: 'last_month', label: 'Last Month' },
              { id: 'last_3_months', label: 'Last 3 Months' },
              { id: 'this_year', label: 'This Year' },
            ].map((p) => (
              <button
                key={p.id}
                className={`btn ${period === p.id ? 'btn-primary' : 'btn-secondary'}`}
                style={{ padding: '6px 12px', fontSize: '0.8rem' }}
                onClick={() => setPeriod(p.id)}
              >
                {p.label}
              </button>
            ))}
          </div>
        </div>

        {charts.daily_spending && charts.daily_spending.length > 0 ? (
          <div style={{ width: '100%', height: 300 }}>
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={charts.daily_spending}>
                <defs>
                  <linearGradient id="colorSpend" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#10B981" stopOpacity={0.4} />
                    <stop offset="95%" stopColor="#10B981" stopOpacity={0.0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E2E8F0" />
                <XAxis dataKey="date" stroke="#64748B" fontSize={12} tickLine={false} />
                <YAxis stroke="#64748B" fontSize={12} tickLine={false} tickFormatter={(val) => `₹${val}`} />
                <Tooltip
                  formatter={(val) => [formatCurrency(val), 'Spending']}
                  contentStyle={{ backgroundColor: '#0F172A', color: '#FFF', borderRadius: '8px', border: 'none' }}
                />
                <Area type="monotone" dataKey="spending" stroke="#10B981" strokeWidth={3} fillOpacity={1} fill="url(#colorSpend)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        ) : (
          <EmptyState
            title="No spending data in this period"
            message="Add transactions to view interactive daily spending charts."
            actionText="Add Expense"
            onAction={() => setActiveTab('expenses')}
          />
        )}
      </div>

      {/* Grid: Recent Transactions & Goals Preview */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '24px' }}>
        {/* Recent Transactions */}
        <div className="card">
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
            <h3 style={{ fontSize: '1.05rem', fontWeight: '700' }}>Recent Transactions</h3>
            <button
              style={{ background: 'none', border: 'none', color: 'var(--primary)', fontWeight: '600', cursor: 'pointer', fontSize: '0.85rem' }}
              onClick={() => setActiveTab('transactions')}
            >
              View All <ArrowRight size={14} style={{ verticalAlign: 'middle' }} />
            </button>
          </div>

          {recentTxs.length > 0 ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              {recentTxs.map((tx) => (
                <div
                  key={tx.id}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    padding: '10px 14px',
                    borderRadius: 'var(--radius-sm)',
                    backgroundColor: 'var(--bg-main)',
                  }}
                >
                  <div>
                    <div style={{ fontWeight: '600', fontSize: '0.9rem' }}>{tx.description}</div>
                    <div style={{ fontSize: '0.775rem', color: 'var(--text-muted)' }}>
                      {tx.category_name || tx.transaction_type} • {tx.date}
                    </div>
                  </div>
                  <div
                    style={{
                      fontWeight: '700',
                      fontSize: '0.95rem',
                      color: tx.transaction_type === 'income' ? '#10B981' : tx.transaction_type === 'expense' ? '#EF4444' : '#3B82F6',
                    }}
                  >
                    {tx.transaction_type === 'income' ? '+' : tx.transaction_type === 'expense' ? '-' : ''}
                    {formatCurrency(tx.amount)}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <EmptyState title="No transactions yet" message="Log expenses or income to track transactions." />
          )}
        </div>

        {/* Goals Progress */}
        <div className="card">
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
            <h3 style={{ fontSize: '1.05rem', fontWeight: '700' }}>Savings Goals</h3>
            <button
              style={{ background: 'none', border: 'none', color: 'var(--primary)', fontWeight: '600', cursor: 'pointer', fontSize: '0.85rem' }}
              onClick={() => setActiveTab('goals')}
            >
              Manage Goals <ArrowRight size={14} style={{ verticalAlign: 'middle' }} />
            </button>
          </div>

          {goals.length > 0 ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              {goals.map((goal) => (
                <div key={goal.id}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
                    <span style={{ fontWeight: '600', fontSize: '0.9rem' }}>{goal.name}</span>
                    <span style={{ fontSize: '0.85rem', fontWeight: '700', color: 'var(--primary-dark)' }}>
                      {goal.progress_percentage}%
                    </span>
                  </div>
                  <div className="progress-container">
                    <div className="progress-bar" style={{ width: `${goal.progress_percentage}%` }}></div>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.775rem', color: 'var(--text-muted)' }}>
                    <span>Saved: {formatCurrency(goal.current_amount)}</span>
                    <span>Target: {formatCurrency(goal.target_amount)}</span>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <EmptyState title="No savings goals yet" message="Create your first savings goal to start tracking target milestones." />
          )}
        </div>
      </div>
    </div>
  );
};
