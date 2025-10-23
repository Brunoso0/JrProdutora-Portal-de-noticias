import axios from 'axios';
import { API_FESTIVAL } from './api';
import sessionService from './SessionService';

/**
 * DashboardService - Centralizador de relatórios e dashboards
 * Implementa todas as rotas /api/dashboard com dados em tempo real
 * 
 * NOVAS ROTAS IMPLEMENTADAS:
 * - /api/dashboard/total-votos
 * - /api/dashboard/votos-tempo-real
 * - /api/dashboard/candidatos-mais-votados
 * - /api/dashboard/estatisticas-gerais
 * - /api/dashboard/grafico-votos-tempo
 * - /api/dashboard/ranking-sessao-ativa
 * - /api/dashboard/comparativo-sessoes
 */
class DashboardService {
  constructor() {
    this.cache = new Map();
    this.TTL = 30000; // 30 segundos de cache para dados em tempo real
    this.realTimeSubscriptions = new Map();
    this.updateCallbacks = new Map();
  }

  // ======= MÉTODOS DE CACHE =======
  _getCacheKey(endpoint, params = {}) {
    return `${endpoint}_${JSON.stringify(params)}`;
  }

  _getFromCache(key) {
    const cached = this.cache.get(key);
    if (cached && Date.now() - cached.timestamp < this.TTL) {
      return cached.data;
    }
    this.cache.delete(key);
    return null;
  }

  _setCache(key, data) {
    this.cache.set(key, {
      data,
      timestamp: Date.now()
    });
  }

  _clearCache() {
    this.cache.clear();
  }

  // ======= NOVAS ROTAS DO DASHBOARD =======

  /**
   * 📊 Total de Votos Geral
   * GET /api/dashboard/total-votos
   */
  async getTotalVotos(useCache = true) {
    const cacheKey = 'total_votos_geral';
    
    if (useCache) {
      const cached = this._getFromCache(cacheKey);
      if (cached) return cached;
    }

    try {
      const response = await axios.get(`${API_FESTIVAL}/api/dashboard/total-votos`);
      
      const result = {
        success: true,
        ...response.data,
        timestamp: new Date().toISOString()
      };

      if (useCache) this._setCache(cacheKey, result);
      return result;
    } catch (error) {
      console.error('❌ Erro ao buscar total de votos:', error);
      return {
        success: false,
        totalVotos: 0,
        votosPublicos: 0,
        votosJurados: 0,
        error: error.message
      };
    }
  }

  /**
   * ⚡ Votos em Tempo Real
   * GET /api/dashboard/votos-tempo-real
   */
  async getVotosTempoReal(useCache = false) {
    const cacheKey = 'votos_tempo_real';
    
    if (useCache) {
      const cached = this._getFromCache(cacheKey);
      if (cached) return cached;
    }

    try {
      const response = await axios.get(`${API_FESTIVAL}/api/dashboard/votos-tempo-real`);
      
      const result = {
        success: true,
        votos: response.data,
        timestamp: new Date().toISOString(),
        ultimaAtualizacao: new Date().toLocaleTimeString('pt-BR')
      };

      // Cache muito curto para dados em tempo real
      if (useCache) {
        this.cache.set(cacheKey, {
          data: result,
          timestamp: Date.now()
        });
        // Remove cache após 5 segundos
        setTimeout(() => this.cache.delete(cacheKey), 5000);
      }

      return result;
    } catch (error) {
      console.error('❌ Erro ao buscar votos em tempo real:', error);
      return {
        success: false,
        votos: [],
        error: error.message
      };
    }
  }

