import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import api from '../../api/axiosInstance';
import { toast } from 'react-toastify';

// Browse rental listings. Users can filter by city. Each item
// links to its details page. A button allows users to post a
// new rental listing.
const RentalsList = () => {
  const [listings, setListings] = useState([]);
  const [city, setCity] = useState('');

  useEffect(() => {
    fetchListings();
  }, []);

  const fetchListings = async () => {
    try {
      const url = `/rentals${city ? '?city=' + encodeURIComponent(city) : ''}`;
      const { data } = await api.get(url);
      setListings(Array.isArray(data) ? data : []);
    } catch {
      toast.error('Failed to load rentals');
    }
  };

  return (
    <div>
      <h2>Housing & Rentals</h2>
      <div className="search-filters">
        <input value={city} onChange={(e) => setCity(e.target.value)} placeholder="City" />
        <button onClick={fetchListings}>Search</button>
        <Link to="/rentals/post" className="btn-primary">
          Post Listing
        </Link>
      </div>
      <ul>
        {listings.map((rental) => (
          <li key={rental.id} className="rental-card">
            <Link to={`/rentals/${rental.id}`}>{rental.title}</Link> — {rental.location} — £{rental.price}
            {rental.featured && <strong> Featured</strong>}
          </li>
        ))}
      </ul>
    </div>
  );
};

export default RentalsList;