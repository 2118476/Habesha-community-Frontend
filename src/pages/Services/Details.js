import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../../api/axiosInstance';
import { toast } from 'react-toastify';

// Detailed view of a service. Displays all attributes and
// includes a button to book the service, which initiates a
// payment flow via Stripe. The backend should return a sessionId
// for Stripe checkout when posting to /services/{id}/book.
const ServiceDetails = () => {
  const { id } = useParams();
  const [service, setService] = useState(null);
  const [booking, setBooking] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    fetchService();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  // Fetch service details from the backend. The service API does not
  // expose a dedicated GET /services/{id} endpoint, so we retrieve
  // the list of services and locate the one with the matching id.
  const fetchService = async () => {
    try {
      const { data } = await api.get('/services');
      if (Array.isArray(data)) {
        const found = data.find((srv) => String(srv.id) === String(id));
        setService(found || null);
      } else {
        setService(null);
      }
    } catch {
      toast.error('Failed to load service');
    }
  };

  const handleBook = async () => {
    setBooking(true);
    try {
      // Book the service. The backend returns the created ServiceBooking
      // object and does not initiate a Stripe checkout. Simply show
      // a success message upon completion.
      await api.post(`/services/${id}/book`);
      toast.success('Service booked successfully');
    } catch {
      toast.error('Failed to book service');
    } finally {
      setBooking(false);
    }
  };

  if (!service) return <div>Loading service...</div>;

  return (
    <div>
      <h2>{service.title}</h2>
      <p>{service.description}</p>
      <p>Estimated time: {service.estimatedTime}</p>
      <p>Price: £{service.basePrice}</p>
      <p>Location: {service.location}</p>
      <p>Mode: {service.mode}</p>
      <button onClick={handleBook} disabled={booking} className="btn-primary">
        {booking ? 'Processing...' : 'Book Service'}
      </button>

      {/* Contact & profile actions */}
      {service.providerId && (
        <div style={{ marginTop: 20 }}>
          <button
            className="btn"
            onClick={() =>
              navigate('/messages', {
                state: { selectedUserId: service.providerId, selectedUserName: service.providerName },
              })
            }
          >
            💬 Contact Provider
          </button>
          <button
            className="btn"
            style={{ marginLeft: 8 }}
            onClick={() => navigate(`/profile/${service.providerId}`)}
          >
            View Profile
          </button>
        </div>
      )}
    </div>
  );
};

export default ServiceDetails;