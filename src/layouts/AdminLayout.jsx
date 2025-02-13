import React from 'react';

const AdminLayout = ({ children }) => {
  return (
    <div className="admin-layout">
      <header>
        <h1>Painel Administrativo</h1>
      </header>
      <main>{children}</main>
    </div>
  );
};

export default AdminLayout;