  /**
   * 🏆 Candidatos Mais Votados
   * GET /api/dashboard/candidatos-mais-votados
   */
  async getCandidatosMaisVotados(limite = 10, useCache = true) {
    const cacheKey = `candidatos_mais_votados_${limite}`;
    
    if (useCache) {
      const cached = this._getFromCache(cacheKey);
      if (cached) return cached;
    }

    try {
      const response = await axios.get(`${API_FESTIVAL}/api/dashboard/candidatos-mais-votados`, {
        params: { limite }
      });
      
      const candidatos = response.data.map((candidato, index) => ({
        ...candidato,
        posicao: index + 1,
        medalha: this._getMedalha(index + 1),
        percentual: candidato.totalVotos > 0 ? 
          ((candidato.votosPublicos + candidato.votosJurados) / candidato.totalVotos * 100).toFixed(1) : 0
      }));

      const result = {
        success: true,
        candidatos,
        limite,
        timestamp: new Date().toISOString()
      };

      if (useCache) this._setCache(cacheKey, result);
      return result;
    } catch (error) {
      console.error('❌ Erro ao buscar candidatos mais votados:', error);
      return {
        success: false,
        candidatos: [],
        limite,
        error: error.message
      };
    }
  }

  /**
   * 📈 Estatísticas Gerais
   * GET /api/dashboard/estatisticas-gerais
   */
  async getEstatisticasGerais(useCache = true) {
    const cacheKey = 'estatisticas_gerais';
    
    if (useCache) {
      const cached = this._getFromCache(cacheKey);
      if (cached) return cached;
    }

    try {
      const response = await axios.get(`${API_FESTIVAL}/api/dashboard/estatisticas-gerais`);
      
      const stats = response.data;
      
      const result = {
        success: true,
        estatisticas: {
          ...stats,
          mediaVotosPorCandidato: stats.totalCandidatos > 0 ? 
            (stats.totalVotos / stats.totalCandidatos).toFixed(1) : 0,
          participacaoJurados: stats.totalJurados > 0 ? 
            ((stats.juradosAtivos / stats.totalJurados) * 100).toFixed(1) : 0,
          engajamentoPublico: stats.totalVotosPublicos > 0 ? 'Alto' : 'Baixo'
        },
        timestamp: new Date().toISOString()
      };

      if (useCache) this._setCache(cacheKey, result);
      return result;
    } catch (error) {
      console.error('❌ Erro ao buscar estatísticas gerais:', error);
      return {
        success: false,
        estatisticas: {
          totalVotos: 0,
          totalCandidatos: 0,
          totalJurados: 0,
          sessoesRealizadas: 0
        },
        error: error.message
      };
    }
  }

  /**
   * 📊 Gráfico de Votos por Tempo
   * GET /api/dashboard/grafico-votos-tempo
   */
  async getGraficoVotosTempo(periodo = '24h', useCache = true) {
    const cacheKey = `grafico_votos_tempo_${periodo}`;
    
    if (useCache) {
      const cached = this._getFromCache(cacheKey);
      if (cached) return cached;
    }

    try {
      const response = await axios.get(`${API_FESTIVAL}/api/dashboard/grafico-votos-tempo`, {
        params: { periodo }
      });
      
      const dados = response.data.map(item => ({
        ...item,
        horaFormatada: new Date(item.hora).toLocaleTimeString('pt-BR', {
          hour: '2-digit',
          minute: '2-digit'
        }),
        dataFormatada: new Date(item.hora).toLocaleDateString('pt-BR')
      }));

      const result = {
        success: true,
        dados,
        periodo,
        totalPontos: dados.length,
        maiorPico: dados.length > 0 ? Math.max(...dados.map(d => d.votos)) : 0,
        timestamp: new Date().toISOString()
      };

      if (useCache) this._setCache(cacheKey, result);
      return result;
    } catch (error) {
      console.error('❌ Erro ao buscar gráfico de votos por tempo:', error);
      return {
        success: false,
        dados: [],
        periodo,
        error: error.message
      };
    }
  }

