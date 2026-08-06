import React from 'react';
import { useAppContext } from '../context/AppContext';
import { useLanguage } from '../context/LanguageContext';
import { User, Edit2 } from 'lucide-react';
import EditProfileModal from './EditProfileModal';

const AdminProfile = () => {
  const { adminProfile, updateAdminProfile } = useAppContext();
  const { lang } = useLanguage();
  const [isEditMode, setIsEditMode] = React.useState(false);

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
      </div>
    </div>
  );
};

export default AdminProfile;
