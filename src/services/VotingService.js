import axios from 'axios';
import { API_FESTIVAL } from './api';
import sessionService from './SessionService';

/**
 * VotingService - Centralizador de todas as operações de votação
 * 
 * Este service unifica a lógica de votação para:
 * - Votos populares (público geral)
 * - Votos de jurados por critérios
 * - Votos binários (aprovado/reprovado)
 * 
 * Integra automaticamente com o sistema de sessões.
 */
class VotingService {
  constructor() {
    this.cooldownCache = new Map(); // Cache de cooldowns por IP/usuário
  }

  /**
   * Registra um voto popular
   * @param {Object} dadosVoto - Dados do voto
   * @param {number} dadosVoto.candidato_id - ID do candidato
   * @param {string} dadosVoto.cpf_votante - CPF do votante
   * @param {number} dadosVoto.etapa_id - ID da etapa (opcional, usa sessão ativa)
   * @returns {Object} Resultado da operação
   */
  async votarPopular(dadosVoto) {
    try {
      // Verificar se há sessão ativa
      const sessaoAtiva = await sessionService.getSessaoAtiva();
      if (!sessaoAtiva) {
        return {
          success: false,
          message: 'Não há sessão de votação ativa no momento.',
          code: 'NO_ACTIVE_SESSION'
        };
      }

      // Verificar cooldown (30 segundos)
      const cooldownKey = `popular_${dadosVoto.cpf_votante}`;
      const ultimoVoto = this.cooldownCache.get(cooldownKey);
      const agora = Date.now();
      
      if (ultimoVoto && (agora - ultimoVoto) < 30000) {
        const restante = Math.ceil((30000 - (agora - ultimoVoto)) / 1000);
        return {
          success: false,
          message: `Aguarde ${restante} segundos para votar novamente.`,
          code: 'COOLDOWN_ACTIVE',
          tempoRestante: restante
        };
      }

      const payload = {
        candidato_id: dadosVoto.candidato_id,
        etapa_id: dadosVoto.etapa_id || sessaoAtiva.etapa_id,
        cpf_votante: dadosVoto.cpf_votante.replace(/\D/g, ''), // Limpar CPF
        sessao_id: sessaoAtiva.id // Novo campo para compatibilidade
      };

      const response = await axios.post(
        `${API_FESTIVAL}/api/votos/populares`, 
        payload
      );

      // Registrar cooldown
      this.cooldownCache.set(cooldownKey, agora);

      // Limpar cooldown após 30 segundos
      setTimeout(() => {
        this.cooldownCache.delete(cooldownKey);
      }, 30000);

      return {
        success: true,
        message: '✅ Voto registrado com sucesso!',
        data: response.data
      };

    } catch (error) {
      console.error('Erro ao registrar voto popular:', error);
      
      // Tratar erros específicos
      if (error.response) {
        const status = error.response.status;
        const data = error.response.data;
        
        switch (status) {
          case 429:
            return {
              success: false,
              message: 'Você está votando muito rápido. Aguarde 30 segundos.',
              code: 'RATE_LIMIT'
            };
          case 400:
            return {
              success: false,
              message: data.message || 'Dados inválidos para votação.',
              code: 'INVALID_DATA'
            };
          case 403:
            return {
              success: false,
              message: 'Votação não está liberada para esta etapa.',
              code: 'VOTING_DISABLED'
            };
          case 404:
            return {
              success: false,
              message: 'Candidato ou etapa não encontrados.',
              code: 'NOT_FOUND'
            };
          default:
            return {
              success: false,
              message: data.message || 'Erro ao registrar voto.',
              code: 'SERVER_ERROR'
            };
        }
      }

      return {
        success: false,
        message: 'Erro de conexão. Tente novamente.',
        code: 'CONNECTION_ERROR'
      };
    }
  }

