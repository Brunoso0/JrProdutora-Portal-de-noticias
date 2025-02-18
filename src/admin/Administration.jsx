import React, { useEffect, useState } from "react";
import axios from "axios";
import { Bar, Doughnut, Pie } from "react-chartjs-2";
import { Chart as ChartJS, CategoryScale, LinearScale, BarElement, ArcElement, Tooltip, Legend } from "chart.js";
import { toast, ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";



import "../styles/Administration.css";

ChartJS.register(CategoryScale, LinearScale, BarElement, ArcElement, Tooltip, Legend);

ChartJS.defaults.color = "#fff";


const Administration = () => {
  const [approvedUsers, setApprovedUsers] = useState([]); // Usuários liberados
  const [pendingUsers, setPendingUsers] = useState([]); // Usuários pendentes
  const [message, setMessage] = useState(""); // Mensagem de erro/sucesso
  const [isLoading, setIsLoading] = useState(true); // Carregamento
  const [selectedUser, setSelectedUser] = useState(null); // Modal
  const [userStates, setUserStates] = useState({}); // Estados locais dos usuários
  const [userCountByAccess, setUserCountByAccess] = useState([]); // Contagem de usuários por nível de acesso
const [totalUsuariosLiberados, setTotalUsuariosLiberados] = useState(0); // Total de usuários liberados
const [newCategory, setNewCategory] = useState(""); // Para criar nova categoria
const [newProgram, setNewProgram] = useState(""); // Para criar novo programa
const [categories, setCategories] = useState([]);
const [programs, setPrograms] = useState([]);
const [deleteTarget, setDeleteTarget] = useState(null); // Guarda o ID da categoria ou programa
const [deleteType, setDeleteType] = useState(""); // Define se é categoria ou programa
const [showConfirmModal, setShowConfirmModal] = useState(false); // Controla o modal de confirmação




  

  useEffect(() => {
    const fetchUserCountByAccess = async () => {
      try {
        const token = localStorage.getItem("authToken");
        const response = await axios.get(
          "http://localhost:5000/auth/user-count-by-access-level",
          {
            headers: { Authorization: `Bearer ${token}` },
          }
        );

        const data = response.data;

        // Converte os dados para um formato utilizável
        const formattedData = new Array(5).fill(0); // Índices 0-4 (Nenhum a Admin Chefe)
        let totalLiberados = 0;

        data.forEach((item) => {
          if (item.nivel_acesso > 0 && item.nivel_acesso <= 4) {
            formattedData[item.nivel_acesso] = item.count;
            totalLiberados += item.count; // Soma usuários liberados
          }
        });

        setUserCountByAccess(formattedData);
        setTotalUsuariosLiberados(totalLiberados);
      } catch (error) {
        console.error("Erro ao buscar contagem de usuários:", error);
      }
    };

    // Chama a função inicialmente
    fetchUserCountByAccess();

    // Define o intervalo para atualizar a cada 60 segundos
    const interval = setInterval(() => {
      fetchUserCountByAccess();
    }, 100);

    // Cleanup para evitar vazamentos de memória
    return () => clearInterval(interval);
  }, []); // O array vazio significa que roda apenas no primeiro render e nos intervalos definidos



useEffect(() => {
  const fetchUserCountByAccess = async () => {
    try {
      const token = localStorage.getItem("authToken");
      const response = await axios.get(
        "http://localhost:5000/auth/user-count-by-access-level",
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );

      const data = response.data;

      // Converte os dados para um formato utilizável
      const formattedData = new Array(5).fill(0); // Índices 0-4 (Nenhum a Admin Chefe)
      let totalLiberados = 0;

      data.forEach((item) => {
        if (item.nivel_acesso > 0 && item.nivel_acesso <= 4) {
          formattedData[item.nivel_acesso] = item.count;
          totalLiberados += item.count; // Soma usuários liberados
        }
      });

      setUserCountByAccess(formattedData);
      setTotalUsuariosLiberados(totalLiberados);
    } catch (error) {
      console.error("Erro ao buscar contagem de usuários:", error);
    }
  };

  fetchUserCountByAccess();
}, []);

const cargoLabels = ["Nenhum", "Básico", "Intermediário", "Administrador", "Admin Chefe"];

const doughnutData = {
  labels: cargoLabels.slice(1), // Remove "Nenhum" da legenda
  datasets: [
    {
      data: userCountByAccess.slice(1), // Remove "Nenhum" dos dados
      backgroundColor: ["#4CAF50", "#FF9800", "#3F51B5", "#F44336"],
      hoverOffset: 6,
    },
  ],
};

const doughnutOptions = {
  responsive: true,
  maintainAspectRatio: false,
  cutout: "70%", // Aumenta o espaço central
  plugins: {
    legend: {
      position: "bottom",
      labels: {
        font: {
          size: 10,
        },
      },
    },
    tooltip: {
      callbacks: {
        label: (tooltipItem) =>
          `${tooltipItem.label}: ${tooltipItem.raw} usuários`,
      },
    },
  },
};

  const accessLevels = {
    1: "Básico",
    2: "Intermediário",
    3: "Administrador",
    4: "Admin Chefe",
  };

  useEffect(() => {
    const fetchUsers = async () => {
      try {
        const token = localStorage.getItem("authToken");
        const response = await axios.get("http://localhost:5000/auth/users", {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });
  
        const users = response.data;
  
        // Inicializa estados locais para cada usuário
        const initialStates = {};
        users.forEach((user) => {
          initialStates[user.id] = {
            cargo: user.cargo || "", // Garante que o cargo seja uma string vazia caso não exista
            programa: user.programa_id || 0, // Padrão para "Nenhum"
            nivel_acesso: user.nivel_acesso || 0,
          };
        });
  
        setUserStates(initialStates);
  
        const approved = users
          .filter((user) => user.nivel_acesso > 0)
          .sort((a, b) => b.nivel_acesso - a.nivel_acesso);
  
        const pending = users.filter((user) => user.nivel_acesso === 0);
  
        setApprovedUsers(approved);
        setPendingUsers(pending);
        setIsLoading(false);
      } catch (error) {
        console.error(
          "Erro ao buscar usuários:",
          error.response?.data || error.message
        );
        setIsLoading(false);
      }
    };
    
  
    fetchUsers();
    fetchCategoriesAndPrograms();
  }, []);

  // Função para buscar categorias e programas atualizados
const fetchCategoriesAndPrograms = async () => {
  try {
    const token = localStorage.getItem("authToken");

    const [categoriesResponse, programsResponse] = await Promise.all([
      axios.get("http://localhost:5000/noticias/categorias", {
        headers: { Authorization: `Bearer ${token}` },
      }),
      axios.get("http://localhost:5000/noticias/programas", {
        headers: { Authorization: `Bearer ${token}` },
      }),
    ]);

    setCategories(categoriesResponse.data);
    setPrograms(programsResponse.data);
  } catch (error) {
    console.error("Erro ao buscar categorias e programas:", error);
  }
};

  // Criar Categoria
const handleCreateCategory = async () => {
  if (!newCategory.trim()) {
    toast.warn("⚠️ O nome da categoria não pode estar vazio.");
    return;
  }

  try {
    const token = localStorage.getItem("authToken");
    await axios.post(
      "http://localhost:5000/noticias/nova-categoria",
      { nome: newCategory },
      {
        headers: { Authorization: `Bearer ${token}` },
      }
    );

    toast.success("✅ Categoria criada com sucesso!");
    setNewCategory("");
    await fetchCategoriesAndPrograms(); // Atualiza a lista
  } catch (error) {
    console.error("Erro ao criar categoria:", error.response?.data || error.message);
    toast.error("❌ Erro ao criar categoria.");
  }
};

// Criar Programa
const handleCreateProgram = async () => {
  if (!newProgram.trim()) {
    toast.warn("⚠️ O nome do programa não pode estar vazio.");
    return;
  }

  try {
    const token = localStorage.getItem("authToken");
    await axios.post(
      "http://localhost:5000/noticias/novo-programa",
      { nome: newProgram },
      {
        headers: { Authorization: `Bearer ${token}` },
      }
    );

    toast.success("✅ Programa criado com sucesso!");
    setNewProgram("");
    await fetchCategoriesAndPrograms(); // Atualiza a lista
  } catch (error) {
    console.error("Erro ao criar programa:", error.response?.data || error.message);
    toast.error("❌ Erro ao criar programa.");
  }
};

// Remover Categoria
const handleDeleteCategory = async (id) => {
  if (!id) return;

  try {
    const token = localStorage.getItem("authToken");
    await axios.delete(`http://localhost:5000/noticias/remover-categoria/${id}`, {
      headers: { Authorization: `Bearer ${token}` },
    });

    toast.success("✅ Categoria removida com sucesso!");
    await fetchCategoriesAndPrograms(); // Atualiza a lista
  } catch (error) {
    console.error("Erro ao remover categoria:", error.response?.data || error.message);
    toast.error("❌ Erro ao remover categoria.");
  }
};

// Remover Programa
const handleDeleteProgram = async (id) => {
  if (!id) return;

  try {
    const token = localStorage.getItem("authToken");
    await axios.delete(`http://localhost:5000/noticias/remover-programa/${id}`, {
      headers: { Authorization: `Bearer ${token}` },
    });

    toast.success("✅ Programa removido com sucesso!");
    await fetchCategoriesAndPrograms(); // Atualiza a lista
  } catch (error) {
    console.error("Erro ao remover programa:", error.response?.data || error.message);
    toast.error("❌ Erro ao remover programa.");
  }
};

const handleDeleteConfirmed = async () => {
  if (!deleteTarget) return;

  try {
    const token = localStorage.getItem("authToken");
    const url = deleteType === "categoria"
      ? `http://localhost:5000/noticias/remover-categoria/${deleteTarget}`
      : `http://localhost:5000/noticias/remover-programa/${deleteTarget}`;

    await axios.delete(url, { headers: { Authorization: `Bearer ${token}` } });

    toast.success(deleteType === "categoria" ? "✅ Categoria removida!" : "✅ Programa removido!");
    fetchCategoriesAndPrograms();
  } catch (error) {
    console.error("Erro ao remover:", error.response?.data || error.message);
    toast.error("❌ Erro ao remover.");
  } finally {
    setShowConfirmModal(false);
    setDeleteTarget(null);
    setDeleteType("");
  }
};


const confirmDelete = (id, type) => {
  setDeleteTarget(id);
  setDeleteType(type);
  setShowConfirmModal(true);
};

  

  const handleDragStart = (event, user) => {
    event.dataTransfer.setData("user", JSON.stringify(user));
    event.currentTarget.style.opacity = "1";
  };

  const handleDragEnd = (event) => {
    event.currentTarget.style.opacity = "1";
  };

  const handleDrop = async (event, targetColumn) => {
    event.preventDefault();
    const user = JSON.parse(event.dataTransfer.getData("user"));
  
    if (targetColumn === "approved" && user.nivel_acesso === 0) {
      await updateUserAccess(user.id, 1);
      setPendingUsers((prev) => prev.filter((u) => u.id !== user.id));
      setApprovedUsers((prev) => [...prev, { ...user, nivel_acesso: 1 }]);
  
      // Exibir alerta de sucesso quando um usuário for aprovado
      toast.success(`✅ ${user.nome} foi APROVADO com sucesso!`, {
        position: "top-right",
        autoClose: 3000,
        hideProgressBar: false,
        closeOnClick: true,
        pauseOnHover: true,
        draggable: true,
        theme: "dark",
      });
  
    } else if (targetColumn === "pending" && user.nivel_acesso > 0) {
      await updateUserAccess(user.id, 0);
      setApprovedUsers((prev) => prev.filter((u) => u.id !== user.id));
      setPendingUsers((prev) => [...prev, { ...user, nivel_acesso: 0 }]);
  
      // Exibir alerta de remoção quando um usuário for movido para "Usuários Sem Autorização"
      toast.warn(`⚠️ ${user.nome} foi REMOVIDO da autorização!`, {
        position: "top-right",
        autoClose: 3000,
        hideProgressBar: false,
        closeOnClick: true,
        pauseOnHover: true,
        draggable: true,
        theme: "dark",
      });
    }
  };
  

  const updateUserAccess = async (userId, nivel_acesso) => {
    try {
      const token = localStorage.getItem("authToken");
      await axios.put(
        "http://localhost:5000/auth/update-user",
        { userId, nivel_acesso },
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );
      setMessage("Usuário atualizado com sucesso!");
    } catch (error) {
      console.error(
        "Erro ao atualizar nível de acesso:",
        error.response?.data || error.message
      );
      setMessage("Erro ao atualizar nível de acesso.");
    }
  };

  const handleInputChange = (field, value) => {
    setUserStates((prev) => ({
      ...prev,
      [selectedUser.id]: {
        ...prev[selectedUser.id],
        [field]: value,
      },
    }));
  };

  const handleConfirmChanges = async () => {
    try {
      const token = localStorage.getItem("authToken");
      const { cargo, programa, nivel_acesso } = userStates[selectedUser.id];

      await axios.put(
        "http://localhost:5000/auth/update-user",
        {
          userId: selectedUser.id,
          cargo: cargo || null,
          programa_id: programa || null,
          nivel_acesso: nivel_acesso || 0,
        },
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      setMessage("Usuário atualizado com sucesso!");
      setSelectedUser(null);
    } catch (error) {
      console.error(
        "Erro ao atualizar usuário:",
        error.response?.data || error.message
      );
      setMessage("Erro ao atualizar usuário.");
    }
  };
  


  const openEditModal = (user) => {
    setSelectedUser(user);
  };

  const closeModal = () => {
    setSelectedUser(null);
  };

  if (isLoading) {
    return <div className="loading">Carregando...</div>;
  }

  return (
    <div className="administration-container">
      <ToastContainer />  {/* Isso é necessário para exibir os alertas */}
      

      <div className="user-columns">
        <div
          className="user-column approved"
          onDragOver={(e) => e.preventDefault()}
          onDrop={(e) => handleDrop(e, "approved")}
        >
          <h2>Usuários Liberados</h2>
          <div className="user-boxes">
            {approvedUsers.map((user) => (
              <div
                key={user.id}
                className="user-box"
                draggable
                onDragStart={(e) => handleDragStart(e, user)}
                onDragEnd={handleDragEnd}
              >
                <div className="user-box-img">
                  <img
                    src={
                      user.perfil_imagem
                        ? `http://localhost:5000${user.perfil_imagem}`
                        : "/img/user.jpg"
                    }
                    alt="Perfil"
                    className="profile-picture"
                  />
                </div>
                <div className="user-box-text">
                  <h3>{user.nome}</h3>
                  <p>
                    {user.cargo || "Nenhum"}
                  </p>

                  <p>
                    {" "}
                    {user.programa_id === 1
                      ? "Café com Resenhas"
                      : user.programa_id === 2
                      ? "Jr Esportes"
                      : user.programa_id === 3
                      ? "Jr Notícias"
                      : "Nenhum"}
                  </p>
                  <p>
                     {accessLevels[user.nivel_acesso]}
                  </p>
                  <button className="button" onClick={() => openEditModal(user)}>
                    Editar
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
        <div className="icon-troca">
            <img src="/img/troca.png" alt="troca" />
        </div>

        <div
          className="user-column pending"
          onDragOver={(e) => e.preventDefault()}
          onDrop={(e) => handleDrop(e, "pending")}
        >
          <h2>Usuários Sem Autorização</h2>
          <div className="user-boxes">
            {pendingUsers.map((user) => (
              <div
                key={user.id}
                className="user-box"
                draggable
                onDragStart={(e) => handleDragStart(e, user)}
                onDragEnd={handleDragEnd}
              >
                <div className="user-box-text">
                <h3>{user.nome}</h3>
                <p>{user.email}</p>
                <button className="button" onClick={() => openEditModal(user)}>
                  Editar
                </button>
              </div>
            </div>
            ))}
          </div>
        </div>
      </div>

      {selectedUser && (
        <div className="modal">
          <div className="modal-content-admin">
            <h2>Editar Usuário</h2>
            <label>
              Nome:
              <input type="text" value={selectedUser.nome} disabled />
            </label>
            <label type="text" value={selectedUser.email}>
            Email:
            <input type="text" value={selectedUser.email} disabled />
            </label>
            <label>
              Cargo:
              <input
                type="text"
                value={userStates[selectedUser.id]?.cargo || ""}
                onChange={(e) => handleInputChange("cargo", e.target.value)}
              />
            </label>
            <label>
              Programa:
              <select
                value={userStates[selectedUser.id]?.programa || 0}
                onChange={(e) =>
                  handleInputChange("programa", parseInt(e.target.value))
                }
              >
                <option value={0}>Nenhum</option>
                <option value={1}>Café com Resenhas</option>
                <option value={2}>Jr Esportes</option>
                <option value={3}>Jr Notícias</option>
              </select>
            </label>
            <label>
              Nível de Acesso:
              <select
                value={userStates[selectedUser.id]?.nivel_acesso || 0}
                onChange={(e) =>
                  handleInputChange("nivel_acesso", parseInt(e.target.value))
                }
              >
                <option value={1}>Básico</option>
                <option value={2}>Intermediário</option>
                <option value={3}>Administrador</option>
                <option value={4}>Admin Chefe</option>
              </select>
            </label>
            <button className="button" onClick={handleConfirmChanges}>
              Salvar
            </button>
            <button className="button cancel" onClick={closeModal}>
              Cancelar
            </button>
          </div>
        </div>
      )}

      <div className="dashboard-administration">
        <h2>Dashboard de Administração</h2>
        <div className="admin-ds">
        <div className="admin-ds-div1 dashboard-box" >
          <div className="doughnut-chart-container-admin"  style={{ maxHeight: "250px" }}>
            <Doughnut data={doughnutData} options={doughnutOptions} />
            <div className="doughnut-center-admin">
              <p>{totalUsuariosLiberados} <br />  <b>Usuários Liberados</b>
              </p>
            </div>
          </div>
        </div>
          <div className="admin-ds-div3 dashboard-box">

          </div>
          <div className="admin-ds-div4 dashboard-box">
            <h3>Receita gerada</h3>
          </div>
          <div className="admin-ds-div6 dashboard-box">
            <h2>Categorias e Programas</h2>

            {/* Criar Nova Categoria */}
            <div className="form-group">
              <input
                type="text"
                placeholder="Nome da nova categoria"
                value={newCategory}
                onChange={(e) => setNewCategory(e.target.value)}
              />
              <button onClick={handleCreateCategory} className="button">Criar Categoria</button>
            </div>

            {/* Remover Categoria via Select */}
            <div className="form-group">
              <select onChange={(e) => confirmDelete(e.target.value, "categoria")} defaultValue="">
                <option value="" disabled>Selecione uma categoria para excluir</option>
                {categories.map((category) => (
                  <option key={category.id} value={category.id}>{category.nome}</option>
                ))}
              </select>
            </div>

            {/* Criar Novo Programa */}
            <div className="form-group">
              <input
                type="text"
                placeholder="Nome do novo programa"
                value={newProgram}
                onChange={(e) => setNewProgram(e.target.value)}
              />
              <button onClick={handleCreateProgram} className="button">Criar Programa</button>
            </div>

            {/* Remover Programa via Select */}
            <div className="form-group">
              <select onChange={(e) => confirmDelete(e.target.value, "programa")} defaultValue="">
                <option value="" disabled>Selecione um programa para excluir</option>
                {programs.map((program) => (
                  <option key={program.id} value={program.id}>{program.nome}</option>
                ))}
              </select>
            </div>
          </div>
          </div>
      </div>
      {showConfirmModal && (
  <div className="modal">
    <div className="modal-content">
      <h3>Confirmação</h3>
      <p>Tem certeza de que deseja excluir esta {deleteType === "categoria" ? "categoria" : "programa"}?</p>
      <button onClick={handleDeleteConfirmed} className="button">Sim, Excluir</button>
      <button onClick={() => setShowConfirmModal(false)} className="button cancel">Cancelar</button>
    </div>
  </div>
)}

    </div>
  );
};

export default Administration;
