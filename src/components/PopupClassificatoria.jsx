import React, { useEffect, useState } from "react";
import { useSearchParams } from "react-router-dom";
import axios from "axios";
import { API_FESTIVAL } from "../services/api";
import "../styles/PopupClassificatoria.css";

const PopupClassificatoria = () => {
  const [searchParams] = useSearchParams();
  const candidatoId = searchParams.get("id");
  const etapaId = searchParams.get("etapa_id");

  const [votos, setVotos] = useState([]);
  const [candidato, setCandidato] = useState(null);

  // Dados do candidato (nome/foto no topo)
  useEffect(() => {
    const fetchCandidato = async () => {
      if (!etapaId || !candidatoId) return;
      try {
        const res = await axios.get(`${API_FESTIVAL}/api/dashboard/candidatos/${etapaId}`);
        const found = (res.data || []).find((c) => String(c.id) === String(candidatoId));
        if (found) setCandidato(found);
      } catch {
        /* silencioso */
      }
    };
    fetchCandidato();
  }, [candidatoId, etapaId]);

  // Votos (polling)
  useEffect(() => {
    if (!candidatoId || !etapaId) return;

    const fetchVotos = async () => {
      try {
        const res = await axios.get(
          `${API_FESTIVAL}/api/jurados/votos-binarios/${candidatoId}/${etapaId}`
        );
        setVotos(res.data || []);
      } catch {
        setVotos([]);
      }
    };

    fetchVotos();
    const interval = setInterval(fetchVotos, 2000);
    return () => clearInterval(interval);
  }, [candidatoId, etapaId]);

  // Ordena votos por jurado_id crescente
  const votosOrdenados = [...votos].sort((a, b) => Number(a.jurado_id) - Number(b.jurado_id));

  return (
    <div className="popup-classificatoria">
      {/* <header className="popup-header">
        <div className="popup-candidato">
          <div className="popup-candidato-foto">
            {candidato?.foto ? (
              <img
                src={`${API_FESTIVAL}/${candidato.foto}`}
                alt={candidato?.nome_artistico || candidato?.nome}
              />
            ) : (
              <div className="popup-candidato-foto--placeholder">Sem foto</div>
            )}
          </div>
          <div className="popup-candidato-info">
            <h1>{candidato?.nome_artistico || candidato?.nome || `Candidato #${candidatoId}`}</h1>
            <span className="badge">Classificatória</span>
          </div>
        </div>
      </header> */}

      {votosOrdenados.length > 0 ? (
        <div className="colunas-votos">
          {votosOrdenados.map((v, i) => {
            const estado = v.aprovado === "sim" ? "sim" : v.aprovado === "nao" ? "nao" : "pendente";
            return (
              <div className={`coluna-voto ${estado}`} key={`${v.jurado_id}-${i}`}>
                <div className="jurado-foto">
                  {v.foto_jurado ? (
                    <img src={`${API_FESTIVAL}/${v.foto_jurado}`} alt={v.nome_jurado} />
                  ) : (
                    <div className="jurado-foto--placeholder">foto jurado</div>
                  )}
                </div>
                <div className="jurado-nome">{v.nome_jurado}</div>
              </div>
            );
          })}
        </div>
      ) : (
        <div className="mensagem-vazia">Sem votos até o momento.</div>
      )}
    </div>
  );
};

export default PopupClassificatoria;
