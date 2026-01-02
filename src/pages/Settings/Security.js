// src/pages/Settings/Security.js
import React, { useEffect, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import api from "../../api/axiosInstance";
import styles from "../../stylus/sections/Settings.module.scss";
import { InlineSpinner } from "../../components/ui/Spinner/Spinner";
import { TableLoader } from "../../components/ui/SectionLoader/SectionLoader";

export default function SecuritySettings() {
  const { t } = useTranslation();
  const [pw, setPw] = useState({ current: "", next: "", confirm: "" });
  const [showPw, setShowPw] = useState(false);

  const [busyPw, setBusyPw] = useState(false);
  const [msg, setMsg] = useState("");          // generic status text
  const [, setMsgKind] = useState("");  // "success" | "error" | ""

  const [sessions, setSessions] = useState([]);
  const [loadingSessions, setLoadingSessions] = useState(false);
  const [revokingId, setRevokingId] = useState(null);
  const [revokingAll, setRevokingAll] = useState(false);

  const formatTs = (ts) => {
    if (!ts) return "—";
    try {
      const d = new Date(ts);
      return d.toLocaleString();
    } catch { return String(ts); }
  };

  const strength = useMemo(() => {
    const v = pw.next || "";
    const score =
      (v.length >= 8 ? 1 : 0) +
      (/[A-Z]/.test(v) ? 1 : 0) +
      (/[a-z]/.test(v) ? 1 : 0) +
      (/\d/.test(v) ? 1 : 0) +
      (/[^A-Za-z0-9]/.test(v) ? 1 : 0);
    if (v.length === 0) return { label: "", ok: false };
    if (score >= 4) return { label: t('settings.security.passwordStrengthStrong'), ok: true };
    if (score >= 3) return { label: t('settings.security.passwordStrengthMedium'), ok: v.length >= 10 };
    return { label: t('settings.security.passwordStrengthWeak'), ok: false };
  }, [pw.next, t]);

  const loadSessions = async () => {
    setLoadingSessions(true);
    try {
      const { data } = await api.get("/api/users/me/sessions");
      setSessions(Array.isArray(data) ? data : []);
    } catch {
      setSessions([]);
    } finally {
      setLoadingSessions(false);
    }
  };

  useEffect(() => { loadSessions(); }, []);

  const resetStatus = () => { setMsg(""); setMsgKind(""); };

  const changePassword = async (e) => {
    e.preventDefault();
    resetStatus();

    if (!pw.current) { setMsg(t('settings.security.enterCurrentPassword')); setMsgKind("error"); return; }
    if (pw.next.length < 8) { setMsg(t('settings.security.passwordTooShort')); setMsgKind("error"); return; }
    if (pw.next !== pw.confirm) { setMsg(t('settings.security.passwordsDoNotMatch')); setMsgKind("error"); return; }
    if (!strength.ok) { setMsg(t('settings.security.passwordTooWeak')); setMsgKind("error"); return; }

    try {
      setBusyPw(true);
      await api.post("/api/users/me/password", {
        currentPassword: pw.current,
        newPassword: pw.next,
      });
      setMsg(t('settings.security.passwordUpdated'));
      setMsgKind("success");
      setPw({ current: "", next: "", confirm: "" });
    } catch (err) {
      const code = err?.response?.status;
      if (code === 400) {
        setMsg(t('settings.security.currentPasswordIncorrect'));
      } else {
        setMsg(t('settings.security.passwordUpdateFailed'));
      }
      setMsgKind("error");
    } finally {
      setBusyPw(false);
    }
  };

  const signOut = async (id) => {
    resetStatus();
    setRevokingId(id);
    try {
      await api.delete(`/api/users/me/sessions/${id}`);
      await loadSessions();
      setMsg(t('settings.security.sessionSignedOut'));
      setMsgKind("success");
    } catch {
      setMsg(t('settings.security.sessionSignOutFailed'));
      setMsgKind("error");
    } finally {
      setRevokingId(null);
    }
  };

  const signOutAll = async () => {
    if (!window.confirm(t('settings.security.confirmSignOutAllSessions'))) return;
    resetStatus();
    setRevokingAll(true);
    try {
      await api.delete(`/api/users/me/sessions`);
      await loadSessions();
      setMsg(t('settings.security.allSessionsSignedOut'));
      setMsgKind("success");
    } catch {
      setMsg(t('settings.security.allSessionsSignOutFailed'));
      setMsgKind("error");
    } finally {
      setRevokingAll(false);
    }
  };

  const sessionRows = useMemo(() => {
    return (sessions || []).slice().sort((a, b) => {
      const ta = new Date(a.lastSeen || 0).getTime();
      const tb = new Date(b.lastSeen || 0).getTime();
      return tb - ta;
    });
  }, [sessions]);

  return (
    <div className={styles.page}>
      <h1 className={styles.title}>{t('settings.security.title')}</h1>

      {/* Change password */}
      <section className={styles.panel}>
        <h2>{t('settings.changePassword')}</h2>
        <form onSubmit={changePassword} className={styles.formGrid}>
          <label htmlFor="pw-current">{t('settings.currentPassword')}</label>
          <input
            id="pw-current"
            type={showPw ? "text" : "password"}
            value={pw.current}
            onChange={(e) => setPw({ ...pw, current: e.target.value })}
            autoComplete="current-password"
          />

          <label htmlFor="pw-new">{t('settings.newPassword')}</label>
          <input
            id="pw-new"
            type={showPw ? "text" : "password"}
            value={pw.next}
            onChange={(e) => setPw({ ...pw, next: e.target.value })}
            autoComplete="new-password"
            aria-describedby="pw-strength"
          />
          <div id="pw-strength" className={styles.help}>
            {pw.next ? `${t('common.strength')}: ${strength.label}` : t('settings.security.passwordStrengthHelp')}
          </div>

          <label htmlFor="pw-confirm">{t('settings.confirmNewPassword')}</label>
          <input
            id="pw-confirm"
            type={showPw ? "text" : "password"}
            value={pw.confirm}
            onChange={(e) => setPw({ ...pw, confirm: e.target.value })}
            autoComplete="new-password"
          />

          <label className={styles.switch} style={{ marginTop: 4 }}>
            <input
              type="checkbox"
              checked={showPw}
              onChange={(e) => setShowPw(e.target.checked)}
            />
            <span>{t('settings.showPasswords')}</span>
          </label>

          <div className={styles.rowRight}>
            <button className={styles.btnPrimary} disabled={busyPw}>
              {busyPw ? t('settings.security.updating') : t('settings.security.updatePassword')}
            </button>
          </div>
        </form>

        {msg && (
          <p
            className={styles.help}
            role="status"
            aria-live="polite"
            aria-atomic="true"
            style={{ marginTop: 8 }}
          >
            {msg}
          </p>
        )}
      </section>

      {/* Sessions */}
      <section className={styles.panel}>
        <h2>{t('settings.activeSessions')}</h2>
        <div className={styles.rowRight} style={{ marginBottom: 8 }}>
          <button
            className={styles.btnSecondary}
            onClick={loadSessions}
            disabled={loadingSessions}
            title={t('settings.security.refresh')}
          >
            {loadingSessions ? (
              <>
                <InlineSpinner size="xs" color="muted" />
                {t('settings.security.refreshing')}
              </>
            ) : (
              t('settings.security.refresh')
            )}
          </button>
        </div>

        <div className={styles.table} role="table" aria-label={t('settings.security.activeSessions')}>
          <div className={styles.th} role="columnheader">{t('settings.security.device')}</div>
          <div className={styles.th} role="columnheader">{t('settings.security.ipAddress')}</div>
          <div className={styles.th} role="columnheader">{t('settings.security.lastActive')}</div>
          <div className={styles.th} role="columnheader">{t('settings.contactRequests.actions')}</div>

          {loadingSessions && (
            <TableLoader rows={3} columns={4} />
          )}

          {!loadingSessions && sessionRows.length === 0 && (
            <div className={styles.tr} role="row">
              <div role="cell" className={styles.help}>{t('settings.security.noActiveSessions')}</div>
              <div role="cell">—</div>
              <div role="cell">—</div>
              <div role="cell">—</div>
            </div>
          )}

          {sessionRows.map((s) => {
            const isBusy = revokingId === s.id;
            return (
              <div key={s.id} className={styles.tr} role="row">
                <div role="cell">
                  {s.device || t('messages.unknown')}
                  {s.current ? t('settings.security.thisDevice') : ""}
                </div>
                <div role="cell">{s.ip || "—"}</div>
                <div role="cell">{formatTs(s.lastSeen)}</div>
                <div role="cell">
                  <button
                    className={styles.btnSecondary}
                    onClick={() => signOut(s.id)}
                    disabled={isBusy}
                    title={t('settings.security.signOutThisSession')}
                  >
                    {isBusy ? t('settings.security.signingOut') : t('settings.security.signOut')}
                  </button>
                </div>
              </div>
            );
          })}
        </div>

        <div className={styles.rowRight} style={{ marginTop: 12 }}>
          <button
            className={styles.btnDanger}
            onClick={signOutAll}
            disabled={revokingAll}
            title={t('settings.security.signOutAllOtherSessions')}
          >
            {revokingAll ? t('settings.security.signingOut') : t('settings.security.signOutAllOtherSessions')}
          </button>
        </div>
      </section>
    </div>
  );
}