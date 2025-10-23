import React, { useState, useEffect } from "react";
import axios from "axios";
import { API_FESTIVAL } from "../../services/api";
import { format } from "date-fns";
import "../styles/RankingVotos.css";

const RankingVotos = () => {
  const [etapas, setEtapas] = useState([]);
  const [etapaSelecionada, setEtapaSelecionada] = useState("");
  const [dataSelecionada, setDataSelecionada] = useState(
    format(new Date(), "yyyy-MM-dd")
  );
  const [ranking, setRanking] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    axios
      .get(`${API_FESTIVAL}/api/dashboard/etapas`)
      .then((res) => setEtapas(res.data))
      .catch((err) => console.error("Erro ao buscar etapas", err));
  }, []);

  const buscarRanking = async () => {
    if (!etapaSelecionada || !dataSelecionada) return;
    setLoading(true);
    try {
      const res = await axios.get(
        `${API_FESTIVAL}/api/dashboardvotos/notas-gerais`,
        {
          params: {  data: dataSelecionada },
        }
      );
      setRanking(Array.isArray(res.data) ? res.data : []);
    } catch (err) {
      console.error("Erro ao buscar ranking", err);
      setRanking([]);
    } finally {
      setLoading(false);
    }
  };

  const fotoUrl = (f) => {
    if (!f) return null;
    if (String(f).startsWith("http")) return f;
    const base = API_FESTIVAL.replace(/\/+$/, "");
    const path = String(f).replace(/\\/g, "/").replace(/^\/+/, "");
    return `${base}/${path}`;
  };

  const iniciais = (nome) => {
    if (!nome) return "—";
    const parts = String(nome).trim().split(/\s+/);
    const [p1, p2] = [parts[0], parts[parts.length - 1]];
    return `${(p1?.[0] || "").toUpperCase()}${(p2 && p2 !== p1 ? p2[0] : "").toUpperCase()}`;
  };

  // Ordena por média (desc), preservando em caso de empate
  const listaOrdenada = [...ranking].sort(
    (a, b) => b.media_final_arredondada - a.media_original
  )

  return (
    <div className="rv-wrap">
      <div className="rv-container">
        {/* Header */}
        <header className="rv-header">
          <h1>Ranking dos Jurados</h1>
          <p className="rv-sub">Confira a classificação em tempo real</p>
        </header>

        {/* Filtros */}
        <section className="rv-filtros card">
          <div className="rv-f-grid">
            <div className="rv-field">
              <label>Etapa</label>
              <select
                value={etapaSelecionada}
                onChange={(e) => setEtapaSelecionada(e.target.value)}
              >
                <option value="">Selecione</option>
                {etapas.map((et) => (
                  <option key={et.id} value={et.id}>
                    {et.nome}
                  </option>
                ))}
              </select>
            </div>

            <div className="rv-field">
              <label>Data da votação</label>
              <input
                type="date"
                value={dataSelecionada}
                onChange={(e) => setDataSelecionada(e.target.value)}
              />
            </div>

            <button className="rv-buscar" onClick={buscarRanking}>
              Buscar
            </button>
          </div>
        </section>

        {/* Lista */}
        {loading ? (
          <p className="rv-loading">Carregando ranking…</p>
        ) : (
          <main className="rv-list">
            {listaOrdenada.map((c, idx) => {
              const pos = idx + 1;
              const nome = c.nome_artistico || c.nome || "Candidato";
              const img = fotoUrl(c.foto);

              // classes especiais para top 3
              const rankClass =
                pos === 1 ? "rank-1" : pos === 2 ? "rank-2" : pos === 3 ? "rank-3" : "";

              return (
                <article className={`rv-item card ${rankClass}`} key={c.id || idx}>
                  <div className={`rv-pos ${rankClass}`}>{pos}</div>

                  <div className="rv-avatar">
                    {img ? (
                      <img src={img} alt={nome} onError={(e) => (e.currentTarget.style.display = "none")} />
                    ) : (
                      <div className="rv-avatar-ph">{iniciais(nome)}</div>
                    )}
                  </div>

                  <div className="rv-info">
                    <h3 className="rv-name">{nome}</h3>
                    <p className="rv-origin">Voto dos Jurados</p>
                  </div>

                  <div className="rv-score">
                    <span className="rv-score-value">
                      {c.media_original ? Number(c.media_original).toFixed(4).replace('.', ',') : "—"}
                    </span>
                    <span className="rv-score-label">Média</span>
                  </div>
                </article>
              );
            })}

            {!loading && listaOrdenada.length === 0 && (
              <p className="rv-empty">Nenhum resultado para os filtros selecionados.</p>
            )}
          </main>
        )}
      </div>
    </div>
  );
};

export default RankingVotos;
