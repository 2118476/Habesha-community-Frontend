import React, { useState, useEffect } from 'react';
import api from '../../api/axiosInstance';
import { toast } from 'react-toastify';

// Admin dashboard showing aggregated statistics about the
// platform. Fetches data from /admin/stats.
const AdminDashboard = () => {
  const [stats, setStats] = useState(null);

  useEffect(() => {
    fetchStats();
  }, []);

  const fetchStats = async () => {
    try {
      const { data } = await api.get('/admin/stats');
      setStats(data);
    } catch {
      toast.error('Failed to load statistics');
    }
  };

  if (!stats) return <div>Loading statistics...</div>;

  return (
    <div>
      <h2>Admin Dashboard</h2>
      <p>Total users: {stats.totalUsers}</p>
      <p>Service providers: {stats.serviceProviders}</p>
      <p>Total income: £{stats.totalIncome}</p>
    </div>
  );
};

export default AdminDashboard;