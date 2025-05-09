import React, { useEffect, useState, useMemo } from "react";
import axios from "axios";
import FooterFestival from "../components/FooterFestival";
import { API_FESTIVAL } from "../services/api";
import "../styles/AreaDoCandidato.css";

const AreaDoCandidato = () => {
  const [candidato, setCandidato] = useState(null);
  const [etapas, setEtapas] = useState([]);
  const [etapaSelecionada, setEtapaSelecionada] = useState(null);
  const [notas, setNotas] = useState(null);
  const [modalAberto, setModalAberto] = useState(false);
  const [votosBinarios, setVotosBinarios] = useState([]);

  const candidatoId = localStorage.getItem("candidatoId");

  useEffect(() => {
    if (!candidatoId) return;

    axios.get(`${API_FESTIVAL}/api/inscricoes/${candidatoId}`)
      .then(res => {
        setCandidato(res.data);
      })
      .catch(() => setCandidato(null));

    axios.get(`${API_FESTIVAL}/api/inscricoes/etapas`)
      .then(res => setEtapas(res.data))
      .catch(() => setEtapas([]));
  }, [candidatoId]);

  const etapasExibidas = useMemo(() => {
    if (!candidato || !etapas.length) return [];
    const indexAtual = etapas.findIndex(e => e.nome === candidato.fase_atual);
    return etapas.slice(0, indexAtual + 1);
  }, [etapas, candidato]);

  useEffect(() => {
    if (etapasExibidas.length > 0 && !etapaSelecionada) {
      setEtapaSelecionada(etapasExibidas[0].id);
    }
  }, [etapasExibidas, etapaSelecionada]);

  useEffect(() => {
    if (!etapaSelecionada || !candidatoId) return;

    axios.get(`${API_FESTIVAL}/api/inscricoes/notas/${candidatoId}/${etapaSelecionada}`)
      .then(res => setNotas(res.data))
      .catch(() => setNotas(null));

    axios.get(`${API_FESTIVAL}/api/jurados/votos-binarios/${candidatoId}/${etapaSelecionada}`)
      .then(res => setVotosBinarios(res.data))
      .catch(() => setVotosBinarios([]));
  }, [etapaSelecionada, candidatoId]);

  const abrirModal = () => setModalAberto(true);
  const fecharModal = () => setModalAberto(false);

  const fotoCandidato = candidato?.foto
    ? `${API_FESTIVAL}/${candidato.foto.replace(/^\/?uploads/, "uploads")}`
    : "/img/exemplo-perfil.jpg";

  return (
    <div className="area-candidato-container">
      <header className="area-candidato-header">
        <div className="perfil">
          <img
            src={fotoCandidato}
            alt="Foto perfil"
            className="foto-perfil"
            onError={(e) => (e.target.src = "/img/exemplo-perfil.jpg")}
          />
          <div>
            <h2>{candidato?.nome || "Nome do Candidato"}</h2>
            <p>{candidato?.eliminado ? "❌ Eliminado" : (candidato?.fase_atual || "Fase atual")}</p>
          </div>
        </div>
        <button className="botao-atualizar" onClick={abrirModal}>
          Atualizar meus dados
        </button>
      </header>

      <main className="area-candidato-main">
        <h3>Tabela de Notas</h3>
        <p>Escolha a etapa para visualizar:</p>
        <select
          className="select-etapa"
          value={etapaSelecionada || ""}
          onChange={(e) => setEtapaSelecionada(e.target.value)}
        >
          {etapasExibidas.map((etapa) => (
            <option key={etapa.id} value={etapa.id}>
              {etapa.nome}
            </option>
          ))}
        </select>

        <div className="tabela-notas">
          {notas ? (
            notas.tipo === "criterios" ? (
              <>
                {notas.jurados.map((nota, index) => (
                  <div key={index} className="linha-nota">
                    <div className="jurado-info">
                      <img
                        src={`${API_FESTIVAL}/${nota.foto_jurado}`}
                        alt="jurado"
                        onError={(e) => (e.target.src = "/img/exemplo-perfil.jpg")}
                      />
                      <strong>{nota.nome_jurado}</strong>
                    </div>
                    <div className="nota-valores">
                      {nota.criterios.map((c, i) => (
                        <div key={i}>
                          {c.criterio}: {c.nota} ({c.justificativa})
                        </div>
                      ))}
                      <strong>Total: {nota.total}</strong>
                    </div>
                  </div>
                ))}
                <div className="linha-nota popular">
                  <strong>Voto Popular:</strong> {notas.popular} votos
                </div>
              </>
            ) : (
              <>
                {notas.votos.map((voto, index) => (
                  <div key={index} className="linha-nota">
                    <div className="jurado-info">
                      <img
                        src={`${API_FESTIVAL}/${voto.foto_jurado}`}
                        alt="jurado"
                        onError={(e) => (e.target.src = "/img/exemplo-perfil.jpg")}
                      />
                      <strong>{voto.nome_jurado}</strong>
                    </div>
                    <div className="nota-valores">
                      <strong>{voto.aprovado === "sim" ? "Aprovado" : "Reprovado"}</strong>
                      {voto.aprovado === "nao" && (
                        <div>
                          <em>Justificativa:</em> {voto.justificativa}
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </>
            )
          ) : (
            <p style={{ padding: "2rem", textAlign: "center" }}>
              Notas ainda não disponíveis
            </p>
          )}
        </div>

      </main>

      {modalAberto && (
        <div className="modal-overlay" onClick={fecharModal}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <h3>Atualizar Meus Dados</h3>
            <p>Aqui virá o formulário de edição (ainda não implementado)</p>
            <button onClick={fecharModal}>Fechar</button>
          </div>
        </div>
      )}

      <FooterFestival />
    </div>
  );
};

export default AreaDoCandidato;