  /**
   * 🏁 Ranking da Sessão Ativa
   * GET /api/dashboard/ranking-sessao-ativa
   */
  async getRankingSessaoAtiva(useCache = true) {
    const cacheKey = 'ranking_sessao_ativa';
    
    if (useCache) {
      const cached = this._getFromCache(cacheKey);
      if (cached) return cached;
    }

    try {
      const response = await axios.get(`${API_FESTIVAL}/api/dashboard/ranking-sessao-ativa`);
      
      const candidatos = response.data.map((candidato, index) => ({
        ...candidato,
        posicao: index + 1,
        medalha: this._getMedalha(index + 1),
        statusText: candidato.eliminado ? 'Eliminado' : 'Ativo',
        statusIcon: candidato.eliminado ? '❌' : '✅'
      }));

      const result = {
        success: true,
        candidatos,
        sessaoId: candidatos[0]?.sessaoId || null,
        totalCandidatos: candidatos.length,
        candidatosAtivos: candidatos.filter(c => !c.eliminado).length,
        timestamp: new Date().toISOString()
      };

      if (useCache) this._setCache(cacheKey, result);
      return result;
    } catch (error) {
      console.error('❌ Erro ao buscar ranking da sessão ativa:', error);
      return {
        success: false,
        candidatos: [],
        sessaoId: null,
        totalCandidatos: 0,
        candidatosAtivos: 0,
        error: error.message
      };
    }
  }

  /**
   * 📊 Comparativo de Sessões
   * GET /api/dashboard/comparativo-sessoes
   */
  async getComparativoSessoes(useCache = true) {
    const cacheKey = 'comparativo_sessoes';
    
    if (useCache) {
      const cached = this._getFromCache(cacheKey);
      if (cached) return cached;
    }

    try {
      const response = await axios.get(`${API_FESTIVAL}/api/dashboard/comparativo-sessoes`);
      
      const sessoes = response.data.map(sessao => ({
        ...sessao,
        dataFormatada: new Date(sessao.dataInicio).toLocaleDateString('pt-BR'),
        horaFormatada: new Date(sessao.dataInicio).toLocaleTimeString('pt-BR'),
        duracaoFormatada: this._formatarDuracao(sessao.duracao),
        mediaVotosPorCandidato: sessao.totalCandidatos > 0 ? 
          (sessao.totalVotos / sessao.totalCandidatos).toFixed(1) : 0
      }));

      const result = {
        success: true,
        sessoes,
        totalSessoes: sessoes.length,
        totalVotosGeral: sessoes.reduce((acc, s) => acc + s.totalVotos, 0),
        sessaoMaisVotada: sessoes.length > 0 ? 
          sessoes.reduce((max, s) => s.totalVotos > max.totalVotos ? s : max) : null,
        timestamp: new Date().toISOString()
      };

      if (useCache) this._setCache(cacheKey, result);
      return result;
    } catch (error) {
      console.error('❌ Erro ao buscar comparativo de sessões:', error);
      return {
        success: false,
        sessoes: [],
        totalSessoes: 0,
        totalVotosGeral: 0,
        error: error.message
      };
    }
  }

  // ======= MÉTODOS DE TEMPO REAL =======

  /**
   * 🔄 Subscrever Atualizações em Tempo Real
   */
  subscribeToRealTimeUpdates(callback, interval = 10000) {
    const subscriptionId = Date.now().toString();
    
    const updateFunction = async () => {
      try {
        const [totalVotos, ranking, votosTempoReal] = await Promise.all([
          this.getTotalVotos(false),
          this.getRankingSessaoAtiva(false),
          this.getVotosTempoReal(false)
        ]);

        callback({
          totalVotos,
          ranking,
          votosTempoReal,
          timestamp: new Date().toISOString()
        });
      } catch (error) {
        console.error('❌ Erro na atualização em tempo real:', error);
      }
    };

    // Primeira execução imediata
    updateFunction();

    // Configurar intervalo
    const intervalId = setInterval(updateFunction, interval);
    
    this.realTimeSubscriptions.set(subscriptionId, intervalId);
    this.updateCallbacks.set(subscriptionId, callback);

    return subscriptionId;
  }

