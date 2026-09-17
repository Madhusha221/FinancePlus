import React, { useContext } from 'react';
import { AuthContext } from '../context/AuthContext';
import {
  LayoutDashboard,
  Wallet,
  ArrowLeftRight,
  FileText,
  DollarSign,
  Target,
  PieChart,
  TrendingUp,
  Repeat,
  FileSpreadsheet,
  Settings,
  LogOut,
  X,
  TrendingDown
} from 'lucide-react';

const navItems = [
  { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { id: 'accounts', label: 'Accounts', icon: Wallet },
  { id: 'transactions', label: 'Transactions', icon: ArrowLeftRight },
  { id: 'bills', label: 'Bills', icon: FileText },
  { id: 'expenses', label: 'Expenses', icon: TrendingDown },
  { id: 'income', label: 'Income', icon: DollarSign },
  { id: 'goals', label: 'Goals', icon: Target },
  { id: 'budgets', label: 'Budgets', icon: PieChart },
  { id: 'analytics', label: 'Analytics', icon: TrendingUp },
  { id: 'recurring', label: 'Recurring', icon: Repeat },
  { id: 'reports', label: 'Reports', icon: FileSpreadsheet },
  { id: 'settings', label: 'Settings', icon: Settings },
];

export const Sidebar = ({ activeTab, setActiveTab, isOpen, setIsOpen }) => {
  const { user, logout } = useContext(AuthContext);

  const handleSelect = (id) => {
    setActiveTab(id);
    if (window.innerWidth <= 992) {
      setIsOpen(false);
    }
  };

  return (
    <aside className={`sidebar ${isOpen ? 'open' : ''}`}>
      <div className="sidebar-header">
        <div className="logo-badge">₹</div>
        <div className="logo-text">FinancePulse</div>
        <button
          className="mobile-menu-btn"
          style={{ color: '#94A3B8', marginLeft: 'auto' }}
          onClick={() => setIsOpen(false)}
        >
          <X size={20} />
        </button>
      </div>

      <nav className="sidebar-nav">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = activeTab === item.id;
          return (
            <button
              key={item.id}
              className={`nav-item ${isActive ? 'active' : ''}`}
              onClick={() => handleSelect(item.id)}
            >
              <Icon size={18} />
              <span>{item.label}</span>
            </button>
          );
        })}
      </nav>

      <div className="sidebar-footer">
        <div className="user-profile-badge" style={{ marginBottom: '12px' }}>
          <div className="avatar-circle">
            {user?.username ? user.username.charAt(0).toUpperCase() : 'U'}
          </div>
          <div style={{ overflow: 'hidden' }}>
            <div style={{ fontSize: '0.875rem', fontWeight: '600', color: 'white', whiteSpace: 'nowrap', textOverflow: 'ellipsis', overflow: 'hidden' }}>
              {user?.first_name ? `${user.first_name} ${user.last_name}` : user?.username || 'User'}
            </div>
            <div style={{ fontSize: '0.75rem', color: '#94A3B8', whiteSpace: 'nowrap', textOverflow: 'ellipsis', overflow: 'hidden' }}>
              {user?.email || 'Personal Account'}
            </div>
          </div>
        </div>

        <button
          className="nav-item"
          style={{ width: '100%', color: '#EF4444' }}
          onClick={logout}
        >
          <LogOut size={18} />
          <span>Logout</span>
        </button>
      </div>
    </aside>
  );
};
