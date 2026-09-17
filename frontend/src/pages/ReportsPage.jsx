import React, { useContext, useState } from 'react';
import { CurrencyContext } from '../context/CurrencyContext';
import api from '../services/api';
import { Download, Printer, FileSpreadsheet, Calendar } from 'lucide-react';

export const ReportsPage = () => {
  const { formatCurrency } = useContext(CurrencyContext);
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');

  const handleExportCSV = async () => {
    try {
      const token = localStorage.getItem('access_token');
      let url = 'http://127.0.0.1:8000/api/reports/export/';
      let params = [];
      if (startDate) params.push(`start_date=${startDate}`);
      if (endDate) params.push(`end_date=${endDate}`);
      if (params.length) url += `?${params.join('&')}`;

      const res = await fetch(url, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const blob = await res.blob();
      const downloadUrl = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = downloadUrl;
      a.download = `financial_report_${new Date().toISOString().split('T')[0]}.csv`;
      document.body.appendChild(a);
      a.click();
      a.remove();
    } catch (err) {
      alert('Failed to export CSV report.');
    }
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div>
      <div className="section-header">
        <div>
          <h1 className="section-title">Financial Reports & Exports</h1>
          <p className="section-desc">Generate comprehensive PDF/Printable reports and download CSV data</p>
        </div>
        <div style={{ display: 'flex', gap: '12px' }}>
          <button className="btn btn-secondary" onClick={handlePrint}>
            <Printer size={16} /> Print / Save PDF
          </button>
          <button className="btn btn-primary" onClick={handleExportCSV}>
            <Download size={16} /> Export CSV Report
          </button>
        </div>
      </div>

      <div className="card" style={{ marginBottom: '24px' }}>
        <h3 style={{ fontSize: '1.05rem', fontWeight: '700', marginBottom: '16px' }}>Filter Report Period</h3>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '16px' }}>
          <div>
            <label className="form-group" style={{ display: 'block', fontSize: '0.8rem', fontWeight: '600' }}>Start Date</label>
            <input type="date" className="form-control" value={startDate} onChange={(e) => setStartDate(e.target.value)} />
          </div>
          <div>
            <label className="form-group" style={{ display: 'block', fontSize: '0.8rem', fontWeight: '600' }}>End Date</label>
            <input type="date" className="form-control" value={endDate} onChange={(e) => setEndDate(e.target.value)} />
          </div>
        </div>
      </div>

      {/* Printable Document Sheet Preview */}
      <div className="card" style={{ padding: '36px', background: 'white', border: '1px solid var(--border)' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '2px solid var(--border)', paddingBottom: '20px', marginBottom: '24px' }}>
          <div>
            <h2 style={{ fontSize: '1.5rem', fontWeight: '800', color: 'var(--primary-dark)' }}>Personal Financial Statement</h2>
            <p style={{ fontSize: '0.875rem', color: 'var(--text-muted)' }}>
              Generated on: {new Date().toLocaleDateString('en-US', { dateStyle: 'full' })}
            </p>
          </div>
          <div style={{ textAlign: 'right' }}>
            <div style={{ fontWeight: '700', fontSize: '1.1rem' }}>FinancePulse SaaS</div>
            <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Confidential User Report</div>
          </div>
        </div>

        <div style={{ margin: '20px 0' }}>
          <h4 style={{ fontSize: '1rem', fontWeight: '700', marginBottom: '12px' }}>Summary & Key Metrics</h4>
          <p style={{ fontSize: '0.875rem', color: 'var(--text-muted)', marginBottom: '16px' }}>
            Use the "Export CSV Report" button above to download full line-item raw transactional dataset containing date, category, need/want classification, amount, account, and notes.
          </p>
        </div>

        <div style={{ display: 'flex', justifyContent: 'center', marginTop: '30px' }}>
          <button className="btn btn-primary" onClick={handleExportCSV}>
            <FileSpreadsheet size={18} /> Download Full CSV Dataset
          </button>
        </div>
      </div>
    </div>
  );
};
