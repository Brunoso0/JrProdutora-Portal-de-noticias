import axios from 'axios';
import { API_FESTIVAL } from './api';

/**
 * JuradosService - Autenticação e gerenciamento de jurados
 * Implementa rotas para login, logout e verificação de sessão
 */
class JuradosService {
  constructor() {
    this.tokenKey = 'festival_jurado_token';
    this.juradoKey = 'festival_jurado_data';
    this.cache = new Map();
    this.cacheTTL = 300000; // 5 minutos para dados do jurado
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

  // ======= GERENCIAMENTO DE TOKEN =======

  /**
   * Salvar token no localStorage
   */
  _saveToken(token) {
    localStorage.setItem(this.tokenKey, token);
    this._setAuthHeader(token);
  }

  /**
   * Obter token do localStorage
   */
  _getToken() {
    return localStorage.getItem(this.tokenKey);
  }

  /**
   * Remover token do localStorage
   */
  _removeToken() {
    localStorage.removeItem(this.tokenKey);
    localStorage.removeItem(this.juradoKey);
    delete axios.defaults.headers.common['Authorization'];
    this._clearCache();
  }

  /**
   * Configurar header de autorização
   */
  _setAuthHeader(token) {
    if (token) {
      axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
    }
  }

  /**
   * Salvar dados do jurado
   */
  _saveJuradoData(jurado) {
    localStorage.setItem(this.juradoKey, JSON.stringify(jurado));
  }

  /**
   * Obter dados do jurado salvos
   */
  _getJuradoData() {
    const data = localStorage.getItem(this.juradoKey);
    return data ? JSON.parse(data) : null;
  }

  // ======= ROTAS DE AUTENTICAÇÃO =======

  /**
   * 🔐 Login do Jurado
   * POST /api/jurados/login
   */
  async login(email, senha) {
    try {
      console.log('🔐 Fazendo login do jurado...');
      
      const response = await axios.post(`${API_FESTIVAL}/api/jurados/login`, {
        email: email.trim(),
        senha
      });

      const { token, jurado } = response.data;

      if (!token || !jurado) {
        throw new Error('Resposta inválida do servidor');
      }

      // Salvar token e dados do jurado
      this._saveToken(token);
      this._saveJuradoData(jurado);

      const juradoFormatado = this._formatarJurado(jurado);

      console.log('✅ Login realizado com sucesso:', juradoFormatado.nome);

      return {
        success: true,
        token,
        jurado: juradoFormatado,
        message: `Bem-vindo, ${juradoFormatado.nome}!`
      };

    } catch (error) {
      console.error('❌ Erro no login:', error);
      
      // Limpar dados em caso de erro
      this._removeToken();

      const errorMessage = error.response?.data?.message || 
                          error.response?.data?.error || 
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
   * 🚪 Logout do Jurado
   * POST /api/jurados/logout
   */
  async logout() {
    try {
      const token = this._getToken();
      
      if (token) {
        console.log('🚪 Fazendo logout do jurado...');
        
        // Tentar fazer logout no servidor
        await axios.post(`${API_FESTIVAL}/api/jurados/logout`);
        console.log('✅ Logout realizado no servidor');
      }

      // Sempre limpar dados locais
      this._removeToken();

      return {
        success: true,
        message: 'Logout realizado com sucesso'
      };

    } catch (error) {
      console.error('⚠️ Erro no logout (limpando dados locais):', error);
      
      // Mesmo com erro no servidor, limpar dados locais
      this._removeToken();

      return {
        success: true,
        message: 'Logout realizado (sessão limpa localmente)',
        warning: 'Não foi possível comunicar com o servidor'
      };
    }
  }

  /**
   * ✅ Verificar Sessão
   * GET /api/jurados/me
   */
  async verificarSessao(useCache = true) {
    const cacheKey = 'verificar_sessao';
    
    if (useCache) {
      const cached = this._getFromCache(cacheKey);
      if (cached) return cached;
    }

    try {
      const token = this._getToken();
      
      if (!token) {
        return {
          success: false,
          authenticated: false,
          error: 'Token não encontrado'
        };
      }

      this._setAuthHeader(token);

      console.log('✅ Verificando sessão do jurado...');
      
      const response = await axios.get(`${API_FESTIVAL}/api/jurados/me`);
      const jurado = this._formatarJurado(response.data);

      // Atualizar dados salvos
      this._saveJuradoData(jurado);

      const result = {
        success: true,
        authenticated: true,
        jurado,
        token
      };

      if (useCache) this._setCache(cacheKey, result);
      return result;

    } catch (error) {
      console.error('❌ Erro ao verificar sessão:', error);
      
      // Se erro 401, token inválido - limpar tudo
      if (error.response?.status === 401) {
        this._removeToken();
      }

      return {
        success: false,
        authenticated: false,
        error: error.response?.data?.message || error.message,
        code: error.response?.status || 500
      };
    }
  }

  // ======= MÉTODOS DE CONVENIÊNCIA =======

  /**
   * Verificar se está logado
   */
  isAuthenticated() {
    const token = this._getToken();
    const jurado = this._getJuradoData();
    return !!(token && jurado);
  }

  /**
   * Obter dados do jurado atual (cache local)
   */
  getCurrentJurado() {
    const jurado = this._getJuradoData();
    return jurado ? this._formatarJurado(jurado) : null;
  }

  /**
   * Obter token atual
   */
  getCurrentToken() {
    return this._getToken();
  }

  /**
   * Renovar dados do jurado
   */
  async refreshJurado() {
    // Força busca sem cache
    return await this.verificarSessao(false);
  }

  /**
   * Verificar permissões do jurado
   */
  hasPermission(permission) {
    const jurado = this.getCurrentJurado();
    if (!jurado) return false;

    // Lista de permissões padrão dos jurados
    const permissions = {
      'votar': true,
      'ver_resultados': jurado.tipo !== 'convidado',
      'ver_dashboard': jurado.tipo === 'principal',
      'gerenciar_sessao': jurado.tipo === 'principal'
    };

    return permissions[permission] || false;
  }

  /**
   * Obter status da sessão
   */
  getSessionStatus() {
    const token = this._getToken();
    const jurado = this._getJuradoData();
    
    return {
      authenticated: !!(token && jurado),
      token: !!token,
      jurado: !!jurado,
      expiresAt: null, // API não retorna expiração
      juradoData: jurado ? this._formatarJurado(jurado) : null
    };
  }

  // ======= MÉTODOS AUXILIARES =======

  /**
   * Formatar dados do jurado
   */
  _formatarJurado(jurado) {
    if (!jurado) return null;

    return {
      ...jurado,
      nomeCompleto: jurado.nome || 'Jurado',
      iniciais: this._getIniciais(jurado.nome),
      tipoTexto: this._getTipoTexto(jurado.tipo),
      statusTexto: jurado.ativo ? 'Ativo' : 'Inativo',
      statusIcon: jurado.ativo ? '✅' : '❌',
      avatarUrl: jurado.foto ? `${API_FESTIVAL}${jurado.foto}` : null,
      canVote: jurado.ativo && jurado.tipo !== 'bloqueado',
      isAdmin: jurado.tipo === 'principal',
      displayName: jurado.nome || `Jurado #${jurado.id}`
    };
  }

  /**
   * Obter iniciais do nome
   */
  _getIniciais(nome) {
    if (!nome) return 'J';
    
    const palavras = nome.trim().split(' ');
    if (palavras.length === 1) {
      return palavras[0].substring(0, 2).toUpperCase();
    }
    
    return (palavras[0][0] + palavras[palavras.length - 1][0]).toUpperCase();
  }

  /**
   * Obter texto do tipo do jurado
   */
  _getTipoTexto(tipo) {
    const tipos = {
      'principal': 'Jurado Principal',
      'convidado': 'Jurado Convidado',
      'tecnico': 'Jurado Técnico',
      'bloqueado': 'Bloqueado'
    };
    
    return tipos[tipo] || 'Jurado';
  }

  /**
   * Validar dados de login
   */
  _validarLogin(email, senha) {
    const errors = [];
    
    if (!email || !email.trim()) {
      errors.push('Email é obrigatório');
    } else if (!/\S+@\S+\.\S+/.test(email)) {
      errors.push('Email inválido');
    }
    
    if (!senha || senha.length < 3) {
      errors.push('Senha deve ter pelo menos 3 caracteres');
    }
    
    return errors;
  }

  // ======= MÉTODOS DE GERENCIAMENTO =======

  /**
   * Inicializar serviço
   */
  init() {
    const token = this._getToken();
    if (token) {
      this._setAuthHeader(token);
    }
  }

  /**
   * Limpar cache manualmente
   */
  clearCache() {
    this._clearCache();
  }

  /**
   * Forçar logout (sem chamar API)
   */
  forceLogout() {
    this._removeToken();
  }

  /**
   * Obter informações de debug
   */
  getDebugInfo() {
    return {
      hasToken: !!this._getToken(),
      hasJurado: !!this._getJuradoData(),
      cacheSize: this.cache.size,
      juradoData: this._getJuradoData()
    };
  }

  /**
   * Configurar TTL do cache
   */
  configurarCache(ttl) {
    this.cacheTTL = ttl;
  }

  // ======= INTERCEPTORS =======

  /**
   * Configurar interceptors do axios
   */
  setupInterceptors() {
    // Interceptor para adicionar token automaticamente
    axios.interceptors.request.use(
      (config) => {
        const token = this._getToken();
        if (token && !config.headers.Authorization) {
          config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
      },
      (error) => Promise.reject(error)
    );

    // Interceptor para tratar erros de autenticação
    axios.interceptors.response.use(
      (response) => response,
      (error) => {
        if (error.response?.status === 401) {
          console.log('🔐 Token expirado, fazendo logout...');
          this._removeToken();
          
          // Emit event para componentes React
          window.dispatchEvent(new CustomEvent('auth:logout', {
            detail: { reason: 'token_expired' }
          }));
        }
        return Promise.reject(error);
      }
    );
  }
}

// Instância singleton
const juradosService = new JuradosService();

// Inicializar serviço
juradosService.init();

// Configurar interceptors
juradosService.setupInterceptors();

export default juradosService;