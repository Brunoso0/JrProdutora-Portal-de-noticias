import React, { useState, useEffect } from "react";
import axios from "axios";
import { API_FESTIVAL } from "../services/api";
import { format } from "date-fns";
import "../styles/RankingVotos.css";

const RankingVotos = () => {
  const [etapas, setEtapas] = useState([]);
  const [etapaSelecionada, setEtapaSelecionada] = useState("");
  const [dataSelecionada, setDataSelecionada] = useState(format(new Date(), "yyyy-MM-dd"));
  const [ranking, setRanking] = useState([]);
  const [revelados, setRevelados] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    axios.get(`${API_FESTIVAL}/api/dashboard/etapas`)
      .then(res => setEtapas(res.data))
      .catch(err => console.error("Erro ao buscar etapas", err));
  }, []);

  const buscarRanking = async () => {
    if (!etapaSelecionada || !dataSelecionada) return;
    setLoading(true);
    try {
      const res = await axios.get(`${API_FESTIVAL}/api/dashboardvotos/notas-gerais`, {
        params: { etapa_id: etapaSelecionada, data: dataSelecionada }
    });

      setRanking(res.data);
      setRevelados(Array(res.data.length).fill(false));
    } catch (err) {
      console.error("Erro ao buscar ranking", err);
      setRanking([]);
    } finally {
      setLoading(false);
    }
  };

  const revelar = (index) => {
    const novos = [...revelados];
    novos[index] = true;
    setRevelados(novos);
  };

  return (
    <div className="ranking-container">
      <h2>🏆 Ranking de Votos dos Jurados</h2>

      <div className="filtros-ranking">
        <label>
          Etapa:
          <select value={etapaSelecionada} onChange={(e) => setEtapaSelecionada(e.target.value)}>
            <option value="">Selecione a etapa</option>
            {etapas.map((et) => (
              <option key={et.id} value={et.id}>{et.nome}</option>
            ))}
          </select>
        </label>

        <label>
          Data da votação:
          <input
            type="date"
            value={dataSelecionada}
            onChange={(e) => setDataSelecionada(e.target.value)}
          />
        </label>

        <button onClick={buscarRanking}>Buscar Ranking</button>
      </div>

      {loading ? (
        <p>Carregando ranking...</p>
      ) : (
        <div className="grid-ranking">
          {ranking.map((c, idx) => (
            <div
              key={idx}
              className={`card-ranking ${revelados[idx] ? "revelado" : ""}`}
              onClick={() => revelar(idx)}
            >
              <div className="numero-ranking">#{idx + 1}</div>

              {revelados[idx] ? (
                <>
                  <img
                    src={c.foto ? `${API_FESTIVAL}${c.foto.startsWith("/") ? "" : "/"}${c.foto}` : "/default-user.png"}
                    alt={c.nome_artistico || c.nome}
                  />
                  <strong>{c.nome_artistico || c.nome}</strong>
                  <p>{c.origem === "popular" ? "👥 Voto Popular" : "🎙️ Voto dos Jurados"}</p>
                  {c.media && <p>Média: {c.media}</p>}
                  {c.porcentagem && <p>{c.total_votos} votos ({c.porcentagem}%)</p>}
                </>
              ) : (
                <p className="texto-suspense">Clique para revelar</p>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default RankingVotos;
