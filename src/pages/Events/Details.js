import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../../api/axiosInstance';
import { toast } from 'react-toastify';

// Detailed view for an event.  Fetches the list of events and
// selects the one matching the route param.  Displays all
// information including optional image.  Provides actions to
// message the organiser and view their profile.
const EventDetails = () => {
  const { id } = useParams();
  const [event, setEvent] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    fetchEvent();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  const fetchEvent = async () => {
    try {
      const { data } = await api.get('/events');
      if (Array.isArray(data)) {
        const found = data.find((e) => String(e.id) === String(id));
        setEvent(found || null);
      } else {
        setEvent(null);
      }
    } catch {
      toast.error('Failed to load event');
    }
  };

  if (!event) return <div>Loading event...</div>;

  return (
    <div>
      <h2>{event.title}</h2>
      {event.date && <p>Date: {event.date}</p>}
      {event.location && <p>Location: {event.location}</p>}
      <p>{event.description}</p>
      {event.imageUrl && (
        <div style={{ marginTop: 12 }}>
          <img src={event.imageUrl} alt={event.title} style={{ maxWidth: '100%' }} />
        </div>
      )}

      {/* Contact actions */}
      {event.organizerId && (
        <div style={{ marginTop: 20 }}>
          <button
            className="btn"
            onClick={() =>
              navigate('/messages', {
                state: { selectedUserId: event.organizerId, selectedUserName: event.organizerName },
              })
            }
          >
            💬 Contact Organiser
          </button>
          <button
            className="btn"
            style={{ marginLeft: 8 }}
            onClick={() => navigate(`/profile/${event.organizerId}`)}
          >
            View Profile
          </button>
        </div>
      )}
    </div>
  );
};

export default EventDetails;