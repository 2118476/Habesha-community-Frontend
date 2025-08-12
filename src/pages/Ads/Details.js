import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../../api/axiosInstance';
import { toast } from 'react-toastify';

// Detailed view for a classified ad.  Looks up the ad by id by
// fetching the list of ads from the backend and finding the
// matching entry.  Exposes a contact button which navigates
// to the messages page preselecting the seller and a profile
// button to view their profile.  All fields are displayed
// verbatim from the backend.
const AdDetails = () => {
  const { id } = useParams();
  const [ad, setAd] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    fetchAd();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  const fetchAd = async () => {
    try {
      const { data } = await api.get('/ads');
      if (Array.isArray(data)) {
        const found = data.find((a) => String(a.id) === String(id));
        setAd(found || null);
      } else {
        setAd(null);
      }
    } catch {
      toast.error('Failed to load ad');
    }
  };

  if (!ad) return <div>Loading ad...</div>;

  return (
    <div>
      <h2>{ad.title}</h2>
      <p>{ad.description}</p>
      {ad.price !== undefined && <p>Price: £{ad.price}</p>}
      <p>Category: {ad.category}</p>
      {ad.createdAt && <p>Posted at: {new Date(ad.createdAt).toLocaleString()}</p>}

      {/* Contact actions */}
      {ad.posterId && (
        <div style={{ marginTop: 20 }}>
          <button
            className="btn"
            onClick={() =>
              navigate('/messages', {
                state: { selectedUserId: ad.posterId, selectedUserName: ad.posterName },
              })
            }
          >
            💬 Contact Seller
          </button>
          <button
            className="btn"
            style={{ marginLeft: 8 }}
            onClick={() => navigate(`/profile/${ad.posterId}`)}
          >
            View Profile
          </button>
        </div>
      )}
    </div>
  );
};

export default AdDetails;