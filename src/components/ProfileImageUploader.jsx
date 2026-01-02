
import React, { useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import api from '../api/axiosInstance';
import { toast } from 'react-toastify';
import Avatar from './Avatar';

export default function ProfileImageUploader() {
  const { t } = useTranslation();
  const fileRef = useRef(null);
  const [preview, setPreview] = useState(null);
  const [busy, setBusy] = useState(false);

  const onPick = () => fileRef.current?.click();

  const onFile = (e) => {
    const f = e.target.files?.[0];
    if (!f) return;
    const url = URL.createObjectURL(f);
    setPreview({ file: f, url });
  };

  const onUpload = async () => {
    if (!preview?.file) return;
    const fd = new FormData();
    fd.append('file', preview.file);
    setBusy(true);
    try {
      await api.post('/account/profile-image', fd, { headers: { 'Content-Type': 'multipart/form-data' } });
      toast.success('Profile photo updated');
    } catch (e) {
      toast.error('Upload failed');
    } finally {
      setBusy(false);
    }
  };

  const onRemove = async () => {
    setBusy(true);
    try {
      await api.delete('/account/profile-image');
      setPreview(null);
      toast.success('Profile photo removed');
    } catch (e) {
      toast.error('Remove failed');
    } finally {
      setBusy(false);
    }
  };

  return (
    <div style={{ display:'grid', gap: 12 }}>
      <div style={{ display:'flex', alignItems:'center', gap: 16 }}>
        {/*
          Use Avatar to display the preview or current user's avatar.  When
          preview is null, passing an empty src triggers the Avatar
          component to render the logged-in user's avatar or initials.  The
          size prop accepts a numeric pixel value and the component will
          round the image automatically.
        */}
        <Avatar
          src={preview?.url || ''}
          user="me"
          size={96}
          alt="Preview"
          rounded
        />
        <div style={{ display:'flex', gap:8 }}>
          <button onClick={onPick} disabled={busy}>{t('buttons.choose')}</button>
          <button onClick={onUpload} disabled={busy || !preview}>{t('buttons.upload')}</button>
          <button onClick={onRemove} disabled={busy}>{t('buttons.remove')}</button>
        </div>
      </div>
      <input ref={fileRef} type="file" accept="image/*" onChange={onFile} style={{ display:'none' }} />
    </div>
  );
}
