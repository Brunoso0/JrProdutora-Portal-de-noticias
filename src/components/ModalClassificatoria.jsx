import React, { useEffect, useState, useCallback } from "react";
import "../styles/ModalClassificatoria.css";
import axios from "axios";
import { API_FESTIVAL } from "../services/api";
import { toast } from "react-toastify";

const ModalClassificatoria = ({ candidato, onClose, onUpdate }) => {
  const [aprovado, setAprovado] = useState("");
  const [justificativa, setJustificativa] = useState("");
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

  useEffect(() => {
    buscarEtapaStatus();
  }, [buscarEtapaStatus]);

  const handleVotoBinario = async () => {
    if (!aprovado) return toast.error("Selecione se deseja aprovar ou reprovar.");

    try {
      await axios.post(
        `${API_FESTIVAL}/api/jurados/votos-binarios`,
        {
          jurado_id,
          inscricao_id: candidato.id,
          etapa_id: candidato.etapa_id,
          aprovado,
          justificativa,
        },
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );

      toast.success("Voto registrado com sucesso!");
      onClose();
      onUpdate();
    } catch (error) {
      console.error("Erro ao registrar voto binário:", error.response || error);
      toast.error("Erro ao registrar voto.");
    }
  };

  if (!candidato || !votacaoLiberada) return null;

  return (
    <div className="modal-avaliacao-overlay">
      <div className="modal-classificatoria-box">
        <button className="modal-fechar" onClick={onClose}>×</button>

        <button
          className="botao-sim"
          onClick={() => {
            setAprovado("sim");
            handleVotoBinario();
          }}
        >
          SIM
        </button>

        <button
          className="botao-nao"
          onClick={() => {
            setAprovado("nao");
            handleVotoBinario();
          }}
        >
          NÃO
        </button>

        {/* 
        {aprovado === "nao" && (
          <textarea
            className="input-justificativa"
            placeholder="Justificativa (opcional)"
            value={justificativa}
            onChange={(e) => setJustificativa(e.target.value)}
          />
        )}
        */}
      </div>
    </div>
  );
};

export default ModalClassificatoria;
