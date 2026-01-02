import React, { useState, useEffect, useRef } from 'react';
import styles from '../../../stylus/components/Modal.module.scss';

/**
 * Enterprise-level confirmation modal component
 * Reuses the same backdrop/modal styles as AuthOverlay
 */
const ConfirmModal = ({
  isOpen,
  onClose,
  onConfirm,
  title,
  description,
  confirmText = 'Confirm',
  cancelText = 'Cancel',
  requireDeleteConfirmation = false,
  loading = false,
  danger = false
}) => {
  const [deleteConfirmation, setDeleteConfirmation] = useState('');
  const confirmButtonRef = useRef(null);
  const deleteInputRef = useRef(null);

  // Focus management
  useEffect(() => {
    if (isOpen) {
      if (requireDeleteConfirmation && deleteInputRef.current) {
        deleteInputRef.current.focus();
      } else if (confirmButtonRef.current) {
        confirmButtonRef.current.focus();
      }
    }
  }, [isOpen, requireDeleteConfirmation]);

  // Reset delete confirmation when modal opens/closes
  useEffect(() => {
    if (!isOpen) {
      setDeleteConfirmation('');
    }
  }, [isOpen]);

  const handleConfirm = () => {
    if (requireDeleteConfirmation && deleteConfirmation !== 'DELETE') {
      return;
    }
    onConfirm();
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Escape') {
      onClose();
    }
  };

  const isConfirmDisabled = loading || (requireDeleteConfirmation && deleteConfirmation !== 'DELETE');

  if (!isOpen) return null;

  return (
    <div className={styles.backdrop} onKeyDown={handleKeyDown}>
      <div 
        className={styles.modal}
        role="dialog"
        aria-modal="true"
        aria-labelledby="modal-title"
        aria-describedby="modal-description"
      >
        <h2 id="modal-title" style={{ margin: '0 0 16px 0', fontSize: '18px', fontWeight: '600' }}>
          {title}
        </h2>
        
        <p id="modal-description" style={{ margin: '0 0 20px 0', color: 'var(--on-surface-2)', lineHeight: '1.5' }}>
          {description}
        </p>

        {requireDeleteConfirmation && (
          <div style={{ marginBottom: '20px' }}>
            <label 
              htmlFor="delete-confirmation" 
              style={{ display: 'block', marginBottom: '8px', fontWeight: '500' }}
            >
              Type <strong>DELETE</strong> to confirm:
            </label>
            <input
              ref={deleteInputRef}
              id="delete-confirmation"
              type="text"
              value={deleteConfirmation}
              onChange={(e) => setDeleteConfirmation(e.target.value)}
              placeholder="DELETE"
              style={{
                width: '100%',
                padding: '8px 12px',
                border: '1px solid var(--border-1)',
                borderRadius: '8px',
                fontSize: '14px'
              }}
            />
          </div>
        )}

        <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end' }}>
          <button
            type="button"
            onClick={onClose}
            disabled={loading}
            style={{
              padding: '8px 16px',
              border: '1px solid var(--border-1)',
              borderRadius: '8px',
              background: 'var(--surface-0)',
              color: 'var(--on-surface-0)',
              cursor: 'pointer',
              fontSize: '14px',
              fontWeight: '500'
            }}
          >
            {cancelText}
          </button>
          
          <button
            ref={confirmButtonRef}
            type="button"
            onClick={handleConfirm}
            disabled={isConfirmDisabled}
            style={{
              padding: '8px 16px',
              border: danger ? '1px solid #dc2626' : '1px solid var(--primary)',
              borderRadius: '8px',
              background: danger ? '#dc2626' : 'var(--primary)',
              color: '#fff',
              cursor: isConfirmDisabled ? 'not-allowed' : 'pointer',
              fontSize: '14px',
              fontWeight: '500',
              opacity: isConfirmDisabled ? 0.6 : 1
            }}
          >
            {loading ? 'Processing...' : confirmText}
          </button>
        </div>
      </div>
    </div>
  );
};

export default ConfirmModal;