import React, { useState, useEffect, useCallback } from "react";
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

  // Garante que etapaAtual esteja sempre normalizada e em minúsculas
  const etapaAtual = candidato?.fase_atual
    ? candidato.fase_atual.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase()
    : "";

  // 🔍 Checa se a etapa atual está com votação liberada
  const buscarEtapaStatus = useCallback(async () => {
    if (!candidato?.etapa_id) {
      setVotacaoLiberada(false); // Garante que a votação seja desabilitada se não houver etapa_id
      return;
    }
    try {
      const res = await axios.get(`${API_FESTIVAL}/api/etapas/${candidato.etapa_id}`);
      setVotacaoLiberada(parseInt(res.data.votacao_liberada) === 1);
    } catch (err) {
      console.error("Erro ao buscar status da etapa:", err);
      setVotacaoLiberada(false); // Em caso de erro, assume que não está liberada
    }
  }, [candidato?.etapa_id]); // Dependência apenas de candidato.etapa_id

  useEffect(() => {
    buscarEtapaStatus();
  }, [buscarEtapaStatus]);

  // 🔍 Busca os critérios se não for a etapa classificatória E se a votação estiver liberada
  const buscarCriterios = useCallback(async () => {
    if (etapaAtual !== "classificatoria" && votacaoLiberada) { // Adiciona votacaoLiberada como condição
      try {
        const res = await axios.get(`${API_FESTIVAL}/api/etapas/criterios/listar`);
        setCriterios(res.data);
        const notasIniciais = {};
        const justificativasIniciais = {};
        res.data.forEach(c => {
          notasIniciais[c.id] = "";
          justificativasIniciais[c.id] = "";
        });
        setNotas(notasIniciais);
        setJustificativasCriterios(justificativasIniciais);
      } catch (err) {
        console.error("Erro ao buscar critérios:", err);
        setCriterios([]); // Em caso de erro, limpa os critérios
      }
    } else if (etapaAtual === "classificatoria") {
        // Se a etapa for classificatória, garantimos que os critérios sejam limpos
        setCriterios([]);
        setNotas({});
        setJustificativasCriterios({});
    }
  }, [etapaAtual, votacaoLiberada]); // Depende de etapaAtual e votacaoLiberada

  useEffect(() => {
    buscarCriterios();
  }, [buscarCriterios]);

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
      // Garante que a nota seja um número
      nota: parseFloat(notas[c.id]),
      justificativa: justificativasCriterios[c.id] || "",
    }));

    if (payload.some(p => isNaN(p.nota) || p.nota === "" || p.nota < 0 || p.nota > 10)) {
      return toast.error("Preencha todas as notas com valores entre 0 e 10.");
    }

    try {
      // O endpoint de voto por critérios espera um array de votos,
      // então o payload já está no formato correto para envio.
      await axios.post(`${API_FESTIVAL}/api/jurados/votos-jurados`, {
        jurado_id, // Incluir jurado_id no corpo da requisição para o backend
        inscricao_id: candidato.id,
        etapa_id: candidato.etapa_id,
        votos: payload // Envia o array de votos dentro de uma propriedade 'votos'
      });
      toast.success("Voto registrado com sucesso!");
      onClose();
      onUpdate();
    } catch (err) {
      toast.error("Erro ao enviar votos com critérios.");
      console.error(err);
    }
  };

  console.log("🔍 Etapa atual (normalizada):", etapaAtual);
  console.log("🎯 Etapa ID do candidato:", candidato.etapa_id);
  console.log("🔓 Votação liberada:", votacaoLiberada);
  console.log("📝 Critérios carregados:", criterios);

  return (
    <div className="modal-avaliacao-overlay">
      <div className="modal-avaliacao-content">
        <h2>Avaliar {candidato.nome}</h2>
        <p><strong>Etapa:</strong> {candidato.fase_atual}</p>

        {!votacaoLiberada ? (
          <p>Esta etapa não está disponível para votação.</p>
        ) : etapaAtual === "classificatoria" ? (
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
            {criterios.length > 0 ? ( // Renderiza os critérios apenas se existirem
                criterios.map((criterio) => (
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
                      value={justificativasCriterios[criterio.id] || ""} // Garante que não seja undefined
                      onChange={(e) =>
                        setJustificativasCriterios({
                          ...justificativasCriterios,
                          [criterio.id]: e.target.value,
                        })
                      }
                    />
                  </div>
                ))
            ) : (
                <p>Carregando critérios ou nenhum critério disponível para esta etapa.</p>
            )}
          </div>
        )}

        <div className="botoes-modal-avaliacao">
          <button className="btn-cancelar" onClick={onClose}>Cancelar</button>
          {votacaoLiberada && (
            <button
              className="btn-confirmar"
              onClick={etapaAtual === "classificatoria" ? handleVotoBinario : handleVotoComCriterios}
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