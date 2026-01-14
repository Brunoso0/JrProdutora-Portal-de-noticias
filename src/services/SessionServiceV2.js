import axios from 'axios';
import { API_FESTIVAL } from './api';

/**
 * SessionService - Gerenciamento completo de sessões de votação
 * Implementa todas as rotas da documentação oficial
 */
class SessionService {
  constructor() {
    this.cache = new Map();
    this.cacheTTL = 30000; // 30 segundos
  }

  // ======= MÉTODOS DE CACHE =======
  _getCacheKey(endpoint, params = {}) {
    return `${endpoint}_${JSON.stringify(params)}`;
  }

  _getFromCache(key) {
    const cached = this.cache.get(key);
    if (cached && Date.now() - cached.timestamp < this.cacheTTL) {
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

  // ======= ROTAS PRINCIPAIS DE SESSÃO =======

  /**
   * 🟢 Iniciar Nova Sessão
   * POST /api/sessoes/iniciar
   */
  async iniciarSessao(etapaId, descricao, candidatoIds = []) {
    try {
      console.log('📡 Iniciando nova sessão:', { etapaId, descricao, candidatoIds });

      // Validações básicas antes de enviar
      if (!etapaId) {
        return { success: false, error: 'etapaId é obrigatório' };
      }
      // Garante que candidatoIds é um array de números (API costuma esperar ids numéricos)
      const ids = Array.isArray(candidatoIds)
        ? candidatoIds.map((v) => (v == null ? v : Number(v))).filter((v) => !Number.isNaN(v))
        : [];

      const payload = {
        etapa_id: Number(etapaId),
        descricao: descricao || '',
        candidato_ids: ids
      };

      console.log('▶️ Payload enviar:', payload);

      const response = await axios.post(`${API_FESTIVAL}/api/sessoes/iniciar`, payload);

      this._clearCache(); // Limpar cache ao iniciar sessão

      return {
        success: true,
        sessao: response.data.sessao || response.data,
        message: response.data.mensagem || 'Sessão iniciada com sucesso'
      };
    } catch (error) {
      // Log detalhado para debugging
      console.error('❌ Erro ao iniciar sessão:', error);
      console.error('❌ error.response.data:', error.response?.data);
      // Retorna detalhes da API quando disponível (útil para mostrar validações)
      return {
        success: false,
        status: error.response?.status,
        error: error.response?.data?.erro || error.message,
        details: error.response?.data || null
      };
    }
  }

  /**
   * 📊 Obter Sessão Ativa
   * GET /api/sessoes/ativa
   */
  async getSessaoAtiva(useCache = true) {
    const cacheKey = 'sessao_ativa';
    
    if (useCache) {
      const cached = this._getFromCache(cacheKey);
      if (cached) return cached;
    }

    try {
      const response = await axios.get(`${API_FESTIVAL}/api/sessoes/ativa`);
      
      const result = {
        ativa: response.data.ativa || false,
        sessao: response.data.sessao || null,
        candidatos: response.data.sessao?.candidatos || [],
        votacaoPublicaLiberada: response.data.sessao?.votacao_publica_liberada || false,
        votacaoJuradosLiberada: response.data.sessao?.votacao_jurados_liberada || false
      };

      if (useCache) this._setCache(cacheKey, result);
      return result;
    } catch (error) {
      console.error('❌ Erro ao buscar sessão ativa:', error);
      return {
        ativa: false,
        sessao: null,
        candidatos: [],
        votacaoPublicaLiberada: false,
        votacaoJuradosLiberada: false,
        error: error.message
      };
    }
  }

  /**
   * 🔴 Encerrar Sessão Ativa
   * POST /api/sessoes/encerrar
   */
  async encerrarSessao() {
    try {
      console.log('📡 Encerrando sessão ativa...');
      
      const response = await axios.post(`${API_FESTIVAL}/api/sessoes/encerrar`);
      
      this._clearCache(); // Limpar cache ao encerrar sessão
      
      return {
        success: true,
        sessaoEncerrada: response.data.sessao_encerrada || response.data,
        message: response.data.mensagem || 'Sessão encerrada com sucesso'
      };
    } catch (error) {
      console.error('❌ Erro ao encerrar sessão:', error);
      return {
        success: false,
        error: error.response?.data?.erro || error.message
      };
    }
  }

  /**
   * 🟡 Controlar Votação Pública
   * POST /api/sessoes/ativa/toggle-publica
   */
  async toggleVotacaoPublica(status) {
    try {
      console.log('📡 Alterando votação pública:', status);
      
      const response = await axios.post(`${API_FESTIVAL}/api/sessoes/ativa/toggle-publica`, {
        status
      });
      
      this._clearCache(); // Limpar cache após mudança
      
      return {
        success: true,
        data: response.data,
        message: response.data.mensagem || `Votação pública ${status ? 'liberada' : 'bloqueada'}`
      };
    } catch (error) {
      console.error('❌ Erro ao alterar votação pública:', error);
      return {
        success: false,
        error: error.response?.data?.erro || error.message
      };
    }
  }

  /**
   * 🟠 Controlar Votação dos Jurados
   * POST /api/sessoes/ativa/toggle-jurados
   */
  async toggleVotacaoJurados(status) {
    try {
      console.log('📡 Alterando votação jurados:', status);
      
      const response = await axios.post(`${API_FESTIVAL}/api/sessoes/ativa/toggle-jurados`, {
        status
      });
      
      this._clearCache(); // Limpar cache após mudança
      
      return {
        success: true,
        data: response.data,
        message: response.data.mensagem || `Votação dos jurados ${status ? 'liberada' : 'bloqueada'}`
      };
    } catch (error) {
      console.error('❌ Erro ao alterar votação jurados:', error);
      return {
        success: false,
        error: error.response?.data?.erro || error.message
      };
    }
  }

  /**
   * 📋 Listar Todas as Sessões
   * GET /api/sessoes
   */
  async listarSessoes(useCache = true) {
    const cacheKey = 'todas_sessoes';
    
    if (useCache) {
      const cached = this._getFromCache(cacheKey);
      if (cached) return cached;
    }

    try {
      const response = await axios.get(`${API_FESTIVAL}/api/sessoes`);
      
      const sessoes = response.data.map(sessao => ({
        ...sessao,
        status: sessao.data_hora_fim ? 'Encerrada' : 'Ativa',
        dataFormatada: new Date(sessao.data_hora_inicio).toLocaleString('pt-BR'),
        dataFimFormatada: sessao.data_hora_fim ? new Date(sessao.data_hora_fim).toLocaleString('pt-BR') : null,
        duracao: sessao.data_hora_fim ? 
          this._calcularDuracao(sessao.data_hora_inicio, sessao.data_hora_fim) : 
          this._calcularDuracao(sessao.data_hora_inicio)
      }));

      const result = {
        success: true,
        sessoes,
        total: sessoes.length,
        ativas: sessoes.filter(s => s.status === 'Ativa').length,
        encerradas: sessoes.filter(s => s.status === 'Encerrada').length
      };

      if (useCache) this._setCache(cacheKey, result);
      return result;
    } catch (error) {
      console.error('❌ Erro ao listar sessões:', error);
      return {
        success: false,
        sessoes: [],
        total: 0,
        ativas: 0,
        encerradas: 0,
        error: error.message
      };
    }
  }

  // ======= MÉTODOS DE CONVENIÊNCIA =======

  /**
   * Verificar se existe sessão ativa (método rápido)
   */
  async verificarSessaoAtiva() {
    const result = await this.getSessaoAtiva();
    return result.ativa;
  }

  /**
   * Obter estatísticas da sessão ativa
   */
  async getEstatisticasSessaoAtiva() {
    const sessao = await this.getSessaoAtiva();
    if (!sessao.ativa) {
      return { ativa: false };
    }

    return {
      ativa: true,
      id: sessao.sessao.id,
      descricao: sessao.sessao.descricao,
      etapa: sessao.sessao.nome_etapa,
      totalCandidatos: sessao.candidatos.length,
      votacaoPublicaLiberada: sessao.votacaoPublicaLiberada,
      votacaoJuradosLiberada: sessao.votacaoJuradosLiberada,
      dataInicio: sessao.sessao.data_inicio,
      duracaoAtual: this._calcularDuracao(sessao.sessao.data_inicio)
    };
  }

  /**
   * Obter candidatos da sessão ativa
   */
  async getCandidatosSessaoAtiva() {
    const sessao = await this.getSessaoAtiva();
    return sessao.candidatos || [];
  }

  /**
   * Obter sessões encerradas (compatibilidade)
   */
  async getSessoesEncerradas() {
    const result = await this.listarSessoes();
    return result.sessoes.filter(s => s.status === 'Encerrada');
  }

  /**
   * Verificar permissões de votação
   */
  async verificarPermissoesVotacao() {
    const sessao = await this.getSessaoAtiva();
    return {
      sessaoAtiva: sessao.ativa,
      podeVotarPublico: sessao.ativa && sessao.votacaoPublicaLiberada,
      podeVotarJurado: sessao.ativa && sessao.votacaoJuradosLiberada,
      totalCandidatos: sessao.candidatos.length
    };
  }

  // ======= MÉTODOS AUXILIARES =======

  /**
   * Calcular duração entre duas datas ou desde uma data até agora
   */
  _calcularDuracao(dataInicio, dataFim = null) {
    const inicio = new Date(dataInicio);
    const fim = dataFim ? new Date(dataFim) : new Date();
    const diferenca = fim - inicio;
    
    const horas = Math.floor(diferenca / (1000 * 60 * 60));
    const minutos = Math.floor((diferenca % (1000 * 60 * 60)) / (1000 * 60));
    
    if (horas > 0) {
      return `${horas}h ${minutos}min`;
    }
    return `${minutos}min`;
  }

  /**
   * Limpar cache manualmente
   */
  clearCache() {
    this._clearCache();
  }

  /**
   * Obter status do cache
   */
  getCacheStatus() {
    return {
      size: this.cache.size,
      keys: Array.from(this.cache.keys()),
      ttl: this.cacheTTL
    };
  }
}

// Instância singleton
const sessionService = new SessionService();
export default sessionService;