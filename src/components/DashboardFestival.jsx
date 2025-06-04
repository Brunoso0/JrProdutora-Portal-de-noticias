import React, { useState, useEffect, useRef } from "react";
import axios from "axios";
import "../styles/DashboardFestival.css";
import { API_FESTIVAL } from "../services/api";

const cores = [
  "#9B5DE5", "#F15BB5", "#FBB13C", "#00BBF9", "#46BFDB"
];

const DashboardFestival = () => {
  const [etapas, setEtapas] = useState([]);
  const [candidatos, setCandidatos] = useState([]);
  const [etapaSelecionada, setEtapaSelecionada] = useState("");
  const [candidatoSelecionado, setCandidatoSelecionado] = useState("");
  const [dadosVotacao, setDadosVotacao] = useState(null);
  const [modoTransmissao, setModoTransmissao] = useState(false);
  const containerRef = useRef();
  const intervalRef = useRef(null);

  useEffect(() => {
    axios.get(`${API_FESTIVAL}/api/dashboard/etapas`).then((res) => setEtapas(res.data));
  }, []);

  useEffect(() => {
    if (etapaSelecionada) {
      axios
        .get(`${API_FESTIVAL}/api/dashboard/candidatos/${etapaSelecionada}`)
        .then((res) => setCandidatos(res.data));
    }
  }, [etapaSelecionada]);

  // Atualização em tempo real dos dados de votação
  useEffect(() => {
    if (!etapaSelecionada || !candidatoSelecionado) return;

    let cancel = false;

    const fetchDados = async () => {
      try {
        const res = await axios.get(
          `${API_FESTIVAL}/api/dashboard/notas/${candidatoSelecionado}/${etapaSelecionada}`
        );
        if (!cancel) setDadosVotacao(res.data);
      } catch (err) {
        // opcional: tratar erro
      }
    };

    fetchDados();
    intervalRef.current = setInterval(fetchDados, 3000);

    return () => {
      cancel = true;
      clearInterval(intervalRef.current);
    };
  }, [candidatoSelecionado, etapaSelecionada]);

  useEffect(() => {
    const el = document.getElementById("transmissao-votos");
    const barra = el?.querySelector(".barra-titulo");
    if (barra) {
      let pos1 = 0, pos2 = 0, pos3 = 0, pos4 = 0;
      barra.onmousedown = dragMouseDown;

      function dragMouseDown(e) {
        e.preventDefault();
        pos3 = e.clientX;
        pos4 = e.clientY;
        document.onmouseup = closeDragElement;
        document.onmousemove = elementDrag;
      }

      function elementDrag(e) {
        e.preventDefault();
        pos1 = pos3 - e.clientX;
        pos2 = pos4 - e.clientY;
        pos3 = e.clientX;
        pos4 = e.clientY;
        el.style.top = (el.offsetTop - pos2) + "px";
        el.style.left = (el.offsetLeft - pos1) + "px";
      }

      function closeDragElement() {
        document.onmouseup = null;
        document.onmousemove = null;
      }
    }
  }, [modoTransmissao]);

  const renderBlocosDeVoto = () => {
    if (!dadosVotacao || dadosVotacao.tipo !== "criterios") return null;

    const criteriosUnicos = dadosVotacao.jurados[0]?.criterios.map(c => c.criterio) || [];
    const mediasJurados = dadosVotacao.jurados.map(j =>
      j.criterios.reduce((soma, c) => soma + (Number(c.nota) || 0), 0) / j.criterios.length
    );
    const mediaGeral = mediasJurados.reduce((acc, m) => acc + m, 0) / mediasJurados.length || 0;

    return (
      <div className="tabela-votos">
        {/* Cabeçalho */}
        <div className="linha-titulo">
          <div className="celula jurado-nome">Jurado</div>
          {criteriosUnicos.map((nome, i) => (
            <div key={i} className="celula">{nome}</div>
          ))}
          <div className="celula media-final">Média</div>
        </div>

        {/* Jurados */}
        {dadosVotacao.jurados.map((jurado, i) => {
          const totalNotas = jurado.criterios.reduce((soma, c) => soma + (Number(c.nota) || 0), 0);
          const media = totalNotas / jurado.criterios.length;

          return (
            <div key={i} className="linha-jurado" style={{ backgroundColor: cores[i % cores.length] }}>
              <div className="celula jurado-nome">
                {jurado.foto_jurado && (
                  <img src={`${API_FESTIVAL}/${jurado.foto_jurado}`} alt="Jurado" />
                )}
                <span>{jurado.nome_jurado}</span>
              </div>
              {jurado.criterios.map((c, j) => (
                <div key={j} className="celula">{c.nota ?? "--"}</div>
              ))}
              <div className="celula media-final">{media.toFixed(1)}</div>
            </div>
          );
        })}

        {/* Voto Popular */}
        {/* <div className="linha-jurado voto-popular" style={{ backgroundColor: cores[4] }}>
          <div className="celula jurado-nome"><span>Voto Popular</span></div>
          {[...Array(criteriosUnicos.length)].map((_, i) => (
            <div className="celula" key={i}>–</div>
          ))}
          <div className="celula media-final">{dadosVotacao.popular}</div>
        </div> */}

        {/* Média Geral */}
        <div className="linha-titulo media-geral">
          <div className="celula jurado-nome"><strong>MÉDIA GERAL</strong></div>
          {[...Array(criteriosUnicos.length)].map((_, i) => (
            <div className="celula" key={i}>–</div>
          ))}
          <div className="celula media-final"><strong>{mediaGeral.toFixed(1)}</strong></div>
        </div>
      </div>
    );
  };

  return (
    <div className="dashboard-festival-container" ref={containerRef}>
      {!modoTransmissao && (
        <div className="filtros-dashboard">
          <label>
            Etapa:
            <select value={etapaSelecionada} onChange={(e) => setEtapaSelecionada(e.target.value)}>
              <option value="">Selecione uma etapa</option>
              {etapas.map((etapa) => (
                <option key={etapa.id} value={etapa.id}>
                  {etapa.nome}
                </option>
              ))}
            </select>
          </label>

          <label>
            Candidato:
            <select
              value={candidatoSelecionado}
              onChange={(e) => setCandidatoSelecionado(e.target.value)}
              disabled={!etapaSelecionada}
            >
              <option value="">Selecione um candidato</option>
              {candidatos.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.nome_artistico || c.nome}
                </option>
              ))}
            </select>
          </label>

          <div style={{ display: "flex", gap: "0.5rem" }}>
            <button onClick={() => setModoTransmissao(true)}>Modo Transmissão</button>
            <button
              onClick={() => {
                // Atualiza os dados manualmente
                if (etapaSelecionada && candidatoSelecionado) {
                  axios
                    .get(`${API_FESTIVAL}/api/dashboard/notas/${candidatoSelecionado}/${etapaSelecionada}`)
                    .then((res) => setDadosVotacao(res.data));
                }
              }}
              title="Atualizar dados"
            >
              🔄 Atualizar
            </button>
          </div>
        </div>
      )}

      {/* Blocos sempre visíveis na tela principal */}
      <div className="blocos-votacao">
        {renderBlocosDeVoto()}
      </div>

      {/* Janela flutuante com mesmo conteúdo */}
      {modoTransmissao && dadosVotacao && (
        <div className="janela-flutuante" id="transmissao-votos">
          <div className="barra-titulo">
            Votos do Candidato
            <button style={{ float: "right" }} onClick={() => setModoTransmissao(false)}>✖</button>
          </div>
          <div className="conteudo-votos">
            {renderBlocosDeVoto()}
          </div>
        </div>
      )}
    </div>
  );
};

export default DashboardFestival;
