import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../../api/axiosInstance';
import { toast } from 'react-toastify';

// Detailed view of a rental listing. Shows all fields returned
// by the backend including the images array. If the rental
// cannot be loaded a message is shown instead.
const RentalDetails = () => {
  const { id } = useParams();
  const [rental, setRental] = useState(null);
  const navigate = useNavigate();
  const [selectedSuggestion, setSelectedSuggestion] = useState('');

  useEffect(() => {
    fetchRental();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  const fetchRental = async () => {
    try {
      const { data } = await api.get(`/rentals/${id}`);
      setRental(data);
    } catch {
      toast.error('Failed to load rental');
    }
  };

  if (!rental) {
    return <div>Loading rental...</div>;
  }

  return (
    <div>
      <h2>{rental.title}</h2>
      <p>{rental.description}</p>
      <p>Location: {rental.location}</p>
      <p>Price: £{rental.price}</p>
      {rental.roomType && <p>Room type: {rental.roomType}</p>}
      {rental.images && rental.images.length > 0 && (
        <div className="image-gallery">
          {rental.images.map((url, idx) => (
            <img key={idx} src={url} alt={`Rental ${idx}`} className="rental-image" />
          ))}
        </div>
      )}

      {/* Suggestions for quick messaging */}
      <div style={{ marginTop: 20 }}>
        <h4>Quick questions</h4>
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
          {['I am interested', 'Is this available?', 'Can I schedule a viewing?'].map((msg) => (
            <button
              key={msg}
              className="btn"
              onClick={() => {
                setSelectedSuggestion(msg);
                navigate('/messages', {
                  state: {
                    selectedUserId: rental.ownerId,
                    selectedUserName: rental.ownerName,
                    prefillMessage: msg,
                  },
                });
              }}
            >
              {msg}
            </button>
          ))}
        </div>
      </div>

      {/* Contact owner */}
      {rental.ownerId && (
        <div style={{ marginTop: 20 }}>
          <button
            className="btn"
            onClick={() =>
              navigate('/messages', {
                state: { selectedUserId: rental.ownerId, selectedUserName: rental.ownerName },
              })
            }
          >
            💬 Contact Owner
          </button>
          <button
            className="btn"
            style={{ marginLeft: 8 }}
            onClick={() => navigate(`/profile/${rental.ownerId}`)}
          >
            View Profile
          </button>
        </div>
      )}
    </div>
  );
};

export default RentalDetails;