  /**
   * ⏹️ Parar Subscrição de Tempo Real
   */
  unsubscribeFromRealTimeUpdates(subscriptionId) {
    const intervalId = this.realTimeSubscriptions.get(subscriptionId);
    
    if (intervalId) {
      clearInterval(intervalId);
      this.realTimeSubscriptions.delete(subscriptionId);
      this.updateCallbacks.delete(subscriptionId);
      return true;
    }
    
    return false;
  }

  /**
   * 🔄 Atualizar Todos os Dashboards
   */
  async refreshAllDashboards() {
    this._clearCache();
    
    const callbacks = Array.from(this.updateCallbacks.values());
    
    for (const callback of callbacks) {
      try {
        const [totalVotos, ranking, votosTempoReal] = await Promise.all([
          this.getTotalVotos(false),
          this.getRankingSessaoAtiva(false),
          this.getVotosTempoReal(false)
        ]);

        callback({
          totalVotos,
          ranking,
          votosTempoReal,
          timestamp: new Date().toISOString()
        });
      } catch (error) {
        console.error('❌ Erro ao atualizar dashboard:', error);
      }
    }
  }

  // ======= MÉTODOS AUXILIARES =======

  /**
   * Obter medalha por posição
   */
  _getMedalha(posicao) {
    const medalhas = {
      1: '🥇',
      2: '🥈', 
      3: '🥉'
    };
    return medalhas[posicao] || `${posicao}º`;
  }

  /**
   * Formatar duração em minutos
   */
  _formatarDuracao(minutos) {
    if (!minutos) return '0min';
    
    if (minutos < 60) {
      return `${minutos}min`;
    }
    
    const horas = Math.floor(minutos / 60);
    const mins = minutos % 60;
    
    return mins > 0 ? `${horas}h ${mins}min` : `${horas}h`;
  }

  /**
   * Calcular tendência
   */
  _calcularTendencia(dados) {
    if (dados.length < 2) return 'estável';
    
    const ultimosDois = dados.slice(-2);
    const diferenca = ultimosDois[1].votos - ultimosDois[0].votos;
    
    if (diferenca > 0) return 'crescendo';
    if (diferenca < 0) return 'decrescendo';
    return 'estável';
  }

  // ======= MÉTODOS LEGADOS (COMPATIBILIDADE) =======
  async getAvancosSessao(sessaoId) {
    try {
      const cacheKey = `avancos_sessao_${sessaoId}`;
      const cached = this.cache.get(cacheKey);
      
      if (cached && (Date.now() - cached.timestamp) < this.TTL) {
        return cached.data;
      }

      const response = await axios.get(`${API_FESTIVAL}/api/dashboard/avancos-sessao/${sessaoId}`);
      const data = Array.isArray(response.data) ? response.data : [];
      
      // Cache dos resultados
      this.cache.set(cacheKey, {
        data: data,
        timestamp: Date.now()
      });
      
      return data;
      
    } catch (error) {
      console.error(`Erro ao buscar avanços da sessão ${sessaoId}:`, error);
      return [];
    }
  }

  /**
   * Busca avanços usando sistema legado (compatibilidade)
   * @param {number} etapaId - ID da etapa
   * @param {string} data - Data no formato YYYY-MM-DD
   * @returns {Array} Lista de vencedores/avanços
   */
  async getAvancosLegado(etapaId, data) {
    try {
      const response = await axios.get(`${API_FESTIVAL}/api/dashboard/avancos-dia`, {
        params: { etapa_id: etapaId, data: data }
      });
      
      return Array.isArray(response.data) ? response.data : [];
      
    } catch (error) {
      console.error('Erro ao buscar avanços (sistema legado):', error);
      return [];
    }
  }

