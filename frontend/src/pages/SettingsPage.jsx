import React, { useContext, useState } from 'react';
import { AuthContext } from '../context/AuthContext';
import { Settings, User, Globe, Bell, Shield, Save } from 'lucide-react';

export const SettingsPage = () => {
  const { user, settings, updateSettings } = useContext(AuthContext);

  const [currency, setCurrency] = useState(settings?.currency || 'INR');
  const [currencySymbol, setCurrencySymbol] = useState(settings?.currency_symbol || '₹');
  const [timezone, setTimezone] = useState(settings?.timezone || 'Asia/Kolkata');
  const [dateFormat, setDateFormat] = useState(settings?.date_format || 'YYYY-MM-DD');
  const [budgetAlerts, setBudgetAlerts] = useState(settings?.budget_alerts ?? true);
  const [billAlerts, setBillAlerts] = useState(settings?.bill_alerts ?? true);

  const handleSave = async (e) => {
    e.preventDefault();
    try {
      let sym = '₹';
      if (currency === 'USD') sym = '$';
      if (currency === 'EUR') sym = '€';
      if (currency === 'GBP') sym = '£';
      if (currency === 'INR') sym = '₹';

      await updateSettings({
        currency,
        currency_symbol: sym,
        timezone,
        date_format: dateFormat,
        budget_alerts: budgetAlerts,
        bill_alerts: billAlerts,
      });
      alert('Preferences saved successfully!');
    } catch (err) {
      alert('Failed to update settings.');
    }
  };

  return (
    <div>
      <div className="section-header">
        <div>
          <h1 className="section-title">Application Settings</h1>
          <p className="section-desc">Manage regional preferences, profile, and notification settings</p>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '24px' }}>
        {/* User Profile Card */}
        <div className="card">
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '20px' }}>
            <User size={20} color="var(--primary)" />
            <h3 style={{ fontSize: '1.05rem', fontWeight: '700' }}>User Profile Info</h3>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            <div>
              <label style={{ fontSize: '0.75rem', fontWeight: '600', color: 'var(--text-muted)' }}>Username</label>
              <input type="text" className="form-control" value={user?.username || ''} disabled />
            </div>
            <div>
              <label style={{ fontSize: '0.75rem', fontWeight: '600', color: 'var(--text-muted)' }}>Email Address</label>
              <input type="text" className="form-control" value={user?.email || 'demo@finance.app'} disabled />
            </div>
            <div>
              <label style={{ fontSize: '0.75rem', fontWeight: '600', color: 'var(--text-muted)' }}>Full Name</label>
              <input type="text" className="form-control" value={user?.first_name ? `${user.first_name} ${user.last_name}` : 'Personal Account'} disabled />
            </div>
          </div>
        </div>

        {/* Currency & Regional Preferences */}
        <div className="card">
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '20px' }}>
            <Globe size={20} color="var(--primary)" />
            <h3 style={{ fontSize: '1.05rem', fontWeight: '700' }}>Regional & Currency Preferences</h3>
          </div>

          <form onSubmit={handleSave}>
            <div className="form-group">
              <label>Default Currency</label>
              <select className="form-control" value={currency} onChange={(e) => setCurrency(e.target.value)}>
                <option value="INR">INR (₹ Indian Rupee)</option>
                <option value="USD">USD ($ US Dollar)</option>
                <option value="EUR">EUR (€ Euro)</option>
                <option value="GBP">GBP (£ British Pound)</option>
              </select>
            </div>

            <div className="form-group">
              <label>Timezone</label>
              <select className="form-control" value={timezone} onChange={(e) => setTimezone(e.target.value)}>
                <option value="Asia/Kolkata">Asia/Kolkata (IST)</option>
                <option value="UTC">UTC</option>
                <option value="America/New_York">America/New_York (EST)</option>
                <option value="Europe/London">Europe/London (GMT)</option>
              </select>
            </div>

            <div className="form-group">
              <label>Date Display Format</label>
              <select className="form-control" value={dateFormat} onChange={(e) => setDateFormat(e.target.value)}>
                <option value="YYYY-MM-DD">YYYY-MM-DD</option>
                <option value="DD/MM/YYYY">DD/MM/YYYY</option>
                <option value="MM/DD/YYYY">MM/DD/YYYY</option>
              </select>
            </div>

            <div className="form-group" style={{ display: 'flex', alignItems: 'center', gap: '10px', marginTop: '16px' }}>
              <input type="checkbox" id="budgetAlerts" checked={budgetAlerts} onChange={(e) => setBudgetAlerts(e.target.checked)} />
              <label htmlFor="budgetAlerts" style={{ margin: 0, cursor: 'pointer' }}>Enable Budget Warning Alerts (80% / 100%)</label>
            </div>

            <div className="form-group" style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <input type="checkbox" id="billAlerts" checked={billAlerts} onChange={(e) => setBillAlerts(e.target.checked)} />
              <label htmlFor="billAlerts" style={{ margin: 0, cursor: 'pointer' }}>Enable Bill Due Date Notifications</label>
            </div>

            <button type="submit" className="btn btn-primary" style={{ marginTop: '16px', width: '100%', justifyContent: 'center' }}>
              <Save size={16} /> Save Preferences
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};
