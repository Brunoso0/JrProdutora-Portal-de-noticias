import React, { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import { API_VAGAS } from "../../services/api";
import "../styles/ListaCandidatosVagas.css";

const ListaCandidatosVagas = () => {
  const navigate = useNavigate();
  const [candidatos, setCandidatos] = useState([]);
  const [busca, setBusca] = useState("");
  const [ordem, setOrdem] = useState("");
  const [curriculoUrl, setCurriculoUrl] = useState(null);
  const [imagemUrl, setImagemUrl] = useState(null);
  const [loading, setLoading] = useState(true);

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
          {
            headers: { Authorization: `Bearer ${token}` },
          }
        );
        setCandidatos(response.data || []);
      } catch (error) {
        if (error.response?.status === 401) sair();
        toast.error(
          error.response?.data?.message || "Erro ao carregar candidatos.",
          { autoClose: 3000 }
        );
      } finally {
        setLoading(false);
      }
    };

    fetchCandidatos();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const candidatosFiltrados = useMemo(() => {
    let lista = [...candidatos];

    if (busca.trim()) {
      lista = lista.filter((c) =>
        c.nome?.toLowerCase().includes(busca.toLowerCase())
      );
    }

    if (ordem === "asc") {
      lista.sort((a, b) => a.id - b.id);
    } else if (ordem === "desc") {
      lista.sort((a, b) => b.id - a.id);
    } else if (ordem === "az") {
      lista.sort((a, b) => a.nome.localeCompare(b.nome));
    } else if (ordem === "za") {
      lista.sort((a, b) => b.nome.localeCompare(a.nome));
    }

    return lista;
  }, [busca, ordem, candidatos]);

  return (
    <div className="lista-container">
      <ToastContainer />
      <header className="lista-header">
        <div>
          <h2>Candidatos</h2>
          <p>Visualize os inscritos nas vagas.</p>
        </div>
        <div className="header-actions">
          <button className="logout-btn" onClick={sair}>
            Sair
          </button>
        </div>
      </header>

      <div className="filtros">
        <div className="filtro-item">
          <label>Buscar</label>
          <input
            type="text"
            placeholder="Nome do candidato"
            value={busca}
            onChange={(e) => setBusca(e.target.value)}
          />
        </div>
        <div className="filtro-item">
          <label>Ordenar</label>
          <select value={ordem} onChange={(e) => setOrdem(e.target.value)}>
            <option value="">Selecione</option>
            <option value="asc">Primeiros a enviar</option>
            <option value="desc">Últimos a enviar</option>
            <option value="az">Nomes A - Z</option>
            <option value="za">Nomes Z - A</option>
          </select>
        </div>
      </div>

      {loading ? (
        <div className="loading">Carregando candidatos...</div>
      ) : (
        <div className="cards-grid">
          {candidatosFiltrados.map((candidato) => (
            <div key={candidato.id} className="card">
              <div className="card-row">
                <img
                  src={
                    candidato.foto
                      ? `https://api.jrcoffee.com.br:5002${candidato.foto}`
                      : "/img/default-profile.png"
                  }
                  alt={candidato.nome}
                  className="card-foto"
                  onClick={() =>
                    candidato.foto &&
                    setImagemUrl(
                      `https://api.jrcoffee.com.br:5002${candidato.foto}`
                    )
                  }
                  style={{
                    cursor: candidato.foto ? "pointer" : "default",
                  }}
                />
                <div className="card-info">
                  <strong>{candidato.nome}</strong>
                  <p>Vaga: {candidato.vaga}</p>
                  <small>Email: {candidato.email}</small>
                  <small>Telefone: {candidato.telefone}</small>
                  <button
                    className="curriculo-btn"
                    onClick={() =>
                      candidato.curriculo_pdf &&
                      setCurriculoUrl(
                        `https://api.jrcoffee.com.br:5002${candidato.curriculo_pdf}`
                      )
                    }
                    disabled={!candidato.curriculo_pdf}
                  >
                    Ver currículo
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {curriculoUrl && (
        <div className="modal-overlay" onClick={() => setCurriculoUrl(null)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <button
              className="modal-close"
              onClick={() => setCurriculoUrl(null)}
            >
              ✖
            </button>
            <iframe
              src={curriculoUrl}
              title="Currículo"
              className="curriculo-viewer"
            />
          </div>
        </div>
      )}

      {imagemUrl && (
        <div className="modal-overlay" onClick={() => setImagemUrl(null)}>
          <div className="modal-content-imagem" onClick={(e) => e.stopPropagation()}>
            <button
              className="modal-close"
              onClick={() => setImagemUrl(null)}
            >
              ✖
            </button>
            <img
              src={imagemUrl}
              alt="Foto em tamanho original"
              className="imagem-viewer"
            />
          </div>
        </div>
      )}
    </div>
  );
};

export default ListaCandidatosVagas;
