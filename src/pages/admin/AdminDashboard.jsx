// src/pages/admin/AdminDashboard.jsx
import React, { useState, useEffect } from 'react';
import {
  getUsers,
  updateUserRole,
  deleteUser,
  deactivateUser,
  activateUser,
} from '../../api/admin';
import { toast } from 'react-toastify';
import s from './AdminDashboard.module.scss';

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

export default function AdminDashboard() {
  const [page, setPage] = useState(0);
  const [size] = useState(20);
  const [query, setQuery] = useState('');
  const [data, setData] = useState(null);
  const [busy, setBusy] = useState(false);
  const [saving, setSaving] = useState({});

  const load = async (p = page) => {
    setBusy(true);
    try {
      const res = await getUsers({ page: p, size, query });
      setData(res);
      setPage(p);
    } catch {
      toast.error('Failed to load users');
    } finally {
      setBusy(false);
    }
  };

  useEffect(() => { load(0); }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const onChangeRole = async (userId, role) => {
    setSaving((prev) => ({ ...prev, [userId]: true }));
    try {
      await updateUserRole(userId, role);
      toast.success('Role updated');
      await load(page);
    } catch {
      toast.error('Failed to update role');
    } finally {
      setSaving((prev) => ({ ...prev, [userId]: false }));
    }
  };

  const onToggleActive = async (u) => {
    setSaving((prev) => ({ ...prev, [u.id]: true }));
    try {
      if (u.active) {
        await deactivateUser(u.id);
        toast.success('User deactivated');
      } else {
        await activateUser(u.id);
        toast.success('User activated');
      }
      await load(page);
    } catch {
      toast.error('Failed to update user status');
    } finally {
      setSaving((prev) => ({ ...prev, [u.id]: false }));
    }
  };

  const onDelete = async (u) => {
    if (!window.confirm(`Permanently delete ${u.name || u.email}?`)) return;
    setSaving((prev) => ({ ...prev, [u.id]: true }));
    try {
      await deleteUser(u.id);
      toast.success('User deleted');
      await load(page);
    } catch {
      toast.error('Failed to delete user');
    } finally {
      setSaving((prev) => ({ ...prev, [u.id]: false }));
    }
  };

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
          <h1 className={s.title}>User Management</h1>
          <p className={s.subtitle}>{totalElements} total users</p>
        </div>
      </div>

      <div className={s.searchBar}>
        <input
          className={s.searchInput}
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onKeyDown={handleSearchKey}
          placeholder="Search by name or username…"
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
                    <th>Last Login</th>
                    <th>Last Active</th>
                    <th style={{ textAlign: 'center' }}>Online</th>
                    <th>Created</th>
                    <th>Actions</th>
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
                      <td><span className={s.dateCell}>{formatDate(u.lastLoginAt)}</span></td>
                      <td><span className={s.dateCell}>{formatDate(u.lastActiveAt)}</span></td>
                      <td style={{ textAlign: 'center' }}>
                        <span
                          className={`${s.onlineDot} ${u.online ? s.online : s.offline}`}
                          title={u.online ? 'Online' : 'Offline'}
                        />
                      </td>
                      <td><span className={s.dateCell}>{formatDate(u.createdAt)}</span></td>
                      <td>
                        <div className={s.actions}>
                          <select
                            className={s.roleSelect}
                            value={u.role}
                            onChange={(e) => onChangeRole(u.id, e.target.value)}
                            disabled={!!saving[u.id]}
                          >
                            <option value="USER">User</option>
                            <option value="SERVICE_PROVIDER">Provider</option>
                            <option value="MODERATOR">Moderator</option>
                            <option value="ADMIN">Admin</option>
                          </select>
                          <button
                            className={u.active ? s.deactivateBtn : s.activateBtn}
                            onClick={() => onToggleActive(u)}
                            disabled={!!saving[u.id]}
                          >
                            {u.active ? 'Deactivate' : 'Activate'}
                          </button>
                          <button
                            className={s.deleteBtn}
                            onClick={() => onDelete(u)}
                            disabled={!!saving[u.id]}
                          >
                            Delete
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                  {content.length === 0 && !busy && (
                    <tr className={s.emptyRow}>
                      <td colSpan={10}>No users found</td>
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
