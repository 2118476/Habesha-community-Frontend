import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import api from '../../api/axiosInstance';
import { toast } from 'react-toastify';

// Browse classified ads. Featured ads are highlighted. Users can
// create new ads via the Post Ad page.
const AdsList = () => {
  const [ads, setAds] = useState([]);

  useEffect(() => {
    fetchAds();
  }, []);

  const fetchAds = async () => {
    try {
      const { data } = await api.get('/ads');
      console.log('Fetched ads:', data); // ✅ Debug: log raw response
      setAds(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error('Failed to load ads:', error); // ✅ Debug actual error
      toast.error('Failed to load ads');
    }
  };

  return (
    <div>
      <h2>Classified Ads</h2>
      <Link to="/ads/post" className="btn-primary">Post Ad</Link>

      {ads.length === 0 ? (
        <p>No ads available.</p>
      ) : (
        <ul>
        {ads.map((ad) => (
            <li key={ad.id} className={ad.featured ? 'ad-card featured' : 'ad-card'}>
              <Link to={`/ads/${ad.id}`} style={{ textDecoration: 'none', color: 'inherit' }}>
                <h3>{ad.title || 'Untitled'}</h3>
                <p>{(ad.description || '').slice(0, 120)}{ad.description && ad.description.length > 120 ? '…' : ''}</p>
                {ad.price !== undefined && <p>Price: £{ad.price}</p>}
                {ad.featured && <strong>Featured</strong>}
                <p><small>Category: {ad.category || 'N/A'}</small></p>
                <p><small>Posted at: {new Date(ad.createdAt).toLocaleString()}</small></p>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
};

export default AdsList;