  /**
   * Busca votos públicos por sessão (substitui /votos-publicos)
   * @param {number} sessaoId - ID da sessão
   * @returns {Array} Lista de candidatos com votos públicos
   */
  async getVotosPublicosSessao(sessaoId) {
    try {
      const cacheKey = `votos_publicos_sessao_${sessaoId}`;
      const cached = this.cache.get(cacheKey);
      
      if (cached && (Date.now() - cached.timestamp) < this.TTL) {
        return cached.data;
      }

      const response = await axios.get(`${API_FESTIVAL}/api/dashboard/votos-publicos-sessao/${sessaoId}`);
      const data = Array.isArray(response.data) ? response.data : [];
      
      // Cache dos resultados
      this.cache.set(cacheKey, {
        data: data,
        timestamp: Date.now()
      });
      
      return data;
      
    } catch (error) {
      console.error(`Erro ao buscar votos públicos da sessão ${sessaoId}:`, error);
      return [];
    }
  }

  /**
   * Busca votos públicos usando sistema legado (compatibilidade)
   * @param {string} data - Data no formato YYYY-MM-DD
   * @returns {Array} Lista de candidatos com votos públicos
   */
  async getVotosPublicosLegado(data) {
    try {
      const response = await axios.get(`${API_FESTIVAL}/api/dashboard/votos-publicos`, {
        params: { data: data }
      });
      
      return Array.isArray(response.data) ? response.data : [];
      
    } catch (error) {
      console.error('Erro ao buscar votos públicos (sistema legado):', error);
      return [];
    }
  }

  /**
   * Busca histórico completo de vencedores de todas as sessões
   * @param {Object} filtros - Filtros opcionais
   * @param {number} filtros.etapa_id - Filtrar por etapa
   * @param {string} filtros.data_inicio - Data de início
   * @param {string} filtros.data_fim - Data de fim
   * @returns {Array} Histórico de vencedores
   */
  async getHistoricoVencedores(filtros = {}) {
    try {
      const params = new URLSearchParams();
      
      if (filtros.etapa_id) params.append('etapa_id', filtros.etapa_id);
      if (filtros.data_inicio) params.append('data_inicio', filtros.data_inicio);
      if (filtros.data_fim) params.append('data_fim', filtros.data_fim);
      
      const url = `${API_FESTIVAL}/api/dashboard/vencedores-historico${params.toString() ? '?' + params.toString() : ''}`;
      const response = await axios.get(url);
      
      return Array.isArray(response.data) ? response.data : [];
      
    } catch (error) {
      console.error('Erro ao buscar histórico de vencedores:', error);
      return [];
    }
  }

  /**
   * Busca total de votos por sessão (substitui /total do dashboardVotos)
   * @param {number} sessaoId - ID da sessão
   * @returns {Object} Dados do total de votos
   */
  async getTotalVotosSessao(sessaoId) {
    try {
      const response = await axios.get(`${API_FESTIVAL}/api/dashboardvotos/total-sessao/${sessaoId}`);
      return response.data || { total: 0 };
      
    } catch (error) {
      console.error(`Erro ao buscar total de votos da sessão ${sessaoId}:`, error);
      return { total: 0 };
    }
  }

  /**
   * Busca total de votos usando sistema legado (compatibilidade)
   * @param {number} etapaId - ID da etapa
   * @param {string} data - Data no formato YYYY-MM-DD
   * @returns {Object} Dados do total de votos
   */
  async getTotalVotosLegado(etapaId, data) {
    try {
      const response = await axios.get(`${API_FESTIVAL}/api/dashboardvotos/total`, {
        params: { etapa_id: etapaId, data: data }
      });
      
      return response.data || { total: 0 };
      
    } catch (error) {
      console.error('Erro ao buscar total de votos (sistema legado):', error);
      return { total: 0 };
    }
  }

