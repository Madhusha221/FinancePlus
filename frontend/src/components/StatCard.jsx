import React from 'react';

export const StatCard = ({ title, value, icon: Icon, iconClass, subtitle }) => {
  return (
    <div className="card">
      <div className="metric-card-content">
        <div>
          <div className="metric-title">{title}</div>
          <div className="metric-value">{value}</div>
          {subtitle && (
            <div style={{ fontSize: '0.775rem', color: 'var(--text-muted)', marginTop: '4px' }}>
              {subtitle}
            </div>
          )}
        </div>
        {Icon && (
          <div className={`metric-icon ${iconClass}`}>
            <Icon size={24} />
          </div>
        )}
      </div>
    </div>
  );
};
