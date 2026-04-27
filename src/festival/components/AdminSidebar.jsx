import React from 'react';
import { 
  LayoutDashboard, 
  Users, 
  CalendarDays, 
  Gavel, 
  Settings, 
  HelpCircle, 
  LogOut,
  Tent
} from 'lucide-react';
import '../styles/AdminSidebar.css';

const AdminSidebar = ({ isOpen, activeTab, onTabChange, onLogout }) => {
  const menuItems = [
    { id: 'dashboard', label: 'Dashboard', icon: <LayoutDashboard size={20} /> },
    { id: 'artistas', label: 'Artistas', icon: <Users size={20} /> },
    { id: 'sessoes', label: 'Sessões', icon: <CalendarDays size={20} /> },
    { id: 'jurados', label: 'Jurados', icon: <Gavel size={20} /> },
    { id: 'configuracoes', label: 'Configurações', icon: <Settings size={20} /> },
  ];

  return (
    <aside className={`admin-sidebar ${isOpen ? 'open' : 'closed'}`}>
      <div className="admin-sidebar-header">
        <div className="admin-sidebar-logo-icon">
          <Tent size={24} color="#0E6023" />
        </div>
        {isOpen && (
          <div className="admin-sidebar-logo-text">
            <h2>Festival Forró</h2>
            <p>Edição 2026</p>
          </div>
        )}
      </div>

      <nav className="admin-sidebar-nav">
        <ul>
          {menuItems.map((item) => (
            <li key={item.id}>
              <button
                type="button"
                className={`admin-sidebar-link ${activeTab === item.id ? 'active' : ''}`}
                onClick={() => onTabChange(item.id)}
                title={!isOpen ? item.label : ''}
              >
                <span className="admin-sidebar-icon">{item.icon}</span>
                {isOpen && <span className="admin-sidebar-label">{item.label}</span>}
              </button>
            </li>
          ))}
        </ul>
      </nav>

      <div className="admin-sidebar-footer">
        <ul>
          <li>
            <button type="button" className="admin-sidebar-link" title={!isOpen ? "Suporte" : ""}>
              <span className="admin-sidebar-icon"><HelpCircle size={20} /></span>
              {isOpen && <span className="admin-sidebar-label">Suporte</span>}
            </button>
          </li>
          <li>
             <button type="button" className="admin-sidebar-link logout-btn" onClick={onLogout} title={!isOpen ? "Logout" : ""}>
                <span className="admin-sidebar-icon login-icon-red"><LogOut size={20} /></span>
                {isOpen && <span className="admin-sidebar-label">Logout</span>}
             </button>
          </li>
        </ul>
      </div>
    </aside>
  );
};

export default AdminSidebar;
