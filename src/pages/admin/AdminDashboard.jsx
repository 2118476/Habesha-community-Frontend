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

// Administrative dashboard for managing users. Displays a paginated
// list of users with their basic information and allows an admin
// to change a user's role. Utilises the backend RBAC endpoints.
export default function AdminDashboard() {
  const [page, setPage] = useState(0);
  const [size] = useState(20);
  const [query, setQuery] = useState('');
  const [data, setData] = useState(null);
  const [busy, setBusy] = useState(false);
  const [saving, setSaving] = useState({});

  // Triggered when an admin wants to toggle a user's active status.  If the user
  // is currently active the account will be deactivated, otherwise it will be
  // activated.  After the operation completes the list is reloaded.
  const onToggleActive = async (u) => {
    const userId = u.id;
    setSaving((s) => ({ ...s, [userId]: true }));
    try {
      if (u.active) {
        await deactivateUser(userId);
        toast.success('User deactivated');
      } else {
        await activateUser(userId);
        toast.success('User activated');
      }
      await load(page);
    } catch (err) {
      toast.error('Failed to update user status');
    } finally {
      setSaving((s) => ({ ...s, [userId]: false }));
    }
  };

  // Permanently delete a user.  Prompts for confirmation before
  // performing the operation.
  const onDelete = async (u) => {
    if (!window.confirm('Are you sure you want to permanently delete this user?')) {
      return;
    }
    const userId = u.id;
    setSaving((s) => ({ ...s, [userId]: true }));
    try {
      await deleteUser(userId);
      toast.success('User deleted');
      await load(page);
    } catch (err) {
      toast.error('Failed to delete user');
    } finally {
      setSaving((s) => ({ ...s, [userId]: false }));
    }
  };

  const load = async (p = page) => {
    setBusy(true);
    try {
      const res = await getUsers({ page: p, size, query });
      setData(res);
      setPage(p);
    } catch (err) {
      toast.error('Failed to load users');
    } finally {
      setBusy(false);
    }
  };

  useEffect(() => {
    load(0);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const onChangeRole = async (userId, role) => {
    setSaving((s) => ({ ...s, [userId]: true }));
    try {
      await updateUserRole(userId, role);
      toast.success('Role updated');
      await load(page);
    } catch (err) {
      toast.error('Failed to update role');
    } finally {
      setSaving((s) => ({ ...s, [userId]: false }));
    }
  };

  const content = data?.content ?? [];
  const totalPages = data?.totalPages ?? 1;

  return (
    <div style={{ padding: '1rem' }}>
      <h1 style={{ marginBottom: '1rem' }}>Admin Dashboard</h1>

      <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1rem' }}>
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search name/username…"
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
              <th align="left">Account</th>
              <th align="left">Last Login</th>
              <th align="left">Last Active</th>
              <th align="center">Online</th>
              <th align="left">Created</th>
              <th align="left">Actions</th>
            </tr>
          </thead>
          <tbody>
            {content.map((u) => (
              <tr key={u.id}>
                <td>{u.id}</td>
                <td>{u.name || '-'}</td>
                <td>{u.email}</td>
                <td>{u.role}</td>
                <td>{u.active ? 'Active' : 'Disabled'}</td>
                <td>{u.lastLoginAt ? new Date(u.lastLoginAt).toLocaleString() : '-'}</td>
                <td>{u.lastActiveAt ? new Date(u.lastActiveAt).toLocaleString() : '-'}</td>
                <td style={{ textAlign: 'center' }}>
                  {u.online ? <span title="Online">🟢</span> : <span title="Offline">⚪</span>}
                </td>
                <td>{u.createdAt ? new Date(u.createdAt).toLocaleString() : '-'}</td>
                <td style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
                  <select
                    value={u.role}
                    onChange={(e) => onChangeRole(u.id, e.target.value)}
                    disabled={!!saving[u.id]}
                  >
                    <option value="USER">USER</option>
                    <option value="SERVICE_PROVIDER">SERVICE_PROVIDER</option>
                    <option value="MODERATOR">MODERATOR</option>
                    <option value="ADMIN">ADMIN</option>
                  </select>
                  <button
                    onClick={() => onToggleActive(u)}
                    disabled={!!saving[u.id]}
                    style={{ padding: '0.25rem 0.5rem' }}
                  >
                    {u.active ? 'Deactivate' : 'Activate'}
                  </button>
                  <button
                    onClick={() => onDelete(u)}
                    disabled={!!saving[u.id]}
                    style={{ padding: '0.25rem 0.5rem', color: 'red' }}
                  >
                    Delete
                  </button>
                </td>
              </tr>
            ))}
            {content.length === 0 && !busy && (
              <tr>
                <td colSpan={10} style={{ padding: '0.5rem' }}>No users</td>
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