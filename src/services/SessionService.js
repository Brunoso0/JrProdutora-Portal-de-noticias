import axios from 'axios';
import { API_FESTIVAL } from './api';

/**
 * SessionService - Centralizador de todas as operações relacionadas a sessões
 * 
 * Este service abstrai a comunicação com as APIs de sessão e fornece
 * métodos consistentes para gerenciar o estado das sessões de votação.
 */
class SessionService {
  constructor() {
    this.cache = {
      sessaoAtiva: null,
      cacheTime: 0,
      TTL: 60000 // 1 minuto de cache
    };
  }

  /**
   * Busca a sessão ativa atual
   * @param {boolean} forceRefresh - Força atualização ignorando cache
   * @returns {Object|null} Sessão ativa ou null
   */
  async getSessaoAtiva(forceRefresh = false) {
    try {
      // Verificar cache se não forçar refresh
      if (!forceRefresh && this.cache.sessaoAtiva && 
          (Date.now() - this.cache.cacheTime) < this.cache.TTL) {
        return this.cache.sessaoAtiva;
      }

      const response = await axios.get(`${API_FESTIVAL}/api/sessoes/ativa`);
      
      // Normalizar resposta independente do formato
      let sessao = null;
      
      if (response.data) {
        if (response.data.id) {
          // Formato direto: { id, etapa_id, descricao, ... }
          sessao = response.data;
        } else if (response.data.data && response.data.data.id) {
          // Formato encapsulado: { success: true, data: { id, ... } }
          sessao = response.data.data;
        } else if (Array.isArray(response.data) && response.data.length > 0 && response.data[0].id) {
          // Formato array: [{ id, ... }]
          sessao = response.data[0];
        }
      }

      // Atualizar cache
      this.cache.sessaoAtiva = sessao;
      this.cache.cacheTime = Date.now();
      
      return sessao;
      
    } catch (error) {
      console.warn('Erro ao buscar sessão ativa:', error);
      
      // Se for erro 404 ou similar, não há sessão ativa
      if (error.response && [404, 204].includes(error.response.status)) {
        this.cache.sessaoAtiva = null;
        this.cache.cacheTime = Date.now();
        return null;
      }
      
      // Para outros erros, retornar cache se existir
      return this.cache.sessaoAtiva;
    }
  }

  /**
   * Verifica se há uma sessão ativa
   * @returns {boolean} true se há sessão ativa
   */
  async verificarSessaoAtiva() {
    const sessao = await this.getSessaoAtiva();
    return !!sessao;
  }

  /**
   * Inicia uma nova sessão de votação
   * @param {Object} dadosSessao - Dados da sessão
   * @param {number} dadosSessao.etapa_id - ID da etapa
   * @param {string} dadosSessao.descricao - Descrição da sessão
   * @param {Array} dadosSessao.candidatos_selecionados - IDs dos candidatos (opcional)
   * @returns {Object} Resultado da operação
   */
  async iniciarSessao(dadosSessao) {
    try {
      const token = localStorage.getItem('token');
      const headers = token ? { Authorization: `Bearer ${token}` } : {};
      
      const payload = {
        etapa_id: dadosSessao.etapa_id,
        descricao: dadosSessao.descricao,
        data_hora_inicio: new Date().toISOString()
      };

      // Adicionar candidatos se fornecidos
      if (dadosSessao.candidatos_selecionados && dadosSessao.candidatos_selecionados.length > 0) {
        payload.candidatos_selecionados = dadosSessao.candidatos_selecionados;
      }

      const response = await axios.post(
        `${API_FESTIVAL}/api/sessoes/iniciar`, 
        payload, 
        { headers }
      );

      // Normalizar resposta
      let sessao = null;
      if (response.data) {
        if (response.data.id) {
          sessao = response.data;
        } else if (response.data.sessao && response.data.sessao.id) {
          sessao = response.data.sessao;
        } else if (response.data.data && response.data.data.id) {
          sessao = response.data.data;
        }
      }

      if (sessao) {
        // Limpar cache e definir nova sessão
        this.cache.sessaoAtiva = sessao;
        this.cache.cacheTime = Date.now();
        
        return {
          success: true,
          sessao: sessao,
          message: 'Sessão iniciada com sucesso!'
        };
      } else {
        return {
          success: false,
          message: 'Resposta inesperada do servidor ao iniciar sessão'
        };
      }

    } catch (error) {
      console.error('Erro ao iniciar sessão:', error);
      
      const message = error.response?.data?.message || 
                     error.response?.data?.error || 
                     'Erro ao iniciar sessão';
                     
      return {
        success: false,
        message: message
      };
    }
  }

  /**
   * Encerra a sessão ativa atual
   * @returns {Object} Resultado da operação
   */
  async encerrarSessao() {
    try {
      const token = localStorage.getItem('token');
      const headers = token ? { Authorization: `Bearer ${token}` } : {};
      
      await axios.post(`${API_FESTIVAL}/api/sessoes/encerrar`, {}, { headers });
      
      // Limpar cache
      this.cache.sessaoAtiva = null;
      this.cache.cacheTime = Date.now();
      
      return {
        success: true,
        message: 'Sessão encerrada com sucesso!'
      };

    } catch (error) {
      console.error('Erro ao encerrar sessão:', error);
      
      const message = error.response?.data?.message || 
                     error.response?.data?.error || 
                     'Erro ao encerrar sessão';
                     
      return {
        success: false,
        message: message
      };
    }
  }

