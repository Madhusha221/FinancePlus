import React from 'react';
import { Inbox } from 'lucide-react';

export const EmptyState = ({ title = "No records found", message = "Get started by adding your first record.", actionText, onAction }) => {
  return (
    <div
      className="card"
      style={{
        padding: '48px 24px',
        textAlign: 'center',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        background: '#FFFFFF',
      }}
    >
      <div
        style={{
          width: '56px',
          height: '56px',
          borderRadius: '50%',
          backgroundColor: '#F1F5F9',
          color: '#64748B',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          marginBottom: '16px',
        }}
      >
        <Inbox size={28} />
      </div>
      <h3 style={{ fontSize: '1.1rem', fontWeight: '700', marginBottom: '6px', color: 'var(--text-main)' }}>
        {title}
      </h3>
      <p style={{ fontSize: '0.875rem', color: 'var(--text-muted)', maxWidth: '360px', marginBottom: actionText ? '20px' : '0' }}>
        {message}
      </p>
      {actionText && onAction && (
        <button className="btn btn-primary" onClick={onAction}>
          {actionText}
        </button>
      )}
    </div>
  );
};
