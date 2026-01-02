// src/pages/Events/Details.js
import React, { useEffect, useState } from 'react';
import useAuth from '../../hooks/useAuth';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../../api/axiosInstance';
import { toast } from 'react-toastify';
import styles from '../../stylus/sections/Events.module.scss';
import buttonStyles from '../../stylus/components/Button.module.scss';
import EntityMetaBar from '../../components/EntityMetaBar.jsx';
import ContactButton from '../../components/ContactButton.jsx';
import { PageLoader } from '../../components/ui/PageLoader/PageLoader';

export default function EventDetails() {
  const { user } = useAuth();
  const { id } = useParams();
  const navigate = useNavigate();
  const [eventItem, setEventItem] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        const { data } = await api.get(`/api/events/${id}`);
        setEventItem(data || null);
      } catch (e) {
        console.error(e);
        toast.error('Failed to load event');
        setEventItem(null);
      } finally {
        setLoading(false);
      }
    })();
  }, [id]);

  if (loading) return (
    <div className="page">
      <PageLoader message="Loading event..." />
    </div>
  );
  if (!eventItem) return <div className="page">Not found</div>;

  const poster =
    eventItem.postedBy ||
    eventItem.organizer ||
    eventItem.author ||
    eventItem.owner ||
    eventItem.user ||
    null;

  const posterId =
    poster?.id ??
    eventItem.organizerId ??
    eventItem.ownerId ??
    eventItem.userId ??
    null;

  const isOwner =
    user?.id != null && posterId != null && String(user.id) === String(posterId);

  const viewOrganizer = () => {
    if (!posterId) return toast.error('Organizer profile unavailable.');
    // ✅ ID-based route, same as HomeSwap
    navigate(`/app/profile/${posterId}`);
  };

  return (
    <div className={`page ${styles.container}`}>
      <h1 style={{ color: 'var(--on-surface-1)' }}>{eventItem.title}</h1>

      <EntityMetaBar
        postedBy={poster || undefined}
        createdAt={eventItem.createdAt}
        context={{ type: 'event', id: String(eventItem.id ?? id) }}
      />

      {eventItem.date && <p style={{ color: 'var(--on-surface-1)' }}>Date: {String(eventItem.date)}</p>}
      {eventItem.location && <p style={{ color: 'var(--on-surface-1)' }}>Location: {eventItem.location}</p>}
      {eventItem.description && <p style={{ color: 'var(--on-surface-1)' }}>{eventItem.description}</p>}

      <div className={styles.actions}>
        {!isOwner && posterId && (
          <ContactButton
            toUserId={posterId}
            context={{ type: 'event', id: String(eventItem.id ?? id) }}
            className={buttonStyles.btn}
          >
            Message organiser
          </ContactButton>
        )}

        {isOwner && (
          <button
            className={buttonStyles.btn}
            onClick={() => navigate(`/app/events/${eventItem.id}/edit`)}
          >
            Edit
          </button>
        )}

        <button
          className={buttonStyles.btn}
          onClick={viewOrganizer}
          disabled={!posterId}
        >
          View Organizer
        </button>
      </div>
    </div>
  );
}
