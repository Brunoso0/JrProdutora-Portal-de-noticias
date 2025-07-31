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
  const [criterioAtual, setCriterioAtual] = useState(0);

  const jurado_id = parseInt(localStorage.getItem("jurado_id"));
  const token = localStorage.getItem("token"); // Passo 1: Capture o token

  const etapaAtual = candidato?.fase_atual
    ? candidato.fase_atual.normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase()
    : "";

  // Adicione o console.log logo após definir etapaAtual
  console.log("DEBUG: Etapa Atual", etapaAtual);

  const buscarEtapaStatus = useCallback(async () => {
    if (!candidato?.etapa_id) return setVotacaoLiberada(false);
    try {
      const res = await axios.get(`${API_FESTIVAL}/api/etapas/${candidato.etapa_id}`);
      setVotacaoLiberada(parseInt(res.data.votacao_liberada) === 1);
    } catch {
      setVotacaoLiberada(false);
    }
  }, [candidato?.etapa_id]);

  useEffect(() => { buscarEtapaStatus(); }, [buscarEtapaStatus]);

  const buscarCriterios = useCallback(async () => {
    if (etapaAtual !== "classificatoria" && votacaoLiberada) {
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
    } else if (etapaAtual === "classificatoria") {
      setCriterios([]);
      setNotas({});
      setJustificativasCriterios({});
    }
  }, [etapaAtual, votacaoLiberada]);

  useEffect(() => { buscarCriterios(); }, [buscarCriterios]);

  const handleVotoBinario = async () => {
    if (!aprovado) return toast.error("Selecione se deseja aprovar ou reprovar.");
    if (aprovado === "nao" && justificativa.trim() === "") {
      return toast.error("Justificativa obrigatória ao reprovar.");
    }

    if (!token) {
      console.error("Token ausente");
      return toast.error("Sessão expirada. Faça login novamente.");
    }

    try {
      const response = await axios.post(
        `${API_FESTIVAL}/api/jurados/votos-binarios`,
        {
          jurado_id: jurado_id,
          inscricao_id: candidato.id,
          etapa_id: candidato.etapa_id,
          aprovado,
          justificativa,
        },
        {
          headers: {
            Authorization: `Bearer ${token}`
          }
        }
      );


      toast.success("Voto registrado com sucesso!");
      onClose();
      onUpdate();
    } catch (error) {
      console.error("Erro ao registrar voto binário:", error.response || error);
      if (error.response?.status === 403) {
        toast.error("Acesso negado. Verifique suas permissões.");
      } else {
        toast.error("Erro ao registrar voto.");
      }
    }
  };

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
          Authorization: `Bearer ${token}` // Passo 2: Envie o token no cabeçalho
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

  if (!candidato) return null;

  return (
    <div className="modal-avaliacao-overlay">
      <div className="modal-avaliacao-box">
        <h2>Avaliar {candidato.nome_artistico}</h2>
        <p className="etapa-info">Etapa: <strong>{candidato.fase_atual}</strong></p>

        {etapaAtual === "classificatoria" ? (
          <>
            <div className="voto-binario-opcoes">
              <p>Deseja aprovar este candidato para a próxima fase?</p>
              <div className="botoes-binarios">
                <button
                  className={aprovado === "sim" ? "ativo" : ""}
                  onClick={() => setAprovado("sim")}
                  type="button"
                >
                  Sim
                </button>
                <button
                  className={aprovado === "nao" ? "ativo" : ""}
                  onClick={() => setAprovado("nao")}
                  type="button"
                >
                  Não
                </button>
              </div>

              {aprovado === "nao" && (
                <textarea
                  className="input-justificativa"
                  placeholder="Justificativa obrigatória ao reprovar"
                  value={justificativa}
                  onChange={(e) => setJustificativa(e.target.value)}
                />
              )}
            </div>

            <div className="botoes-modal-avaliacao">
              <button className="btn-cancelar" onClick={onClose}>Cancelar</button>
              <button className="btn-confirmar" onClick={handleVotoBinario}>Enviar Voto</button>
            </div>
          </>
        ) : (
          <>
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
          </>
        )}

      </div>
    </div>
  );
};

export default ModalAvaliacao;
