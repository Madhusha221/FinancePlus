import React, { useContext, useState, useEffect } from 'react';
import { CurrencyContext } from '../context/CurrencyContext';
import { EmptyState } from '../components/EmptyState';
import api from '../services/api';
import {
  TrendingUp,
  PieChart as PieIcon,
  BarChart2,
  DollarSign,
  Activity,
  Layers
} from 'lucide-react';
import {
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Tooltip,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Legend
} from 'recharts';

const COLORS = ['#10B981', '#3B82F6', '#8B5CF6', '#F59E0B', '#EF4444', '#EC4899', '#14B8A6', '#64748B'];

export const AnalyticsPage = () => {
  const { formatCurrency } = useContext(CurrencyContext);
  const [data, setData] = useState(null);
  const [period, setPeriod] = useState('this_month');
  const [loading, setLoading] = useState(true);

  const fetchAnalytics = async () => {
    setLoading(true);
    try {
      const res = await api.get(`/analytics/summary/?period=${period}`);
      setData(res.data);
    } catch (err) {
      console.error('Error fetching analytics:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAnalytics();
  }, [period]);

  const summary = data?.summary;
  const charts = data?.charts || {};
  const needVsWant = charts.need_vs_want || { need: 0, want: 0, need_pct: 0, want_pct: 0 };

  const needWantChartData = [
    { name: 'Need (Essential)', value: needVsWant.need, color: '#3B82F6' },
    { name: 'Want (Discretionary)', value: needVsWant.want, color: '#F59E0B' },
  ];

  return (
    <div>
      <div className="section-header">
        <div>
          <h1 className="section-title">Financial Analytics</h1>
          <p className="section-desc">Interactive insights and breakdown from actual database data</p>
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

      {/* Need vs Want Ratio Card */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '24px', marginBottom: '28px' }}>
        {/* Category Breakdown Donut */}
        <div className="card">
          <h3 style={{ fontSize: '1.05rem', fontWeight: '700', marginBottom: '16px' }}>Category-Wise Spending</h3>
          {charts.category_breakdown && charts.category_breakdown.length > 0 ? (
            <div style={{ width: '100%', height: 260 }}>
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={charts.category_breakdown}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={90}
                    paddingAngle={5}
                    dataKey="value"
                  >
                    {charts.category_breakdown.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color || COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip formatter={(val) => [formatCurrency(val), 'Amount']} />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            </div>
          ) : (
            <EmptyState title="No expense records" message="Log expenses to see category breakdown." />
          )}
        </div>

        {/* Need vs Want Chart */}
        <div className="card">
          <h3 style={{ fontSize: '1.05rem', fontWeight: '700', marginBottom: '16px' }}>Need vs Want Spending Ratio</h3>
          {needVsWant.need + needVsWant.want > 0 ? (
            <div>
              <div style={{ width: '100%', height: 200 }}>
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie data={needWantChartData} cx="50%" cy="50%" outerRadius={75} dataKey="value" label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}>
                      {needWantChartData.map((entry, index) => (
                        <Cell key={`cell-nw-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip formatter={(val) => [formatCurrency(val), 'Amount']} />
                  </PieChart>
                </ResponsiveContainer>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginTop: '12px', textAlign: 'center' }}>
                <div style={{ padding: '10px', backgroundColor: '#EFF6FF', borderRadius: 'var(--radius-sm)' }}>
                  <div style={{ fontSize: '0.75rem', color: '#1E40AF', fontWeight: '600' }}>Needs (Essentials)</div>
                  <div style={{ fontSize: '1.1rem', fontWeight: '700', color: '#1D4ED8' }}>{needVsWant.need_pct}%</div>
                  <div style={{ fontSize: '0.8rem', color: '#1E40AF' }}>{formatCurrency(needVsWant.need)}</div>
                </div>

                <div style={{ padding: '10px', backgroundColor: '#FEF3C7', borderRadius: 'var(--radius-sm)' }}>
                  <div style={{ fontSize: '0.75rem', color: '#92400E', fontWeight: '600' }}>Wants (Discretionary)</div>
                  <div style={{ fontSize: '1.1rem', fontWeight: '700', color: '#B45309' }}>{needVsWant.want_pct}%</div>
                  <div style={{ fontSize: '0.8rem', color: '#92400E' }}>{formatCurrency(needVsWant.want)}</div>
                </div>
              </div>
            </div>
          ) : (
            <EmptyState title="No data available" message="Log expenses with Need/Want tags to populate analytics." />
          )}
        </div>
      </div>

      {/* Account Spending Bar Chart */}
      <div className="card">
        <h3 style={{ fontSize: '1.05rem', fontWeight: '700', marginBottom: '16px' }}>Account & Payment Method Utilization</h3>
        {charts.account_spending && charts.account_spending.length > 0 ? (
          <div style={{ width: '100%', height: 260 }}>
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={charts.account_spending}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E2E8F0" />
                <XAxis dataKey="name" stroke="#64748B" fontSize={12} />
                <YAxis stroke="#64748B" fontSize={12} tickFormatter={(v) => `₹${v}`} />
                <Tooltip formatter={(val) => [formatCurrency(val), 'Total Outflow']} />
                <Bar dataKey="value" fill="#10B981" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        ) : (
          <EmptyState title="No account outflow data" message="Log transactions to view account distribution." />
        )}
      </div>
    </div>
  );
};
