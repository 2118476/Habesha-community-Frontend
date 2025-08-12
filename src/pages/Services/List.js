import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import api from '../../api/axiosInstance';
import { toast } from 'react-toastify';

// Browse available services. Users can search by category and
// navigate to details or post a new service if they are a
// provider. Admin users also have a separate page to manage
// services.
const ServicesList = () => {
  const [services, setServices] = useState([]);
  const [category, setCategory] = useState('');

  useEffect(() => {
    fetchServices();
  }, []);

  const fetchServices = async () => {
    try {
      const url = `/services${category ? '?category=' + encodeURIComponent(category) : ''}`;
      const { data } = await api.get(url);
      setServices(Array.isArray(data) ? data : []);
    } catch {
      toast.error('Failed to load services');
    }
  };

  return (
    <div>
      <h2>Service Marketplace</h2>
      <div className="search-filters">
        <input value={category} onChange={(e) => setCategory(e.target.value)} placeholder="Category" />
        <button onClick={fetchServices}>Search</button>
        <Link to="/services/post" className="btn-primary">Post Service</Link>
      </div>
      <ul>
        {services.map((service) => (
          <li key={service.id} className="service-card">
            <Link to={`/services/${service.id}`}>{service.title}</Link> — {service.location} — £{service.basePrice}
          </li>
        ))}
      </ul>
    </div>
  );
};

export default ServicesList;