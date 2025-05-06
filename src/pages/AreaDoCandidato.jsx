import React, { useEffect, useState } from "react";
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

  const candidatoId = localStorage.getItem("candidatoId");

  useEffect(() => {
    if (!candidatoId) {
      console.warn("⚠️ Nenhum candidatoId encontrado no localStorage.");
      return;
    }

    // Buscar dados do candidato
    axios
      .get(`${API_FESTIVAL}/api/inscricoes/${candidatoId}`)
      .then((res) => {
        console.log("✅ Candidato:", res.data);
        setCandidato(res.data);
      })
      .catch((err) => {
        console.error("❌ Erro ao buscar candidato:", err);
        setCandidato(null);
      });

    // Buscar etapas (corrigido!)
    axios
      .get(`${API_FESTIVAL}/api/inscricoes/etapas`)
      .then((res) => {
        console.log("✅ Etapas:", res.data);
        setEtapas(res.data);
        if (res.data.length > 0) setEtapaSelecionada(res.data[0].id);
      })
      .catch((err) => {
        console.error("❌ Erro ao buscar etapas:", err);
        setEtapas([]);
      });
  }, [candidatoId]);

  useEffect(() => {
    if (etapaSelecionada && candidatoId) {
      axios
        .get(`${API_FESTIVAL}/api/inscricoes/notas/${candidatoId}/${etapaSelecionada}`)
        .then((res) => {
          console.log("📊 Notas:", res.data);
          setNotas(res.data);
        })
        .catch((err) => {
          console.error("❌ Erro ao carregar notas:", err);
          setNotas(null);
        });
    }
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
            <p>{candidato?.fase_atual || "Fase atual"}</p>
          </div>
        </div>
        <button className="botao-atualizar" onClick={abrirModal}>
          Atualizar meus dados
        </button>
      </header>

      <main className="area-candidato-main">
        <h3>Tabela de Notas</h3>
        <p>Escolha a etapa para visualizar as notas:</p>
        <select
          className="select-etapa"
          value={etapaSelecionada || ""}
          onChange={(e) => setEtapaSelecionada(e.target.value)}
        >
          {etapas.length === 0 ? (
            <option disabled>Carregando etapas...</option>
          ) : (
            etapas.map((etapa) => (
              <option key={etapa.id} value={etapa.id}>
                {etapa.nome}
              </option>
            ))
          )}
        </select>

        <div className="tabela-notas">
          {notas ? (
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
                    Afin.: {nota.afinacao} | Palco: {nota.palco} | Harmonia: {nota.harmonia} | Ritmo: {nota.ritmo} | Autent.: {nota.autenticidade} | Dicção: {nota.diccao} |{" "}
                    <strong>Total: {nota.total}</strong>
                  </div>
                </div>
              ))}
              <div className="linha-nota popular">
                <strong>Voto Popular:</strong> {notas.popular} votos
              </div>
            </>
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