  /**
   * Busca votos por minuto por sessão (substitui /por-minuto do dashboardVotos)
   * @param {number} sessaoId - ID da sessão
   * @returns {Array} Dados de votos por minuto
   */
  async getVotosPorMinutoSessao(sessaoId) {
    try {
      const response = await axios.get(`${API_FESTIVAL}/api/dashboardvotos/por-minuto-sessao/${sessaoId}`);
      return Array.isArray(response.data) ? response.data : [];
      
    } catch (error) {
      console.error(`Erro ao buscar votos por minuto da sessão ${sessaoId}:`, error);
      return [];
    }
  }

  /**
   * Busca votos por minuto usando sistema legado (compatibilidade)
   * @param {number} etapaId - ID da etapa
   * @param {string} data - Data no formato YYYY-MM-DD
   * @returns {Array} Dados de votos por minuto
   */
  async getVotosPorMinutoLegado(etapaId, data) {
    try {
      const response = await axios.get(`${API_FESTIVAL}/api/dashboardvotos/por-minuto`, {
        params: { etapa_id: etapaId, data: data }
      });
      
      return Array.isArray(response.data) ? response.data : [];
      
    } catch (error) {
      console.error('Erro ao buscar votos por minuto (sistema legado):', error);
      return [];
    }
  }

  /**
   * Busca candidato mais votado por minuto por sessão (substitui /top-minuto do dashboardVotos)
   * @param {number} sessaoId - ID da sessão
   * @returns {Object|null} Dados do candidato mais votado por minuto
   */
  async getTopMinutoSessao(sessaoId) {
    try {
      const response = await axios.get(`${API_FESTIVAL}/api/dashboardvotos/top-minuto-sessao/${sessaoId}`);
      return response.data || null;
      
    } catch (error) {
      console.error(`Erro ao buscar top minuto da sessão ${sessaoId}:`, error);
      return null;
    }
  }

  /**
   * Busca candidato mais votado por minuto usando sistema legado (compatibilidade)
   * @param {number} etapaId - ID da etapa
   * @param {string} data - Data no formato YYYY-MM-DD
   * @returns {Object|null} Dados do candidato mais votado por minuto
   */
  async getTopMinutoLegado(etapaId, data) {
    try {
      const response = await axios.get(`${API_FESTIVAL}/api/dashboardvotos/top-minuto`, {
        params: { etapa_id: etapaId, data: data }
      });
      
      return response.data || null;
      
    } catch (error) {
      console.error('Erro ao buscar top minuto (sistema legado):', error);
      return null;
    }
  }

  /**
   * Busca notas gerais por sessão (substitui /notas-gerais do dashboardVotos)
   * @param {number} sessaoId - ID da sessão
   * @returns {Array} Ranking de candidatos com notas gerais
   */
  async getNotasGeraisSessao(sessaoId) {
    try {
      const cacheKey = `notas_gerais_sessao_${sessaoId}`;
      const cached = this.cache.get(cacheKey);
      
      if (cached && (Date.now() - cached.timestamp) < this.TTL) {
        return cached.data;
      }

      const response = await axios.get(`${API_FESTIVAL}/api/dashboardvotos/notas-gerais-sessao/${sessaoId}`);
      const data = Array.isArray(response.data) ? response.data : [];
      
      // Cache dos resultados
      this.cache.set(cacheKey, {
        data: data,
        timestamp: Date.now()
      });
      
      return data;
      
    } catch (error) {
      console.error(`Erro ao buscar notas gerais da sessão ${sessaoId}:`, error);
      return [];
    }
  }

  /**
   * Busca notas gerais usando sistema legado (compatibilidade)
   * @param {string} data - Data no formato YYYY-MM-DD
   * @returns {Array} Ranking de candidatos com notas gerais
   */
  async getNotasGeraisLegado(data) {
    try {
      const response = await axios.get(`${API_FESTIVAL}/api/dashboardvotos/notas-gerais`, {
        params: { data: data }
      });
      
      return Array.isArray(response.data) ? response.data : [];
      
    } catch (error) {
      console.error('Erro ao buscar notas gerais (sistema legado):', error);
      return [];
    }
  }