  /**
   * Registra votos de jurado por critérios
   * @param {Object} dadosVoto - Dados do voto
   * @param {number} dadosVoto.inscricao_id - ID da inscrição/candidato
   * @param {number} dadosVoto.etapa_id - ID da etapa
   * @param {number} dadosVoto.jurado_id - ID do jurado
   * @param {Array} dadosVoto.votos - Array de votos por critério
   * @returns {Object} Resultado da operação
   */
  async votarJurado(dadosVoto) {
    try {
      // Verificar se há sessão ativa
      const sessaoAtiva = await sessionService.getSessaoAtiva();
      if (!sessaoAtiva) {
        return {
          success: false,
          message: 'Não há sessão de votação ativa no momento.',
          code: 'NO_ACTIVE_SESSION'
        };
      }

      // Validar votos
      const votosInvalidos = dadosVoto.votos.filter(voto => 
        voto.nota === null || 
        voto.nota === "" || 
        isNaN(voto.nota) || 
        voto.nota < 0 || 
        voto.nota > 10
      );

      if (votosInvalidos.length > 0) {
        return {
          success: false,
          message: 'Todas as notas devem estar entre 0 e 10, sem deixar campos vazios.',
          code: 'INVALID_SCORES'
        };
      }

      const token = localStorage.getItem('token');
      if (!token) {
        return {
          success: false,
          message: 'Token de autenticação não encontrado.',
          code: 'NO_TOKEN'
        };
      }

      const payload = {
        jurado_id: dadosVoto.jurado_id,
        inscricao_id: dadosVoto.inscricao_id,
        etapa_id: dadosVoto.etapa_id,
        sessao_id: sessaoAtiva.id, // Novo campo
        votos: dadosVoto.votos.map(voto => ({
          ...voto,
          nota: parseFloat(voto.nota)
        }))
      };

      const response = await axios.post(
        `${API_FESTIVAL}/api/votos/jurados`,
        payload,
        {
          headers: { Authorization: `Bearer ${token}` }
        }
      );

      return {
        success: true,
        message: 'Voto registrado com sucesso!',
        data: response.data
      };

    } catch (error) {
      console.error('Erro ao registrar voto de jurado:', error);
      
      if (error.response) {
        const status = error.response.status;
        const data = error.response.data;
        
        switch (status) {
          case 401:
            return {
              success: false,
              message: 'Token inválido ou expirado. Faça login novamente.',
              code: 'UNAUTHORIZED'
            };
          case 403:
            return {
              success: false,
              message: 'Você não tem permissão para votar nesta etapa.',
              code: 'FORBIDDEN'
            };
          case 409:
            return {
              success: false,
              message: 'Você já votou neste candidato nesta sessão.',
              code: 'ALREADY_VOTED'
            };
          default:
            return {
              success: false,
              message: data.message || 'Erro ao registrar votos.',
              code: 'SERVER_ERROR'
            };
        }
      }

      return {
        success: false,
        message: 'Erro de conexão. Tente novamente.',
        code: 'CONNECTION_ERROR'
      };
    }
  }

  /**
   * Registra voto binário (aprovado/reprovado)
   * @param {Object} dadosVoto - Dados do voto
   * @param {number} dadosVoto.inscricao_id - ID da inscrição/candidato
   * @param {number} dadosVoto.etapa_id - ID da etapa
   * @param {number} dadosVoto.jurado_id - ID do jurado
   * @param {string} dadosVoto.aprovado - "sim" ou "nao"
   * @param {string} dadosVoto.justificativa - Justificativa (opcional)
   * @returns {Object} Resultado da operação
   */
  async votarBinario(dadosVoto) {
    try {
      // Verificar se há sessão ativa
      const sessaoAtiva = await sessionService.getSessaoAtiva();
      if (!sessaoAtiva) {
        return {
          success: false,
          message: 'Não há sessão de votação ativa no momento.',
          code: 'NO_ACTIVE_SESSION'
        };
      }

      if (!['sim', 'nao'].includes(dadosVoto.aprovado)) {
        return {
          success: false,
          message: 'Decisão deve ser "sim" ou "nao".',
          code: 'INVALID_DECISION'
        };
      }

      const token = localStorage.getItem('token');
      if (!token) {
        return {
          success: false,
          message: 'Token de autenticação não encontrado.',
          code: 'NO_TOKEN'
        };
      }

      const payload = {
        jurado_id: dadosVoto.jurado_id,
        inscricao_id: dadosVoto.inscricao_id,
        etapa_id: dadosVoto.etapa_id,
        aprovado: dadosVoto.aprovado,
        justificativa: dadosVoto.justificativa || '',
        sessao_id: sessaoAtiva.id // Novo campo
      };

      const response = await axios.post(
        `${API_FESTIVAL}/api/votos/binarios`,
        payload,
        {
          headers: { Authorization: `Bearer ${token}` }
        }
      );

      return {
        success: true,
        message: 'Voto registrado com sucesso!',
        data: response.data
      };

    } catch (error) {
      console.error('Erro ao registrar voto binário:', error);
      
      if (error.response) {
        const status = error.response.status;
        const data = error.response.data;
        
        switch (status) {
          case 401:
            return {
              success: false,
              message: 'Token inválido ou expirado. Faça login novamente.',
              code: 'UNAUTHORIZED'
            };
          case 403:
            return {
              success: false,
              message: 'Você não tem permissão para votar nesta etapa.',
              code: 'FORBIDDEN'
            };
          case 409:
            return {
              success: false,
              message: 'Você já votou neste candidato nesta sessão.',
              code: 'ALREADY_VOTED'
            };
          default:
            return {
              success: false,
              message: data.message || 'Erro ao registrar voto.',
              code: 'SERVER_ERROR'
            };
        }
      }

      return {
        success: false,
        message: 'Erro de conexão. Tente novamente.',
        code: 'CONNECTION_ERROR'
      };
    }
  }

