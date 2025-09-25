import React, { useEffect, useState, useMemo } from "react";
import "../styles/CandidatosFestival.css";
import FooterFestival from "../components/FooterFestival";
import ModalCandidato from "../components/ModalCandidato";
import axios from "axios";
import { API_FESTIVAL } from "../services/api";
import { ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

const ControleCandidatos = () => {
  const [candidatos, setCandidatos] = useState([]);
  const [busca, setBusca] = useState("");
  const [ordem, setOrdem] = useState("envio");
  const [candidatoSelecionado, setCandidatoSelecionado] = useState(null);
  const [etapas, setEtapas] = useState([]);
  const [etapaSelecionada, setEtapaSelecionada] = useState("todas");

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [candidatosRes, etapasRes] = await Promise.all([
        axios.get(`${API_FESTIVAL}/api/inscricoes/listar`),
        axios.get(`${API_FESTIVAL}/api/etapas/listar`),
      ]);
      setCandidatos(candidatosRes.data);
      setEtapas(etapasRes.data);
    } catch (error) {
      console.error("Erro ao buscar dados:", error);
    }
  };

  const etapasPresentes = useMemo(() => {
    const etapasUnicas = new Set();
    let possuiEliminado = false;

    candidatos.forEach((c) => {
      if (c.eliminado === 1) {
        possuiEliminado = true;
      } else if (c.fase_atual) {
        etapasUnicas.add(c.fase_atual);
      }
    });

    const lista = Array.from(etapasUnicas);
    if (possuiEliminado) lista.push("Eliminado");
    return lista;
  }, [candidatos]);

  const candidatosFiltrados = useMemo(() => {
    let lista = [...candidatos];

    if (busca.trim()) {
      lista = lista.filter((c) =>
        c.nome.toLowerCase().includes(busca.toLowerCase())
      );
    }

    if (etapaSelecionada !== "todas") {
      if (etapaSelecionada === "Eliminado") {
        lista = lista.filter((c) => c.eliminado === 1);
      } else {
        lista = lista.filter(
          (c) => c.fase_atual === etapaSelecionada && c.eliminado !== 1
        );
      }
    }

    if (ordem === "asc") {
      lista.sort((a, b) => a.nome.localeCompare(b.nome));
    } else if (ordem === "desc") {
      lista.sort((a, b) => b.nome.localeCompare(a.nome));
    }
    return lista;
  }, [candidatos, busca, ordem, etapaSelecionada]);

  // badge por status
  const badgeClass = (c) => {
    if (c.eliminado === 1) return "badge badge--eliminado";
    if ((c.fase_atual || "").toLowerCase().includes("final")) return "badge badge--final";
    if ((c.fase_atual || "").toLowerCase().includes("primeira")) return "badge badge--primeira";
    return "badge";
  };

  const badgeText = (c) => (c.eliminado === 1 ? "Eliminado" : c.fase_atual || "Sem etapa");

  const initials = (nome = "") =>
    nome
      .split(" ")
      .filter(Boolean)
      .slice(0, 2)
      .map((p) => p[0]?.toUpperCase())
      .join("");

  return (
    <div className="cand-page">
      {/* barra de filtros (glass) */}
      <header className="cand-filters glass">
        <div className="filters-grid">
          <div className="input-text">
            <input
              type="text"
              placeholder="Pesquisar pelo nome..."
              value={busca}
              onChange={(e) => setBusca(e.target.value)}
            />
            <span className="icon-search" aria-hidden>🔍</span>
          </div>

          <select
            value={etapaSelecionada}
            onChange={(e) => setEtapaSelecionada(e.target.value)}
            className="select"
          >
            <option value="todas">Todas as fases</option>
            {etapasPresentes.map((etapa, index) => (
              <option key={index} value={etapa}>
                {etapa}
              </option>
            ))}
          </select>

          <select
            value={ordem}
            onChange={(e) => setOrdem(e.target.value)}
            className="select"
          >
            <option value="envio">Ordem de envio</option>
            <option value="asc">Nome A → Z</option>
            <option value="desc">Nome Z → A</option>
          </select>

          <div className="total-chip">
            Total: {candidatosFiltrados.length} candidato
            {candidatosFiltrados.length !== 1 ? "s" : ""}
          </div>
        </div>
      </header>

      {/* grid de cards */}
      <main className="cand-grid">
        {candidatosFiltrados.map((c, i) => (
          <article className="cand-card glass" key={i}>
            <span className={badgeClass(c)}>{badgeText(c)}</span>

            <div className="avatar-wrap">
              {c.foto ? (
                <img
                  className="avatar-ver"
                  src={`${API_FESTIVAL}/${c.foto}`}
                  alt={c.nome}
                />
              ) : (
                <div className="avatar-ver avatar--noimg">{initials(c.nome)}</div>
              )}
            </div>

            <h3 className="cand-name">{c.nome}</h3>

            <button
              className="btn-profile"
              onClick={() => setCandidatoSelecionado(c)}
            >
              Ver Perfil
            </button>
          </article>
        ))}
      </main>

    

      <ModalCandidato
        candidato={candidatoSelecionado}
        onClose={() => setCandidatoSelecionado(null)}
        onUpdate={fetchData}
      />

      <ToastContainer
        position="top-right"
        autoClose={3000}
        hideProgressBar
        pauseOnHover
        draggable
        theme="colored"
      />
    </div>
  );
};

export default ControleCandidatos;
