import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import axios from 'axios';
import { toast } from 'react-toastify';
import { API_FESTIVAL } from '../../services/api';

const DashboardResultados = () => {
  const { user, token } = useAuth();
  const [etapas, setEtapas] = useState([]);
  const [etapasSelecionadas, setEtapasSelecionadas] = useState([]);
  const [resultados, setResultados] = useState({});
  const [loading, setLoading] = useState(false);
  const [filtros, setFiltros] = useState({
    tipo_votacao: 'ambos', // 'publico', 'jurados', 'ambos'
    ordenacao: 'total_pontos', // 'total_pontos', 'votos_publicos', 'votos_jurados'
    formato: 'lista' // 'lista', 'grafico'
  });

  // Verificar acesso
  useEffect(() => {
    if (!user || (user.role !== 'admin' && user.role !== 'moderador')) {
      toast.error('Acesso negado');
      return;
    }
    
    carregarEtapas();
  }, [user]); // eslint-disable-line react-hooks/exhaustive-deps

  // Carregar etapas disponíveis
  const carregarEtapas = async () => {
    try {
      const response = await axios.get(`${API_FESTIVAL}/api/etapas/listar`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      if (response.data.success) {
        setEtapas(response.data.etapas);
      }
    } catch (error) {
      console.error('Erro ao carregar etapas:', error);
      toast.error('Erro ao carregar etapas');
    }
  };

  // Carregar resultados das etapas selecionadas
  const carregarResultados = async () => {
    if (etapasSelecionadas.length === 0) {
      toast.warning('Selecione pelo menos uma etapa');
      return;
    }

    setLoading(true);
    try {
      const promises = etapasSelecionadas.map(async (etapaId) => {
        const response = await axios.get(`/api/resultados/etapa/${etapaId}`, {
          headers: { Authorization: `Bearer ${token}` },
          params: {
            tipo_votacao: filtros.tipo_votacao,
            ordenacao: filtros.ordenacao
          }
        });
        return {
          etapaId,
          dados: response.data
        };
      });

      const resultadosArray = await Promise.all(promises);
      
      const resultadosObj = {};
      resultadosArray.forEach(({ etapaId, dados }) => {
        resultadosObj[etapaId] = dados;
      });
      
      setResultados(resultadosObj);
      
    } catch (error) {
      console.error('Erro ao carregar resultados:', error);
      toast.error('Erro ao carregar resultados');
    } finally {
      setLoading(false);
    }
  };

  // Toggle seleção de etapa
  const toggleEtapa = (etapaId) => {
    setEtapasSelecionadas(prev => 
      prev.includes(etapaId) 
        ? prev.filter(id => id !== etapaId)
        : [...prev, etapaId]
    );
  };

  // Selecionar todas as etapas
  const selecionarTodas = () => {
    setEtapasSelecionadas(etapas.map(etapa => etapa.id));
  };

  // Limpar seleção
  const limparSelecao = () => {
    setEtapasSelecionadas([]);
    setResultados({});
  };

  // Exportar resultados
  const exportarResultados = async () => {
    if (Object.keys(resultados).length === 0) {
      toast.warning('Carregue os resultados primeiro');
      return;
    }

    try {
      const response = await axios.get('/api/resultados/exportar', {
        headers: { Authorization: `Bearer ${token}` },
        params: {
          etapas: etapasSelecionadas.join(','),
          tipo_votacao: filtros.tipo_votacao,
          formato: 'csv'
        },
        responseType: 'blob'
      });

      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `resultados-festival-${new Date().toISOString().split('T')[0]}.csv`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      
      toast.success('Resultados exportados com sucesso!');
      
    } catch (error) {
      console.error('Erro ao exportar:', error);
      toast.error('Erro ao exportar resultados');
    }
  };

  // Calcular estatísticas gerais
  const calcularEstatisticas = () => {
    const stats = {
      total_candidatos: 0,
      total_votos_publicos: 0,
      total_votos_jurados: 0,
      total_sessoes: 0
    };

    Object.values(resultados).forEach(resultado => {
      if (resultado.success && resultado.candidatos) {
        stats.total_candidatos += resultado.candidatos.length;
        stats.total_sessoes += resultado.total_sessoes || 0;
        
        resultado.candidatos.forEach(candidato => {
          stats.total_votos_publicos += candidato.votos_publicos || 0;
          stats.total_votos_jurados += candidato.votos_jurados || 0;
        });
      }
    });

    return stats;
  };

  const estatisticas = calcularEstatisticas();

  // Verificação de acesso
  if (!user || (user.role !== 'admin' && user.role !== 'moderador')) {
    return (
      <div className="access-denied">
        <h2>Acesso Negado</h2>
        <p>Você não tem permissão para acessar os resultados.</p>
      </div>
    );
  }

  return (
    <div className="dashboard-resultados">
      <div className="page-header">
        <h1>📊 Dashboard de Resultados</h1>
        <p>Visualize e analise os resultados do festival em tempo real</p>
      </div>

      {/* Filtros e Controles */}
      <div className="controles-resultados">
        <div className="secao-filtros">
          <h3>🎯 Filtros</h3>
          
          <div className="filtro-grupo">
            <label>Tipo de Votação:</label>
            <select 
              value={filtros.tipo_votacao}
              onChange={(e) => setFiltros(prev => ({ ...prev, tipo_votacao: e.target.value }))}
            >
              <option value="ambos">Ambos (Público + Jurados)</option>
              <option value="publico">Apenas Público</option>
              <option value="jurados">Apenas Jurados</option>
            </select>
          </div>

          <div className="filtro-grupo">
            <label>Ordenação:</label>
            <select 
              value={filtros.ordenacao}
              onChange={(e) => setFiltros(prev => ({ ...prev, ordenacao: e.target.value }))}
            >
              <option value="total_pontos">Pontuação Total</option>
              <option value="votos_publicos">Votos Públicos</option>
              <option value="votos_jurados">Votos dos Jurados</option>
            </select>
          </div>

          <div className="filtro-grupo">
            <label>Formato:</label>
            <select 
              value={filtros.formato}
              onChange={(e) => setFiltros(prev => ({ ...prev, formato: e.target.value }))}
            >
              <option value="lista">Lista</option>
              <option value="grafico">Gráfico</option>
            </select>
          </div>
        </div>

        {/* Seleção de Etapas */}
        <div className="secao-etapas">
          <h3>📋 Selecionar Etapas</h3>
          
          <div className="etapas-controles">
            <button onClick={selecionarTodas} className="btn btn-sm">
              Selecionar Todas
            </button>
            <button onClick={limparSelecao} className="btn btn-sm btn-secondary">
              Limpar
            </button>
          </div>

          <div className="etapas-lista">
            {etapas.map(etapa => (
              <label key={etapa.id} className="etapa-checkbox">
                <input
                  type="checkbox"
                  checked={etapasSelecionadas.includes(etapa.id)}
                  onChange={() => toggleEtapa(etapa.id)}
                />
                <span>{etapa.nome}</span>
              </label>
            ))}
          </div>
        </div>

        {/* Ações */}
        <div className="secao-acoes">
          <button 
            onClick={carregarResultados}
            className="btn btn-primary"
            disabled={loading || etapasSelecionadas.length === 0}
          >
            {loading ? 'Carregando...' : '🔍 Carregar Resultados'}
          </button>
          
          <button 
            onClick={exportarResultados}
            className="btn btn-success"
            disabled={Object.keys(resultados).length === 0}
          >
            📥 Exportar CSV
          </button>
        </div>
      </div>

      {/* Estatísticas Gerais */}
      {Object.keys(resultados).length > 0 && (
        <div className="estatisticas-gerais">
          <h3>📈 Estatísticas Gerais</h3>
          <div className="stats-grid">
            <div className="stat-card">
              <span className="stat-numero">{estatisticas.total_candidatos}</span>
              <span className="stat-label">Candidatos</span>
            </div>
            <div className="stat-card">
              <span className="stat-numero">{estatisticas.total_votos_publicos}</span>
              <span className="stat-label">Votos Públicos</span>
            </div>
            <div className="stat-card">
              <span className="stat-numero">{estatisticas.total_votos_jurados}</span>
              <span className="stat-label">Votos Jurados</span>
            </div>
            <div className="stat-card">
              <span className="stat-numero">{estatisticas.total_sessoes}</span>
              <span className="stat-label">Sessões</span>
            </div>
          </div>
        </div>
      )}

      {/* Resultados por Etapa */}
      <div className="resultados-container">
        {Object.entries(resultados).map(([etapaId, resultado]) => {
          const etapa = etapas.find(e => e.id === parseInt(etapaId));
          
          return (
            <div key={etapaId} className="resultado-etapa">
              <h3>🏆 {etapa?.nome}</h3>
              
              {resultado.success ? (
                <div className="candidatos-resultados">
                  {filtros.formato === 'lista' ? (
                    <div className="resultados-lista">
                      <div className="lista-header">
                        <span className="posicao">Pos.</span>
                        <span className="candidato">Candidato</span>
                        <span className="votos-publicos">Público</span>
                        <span className="votos-jurados">Jurados</span>
                        <span className="total-pontos">Total</span>
                      </div>
                      
                      {resultado.candidatos?.map((candidato, index) => (
                        <div key={candidato.id} className="candidato-resultado">
                          <span className="posicao">
                            {index === 0 && '🥇'}
                            {index === 1 && '🥈'}
                            {index === 2 && '🥉'}
                            {index > 2 && `${index + 1}º`}
                          </span>
                          <span className="candidato">{candidato.nome}</span>
                          <span className="votos-publicos">{candidato.votos_publicos || 0}</span>
                          <span className="votos-jurados">{candidato.votos_jurados || 0}</span>
                          <span className="total-pontos">{candidato.total_pontos || 0}</span>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="resultados-grafico">
                      {/* Implementação futura do gráfico */}
                      <p>📊 Visualização em gráfico será implementada em breve</p>
                    </div>
                  )}
                </div>
              ) : (
                <div className="erro-resultado">
                  <p>❌ {resultado.message || 'Erro ao carregar resultados desta etapa'}</p>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Loading */}
      {loading && (
        <div className="loading-overlay">
          <div className="loading-spinner">
            <span>Carregando resultados...</span>
          </div>
        </div>
      )}
    </div>
  );
};

export default DashboardResultados;