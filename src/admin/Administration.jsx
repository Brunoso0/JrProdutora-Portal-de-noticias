import React, { useEffect, useState } from "react";
import axios from "axios";
import { Bar, Doughnut, Pie } from "react-chartjs-2";
import { Chart as ChartJS, CategoryScale, LinearScale, BarElement, ArcElement, Tooltip, Legend } from "chart.js";
import { toast, ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import Loader from "../components/Loader.jsx";

import { API_BASE_URL } from '../services/api'; // Importando o arquivo de configuração do Axios

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
  const [loading, setLoading] = useState(true);
  const [dataInicio, setDataInicio] = useState(""); // Data de início do relatório
  const [dataFim, setDataFim] = useState(""); // Data de fim do relatório
  const [formatoRelatorio, setFormatoRelatorio] = useState("pdf"); // Formato do relatório (PDF, Excel, DOC)
  const [relatorios, setRelatorios] = useState([]);
  const [anuncios, setAnuncios] = useState([]);
  const [novoAnuncio, setNovoAnuncio] = useState({
    espaco_id: "",
    nome_empresa: "",
    tipo: "banner",
    imagem: "",
    link: "",
    google_client_id: "",
    google_slot: "",
    valor: "",
    contrato: "",
    inicio_contrato: "",
    fim_contrato: ""
  });
  

  useEffect(() => {
    const fetchAnuncios = async () => {
      try {
        const res = await axios.get(`${API_BASE_URL}/anuncios`);
        setAnuncios(res.data);
      } catch (error) {
        console.error("Erro ao buscar anúncios:", error);
      }
    };
  
    fetchAnuncios();
  }, []);
  

  

  useEffect(() => {
    const fetchUserCountByAccess = async () => {
      try {
        const token = localStorage.getItem("authToken");
        const response = await axios.get(
          `${API_BASE_URL}/auth/user-count-by-access-level`,
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
    }, 60000);

    // Cleanup para evitar vazamentos de memória
    return () => clearInterval(interval);
  }, []); // O array vazio significa que roda apenas no primeiro render e nos intervalos definidos



useEffect(() => {
  const fetchUserCountByAccess = async () => {
    try {
      const token = localStorage.getItem("authToken");
      const response = await axios.get(
        `${API_BASE_URL}/auth/user-count-by-access-level`,
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
    setLoading(true);
    const fetchUsers = async () => {
      try {
        const token = localStorage.getItem("authToken");
        const response = await axios.get(`${API_BASE_URL}/auth/users`, {
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
            total_noticias: user.total_noticias || 0,
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
        setTimeout(() => setLoading(false), 1000); // 🔹 Garante o loader por +1s
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
      axios.get(`${API_BASE_URL}/noticias/categorias`, {
        headers: { Authorization: `Bearer ${token}` },
      }),
      axios.get(`${API_BASE_URL}/noticias/programas`, {
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
      `${API_BASE_URL}/noticias/nova-categoria`,
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

useEffect(() => {
  const fetchRelatorios = async () => {
    try {
      const token = localStorage.getItem("authToken");
      const response = await axios.get(`${API_BASE_URL}/relatorios/lista`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setRelatorios(response.data);
    } catch (error) {
      console.error("Erro ao buscar relatórios:", error);
    }
  };

  fetchRelatorios();
}, []);


const handleGerarRelatorio = async () => {
  if (!dataInicio || !dataFim) {
    toast.warn("⚠️ Selecione as datas de início e fim.");
    return;
  }

  try {
    const token = localStorage.getItem("authToken");
    const response = await axios.post(
      `${API_BASE_URL}/relatorios/auditorias`,
      {
        data_inicio: dataInicio,
        data_fim: dataFim,
        formato: formatoRelatorio,
      },
      {
        headers: {
          Authorization: `Bearer ${token}`,
        },
        responseType: "blob", // Importante para downloads
      }
    );

    const url = window.URL.createObjectURL(new Blob([response.data]));
    const link = document.createElement("a");
    link.href = url;

    // Nome do arquivo sugerido pelo backend
    const nomeArquivo = response.headers["content-disposition"]
      ?.split("filename=")[1]
      ?.replace(/"/g, "") || "relatorio.pdf";

    link.setAttribute("download", nomeArquivo);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  } catch (error) {
    console.error("Erro ao gerar relatório:", error.message);
    toast.error("❌ Erro ao gerar o relatório.");
  }
};


const handleToggleUserStatus = async (user) => {
  const novoNivel = user.nivel_acesso > 0 ? 0 : 1;

  const token = localStorage.getItem("authToken");

  // Obter IP do usuário
  let ipOrigem = "IP não identificado";
  try {
    const ipRes = await axios.get("https://api.ipify.org?format=json");
    ipOrigem = ipRes.data.ip;
  } catch (error) {
    console.error("Erro ao obter IP:", error.message);
  }

  try {
    await axios.put(
      `${API_BASE_URL}/auth/update-user`,
      { userId: user.id, nivel_acesso: novoNivel },
      { headers: { Authorization: `Bearer ${token}` } }
    );

    // Log de auditoria
    try {
      await axios.post(
        `${API_BASE_URL}/auth/drag-drop-auditoria`,
        {
          acao:
            novoNivel === 1
              ? `Ativou o usuário via botão no modal.`
              : `Desativou o usuário via botão no modal.`,
          ip_origem: ipOrigem,
          alvo_id: user.id,
        },
        { headers: { Authorization: `Bearer ${token}` } }
      );
    } catch (error) {
      console.error("Erro ao registrar auditoria:", error.message);
    }

    // Atualiza estados locais
    setApprovedUsers((prev) =>
      novoNivel === 0 ? prev.filter((u) => u.id !== user.id) : [...prev, { ...user, nivel_acesso: 1 }]
    );
    setPendingUsers((prev) =>
      novoNivel === 0 ? [...prev, { ...user, nivel_acesso: 0 }] : prev.filter((u) => u.id !== user.id)
    );

    setSelectedUser((prev) => ({
      ...prev,
      nivel_acesso: novoNivel,
    }));

    toast.success(
      novoNivel === 1
        ? `✅ ${user.nome} foi ativado com sucesso!`
        : `⚠️ ${user.nome} foi desativado com sucesso!`,
      {
        position: "top-right",
        autoClose: 3000,
        theme: "dark",
      }
    );
  } catch (error) {
    console.error("Erro ao atualizar status do usuário:", error.message);
    toast.error("❌ Erro ao atualizar status do usuário.", {
      position: "top-right",
      autoClose: 4000,
      theme: "dark",
    });
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
      `${API_BASE_URL}/noticias/novo-programa`,
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
    await axios.delete(`${API_BASE_URL}/noticias/remover-categoria/${id}`, {
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
    await axios.delete(`${API_BASE_URL}/noticias/remover-programa/${id}`, {
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
      ? `${API_BASE_URL}/noticias/remover-categoria/${deleteTarget}`
      : `${API_BASE_URL}/noticias/remover-programa/${deleteTarget}`;

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

  

  const handleDrop = async (event, targetColumn) => {
  event.preventDefault();
  const user = JSON.parse(event.dataTransfer.getData("user"));

  const token = localStorage.getItem("authToken");

  // Obter IP do usuário
  let ipOrigem = "IP não identificado";
  try {
    const ipRes = await axios.get("https://api.ipify.org?format=json");
    ipOrigem = ipRes.data.ip;
  } catch (error) {
    console.error("Erro ao obter IP:", error.message);
  }

  if (targetColumn === "approved" && user.nivel_acesso === 0) {
    await updateUserAccess(user.id, 1);
    setPendingUsers((prev) => prev.filter((u) => u.id !== user.id));
    setApprovedUsers((prev) => [...prev, { ...user, nivel_acesso: 1 }]);

    // 🔒 Log de auditoria: aprovação
    try {
      await axios.post(
        `${API_BASE_URL}/auth/drag-drop-auditoria"```,
        {
          acao: `Aprovou o usuário ID ${user.id} via drag and drop.`,
          ip_origem: ipOrigem,
          alvo_id: user.id // 👈 Aqui
        },
        { headers: { Authorization: `Bearer ${token}` } }
      );      
    } catch (error) {
      console.error("Erro ao registrar auditoria:", error.message);
    }

    // Alerta
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

    // 🔒 Log de auditoria: remoção
    try {
      await axios.post(
        `${API_BASE_URL}/auth/drag-drop-auditoria`,
        {
          acao: `Removeu o usuário ID ${user.id} da autorização via drag and drop.`,
          ip_origem: ipOrigem,
          alvo_id: user.id // 👈 Aqui também
        },
        { headers: { Authorization: `Bearer ${token}` } }
      );           
    } catch (error) {
      console.error("Erro ao registrar auditoria:", error.message);
    }

    // Alerta
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
        `${API_BASE_URL}/auth/update-user`,
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
        `${API_BASE_URL}/auth/update-user`,
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
  
      toast.success(`✅ Dados de ${selectedUser.nome} atualizados com sucesso!`, {
        position: "top-right",
        autoClose: 3000,
        hideProgressBar: false,
        closeOnClick: true,
        pauseOnHover: true,
        draggable: true,
        theme: "dark",
      });
  
      setSelectedUser(null); // Fecha o modal
    } catch (error) {
      console.error(
        "Erro ao atualizar usuário:",
        error.response?.data || error.message
      );
  
      toast.error("❌ Erro ao atualizar os dados do usuário.", {
        position: "top-right",
        autoClose: 4000,
        hideProgressBar: false,
        closeOnClick: true,
        pauseOnHover: true,
        draggable: true,
        theme: "dark",
      });
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
    <>
    {loading ? <Loader /> : <div className="administration-container">
      <ToastContainer />  {/* Isso é necessário para exibir os alertas */}
      

      <div className="tabela-usuarios">
        <h1>Controle de Usuarios</h1>
        <table className="admin-user-table">
          <thead>
            <tr>
              <th>Nome ↓</th>
              <th>E-mail ↓</th>
              <th>Função ↓</th>
              <th>Nível ↓</th>
              <th>Programa Associado ↓</th>
              <th>Notícias ↓</th>
              <th>Status ↓</th>
              <th>Ação</th>
            </tr>
          </thead>
          <tbody>
            {[...approvedUsers, ...pendingUsers].map((user) => (
              <tr key={user.id}>
                <td>{user.nome}</td>
                <td>{user.email}</td>
                <td>{user.cargo || "Nenhum"}</td>
                <td>{accessLevels[user.nivel_acesso] || "Nenhum"}</td>
                <td>
                  {user.programa_id === 1
                    ? "Café com Resenhas"
                    : user.programa_id === 2
                    ? "Jr Esportes"
                    : user.programa_id === 3
                    ? "Jr Notícias"
                    : "Nenhum"}
                </td>
                <td>{user.total_noticias || 0}</td>
                <td>{user.nivel_acesso > 0 ? "Ativo" : "Inativo"}</td>
                <td>
                  <button className="edit-btn" onClick={() => openEditModal(user)}>
                    <img src="/img/edit.png" alt="Editar" />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>


      {selectedUser && (
        <div className="modal">
          <div className="modal-user-card dark-theme">
            <div className="modal-left">
              <div className="user-profile-pic">
                <img
                  src={
                    selectedUser.perfil_imagem
                      ? `${API_BASE_URL}${selectedUser.perfil_imagem}`
                      : "/img/user.jpg"
                  }
                  alt="Perfil"
                />
              </div>
              <h2>{selectedUser.nome}</h2>
              <p>{selectedUser.email}</p>
              <p><b>Total de Notícias:</b> {selectedUser.total_noticias || 0}</p>
              <p><b>Status:</b> {selectedUser.nivel_acesso > 0 ? "Ativo" : "Inativo"}</p>
              <button
                className={`button ${selectedUser.nivel_acesso > 0 ? 'cancel' : ''}`}
                onClick={() => handleToggleUserStatus(selectedUser)}
              >
                {selectedUser.nivel_acesso > 0 ? "Desativar Usuário" : "Ativar Usuário"}
              </button>

            </div>

            <div className="modal-right">
              <h3>Editar Dados</h3>
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
              <div className="modal-buttons">
                <button className="button" onClick={handleConfirmChanges}>Salvar</button>
                <button className="button cancel" onClick={closeModal}>Cancelar</button>
              </div>
            </div>
          </div>
        </div>
      )}

      <div className="dashboard-administration">
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
          <h3>Gerar Relatorios de Admin</h3>

          <div className="relatorio-form">
            <label>
              Data Início:
              <input
                type="date"
                value={dataInicio}
                onChange={(e) => setDataInicio(e.target.value)}
              />
            </label>
            <label>
              Data Fim:
              <input
                type="date"
                value={dataFim}
                onChange={(e) => setDataFim(e.target.value)}
              />
            </label>
            <label>
              Formato:
              <select value={formatoRelatorio} onChange={(e) => setFormatoRelatorio(e.target.value)}>
                <option value="pdf">PDF</option>
                <option value="excel" disabled>Excel (em breve)</option>
                <option value="doc" disabled>DOC (em breve)</option>
              </select>
            </label>
            <button className="button" onClick={handleGerarRelatorio}>Gerar Relatório</button>
          </div>
        </div>

        <div className="admin-ds-div4 dashboard-box">
          <h3>Relatórios Gerados</h3>

          {relatorios.length === 0 ? (
            <p>Nenhum relatório disponível.</p>
          ) : (
            <table className="tabela-relatorios">
              <thead>
                <tr>
                  <th>Nome</th>
                  <th>Data do Relatório</th>
                  <th>Tipo</th>
                  <th>Data de Criação</th>
                  <th>Arquivo</th>
                </tr>
              </thead>
              <tbody>
                {relatorios.map((rel) => {
                  const nomeArquivo = rel.caminho_arquivo.split("/").pop();
                  const tipo = nomeArquivo.includes("Admin") ? "Admin" : "Rotina";
                  return (
                    <tr key={rel.id}>
                      <td className="archive-name">{nomeArquivo}</td>
                      <td className="archive-date">{new Date(rel.data_relatorio).toLocaleDateString()}</td>
                      <td className="type-archive">{tipo}</td>
                      <td className="">{new Date(rel.criado_em).toLocaleString()}</td>
                      <td className="archive-download">
                      <a
                        className="button"
                        href={`${API_BASE_URL}/${rel.caminho_arquivo}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        download
                      >
                        Visualizar
                      </a>



                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </div>


          <div className="admin-ds-div6 dashboard-box">
            <h2>Categorias e Programas</h2>


          <div className="categories-programs">
              <div className="categories-container">
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
                </div>

                <div className="programs-container">
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

          <div className="admin-ds-div5 dashboard-box">
          <h3>Controle de Anúncios</h3>
          <table className="admin-anuncios-table">
            <thead>
              <tr>
                <th>Bloco do Anúncio</th>
                <th>Empresa</th>
                <th>Tipo</th>
                <th>Status</th>
                <th>Valor</th>
                <th>Contrato</th>
                <th>Ações</th>
              </tr>
            </thead>
            <tbody>
              {anuncios.map((anuncio) => (
                <tr key={anuncio.id}>
                  <td>{anuncio.espaco_id}</td>
                  <td>{anuncio.nome_empresa || "-"}</td>
                  <td>{anuncio.tipo}</td>
                  <td>{anuncio.ativo ? "Ativo" : "Inativo"}</td>
                  <td>R$ {anuncio.valor}</td>
                  <td>
                    {anuncio.contrato ? (
                      <a href={anuncio.contrato} target="_blank" rel="noopener noreferrer">Ver</a>
                    ) : "-"}
                  </td>
                  <td>
                    <button
                      className={`button ${anuncio.ativo ? "cancel" : ""}`}
                      onClick={async () => {
                        try {
                          await axios.put(`${API_BASE_URL}/anuncios/${anuncio.id}/status`, {
                            ativo: anuncio.ativo ? 0 : 1,
                          });
                          toast.success("✅ Status alterado!");
                          setAnuncios((prev) =>
                            prev.map((a) =>
                              a.id === anuncio.id ? { ...a, ativo: anuncio.ativo ? 0 : 1 } : a
                            )
                          );
                        } catch (error) {
                          console.error("Erro ao alterar status:", error);
                          toast.error("❌ Erro ao alterar status");
                        }
                      }}
                    >
                      {anuncio.ativo ? "Desativar" : "Ativar"}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>


        <div className="admin-ds-div7 dashboard-box">
  <h3>Cadastro de Anúncios</h3>
  <div className="form-group">

    <label>Bloco de Anúncio:</label>
    <select
      value={novoAnuncio.espaco_id}
      onChange={(e) => setNovoAnuncio({ ...novoAnuncio, espaco_id: e.target.value })}
    >
      <option value="">Selecione...</option>
      <option value={1}>Topo - Horizontal</option>
      <option value={2}>Sidebar - Vertical</option>
      <option value={3}>Rodapé - Horizontal</option>
      <option value={4}>Meio da Lista</option>
    </select>

    <label>Empresa:</label>
    <input
      type="text"
      value={novoAnuncio.nome_empresa}
      onChange={(e) => setNovoAnuncio({ ...novoAnuncio, nome_empresa: e.target.value })}
    />

    <label>Tipo:</label>
    <select
      value={novoAnuncio.tipo}
      onChange={(e) => setNovoAnuncio({ ...novoAnuncio, tipo: e.target.value })}
    >
      <option value="banner">Banner</option>
      <option value="google">Google</option>
    </select>

    {novoAnuncio.tipo === "banner" && (
      <>
        <label>Imagem do Anúncio:</label>
        <input
          type="file"
          accept="image/*"
          onChange={(e) => setNovoAnuncio({ ...novoAnuncio, imagemFile: e.target.files[0] })}
        />

        <label>Link ao clicar no banner:</label>
        <input
          type="text"
          value={novoAnuncio.link}
          onChange={(e) => setNovoAnuncio({ ...novoAnuncio, link: e.target.value })}
        />
      </>
    )}

    {novoAnuncio.tipo === "google" && (
      <>
        <label>Google Client ID:</label>
        <input
          type="text"
          value={novoAnuncio.google_client_id}
          onChange={(e) => setNovoAnuncio({ ...novoAnuncio, google_client_id: e.target.value })}
        />

        <label>Google Slot:</label>
        <input
          type="text"
          value={novoAnuncio.google_slot}
          onChange={(e) => setNovoAnuncio({ ...novoAnuncio, google_slot: e.target.value })}
        />
      </>
    )}

    <label>Valor do Anúncio:</label>
    <input
      type="number"
      value={novoAnuncio.valor}
      onChange={(e) => setNovoAnuncio({ ...novoAnuncio, valor: e.target.value })}
    />

    <label>Contrato (PDF):</label>
    <input
      type="file"
      accept="application/pdf"
      onChange={(e) => setNovoAnuncio({ ...novoAnuncio, contratoFile: e.target.files[0] })}
    />

    <label>Início do Contrato:</label>
    <input
      type="date"
      value={novoAnuncio.inicio_contrato}
      onChange={(e) => setNovoAnuncio({ ...novoAnuncio, inicio_contrato: e.target.value })}
    />

    <label>Fim do Contrato:</label>
    <input
      type="date"
      value={novoAnuncio.fim_contrato}
      onChange={(e) => setNovoAnuncio({ ...novoAnuncio, fim_contrato: e.target.value })}
    />

    <button
      className="button"
      onClick={async () => {
        try {
          const formData = new FormData();
          formData.append("espaco_id", novoAnuncio.espaco_id);
          formData.append("nome_empresa", novoAnuncio.nome_empresa);
          formData.append("tipo", novoAnuncio.tipo);
          formData.append("valor", novoAnuncio.valor);
          formData.append("inicio_contrato", novoAnuncio.inicio_contrato);
          formData.append("fim_contrato", novoAnuncio.fim_contrato);

          if (novoAnuncio.tipo === "banner") {
            formData.append("imagem", novoAnuncio.imagemFile);
            formData.append("link", novoAnuncio.link || "");
          }

          if (novoAnuncio.tipo === "google") {
            formData.append("google_client_id", novoAnuncio.google_client_id);
            formData.append("google_slot", novoAnuncio.google_slot);
          }

          if (novoAnuncio.contratoFile) {
            formData.append("contrato", novoAnuncio.contratoFile);
          }

          await axios.post(`${API_BASE_URL}/anuncios`, formData, {
            headers: {
              "Content-Type": "multipart/form-data",
            },
          });

          toast.success("✅ Anúncio cadastrado com sucesso!");

          setNovoAnuncio({
            espaco_id: "",
            nome_empresa: "",
            tipo: "banner",
            imagemFile: null,
            link: "",
            google_client_id: "",
            google_slot: "",
            valor: "",
            contratoFile: null,
            inicio_contrato: "",
            fim_contrato: "",
          });
        } catch (err) {
          console.error(err);
          toast.error("❌ Erro ao cadastrar anúncio");
        }
      }}
    >
      Cadastrar
    </button>
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

    </div>}
    </>
  );
};

export default Administration;
