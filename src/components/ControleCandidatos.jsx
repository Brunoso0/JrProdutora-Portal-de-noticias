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
        axios.get(`${API_FESTIVAL}/api/etapas/listar`)
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
        lista = lista.filter((c) => c.fase_atual === etapaSelecionada && c.eliminado !== 1);
      }
    }

    if (ordem === "asc") {
      lista.sort((a, b) => a.nome.localeCompare(b.nome));
    } else if (ordem === "desc") {
      lista.sort((a, b) => b.nome.localeCompare(a.nome));
    }

    return lista;
  }, [candidatos, busca, ordem, etapaSelecionada]);

  return (
    <div className="candidatos-container">
      <div className="filter-candidatos">
        <div className="input-group-candidatos">
          <input
            type="text"
            name="text"
            autoComplete="off"
            required
            value={busca}
            onChange={(e) => setBusca(e.target.value)}
            className="input-candidatos"
          />
          <label className="user-label">Pesquisar pelo Nome</label>
        </div>

        <select
          value={ordem}
          onChange={(e) => setOrdem(e.target.value)}
          className="select-ordem-candidato"
        >
          <option value="envio">Ordem de Envio</option>
          <option value="asc">Nome A → Z</option>
          <option value="desc">Nome Z → A</option>
        </select>

        <select
          value={etapaSelecionada}
          onChange={(e) => setEtapaSelecionada(e.target.value)}
          className="select-ordem-candidato"
        >
          <option value="todas">Todas as Etapas</option>
          {etapasPresentes.map((etapa, index) => (
            <option key={index} value={etapa}>
              {etapa}
            </option>
          ))}
        </select>

        <div className="contador-candidatos">
          Total: {candidatosFiltrados.length} candidato{candidatosFiltrados.length !== 1 ? "s" : ""}
        </div>
      </div>

      <div className="grid-candidatos">
        {candidatosFiltrados.map((candidato, index) => (
          <div key={index} className="card-candidato">
            <span
              className={`selo-etapa ${candidato.eliminado === 1 ? "eliminado" : ""}`}
            >
              {candidato.eliminado === 1 ? "Eliminado" : (candidato.fase_atual || "Sem etapa")}
            </span>

            <div className="imagem-candidato">
              {candidato.foto ? (
                <img src={`${API_FESTIVAL}/${candidato.foto}`} alt={candidato.nome} />
              ) : (
                <div className="sem-foto">Sem foto</div>
              )}
            </div>

            <div className="rodape-candidato">
              <span className="nome-candidato">{candidato.nome}</span>
              <div className="botoes-candidato">
                <button className="botao-perfil" onClick={() => setCandidatoSelecionado(candidato)}>
                  Ver Perfil
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="footer-festival-candidatos">
        <FooterFestival />
      </div>

      <ModalCandidato
        candidato={candidatoSelecionado}
        onClose={() => setCandidatoSelecionado(null)}
        onUpdate={fetchData}
      />

      <ToastContainer position="top-right" autoClose={3000} hideProgressBar pauseOnHover draggable theme="colored" />
    </div>
  );
};

export default ControleCandidatos;
