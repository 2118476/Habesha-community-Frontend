import React, { useState, useEffect } from 'react';
import api from '../../api/axiosInstance';
import { toast } from 'react-toastify';
// Import design system styles for admin section and buttons
import adminStyles from '../../stylus/sections/Admin.module.scss';
import buttonStyles from '../../stylus/components/Button.module.scss';

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
      const { data } = await api.get('/api/admin/services');
      setServices(Array.isArray(data) ? data : []);
    } catch {
      toast.error('Failed to load services');
    }
  };

  const removeService = async (id) => {
    try {
      await api.delete(`/api/services/${id}`);
      toast.success('Service removed');
      fetchServices();
    } catch {
      toast.error('Failed to remove service');
    }
  };

  return (
    <div className={adminStyles.container}>
      <h2 style={{ marginTop: 0 }}>Manage Services</h2>
      <table className={adminStyles.table}>
        <thead>
          <tr>
            <th>Title</th>
            <th>Provider</th>
            <th>Price (£)</th>
            <th>Action</th>
          </tr>
        </thead>
        <tbody>
          {services.map((service) => (
            <tr key={service.id}>
              <td>{service.title}</td>
              <td>{service.provider && service.provider.name}</td>
              <td>{service.basePrice}</td>
              <td>
                <button
                  onClick={() => removeService(service.id)}
                  className={`${buttonStyles.btn} ${buttonStyles.danger}`}
                >
                  Remove
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default AdminServices;