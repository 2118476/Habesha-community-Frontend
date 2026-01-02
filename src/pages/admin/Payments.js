import React, { useState, useEffect } from 'react';
import api from '../../api/axiosInstance';
import { toast } from 'react-toastify';

// Lists payment transactions recorded by the platform. Each row
// shows the payer, amount, type and status. This endpoint is
// restricted to admin users.
const AdminPayments = () => {
  const [payments, setPayments] = useState([]);

  useEffect(() => {
    fetchPayments();
  }, []);

  const fetchPayments = async () => {
    try {
      const { data } = await api.get('/admin/payments');
      setPayments(Array.isArray(data) ? data : []);
    } catch {
      toast.error('Failed to load payments');
    }
  };

  return (
    <div>
      <h2>Payments</h2>
      <table className="payments-table">
        <thead>
          <tr>
            <th>ID</th>
            <th>Payer</th>
            <th>Amount</th>
            <th>Type</th>
            <th>Status</th>
            <th>Time</th>
          </tr>
        </thead>
        <tbody>
          {payments.map((p) => (
            <tr key={p.id}>
              <td>{p.id}</td>
              <td>{p.payer && p.payer.name}</td>
              <td>£{p.amount}</td>
              <td>{p.type}</td>
              <td>{p.status}</td>
              <td>{p.createdAt ? new Date(p.createdAt).toLocaleString() : ''}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default AdminPayments;