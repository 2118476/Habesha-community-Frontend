import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';

const fabStyle = {
  position: 'fixed',
  right: '16px',
  bottom: '16px',
  zIndex: 1000
};
const panelStyle = {
  position: 'absolute',
  right: 0,
  bottom: '48px',
  background: 'white',
  border: '1px solid rgba(0,0,0,.1)',
  borderRadius: 12,
  boxShadow: '0 6px 24px rgba(0,0,0,.12)',
  padding: 10,
  minWidth: 220
};
const btn = {
  border: 'none',
  background: '#111',
  color: '#fff',
  padding: '10px 12px',
  borderRadius: 999,
  cursor: 'pointer'
};
const link = { display: 'block', padding: '8px 10px', borderRadius: 8, textDecoration: 'none' };

export default function QuickActionsFab() {
  const { t } = useTranslation();
  const [open, setOpen] = useState(false);
  return (
    <div style={fabStyle}>
      {open && (
        <div style={panelStyle} onMouseLeave={() => setOpen(false)}>
          <b>{t('buttons.quickActions')}</b>
          <Link style={link} to="/app/travel">Travel — Browse</Link>
          <Link style={link} to="/app/travel/post">Travel — Post</Link>
          <Link style={link} to="/app/homeswap">Home Swap — Browse</Link>
          <Link style={link} to="/app/homeswap/post">Home Swap — Post</Link>
        </div>
      )}
      <button style={btn} onClick={() => setOpen(v => !v)} aria-label={t('buttons.quickActions')}>＋</button>
    </div>
  );
}
