import React, { useEffect, useState } from "react";
import axios from "axios";
import { API_FESTIVAL } from "../../services/api";
import dashboardService from "../../services/DashboardService";
import sessionService from "../../services/SessionService";
import "../styles/AvancosDoDia.css";
import { format } from "date-fns";

const AvancosDoDia = () => {
  const [etapas, setEtapas] = useState([]);
  const [sessoes, setSessoes] = useState([]);
  const [modoVisualizacao, setModoVisualizacao] = useState("sessao"); // "sessao" ou "legado"
  
  // Estados para modo sessão
  const [sessaoSelecionada, setSessaoSelecionada] = useState("");
  
  // Estados para modo legado (compatibilidade)
  const [etapaSelecionada, setEtapaSelecionada] = useState("");
  const [dataSelecionada, setDataSelecionada] = useState(
    format(new Date(), "yyyy-MM-dd")
  );
  
  const [resultados, setResultados] = useState([]);
  const [loading, setLoading] = useState(false);
  const [erro, setErro] = useState("");

  // Carregar etapas e sessões ao iniciar
  useEffect(() => {
    const carregarDados = async () => {
      try {
        // Carregar etapas
        const resEtapas = await axios.get(`${API_FESTIVAL}/api/dashboard/etapas`);
        setEtapas(resEtapas.data || []);
        
        // Carregar sessões encerradas
        const sessoes = await sessionService.getSessoesEncerradas();
        setSessoes(sessoes);
        
        // Se houver sessões, selecionar a mais recente por padrão
        if (sessoes.length > 0) {
          const sessaoMaisRecente = sessoes[0]; // Assumindo que vem ordenado por data desc
          setSessaoSelecionada(sessaoMaisRecente.id);
          setModoVisualizacao("sessao");
        } else {
          // Se não houver sessões, usar modo legado
          setModoVisualizacao("legado");
        }
        
      } catch (err) {
        console.error("Erro ao carregar dados iniciais:", err);
        setModoVisualizacao("legado"); // Fallback para modo legado
      }
    };

    carregarDados();
  }, []);

  // Buscar avanços baseado no modo selecionado
  useEffect(() => {
    if (modoVisualizacao === "sessao" && !sessaoSelecionada) return;
    if (modoVisualizacao === "legado" && (!etapaSelecionada || !dataSelecionada)) return;

    const carregarAvancos = async () => {
      setLoading(true);
      setErro("");
      
      try {
        let data = [];
        
        if (modoVisualizacao === "sessao") {
          // Usar novo sistema de sessões
          data = await dashboardService.getAvancosSessao(Number(sessaoSelecionada));
        } else {
          // Usar sistema legado com híbrido
          data = await dashboardService.getAvancosHibrido({
            etapaId: Number(etapaSelecionada),
            data: dataSelecionada
          });
        }
        
        setResultados(Array.isArray(data) ? data : []);
        
      } catch (err) {
        console.error("Erro ao buscar avanços:", err);
        setResultados([]);
        setErro("Não foi possível carregar os dados. Tente novamente.");
      } finally {
        setLoading(false);
      }
    };

    carregarAvancos();
  }, [modoVisualizacao, sessaoSelecionada, etapaSelecionada, dataSelecionada]);

  const abrirPopup = () => {
    const params = new URLSearchParams();
    
    if (modoVisualizacao === "sessao" && sessaoSelecionada) {
      params.set("sessaoId", String(sessaoSelecionada));
    } else if (modoVisualizacao === "legado" && etapaSelecionada && dataSelecionada) {
      params.set("etapa_id", String(etapaSelecionada));
      params.set("data", String(dataSelecionada));
    }
    
    const url = `${window.location.origin}/popup-avancos-dia?${params.toString()}`;
    window.open(
      url,
      "_blank",
      "noopener,noreferrer,width=1100,height=720,menubar=no,toolbar=no,location=no,status=no"
    );
  };

  const temResultados = Array.isArray(resultados) && resultados.length > 0;

  return (
    <div className="avancos-container">
      <h2>🎤 Candidatos que Avançam de Fase</h2>

      <div className="filtros-avancos">
        {/* Seletor de modo */}
        <label>
          Modo de visualização:
          <select
            value={modoVisualizacao}
            onChange={(e) => setModoVisualizacao(e.target.value)}
          >
            <option value="sessao">Por Sessão (Novo)</option>
            <option value="legado">Por Data (Legado)</option>
          </select>
        </label>

        {modoVisualizacao === "sessao" ? (
          // Modo sessão
          <label>
            Sessão:
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
          </label>
        ) : (
          // Modo legado
          <>
            <label>
              Etapa:
              <select
                value={etapaSelecionada}
                onChange={(e) => setEtapaSelecionada(e.target.value)}
              >
                <option value="">Selecione a etapa</option>
                {etapas.map((et) => (
                  <option key={et.id} value={et.id}>
                    {et.nome}
                  </option>
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
          </>
        )}
      </div>

      {loading && <p>Carregando dados...</p>}

      {!loading && erro && <p className="msg-erro">{erro}</p>}

      {!loading && !erro && (
        <>
          {temResultados ? (
            <div className="acoes-avancos">
              <button className="btn-abrir-popup" onClick={abrirPopup}>
                Abrir popup (pódio)
              </button>
              <small className="hint">
                {modoVisualizacao === "sessao" 
                  ? `Encontramos resultados para a sessão selecionada. O popup exibirá os vencedores.`
                  : `Encontramos resultados para ${dataSelecionada}. O popup exibirá os 4 ganhadores.`
                }
              </small>
            </div>
          ) : (
            <p>
              {modoVisualizacao === "sessao" 
                ? "Nenhum resultado encontrado para esta sessão."
                : "Nenhum voto registrado nesta data."
              }
            </p>
          )}
        </>
      )}
    </div>
  );
};

export default AvancosDoDia;
