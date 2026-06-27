import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { toast } from 'react-toastify';
import api from '../api/axiosInstance';

/**
 * Reusable "Report" control for any piece of user-generated content (a listing,
 * service, event, review, etc.). Opens a small modal to pick a reason and
 * submit. The report is sent to the moderation queue.
 *
 * Props:
 *  - contentType: 'RENTAL' | 'SERVICE' | 'EVENT' | 'AD' | 'TRAVEL' | 'HOMESWAP' | 'REVIEW'
 *  - contentId:   id of the item being reported
 *  - ownerId:     user id of the item's owner (so mods can act on the person too)
 *  - className:   optional class for the trigger button
 *  - label:       optional custom label
 */
const REASONS = [
  'Spam or scam',
  'Inappropriate content',
  'Misleading or fake',
  'Harassment or abuse',
  'Other',
];

export default function ReportContentButton({ contentType, contentId, ownerId, className, label }) {
  const { t } = useTranslation();
  const [open, setOpen] = useState(false);
  const [reason, setReason] = useState('');
  const [details, setDetails] = useState('');
  const [busy, setBusy] = useState(false);

  if (!contentId || !ownerId) return null;

  const submit = async () => {
    const finalReason = [reason, details.trim()].filter(Boolean).join(' — ');
    if (!finalReason) {
      toast.warn(t('report.pickReason', 'Please choose a reason'));
      return;
    }
    setBusy(true);
    try {
      await api.post('/api/reports', {
        targetUserId: ownerId,
        contentType,
        contentId,
        reason: finalReason.slice(0, 500),
      });
      toast.success(t('report.thanks', 'Thanks — our moderators will review this.'));
      setOpen(false);
      setReason('');
      setDetails('');
    } catch (e) {
      toast.error(e?.response?.data?.message || t('report.failed', 'Could not submit your report.'));
    } finally {
      setBusy(false);
    }
  };

  return (
    <>
      <button type="button" className={className} onClick={() => setOpen(true)} style={!className ? S.trigger : undefined}>
        {label || `🚩 ${t('report.report', 'Report')}`}
      </button>

      {open && (
        <div style={S.overlay} onClick={() => !busy && setOpen(false)} role="presentation">
          <div style={S.modal} onClick={(e) => e.stopPropagation()} role="dialog" aria-modal="true">
            <h3 style={{ margin: '0 0 6px' }}>{t('report.title', 'Report this')}</h3>
            <p style={{ margin: '0 0 14px', color: '#667085', fontSize: 14 }}>
              {t('report.subtitle', 'Tell us what’s wrong. Your report is anonymous to the other person.')}
            </p>

            <div style={S.chips}>
              {REASONS.map((r) => (
                <button
                  key={r}
                  type="button"
                  onClick={() => setReason(r)}
                  style={{ ...S.chip, ...(reason === r ? S.chipOn : {}) }}
                >
                  {r}
                </button>
              ))}
            </div>

            <textarea
              value={details}
              onChange={(e) => setDetails(e.target.value)}
              rows={3}
              maxLength={400}
              placeholder={t('report.detailsPlaceholder', 'Add details (optional)')}
              style={S.textarea}
            />

            <div style={S.actions}>
              <button type="button" onClick={() => setOpen(false)} disabled={busy} style={S.ghost}>
                {t('common.cancel', 'Cancel')}
              </button>
              <button type="button" onClick={submit} disabled={busy} style={S.danger}>
                {busy ? t('common.sending', 'Sending…') : t('report.submit', 'Submit report')}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

const S = {
  trigger: {
    appearance: 'none', border: '1px solid #e6e8ee', background: '#fff', color: '#b42318',
    borderRadius: 999, padding: '6px 12px', fontSize: 14, cursor: 'pointer',
  },
  overlay: {
    position: 'fixed', inset: 0, background: 'rgba(15,23,42,0.55)', zIndex: 4000,
    display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16,
  },
  modal: {
    width: 'min(440px, 100%)', background: '#fff', color: '#0b1324', borderRadius: 16,
    padding: 20, boxShadow: '0 20px 60px rgba(0,0,0,0.3)',
  },
  chips: { display: 'flex', flexWrap: 'wrap', gap: 8, marginBottom: 12 },
  chip: {
    appearance: 'none', border: '1px solid #e6e8ee', background: '#f8fafc', color: '#0b1324',
    borderRadius: 999, padding: '7px 12px', fontSize: 14, cursor: 'pointer',
  },
  chipOn: { background: '#0ea5e9', color: '#fff', borderColor: '#0ea5e9' },
  textarea: {
    width: '100%', boxSizing: 'border-box', border: '1px solid #e6e8ee', borderRadius: 12,
    padding: 10, fontSize: 14, resize: 'vertical', fontFamily: 'inherit',
  },
  actions: { display: 'flex', justifyContent: 'flex-end', gap: 8, marginTop: 14 },
  ghost: {
    appearance: 'none', border: '1px solid #e6e8ee', background: '#fff', color: '#475467',
    borderRadius: 10, padding: '9px 14px', fontSize: 14, cursor: 'pointer',
  },
  danger: {
    appearance: 'none', border: 0, background: '#b42318', color: '#fff',
    borderRadius: 10, padding: '9px 16px', fontSize: 14, fontWeight: 600, cursor: 'pointer',
  },
};
