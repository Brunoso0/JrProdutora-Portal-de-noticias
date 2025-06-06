import React, { useEffect, useState } from "react";
import axios from "axios";
import { API_FESTIVAL } from "../services/api";
import "../styles/SelecionarVotacao.css";
import { toast, ToastContainer  } from "react-toastify";

const SelecionarVotacao = () => {
  const [candidatos, setCandidatos] = useState([]);
  const [busca, setBusca] = useState("");
  const [etapa, setEtapa] = useState("");

  const fetchCandidatos = () => {
    axios.get(`${API_FESTIVAL}/api/inscricoes/listar`).then(res => {
      setCandidatos(res.data);
    });
  };

  useEffect(() => {
    fetchCandidatos();
  }, []);

  const atualizarVotacao = (id, valor) => {
  const liberadosAtuais = candidatos.filter(c => c.votacao === 1).map(c => c.id);

  let novosIds;

  if (valor === 1) {
    if (liberadosAtuais.includes(id)) return; // já está liberado

    if (liberadosAtuais.length >= 16) {
      toast.error("Limite máximo de 13 candidatos liberados para votação por dia atingido.");
      return;
    }

    novosIds = [...liberadosAtuais, id]; // adiciona o novo
  } else {
    novosIds = liberadosAtuais.filter(i => i !== id); // remove o que foi bloqueado
  }

  axios
    .put(`${API_FESTIVAL}/api/dashboard/atualizar-votacao`, { ids: novosIds })
    .then(() => {
      fetchCandidatos();
    })
    .catch(() => {
      toast.error("Erro ao atualizar votação. Tente novamente.");
    });
};



  const candidatosFiltrados = candidatos.filter(c => {
    const nomeMatch =
      c.nome.toLowerCase().includes(busca.toLowerCase()) ||
      c.nome_artistico?.toLowerCase().includes(busca.toLowerCase());

    const etapaMatch = etapa ? c.fase_atual?.toLowerCase() === etapa.toLowerCase() : true;
    return nomeMatch && etapaMatch;
  });

  const liberados = candidatosFiltrados.filter(c => c.votacao === 1);
  const bloqueados = candidatosFiltrados.filter(c => c.votacao !== 1);

  return (
    <div className="selecionar-votacao">
      <ToastContainer position="top-center" autoClose={3000} />
      <h2>Gerenciar Votação Pública</h2>

      <div className="filtro">
        <input
          type="text"
          placeholder="Buscar por nome ou artista..."
          value={busca}
          onChange={e => setBusca(e.target.value)}
        />
        <select value={etapa} onChange={e => setEtapa(e.target.value)}>
          <option value="">Todas as Etapas</option>
          <option value="classificatória">Classificatória</option>
          <option value="classificado">Classificado</option>
          <option value="primeira fase">Primeira Fase</option>
          <option value="segunda fase">Segunda Fase</option>
          <option value="final">Final</option>
        </select>
      </div>

      <div className="blocos-lista">
        <div className="bloco-liberados">
          <h3>✅ Liberados para Votação</h3>
          <ul className="lista-liberados lista-festival-votacao">
            {liberados.map(c => (
              <li key={c.id} className="item-candidato">
                <span className="nome-com-tooltip">
                  {c.nome}
                  {c.nome_artistico && (
                    <span className="tooltip-artista">{c.nome_artistico}</span>
                  )}
                </span>{" "}
                <span className="etapa-label">({c.fase_atual})</span>
                <button
                  onClick={() => atualizarVotacao(c.id, 0)}
                  className="btn-bloquear"
                >
                  Bloquear
                </button>
              </li>
            ))}
          </ul>
        </div>

        <div className="bloco-bloqueados">
          <h3>🔒 Bloqueados</h3>
          <ul className="lista-bloqueados lista-festival-votacao">
            {bloqueados.map(c => (
              <li key={c.id} className="item-candidato">
                <span className="nome-com-tooltip">
                  {c.nome}
                  {c.nome_artistico && (
                    <span className="tooltip-artista">{c.nome_artistico}</span>
                  )}
                </span>{" "}
                <span className="etapa-label">({c.fase_atual})</span>
                <button
                  onClick={() => atualizarVotacao(c.id, 1)}
                  className="btn-liberar"
                >
                  Liberar
                </button>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  );
};

export default SelecionarVotacao;
