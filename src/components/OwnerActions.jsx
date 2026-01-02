import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import buttonStyles from '../stylus/components/Button.module.scss';

export default function OwnerActions({ isOwner, editTo, onDelete, className }) {
  const { t } = useTranslation();
  const [busy, setBusy] = useState(false);
  if (!isOwner) return null;

  const handleDelete = async () => {
    if (!window.confirm(t('common.deleteConfirm') || 'Delete this item? This cannot be undone.')) return;
    setBusy(true);
    try { await onDelete?.(); }
    finally { setBusy(false); }
  };

  return (
    <div className={className} style={{ display: 'flex', gap: 8 }}>
      {editTo && (
        <Link to={editTo} className={`${buttonStyles.btn} ${buttonStyles.secondary}`}>
          {t('common.edit')}
        </Link>
      )}
      <button
        type="button"
        onClick={handleDelete}
        disabled={busy}
        className={`${buttonStyles.btn} ${buttonStyles.danger}`}
      >
        {busy ? t('common.deleting') || 'Deleting…' : t('common.delete')}
      </button>
    </div>
  );
}
