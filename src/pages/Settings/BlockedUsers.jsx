// src/pages/Settings/BlockedUsers.jsx
import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import api from "../../api/axiosInstance";
import styles from "../../stylus/sections/Settings.module.scss";
import Avatar from "../../components/Avatar";
import { enterpriseToast } from "../../components/ToastExports";
import { ListLoader } from "../../components/ui/SectionLoader/SectionLoader";
import { getProfileLink } from "../../utils/profileLinks";

export default function BlockedUsers() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [blocks, setBlocks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [unblocking, setUnblocking] = useState(null);

  const loadBlocks = async () => {
    setLoading(true);
    try {
      const { data } = await api.get("/api/users/me/blocks");
      setBlocks(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error("Failed to load blocked users:", err);
      enterpriseToast.error(t('settings.blocked.failedToLoadBlockedUsers'));
      setBlocks([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadBlocks();
  }, []);

  const handleUnblock = async (blockId, username) => {
    const ok = window.confirm(t('settings.blocked.confirmUnblock', { username }));
    if (!ok) return;

    setUnblocking(blockId);
    try {
      await api.delete(`/api/users/me/blocks/${blockId}`);
      enterpriseToast.success(t('settings.blocked.userUnblockedSuccessfully'));
      await loadBlocks();
    } catch (err) {
      console.error("Failed to unblock user:", err);
      enterpriseToast.error(t('settings.blocked.failedToUnblockUser'));
    } finally {
      setUnblocking(null);
    }
  };

  const handleViewProfile = (userId, username) => {
    const link = getProfileLink({ id: userId, username });
    if (link) {
      navigate(link);
    }
  };

  const formatDate = (dateStr) => {
    if (!dateStr) return "—";
    try {
      return new Date(dateStr).toLocaleDateString();
    } catch {
      return "—";
    }
  };

  return (
    <div className={styles.page}>
      <h1 className={styles.title}>{t('settings.blocked.title')}</h1>

      <section className={styles.panel}>
        <div className={styles.panelHeader}>
          <p className={styles.help}>
            {t('settings.blocked.blockedUsersHelp')}
          </p>
        </div>

        {loading && (
          <ListLoader count={3} showAvatar={true} />
        )}

        {!loading && blocks.length === 0 && (
          <div className={styles.empty}>
            <p>{t('settings.blocked.noBlockedUsers')}</p>
          </div>
        )}

        {!loading && blocks.length > 0 && (
          <div className={styles.table} role="table" aria-label={t('settings.blocked.title')}>
            <div className={styles.th} role="columnheader">{t('settings.contactRequests.user')}</div>
            <div className={styles.th} role="columnheader">{t('settings.blocked.blockedOn')}</div>
            <div className={styles.th} role="columnheader">{t('settings.blocked.actions')}</div>

            {blocks.map((block) => {
              const isUnblocking = unblocking === block.id;
              return (
                <div key={block.id} className={styles.tr} role="row">
                  <div role="cell" className={styles.userCell}>
                    <div className={styles.userMini}>
                      <Avatar
                        user={{
                          id: block.userId,
                          name: block.displayName || block.username,
                          avatarUrl: block.avatarUrl,
                        }}
                        src={block.avatarUrl}
                        size={40}
                        rounded
                      />
                      <div>
                        <div className={styles.primary}>
                          <button
                            className={styles.btnGhost}
                            onClick={() => handleViewProfile(block.userId, block.username)}
                            style={{ padding: 0, border: 'none', background: 'none', color: 'var(--primary, #2563eb)', cursor: 'pointer', textDecoration: 'none' }}
                            onMouseEnter={(e) => e.target.style.textDecoration = 'underline'}
                            onMouseLeave={(e) => e.target.style.textDecoration = 'none'}
                          >
                            {block.displayName || block.username || t('settings.blocked.unknownUser')}
                          </button>
                        </div>
                        {block.username && (
                          <div className={styles.secondary}>
                            @{block.username}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>

                  <div role="cell">{formatDate(block.blockedAt)}</div>

                  <div role="cell" className={styles.actions}>
                    <button
                      className={styles.btnDanger}
                      onClick={() => handleUnblock(block.id, block.username)}
                      disabled={isUnblocking}
                    >
                      {isUnblocking ? t('settings.blocked.unblocking') : t('settings.blocked.unblock')}
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </section>
    </div>
  );
}
