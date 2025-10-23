import axios from 'axios';
import { API_FESTIVAL } from './api';

/**
 * EtapasService - Gerenciamento completo de etapas do festival
 * Implementa todas as rotas da documentação oficial para etapas
 */
class EtapasService {
  constructor() {
    this.cache = new Map();
    this.cacheTTL = 60000; // 1 minuto (etapas mudam pouco)
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

  // ======= ROTAS PRINCIPAIS DE ETAPAS =======

  /**
   * 📋 Listar Todas as Etapas
   * GET /api/etapas
   */
  async listarEtapas(useCache = true) {
    const cacheKey = 'todas_etapas';
    
    if (useCache) {
      const cached = this._getFromCache(cacheKey);
      if (cached) return cached;
    }

    try {
      const response = await axios.get(`${API_FESTIVAL}/api/etapas/listar`);
      
      const etapas = response.data.map(etapa => ({
        ...etapa,
        dataFormatada: etapa.data_etapa ? new Date(etapa.data_etapa).toLocaleDateString('pt-BR') : null,
        statusText: etapa.ativa ? 'Ativa' : 'Inativa',
        criadoEm: new Date(etapa.criado_em).toLocaleString('pt-BR')
      }));

      const result = {
        success: true,
        etapas,
        total: etapas.length,
        ativas: etapas.filter(e => e.ativa).length,
        inativas: etapas.filter(e => !e.ativa).length
      };

      if (useCache) this._setCache(cacheKey, result);
      return result;
    } catch (error) {
      console.error('❌ Erro ao listar etapas:', error);
      return {
        success: false,
        etapas: [],
        total: 0,
        ativas: 0,
        inativas: 0,
        error: error.message
      };
    }
  }

  /**
   * 🆕 Criar Nova Etapa
   * POST /api/etapas
   */
  async criarEtapa(nome, descricao, dataEtapa) {
    try {
      console.log('📡 Criando nova etapa:', { nome, descricao, dataEtapa });
      
      const response = await axios.post(`${API_FESTIVAL}/api/etapas`, {
        nome,
        descricao,
        data_etapa: dataEtapa
      });

      this._clearCache(); // Limpar cache após criar
      
      return {
        success: true,
        id: response.data.id,
        message: response.data.mensagem || 'Etapa criada com sucesso'
      };
    } catch (error) {
      console.error('❌ Erro ao criar etapa:', error);
      return {
        success: false,
        error: error.response?.data?.erro || error.message
      };
    }
  }

  /**
   * 👁️ Buscar Etapa por ID
   * GET /api/etapas/{id}
   */
  async buscarEtapaPorId(id, useCache = true) {
    const cacheKey = `etapa_${id}`;
    
    if (useCache) {
      const cached = this._getFromCache(cacheKey);
      if (cached) return cached;
    }

    try {
      const response = await axios.get(`${API_FESTIVAL}/api/etapas/${id}`);
      
      const etapa = {
        ...response.data,
        dataFormatada: response.data.data_etapa ? new Date(response.data.data_etapa).toLocaleDateString('pt-BR') : null,
        statusText: response.data.ativa ? 'Ativa' : 'Inativa',
        criadoEm: new Date(response.data.criado_em).toLocaleString('pt-BR')
      };

      const result = {
        success: true,
        etapa
      };

      if (useCache) this._setCache(cacheKey, result);
      return result;
    } catch (error) {
      console.error('❌ Erro ao buscar etapa:', error);
      return {
        success: false,
        etapa: null,
        error: error.message
      };
    }
  }

  /**
   * ✏️ Atualizar Etapa
   * PUT /api/etapas/{id}
   */
  async atualizarEtapa(id, nome, descricao, dataEtapa) {
    try {
      console.log('📡 Atualizando etapa:', { id, nome, descricao, dataEtapa });
      
      const response = await axios.put(`${API_FESTIVAL}/api/etapas/${id}`, {
        nome,
        descricao,
        data_etapa: dataEtapa
      });

      this._clearCache(); // Limpar cache após atualizar
      
      return {
        success: true,
        message: response.data.mensagem || 'Etapa atualizada com sucesso'
      };
    } catch (error) {
      console.error('❌ Erro ao atualizar etapa:', error);
      return {
        success: false,
        error: error.response?.data?.erro || error.message
      };
    }
  }

  /**
   * 🗑️ Deletar Etapa
   * DELETE /api/etapas/{id}
   */
  async deletarEtapa(id) {
    try {
      console.log('📡 Deletando etapa:', id);
      
      const response = await axios.delete(`${API_FESTIVAL}/api/etapas/${id}`);

      this._clearCache(); // Limpar cache após deletar
      
      return {
        success: true,
        message: response.data.mensagem || 'Etapa deletada com sucesso'
      };
    } catch (error) {
      console.error('❌ Erro ao deletar etapa:', error);
      return {
        success: false,
        error: error.response?.data?.erro || error.message
      };
    }
  }

  /**
   * 🔄 Ativar/Desativar Etapa
   * PATCH /api/etapas/{id}/status
   */
  async alterarStatusEtapa(id, ativa) {
    try {
      console.log('📡 Alterando status da etapa:', { id, ativa });
      
      const response = await axios.patch(`${API_FESTIVAL}/api/etapas/${id}/status`, {
        ativa
      });

      this._clearCache(); // Limpar cache após mudança
      
      return {
        success: true,
        message: response.data.mensagem || `Etapa ${ativa ? 'ativada' : 'desativada'} com sucesso`
      };
    } catch (error) {
      console.error('❌ Erro ao alterar status da etapa:', error);
      return {
        success: false,
        error: error.response?.data?.erro || error.message
      };
    }
  }

  /**
   * 📊 Obter Estatísticas da Etapa
   * GET /api/etapas/{id}/estatisticas
   */
  async obterEstatisticasEtapa(id, useCache = true) {
    const cacheKey = `estatisticas_etapa_${id}`;
    
    if (useCache) {
      const cached = this._getFromCache(cacheKey);
      if (cached) return cached;
    }

    try {
      const response = await axios.get(`${API_FESTIVAL}/api/etapas/${id}/estatisticas`);
      
      const estatisticas = {
        ...response.data,
        percentualCandidatosAtivos: response.data.total_candidatos > 0 ? 
          ((response.data.candidatos_ativos / response.data.total_candidatos) * 100).toFixed(1) : 0,
        mediVotosPorSessao: response.data.total_sessoes > 0 ? 
          (response.data.total_votos / response.data.total_sessoes).toFixed(0) : 0
      };

      const result = {
        success: true,
        estatisticas
      };

      if (useCache) this._setCache(cacheKey, result);
      return result;
    } catch (error) {
      console.error('❌ Erro ao obter estatísticas da etapa:', error);
      return {
        success: false,
        estatisticas: null,
        error: error.message
      };
    }
  }

  // ======= MÉTODOS DE CONVENIÊNCIA =======

  /**
   * Listar apenas etapas ativas
   */
  async listarEtapasAtivas() {
    const result = await this.listarEtapas();
    return {
      ...result,
      etapas: result.etapas.filter(e => e.ativa)
    };
  }

  /**
   * Buscar etapa por nome
   */
  async buscarEtapaPorNome(nome) {
    const result = await this.listarEtapas();
    const etapa = result.etapas.find(e => 
      e.nome.toLowerCase().includes(nome.toLowerCase())
    );
    
    return {
      success: !!etapa,
      etapa: etapa || null
    };
  }

  /**
   * Verificar se etapa existe
   */
  async verificarEtapaExiste(id) {
    const result = await this.buscarEtapaPorId(id);
    return result.success;
  }

  /**
   * Obter próxima etapa (por data)
   */
  async obterProximaEtapa() {
    const result = await this.listarEtapasAtivas();
    const hoje = new Date();
    
    const proximaEtapa = result.etapas
      .filter(e => e.data_etapa && new Date(e.data_etapa) >= hoje)
      .sort((a, b) => new Date(a.data_etapa) - new Date(b.data_etapa))[0];
    
    return {
      success: !!proximaEtapa,
      etapa: proximaEtapa || null
    };
  }

  /**
   * Estatísticas gerais de todas as etapas
   */
  async obterEstatisticasGerais() {
    try {
      const result = await this.listarEtapas();
      const estatisticas = await Promise.all(
        result.etapas.map(e => this.obterEstatisticasEtapa(e.id))
      );

      const totalCandidatos = estatisticas.reduce((acc, stat) => 
        acc + (stat.estatisticas?.total_candidatos || 0), 0);
      const totalVotos = estatisticas.reduce((acc, stat) => 
        acc + (stat.estatisticas?.total_votos || 0), 0);
      const totalSessoes = estatisticas.reduce((acc, stat) => 
        acc + (stat.estatisticas?.total_sessoes || 0), 0);

      return {
        success: true,
        estatisticas: {
          totalEtapas: result.total,
          etapasAtivas: result.ativas,
          etapasInativas: result.inativas,
          totalCandidatos,
          totalVotos,
          totalSessoes,
          mediaVotosPorEtapa: result.total > 0 ? (totalVotos / result.total).toFixed(0) : 0
        }
      };
    } catch (error) {
      console.error('❌ Erro ao obter estatísticas gerais:', error);
      return {
        success: false,
        estatisticas: null,
        error: error.message
      };
    }
  }

  // ======= MÉTODOS AUXILIARES =======

  /**
   * Validar dados da etapa
   */
  _validarDadosEtapa(nome, descricao, dataEtapa) {
    const errors = [];
    
    if (!nome || nome.trim().length < 3) {
      errors.push('Nome deve ter pelo menos 3 caracteres');
    }
    
    if (dataEtapa && new Date(dataEtapa) < new Date()) {
      errors.push('Data da etapa não pode ser no passado');
    }
    
    return errors;
  }

  /**
   * Formatar etapa para exibição
   */
  formatarEtapa(etapa) {
    return {
      ...etapa,
      nomeCompleto: `${etapa.nome}${etapa.descricao ? ` - ${etapa.descricao}` : ''}`,
      statusIcon: etapa.ativa ? '🟢' : '🔴',
      dataRelativa: etapa.data_etapa ? this._getDataRelativa(etapa.data_etapa) : null
    };
  }

  /**
   * Obter data relativa (hoje, amanhã, em X dias)
   */
  _getDataRelativa(data) {
    const hoje = new Date();
    const dataEtapa = new Date(data);
    const diffTime = dataEtapa - hoje;
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    if (diffDays === 0) return 'Hoje';
    if (diffDays === 1) return 'Amanhã';
    if (diffDays === -1) return 'Ontem';
    if (diffDays > 0) return `Em ${diffDays} dias`;
    return `Há ${Math.abs(diffDays)} dias`;
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
const etapasService = new EtapasService();
export default etapasService;