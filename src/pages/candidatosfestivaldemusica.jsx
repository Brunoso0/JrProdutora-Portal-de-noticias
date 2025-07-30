import React, { useEffect, useState, useMemo } from "react";
import "../styles/CandidatosFestival.css";
import FooterFestival from "../components/FooterFestival";
import ModalCandidato from "../components/ModalCandidato";
import ModalAvaliacao from "../components/ModalAvaliacao";
import axios from "axios";
import { API_FESTIVAL } from "../services/api";
import { ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

const CandidatosFestivalDeMusica = () => {
  const [candidatos, setCandidatos] = useState([]);
  const [busca, setBusca] = useState("");
  const [ordem, setOrdem] = useState("envio");
  const [candidatoSelecionado, setCandidatoSelecionado] = useState(null);
  const [candidatoParaAvaliar, setCandidatoParaAvaliar] = useState(null);
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

      const apenasAptos = candidatosRes.data.filter(c => c.votacao === 1);
      setCandidatos(apenasAptos);
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

  const removerAcentos = (str) =>
    str ? str.normalize("NFD").replace(/[\u0300-\u036f]/g, "") : "";

  return (
    <div className="candidatos-festival-container">
      <div className="candidatos-festival-filter">
        <div className="candidatos-festival-input-group">
          <input
            type="text"
            name="text"
            autoComplete="off"
            required=""
            value={busca}
            onChange={(e) => setBusca(e.target.value)}
            className="candidatos-festival-input"
          />
          <label className="candidatos-festival-label">Pesquisar pelo Nome</label>
        </div>

        <select
          value={ordem}
          onChange={(e) => setOrdem(e.target.value)}
          className="candidatos-festival-select"
        >
          <option value="envio">Ordem de Envio</option>
          <option value="asc">Nome A → Z</option>
          <option value="desc">Nome Z → A</option>
        </select>

        <select
          value={etapaSelecionada}
          onChange={(e) => setEtapaSelecionada(e.target.value)}
          className="candidatos-festival-select"
        >
          <option value="todas">Todas as Etapas</option>
          {etapasPresentes.map((etapa, index) => (
            <option key={index} value={etapa}>
              {etapa}
            </option>
          ))}
        </select>

        <div className="candidatos-festival-contador">
          Total: {candidatosFiltrados.length} candidato{candidatosFiltrados.length !== 1 ? "s" : ""}
        </div>
      </div>

      <div className="candidatos-festival-grid">
        {candidatosFiltrados.map((candidato, index) => (
          <div key={index} className="candidatos-festival-card">
            <span
              className={`candidatos-festival-selo-etapa ${candidato.eliminado === 1 ? "eliminado" : ""}`}
            >
              {candidato.eliminado === 1 ? "Eliminado" : (candidato.fase_atual || "Sem etapa")}
            </span>

            <div className="candidatos-festival-imagem">
              {candidato.foto ? (
                <img src={`${API_FESTIVAL}/${candidato.foto}`} alt={candidato.nome_artistico} />
              ) : (
                <div className="candidatos-festival-sem-foto">Sem foto</div>
              )}
            </div>

            <div className="candidatos-festival-rodape">
              <span className="candidatos-festival-nome">{candidato.nome_artistico}</span>
              <div className="candidatos-festival-botoes">
                <button className="candidatos-festival-botao" onClick={() => setCandidatoSelecionado(candidato)}>
                  Ver Perfil
                </button>
                <button className="candidatos-festival-botao" onClick={() => setCandidatoParaAvaliar(candidato)}>
                  Avaliar
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="candidatos-festival-footer">
        <FooterFestival />
      </div>

      <ModalCandidato
        candidato={candidatoSelecionado}
        onClose={() => setCandidatoSelecionado(null)}
        onUpdate={fetchData}
      />
      <ModalAvaliacao
        candidato={candidatoParaAvaliar}
        onClose={() => setCandidatoParaAvaliar(null)}
        onUpdate={fetchData}
        removerAcentos={removerAcentos} // Passamos essa função para uso interno
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

export default CandidatosFestivalDeMusica;
