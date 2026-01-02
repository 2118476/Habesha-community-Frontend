import React, { useState, useEffect } from 'react';
import api from '../../api/axiosInstance';
import { toast } from 'react-toastify';
import { CardGridLoader } from '../../components/ui/SectionLoader/SectionLoader';

/**
 * MyAdsManager fetches and displays the authenticated user's
 * classified advertisements. Basic controls for editing or
 * unpublishing are stubbed out as this iteration focuses on
 * information architecture rather than CRUD flows.
 */
const MyAdsManager = () => {
  const [ads, setAds] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      try {
        const { data } = await api.get('/api/my/ads');
        setAds(Array.isArray(data) ? data : []);
      } catch (err) {
        toast.error('Failed to load your ads');
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  return (
    <div>
      <h2>My Ads</h2>
      {loading ? (
        <CardGridLoader count={4} />
      ) : ads.length === 0 ? (
        <p>You have not posted any ads yet.</p>
      ) : (
        <ul>
          {ads.map((ad) => (
            <li key={ad.id} style={{ marginBottom: '1rem' }}>
              <strong>{ad.title}</strong> – {ad.category}
              <div>
                <button disabled>Edit</button>
                <button disabled>Unpublish</button>
                <button disabled>Delete</button>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
};

export default MyAdsManager;