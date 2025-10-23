import axios from 'axios';
import { API_FESTIVAL } from './api';

/**
 * CandidatosService - Sistema completo de inscrições e gestão de candidatos
 * Implementa todas as rotas da documentação oficial ROTAS-CANDIDATOS-DOCS.md
 * 
 * ROTAS IMPLEMENTADAS:
 * - Inscrições: inscrever, listar, atualizar
 * - Autenticação: login do candidato
 * - Área do Candidato: dashboard, sessões, notas, histórico
 * - Upload: sistema multi-arquivos
 * - Auxiliares: validações e buscas
 */
class CandidatosService {
  constructor() {
    this.cache = new Map();
    this.cacheTTL = 60000; // 1 minuto (candidatos mudam pouco)
    this.tokenKey = 'candidato_token';
    this.candidatoKey = 'candidato_data';
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

  // ======= GERENCIAMENTO DE AUTENTICAÇÃO =======

  /**
   * Salvar dados do candidato logado
   */
  _saveCandidatoData(candidato, token = null) {
    localStorage.setItem(this.candidatoKey, JSON.stringify(candidato));
    if (token) {
      localStorage.setItem(this.tokenKey, token);
    }
  }

  /**
   * Obter dados do candidato logado
   */
  _getCandidatoData() {
    const data = localStorage.getItem(this.candidatoKey);
    return data ? JSON.parse(data) : null;
  }

  /**
   * Obter token do candidato
   */
  _getToken() {
    return localStorage.getItem(this.tokenKey);
  }

  /**
   * Limpar dados do candidato
   */
  _clearCandidatoData() {
    localStorage.removeItem(this.candidatoKey);
    localStorage.removeItem(this.tokenKey);
    this._clearCache();
  }

  // ======= ROTAS DE INSCRIÇÕES =======

  /**
   * � Inscrever Candidato (com upload de arquivos)
   * POST /api/inscricoes/inscrever
   */
  async inscreverCandidato(dadosInscricao, arquivos = {}) {
    try {
      console.log('📝 Inscrevendo candidato:', dadosInscricao.nome);
      
      const formData = new FormData();
      
      // Adicionar dados básicos
      Object.keys(dadosInscricao).forEach(key => {
        if (dadosInscricao[key] !== null && dadosInscricao[key] !== undefined) {
          formData.append(key, dadosInscricao[key]);
        }
      });

      // Adicionar arquivos se fornecidos
      if (arquivos.foto) {
        formData.append('foto', arquivos.foto);
      }
      if (arquivos.video) {
        formData.append('video', arquivos.video);
      }
      if (arquivos.documentos) {
        Array.from(arquivos.documentos).forEach((doc, index) => {
          formData.append(`documento_${index}`, doc);
        });
      }

      const response = await axios.post(`${API_FESTIVAL}/api/inscricoes/inscrever`, formData, {
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      });

      this._clearCache(); // Limpar cache após nova inscrição
      
      return {
        success: true,
        candidato: this._formatarCandidato(response.data.candidato),
        id: response.data.id,
        message: response.data.mensagem || 'Inscrição realizada com sucesso!'
      };
    } catch (error) {
      console.error('❌ Erro ao inscrever candidato:', error);
      return {
        success: false,
        error: error.response?.data?.erro || error.message,
        details: error.response?.data?.detalhes || null
      };
    }
  }

  /**
   * 📋 Listar Todos os Candidatos
   * GET /api/inscricoes/listar
   */
  async listarCandidatos(filtros = {}, useCache = true) {
    const cacheKey = `listar_candidatos_${JSON.stringify(filtros)}`;
    
    if (useCache) {
      const cached = this._getFromCache(cacheKey);
      if (cached) return cached;
    }

    try {
      const params = new URLSearchParams();
      
      if (filtros.etapa_id) params.append('etapa_id', filtros.etapa_id);
      if (filtros.ativo !== undefined) params.append('ativo', filtros.ativo);
      if (filtros.eliminado !== undefined) params.append('eliminado', filtros.eliminado);
      if (filtros.busca) params.append('busca', filtros.busca);

      const url = `${API_FESTIVAL}/api/inscricoes/listar${params.toString() ? '?' + params.toString() : ''}`;
      const response = await axios.get(url);
      
      const candidatos = response.data.map(candidato => this._formatarCandidato(candidato));

      const result = {
        success: true,
        candidatos,
        total: candidatos.length,
        ativos: candidatos.filter(c => !c.eliminado).length,
        eliminados: candidatos.filter(c => c.eliminado).length,
        porCidade: this._agruparPorCidade(candidatos),
        porIdade: this._agruparPorIdade(candidatos)
      };

      if (useCache) this._setCache(cacheKey, result);
      return result;
    } catch (error) {
      console.error('❌ Erro ao listar candidatos:', error);
      return {
        success: false,
        candidatos: [],
        total: 0,
        ativos: 0,
        eliminados: 0,
        error: error.message
      };
    }
  }

  /**
   * ✏️ Atualizar Candidato (com novos arquivos)
   * PUT /api/inscricoes/{id}
   */
  async atualizarCandidato(id, dadosAtualizacao, arquivos = {}) {
    try {
      console.log('✏️ Atualizando candidato:', id);
      
      const formData = new FormData();
      
      // Adicionar dados de atualização
      Object.keys(dadosAtualizacao).forEach(key => {
        if (dadosAtualizacao[key] !== null && dadosAtualizacao[key] !== undefined) {
          formData.append(key, dadosAtualizacao[key]);
        }
      });

      // Adicionar novos arquivos se fornecidos
      if (arquivos.foto) {
        formData.append('foto', arquivos.foto);
      }
      if (arquivos.video) {
        formData.append('video', arquivos.video);
      }
      if (arquivos.documentos) {
        Array.from(arquivos.documentos).forEach((doc, index) => {
          formData.append(`documento_${index}`, doc);
        });
      }

      const response = await axios.put(`${API_FESTIVAL}/api/inscricoes/${id}`, formData, {
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      });

      this._clearCache(); // Limpar cache após atualização
      
      return {
        success: true,
        candidato: this._formatarCandidato(response.data.candidato),
        message: response.data.mensagem || 'Candidato atualizado com sucesso!'
      };
    } catch (error) {
      console.error('❌ Erro ao atualizar candidato:', error);
      return {
        success: false,
        error: error.response?.data?.erro || error.message
      };
    }
  }

  // ======= AUTENTICAÇÃO DO CANDIDATO =======

  /**
   * 🔐 Login do Candidato
   * POST /api/inscricoes/login
   */
  async loginCandidato(emailOuCpf, senha = null) {
    try {
      console.log('🔐 Fazendo login do candidato...');
      
      const payload = { email_ou_cpf: emailOuCpf };
      if (senha) payload.senha = senha;

      const response = await axios.post(`${API_FESTIVAL}/api/inscricoes/login`, payload);

      const { candidato, token } = response.data;
      
      // Salvar dados do candidato logado
      this._saveCandidatoData(candidato, token);

      const candidatoFormatado = this._formatarCandidato(candidato);

      console.log('✅ Login realizado com sucesso:', candidatoFormatado.nome);

      return {
        success: true,
        candidato: candidatoFormatado,
        token,
        message: `Bem-vindo(a), ${candidatoFormatado.nome}!`
      };

    } catch (error) {
      console.error('❌ Erro no login do candidato:', error);
      
      this._clearCandidatoData();

      const errorMessage = error.response?.data?.erro || 
                          error.response?.data?.message || 
                          error.message || 
                          'Erro ao fazer login';

      return {
        success: false,
        error: errorMessage,
        code: error.response?.status || 500
      };
    }
  }

  /**
   * 🚪 Logout do Candidato
   */
  async logoutCandidato() {
    try {
      this._clearCandidatoData();
      
      return {
        success: true,
        message: 'Logout realizado com sucesso'
      };
    } catch (error) {
      console.error('❌ Erro no logout:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  // ======= ÁREA DO CANDIDATO =======

  /**
   * � Dashboard Pessoal do Candidato
   * GET /api/inscricoes/meu-dashboard/{id}
   */
  async getMeuDashboard(candidatoId, useCache = true) {
    const cacheKey = `dashboard_candidato_${candidatoId}`;
    
    if (useCache) {
      const cached = this._getFromCache(cacheKey);
      if (cached) return cached;
    }

    try {
      const response = await axios.get(`${API_FESTIVAL}/api/inscricoes/meu-dashboard/${candidatoId}`);
      
      const dashboard = {
        ...response.data,
        totalParticipacoes: response.data.total_participacoes || 0,
        votosPopularesRecebidos: response.data.votos_populares_recebidos || 0,
        mediaGeralJurados: response.data.media_geral_jurados ? response.data.media_geral_jurados.toFixed(1) : 'N/A',
        taxaAprovacao: response.data.taxa_aprovacao ? `${response.data.taxa_aprovacao.toFixed(1)}%` : 'N/A',
        melhorDesempenho: response.data.melhor_desempenho || null,
        ultimaParticipacao: response.data.ultima_participacao ? 
          new Date(response.data.ultima_participacao).toLocaleDateString('pt-BR') : null
      };

      const result = {
        success: true,
        dashboard
      };

      if (useCache) this._setCache(cacheKey, result);
      return result;
    } catch (error) {
      console.error('❌ Erro ao buscar dashboard do candidato:', error);
      return {
        success: false,
        dashboard: null,
        error: error.message
      };
    }
  }

  /**
   * 🎭 Minhas Sessões - Participações do Candidato
   * GET /api/inscricoes/minhas-sessoes/{id}
   */
  async getMinhasSessoes(candidatoId, useCache = true) {
    const cacheKey = `sessoes_candidato_${candidatoId}`;
    
    if (useCache) {
      const cached = this._getFromCache(cacheKey);
      if (cached) return cached;
    }

    try {
      const response = await axios.get(`${API_FESTIVAL}/api/inscricoes/minhas-sessoes/${candidatoId}`);
      
      const sessoes = response.data.map(sessao => ({
        ...sessao,
        dataFormatada: new Date(sessao.data_sessao).toLocaleDateString('pt-BR'),
        statusText: sessao.status === 'ativa' ? 'Em andamento' : 'Finalizada',
        statusIcon: sessao.status === 'ativa' ? '🟢' : '⚫',
        notaMediaFormatada: sessao.nota_media ? sessao.nota_media.toFixed(1) : 'N/A',
        votosFormatados: sessao.votos_populares ? sessao.votos_populares.toLocaleString() : '0'
      }));

      const result = {
        success: true,
        sessoes,
        totalSessoes: sessoes.length,
        sessoesAtivas: sessoes.filter(s => s.status === 'ativa').length,
        sessoesFinalizadas: sessoes.filter(s => s.status === 'finalizada').length
      };

      if (useCache) this._setCache(cacheKey, result);
      return result;
    } catch (error) {
      console.error('❌ Erro ao buscar sessões do candidato:', error);
      return {
        success: false,
        sessoes: [],
        totalSessoes: 0,
        sessoesAtivas: 0,
        sessoesFinalizadas: 0,
        error: error.message
      };
    }
  }

  /**
   * � Notas de uma Sessão Específica
   * GET /api/inscricoes/notas-sessao/{id}/{sessaoId}
   */
  async getNotasSessao(candidatoId, sessaoId, useCache = true) {
    const cacheKey = `notas_sessao_${candidatoId}_${sessaoId}`;
    
    if (useCache) {
      const cached = this._getFromCache(cacheKey);
      if (cached) return cached;
    }

    try {
      const response = await axios.get(`${API_FESTIVAL}/api/inscricoes/notas-sessao/${candidatoId}/${sessaoId}`);
      
      const notasDetalhadas = {
        sessao: {
          ...response.data.sessao,
          dataFormatada: new Date(response.data.sessao.data).toLocaleDateString('pt-BR')
        },
        notasPorCriterio: response.data.notas_por_criterio?.map(nota => ({
          ...nota,
          notaFormatada: nota.nota.toFixed(1),
          nomeJurado: nota.nome_jurado || 'Jurado Anônimo'
        })) || [],
        votacaoBinaria: response.data.votacao_binaria?.map(voto => ({
          ...voto,
          decisaoText: voto.aprovado === 'sim' ? 'Aprovado' : 'Reprovado',
          decisaoIcon: voto.aprovado === 'sim' ? '✅' : '❌',
          nomeJurado: voto.nome_jurado || 'Jurado Anônimo'
        })) || [],
        resumo: {
          mediaNotas: response.data.media_notas ? response.data.media_notas.toFixed(1) : 'N/A',
          totalJurados: response.data.total_jurados || 0,
          aprovacoes: response.data.aprovacoes || 0,
          reprovacoes: response.data.reprovacoes || 0,
          votosPopulares: response.data.votos_populares || 0
        }
      };

      const result = {
        success: true,
        notasDetalhadas
      };

      if (useCache) this._setCache(cacheKey, result);
      return result;
    } catch (error) {
      console.error('❌ Erro ao buscar notas da sessão:', error);
      return {
        success: false,
        notasDetalhadas: null,
        error: error.message
      };
    }
  }

  /**
   * 📚 Histórico Completo do Candidato
   * GET /api/inscricoes/meu-historico/{id}
   */
  async getMeuHistorico(candidatoId, useCache = true) {
    const cacheKey = `historico_candidato_${candidatoId}`;
    
    if (useCache) {
      const cached = this._getFromCache(cacheKey);
      if (cached) return cached;
    }

    try {
      const response = await axios.get(`${API_FESTIVAL}/api/inscricoes/meu-historico/${candidatoId}`);
      
      const historico = {
        candidato: this._formatarCandidato(response.data.candidato),
        estatisticasGerais: {
          ...response.data.estatisticas_gerais,
          mediaGeralFormatada: response.data.estatisticas_gerais.media_geral ? 
            response.data.estatisticas_gerais.media_geral.toFixed(1) : 'N/A',
          taxaAprovacaoFormatada: response.data.estatisticas_gerais.taxa_aprovacao ? 
            `${response.data.estatisticas_gerais.taxa_aprovacao.toFixed(1)}%` : 'N/A'
        },
        participacoesPorEtapa: response.data.participacoes_por_etapa?.map(etapa => ({
          ...etapa,
          mediaNotasFormatada: etapa.media_notas ? etapa.media_notas.toFixed(1) : 'N/A'
        })) || [],
        evolucaoTemporal: response.data.evolucao_temporal?.map(ponto => ({
          ...ponto,
          dataFormatada: new Date(ponto.data).toLocaleDateString('pt-BR'),
          notaFormatada: ponto.nota_media ? ponto.nota_media.toFixed(1) : 'N/A'
        })) || []
      };

      const result = {
        success: true,
        historico
      };

      if (useCache) this._setCache(cacheKey, result);
      return result;
    } catch (error) {
      console.error('❌ Erro ao buscar histórico do candidato:', error);
      return {
        success: false,
        historico: null,
        error: error.message
      };
    }
  }

  // ======= MÉTODOS DE CONVENIÊNCIA =======

  /**
   * Verificar se candidato está logado
   */
  isCandidatoLogado() {
    const candidato = this._getCandidatoData();
    const token = this._getToken();
    return !!(candidato && token);
  }

  /**
   * Obter candidato logado atual
   */
  getCandidatoLogado() {
    const candidato = this._getCandidatoData();
    return candidato ? this._formatarCandidato(candidato) : null;
  }

  /**
   * Buscar candidatos por nome (sistema de busca)
   */
  async buscarCandidatosPorNome(nome) {
    return await this.listarCandidatos({ busca: nome });
  }

  /**
   * Buscar candidatos por cidade
   */
  async buscarCandidatosPorCidade(cidade) {
    const result = await this.listarCandidatos();
    const candidatos = result.candidatos.filter(c => 
      c.cidade && c.cidade.toLowerCase().includes(cidade.toLowerCase())
    );
    
    return {
      success: true,
      candidatos,
      total: candidatos.length,
      cidade
    };
  }

  /**
   * Obter candidatos ativos apenas
   */
  async getCandidatosAtivos() {
    return await this.listarCandidatos({ ativo: true, eliminado: false });
  }

  /**
   * Obter estatísticas dos candidatos
   */
  async getEstatisticasCandidatos() {
    const result = await this.listarCandidatos();
    
    if (!result.success) {
      return {
        success: false,
        error: result.error
      };
    }

    const candidatos = result.candidatos;
    const idades = candidatos.map(c => c.idade).filter(idade => idade);
    
    return {
      success: true,
      estatisticas: {
        total: candidatos.length,
        ativos: candidatos.filter(c => !c.eliminado).length,
        eliminados: candidatos.filter(c => c.eliminado).length,
        comFoto: candidatos.filter(c => c.foto).length,
        comVideo: candidatos.filter(c => c.video).length,
        idadeMedia: idades.length > 0 ? (idades.reduce((a, b) => a + b, 0) / idades.length).toFixed(1) : 0,
        idadeMinima: idades.length > 0 ? Math.min(...idades) : 0,
        idadeMaxima: idades.length > 0 ? Math.max(...idades) : 0,
        cidades: [...new Set(candidatos.map(c => c.cidade).filter(c => c))].length,
        musicasMaisPopulares: this._getMusicasMaisPopulares(candidatos)
      }
    };
  }

  /**
   * Validar dados de inscrição
   */
  validarDadosInscricao(dados) {
    const errors = [];
    
    if (!dados.nome || dados.nome.trim().length < 2) {
      errors.push('Nome deve ter pelo menos 2 caracteres');
    }
    
    if (!dados.email || !/\S+@\S+\.\S+/.test(dados.email)) {
      errors.push('Email inválido');
    }
    
    if (!dados.cpf || dados.cpf.replace(/\D/g, '').length !== 11) {
      errors.push('CPF deve ter 11 dígitos');
    }
    
    if (!dados.musica || dados.musica.trim().length < 2) {
      errors.push('Nome da música é obrigatório');
    }
    
    if (dados.idade && (dados.idade < 16 || dados.idade > 80)) {
      errors.push('Idade deve estar entre 16 e 80 anos');
    }
    
    return {
      valido: errors.length === 0,
      errors
    };
  }

  /**
   * Validar arquivos de upload
   */
  validarArquivos(arquivos) {
    const errors = [];
    const maxSizes = {
      foto: 5 * 1024 * 1024, // 5MB
      video: 100 * 1024 * 1024, // 100MB
      documento: 10 * 1024 * 1024 // 10MB
    };

    if (arquivos.foto) {
      if (!arquivos.foto.type.startsWith('image/')) {
        errors.push('Foto deve ser uma imagem válida');
      }
      if (arquivos.foto.size > maxSizes.foto) {
        errors.push('Foto deve ter no máximo 5MB');
      }
    }

    if (arquivos.video) {
      if (!arquivos.video.type.startsWith('video/')) {
        errors.push('Arquivo deve ser um vídeo válido');
      }
      if (arquivos.video.size > maxSizes.video) {
        errors.push('Vídeo deve ter no máximo 100MB');
      }
    }

    if (arquivos.documentos) {
      Array.from(arquivos.documentos).forEach((doc, index) => {
        if (doc.size > maxSizes.documento) {
          errors.push(`Documento ${index + 1} deve ter no máximo 10MB`);
        }
      });
    }

    return {
      valido: errors.length === 0,
      errors
    };
  }

  // ======= MÉTODOS AUXILIARES =======

  /**
   * Formatar dados do candidato
   */
  _formatarCandidato(candidato) {
    return {
      ...candidato,
      fotoUrl: candidato.foto ? `${API_FESTIVAL}${candidato.foto}` : null,
      videoUrl: candidato.video ? `${API_FESTIVAL}${candidato.video}` : null,
      dataInscricaoFormatada: candidato.data_inscricao ? 
        new Date(candidato.data_inscricao).toLocaleDateString('pt-BR') : null,
      statusText: candidato.eliminado ? 'Eliminado' : 'Ativo',
      statusIcon: candidato.eliminado ? '❌' : '✅',
      nomeCompleto: `${candidato.nome} - ${candidato.musica || 'Música não informada'}`,
      descricaoCompleta: `${candidato.nome}${candidato.idade ? `, ${candidato.idade} anos` : ''}${candidato.cidade ? `, de ${candidato.cidade}` : ''}`,
      musicaCompleta: candidato.musica ? 
        `${candidato.musica}${candidato.artista_original ? ` (${candidato.artista_original})` : ''}` : 
        'Música não informada',
      idadeTexto: candidato.idade ? `${candidato.idade} anos` : 'Idade não informada',
      cidadeTexto: candidato.cidade || 'Cidade não informada',
      cpfFormatado: candidato.cpf ? this._formatarCPF(candidato.cpf) : null,
      telefoneFormatado: candidato.telefone ? this._formatarTelefone(candidato.telefone) : null
    };
  }

  /**
   * Formatar CPF
   */
  _formatarCPF(cpf) {
    if (!cpf) return null;
    const cpfLimpo = cpf.replace(/\D/g, '');
    return cpfLimpo.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, '$1.$2.$3-$4');
  }

  /**
   * Formatar telefone
   */
  _formatarTelefone(telefone) {
    if (!telefone) return null;
    const telLimpo = telefone.replace(/\D/g, '');
    if (telLimpo.length === 11) {
      return telLimpo.replace(/(\d{2})(\d{5})(\d{4})/, '($1) $2-$3');
    } else if (telLimpo.length === 10) {
      return telLimpo.replace(/(\d{2})(\d{4})(\d{4})/, '($1) $2-$3');
    }
    return telefone;
  }

  /**
   * Agrupar candidatos por cidade
   */
  _agruparPorCidade(candidatos) {
    const grupos = {};
    candidatos.forEach(candidato => {
      const cidade = candidato.cidade || 'Não informada';
      if (!grupos[cidade]) {
        grupos[cidade] = [];
      }
      grupos[cidade].push(candidato);
    });
    
    return Object.entries(grupos)
      .map(([cidade, candidatos]) => ({
        cidade,
        candidatos,
        total: candidatos.length
      }))
      .sort((a, b) => b.total - a.total);
  }

  /**
   * Agrupar candidatos por faixa etária
   */
  _agruparPorIdade(candidatos) {
    const faixas = {
      '16-20': [],
      '21-30': [],
      '31-40': [],
      '41-50': [],
      '51+': [],
      'Não informada': []
    };

    candidatos.forEach(candidato => {
      const idade = candidato.idade;
      if (!idade) {
        faixas['Não informada'].push(candidato);
      } else if (idade <= 20) {
        faixas['16-20'].push(candidato);
      } else if (idade <= 30) {
        faixas['21-30'].push(candidato);
      } else if (idade <= 40) {
        faixas['31-40'].push(candidato);
      } else if (idade <= 50) {
        faixas['41-50'].push(candidato);
      } else {
        faixas['51+'].push(candidato);
      }
    });

    return Object.entries(faixas)
      .map(([faixa, candidatos]) => ({
        faixa,
        candidatos,
        total: candidatos.length
      }))
      .filter(grupo => grupo.total > 0);
  }

  /**
   * Obter músicas mais populares
   */
  _getMusicasMaisPopulares(candidatos) {
    const contadorMusicas = {};
    
    candidatos.forEach(candidato => {
      const musica = candidato.musica;
      if (musica) {
        contadorMusicas[musica] = (contadorMusicas[musica] || 0) + 1;
      }
    });

    return Object.entries(contadorMusicas)
      .map(([musica, count]) => ({ musica, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 10); // Top 10
  }

  /**
   * Gerar preview de imagem
   */
  gerarPreviewImagem(arquivo) {
    return new Promise((resolve, reject) => {
      if (!arquivo || !arquivo.type.startsWith('image/')) {
        reject(new Error('Arquivo não é uma imagem válida'));
        return;
      }

      const reader = new FileReader();
      reader.onload = (e) => {
        resolve({
          nome: arquivo.name,
          size: arquivo.size,
          type: arquivo.type,
          preview: e.target.result
        });
      };
      reader.onerror = reject;
      reader.readAsDataURL(arquivo);
    });
  }

  /**
   * Formatar tamanho de arquivo
   */
  formatarTamanhoArquivo(bytes) {
    if (bytes === 0) return '0 Bytes';
    
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  }

  // ======= MÉTODOS DE GERENCIAMENTO =======

  /**
   * Limpar cache manualmente
   */
  clearCache() {
    this._clearCache();
  }

  /**
   * Atualizar cache específico
   */
  invalidateCache(key) {
    if (key) {
      this.cache.delete(key);
    } else {
      this._clearCache();
    }
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

  /**
   * Configurar TTL do cache
   */
  configurarCache(ttl) {
    this.cacheTTL = ttl;
  }
}

// Instância singleton
const candidatosService = new CandidatosService();
export default candidatosService;