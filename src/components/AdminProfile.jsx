import React from 'react';
import { useAppContext } from '../context/AppContext';
import { useLanguage } from '../context/LanguageContext';
import { User, Edit2 } from 'lucide-react';
import EditProfileModal from './EditProfileModal';

const AdminProfile = () => {
  const { adminProfile, updateAdminProfile, deleteCurrentUser } = useAppContext();
  const { lang } = useLanguage();
  const [isEditMode, setIsEditMode] = React.useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = React.useState(false);
  const [deletePassword, setDeletePassword] = React.useState('');
  const [deleteError, setDeleteError] = React.useState('');

  const handleDeleteAccount = async () => {
    setDeleteError('');
    try {
      await deleteCurrentUser(deletePassword);
    } catch (err) {
      setDeleteError(err.message);
    }
  };

  if (!adminProfile) return null;

  return (
    <div className="page-shell profile-page fade-in">
      <div className="glass-panel" style={{ padding: '1.5rem 1.75rem', marginBottom: '1.5rem' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '0.5rem', marginBottom: '1rem', flexWrap: 'wrap' }}>
          <h2 style={{ fontSize: '1.4rem', fontWeight: 700, color: '#fff', display: 'flex', alignItems: 'center', gap: '0.5rem', margin: 0, flex: 1, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
            <User size={24} color="#f87171" style={{ flexShrink: 0 }} />
            <span style={{ overflow: 'hidden', textOverflow: 'ellipsis' }}>{lang === 'ms' ? 'Profil Admin' : 'Admin Profile'}</span>
          </h2>
          {!isEditMode && (
            <button
              className="btn-secondary"
              onClick={() => setIsEditMode(true)}
              style={{ padding: '0.4rem 0.75rem', fontSize: '0.85rem', display: 'flex', alignItems: 'center', gap: '0.35rem', flexShrink: 0 }}
            >
              <Edit2 size={14} />
              {lang === 'ms' ? 'Kemaskini Profil' : 'Edit Profile'}
            </button>
          )}
        </div>
        
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', color: 'var(--text-secondary)' }}>
          <div><strong style={{ color: '#fff' }}>{lang === 'ms' ? 'ID Pegawai:' : 'Officer ID:'}</strong> {adminProfile.officerId}</div>
          <div><strong style={{ color: '#fff' }}>{lang === 'ms' ? 'Nama Penuh:' : 'Full Name:'}</strong> {adminProfile.name}</div>
          <div><strong style={{ color: '#fff' }}>{lang === 'ms' ? 'Emel Rasmi:' : 'Official Email:'}</strong> {adminProfile.email}</div>
          <div>
            <strong style={{ color: '#fff' }}>{lang === 'ms' ? 'Peranan:' : 'Role:'}</strong> 
            <span style={{ marginLeft: '0.5rem', background: 'rgba(239, 68, 68, 0.1)', color: '#fca5a5', padding: '0.2rem 0.5rem', borderRadius: '4px' }}>Moderator</span>
          </div>
        </div>

        {isEditMode && (
          <div style={{ marginTop: '2rem', borderTop: '1px solid rgba(255,255,255,0.1)', paddingTop: '1.5rem' }}>
            <EditProfileModal
              isOpen={true}
              inline={true}
              isAdmin={true}
              initialData={adminProfile}
              onClose={() => setIsEditMode(false)}
              onSave={async (updatedData) => {
                await updateAdminProfile(updatedData);
                setIsEditMode(false);
              }}
            />
          </div>
        )}

        {/* Account Deletion Section */}
        <div style={{ marginTop: '1.5rem', borderTop: '1px solid rgba(239, 68, 68, 0.2)', paddingTop: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          {!showDeleteConfirm ? (
            <button 
              onClick={() => setShowDeleteConfirm(true)}
              className="btn-secondary"
              style={{ color: '#ef4444', borderColor: 'rgba(239, 68, 68, 0.5)', alignSelf: 'flex-start' }}
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
              
              <div style={{ display: 'flex', gap: '0.75rem' }}>
                <button 
                  onClick={handleDeleteAccount}
                  className="btn-primary"
                  style={{ background: '#ef4444' }}
                  disabled={!deletePassword}
                >
                  {lang === 'ms' ? 'Padam Akaun' : 'Delete Account'}
                </button>
                <button 
                  onClick={() => { setShowDeleteConfirm(false); setDeletePassword(''); setDeleteError(''); }}
                  className="btn-secondary"
                >
                  {lang === 'ms' ? 'Batal' : 'Cancel'}
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default AdminProfile;
