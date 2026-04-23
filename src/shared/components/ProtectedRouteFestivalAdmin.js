import React from 'react';
import { Navigate } from 'react-router-dom';

const ProtectedRouteFestivalAdmin = ({ children }) => {
  const token = localStorage.getItem('festivalAdminToken');
  const storedUser = localStorage.getItem('festivalAdminUser') || localStorage.getItem('user');

  if (!token) {
    return <Navigate to="/festival-forro/admin/login" />;
  }

  if (storedUser) {
    try {
      const user = JSON.parse(storedUser);
      const role = (user?.role || '').toString().toLowerCase();
      if (role && role !== 'admin') {
        return <Navigate to="/festival-forro/admin/login" />;
      }
    } catch (error) {
      return <Navigate to="/festival-forro/admin/login" />;
    }
  }

  return children;
};

export default ProtectedRouteFestivalAdmin;
