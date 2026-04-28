import React, { useEffect, useState } from 'react';
import { Search, Settings, Menu } from 'lucide-react';
import '../styles/AdminTopbar.css';

const AdminTopbar = ({ title, toggleSidebar, adminName, onOpenSettings }) => {
  const [avatarSrc, setAvatarSrc] = useState('');

  useEffect(() => {
    try {
      const stored = JSON.parse(localStorage.getItem('festivalAdminUser') || localStorage.getItem('user') || '{}');
      const src = stored?.profile_photo_url || stored?.avatar || stored?.avatarUrl || '';
      setAvatarSrc(src);
    } catch (e) {
      setAvatarSrc('');
    }
  }, [adminName]);

  const getInitials = (name) => {
    const cleaned = (name || '').trim();
    if (!cleaned) return 'A';
    const parts = cleaned.split(/\s+/).filter(Boolean);
    const first = parts[0]?.[0] || '';
    const second = parts[1]?.[0] || '';
    return `${first}${second}`.toUpperCase();
  };

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
          <button type="button" className="admin-topbar-icon-btn" onClick={onOpenSettings} title="Configurações da conta">
            <Settings size={20} />
          </button>
          <div className="admin-topbar-avatar">
            {avatarSrc ? (
              <img src={avatarSrc} alt={adminName || 'Admin'} />
            ) : (
              <div className="admin-topbar-avatar-fallback">{getInitials(adminName)}</div>
            )}
          </div>
        </div>
      </div>
    </header>
  );
};

export default AdminTopbar;
