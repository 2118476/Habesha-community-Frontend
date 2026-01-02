// src/pages/mod/ModeratorDashboard.jsx
import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { getUsers } from '../../api/moderator';
import { toast } from 'react-toastify';

// Moderator dashboard shows a read‑only list of users. Moderators
// can view basic user information but cannot modify roles.
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
    } catch (err) {
      toast.error(t('moderation.failedToLoadUsers'));
    } finally {
      setBusy(false);
    }
  };

  useEffect(() => {
    load(0);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const content = data?.content ?? [];
  const totalPages = data?.totalPages ?? 1;

  return (
    <div style={{ padding: '1rem' }}>
      <h1 style={{ marginBottom: '1rem' }}>Moderator Dashboard</h1>

      <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1rem' }}>
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder={t('moderation.searchPlaceholder')}
          style={{ flex: 1, padding: '0.5rem' }}
        />
        <button
          disabled={busy}
          onClick={() => load(0)}
          style={{ padding: '0.5rem 1rem' }}
        >
          Search
        </button>
      </div>

      <div style={{ overflowX: 'auto' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr>
              <th align="left">ID</th>
              <th align="left">Name</th>
              <th align="left">Email</th>
              <th align="left">Role</th>
              <th align="left">Active</th>
              <th align="left">Created</th>
            </tr>
          </thead>
          <tbody>
            {content.map((u) => (
              <tr key={u.id}>
                <td>{u.id}</td>
                <td>{u.name || '-'}</td>
                <td>{u.email}</td>
                <td>{u.role}</td>
                <td>{u.active ? 'Yes' : 'No'}</td>
                <td>{u.createdAt ? new Date(u.createdAt).toLocaleString() : '-'}</td>
              </tr>
            ))}
            {content.length === 0 && !busy && (
              <tr>
                <td colSpan={6} style={{ padding: '0.5rem' }}>No users</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      <div style={{ display: 'flex', gap: '0.5rem', marginTop: '1rem' }}>
        <button
          disabled={busy || page === 0}
          onClick={() => load(page - 1)}
          style={{ padding: '0.5rem 1rem' }}
        >
          Prev
        </button>
        <div style={{ alignSelf: 'center' }}>Page {page + 1} / {totalPages}</div>
        <button
          disabled={busy || page + 1 >= totalPages}
          onClick={() => load(page + 1)}
          style={{ padding: '0.5rem 1rem' }}
        >
          Next
        </button>
      </div>
    </div>
  );
}