  /**
   * Busca votos populares de um candidato
   * @param {Object} filtros - Filtros da busca
   * @param {number} filtros.candidato_id - ID do candidato
   * @param {number} filtros.etapa_id - ID da etapa (opcional)
   * @param {number} filtros.sessao_id - ID da sessão (opcional)
   * @returns {Object|null} Dados dos votos populares
   */
  async getVotosPopulares(filtros) {
    try {
      const params = new URLSearchParams();
      
      if (filtros.candidato_id) params.append('candidato_id', filtros.candidato_id);
      if (filtros.etapa_id) params.append('etapa_id', filtros.etapa_id);
      if (filtros.sessao_id) params.append('sessao_id', filtros.sessao_id);

      const url = `${API_FESTIVAL}/api/votos/populares/consulta${params.toString() ? '?' + params.toString() : ''}`;
      const response = await axios.get(url);
      
      return response.data || null;
      
    } catch (error) {
      console.error('Erro ao buscar votos populares:', error);
      return null;
    }
  }

  /**
   * Busca votos de jurado
   * @param {Object} filtros - Filtros da busca
   * @param {number} filtros.jurado_id - ID do jurado
   * @param {number} filtros.candidato_id - ID do candidato (opcional)
   * @param {number} filtros.etapa_id - ID da etapa (opcional)
   * @param {number} filtros.sessao_id - ID da sessão (opcional)
   * @returns {Array} Lista de votos do jurado
   */
  async getVotosJurado(filtros) {
    try {
      const token = localStorage.getItem('token');
      const headers = token ? { Authorization: `Bearer ${token}` } : {};
      
      const params = new URLSearchParams();
      
      if (filtros.jurado_id) params.append('jurado_id', filtros.jurado_id);
      if (filtros.candidato_id) params.append('candidato_id', filtros.candidato_id);
      if (filtros.etapa_id) params.append('etapa_id', filtros.etapa_id);
      if (filtros.sessao_id) params.append('sessao_id', filtros.sessao_id);

      const url = `${API_FESTIVAL}/api/votos/jurados/consulta${params.toString() ? '?' + params.toString() : ''}`;
      const response = await axios.get(url, { headers });
      
      return Array.isArray(response.data) ? response.data : [];
      
    } catch (error) {
      console.error('Erro ao buscar votos de jurado:', error);
      return [];
    }
  }

  /**
   * Busca votos binários
   * @param {Object} filtros - Filtros da busca
   * @param {number} filtros.candidato_id - ID do candidato
   * @param {number} filtros.etapa_id - ID da etapa (opcional)
   * @param {number} filtros.sessao_id - ID da sessão (opcional)
   * @returns {Array} Lista de votos binários
   */
  async getVotosBinarios(filtros) {
    try {
      const token = localStorage.getItem('token');
      const headers = token ? { Authorization: `Bearer ${token}` } : {};
      
      const params = new URLSearchParams();
      
      if (filtros.candidato_id) params.append('candidato_id', filtros.candidato_id);
      if (filtros.etapa_id) params.append('etapa_id', filtros.etapa_id);
      if (filtros.sessao_id) params.append('sessao_id', filtros.sessao_id);

      const url = `${API_FESTIVAL}/api/votos/binarios/consulta${params.toString() ? '?' + params.toString() : ''}`;
      const response = await axios.get(url, { headers });
      
      return Array.isArray(response.data) ? response.data : [];
      
    } catch (error) {
      console.error('Erro ao buscar votos binários:', error);
      return [];
    }
  }

