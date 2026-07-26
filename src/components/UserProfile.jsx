import React, { useState, useEffect } from 'react';
import { useAppContext } from '../context/AppContext';
import { useLanguage } from '../context/LanguageContext';
import { Bell, CheckCircle, XCircle, Clock } from 'lucide-react';

export default function UserProfile() {
  const { reportsList } = useAppContext();
  const { t } = useLanguage();
  const [myReports, setMyReports] = useState([]);
  const [notifications, setNotifications] = useState([]);

  useEffect(() => {
    // Filter reports for the active user mock ID 'rep_103'
    const userReports = reportsList.filter(r => r.reporterId === 'rep_103');
    setMyReports(userReports);

    // Check for recently reviewed reports to show notifications
    // Simple mock logic: any report that is not 'unverified' and not 'under_review'
    const recentReviewed = userReports.filter(r => r.status === 'confirmed' || r.status === 'rejected');
    
    // In a real app we'd track "read" status. For this prototype, just show the most recent one if it exists
    if (recentReviewed.length > 0) {
      // Sort by latest
      recentReviewed.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
      setNotifications([recentReviewed[0]]);
    }
  }, [reportsList]);

  return (
    <div style={{ maxWidth: '800px', margin: '0 auto' }} className="fade-in">
      <h1 style={{ color: '#fff', fontSize: '1.8rem', marginBottom: '1.5rem' }}>{t('profile.title')}</h1>

      {/* Notifications Banner */}
      {notifications.length > 0 && (
        <div style={{ 
          background: 'rgba(59, 130, 246, 0.15)', 
          border: '1px solid rgba(59, 130, 246, 0.5)', 
          borderRadius: '12px', 
          padding: '1.25rem',
          marginBottom: '2rem',
          display: 'flex',
          gap: '1rem',
          alignItems: 'start'
        }}>
          <Bell color="#3b82f6" />
          <div>
            <strong style={{ color: '#fff', display: 'block', marginBottom: '0.25rem' }}>{t('profile.update_notice')}</strong>
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', marginBottom: '0.5rem' }}>
              {t('profile.update_desc').replace('{category}', notifications[0].category)}
            </p>
            <div style={{ display: 'inline-flex', alignItems: 'center', gap: '0.5rem', background: 'rgba(0,0,0,0.3)', padding: '0.25rem 0.75rem', borderRadius: '20px', fontSize: '0.8rem' }}>
              {notifications[0].status === 'confirmed' ? (
                <><CheckCircle size={14} color="var(--color-low)" /> <span style={{color: 'var(--color-low)'}}>Confirmed</span></>
              ) : (
                <><XCircle size={14} color="var(--color-high)" /> <span style={{color: 'var(--color-high)'}}>Rejected</span></>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Reports Table */}
      <div className="glass-panel" style={{ padding: '1.5rem' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', color: 'var(--text-secondary)' }}>
          <thead>
            <tr style={{ borderBottom: '1px solid var(--border-color)', textAlign: 'left' }}>
              <th style={{ padding: '1rem', color: '#fff' }}>{t('profile.table_date')}</th>
              <th style={{ padding: '1rem', color: '#fff' }}>{t('profile.table_category')}</th>
              <th style={{ padding: '1rem', color: '#fff' }}>{t('profile.table_content')}</th>
              <th style={{ padding: '1rem', color: '#fff' }}>{t('profile.status')}</th>
            </tr>
          </thead>
          <tbody>
            {myReports.length === 0 ? (
              <tr>
                <td colSpan="4" style={{ textAlign: 'center', padding: '2rem' }}>{t('profile.no_reports')}</td>
              </tr>
            ) : (
              myReports.map(report => (
                <tr key={report.id} style={{ borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                  <td style={{ padding: '1rem', fontSize: '0.85rem' }}>
                    {new Date(report.timestamp).toLocaleDateString()}
                  </td>
                  <td style={{ padding: '1rem', fontSize: '0.85rem', textTransform: 'capitalize' }}>
                    {report.category}
                  </td>
                  <td style={{ padding: '1rem', fontSize: '0.85rem', maxWidth: '300px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                    "{report.text}"
                  </td>
                  <td style={{ padding: '1rem' }}>
                    {report.status === 'confirmed' && <span style={{ color: 'var(--color-low)', display: 'flex', alignItems: 'center', gap: '0.25rem', fontSize: '0.8rem' }}><CheckCircle size={14}/> {t('profile.confirmed')}</span>}
                    {report.status === 'rejected' && <span style={{ color: 'var(--color-high)', display: 'flex', alignItems: 'center', gap: '0.25rem', fontSize: '0.8rem' }}><XCircle size={14}/> {t('profile.rejected')}</span>}
                    {(report.status === 'unverified' || report.status === 'under_review') && <span style={{ color: '#f59e0b', display: 'flex', alignItems: 'center', gap: '0.25rem', fontSize: '0.8rem' }}><Clock size={14}/> {t('profile.pending')}</span>}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
