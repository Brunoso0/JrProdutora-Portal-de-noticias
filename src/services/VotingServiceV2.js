import axios from 'axios';
import { API_FESTIVAL } from './api';

/**
 * VotingService V2 - Sistema completo de votação
 * Implementa todas as rotas da documentação oficial para votos
 */
class VotingService {
  constructor() {
    this.cooldownCache = new Map(); // Cache de cooldowns
    this.cache = new Map();
    this.cacheTTL = 15000; // 15 segundos para resultados
    this.cooldownPublico = 30000; // 30 segundos entre votos públicos
    this.cooldownJurado = 5000; // 5 segundos entre votos de jurado
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

  // ======= MÉTODOS DE COOLDOWN =======
  _verificarCooldown(key, cooldownTime) {
    const ultimoVoto = this.cooldownCache.get(key);
    const agora = Date.now();
    
    if (ultimoVoto && (agora - ultimoVoto) < cooldownTime) {
      const restante = Math.ceil((cooldownTime - (agora - ultimoVoto)) / 1000);
      return {
        bloqueado: true,
        restante
      };
    }
    
    return { bloqueado: false };
  }

  _setCooldown(key) {
    this.cooldownCache.set(key, Date.now());
  }

  // ======= ROTAS DE VOTAÇÃO =======

  /**
   * 👥 Voto do Público
   * POST /api/votos/publico
   */
  async votarPublico(candidatoId, identificador = null) {
    try {
      // Verificar cooldown
      const cooldownKey = `publico_${identificador || 'anonymous'}`;
      const cooldown = this._verificarCooldown(cooldownKey, this.cooldownPublico);
      
      if (cooldown.bloqueado) {
        return {
          success: false,
          error: `Aguarde ${cooldown.restante} segundos para votar novamente`,
          code: 'COOLDOWN_ACTIVE'
        };
      }

      console.log('📡 Registrando voto público para candidato:', candidatoId);
      
      const response = await axios.post(`${API_FESTIVAL}/api/votos/publico`, {
        candidato_id: candidatoId
      });

      // Definir cooldown após sucesso
      this._setCooldown(cooldownKey);
      
      // Limpar cache de resultados
      this._clearCache();
      
      return {
        success: true,
        voto: response.data.voto,
        message: response.data.mensagem || 'Voto registrado com sucesso!'
      };
    } catch (error) {
      console.error('❌ Erro ao votar (público):', error);
      return {
        success: false,
        error: error.response?.data?.erro || error.message,
        code: error.response?.status || 'UNKNOWN_ERROR'
      };
    }
  }

  /**
   * ⚖️ Voto do Jurado
   * POST /api/votos/jurado
   */
  async votarJurado(candidatoId, nota, observacoes = '', token = null) {
    try {
      // Verificar cooldown
      const cooldownKey = `jurado_${token || 'anonymous'}`;
      const cooldown = this._verificarCooldown(cooldownKey, this.cooldownJurado);
      
      if (cooldown.bloqueado) {
        return {
          success: false,
          error: `Aguarde ${cooldown.restante} segundos para avaliar novamente`,
          code: 'COOLDOWN_ACTIVE'
        };
      }

      console.log('📡 Registrando voto de jurado:', { candidatoId, nota, observacoes });
      
      const headers = token ? { Authorization: `Bearer ${token}` } : {};
      
      const response = await axios.post(`${API_FESTIVAL}/api/votos/jurado`, {
        candidato_id: candidatoId,
        nota,
        observacoes
      }, { headers });

      // Definir cooldown após sucesso
      this._setCooldown(cooldownKey);
      
      // Limpar cache de resultados
      this._clearCache();
      
      return {
        success: true,
        voto: response.data.voto,
        message: response.data.mensagem || 'Avaliação registrada com sucesso!'
      };
    } catch (error) {
      console.error('❌ Erro ao votar (jurado):', error);
      return {
        success: false,
        error: error.response?.data?.erro || error.message,
        code: error.response?.status || 'UNKNOWN_ERROR'
      };
    }
  }

  // ======= ROTAS DE RESULTADOS =======

  /**
   * 📊 Resultados da Sessão Ativa
   * GET /api/votos/resultado/sessao/ativa
   */
  async getResultadosSessaoAtiva(useCache = true) {
    const cacheKey = 'resultados_sessao_ativa';
    
    if (useCache) {
      const cached = this._getFromCache(cacheKey);
      if (cached) return cached;
    }

    try {
      const response = await axios.get(`${API_FESTIVAL}/api/votos/resultado/sessao/ativa`);
      
      const result = {
        success: true,
        sessao: response.data.sessao,
        resultados: response.data.resultados.map(candidato => ({
          ...candidato,
          percentualVotos: this._calcularPercentual(candidato.votos_publico, response.data.resultados),
          notaFormatada: candidato.nota_media_jurados ? candidato.nota_media_jurados.toFixed(1) : 'N/A',
          posicaoFormatada: `${candidato.posicao}º lugar`
        })),
        totalVotos: response.data.resultados.reduce((acc, c) => acc + c.votos_publico, 0),
        totalCandidatos: response.data.resultados.length
      };

      if (useCache) this._setCache(cacheKey, result);
      return result;
    } catch (error) {
      console.error('❌ Erro ao buscar resultados da sessão ativa:', error);
      return {
        success: false,
        sessao: null,
        resultados: [],
        totalVotos: 0,
        totalCandidatos: 0,
        error: error.message
      };
    }
  }

  /**
   * 📈 Resultados de Sessão Específica
   * GET /api/votos/resultado/sessao/{sessao_id}
   */
  async getResultadosSessao(sessaoId, useCache = true) {
    const cacheKey = `resultados_sessao_${sessaoId}`;
    
    if (useCache) {
      const cached = this._getFromCache(cacheKey);
      if (cached) return cached;
    }

    try {
      const response = await axios.get(`${API_FESTIVAL}/api/votos/resultado/sessao/${sessaoId}`);
      
      const result = {
        success: true,
        sessao: {
          ...response.data.sessao,
          duracaoFormatada: this._calcularDuracao(response.data.sessao.data_inicio, response.data.sessao.data_fim)
        },
        resultados: response.data.resultados.map(candidato => ({
          ...candidato,
          percentualVotos: this._calcularPercentual(candidato.votos_publico, response.data.resultados),
          notaFormatada: candidato.nota_media_jurados ? candidato.nota_media_jurados.toFixed(1) : 'N/A',
          posicaoFormatada: `${candidato.posicao}º lugar`,
          statusClassificacao: candidato.classificado ? 'Classificado' : 'Eliminado'
        })),
        totalVotos: response.data.resultados.reduce((acc, c) => acc + c.votos_publico, 0),
        totalCandidatos: response.data.resultados.length
      };

      if (useCache) this._setCache(cacheKey, result);
      return result;
    } catch (error) {
      console.error('❌ Erro ao buscar resultados da sessão:', error);
      return {
        success: false,
        sessao: null,
        resultados: [],
        totalVotos: 0,
        totalCandidatos: 0,
        error: error.message
      };
    }
  }

  /**
   * 🏆 Ranking Geral (Todas as Sessões)
   * GET /api/votos/ranking/geral
   */
  async getRankingGeral(useCache = true) {
    const cacheKey = 'ranking_geral';
    
    if (useCache) {
      const cached = this._getFromCache(cacheKey);
      if (cached) return cached;
    }

    try {
      const response = await axios.get(`${API_FESTIVAL}/api/votos/ranking/geral`);
      
      const result = {
        success: true,
        ranking: response.data.ranking.map(candidato => ({
          ...candidato,
          mediaNotasFormatada: candidato.media_notas_jurados ? candidato.media_notas_jurados.toFixed(1) : 'N/A',
          pontosFormatados: candidato.total_pontos.toFixed(1),
          posicaoFormatada: `${candidato.posicao_geral}º lugar`,
          performanceText: this._getPerformanceText(candidato.posicao_geral)
        })),
        totalCandidatos: response.data.ranking.length,
        totalVotos: response.data.ranking.reduce((acc, c) => acc + c.total_votos_publico, 0)
      };

      if (useCache) this._setCache(cacheKey, result);
      return result;
    } catch (error) {
      console.error('❌ Erro ao buscar ranking geral:', error);
      return {
        success: false,
        ranking: [],
        totalCandidatos: 0,
        totalVotos: 0,
        error: error.message
      };
    }
  }

  /**
   * 📊 Estatísticas da Sessão
   * GET /api/votos/estatisticas/sessao/{sessao_id}
   */
  async getEstatisticasSessao(sessaoId, useCache = true) {
    const cacheKey = `estatisticas_sessao_${sessaoId}`;
    
    if (useCache) {
      const cached = this._getFromCache(cacheKey);
      if (cached) return cached;
    }

    try {
      const response = await axios.get(`${API_FESTIVAL}/api/votos/estatisticas/sessao/${sessaoId}`);
      
      const result = {
        success: true,
        estatisticas: {
          ...response.data,
          mediaVotosFormatada: response.data.media_votos_por_candidato.toFixed(0),
          horarioPicoFormatado: this._formatarHorario(response.data.horario_pico_votacao),
          candidatoMaisVotadoInfo: {
            ...response.data.candidato_mais_votado,
            percentualVotos: ((response.data.candidato_mais_votado.votos / response.data.total_votos_publico) * 100).toFixed(1)
          }
        }
      };

      if (useCache) this._setCache(cacheKey, result);
      return result;
    } catch (error) {
      console.error('❌ Erro ao buscar estatísticas da sessão:', error);
      return {
        success: false,
        estatisticas: null,
        error: error.message
      };
    }
  }

  // ======= MÉTODOS DE CONVENIÊNCIA =======

  /**
   * Verificar se pode votar na sessão ativa
   */
  async verificarPermissaoVoto(tipo = 'publico') {
    try {
      // Implementar verificação com a sessão ativa
      const response = await axios.get(`${API_FESTIVAL}/api/sessoes/ativa`);
      
      if (!response.data.ativa) {
        return {
          podeVotar: false,
          motivo: 'Nenhuma sessão de votação ativa'
        };
      }

      const sessao = response.data.sessao;
      
      if (tipo === 'publico') {
        return {
          podeVotar: sessao.votacao_publica_liberada,
          motivo: sessao.votacao_publica_liberada ? null : 'Votação pública não liberada'
        };
      }

      if (tipo === 'jurado') {
        return {
          podeVotar: sessao.votacao_jurados_liberada,
          motivo: sessao.votacao_jurados_liberada ? null : 'Votação de jurados não liberada'
        };
      }

      return {
        podeVotar: false,
        motivo: 'Tipo de votação inválido'
      };
    } catch (error) {
      return {
        podeVotar: false,
        motivo: 'Erro ao verificar permissões'
      };
    }
  }

  /**
   * Obter candidatos disponíveis para votação
   */
  async getCandidatosDisponiveis() {
    try {
      const response = await axios.get(`${API_FESTIVAL}/api/inscricoes/sessao/ativa`);
      
      return {
        success: true,
        candidatos: response.data.map(candidato => ({
          ...candidato,
          fotoUrl: candidato.foto ? `${API_FESTIVAL}${candidato.foto}` : null,
          videoUrl: candidato.video ? `${API_FESTIVAL}${candidato.video}` : null
        }))
      };
    } catch (error) {
      console.error('❌ Erro ao buscar candidatos:', error);
      return {
        success: false,
        candidatos: [],
        error: error.message
      };
    }
  }

  // ======= MÉTODOS AUXILIARES =======

  /**
   * Calcular percentual de votos
   */
  _calcularPercentual(votos, todosResultados) {
    const totalVotos = todosResultados.reduce((acc, r) => acc + r.votos_publico, 0);
    return totalVotos > 0 ? ((votos / totalVotos) * 100).toFixed(1) : '0.0';
  }

  /**
   * Calcular duração entre datas
   */
  _calcularDuracao(dataInicio, dataFim) {
    const inicio = new Date(dataInicio);
    const fim = new Date(dataFim);
    const diferenca = fim - inicio;
    
    const horas = Math.floor(diferenca / (1000 * 60 * 60));
    const minutos = Math.floor((diferenca % (1000 * 60 * 60)) / (1000 * 60));
    
    if (horas > 0) {
      return `${horas}h ${minutos}min`;
    }
    return `${minutos}min`;
  }

  /**
   * Formatar horário
   */
  _formatarHorario(horario) {
    if (!horario) return 'N/A';
    const [horas, minutos] = horario.split(':');
    return `${horas}:${minutos}`;
  }

  /**
   * Obter texto de performance
   */
  _getPerformanceText(posicao) {
    if (posicao === 1) return '🥇 Líder';
    if (posicao <= 3) return '🥉 Top 3';
    if (posicao <= 10) return '⭐ Top 10';
    return '👤 Participante';
  }

  /**
   * Validar nota de jurado
   */
  _validarNota(nota) {
    const notaNum = parseFloat(nota);
    if (isNaN(notaNum) || notaNum < 0 || notaNum > 10) {
      return {
        valida: false,
        erro: 'Nota deve ser um número entre 0 e 10'
      };
    }
    return { valida: true };
  }

  // ======= MÉTODOS DE GERENCIAMENTO =======

  /**
   * Limpar cache manualmente
   */
  clearCache() {
    this._clearCache();
  }

  /**
   * Limpar cooldowns
   */
  clearCooldowns() {
    this.cooldownCache.clear();
  }

  /**
   * Obter status dos caches
   */
  getCacheStatus() {
    return {
      cache: {
        size: this.cache.size,
        ttl: this.cacheTTL
      },
      cooldown: {
        size: this.cooldownCache.size,
        publicoCooldown: this.cooldownPublico,
        juradoCooldown: this.cooldownJurado
      }
    };
  }

  /**
   * Configurar tempos de cooldown
   */
  configurarCooldown(publico = null, jurado = null) {
    if (publico !== null) this.cooldownPublico = publico;
    if (jurado !== null) this.cooldownJurado = jurado;
  }
}

// Instância singleton
const votingService = new VotingService();
export default votingService;