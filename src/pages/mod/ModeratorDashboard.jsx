// src/pages/mod/ModeratorDashboard.jsx
// Trust & Safety console: Overview · Reports queue · Users · Audit log.
import React, { useState, useEffect, useCallback } from 'react';
import { toast } from 'react-toastify';
import useAuth from '../../hooks/useAuth';
import {
  getUsers, getOverview, getReports, setReportStatus,
  takedownContent, suspendUser, unsuspendUser, warnUser, getAudit,
} from '../../api/moderator';
import s from './ModeratorDashboard.module.scss';

const ROLE_LABEL = { USER: 'User', ADMIN: 'Admin', MODERATOR: 'Moderator', SERVICE_PROVIDER: 'Provider' };
const ROLE_BADGE = { USER: s.badgeUser, ADMIN: s.badgeAdmin, MODERATOR: s.badgeMod, SERVICE_PROVIDER: s.badgeProvider };

function fmt(iso) {
  if (!iso) return '—';
  const d = new Date(iso);
  return d.toLocaleDateString('en-GB', { day: '2-digit', month: 'short' })
    + ', ' + d.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' });
}

export default function ModeratorDashboard() {
  const { roles: rawRoles = [] } = useAuth() || {};
  const roles = (Array.isArray(rawRoles) ? rawRoles : [])
    .map((r) => String(r?.name || r).toUpperCase().replace(/^ROLE_/, ''));
  const isAdmin = roles.includes('ADMIN');

  const [tab, setTab] = useState('reports');
  const [overview, setOverview] = useState(null);
  const [reports, setReports] = useState([]);
  const [users, setUsers] = useState(null);
  const [audit, setAudit] = useState(null);
  const [query, setQuery] = useState('');
  const [busy, setBusy] = useState(false);

  const loadOverview = useCallback(async () => {
    try { setOverview(await getOverview()); } catch { /* ignore */ }
  }, []);
  const loadReports = useCallback(async () => {
    setBusy(true);
    try { setReports(await getReports()); }
    catch { toast.error('Failed to load reports'); }
    finally { setBusy(false); }
  }, []);
  const loadUsers = useCallback(async (q = '') => {
    setBusy(true);
    try { setUsers(await getUsers({ page: 0, size: 30, query: q })); }
    catch { toast.error('Failed to load users'); }
    finally { setBusy(false); }
  }, []);
  const loadAudit = useCallback(async () => {
    setBusy(true);
    try { setAudit(await getAudit({ page: 0, size: 100 })); }
    catch { toast.error('Failed to load audit log'); }
    finally { setBusy(false); }
  }, []);

  useEffect(() => { loadOverview(); }, [loadOverview]);
  useEffect(() => {
    if (tab === 'reports') loadReports();
    if (tab === 'users') loadUsers(query);
    if (tab === 'audit') loadAudit();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tab]);

  // run an action then refresh the relevant views
  const run = async (fn, okMsg) => {
    setBusy(true);
    try {
      await fn();
      if (okMsg) toast.success(okMsg);
      await Promise.all([loadOverview(), tab === 'reports' ? loadReports() : null, tab === 'users' ? loadUsers(query) : null]);
    } catch (e) {
      toast.error(e?.response?.data?.message || e?.response?.data || 'Action failed');
    } finally {
      setBusy(false);
    }
  };

  const onMarkReviewed = (r) => run(() => setReportStatus(r.id, 'REVIEWED'), 'Marked as reviewed');
  const onClose = (r) => run(() => setReportStatus(r.id, 'CLOSED'), 'Report closed');
  const onRemove = (r) => {
    const reason = window.prompt('Reason for removing this content (optional):') || '';
    run(async () => { await takedownContent(r.contentType, r.contentId, reason); await setReportStatus(r.id, 'CLOSED'); }, 'Content removed');
  };
  const onWarn = (userId) => {
    const msg = window.prompt('Warning message to send the user:');
    if (!msg) return;
    run(() => warnUser(userId, msg), 'Warning sent');
  };
  const onSuspend = (userId) => {
    const reason = window.prompt('Reason for suspending this user (shown to them at login):');
    if (reason === null) return;
    run(() => suspendUser(userId, reason), 'User suspended');
  };
  const onUnsuspend = (userId) => run(() => unsuspendUser(userId), 'User reinstated');

  return (
    <div className={s.dashboard}>
      <div className={s.header}>
        <div>
          <h1 className={s.title}>Trust &amp; Safety</h1>
          <p className={s.subtitle}>{isAdmin ? 'Admin console' : 'Moderator console'}</p>
        </div>
      </div>

      {/* Tabs */}
      <div style={T.tabs}>
        {['overview', 'reports', 'users', ...(isAdmin ? ['audit'] : [])].map((k) => (
          <button key={k} onClick={() => setTab(k)} style={{ ...T.tab, ...(tab === k ? T.tabOn : {}) }}>
            {k === 'overview' ? 'Overview' : k === 'reports' ? 'Reports' : k === 'users' ? 'Users' : 'Audit log'}
            {k === 'reports' && overview?.openReports > 0 && <span style={T.count}>{overview.openReports}</span>}
          </button>
        ))}
      </div>

      {/* OVERVIEW */}
      {tab === 'overview' && (
        <div style={T.cards}>
          <Card label="Open reports" value={overview?.openReports ?? '—'} accent="#b42318" />
          <Card label="Reports today" value={overview?.reportsToday ?? '—'} accent="#0ea5e9" />
          <Card label="Total users" value={overview?.totalUsers ?? '—'} accent="#16a34a" />
        </div>
      )}

      {/* REPORTS QUEUE */}
      {tab === 'reports' && (
        <div className={s.tableCard}>
          {busy && reports.length === 0 ? (
            <div className={s.loadingOverlay}><div className={s.spinner} />Loading reports…</div>
          ) : reports.length === 0 ? (
            <div style={{ padding: 24, color: '#667085' }}>🎉 No open reports. The queue is clear.</div>
          ) : (
            <div style={{ display: 'grid', gap: 12, padding: 12 }}>
              {reports.map((r) => (
                <div key={r.id} style={T.report}>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, alignItems: 'center' }}>
                    <span style={T.typeBadge}>{r.contentType || 'USER'}{r.contentType !== 'USER' ? ` #${r.contentId}` : ''}</span>
                    {r.reportCount > 1 && <span style={T.warnBadge}>⚠️ {r.reportCount} reports</span>}
                    <span style={{ ...T.status, ...(r.status === 'OPEN' ? T.statusOpen : {}) }}>{r.status}</span>
                    {r.targetActive === false && <span style={T.banned}>SUSPENDED</span>}
                    <span style={{ marginLeft: 'auto', color: '#667085', fontSize: 13 }}>{fmt(r.createdAt)}</span>
                  </div>
                  <div style={{ marginTop: 8, fontSize: 14 }}>
                    <strong>{r.reporterName || 'Someone'}</strong> reported <strong>{r.targetName || 'a user'}</strong>
                  </div>
                  <div style={T.reason}>“{r.reason}”</div>
                  <div style={T.rowActions}>
                    {r.status === 'OPEN' && <button style={T.btn} disabled={busy} onClick={() => onMarkReviewed(r)}>Mark reviewed</button>}
                    {r.contentType && r.contentType !== 'USER' && (
                      <button style={T.btnDanger} disabled={busy} onClick={() => onRemove(r)}>Remove content</button>
                    )}
                    <button style={T.btn} disabled={busy} onClick={() => onWarn(r.targetId)}>Warn user</button>
                    {r.targetActive === false
                      ? <button style={T.btn} disabled={busy} onClick={() => onUnsuspend(r.targetId)}>Reinstate user</button>
                      : <button style={T.btnDanger} disabled={busy} onClick={() => onSuspend(r.targetId)}>Suspend user</button>}
                    <button style={T.btnGhost} disabled={busy} onClick={() => onClose(r)}>Dismiss</button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* USERS */}
      {tab === 'users' && (
        <>
          <div className={s.searchBar}>
            <input className={s.searchInput} value={query} onChange={(e) => setQuery(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && loadUsers(query)} placeholder="Search name or email…" />
            <button className={s.searchBtn} disabled={busy} onClick={() => loadUsers(query)}>Search</button>
          </div>
          <div className={s.tableCard}>
            <div className={s.tableScroll}>
              <table className={s.table}>
                <thead><tr><th>ID</th><th>Name</th><th>Email</th><th>Role</th><th>Status</th><th>Actions</th></tr></thead>
                <tbody>
                  {(users?.content ?? []).map((u) => (
                    <tr key={u.id}>
                      <td data-label="ID">{u.id}</td>
                      <td data-label="Name">{u.name || '—'}</td>
                      <td data-label="Email">{u.email}</td>
                      <td data-label="Role"><span className={`${s.badge} ${ROLE_BADGE[u.role] || s.badgeUser}`}>{ROLE_LABEL[u.role] || u.role}</span></td>
                      <td data-label="Status"><span className={`${s.badge} ${u.active ? s.badgeActive : s.badgeDisabled}`}>{u.active ? 'Active' : 'Suspended'}</span></td>
                      <td data-label="Actions">
                        <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                          <button style={T.btn} disabled={busy} onClick={() => onWarn(u.id)}>Warn</button>
                          {u.active
                            ? <button style={T.btnDanger} disabled={busy || u.role === 'ADMIN'} onClick={() => onSuspend(u.id)}>Suspend</button>
                            : <button style={T.btn} disabled={busy} onClick={() => onUnsuspend(u.id)}>Reinstate</button>}
                        </div>
                      </td>
                    </tr>
                  ))}
                  {(users?.content ?? []).length === 0 && !busy && (
                    <tr className={s.emptyRow}><td colSpan={6}>No users found</td></tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}

      {/* AUDIT (admin only) */}
      {tab === 'audit' && isAdmin && (
        <div className={s.tableCard}>
          <div className={s.tableScroll}>
            <table className={s.table}>
              <thead><tr><th>When</th><th>Who</th><th>Action</th><th>Target</th><th>Detail</th></tr></thead>
              <tbody>
                {(audit?.content ?? []).map((a) => (
                  <tr key={a.id}>
                    <td data-label="When">{fmt(a.createdAt)}</td>
                    <td data-label="Who">{a.actorName || '—'}</td>
                    <td data-label="Action"><span style={T.typeBadge}>{a.action}</span></td>
                    <td data-label="Target">{a.targetType ? `${a.targetType} #${a.targetId ?? ''}` : '—'}</td>
                    <td data-label="Detail">{a.detail || '—'}</td>
                  </tr>
                ))}
                {(audit?.content ?? []).length === 0 && !busy && (
                  <tr className={s.emptyRow}><td colSpan={5}>No actions logged yet</td></tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}

function Card({ label, value, accent }) {
  return (
    <div style={{ ...T.card, borderTop: `3px solid ${accent}` }}>
      <div style={{ fontSize: 30, fontWeight: 800 }}>{value}</div>
      <div style={{ color: '#667085', fontSize: 14 }}>{label}</div>
    </div>
  );
}

const T = {
  tabs: { display: 'flex', gap: 6, flexWrap: 'wrap', margin: '8px 0 16px' },
  tab: { appearance: 'none', border: '1px solid #e6e8ee', background: '#fff', color: '#475467', borderRadius: 999, padding: '8px 14px', fontSize: 14, cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: 6 },
  tabOn: { background: '#0ea5e9', color: '#fff', borderColor: '#0ea5e9' },
  count: { background: '#b42318', color: '#fff', borderRadius: 999, padding: '0 7px', fontSize: 12, fontWeight: 700 },
  cards: { display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(160px,1fr))', gap: 14 },
  card: { background: '#fff', border: '1px solid #e6e8ee', borderRadius: 14, padding: 18 },
  report: { border: '1px solid #e6e8ee', borderRadius: 12, padding: 14, background: '#fff' },
  typeBadge: { background: '#eef2ff', color: '#3730a3', borderRadius: 8, padding: '2px 8px', fontSize: 12, fontWeight: 700 },
  warnBadge: { background: '#fef3c7', color: '#92400e', borderRadius: 8, padding: '2px 8px', fontSize: 12, fontWeight: 700 },
  status: { background: '#f1f5f9', color: '#475467', borderRadius: 8, padding: '2px 8px', fontSize: 12, fontWeight: 700 },
  statusOpen: { background: '#dcfce7', color: '#166534' },
  banned: { background: '#fee2e2', color: '#b42318', borderRadius: 8, padding: '2px 8px', fontSize: 12, fontWeight: 700 },
  reason: { marginTop: 6, color: '#0b1324', fontSize: 14, fontStyle: 'italic' },
  rowActions: { display: 'flex', gap: 8, flexWrap: 'wrap', marginTop: 12 },
  btn: { appearance: 'none', border: '1px solid #e6e8ee', background: '#f8fafc', color: '#0b1324', borderRadius: 8, padding: '7px 12px', fontSize: 13, cursor: 'pointer' },
  btnGhost: { appearance: 'none', border: '1px solid #e6e8ee', background: '#fff', color: '#667085', borderRadius: 8, padding: '7px 12px', fontSize: 13, cursor: 'pointer' },
  btnDanger: { appearance: 'none', border: 0, background: '#b42318', color: '#fff', borderRadius: 8, padding: '7px 12px', fontSize: 13, fontWeight: 600, cursor: 'pointer' },
};
