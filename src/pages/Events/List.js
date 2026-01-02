import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import api from '../../api/axiosInstance';
import { toast } from 'react-toastify';
import EntityCard from '../../components/common/EntityCard';
import styles from '../../stylus/sections/Events.module.scss';
import buttonStyles from '../../stylus/components/Button.module.scss';

/**
 * Browse community events.  Implements pagination and uses the
 * enterprise‑grade API returning enriched DTOs.  Each card is
 * clickable and shows organiser information.
 */
const EventsList = () => {
  const { t } = useTranslation();
  const [events, setEvents] = useState([]);
  const [page, setPage] = useState(0);
  const size = 6;
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetchEvents(page);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page]);

  const fetchEvents = async (p) => {
    setLoading(true);
    try {
      const { data } = await api.get(`/api/events?page=${p}&size=${size}`);
      setEvents(Array.isArray(data) ? data : []);
    } catch {
      toast.error('Failed to load events');
    } finally {
      setLoading(false);
    }
  };

  const nextPage = () => {
    if (events.length === size) {
      setPage((prev) => prev + 1);
    }
  };

  const prevPage = () => {
    setPage((prev) => Math.max(prev - 1, 0));
  };

  return (
    <div className={styles.container}>
      <h2>{t('pages.communityEvents')}</h2>
      <div>
        <button
          className={`${buttonStyles.btn} ${buttonStyles.primary}`}
          onClick={() => (window.location.href = '/app/events/post')}
        >
          Post Event
        </button>
      </div>
      {loading ? (
        <p>{t('pages.loadingEvents')}</p>
      ) : (
        <>
          {events.length === 0 ? (
            <p>{t('pages.noEventsYet')}</p>
          ) : (
            <div className={styles.list}>
              {events.map((event) => (
                <EntityCard key={event.id} item={event} type="events" />
              ))}
            </div>
          )}
          <div className={styles.pagination}>
            <button
              onClick={prevPage}
              disabled={page === 0}
              className={buttonStyles.btn}
            >
              Previous
            </button>
            <span>{t('pages.page')} {page + 1}</span>
            <button
              onClick={nextPage}
              disabled={events.length < size}
              className={buttonStyles.btn}
            >
              Next
            </button>
          </div>
        </>
      )}
    </div>
  );
};

export default EventsList;