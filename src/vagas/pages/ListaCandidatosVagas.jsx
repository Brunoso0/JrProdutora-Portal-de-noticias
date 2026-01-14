import React, { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import { API_VAGAS } from "../../services/api";
import "../styles/ListaCandidatosVagasNew.css";

const ListaCandidatosVagas = () => {
  const navigate = useNavigate();
  const [candidatos, setCandidatos] = useState([]);
  const [busca, setBusca] = useState("");
  const [ordem, setOrdem] = useState("");
  const [curriculoUrl, setCurriculoUrl] = useState(null);
  const [imagemUrl, setImagemUrl] = useState(null);
  const [loading, setLoading] = useState(true);

  // Estados dos filtros
  const [vagaFilter, setVagaFilter] = useState("");
  const totalCandidatos = candidatos.length;
  // Conta quantas vagas únicas existem na lista atual
  const vagasAtivas = [...new Set(candidatos.map((c) => c.vaga))].length;

  const token = localStorage.getItem("vagas_token");

  const sair = () => {
    localStorage.removeItem("vagas_token");
    navigate("/vagas/login");
  };

  useEffect(() => {
    const fetchCandidatos = async () => {
      if (!token) return sair();
      setLoading(true);
      try {
        const response = await axios.get(
          `${API_VAGAS}/jrprodutora/listar/all`,
          { headers: { Authorization: `Bearer ${token}` } }
        );
        setCandidatos(response.data || []);
      } catch (error) {
        if (error.response?.status === 401) sair();
        toast.error("Erro ao carregar candidatos.", { autoClose: 3000 });
      } finally {
        setLoading(false);
      }
    };
    fetchCandidatos();
    // eslint-disable-next-line
  }, []);

  const candidatosFiltrados = useMemo(() => {
    let lista = [...candidatos];
    if (busca.trim()) {
      lista = lista.filter((c) =>
        c.nome?.toLowerCase().includes(busca.toLowerCase())
      );
    }
    if (vagaFilter) {
      lista = lista.filter((c) => c.vaga === vagaFilter);
    }
    // Ordenação
    if (ordem === "asc") lista.sort((a, b) => a.id - b.id);
    else if (ordem === "desc") lista.sort((a, b) => b.id - a.id);
    else if (ordem === "az") lista.sort((a, b) => a.nome.localeCompare(b.nome));
    else if (ordem === "za") lista.sort((a, b) => b.nome.localeCompare(a.nome));

    return lista;
  }, [busca, ordem, candidatos, vagaFilter]);

  const vagasUnicas = useMemo(() => {
    return [...new Set(candidatos.map((c) => c.vaga))].sort();
  }, [candidatos]);

  return (
    <div className="lista-container">
      <ToastContainer theme="dark" />
      
      {/* Header Estilo Dashboard */}
      <header className="lista-header">
        <div className="header-title-area">
          <div className="title-decoration"></div>
          <div>
            <h1>Gestão de Candidatos</h1>
            <p>Gerencie as aplicações recebidas recentemente.</p>
          </div>
        </div>

        {/* Stats agora ficam no Header à direita */}
        <div className="header-stats">
          <div className="stat-box">
            <span className="stat-num">{totalCandidatos}</span>
            <span className="stat-desc">CANDIDATOS</span>
          </div>
          <div className="stat-box">
            <span className="stat-num">{vagasAtivas}</span>
            <span className="stat-desc">VAGAS ATIVAS</span>
          </div>
        </div>
      </header>

      {/* Barra de Filtros Escura */}
      <div className="filtros-container">
        <div className="filtro-group search-group">
          <label>BUSCAR</label>
          <div className="input-search">
            <i className="fas fa-search"></i>
            <input
              type="text"
              placeholder="Nome do candidato..."
              value={busca}
              onChange={(e) => setBusca(e.target.value)}
            />
          </div>
        </div>

        <div className="filtro-group">
          <label>VAGA</label>
          <select value={vagaFilter} onChange={(e) => setVagaFilter(e.target.value)}>
            <option value="">Todas as Vagas</option>
            {vagasUnicas.map((v) => <option key={v} value={v}>{v}</option>)}
          </select>
        </div>

        <div className="filtro-group">
          <label>ORDENAR POR</label>
          <select value={ordem} onChange={(e) => setOrdem(e.target.value)}>
            <option value="">Mais Recentes</option>
            <option value="az">Nomes A - Z</option>
            <option value="za">Nomes Z - A</option>
          </select>
        </div>
      </div>

      {/* Grid de Cards */}
      {loading ? (
        <div className="loading-state"><i className="fas fa-circle-notch fa-spin"></i></div>
      ) : (
        <div className="cards-grid">
          {candidatosFiltrados.map((candidato) => {
            return (
              <div key={candidato.id} className="candidate-card">

                <div className="card-top-section">
                  <div className="avatar-wrapper" onClick={() => candidato.foto && setImagemUrl(`https://api.jrcoffee.com.br:5002${candidato.foto}`)}>
                     <img
                      src={candidato.foto ? `https://api.jrcoffee.com.br:5002${candidato.foto}` : "/img/default-profile.png"}
                      alt={candidato.nome}
                      className="candidate-avatar"
                    />
                  </div>
                  <div className="header-info">
                    <h3 className="candidate-name">{candidato.nome}</h3>
                    <p className="candidate-role">{candidato.vaga}</p>
                  </div>
                </div>

                <div className="card-details">
                  <div className="detail-item">
                    <i className="fas fa-envelope"></i>
                    <span>{candidato.email}</span>
                  </div>
                  <div className="detail-item">
                    <i className="fas fa-phone"></i>
                    <span>{candidato.telefone}</span>
                  </div>
                  <div className="detail-item">
                    <i className="fas fa-calendar"></i>
                    <span>{new Date(candidato.created_at || Date.now()).toLocaleDateString('pt-BR')}</span>
                  </div>
                </div>

                <button
                  className="btn-ver-curriculo"
                  onClick={() => candidato.curriculo_pdf && setCurriculoUrl(`https://api.jrcoffee.com.br:5002${candidato.curriculo_pdf}`)}
                  disabled={!candidato.curriculo_pdf}
                >
                  <i className="fas fa-file-pdf"></i> Ver Currículo
                </button>
              </div>
            );
          })}
        </div>
      )}

      {/* Modais (Mantidos iguais) */}
      {curriculoUrl && (
        <div className="modal-overlay" onClick={() => setCurriculoUrl(null)}>
          <div className="modal-curriculo">
            <iframe src={curriculoUrl} title="Currículo" className="curriculo-iframe" />
            <button className="close-modal" onClick={() => setCurriculoUrl(null)}>FECHAR</button>
          </div>
        </div>
      )}
      {imagemUrl && (
         <div className="modal-overlay" onClick={() => setImagemUrl(null)}>
           <img src={imagemUrl} className="modal-img-full" alt="Zoom" />
         </div>
      )}
    </div>
  );
};

export default ListaCandidatosVagas;