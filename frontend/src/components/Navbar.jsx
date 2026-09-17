import React, { useContext, useState, useEffect } from 'react';
import { DateContext } from '../context/DateContext';
import { AuthContext } from '../context/AuthContext';
import api from '../services/api';
import { Search, Bell, Menu, X, AlertCircle, CheckCircle2, Info } from 'lucide-react';

export const Navbar = ({ toggleSidebar, setActiveTab, searchQuery, setSearchQuery }) => {
  const { formattedDate } = useContext(DateContext);
  const { user } = useContext(AuthContext);
  const [notifications, setNotifications] = useState([]);
  const [showNotifications, setShowNotifications] = useState(false);

  const fetchNotifications = async () => {
    try {
      const res = await api.get('/notifications/');
      setNotifications(res.data);
    } catch (err) {
      console.error('Error fetching notifications:', err);
    }
  };

  useEffect(() => {
    if (user) {
      fetchNotifications();
      const interval = setInterval(fetchNotifications, 60000);
      return () => clearInterval(interval);
    }
  }, [user]);

  const unreadCount = notifications.filter((n) => !n.is_read).length;

  const handleMarkAllRead = async () => {
    try {
      await api.post('/notifications/mark_all_read/');
      fetchNotifications();
    } catch (err) {
      console.error('Error marking notifications as read:', err);
    }
  };

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      setActiveTab('transactions');
    }
  };

  return (
    <header className="top-navbar">
      <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
        <button className="mobile-menu-btn" onClick={toggleSidebar}>
          <Menu size={22} />
        </button>
        <div className="navbar-date">
          <span className="date-today">{formattedDate}</span>
          <span className="date-sub">Personal Finance Overview</span>
        </div>
      </div>

      <div className="navbar-actions">
        <form className="search-box" onSubmit={handleSearchSubmit}>
          <Search size={16} className="search-icon" />
          <input
            type="text"
            placeholder="Search transactions, bills, goals..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </form>

        <div style={{ position: 'relative' }}>
          <button
            className="icon-btn"
            onClick={() => setShowNotifications(!showNotifications)}
            title="Notifications"
          >
            <Bell size={18} />
            {unreadCount > 0 && <span className="notification-dot"></span>}
          </button>

          {showNotifications && (
            <div
              className="card"
              style={{
                position: 'absolute',
                right: 0,
                top: '48px',
                width: '340px',
                zIndex: 200,
                padding: '16px',
                boxShadow: 'var(--shadow-xl)',
              }}
            >
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  marginBottom: '12px',
                  paddingBottom: '8px',
                  borderBottom: '1px solid var(--border)',
                }}
              >
                <div style={{ fontWeight: '700', fontSize: '0.95rem' }}>
                  Notifications ({unreadCount} unread)
                </div>
                {unreadCount > 0 && (
                  <button
                    style={{
                      background: 'none',
                      border: 'none',
                      color: 'var(--primary)',
                      fontSize: '0.75rem',
                      fontWeight: '600',
                      cursor: 'pointer',
                    }}
                    onClick={handleMarkAllRead}
                  >
                    Mark read
                  </button>
                )}
              </div>

              <div style={{ maxHeight: '280px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '10px' }}>
                {notifications.length === 0 ? (
                  <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)', textAlign: 'center', padding: '16px 0' }}>
                    No notifications
                  </div>
                ) : (
                  notifications.map((n) => (
                    <div
                      key={n.id}
                      style={{
                        padding: '10px',
                        borderRadius: 'var(--radius-sm)',
                        backgroundColor: n.is_read ? '#F8FAFC' : '#ECFDF5',
                        borderLeft: `3px solid ${n.notification_type.includes('warning') || n.notification_type.includes('overdue') ? '#EF4444' : '#10B981'}`,
                      }}
                    >
                      <div style={{ fontWeight: '600', fontSize: '0.825rem', marginBottom: '2px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                        {n.notification_type.includes('warning') || n.notification_type.includes('overdue') ? (
                          <AlertCircle size={14} color="#EF4444" />
                        ) : (
                          <Info size={14} color="#10B981" />
                        )}
                        {n.title}
                      </div>
                      <div style={{ fontSize: '0.775rem', color: 'var(--text-muted)' }}>{n.message}</div>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}
        </div>

        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '10px',
            cursor: 'pointer',
          }}
          onClick={() => setActiveTab('settings')}
        >
          <div className="avatar-circle" style={{ width: '36px', height: '36px', fontSize: '0.9rem' }}>
            {user?.username ? user.username.charAt(0).toUpperCase() : 'U'}
          </div>
        </div>
      </div>
    </header>
  );
};