  /**
   * Busca estatísticas gerais de uma sessão
   * @param {number} sessaoId - ID da sessão
   * @returns {Object} Estatísticas da sessão
   */
  async getEstatisticasSessao(sessaoId) {
    try {
      const response = await axios.get(`${API_FESTIVAL}/api/dashboard/estatisticas-sessao/${sessaoId}`);
      
      return response.data || {
        total_votos: 0,
        total_votos_publicos: 0,
        total_votos_jurados: 0,
        total_candidatos: 0,
        jurados_ativos: 0
      };
      
    } catch (error) {
      console.error(`Erro ao buscar estatísticas da sessão ${sessaoId}:`, error);
      return {
        total_votos: 0,
        total_votos_publicos: 0,
        total_votos_jurados: 0,
        total_candidatos: 0,
        jurados_ativos: 0
      };
    }
  }

  /**
   * Busca ranking em tempo real da sessão ativa
   * @returns {Array} Ranking atualizado
   */
  async getRankingTempoReal() {
    try {
      const sessaoAtiva = await sessionService.getSessaoAtiva();
      if (!sessaoAtiva) {
        return [];
      }

      const response = await axios.get(`${API_FESTIVAL}/api/dashboard/ranking-tempo-real/${sessaoAtiva.id}`);
      return Array.isArray(response.data) ? response.data : [];
      
    } catch (error) {
      console.error('Erro ao buscar ranking em tempo real:', error);
      return [];
    }
  }

  /**
   * Método híbrido para buscar avanços (sessão ou legado)
   * @param {Object} params - Parâmetros da busca
   * @param {number} params.sessaoId - ID da sessão (prioritário)
   * @param {number} params.etapaId - ID da etapa (fallback)
   * @param {string} params.data - Data (fallback)
   * @returns {Array} Lista de vencedores/avanços
   */
  async getAvancosHibrido(params) {
    if (params.sessaoId) {
      return await this.getAvancosSessao(params.sessaoId);
    } else if (params.etapaId && params.data) {
      return await this.getAvancosLegado(params.etapaId, params.data);
    } else {
      console.warn('Parâmetros insuficientes para buscar avanços');
      return [];
    }
  }

  /**
   * Método híbrido para buscar votos públicos (sessão ou legado)
   * @param {Object} params - Parâmetros da busca
   * @param {number} params.sessaoId - ID da sessão (prioritário)
   * @param {string} params.data - Data (fallback)
   * @returns {Array} Lista de candidatos com votos públicos
   */
  async getVotosPublicosHibrido(params) {
    if (params.sessaoId) {
      return await this.getVotosPublicosSessao(params.sessaoId);
    } else if (params.data) {
      return await this.getVotosPublicosLegado(params.data);
    } else {
      console.warn('Parâmetros insuficientes para buscar votos públicos');
      return [];
    }
  }

