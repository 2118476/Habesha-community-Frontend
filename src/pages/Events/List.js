import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import api from '../../api/axiosInstance';
import { toast } from 'react-toastify';

// Browse public events. Featured events are visually highlighted.
const EventsList = () => {
  const [events, setEvents] = useState([]);

  useEffect(() => {
    fetchEvents();
  }, []);

  const fetchEvents = async () => {
    try {
      const { data } = await api.get('/events');
      setEvents(Array.isArray(data) ? data : []);
    } catch {
      toast.error('Failed to load events');
    }
  };

  return (
    <div>
      <h2>Community Events</h2>
      <Link to="/events/post" className="btn-primary">Post Event</Link>
      <ul>
        {events.map((event) => (
          <li key={event.id} className={event.featured ? 'event-card featured' : 'event-card'}>
            <Link to={`/events/${event.id}`} style={{ textDecoration: 'none', color: 'inherit' }}>
              <h3>{event.title}</h3>
              <p>{event.date} — {event.location}</p>
              <p>{(event.description || '').slice(0, 120)}{event.description && event.description.length > 120 ? '…' : ''}</p>
              {event.featured && <strong>Featured</strong>}
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
};

export default EventsList;