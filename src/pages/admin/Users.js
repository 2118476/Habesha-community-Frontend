import React, { useState, useEffect } from 'react';
import api from '../../api/axiosInstance';
import { toast } from 'react-toastify';

// Page for administrators to view and manage user roles. Admins
// can change a user's role by selecting a new value from the
// dropdown. Users are fetched from /users without filtering.
const AdminUsers = () => {
  const [users, setUsers] = useState([]);

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    try {
      // Fetch users by role. The backend returns service providers when no role
      // parameter is supplied, so explicitly request USER role to retrieve
      // end‑users. Administrators can adjust the role filter as needed.
      const { data } = await api.get('/users', { params: { role: 'USER' } });
      setUsers(Array.isArray(data) ? data : []);
    } catch {
      toast.error('Failed to load users');
    }
  };

  const changeRole = async (id, newRole) => {
    try {
      // Update the user's role via request parameter rather than JSON body.
      await api.put(`/admin/users/${id}/role`, null, { params: { role: newRole } });
      toast.success('Role updated');
      fetchUsers();
    } catch {
      toast.error('Failed to update role');
    }
  };

  return (
    <div>
      <h2>Manage Users</h2>
      <table className="users-table">
        <thead>
          <tr>
            <th>Name</th>
            <th>Email</th>
            <th>Role</th>
            <th>Change Role</th>
          </tr>
        </thead>
        <tbody>
          {users.map((user) => (
            <tr key={user.id}>
              <td>{user.name}</td>
              <td>{user.email}</td>
              <td>{user.role}</td>
              <td>
                <select
                  value={user.role}
                  onChange={(e) => changeRole(user.id, e.target.value)}
                >
                  <option value="USER">USER</option>
                  <option value="SERVICE_PROVIDER">SERVICE_PROVIDER</option>
                  <option value="MODERATOR">MODERATOR</option>
                  <option value="ADMIN">ADMIN</option>
                </select>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default AdminUsers;