import React from 'react';
import { Search, Bell, Settings, Menu } from 'lucide-react';
import '../styles/AdminTopbar.css';

const AdminTopbar = ({ title, toggleSidebar, adminName }) => {
  return (
    <header className="admin-topbar">
      <div className="admin-topbar-left">
        <button type="button" className="admin-topbar-menu-btn" onClick={toggleSidebar}>
          <Menu size={24} />
        </button>
        <h1 className="admin-topbar-title">{title}</h1>
      </div>

      <div className="admin-topbar-right">
        <div className="admin-topbar-search">
          <Search size={18} className="search-icon" />
          <input type="text" placeholder="Buscar sessão..." />
        </div>
        
        <div className="admin-topbar-actions">
          <button type="button" className="admin-topbar-icon-btn">
            <Bell size={20} />
          </button>
          <button type="button" className="admin-topbar-icon-btn">
            <Settings size={20} />
          </button>
          <div className="admin-topbar-avatar">
            <img src="https://i.pravatar.cc/150?img=11" alt={adminName || "Admin"} />
          </div>
        </div>
      </div>
    </header>
  );
};

export default AdminTopbar;
