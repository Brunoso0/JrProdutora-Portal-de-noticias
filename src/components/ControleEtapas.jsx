import React, { useEffect, useState } from "react";
import axios from "axios";
import { API_FESTIVAL } from "../services/api";
import "../styles/ControleEtapas.css";
import { toast } from "react-toastify";

const ControleEtapas = () => {
  const [etapas, setEtapas] = useState([]);

  const carregarEtapas = () => {
    axios
      .get(`${API_FESTIVAL}/api/inscricoes/etapas`)
      .then((res) => {
        const etapasOrdenadas = res.data.sort((a, b) => a.id - b.id);
        setEtapas(etapasOrdenadas);
      })
      .catch((err) => console.error("Erro ao buscar etapas:", err));
  };

  useEffect(() => {
    carregarEtapas();
  }, []);

  const atualizarStatusVotacao = async (id, liberar) => {
    console.log("Enviando para o backend:", { id, liberada: liberar });
    try {
      await axios.put(`${API_FESTIVAL}/api/etapas/liberar-votacao/${id}`, {
        liberada: liberar,
      });
      toast.success(`Votação ${liberar ? "liberada" : "encerrada"} com sucesso.`);
      carregarEtapas(); // Recarrega para refletir a mudança
    } catch (err) {
      toast.error(err.response?.data?.erro || "Erro ao atualizar status da votação.");
      console.error(err);
    }
  };

  return (
    <div className="controle-etapas">
      <h2>Controle de Etapas</h2>
      <ul className="lista-etapas">
        {etapas.map((e) => (
          <li key={e.id} className="etapa-item">
            <div>
              <strong>{e.nome}</strong><br />
              <span>Status da votação:{" "}
                <strong style={{ color: e.votacao_liberada ? "#2ecc71" : "#e74c3c" }}>
                  {e.votacao_liberada ? "Aberta" : "Fechada"}
                </strong>
              </span>
            </div>
            <button
              className={`botao-status ${e.votacao_liberada ? "encerrar" : "liberar"}`}
              onClick={() => atualizarStatusVotacao(e.id, !e.votacao_liberada)}
            >
              {e.votacao_liberada ? "Encerrar Votação" : "Liberar Votação"}
            </button>
          </li>
        ))}
      </ul>
    </div>
  );
};

export default ControleEtapas;
