import React, { useState } from "react";
import "../styles/ModalAvaliacao.css";
import axios from "axios";
import { API_FESTIVAL } from "../services/api";
import { toast } from "react-toastify";

const ModalAvaliacao = ({ candidato, onClose, onUpdate }) => {
  const [aprovado, setAprovado] = useState("");
  const [justificativa, setJustificativa] = useState("");

  if (!candidato) return null;

  const etapaAtual = candidato.fase_atual?.toLowerCase() || "";

  // ✅ Pega e valida o jurado_id
  const jurado_id = parseInt(localStorage.getItem("jurado_id"));

  const handleVotar = async () => {
    if (!jurado_id) {
      toast.error("Erro: jurado não identificado. Faça login novamente.");
      return;
    }

    if (!aprovado) {
      toast.error("Selecione se deseja aprovar ou reprovar.");
      return;
    }

    if (aprovado === "nao" && justificativa.trim() === "") {
      toast.error("Justificativa obrigatória ao reprovar.");
      return;
    }

    const payload = {
      inscricao_id: candidato.id,
      etapa_id: candidato.etapa_id,
      jurado_id,
      aprovado,
      justificativa,
    };

    try {
      await axios.post(`${API_FESTIVAL}/api/jurados/votos-binarios`, payload);

      toast.success("Voto registrado com sucesso!");
      onClose();
      onUpdate();
    } catch (error) {
      console.error("Erro ao enviar o voto:", error);
      toast.error("Erro ao enviar o voto.");
      console.log("Payload enviado:", payload);
    }
  };

  return (
    <div className="modal-avaliacao-overlay">
      <div className="modal-avaliacao-content">
        <h2>Avaliar {candidato.nome}</h2>
        <p><strong>Etapa:</strong> {candidato.fase_atual}</p>

        {etapaAtual === "classificatória" ? (
          <div className="form-voto-binario">
            <label className="radio-label">
              <input
                type="radio"
                value="sim"
                checked={aprovado === "sim"}
                onChange={() => setAprovado("sim")}
              />
              Aprovar
            </label>

            <label className="radio-label">
              <input
                type="radio"
                value="nao"
                checked={aprovado === "nao"}
                onChange={() => setAprovado("nao")}
              />
              Reprovar
            </label>

            {aprovado === "nao" && (
              <textarea
                className="textarea-justificativa"
                placeholder="Justificativa (obrigatória ao reprovar)"
                value={justificativa}
                onChange={(e) => setJustificativa(e.target.value)}
              />
            )}
          </div>
        ) : (
          <p>Esta etapa não está disponível para votação.</p>
        )}

        <div className="botoes-modal-avaliacao">
          <button className="btn-cancelar" onClick={onClose}>Cancelar</button>
          <button className="btn-confirmar" onClick={handleVotar}>Enviar Voto</button>
        </div>
      </div>
    </div>
  );
};

export default ModalAvaliacao;
