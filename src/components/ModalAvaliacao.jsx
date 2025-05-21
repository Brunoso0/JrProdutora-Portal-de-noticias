import React, { useState, useEffect } from "react";
import "../styles/ModalAvaliacao.css";
import axios from "axios";
import { API_FESTIVAL } from "../services/api";
import { toast } from "react-toastify";

const ModalAvaliacao = ({ candidato, onClose, onUpdate }) => {
  const [aprovado, setAprovado] = useState("");
  const [justificativa, setJustificativa] = useState("");
  const [votacaoLiberada, setVotacaoLiberada] = useState(false);
  const [criterios, setCriterios] = useState([]);
  const [notas, setNotas] = useState({});
  const [justificativasCriterios, setJustificativasCriterios] = useState({});

  const jurado_id = parseInt(localStorage.getItem("jurado_id"));
  const etapaAtual = candidato?.fase_atual?.toLowerCase() || "";

  // 🔍 Checa se a etapa atual está com votação liberada
  useEffect(() => {
    const buscarEtapa = async () => {
      if (!candidato?.etapa_id) return;
      try {
        const res = await axios.get(`${API_FESTIVAL}/api/etapas/${candidato.etapa_id}`);
        setVotacaoLiberada(parseInt(res.data.votacao_liberada) === 1);
      } catch (err) {
        console.error("Erro ao buscar etapa:", err);
      }
    };
    buscarEtapa();
  }, [candidato]);

  // 🔍 Busca os critérios se não for a etapa classificatória
  useEffect(() => {
    if (etapaAtual !== "classificatória") {
      axios.get(`${API_FESTIVAL}/criterios/listar`)
        .then(res => {
          setCriterios(res.data);
          const notasIniciais = {};
          const justificativasIniciais = {};
          res.data.forEach(c => {
            notasIniciais[c.id] = "";
            justificativasIniciais[c.id] = "";
          });
          setNotas(notasIniciais);
          setJustificativasCriterios(justificativasIniciais);
        })
        .catch(err => {
          console.error("Erro ao buscar critérios:", err);
        });
    }
  }, [etapaAtual]);

  if (!candidato) return null;



  // ✅ SUBMISSÃO DO VOTO BINÁRIO
  const handleVotoBinario = async () => {
    if (!aprovado) {
      return toast.error("Selecione se deseja aprovar ou reprovar.");
    }
    if (aprovado === "nao" && justificativa.trim() === "") {
      return toast.error("Justificativa obrigatória ao reprovar.");
    }

    try {
      await axios.post(`${API_FESTIVAL}/api/jurados/votos-binarios`, {
        inscricao_id: candidato.id,
        etapa_id: candidato.etapa_id,
        jurado_id,
        aprovado,
        justificativa,
      });
      toast.success("Voto registrado com sucesso!");
      onClose();
      onUpdate();
    } catch (err) {
      toast.error("Erro ao registrar voto.");
      console.error(err);
    }
  };

  // ✅ SUBMISSÃO DO VOTO COM CRITÉRIOS
  const handleVotoComCriterios = async () => {
    const payload = criterios.map(c => ({
      inscricao_id: candidato.id,
      etapa_id: candidato.etapa_id,
      jurado_id,
      criterio_id: c.id,
      nota: notas[c.id],
      justificativa: justificativasCriterios[c.id] || "",
    }));

    if (payload.some(p => p.nota === "")) {
      return toast.error("Preencha todas as notas.");
    }

    try {
      await axios.post(`${API_FESTIVAL}/api/jurados/votos-jurados`, payload);
      toast.success("Voto registrado com sucesso!");
      onClose();
      onUpdate();
    } catch (err) {
      toast.error("Erro ao enviar votos com critérios.");
      console.error(err);
    }
  };

  return (
    <div className="modal-avaliacao-overlay">
      <div className="modal-avaliacao-content">
        <h2>Avaliar {candidato.nome}</h2>
        <p><strong>Etapa:</strong> {candidato.fase_atual}</p>

        {!votacaoLiberada ? (
          <p>Esta etapa não está disponível para votação.</p>
        ) : etapaAtual === "classificatória" ? (
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
          <div className="form-criterios">
            {criterios.map((criterio) => (
              <div key={criterio.id} className="criterio-item">
                <label>
                  {criterio.nome}:{" "}
                  <input
                    type="number"
                    min="0"
                    max="10"
                    value={notas[criterio.id] || ""}
                    onChange={(e) =>
                      setNotas({ ...notas, [criterio.id]: e.target.value })
                    }
                  />
                </label>
                <textarea
                  placeholder="Justificativa (opcional)"
                  value={justificativasCriterios[criterio.id]}
                  onChange={(e) =>
                    setJustificativasCriterios({
                      ...justificativasCriterios,
                      [criterio.id]: e.target.value,
                    })
                  }
                />
              </div>
            ))}
          </div>
        )}

        <div className="botoes-modal-avaliacao">
          <button className="btn-cancelar" onClick={onClose}>Cancelar</button>
          {votacaoLiberada && (
            <button
              className="btn-confirmar"
              onClick={etapaAtual === "classificatória" ? handleVotoBinario : handleVotoComCriterios}
            >
              Enviar Voto
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default ModalAvaliacao;