  /**
   * Método híbrido para buscar dados completos do dashboard
   * @param {Object} params - Parâmetros da busca
   * @param {number} params.sessaoId - ID da sessão (prioritário)
   * @param {number} params.etapaId - ID da etapa (fallback)
   * @param {string} params.data - Data (fallback)
   * @returns {Object} Dados completos do dashboard
   */
  async getDashboardCompletoHibrido(params) {
    try {
      let dados = {};

      if (params.sessaoId) {
        // Buscar dados por sessão
        const [
          totalVotos,
          votosPorMinuto,
          topMinuto,
          notasGerais,
          estatisticas
        ] = await Promise.all([
          this.getTotalVotosSessao(params.sessaoId),
          this.getVotosPorMinutoSessao(params.sessaoId),
          this.getTopMinutoSessao(params.sessaoId),
          this.getNotasGeraisSessao(params.sessaoId),
          this.getEstatisticasSessao(params.sessaoId)
        ]);

        dados = {
          totalVotos,
          votosPorMinuto,
          topMinuto,
          notasGerais,
          estatisticas,
          fonte: 'sessao'
        };

      } else if (params.etapaId && params.data) {
        // Buscar dados por etapa/data (legado)
        const [
          totalVotos,
          votosPorMinuto,
          topMinuto,
          notasGerais
        ] = await Promise.all([
          this.getTotalVotosLegado(params.etapaId, params.data),
          this.getVotosPorMinutoLegado(params.etapaId, params.data),
          this.getTopMinutoLegado(params.etapaId, params.data),
          this.getNotasGeraisLegado(params.data)
        ]);

        dados = {
          totalVotos,
          votosPorMinuto,
          topMinuto,
          notasGerais,
          estatisticas: null,
          fonte: 'legado'
        };
      }

      return dados;

    } catch (error) {
      console.error('Erro ao buscar dashboard completo:', error);
      return {
        totalVotos: { total: 0 },
        votosPorMinuto: [],
        topMinuto: null,
        notasGerais: [],
        estatisticas: null,
        fonte: 'erro'
      };
    }
  }

  /**
   * Limpa todo o cache de dados
   */
  limparCache() {
    this.cache.clear();
  }

  /**
   * Limpa cache específico por padrão
   * @param {string} padrao - Padrão para limpar (ex: 'sessao_123')
   */
  limparCachePadrao(padrao) {
    for (const [key] of this.cache) {
      if (key.includes(padrao)) {
        this.cache.delete(key);
      }
    }
  }

  // ======= MÉTODOS DE GERENCIAMENTO =======

  /**
   * Limpar todo o cache
   */
  clearCache() {
    this._clearCache();
  }

  /**
   * Parar todas as subscrições de tempo real
   */
  stopAllRealTimeUpdates() {
    this.realTimeSubscriptions.forEach(intervalId => {
      clearInterval(intervalId);
    });
    
    this.realTimeSubscriptions.clear();
    this.updateCallbacks.clear();
  }

  /**
   * Obter status do serviço
   */
  getServiceStatus() {
    return {
      cacheSize: this.cache.size,
      activeSubscriptions: this.realTimeSubscriptions.size,
      cacheTTL: this.TTL,
      endpoints: [
        'total-votos',
        'votos-tempo-real', 
        'candidatos-mais-votados',
        'estatisticas-gerais',
        'grafico-votos-tempo',
        'ranking-sessao-ativa',
        'comparativo-sessoes'
      ]
    };
  }

  /**
   * Configurar TTL do cache
   */
  configurarCache(ttl) {
    this.TTL = ttl;
  }

  /**
   * Obtém candidatos aptos para votação na sessão ativa
   * @returns {Array} Lista de candidatos aptos
   */
  async getCandidatosAptosVotacao() {
    try {
      const response = await axios.get(`${API_FESTIVAL}/api/dashboard/aptos-votacao`);
      return Array.isArray(response.data) ? response.data : [];
      
    } catch (error) {
      console.error('Erro ao buscar candidatos aptos para votação:', error);
      return [];
    }
  }

  /**
   * Busca dados para a área do candidato
   * @param {number} candidatoId - ID do candidato
   * @param {string} etapa - Nome da etapa (opcional)
   * @returns {Object|null} Dados do candidato
   */
  async getDadosCandidato(candidatoId, etapa = null) {
    try {
      let url = `${API_FESTIVAL}/api/dashboard/notas/${candidatoId}`;
      if (etapa) {
        url += `/${etapa}`;
      }
      
      const response = await axios.get(url);
      return response.data || null;
      
    } catch (error) {
      console.error(`Erro ao buscar dados do candidato ${candidatoId}:`, error);
      return null;
    }
  }
}

// Instância singleton
const dashboardService = new DashboardService();

export default dashboardService;

// Também exportar a classe para casos especiais
export { DashboardService };