  /**
   * Verifica se o usuário pode votar na sessão ativa
   * @param {string} tipoVoto - 'popular', 'jurado', 'binario'
   * @param {Object} dados - Dados para verificação (CPF, jurado_id, etc.)
   * @returns {Object} Status da verificação
   */
  async verificarPermissaoVoto(tipoVoto, dados) {
    try {
      // Verificar sessão ativa
      const sessaoAtiva = await sessionService.getSessaoAtiva();
      if (!sessaoAtiva) {
        return {
          podeVotar: false,
          motivo: 'Não há sessão de votação ativa no momento.'
        };
      }

      // Verificar se o tipo de votação está ativo na sessão
      if (tipoVoto === 'popular' && !sessaoAtiva.votacao_publica_ativa) {
        return {
          podeVotar: false,
          motivo: 'Votação popular não está ativa nesta sessão.'
        };
      }

      if ((tipoVoto === 'jurado' || tipoVoto === 'binario') && !sessaoAtiva.votacao_jurados_ativa) {
        return {
          podeVotar: false,
          motivo: 'Votação de jurados não está ativa nesta sessão.'
        };
      }

      // Verificar cooldown para voto popular
      if (tipoVoto === 'popular' && dados.cpf_votante) {
        const cooldownKey = `popular_${dados.cpf_votante}`;
        const ultimoVoto = this.cooldownCache.get(cooldownKey);
        const agora = Date.now();
        
        if (ultimoVoto && (agora - ultimoVoto) < 30000) {
          const restante = Math.ceil((30000 - (agora - ultimoVoto)) / 1000);
          return {
            podeVotar: false,
            motivo: `Aguarde ${restante} segundos para votar novamente.`,
            tempoRestante: restante
          };
        }
      }

      return {
        podeVotar: true,
        sessao: sessaoAtiva
      };

    } catch (error) {
      console.error('Erro ao verificar permissão de voto:', error);
      return {
        podeVotar: false,
        motivo: 'Erro ao verificar permissões de votação.'
      };
    }
  }

  /**
   * Obtém estatísticas de votação da sessão ativa
   * @returns {Object|null} Estatísticas de votação
   */
  async getEstatisticasVotacaoAtiva() {
    try {
      const response = await axios.get(`${API_FESTIVAL}/api/votos/sessao-ativa/estatisticas`);
      return response.data || null;
      
    } catch (error) {
      console.error('Erro ao buscar estatísticas de votação:', error);
      return null;
    }
  }

  /**
   * Limpa o cache de cooldowns (útil para testes)
   */
  limparCacheCooldown() {
    this.cooldownCache.clear();
  }

  /**
   * Valida CPF brasileiro
   * @param {string} cpf - CPF a ser validado
   * @returns {boolean} true se CPF é válido
   */
  validarCPF(cpf) {
    if (!cpf) return false;
    
    // Remove caracteres não numéricos
    cpf = cpf.replace(/\D/g, '');
    
    // Verifica se tem 11 dígitos
    if (cpf.length !== 11) return false;
    
    // Verifica se todos os dígitos são iguais
    if (/^(\d)\1{10}$/.test(cpf)) return false;
    
    // Valida primeiro dígito verificador
    let soma = 0;
    for (let i = 0; i < 9; i++) {
      soma += parseInt(cpf.charAt(i)) * (10 - i);
    }
    let resto = (soma * 10) % 11;
    if (resto === 10 || resto === 11) resto = 0;
    if (resto !== parseInt(cpf.charAt(9))) return false;
    
    // Valida segundo dígito verificador
    soma = 0;
    for (let i = 0; i < 10; i++) {
      soma += parseInt(cpf.charAt(i)) * (11 - i);
    }
    resto = (soma * 10) % 11;
    if (resto === 10 || resto === 11) resto = 0;
    return resto === parseInt(cpf.charAt(10));
  }
}

// Instância singleton
const votingService = new VotingService();

export default votingService;

// Também exportar a classe para casos especiais
export { VotingService };