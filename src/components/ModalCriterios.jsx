import React, { useEffect, useState, useCallback } from "react";
import "../styles/ModalAvaliacao.css";
import axios from "axios";
import { API_FESTIVAL } from "../services/api";
import { toast } from "react-toastify";

const ModalCriterios = ({ candidato, onClose, onUpdate }) => {
  const [criterios, setCriterios] = useState([]);
  const [notas, setNotas] = useState({});
  const [justificativasCriterios, setJustificativasCriterios] = useState({});
  const [votacaoLiberada, setVotacaoLiberada] = useState(false);

  const jurado_id = parseInt(localStorage.getItem("jurado_id"));
  const token = localStorage.getItem("token");

  const buscarEtapaStatus = useCallback(async () => {
    if (!candidato?.etapa_id) return setVotacaoLiberada(false);
    try {
      const res = await axios.get(`${API_FESTIVAL}/api/etapas/${candidato.etapa_id}`);
      setVotacaoLiberada(parseInt(res.data.votacao_liberada) === 1);
    } catch {
      setVotacaoLiberada(false);
    }
  }, [candidato?.etapa_id]);

  const buscarCriterios = useCallback(async () => {
    try {
      const res = await axios.get(`${API_FESTIVAL}/api/etapas/criterios/listar`);
      setCriterios(res.data);

      const notasIniciais = {}, justificativasIniciais = {};
      res.data.forEach(c => {
        notasIniciais[c.id] = "";
        justificativasIniciais[c.id] = "";
      });

      setNotas(notasIniciais);
      setJustificativasCriterios(justificativasIniciais);
    } catch {
      setCriterios([]);
    }
  }, []);

  useEffect(() => {
    buscarEtapaStatus();
    buscarCriterios();
  }, [buscarEtapaStatus, buscarCriterios]);

  const handleVotoComCriterios = async () => {
    const payload = criterios.map(c => ({
      inscricao_id: candidato.id,
      etapa_id: candidato.etapa_id,
      jurado_id,
      criterio_id: c.id,
      nota: parseFloat(notas[c.id]),
      justificativa: justificativasCriterios[c.id] || "",
    }));

    const notasInvalidas = payload.filter(p => p.nota === null || p.nota === "" || isNaN(p.nota) || p.nota < 0 || p.nota > 10);
    if (notasInvalidas.length > 0) {
      return toast.error("Todas as notas devem estar entre 0 e 10, sem deixar campos vazios.");
    }

    try {
      await axios.post(`${API_FESTIVAL}/api/jurados/votos-jurados`, {
        jurado_id,
        inscricao_id: candidato.id,
        etapa_id: candidato.etapa_id,
        votos: payload
      }, {
        headers: {
          Authorization: `Bearer ${token}`
        }
      });

      toast.success("Voto registrado com sucesso!");
      onClose();
      onUpdate();
    } catch {
      toast.error("Erro ao enviar votos com critérios.");
    }
  };

  const formatarNomeCriterio = (nome) => {
    const mapa = {
      "afinacao": "Afinação",
      "presenca de palco": "Presença de Palco",
      "ritmo": "Ritmo",
      "interpretacao": "Interpretação",
      "autenticidade": "Autenticidade",
      "diccao/pronuncia": "Dicção / Pronúncia"
    };
    return mapa[nome.trim().toLowerCase()] || nome;
  };

  if (!candidato || !votacaoLiberada) return null;

  return (
    <div className="modal-avaliacao-overlay">
      <div className="modal-avaliacao-box">
        <h2>Avaliar {candidato.nome_artistico}</h2>
        <p className="etapa-info">Etapa: <strong>{candidato.fase_atual}</strong></p>

        <form className="criterios-form">
          {criterios.map((criterio) => (
            <div key={criterio.id} className="criterio-bloco">
              <label className="criterio-label">{formatarNomeCriterio(criterio.nome)}</label>
              <div className="nota-justificativa">
                <input
                  type="number"
                  min="0"
                  max="10"
                  step="1"
                  className="input-nota"
                  value={notas[criterio.id] || ""}
                  onChange={(e) => {
                    const valor = parseFloat(e.target.value);
                    if (!isNaN(valor) && valor > 0 && valor <= 10) {
                      setNotas({ ...notas, [criterio.id]: valor });
                    } else if (e.target.value === "") {
                      setNotas({ ...notas, [criterio.id]: "" });
                    }
                  }}
                />
                <textarea
                  placeholder="Justificativa (opcional)"
                  className="input-justificativa"
                  value={justificativasCriterios[criterio.id] || ""}
                  onChange={(e) =>
                    setJustificativasCriterios({
                      ...justificativasCriterios,
                      [criterio.id]: e.target.value,
                    })
                  }
                />
              </div>
            </div>
          ))}
        </form>

        <div className="botoes-modal-avaliacao">
          <button className="btn-cancelar" onClick={onClose}>Cancelar</button>
          <button className="btn-confirmar" onClick={handleVotoComCriterios}>Enviar Voto</button>
        </div>
      </div>
    </div>
  );
};

export default ModalCriterios;
