import React, { useState, useEffect, useRef } from "react";
import axios from "axios";
import "../styles/DashboardVotosPublicos.css";
import { API_FESTIVAL } from "../services/api";
import { format } from "date-fns";

const DashboardVotosPublicos = () => {
  const [dataSelecionada, setDataSelecionada] = useState(
    format(new Date(), "yyyy-MM-dd")
  );
  const [votos, setVotos] = useState([]);
  const [loading, setLoading] = useState(false);
  const intervalRef = useRef(null);

  const carregarVotos = async () => {
    setLoading(true);
    try {
      const res = await axios.get(
        `${API_FESTIVAL}/api/dashboard/votos-publicos?data=${dataSelecionada}`
      );
      setVotos(Array.isArray(res.data) ? res.data : []);
    } catch (err) {
      console.error("Erro ao carregar votos públicos", err);
      setVotos([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    carregarVotos();
    // Removido o setInterval e o clearInterval
  }, [dataSelecionada]);

  const totalVotos = votos.reduce((acc, v) => acc + (Number(v.total_votos) || 0), 0);

  // Ordena por número de votos (desc)
  const listaOrdenada = [...votos].sort(
    (a, b) => (Number(b.total_votos) || 0) - (Number(a.total_votos) || 0)
  );

  const fotoUrl = (f) => {
    if (!f) return null;
    if (String(f).startsWith("http")) return f;
    const base = API_FESTIVAL.replace(/\/+$/, "");
    const path = String(f).replace(/\\/g, "/").replace(/^\/+/, "");
    return `${base}/${path}`;
  };

  const iniciais = (nome) => {
    if (!nome) return "—";
    const partes = String(nome).trim().split(/\s+/);
    const [p1, p2] = [partes[0], partes[partes.length - 1]];
    return (p1?.[0] || "") + (p2 && p2 !== p1 ? p2[0] : "");
  };

  return (
    <div className="vp-wrap">
      <div className="vp-container">
        {/* Header */}
        <header className="vp-header">
          <div className="vp-header-top">
            <h1>VOTAÇÃO POPULAR</h1>
            <div className="vp-date">
              <label>Data:</label>
              <input
                type="date"
                value={dataSelecionada}
                onChange={(e) => setDataSelecionada(e.target.value)}
              />
            </div>
          </div>
        </header>

        {/* Total de votos */}
        <section className="vp-total card">
          <span className="vp-total-label">Total de votos do dia</span>
          <div className="vp-total-value">
            {totalVotos.toLocaleString("pt-BR")}
          </div>
        </section>

        {/* Lista */}
        {loading ? (
          <p className="vp-loading">Carregando votos…</p>
        ) : (
          <main className="vp-list">
            {listaOrdenada.map((v, idx) => {
              const nome = v.nome_artistico || v.nome || "Candidato";
              const votosCandidato = Number(v.total_votos) || 0;
              const percentual =
                totalVotos > 0 ? (votosCandidato / totalVotos) * 100 : 0;

              const img = fotoUrl(v.foto);

              return (
                <article className="vp-item card" key={v.id || idx}>
                  <div className="vp-rank">{idx + 1}º</div>

                  <div className="vp-avatar">
                    {img ? (
                      <img
                        src={img}
                        alt={nome}
                        onError={(e) => (e.currentTarget.style.display = "none")}
                      />
                    ) : (
                      <div className="vp-avatar-ph">{iniciais(nome)}</div>
                    )}
                  </div>

                  <div className="vp-info">
                    <div className="vp-toprow">
                      <h3 className="vp-name">{nome}</h3>
                      <div className="vp-perc">
                        {percentual.toFixed(2)}%
                        <span className="vp-small">
                          {votosCandidato.toLocaleString("pt-BR")} votos
                        </span>
                      </div>
                    </div>

                    <div className="vp-bar">
                      <div
                        className="vp-bar-fill"
                        style={{ width: `${percentual}%` }}
                      />
                    </div>
                  </div>
                </article>
              );
            })}

            {listaOrdenada.length === 0 && (
              <p className="vp-empty">Sem votos para esta data.</p>
            )}
          </main>
        )}

        <footer className="vp-foot">
          Os votos são atualizados em tempo real.
        </footer>
      </div>
    </div>
  );
};

export default DashboardVotosPublicos;