  /**
   * Lista todas as sessões encerradas
   * @param {Object} filtros - Filtros opcionais
   * @param {number} filtros.etapa_id - Filtrar por etapa
   * @param {string} filtros.data_inicio - Data de início
   * @param {string} filtros.data_fim - Data de fim
   * @returns {Array} Lista de sessões encerradas
   */
  async getSessoesEncerradas(filtros = {}) {
    try {
      const params = new URLSearchParams();
      
      if (filtros.etapa_id) params.append('etapa_id', filtros.etapa_id);
      if (filtros.data_inicio) params.append('data_inicio', filtros.data_inicio);
      if (filtros.data_fim) params.append('data_fim', filtros.data_fim);
      
      const url = `${API_FESTIVAL}/api/sessoes/encerradas${params.toString() ? '?' + params.toString() : ''}`;
      const response = await axios.get(url);
      
      return Array.isArray(response.data) ? response.data : [];
      
    } catch (error) {
      console.error('Erro ao buscar sessões encerradas:', error);
      return [];
    }
  }

  /**
   * Busca detalhes de uma sessão específica
   * @param {number} sessaoId - ID da sessão
   * @returns {Object|null} Dados da sessão
   */
  async getSessao(sessaoId) {
    try {
      const response = await axios.get(`${API_FESTIVAL}/api/sessoes/${sessaoId}`);
      return response.data || null;
      
    } catch (error) {
      console.error(`Erro ao buscar sessão ${sessaoId}:`, error);
      return null;
    }
  }

  /**
   * Alterna votação popular da sessão ativa
   * @param {boolean} status - true para ativar, false para desativar
   * @returns {Object} Resultado da operação
   */
  async toggleVotacaoPopular(status) {
    try {
      const token = localStorage.getItem('token');
      const headers = token ? { Authorization: `Bearer ${token}` } : {};
      
      await axios.post(
        `${API_FESTIVAL}/api/sessoes/ativa/toggle-popular`, 
        { status }, 
        { headers }
      );
      
      // Atualizar cache local se existir
      if (this.cache.sessaoAtiva) {
        this.cache.sessaoAtiva.votacao_publica_ativa = status;
      }
      
      return {
        success: true,
        message: `Votação popular ${status ? 'ativada' : 'desativada'} com sucesso!`
      };

    } catch (error) {
      console.error('Erro ao alterar votação popular:', error);
      
      return {
        success: false,
        message: error.response?.data?.message || 'Erro ao alterar votação popular'
      };
    }
  }

  /**
   * Alterna votação de jurados da sessão ativa
   * @param {boolean} status - true para ativar, false para desativar
   * @returns {Object} Resultado da operação
   */
  async toggleVotacaoJurados(status) {
    try {
      const token = localStorage.getItem('token');
      const headers = token ? { Authorization: `Bearer ${token}` } : {};
      
      await axios.post(
        `${API_FESTIVAL}/api/sessoes/ativa/toggle-jurados`, 
        { status }, 
        { headers }
      );
      
      // Atualizar cache local se existir
      if (this.cache.sessaoAtiva) {
        this.cache.sessaoAtiva.votacao_jurados_ativa = status;
      }
      
      return {
        success: true,
        message: `Votação de jurados ${status ? 'ativada' : 'desativada'} com sucesso!`
      };

    } catch (error) {
      console.error('Erro ao alterar votação de jurados:', error);
      
      return {
        success: false,
        message: error.response?.data?.message || 'Erro ao alterar votação de jurados'
      };
    }
  }

  /**
   * Limpa o cache de sessão (útil para forçar refresh)
   */
  limparCache() {
    this.cache.sessaoAtiva = null;
    this.cache.cacheTime = 0;
  }

  /**
   * Obtém estatísticas da sessão ativa
   * @returns {Object|null} Estatísticas da sessão
   */
  async getEstatisticasSessaoAtiva() {
    try {
      const response = await axios.get(`${API_FESTIVAL}/api/sessoes/ativa/estatisticas`);
      return response.data || null;
      
    } catch (error) {
      console.error('Erro ao buscar estatísticas da sessão:', error);
      return null;
    }
  }

  /**
   * Busca candidatos participantes da sessão ativa
   * @returns {Array} Lista de candidatos
   */
  async getCandidatosSessaoAtiva() {
    try {
      const response = await axios.get(`${API_FESTIVAL}/api/sessoes/ativa/candidatos`);
      return Array.isArray(response.data) ? response.data : [];
      
    } catch (error) {
      console.error('Erro ao buscar candidatos da sessão:', error);
      return [];
    }
  }
}

// Instância singleton para uso global
const sessionService = new SessionService();

export default sessionService;

// Também exportar a classe para casos especiais
export { SessionService };