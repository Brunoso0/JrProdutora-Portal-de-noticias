import React, { useEffect, useState, useRef } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import "../styles/AdminPage.css";

// Componentes das telas
import Dashboard from "../admin/dashboard";
import OrderNews from "../admin/OrderNews";
import News from "../admin/News";
import PublishNews from "../admin/PublishNews";
import EditNews from "../admin/EditNews";
import Administration from "../admin/Administration";
import UserProfile from "../admin/UserProfile";

// 🆕 Ícones modernos do Lucide
import {
  LayoutDashboard,
  ListChecks,
  Newspaper,
  FilePlus,
  Edit,
  Users,
  User,
  LogOut,
} from "lucide-react";

const AdminPage = () => {
  const [userName, setUserName] = useState("");
  const [userAccessLevel, setUserAccessLevel] = useState(null);
  const [imagePreview, setImagePreview] = useState("/img/user.jpg");
  const [isLoading, setIsLoading] = useState(true);
  const [activePage, setActivePage] = useState("UserProfile");
  const navigate = useNavigate();
  const editorInstance = useRef(null);

  useEffect(() => {
    const fetchUserData = async () => {
      try {
        const token = localStorage.getItem("authToken");
        if (!token) {
          navigate("/login");
          return;
        }
  
        const response = await axios.get("http://localhost:5000/auth/user", {
          headers: { Authorization: `Bearer ${token}` },
        });
  
        const data = response.data;
        setUserName(data.name || "Usuário");
        setUserAccessLevel(data.nivel_acesso);
        setImagePreview(
          data.profileImage ? `http://localhost:5000${data.profileImage}` : "/img/user.jpg"
        );
        setIsLoading(false);
      } catch (err) {
        console.error("Erro ao buscar dados do usuário:", err);
        localStorage.removeItem("authToken");
        navigate("/login");
      }
    };
  
    // Chamada inicial
    fetchUserData();
  
    // Atualiza a cada 30 segundos
    const intervalId = setInterval(fetchUserData, 100);
  
    // Limpa o intervalo ao desmontar o componente
    return () => clearInterval(intervalId);
  }, [navigate]);
  

  const handleLogout = async () => {
    try {
        const token = localStorage.getItem("authToken");
        if (token) {
            await axios.post("http://localhost:5000/auth/logout", {}, {
                headers: { Authorization: `Bearer ${token}` },
            });
        }
    } catch (error) {
        console.error("Erro ao fazer logout:", error);
    } finally {
        localStorage.removeItem("authToken");
        navigate("/login");
    }
};


  const renderActivePage = () => {
    if (userAccessLevel === 0) {
      return (
        <div className="profile-container">
          <h1>Perfil do Usuário</h1>
          <p className="access-warning">
            Aguarde um administrador liberar seu acesso!
          </p>
        </div>
      );
    }

    if (editorInstance.current) {
      editorInstance.current
        .destroy()
        .then(() => {
          editorInstance.current = null;
        })
        .catch((err) =>
          console.error("Erro ao destruir EditorJS antes de mudar de página:", err)
        );
    }

    switch (activePage) {
      case "Dashboard":
        return <Dashboard />;
      case "OrderNews":
        return <OrderNews />;
      case "News":
        return <News />;
      case "PublishNews":
        return <PublishNews />;
      case "EditNews":
        return <EditNews />;
      case "Administration":
        return userAccessLevel >= 3 ? <Administration /> : <p className="error-message">Acesso negado.</p>;
      case "UserProfile":
        return <UserProfile onUpdateProfileImage={(newImagePath) => setImagePreview(`http://localhost:5000${newImagePath}`)} />;
      default:
        return <Dashboard />;
    }
  };

  if (isLoading) {
    return <div className="loading">Carregando...</div>;
  }

  return (
    <div className="admin-container">
      {/* Sidebar */}
      <aside className="sidebar">
        <div className="cima">
          <div className="profile-section">
            <img
              src={imagePreview}
              alt="Profile"
              className="profile-picture"
              onError={(e) => {
                e.target.src = "/img/user.jpg";
              }}
            />
            <p className="profile-name">
              <b>Bem Vindo(a)!!</b>
            </p>
            <p className="profile-name">{userName}</p>
          </div>
          <nav className="menu">
            <ul>
              <li className={`menu-item ${activePage === "Dashboard" ? "active" : ""}`} onClick={() => setActivePage("Dashboard")}>
                <LayoutDashboard size={24} />
                <span className="menu-text">Dashboard</span>
              </li>
              <li className={`menu-item ${activePage === "OrderNews" ? "active" : ""}`} onClick={() => setActivePage("OrderNews")}>
                <ListChecks size={24} />
                <span className="menu-text">Ordem das Notícias</span>
              </li>
              <li className={`menu-item ${activePage === "News" ? "active" : ""}`} onClick={() => setActivePage("News")}>
                <Newspaper size={24} />
                <span className="menu-text">Notícias</span>
              </li>
              <li className={`menu-item ${activePage === "PublishNews" ? "active" : ""}`} onClick={() => setActivePage("PublishNews")}>
                <FilePlus size={24} />
                <span className="menu-text">Publicar Nova Notícia</span>
              </li>
              <li className={`menu-item ${activePage === "EditNews" ? "active" : ""}`} onClick={() => setActivePage("EditNews")}>
                <Edit size={24} />
                <span className="menu-text">Editar Notícia</span>
              </li>
              {userAccessLevel >= 3 && (
                <li className={`menu-item ${activePage === "Administration" ? "active" : ""}`} onClick={() => setActivePage("Administration")}>
                  <Users size={24} />
                  <span className="menu-text">Administração</span>
                </li>
              )}
              <li className={`menu-item ${activePage === "UserProfile" ? "active" : ""}`} onClick={() => setActivePage("UserProfile")}>
                <User size={24} />
                <span className="menu-text">Perfil</span>
              </li>
            </ul>
          </nav>
        </div>
        <button className="logout-btn" onClick={handleLogout}>
          <LogOut size={24} />
          <span className="menu-text">Sair</span>
        </button>
      </aside>

      {/* Main Content */}
      <main className="main-content">{renderActivePage()}</main>
    </div>
  );
};

export default AdminPage;
