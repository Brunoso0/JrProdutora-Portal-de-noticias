import React, { useState, useEffect } from "react";
import axios from "axios";
import "../styles/UserProfile.css";

import { API_BASE_URL } from '../services/api'; // Importando o arquivo de configuração do Axios

const UserProfile = () => {
  const [userData, setUserData] = useState({
    name: "",
    profileImage: "",
    type: "",
    program: "",
  });
  const [points, setPoints] = useState(3456);
  const [level, setLevel] = useState(80);
  const [tokens, setTokens] = useState(34);
  const [energy, setEnergy] = useState(10);
  const [name, setUserName] = useState("");
  const [nivel_acesso, setUserAccessLevel] = useState(null);
  const [imagePreview, setImagePreview] = useState("/img/user.jpg");
  const [cargo, setCargo] = useState("");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [newName, setNewName] = useState(name);
  const [newProfileImage, setNewProfileImage] = useState(null);
  const [croppedImage, setCroppedImage] = useState(null);
  const [dragging, setDragging] = useState(false);



  useEffect(() => {
    const fetchUserData = async () => {
      try {
        const token = localStorage.getItem("authToken");
        if (!token) {
          return;
        }

        const response = await axios.get(`${API_BASE_URL}/auth/user`, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        const data = response.data;
        setUserName(data.name || "Usuário");
        setUserAccessLevel(data.nivel_acesso);
        setImagePreview(
          data.profileImage
            ? `${API_BASE_URL}${data.profileImage}`
            : "/img/user.jpg"
        );
        setCargo(data.cargo || "Funcionário"); // Se for null, mostra "Funcionário"
      } catch (err) {
        console.error(err);
      }
    };

    fetchUserData();
  }, []);

  const nivelAcessoIcons = {
    1: "🔰", // Básico
    2: "⚡", // Intermediário
    3: "🛠️", // Administrador
    4: "👑", // Administrador Chefe
  };

  const openModal = () => {
    setNewName(name); // Mantém o nome atual no input
    setIsModalOpen(true);
  };
  
  const closeModal = () => {
    setIsModalOpen(false);
  };

  const handleImageChange = (e) => {
  const file = e.target.files[0];
  if (file) {
    setNewProfileImage(file); // ✅ objeto File
  }
};

  
  const handleDrop = (e) => {
  e.preventDefault();
  setDragging(false);
  const file = e.dataTransfer.files[0];
  if (file) {
    setNewProfileImage(file); // ✅ objeto File
  }
};

  
  const handleDragOver = (e) => {
    e.preventDefault();
    setDragging(true);
  };
  
  const handleDragLeave = () => {
    setDragging(false);
  };
  

  const handleSaveChanges = async () => {
    try {
      const token = localStorage.getItem("authToken");
  
      // Atualiza o nome
      if (newName !== name) {
        await axios.put(
          `${API_BASE_URL}/auth/update-name`,
          { name: newName },
          {
            headers: { Authorization: `Bearer ${token}` },
          }
        );
        setUserName(newName);
      }
  
      // Atualiza a imagem de perfil
      if (newProfileImage) {
        const formData = new FormData();
        formData.append("profileImage", newProfileImage);
  
        const response = await axios.put(
          `${API_BASE_URL}/auth/update-image`,
          formData,
          {
            headers: {
              Authorization: `Bearer ${token}`,
              "Content-Type": "multipart/form-data",
            },
          }
        );
  
        if (response.data.profileImage) {
          setImagePreview(`${API_BASE_URL}${response.data.profileImage}`);
        }
      }
  
      closeModal();
    } catch (error) {
      console.error("Erro ao atualizar perfil:", error);
    }
  };
  

  return (
    <div className="user-dashboard">
      {/* Painel principal */}
        <h1>Visão Geral</h1>
      <main className="user-dashboard-main">

        {/* Grid de cards */}
        <div className="user-dashboard-grid">
          <aside className="sidebar-profile profile-card">
            <img
              src={imagePreview}
              alt="Profile"
              className="avatar"
              onError={(e) => {
                e.target.src = "/img/user.jpg";
              }}
            />
            <h2>
              <span className="nivel-icon">{nivelAcessoIcons[nivel_acesso] || "❓"}</span> 
              {name}
            </h2>
            <p className="user-role">{cargo}</p>
            <button className="customize-btn" onClick={openModal}>Customizar</button>
          </aside>

          <div className="card points-card">
            <h3>Your points</h3>
            <p className="big-number">{points}</p>
            <button className="info-btn">How to earn more points?</button>
          </div>

          <div className="card level-card">
            <h3>My Level</h3>
            <p className="big-number">{level}</p>
            <p className="subtext">2030 to next level</p>
            <progress value="74" max="100"></progress>
          </div>

          <div className="card reward-card">
            <h3>Daily Reward</h3>
            <p>☕ Morning Coffee</p>
            <button className="collect-btn">Collect</button>
          </div>

          <div className="card quests-card">
            <h3>Next Quests</h3>
            <ul>
              <li>Complete a task <span>+20</span></li>
              <li>Complete a subtask <span>+5</span></li>
              <li>Create a task <span>+5</span></li>
              <li>Give kudos <span>+100</span></li>
            </ul>
          </div>

          <div className="card trophy-card">
            <h3>Trophies</h3>
            <img src="/img/trophy.png" alt="Trophy" className="trophy-icon" />
            <p>Kudo Lover</p>
          </div>

          <div className="card stats-card">
            <h3>Global Stats</h3>
            <p className="big-number">345</p>
            <p>Tasks completed</p>
          </div>

          <div className="card tokens-card">
            <h3>Your Tokens</h3>
            <p className="big-number">{tokens}</p>
            <button className="spend-btn">Spend tokens</button>
          </div>

          <div className="card energy-card">
            <h3>Energy</h3>
            <p className="big-number">{energy}</p>
            <button className="browse-btn">Browse people</button>
          </div>

          <div className="card endorsements-card">
            <h3>Recent Endorsements</h3>
            <p>+4 Performance</p>
            <p>+2 Teamwork</p>
            <p>+1 Leadership</p>
          </div>
        </div>
      </main> 
      {/* Modais */}
      {isModalOpen && (
        <div className="modal-overlay">
          <div className="modal-content">
            <h2>Editar Perfil</h2>

            {/* Seção de edição de imagem */}
            <div
              className={`drop-zone ${dragging ? "dragging" : ""}`}
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onDrop={handleDrop}
            >
              {newProfileImage ? (
                <img src={URL.createObjectURL(newProfileImage)} alt="Preview" className="image-preview" />
              ) : (
                <p>Clique ou arraste a imagem até aqui</p>
              )}
              <input
                type="file"
                accept="image/*"
                onChange={(e) => setNewProfileImage(e.target.files[0])}
                className="file-upload-input"
              />
            </div>

            {/* Seção de edição de nome */}
            <div className="input-group">
              <label>Nome de exibição:</label>
              <input
                type="text"
                value={newName}
                onChange={(e) => setNewName(e.target.value)}
                className="name-input"
              />
            </div>

            {/* Botões de ação */}
            <div className="modal-actions">
              <button onClick={handleSaveChanges} className="save-btn">Salvar</button>
              <button onClick={closeModal} className="cancel-btn">Cancelar</button>
            </div>
          </div>
        </div>
      )}


    </div>
  );
};

export default UserProfile;
