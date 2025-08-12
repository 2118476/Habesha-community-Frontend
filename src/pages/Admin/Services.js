import React, { useState, useEffect } from 'react';
import api from '../../api/axiosInstance';
import { toast } from 'react-toastify';

// Admin view for services. Lists all services and allows
// administrators to remove inappropriate listings. Data is fetched
// from /admin/services and deletion uses the generic /services/{id}
// endpoint.
const AdminServices = () => {
  const [services, setServices] = useState([]);

  useEffect(() => {
    fetchServices();
  }, []);

  const fetchServices = async () => {
    try {
      const { data } = await api.get('/admin/services');
      setServices(Array.isArray(data) ? data : []);
    } catch {
      toast.error('Failed to load services');
    }
  };

  const removeService = async (id) => {
    try {
      await api.delete(`/services/${id}`);
      toast.success('Service removed');
      fetchServices();
    } catch {
      toast.error('Failed to remove service');
    }
  };

  return (
    <div>
      <h2>Manage Services</h2>
      <ul>
        {services.map((service) => (
          <li key={service.id}>
            {service.title} — {service.provider && service.provider.name} — £{service.basePrice}
            <button onClick={() => removeService(service.id)} className="btn-danger">Remove</button>
          </li>
        ))}
      </ul>
    </div>
  );
};

export default AdminServices;