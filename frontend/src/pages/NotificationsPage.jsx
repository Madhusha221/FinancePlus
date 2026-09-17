import React, { useState, useEffect } from 'react';
import { EmptyState } from '../components/EmptyState';
import api from '../services/api';
import { Bell, CheckCircle2, AlertCircle, Info } from 'lucide-react';

export const NotificationsPage = () => {
  const [notifications, setNotifications] = useState([]);

  const fetchNotifications = async () => {
    try {
      const res = await api.get('/notifications/');
      setNotifications(res.data);
    } catch (err) {
      console.error('Error fetching notifications:', err);
    }
  };

  useEffect(() => {
    fetchNotifications();
  }, []);

  const handleMarkAllRead = async () => {
    try {
      await api.post('/notifications/mark_all_read/');
      fetchNotifications();
    } catch (err) {
      console.error('Error marking all as read:', err);
    }
  };

  return (
    <div>
      <div className="section-header">
        <div>
          <h1 className="section-title">System Notifications</h1>
          <p className="section-desc">Budget warnings, bill reminders, and goal milestones</p>
        </div>
        <button className="btn btn-secondary" onClick={handleMarkAllRead}>
          <CheckCircle2 size={16} /> Mark All Read
        </button>
      </div>

      {notifications.length > 0 ? (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          {notifications.map((n) => {
            const isAlert = n.notification_type.includes('warning') || n.notification_type.includes('exceeded') || n.notification_type.includes('overdue');
            return (
              <div
                key={n.id}
                className="card"
                style={{
                  padding: '16px 20px',
                  borderLeft: `4px solid ${isAlert ? '#EF4444' : '#10B981'}`,
                  backgroundColor: n.is_read ? 'white' : '#F0FDF4',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '4px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontWeight: '700', fontSize: '0.95rem' }}>
                    {isAlert ? <AlertCircle size={18} color="#EF4444" /> : <Info size={18} color="#10B981" />}
                    {n.title}
                  </div>
                  <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                    {new Date(n.created_at).toLocaleString()}
                  </span>
                </div>
                <p style={{ fontSize: '0.875rem', color: 'var(--text-muted)' }}>{n.message}</p>
              </div>
            );
          })}
        </div>
      ) : (
        <EmptyState title="No notifications" message="System alerts for budget warnings and bill due dates will appear here." />
      )}
    </div>
  );
};
