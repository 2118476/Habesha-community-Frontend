// src/pages/mod/ModeratorDashboard.jsx
import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { getUsers } from '../../api/moderator';
import { toast } from 'react-toastify';
import s from './ModeratorDashboard.module.scss';

const ROLE_BADGE = {
  USER: s.badgeUser,
  ADMIN: s.badgeAdmin,
  MODERATOR: s.badgeMod,
  SERVICE_PROVIDER: s.badgeProvider,
};

const ROLE_LABEL = {
  USER: 'User',
  ADMIN: 'Admin',
  MODERATOR: 'Moderator',
  SERVICE_PROVIDER: 'Provider',
};

function formatDate(iso) {
  if (!iso) return '—';
  const d = new Date(iso);
  return d.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })
    + ', ' + d.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' });
}

export default function ModeratorDashboard() {
  const { t } = useTranslation();
  const [page, setPage] = useState(0);
  const [size] = useState(20);
  const [query, setQuery] = useState('');
  const [data, setData] = useState(null);
  const [busy, setBusy] = useState(false);

  const load = async (p = page) => {
    setBusy(true);
    try {
      const res = await getUsers({ page: p, size, query });
      setData(res);
      setPage(p);
    } catch {
      toast.error(t('moderation.failedToLoadUsers'));
    } finally {
      setBusy(false);
    }
  };

  useEffect(() => { load(0); }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const content = data?.content ?? [];
  const totalPages = data?.totalPages ?? 1;
  const totalElements = data?.totalElements ?? 0;

  const handleSearchKey = (e) => {
    if (e.key === 'Enter') load(0);
  };

  return (
    <div className={s.dashboard}>
      <div className={s.header}>
        <div>
          <h1 className={s.title}>Moderator Dashboard</h1>
          <p className={s.subtitle}>{totalElements} registered users</p>
        </div>
      </div>

      <div className={s.searchBar}>
        <input
          className={s.searchInput}
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onKeyDown={handleSearchKey}
          placeholder={t('moderation.searchPlaceholder')}
        />
        <button className={s.searchBtn} disabled={busy} onClick={() => load(0)}>
          Search
        </button>
      </div>

      <div className={s.tableCard}>
        {busy && content.length === 0 ? (
          <div className={s.loadingOverlay}>
            <div className={s.spinner} />
            Loading users…
          </div>
        ) : (
          <>
            <div className={s.tableScroll}>
              <table className={s.table}>
                <thead>
                  <tr>
                    <th>ID</th>
                    <th>Name</th>
                    <th>Email</th>
                    <th>Role</th>
                    <th>Status</th>
                    <th>Created</th>
                  </tr>
                </thead>
                <tbody>
                  {content.map((u) => (
                    <tr key={u.id}>
                      <td><span className={s.userId}>{u.id}</span></td>
                      <td><span className={s.userName}>{u.name || '—'}</span></td>
                      <td><span className={s.userEmail}>{u.email}</span></td>
                      <td>
                        <span className={`${s.badge} ${ROLE_BADGE[u.role] || s.badgeUser}`}>
                          {ROLE_LABEL[u.role] || u.role}
                        </span>
                      </td>
                      <td>
                        <span className={`${s.badge} ${u.active ? s.badgeActive : s.badgeDisabled}`}>
                          {u.active ? 'Active' : 'Disabled'}
                        </span>
                      </td>
                      <td><span className={s.dateCell}>{formatDate(u.createdAt)}</span></td>
                    </tr>
                  ))}
                  {content.length === 0 && !busy && (
                    <tr className={s.emptyRow}>
                      <td colSpan={6}>No users found</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>

            <div className={s.pagination}>
              <span className={s.pageInfo}>
                Page {page + 1} of {totalPages}
              </span>
              <div className={s.pageButtons}>
                <button
                  className={s.pageBtn}
                  disabled={busy || page === 0}
                  onClick={() => load(page - 1)}
                >
                  ← Previous
                </button>
                <button
                  className={s.pageBtn}
                  disabled={busy || page + 1 >= totalPages}
                  onClick={() => load(page + 1)}
                >
                  Next →
                </button>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
