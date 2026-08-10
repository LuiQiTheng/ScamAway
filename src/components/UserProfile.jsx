import React, { useState, useEffect } from 'react';
import { useAppContext } from '../context/AppContext';
import { useLanguage } from '../context/LanguageContext';
import GuardianSetupModal from "../components/Guardian/GuardianSetupModal";
import EditProfileModal from "../components/EditProfileModal";
import { Bell, BellOff, CheckCircle, XCircle, Clock, Trash2, Check, MailOpen, ChevronDown, ChevronUp, RotateCcw, User, Edit2 } from 'lucide-react';
import { getCategoryLabel } from '../config/categories';

export default function UserProfile({ userMode = 'normal', isElderlyMode = false, isKidMode = false }) {
  const { reportsList, currentUser, updateGuardian, updateCurrentUser, deleteCurrentUser } = useAppContext();
  const { t, lang } = useLanguage();
  const [myReports, setMyReports] = useState([]);
  const [isReportsExpanded, setIsReportsExpanded] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const [isNotificationsExpanded, setIsNotificationsExpanded] = useState(false);
  const [expandedSnippets, setExpandedSnippets] = useState(new Set());
  
  const toggleSnippet = (id) => {
    setExpandedSnippets(prev => {
      const newSet = new Set(prev);
      if (newSet.has(id)) newSet.delete(id);
      else newSet.add(id);
      return newSet;
    });
  };
  
  // SessionStorage states for read and deleted notifications
  const [readIds, setReadIds] = useState(() => {
    try {
      const saved = sessionStorage.getItem('scam_away_read_notifications');
      return saved ? JSON.parse(saved) : [];
    } catch (e) {
      return [];
    }
  });

  const [deletedIds, setDeletedIds] = useState(() => {
    try {
      const saved = sessionStorage.getItem('scam_away_deleted_notifications');
      return saved ? JSON.parse(saved) : [];
    } catch (e) {
      return [];
    }
  });

  const [isGuardianModalOpen, setIsGuardianModalOpen] = useState(false);
  const [guardianMode, setGuardianMode] = useState("edit");

  const [isEditProfileModalOpen, setIsEditProfileModalOpen] = useState(false);
  const [isMobile, setIsMobile] = useState(window.innerWidth <= 768);

  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [deletePassword, setDeletePassword] = useState('');
  const [deleteError, setDeleteError] = useState('');

  const handleDeleteAccount = async () => {
    setDeleteError('');
    try {
      await deleteCurrentUser(deletePassword);
    } catch (err) {
      setDeleteError(err.message);
    }
  };

  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth <= 768);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const guardian = currentUser?.guardian || {
      name: "",
      relationship: "",
      phone: ""
  };

  useEffect(() => {
    // Filter reports for the active user
    const userReports = reportsList.filter(r => r.reporterId === currentUser?.id);
    setMyReports(userReports);

    // Get ALL reviewed reports (confirmed or rejected) as notifications
    const recentReviewed = userReports.filter(r => r.status === 'confirmed' || r.status === 'rejected');
    
    // Sort latest first
    recentReviewed.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
    setNotifications(recentReviewed);
  }, [reportsList, currentUser?.id]);

  // Handlers for read/delete/restore
  const handleToggleRead = (id) => {
    const nextRead = readIds.includes(id) 
      ? readIds.filter(i => i !== id) 
      : [...readIds, id];
    setReadIds(nextRead);
    try {
      sessionStorage.setItem('scam_away_read_notifications', JSON.stringify(nextRead));
    } catch (e) {}
  };

  const handleDeleteNotification = (id) => {
    const nextDeleted = [...deletedIds, id];
    setDeletedIds(nextDeleted);
    try {
      sessionStorage.setItem('scam_away_deleted_notifications', JSON.stringify(nextDeleted));
    } catch (e) {}
  };

  const handleClearAll = () => {
    const allIds = notifications.map(n => n.id);
    const nextDeleted = Array.from(new Set([...deletedIds, ...allIds]));
    setDeletedIds(nextDeleted);
    try {
      sessionStorage.setItem('scam_away_deleted_notifications', JSON.stringify(nextDeleted));
    } catch (e) {}
  };

  const handleRestoreAll = () => {
    setDeletedIds([]);
    try {
      sessionStorage.removeItem('scam_away_deleted_notifications');
    } catch (e) {}
  };

  const activeNotifications = notifications.filter(n => !deletedIds.includes(n.id));
  const visibleNotifications = isNotificationsExpanded ? activeNotifications : activeNotifications.slice(0, 1);

  const handleMarkAllRead = () => {
    const allIds = activeNotifications.map(n => n.id);
    const nextRead = Array.from(new Set([...readIds, ...allIds]));
    setReadIds(nextRead);
    try {
      sessionStorage.setItem('scam_away_read_notifications', JSON.stringify(nextRead));
    } catch (e) {}
  };
  return (
    <div className={`page-shell profile-page fade-in mode-${userMode} ${isElderlyMode ? 'elderly-mode' : ''} ${isKidMode ? 'kid-mode' : ''}`}>

      {/* User Info Card */}
      {currentUser && (
        <div className="glass-panel" style={{ padding: '1.5rem 1.75rem', marginBottom: '0.75rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '0.5rem', marginBottom: '1rem', flexWrap: 'wrap' }}>
            <h2 style={{ fontSize: isElderlyMode ? '1.4rem' : '1.25rem', fontWeight: 700, color: '#fff', display: 'flex', alignItems: 'center', gap: '0.5rem', margin: 0, flex: 1, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
              <User size={isElderlyMode ? 28 : 24} color="#60a5fa" style={{ flexShrink: 0 }} />
              <span style={{ overflow: 'hidden', textOverflow: 'ellipsis' }}>{lang === 'ms' ? 'Profil Saya' : 'My Profile'}</span>
            </h2>
            <button
              className="btn-secondary"
              onClick={() => setIsEditProfileModalOpen(true)}
              style={{ padding: '0.4rem 0.75rem', fontSize: '0.85rem', display: 'flex', alignItems: 'center', gap: '0.35rem', flexShrink: 0 }}
            >
              <Edit2 size={14} />
              {lang === 'ms' ? 'Kemaskini Profil' : 'Edit Profile'}
            </button>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', color: 'var(--text-secondary)' }}>
              <div><strong style={{ color: '#fff' }}>{lang === 'ms' ? 'Nama:' : 'Name:'}</strong> {currentUser.name}</div>
              <div><strong style={{ color: '#fff' }}>{lang === 'ms' ? 'Umur:' : 'Age:'}</strong> {currentUser.age}</div>
              <div><strong style={{ color: '#fff' }}>{lang === 'ms' ? 'No. Telefon:' : 'Phone No:'}</strong> {currentUser.phone}</div>
              <div>
                <strong style={{ color: '#fff' }}>{lang === 'ms' ? 'Mod Keselamatan:' : 'Safety Mode:'}</strong> 
                <span style={{ marginLeft: '0.5rem', background: 'rgba(255,255,255,0.1)', padding: '0.2rem 0.5rem', borderRadius: '4px', textTransform: 'capitalize' }}>{userMode}</span>
              </div>
            </div>

            {isEditProfileModalOpen && (
              <div style={{ marginTop: '1.5rem', borderTop: '1px solid var(--border-color)', paddingTop: '1rem' }}>
                <EditProfileModal
                  isOpen={true}
                  inline={true}
                  initialData={currentUser}
                  onClose={() => setIsEditProfileModalOpen(false)}
                  onSave={async (updatedData) => {
                    await updateCurrentUser(updatedData);
                    setIsEditProfileModalOpen(false);
                  }}
                />
              </div>
            )}

            {/* Account Deletion Section */}
            <div style={{ marginTop: '0.75rem', borderTop: '1px solid rgba(239, 68, 68, 0.2)', paddingTop: '0.75rem', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
              {!showDeleteConfirm ? (
                <button 
                  onClick={() => setShowDeleteConfirm(true)}
                  className="btn-secondary"
                  style={{ color: '#ef4444', borderColor: 'rgba(239, 68, 68, 0.5)', alignSelf: 'flex-start', padding: '0.35rem 0.8rem', fontSize: '0.9rem' }}
                >
                  {lang === 'ms' ? 'Padam Akaun' : 'Delete Account'}
                </button>
              ) : (
                <div style={{ background: 'rgba(239, 68, 68, 0.05)', padding: '1rem', borderRadius: '12px', border: '1px solid rgba(239, 68, 68, 0.2)' }}>
                  <h4 style={{ color: '#ef4444', marginTop: 0, marginBottom: '0.5rem' }}>{lang === 'ms' ? 'Adakah anda pasti?' : 'Are you sure?'}</h4>
                  <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem', marginBottom: '1rem' }}>
                    {lang === 'ms' ? 'Tindakan ini tidak dapat dipulihkan. Semua data anda akan dipadamkan secara kekal.' : 'This action cannot be undone. All your data will be permanently deleted.'}
                  </p>
                  
                  {deleteError && (
                    <div style={{ color: '#ef4444', fontSize: '0.85rem', marginBottom: '1rem' }}>{deleteError}</div>
                  )}

                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', marginBottom: '1rem' }}>
                    <label style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>{lang === 'ms' ? 'Sahkan Kata Laluan' : 'Verify Password'}</label>
                    <input 
                      type="password" 
                      className="input-field" 
                      value={deletePassword} 
                      onChange={e => setDeletePassword(e.target.value)}
                      placeholder={lang === 'ms' ? 'Kata laluan anda' : 'Your password'}
                    />
                  </div>
                  
                  <div style={{ display: 'flex', gap: '0.5rem' }}>
                    <button 
                      onClick={handleDeleteAccount}
                      className="btn-primary"
                      style={{ background: '#ef4444', padding: '0.35rem 0.8rem', fontSize: '0.9rem' }}
                      disabled={!deletePassword}
                    >
                      {lang === 'ms' ? 'Padam Akaun' : 'Delete Account'}
                    </button>
                    <button 
                      onClick={() => { setShowDeleteConfirm(false); setDeletePassword(''); setDeleteError(''); }}
                      className="btn-secondary"
                      style={{ padding: '0.35rem 0.8rem', fontSize: '0.9rem' }}
                    >
                      {lang === 'ms' ? 'Batal' : 'Cancel'}
                    </button>
                  </div>
                </div>
              )}
            </div>

          </div>
        )}

      {/* Notifications Card */}
      <div className="glass-panel" style={{ padding: '1.5rem 1.75rem' }}>
        <div className="profile-notification-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem', flexWrap: 'wrap', gap: '0.5rem' }}>
          <h2 style={{ fontSize: isElderlyMode ? '1.6rem' : '1.35rem', fontWeight: 700, color: '#fff', display: 'flex', alignItems: 'center', gap: '0.5rem', margin: 0 }}>
            <Bell size={24} color="#3b82f6" />
            {lang === 'ms' ? 'Pemberitahuan Laporan' : 'Report Notifications'}
            {activeNotifications.length > 0 && (
              <span className="badge" style={{ background: 'rgba(59, 130, 246, 0.2)', color: '#60a5fa', fontSize: '0.75rem', padding: '0.15rem 0.6rem', borderRadius: '12px', flexShrink: 0, whiteSpace: 'nowrap' }}>
                {activeNotifications.filter(n => !readIds.includes(n.id)).length} {lang === 'ms' ? 'Baru' : 'New'}
              </span>
            )}
          </h2>

          {activeNotifications.length > 0 && (
            <div className="profile-notification-actions" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              {activeNotifications.some(n => !readIds.includes(n.id)) && (
                <button
                  onClick={handleMarkAllRead}
                  className="btn-secondary"
                  style={{
                    fontSize: '0.75rem',
                    padding: '0.35rem 0.75rem',
                    borderRadius: '16px',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.35rem',
                    color: '#60a5fa',
                    borderColor: 'rgba(59, 130, 246, 0.3)'
                  }}
                >
                  <Check size={13} />
                  {lang === 'ms' ? 'Tanda Semua Sebagai Dibaca' : 'Mark All as Read'}
                </button>
              )}

              <button
                onClick={handleClearAll}
                className="btn-secondary"
                style={{
                  fontSize: '0.75rem',
                  padding: '0.35rem 0.75rem',
                  borderRadius: '16px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.35rem',
                  color: '#f87171',
                  borderColor: 'rgba(239, 68, 68, 0.25)'
                }}
              >
                <Trash2 size={13} />
                {lang === 'ms' ? 'Padam Semua' : 'Clear All'}
              </button>
            </div>
          )}
        </div>

        {activeNotifications.length === 0 ? (
          /* Balanced Empty Notifications Banner */
          <div style={{
            padding: '1.25rem 1.5rem',
            background: 'rgba(255,255,255,0.015)',
            border: '1px dashed var(--border-color)',
            borderRadius: '12px',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            gap: '1rem',
            flexWrap: 'wrap'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.85rem' }}>
              <div style={{
                background: 'rgba(255,255,255,0.04)',
                padding: '0.6rem',
                borderRadius: '50%',
                border: '1px solid var(--border-color)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}>
                <BellOff size={20} color="var(--text-muted)" />
              </div>
              <span style={{ fontSize: '0.88rem', color: 'var(--text-secondary)' }}>
                <strong style={{ color: '#fff', display: 'inline-block', marginRight: '0.5rem' }}>
                  {lang === 'ms' ? 'Tiada Pemberitahuan Baru:' : 'You Have No Notifications:'}
                </strong>
                {lang === 'ms'
                  ? 'Semua pemberitahuan laporan telah dibaca atau dipadamkan.'
                  : 'You are all caught up! No unread report updates.'}
              </span>
            </div>

            {deletedIds.length > 0 && (
              <button
                onClick={handleRestoreAll}
                className="btn-secondary"
                style={{
                  fontSize: '0.75rem',
                  padding: '0.35rem 0.75rem',
                  borderRadius: '14px',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '0.35rem',
                  color: '#60a5fa',
                  borderColor: 'rgba(59, 130, 246, 0.3)',
                  whiteSpace: 'nowrap'
                }}
              >
                <RotateCcw size={13} />
                {lang === 'ms' ? 'Pulihkan' : 'Restore Notifications'}
              </button>
            )}
          </div>
        ) : (
          /* List of Notifications */
          <div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
              {visibleNotifications.map(item => {
                const isRead = readIds.includes(item.id);
                return (
                  <div
                    key={item.id}
                    style={{
                      background: isRead ? 'rgba(255,255,255,0.02)' : 'rgba(59, 130, 246, 0.12)',
                      border: `1px solid ${isRead ? 'var(--border-color)' : 'rgba(59, 130, 246, 0.35)'}`,
                      borderRadius: '12px',
                      padding: '1rem 1.25rem',
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      gap: '1rem',
                      opacity: isRead ? 0.75 : 1,
                      transition: 'all 0.2s ease',
                      flexWrap: 'wrap'
                    }}
                  >
                    <div style={{ display: 'flex', gap: '0.85rem', alignItems: 'flex-start', flex: '1 1 200px' }}>
                      <Bell size={18} color={isRead ? 'var(--text-muted)' : '#3b82f6'} style={{ flexShrink: 0, marginTop: '3px' }} />
                      <div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', marginBottom: '0.25rem', flexWrap: 'wrap' }}>
                          <strong style={{ color: '#fff', fontSize: '0.95rem' }}>
                            {t('profile.update_notice')} {item.reportCode ? ` (${item.reportCode})` : ''}
                          </strong>
                          <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                            {new Date(item.timestamp).toLocaleDateString()}
                          </span>
                          {isRead && (
                            <span className="badge" style={{ background: 'rgba(255,255,255,0.06)', color: 'var(--text-muted)', fontSize: '0.68rem', padding: '0.05rem 0.4rem' }}>
                              {lang === 'ms' ? 'Dibaca' : 'Read'}
                            </span>
                          )}
                        </div>
                        <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem', marginBottom: '0.4rem' }}>
                          {t('profile.update_desc').replace('{category}', getCategoryLabel(item.category, t))}
                        </p>
                        <div style={{ display: 'inline-flex', alignItems: 'center', gap: '0.4rem', background: 'rgba(0,0,0,0.25)', padding: '0.2rem 0.6rem', borderRadius: '14px', fontSize: '0.75rem' }}>
                          {item.status === 'confirmed' ? (
                            <>
                              <CheckCircle size={12} color="var(--color-low)" />
                              <span style={{ color: 'var(--color-low)' }}>{t('status.confirmed')}</span>
                            </>
                          ) : (
                            <>
                              <XCircle size={12} color="var(--color-high)" />
                              <span style={{ color: 'var(--color-high)' }}>{t('status.rejected')}</span>
                            </>
                          )}
                        </div>
                        {item.rationale && (
                          <details style={{ marginTop: '0.5rem' }}>
                            <summary style={{ cursor: 'pointer', fontSize: isElderlyMode ? '1.1rem' : '0.8rem', color: 'var(--primary)', fontWeight: 500 }}>
                              {lang === 'ms' ? 'Lihat Catatan Admin' : 'View Admin Remark'}
                            </summary>
                            <p style={{ color: 'var(--text-secondary)', fontSize: '0.8rem', marginTop: '0.25rem', marginBottom: 0, fontStyle: 'italic', background: 'rgba(255,255,255,0.03)', padding: '0.4rem 0.65rem', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.06)' }}>
                              💬 {lang === 'ms' ? (item.rationaleMs || item.rationale) : (item.rationaleEn || item.rationale)}
                            </p>
                          </details>
                        )}
                      </div>
                    </div>

                    {/* Actions */}
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', flexShrink: 0, marginLeft: 'auto' }}>
                      <button
                        onClick={() => handleToggleRead(item.id)}
                        title={isRead ? (lang === 'ms' ? 'Tanda belum dibaca' : 'Mark as unread') : (lang === 'ms' ? 'Tanda dibaca' : 'Mark as read')}
                        style={{
                          background: 'rgba(255,255,255,0.05)',
                          border: '1px solid var(--border-color)',
                          color: isRead ? 'var(--text-muted)' : '#60a5fa',
                          padding: '0.4rem 0.65rem',
                          borderRadius: '8px',
                          fontSize: '0.75rem',
                          cursor: 'pointer',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '0.35rem'
                        }}
                      >
                        {isRead ? <MailOpen size={14} /> : <Check size={14} />}
                        <span>{isRead ? (lang === 'ms' ? 'Belum Dibaca' : 'Unread') : (lang === 'ms' ? 'Dibaca' : 'Mark as Read')}</span>
                      </button>

                      <button
                        onClick={() => handleDeleteNotification(item.id)}
                        title={lang === 'ms' ? 'Padam pemberitahuan' : 'Delete notification'}
                        style={{
                          background: 'rgba(239, 68, 68, 0.1)',
                          border: '1px solid rgba(239, 68, 68, 0.25)',
                          color: '#f87171',
                          padding: '0.4rem 0.5rem',
                          borderRadius: '8px',
                          cursor: 'pointer',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center'
                        }}
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Expand / Collapse Button */}
            {activeNotifications.length > 1 && (
              <div style={{ textAlign: 'center', marginTop: '1rem' }}>
                <button
                  onClick={() => setIsNotificationsExpanded(prev => !prev)}
                  style={{
                    background: 'transparent',
                    border: 'none',
                    color: 'var(--primary)',
                    fontSize: '0.82rem',
                    fontWeight: 600,
                    cursor: 'pointer',
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '0.35rem',
                    padding: '0.2rem 0.5rem',
                    transition: 'color 0.2s ease'
                  }}
                >
                  <span>
                    {isNotificationsExpanded
                      ? (lang === 'ms' ? 'Tunjukkan Kurang' : 'Show Less')
                      : (lang === 'ms'
                          ? `Tunjukkan Lebih Banyak (${activeNotifications.length - 1} lagi)`
                          : `Show More (${activeNotifications.length - 1} more)`)}
                  </span>
                  {isNotificationsExpanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                </button>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Reports Table Card */}
      <div className="glass-panel profile-reports-panel" style={{ padding: '1.5rem 1.75rem' }}>
        <h2 style={{ fontSize: isElderlyMode ? '1.6rem' : '1.35rem', fontWeight: 700, color: '#fff', marginBottom: '1.25rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <Clock size={24} color="var(--primary)" />
          {t('profile.title')}
        </h2>
        
        <div className="profile-report-table-wrap" role="region" aria-label={t('profile.title')} tabIndex="0">
        <table className="profile-report-table" style={{ color: 'var(--text-secondary)' }}>
          <thead>
            <tr style={{ borderBottom: '1px solid var(--border-color)', textAlign: 'left' }}>
              <th style={{ padding: '1rem', color: '#fff', whiteSpace: 'nowrap' }}>{lang === 'ms' ? 'ID Laporan' : 'Report ID'}</th>
              <th style={{ padding: '1rem', color: '#fff', whiteSpace: 'nowrap' }}>{t('profile.table_date')}</th>
              <th style={{ padding: '1rem', color: '#fff', whiteSpace: 'normal', maxWidth: '150px' }}>{t('profile.table_category')}</th>
              <th style={{ padding: '1rem', color: '#fff', maxWidth: '240px' }}>{t('profile.table_content')}</th>
              <th style={{ padding: '1rem', color: '#fff', whiteSpace: 'nowrap' }}>{t('profile.status')}</th>
            </tr>
          </thead>
          <tbody>
            {myReports.length === 0 ? (
              <tr>
                <td className="profile-empty-cell" colSpan="5" style={{ textAlign: 'center', padding: '2rem' }}>{t('profile.no_reports')}</td>
              </tr>
            ) : (
              (isReportsExpanded ? myReports : myReports.slice(0, isMobile ? 1 : 3)).map(report => (
                <tr key={report.id} style={{ borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                  <td data-label="Report ID" style={{ padding: '1rem', fontSize: '0.85rem', fontWeight: 600, color: 'var(--primary)', whiteSpace: 'nowrap' }}>
                    {report.reportCode || `#${report.id.toString().slice(-6)}`}
                  </td>
                  <td data-label={t('profile.table_date')} style={{ padding: '1rem', fontSize: '0.85rem', whiteSpace: 'nowrap' }}>
                    {new Date(report.timestamp).toLocaleDateString()}
                  </td>
                  <td data-label={t('profile.table_category')} style={{ padding: '1rem', fontSize: '0.85rem', whiteSpace: 'normal', maxWidth: '150px' }}>
                    {getCategoryLabel(report.category, t)}
                  </td>
                  <td data-label={t('profile.table_content')} style={{ padding: '1rem', fontSize: '0.85rem', maxWidth: '240px' }}>
                    <div style={{ display: 'flex', flexDirection: 'column', width: '100%' }}>
                      <div style={{
                        whiteSpace: expandedSnippets.has(report.id) ? 'normal' : 'nowrap',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        maxWidth: '100%'
                      }}>
                        "{report.text}"
                      </div>
                      {report.text.length > 40 && (
                        <button 
                          onClick={() => toggleSnippet(report.id)}
                          style={{
                            background: 'none',
                            border: 'none',
                            color: 'var(--primary)',
                            fontSize: '0.75rem',
                            cursor: 'pointer',
                            padding: '0.35rem 0 0 0',
                            marginTop: '0.2rem',
                            fontWeight: 500,
                            whiteSpace: 'nowrap',
                            alignSelf: 'center'
                          }}
                        >
                          {expandedSnippets.has(report.id) 
                            ? (lang === 'ms' ? 'Tutup' : 'Collapse') 
                            : (lang === 'ms' ? 'Papar penuh' : 'Show full')}
                        </button>
                      )}
                    </div>
                  </td>
                  <td data-label={t('profile.status')} style={{ padding: '1rem', whiteSpace: 'nowrap' }}>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.35rem' }}>
                      {report.status === 'confirmed' && <span style={{ color: 'var(--color-low)', display: 'flex', alignItems: 'center', gap: '0.25rem', fontSize: '0.8rem' }}><CheckCircle size={14} /> {t('profile.confirmed')}</span>}
                      {report.status === 'rejected' && <span style={{ color: 'var(--color-high)', display: 'flex', alignItems: 'center', gap: '0.25rem', fontSize: '0.8rem' }}><XCircle size={14} /> {t('profile.rejected')}</span>}
                      {(report.status === 'unverified' || report.status === 'under_review') && <span style={{ color: '#f59e0b', display: 'flex', alignItems: 'center', gap: '0.25rem', fontSize: '0.8rem' }}><Clock size={14} /> {t('profile.pending')}</span>}
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
        </div>

        {/* Expand / Collapse Button for Reports */}
        {myReports.length > (isMobile ? 1 : 3) && (
          <div style={{ textAlign: 'center', marginTop: '1.25rem' }}>
            <button
              onClick={() => setIsReportsExpanded(prev => !prev)}
              style={{
                background: 'transparent',
                border: 'none',
                color: 'var(--primary)',
                fontSize: '0.85rem',
                fontWeight: 600,
                cursor: 'pointer',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '0.35rem',
                padding: '0.25rem 0.5rem',
                transition: 'color 0.2s ease'
              }}
            >
              <span>
                {isReportsExpanded
                  ? (lang === 'ms' ? 'Tunjukkan Kurang' : 'Show Less')
                  : (lang === 'ms'
                      ? `Tunjukkan Lebih Banyak (${myReports.length - (isMobile ? 1 : 3)} lagi)`
                      : `Show More (${myReports.length - (isMobile ? 1 : 3)} more)`)}
              </span>
              {isReportsExpanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
            </button>
          </div>
        )}
      </div>

      {/* Guardian Settings Card - Only for Kid/Elderly */}
      {(isElderlyMode || isKidMode) && (
        <div className="glass-panel" style={{ padding: '1.25rem 1.75rem', marginTop: '0.25rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '1.5rem', flexWrap: 'wrap' }}>
            <div className="guardian-settings-text" style={{ flex: 1 }}>
              <h2
                style={{
                  fontSize: isElderlyMode ? "1.6rem" : "1.35rem",
                  fontWeight: 700,
                  color: "#fff",
                  marginBottom: "0.5rem"
                }}
              >
                🛡️ {t("guardian.settings")}
              </h2>
              <p
                style={{
                  color: "var(--text-secondary)",
                  margin: 0,
                  fontSize: "0.9rem",
                }}
              >
                {t("guardian.settings_desc")}
              </p>
            </div>

            <button
              className="btn-primary"
              onClick={() => setIsGuardianModalOpen(!isGuardianModalOpen)}
              style={{ flexShrink: 0 }}
            >
              {t("guardian.edit")}
            </button>
          </div>
          {isGuardianModalOpen && (
            <div style={{ marginTop: '1.5rem', borderTop: '1px solid var(--border-color)', paddingTop: '1rem' }}>
              <GuardianSetupModal
                isOpen={true}
                inline={true}
                mode="edit"
                guardian={guardian}
                onClose={() => setIsGuardianModalOpen(false)}
                onSave={async (updatedGuardian) => {
                  await updateGuardian(updatedGuardian);
                  setIsGuardianModalOpen(false);
                }}
              />
            </div>
          )}
        </div>
      )}
    </div>
  );
}
