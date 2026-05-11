import React from 'react';
import { Navigate } from 'react-router-dom';

const ProtectedRouteJudge = ({ children }) => {
  const token = localStorage.getItem('token') || localStorage.getItem('festivalAdminToken');
  const storedUser = localStorage.getItem('user') || localStorage.getItem('festivalAdminUser');

  if (!token) {
    return <Navigate to="/festival-forro/admin/login" />;
  }

  if (storedUser) {
    try {
      const user = JSON.parse(storedUser);
      const role = (user?.role || '').toString().toLowerCase();
      // Allow both judge and admin for flexibility if needed, 
      // but primarily target 'judge'
      if (role !== 'judge' && role !== 'admin') {
        return <Navigate to="/festival-forro/admin/login" />;
      }
    } catch (error) {
      return <Navigate to="/festival-forro/admin/login" />;
    }
  }

  return children;
};

export default ProtectedRouteJudge;
