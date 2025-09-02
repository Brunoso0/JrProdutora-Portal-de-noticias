import React, { useState, useEffect } from "react";
import axios from "axios";
import "../styles/Classificatoria.css";
import { API_FESTIVAL } from "../services/api";

const Classificatoria = () => {
  const [candidatos, setCandidatos] = useState([]);
  const [candidatoSelecionado, setCandidatoSelecionado] = useState("");
  const [etapaClassificatoria, setEtapaClassificatoria] = useState(null);
  const [votos, setVotos] = useState([]);

  // Buscar etapa classificatória
  useEffect(() => {
    axios.get(`${API_FESTIVAL}/api/dashboard/etapas`).then((res) => {
      const classificatoria = res.data.find((et) =>
        et.nome.toLowerCase().includes("classificat")
      );
      if (classificatoria) {
        setEtapaClassificatoria(classificatoria);
      }
    });
  }, []);

  // Buscar candidatos da etapa classificatória
  useEffect(() => {
    if (etapaClassificatoria?.id) {
      axios
        .get(`${API_FESTIVAL}/api/dashboard/candidatos/${etapaClassificatoria.id}`)
        .then((res) => setCandidatos(res.data));
    }
  }, [etapaClassificatoria]);

  // Buscar votos binários
  useEffect(() => {
    if (!candidatoSelecionado || !etapaClassificatoria?.id) return;

    const fetchVotos = async () => {
      try {
        const res = await axios.get(
          `${API_FESTIVAL}/api/jurados/votos-binarios/${candidatoSelecionado}/${etapaClassificatoria.id}`
        );
        setVotos(res.data);
      } catch (err) {
        setVotos([]);
      }
    };

    fetchVotos();
    const interval = setInterval(fetchVotos, 3000); // Atualização periódica (pode trocar por socket depois)
    return () => clearInterval(interval);
  }, [candidatoSelecionado, etapaClassificatoria]);

  return (
    <div className="classificatoria-container">
      <h1>Votos Classificatória</h1>

      <div className="filtros-classificatoria">
        <label>
          Candidato:
          <select
            value={candidatoSelecionado}
            onChange={(e) => setCandidatoSelecionado(e.target.value)}
            disabled={!etapaClassificatoria}
          >
            <option value="">Selecione um candidato</option>
            {candidatos.map((c) => (
              <option key={c.id} value={c.id}>
                {c.nome_artistico || c.nome}
              </option>
            ))}
          </select>
        </label>
      </div>

      {votos.length > 0 && (
        <div className="tabela-binaria">
          <div className="linha-titulo">
            <div className="celula">Foto</div>
            <div className="celula">Jurado</div>
            <div className="celula">Voto</div>
          </div>
          {votos.map((voto, i) => (
            <div className="linha-voto" key={i}>
              <div className="celula">
                {voto.foto_jurado && (
                  <img
                    src={`${API_FESTIVAL}/${voto.foto_jurado}`}
                    alt="jurado"
                    className="foto-jurado"
                  />
                )}
              </div>
              <div className="celula celulajurado">{voto.nome_jurado}</div>
              <div className={`celula voto-bool ${voto.aprovado === "sim" ? "sim" : "nao"}`}>
                {voto.aprovado === "sim" ? "SIM" : "NÃO"}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default Classificatoria;
