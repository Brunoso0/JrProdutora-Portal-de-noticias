import React, { useState, useEffect } from "react";
import "../styles/DashboardVotosPublicos.css";
import { API_FESTIVAL } from "../../services/api";
import dashboardService from "../../services/DashboardService";
import sessionService from "../../services/SessionService";
import { format } from "date-fns";

const DashboardVotosPublicos = () => {
  const [modoVisualizacao, setModoVisualizacao] = useState("sessao"); // "sessao" ou "legado"
  
  // Estados para modo sessão
  const [sessoes, setSessoes] = useState([]);
  const [sessaoSelecionada, setSessaoSelecionada] = useState("");
  
  // Estados para modo legado
  const [dataSelecionada, setDataSelecionada] = useState(
    format(new Date(), "yyyy-MM-dd")
  );
  
  const [votos, setVotos] = useState([]);
  const [loading, setLoading] = useState(false);

  // Função atualizada para carregar votos usando sistema híbrido
  const carregarVotos = async () => {
    setLoading(true);
    try {
      let data = [];
      
      if (modoVisualizacao === "sessao" && sessaoSelecionada) {
        // Usar novo sistema de sessões
        data = await dashboardService.getVotosPublicosSessao(Number(sessaoSelecionada));
      } else if (modoVisualizacao === "legado" && dataSelecionada) {
        // Usar sistema híbrido com fallback para legado
        data = await dashboardService.getVotosPublicosHibrido({
          data: dataSelecionada
        });
      }
      
      setVotos(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error("Erro ao carregar votos públicos", err);
      setVotos([]);
    } finally {
      setLoading(false);
    }
  };

  // Carregar sessões encerradas ao inicializar
  useEffect(() => {
    const carregarDados = async () => {
      try {
        const sessoes = await sessionService.getSessoesEncerradas();
        setSessoes(sessoes);
        
        // Se houver sessões, selecionar a mais recente
        if (sessoes.length > 0) {
          const sessaoMaisRecente = sessoes[0];
          setSessaoSelecionada(sessaoMaisRecente.id);
          setModoVisualizacao("sessao");
        } else {
          setModoVisualizacao("legado");
        }
      } catch (err) {
        console.error("Erro ao carregar sessões:", err);
        setModoVisualizacao("legado");
      }
    };

    carregarDados();
  }, []);

  // Carregar votos quando muda sessão, data ou modo + auto-refresh se sessão ativa
  useEffect(() => {
    if (modoVisualizacao === "sessao" && !sessaoSelecionada) return;
    if (modoVisualizacao === "legado" && !dataSelecionada) return;
    
    carregarVotos();
    
    // Auto-refresh para sessão ativa
    let interval;
    if (modoVisualizacao === "sessao" && sessaoSelecionada) {
      // Verificar se é uma sessão ativa para habilitar auto-refresh
      sessionService.getSessaoAtiva().then((sessaoAtiva) => {
        if (sessaoAtiva && sessaoAtiva.id === Number(sessaoSelecionada)) {
          // É sessão ativa, configurar auto-refresh a cada 10 segundos
          interval = setInterval(carregarVotos, 10000);
        }
      });
    }
    
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [modoVisualizacao, sessaoSelecionada, dataSelecionada]); // eslint-disable-line react-hooks/exhaustive-deps

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
            
            <div className="vp-controls">
              {/* Seletor de modo */}
              <div className="vp-mode">
                <label>Visualizar por:</label>
                <select
                  value={modoVisualizacao}
                  onChange={(e) => setModoVisualizacao(e.target.value)}
                >
                  <option value="sessao">Sessão (Novo)</option>
                  <option value="legado">Data (Legado)</option>
                </select>
              </div>

              {modoVisualizacao === "sessao" ? (
                // Seletor de sessão
                <div className="vp-session">
                  <label>Sessão:</label>
                  <select
                    value={sessaoSelecionada}
                    onChange={(e) => setSessaoSelecionada(e.target.value)}
                  >
                    <option value="">Selecione a sessão</option>
                    {sessoes.map((sessao) => (
                      <option key={sessao.id} value={sessao.id}>
                        {sessao.descricao} - {new Date(sessao.criado_em).toLocaleDateString('pt-BR')}
                      </option>
                    ))}
                  </select>
                </div>
              ) : (
                // Seletor de data
                <div className="vp-date">
                  <label>Data:</label>
                  <input
                    type="date"
                    value={dataSelecionada}
                    onChange={(e) => setDataSelecionada(e.target.value)}
                  />
                </div>
              )}
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
