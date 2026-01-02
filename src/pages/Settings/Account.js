import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import api from '../../api/axiosInstance';
import useAuth from '../../hooks/useAuth';
import { toast } from 'react-toastify';
import styles from '../../stylus/sections/Settings.module.scss';
import { SectionLoader } from '../../components/ui/SectionLoader/SectionLoader';
import ConfirmModal from '../../components/ui/ConfirmModal/ConfirmModal';

/**
 * AccountSettings allows the user to update core account information
 * such as their display name, email and phone number. It reuses the
 * existing /api/users/me endpoint to update the profile.
 */
const AccountSettings = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { user, refreshMe, logout } = useAuth();
  const [displayName, setDisplayName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [saving, setSaving] = useState(false);
  
  // Modal states
  const [freezeModalOpen, setFreezeModalOpen] = useState(false);
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [freezeLoading, setFreezeLoading] = useState(false);
  const [deleteLoading, setDeleteLoading] = useState(false);

  useEffect(() => {
    if (user) {
      setDisplayName(user.name || '');
      setEmail(user.email || '');
      setPhone(user.phone || '');
    }
  }, [user]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Validation
    if (!displayName || displayName.trim().length < 2) {
      toast.error(t('settings.account.nameTooShort'));
      return;
    }
    
    if (phone && !/^[\d\s\-\+\(\)]+$/.test(phone)) {
      toast.error(t('settings.account.invalidPhone'));
      return;
    }
    
    setSaving(true);
    try {
      await api.put('/api/users/me', {
        displayName: displayName.trim(),
        phone: phone.trim(),
        location: user?.city || '',
        avatarUrl: user?.profileImageUrl || '',
        bannerUrl: null,
        bio: null,
      });
      await refreshMe();
      toast.success(t('settings.account.updateSuccess'));
    } catch (err) {
      console.error('Account update error:', err);
      const message = err?.response?.data?.message || t('settings.account.updateFailed');
      toast.error(message);
    } finally {
      setSaving(false);
    }
  };

  const handleFreezeAccount = async () => {
    setFreezeLoading(true);
    try {
      await api.post('/api/users/me/freeze');
      toast.success(t('settings.account.freezeSuccess'));
      logout();
      navigate('/');
    } catch (err) {
      console.error('Freeze account error:', err);
      const message = err?.response?.data?.message || t('settings.account.freezeFailed');
      toast.error(message);
    } finally {
      setFreezeLoading(false);
      setFreezeModalOpen(false);
    }
  };

  const handleDeleteAccount = async () => {
    setDeleteLoading(true);
    try {
      await api.post('/api/users/me/delete-request');
      toast.success(t('settings.account.deleteRequestSuccess'));
      logout();
      navigate('/');
    } catch (err) {
      console.error('Delete account error:', err);
      const message = err?.response?.data?.message || t('settings.account.deleteRequestFailed');
      toast.error(message);
    } finally {
      setDeleteLoading(false);
      setDeleteModalOpen(false);
    }
  };

  if (!user) {
    return (
      <div className={styles.panel}>
        <SectionLoader message={t('settings.account.loadingAccountSettings')} />
      </div>
    );
  }

  return (
    <div className={styles.page}>
      <h1 className={styles.title}>{t('settings.account.title')}</h1>
      
      <section className={styles.panel}>
        <h2>{t('settings.account.basicInfo')}</h2>
        <form onSubmit={handleSubmit} className={styles.formGrid}>
          <label htmlFor="displayName">{t('settings.displayName')} *</label>
          <input
            id="displayName"
            type="text"
            value={displayName}
            onChange={(e) => setDisplayName(e.target.value)}
            required
            minLength={2}
            maxLength={100}
            placeholder={t('settings.fullNamePlaceholder')}
            aria-describedby="displayNameHelp"
          />
          <p id="displayNameHelp" className={styles.help}>
            {t('settings.account.displayNameHelp')}
          </p>

          <label htmlFor="email">{t('settings.email')}</label>
          <input
            id="email"
            type="email"
            value={email}
            disabled
            readOnly
            aria-describedby="emailHelp"
          />
          <p id="emailHelp" className={styles.help}>
            {t('settings.account.emailHelp')}
          </p>

          <label htmlFor="phone">{t('settings.phone')}</label>
          <input
            id="phone"
            type="tel"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            placeholder={t('settings.phonePlaceholder')}
            aria-describedby="phoneHelp"
          />
          <p id="phoneHelp" className={styles.help}>
            {t('settings.account.phoneHelp')}
          </p>

          <div className={styles.rowRight}>
            <button 
              type="submit" 
              className={styles.btnPrimary}
              disabled={saving}
              aria-busy={saving ? 'true' : 'false'}
            >
              {saving ? t('settings.account.saving') : t('settings.account.saveChanges')}
            </button>
          </div>
        </form>
      </section>

      <section className={styles.panel}>
        <h2>{t('settings.account.accountStatus')}</h2>
        <div className={styles.infoGrid}>
          <div>
            <strong>{t('auth.username')}:</strong> {user.username || '—'}
          </div>
          <div>
            <strong>{t('profile.joined')}:</strong>{' '}
            {(() => {
              if (!user.createdAt) return t('common.unknown');
              try {
                const date = new Date(user.createdAt);
                if (isNaN(date.getTime())) return t('common.unknown');
                return date.toLocaleDateString('en-US', {
                  year: 'numeric',
                  month: 'long',
                  day: 'numeric',
                });
              } catch (error) {
                console.warn('Error formatting createdAt date:', error);
                return t('common.unknown');
              }
            })()}
          </div>
          <div>
            <strong>{t('profile.accountDetails')}:</strong> {user.role || 'USER'}
          </div>
        </div>
      </section>

      <section className={styles.panel}>
        <h2>{t('settings.account.safetyTips')}</h2>
        <ul className={styles.tips}>
          <li>{t('settings.account.safetyTip1')}</li>
          <li>{t('settings.account.safetyTip2')}</li>
          <li>{t('settings.account.safetyTip3')}</li>
          <li>{t('settings.account.safetyTip4')}</li>
        </ul>
      </section>

      <section className={styles.panel}>
        <h2>{t('settings.account.dangerZone')}</h2>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <div>
            <h3 style={{ margin: '0 0 8px 0', fontSize: '16px', fontWeight: '600' }}>
              {t('settings.account.freezeAccountRecommended')}
            </h3>
            <p className={styles.help} style={{ marginBottom: '12px' }}>
              {t('settings.account.freezeAccountDescription')}
            </p>
            <button 
              type="button"
              className={styles.btnSecondary}
              onClick={() => setFreezeModalOpen(true)}
            >
              {t('settings.account.freezeAccount')}
            </button>
          </div>
          
          <div>
            <h3 style={{ margin: '0 0 8px 0', fontSize: '16px', fontWeight: '600' }}>
              {t('settings.account.deleteAccount')}
            </h3>
            <p className={styles.help} style={{ marginBottom: '12px' }}>
              {t('settings.account.deleteAccountDescription')}
            </p>
            <button 
              type="button"
              className={styles.btnDanger}
              onClick={() => setDeleteModalOpen(true)}
            >
              {t('settings.account.deleteAccount')}
            </button>
          </div>
        </div>
      </section>

      {/* Freeze Account Modal */}
      <ConfirmModal
        isOpen={freezeModalOpen}
        onClose={() => setFreezeModalOpen(false)}
        onConfirm={handleFreezeAccount}
        title={t('settings.account.freezeConfirmTitle')}
        description={t('settings.account.freezeConfirmDescription')}
        confirmText={t('settings.account.freezeAccount')}
        cancelText={t('common.cancel')}
        loading={freezeLoading}
      />

      {/* Delete Account Modal */}
      <ConfirmModal
        isOpen={deleteModalOpen}
        onClose={() => setDeleteModalOpen(false)}
        onConfirm={handleDeleteAccount}
        title={t('settings.account.deleteConfirmTitle')}
        description={t('settings.account.deleteConfirmDescription')}
        confirmText={t('common.submit')}
        cancelText={t('common.cancel')}
        requireDeleteConfirmation={true}
        loading={deleteLoading}
        danger={true}
      />
    </div>
  );
};

export default AccountSettings;