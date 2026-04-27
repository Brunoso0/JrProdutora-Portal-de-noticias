import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import AdminSidebar from '../components/AdminSidebar';
import AdminTopbar from '../components/AdminTopbar';
import DashboardAdmin from '../subPages/DashboardAdmin';
import SessoesAdmin from '../subPages/SessoesAdmin';
import ArtistasAdmin from '../subPages/ArtistasAdmin';
import JuradosAdmin from '../subPages/JuradosAdmin';
import '../styles/FestivalAdmin.css';

const FestivalAdmin = () => {
  const navigate = useNavigate();
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [activeTab, setActiveTab] = useState('dashboard'); // Dashboard as default landing page
  const [adminName, setAdminName] = useState('Administrador');

  useEffect(() => {
    const storedUser = localStorage.getItem('festivalAdminUser') || localStorage.getItem('user');
    if (storedUser) {
      try {
        const user = JSON.parse(storedUser);
        setAdminName(user?.name || user?.nome || user?.email || 'Administrador');
      } catch (error) {
        setAdminName('Administrador');
      }
    }
  }, []);

  const handleLogout = () => {
    localStorage.removeItem('festivalAdminToken');
    localStorage.removeItem('festivalAdminUser');
    localStorage.removeItem('token');
    navigate('/festival-forro/admin/login');
  };

  const toggleSidebar = () => {
    setIsSidebarOpen(!isSidebarOpen);
  };

  const renderContent = () => {
    switch (activeTab) {
      case 'dashboard':
        return <DashboardAdmin onNavigateTab={setActiveTab} />;
      case 'sessoes':
        return <SessoesAdmin />;
      case 'artistas':
        return <ArtistasAdmin />;
      case 'jurados':
        return <JuradosAdmin />;
      case 'configuracoes':
      default:
        // Placeholder for other pages until implemented
        return (
          <div className="festival-admin-placeholder">
            <h2>Página em construção</h2>
            <p>O conteúdo para a seção "{activeTab}" será disponibilizado em breve.</p>
          </div>
        );
    }
  };

  const getPageTitle = () => {
    switch (activeTab) {
      case 'dashboard': return 'Dashboard';
      case 'artistas': return 'Gerenciamento de Artistas';
      case 'sessoes': return 'Gerenciamento de Sessões';
      case 'jurados': return 'Gerenciamento de Jurados';
      case 'configuracoes': return 'Configurações do Sistema';
      default: return 'Área Administrativa';
    }
  };

  return (
    <div className="festival-admin-layout">
      <AdminSidebar 
        isOpen={isSidebarOpen} 
        activeTab={activeTab} 
        onTabChange={setActiveTab} 
        onLogout={handleLogout} 
      />
      <main className={`festival-admin-main ${isSidebarOpen ? 'sidebar-open' : 'sidebar-closed'}`}>
        <AdminTopbar 
          title={getPageTitle()} 
          toggleSidebar={toggleSidebar} 
          adminName={adminName} 
        />
        <div className="festival-admin-content-area">
          {renderContent()}
        </div>
      </main>
    </div>
  );
};

export default FestivalAdmin;
