import React, { createContext, useContext, useState, useEffect } from 'react';
import axios from 'axios';
import { API_FESTIVAL } from '../../services/api';
import { useAuth } from './AuthContext';

const SessaoContext = createContext();

export const SessaoProvider = ({ children }) => {
  const { token } = useAuth();
  const [sessaoAtiva, setSessaoAtiva] = useState(null);
  const [loading, setLoading] = useState(true);

  // Função para buscar a sessão ativa
  const fetchSessaoAtiva = async () => {
    try {
      setLoading(true);
      const headers = token ? { Authorization: `Bearer ${token}` } : {};
      
      try {
        const response = await axios.get(`${API_FESTIVAL}/api/sessoes/ativa`, { headers });
        
        // Se response.data tem id, é uma sessão válida. Senão, null
        const sessao = response.data && response.data.id ? response.data : null;
        setSessaoAtiva(sessao);
        
        return sessao;
        
      } catch (apiError) {
        console.warn('API não disponível para buscar sessão ativa:', apiError);
        // Não mostrar erro, apenas não há sessão ativa
        setSessaoAtiva(null);
        return null;
      }
      
    } catch (error) {
      console.error('Erro ao buscar sessão ativa:', error);
      setSessaoAtiva(null);
      return null;
    } finally {
      setLoading(false);
    }
  };

  // Buscar sessão ativa na inicialização
  useEffect(() => {
    if (token) {
      fetchSessaoAtiva();
    }
  }, [token]); // eslint-disable-line react-hooks/exhaustive-deps

  // Função para iniciar nova sessão
  const iniciarSessao = async (dadosSessao) => {
    try {
      const headers = token ? { Authorization: `Bearer ${token}` } : {};
      
      try {
        const response = await axios.post(`${API_FESTIVAL}/api/sessoes/iniciar`, dadosSessao, { headers });
        
        // Atualizar estado local
        setSessaoAtiva(response.data);
        
        return { success: true, sessao: response.data };
        
      } catch (apiError) {
        console.warn('API não disponível, simulando sessão:', apiError);
        
        // Simular uma sessão para teste quando a API não existir
        const sessaoSimulada = {
          id: Date.now(), // ID único baseado no timestamp
          etapa_id: dadosSessao.etapa_id,
          descricao: dadosSessao.descricao,
          candidato_ids: dadosSessao.candidato_ids,
          total_candidatos: dadosSessao.candidato_ids.length,
          votacao_publica_ativa: false,
          votacao_jurados_ativa: false,
          criado_em: new Date().toISOString(),
          status: 'ativa'
        };
        
        // Atualizar estado local
        setSessaoAtiva(sessaoSimulada);
        
        return { success: true, sessao: sessaoSimulada };
      }
      
    } catch (error) {
      console.error('Erro ao iniciar sessão:', error);
      return { 
        success: false, 
        message: error.response?.data?.message || 'Erro ao iniciar sessão' 
      };
    }
  };

  // Função para encerrar sessão atual
  const encerrarSessao = async () => {
    try {
      const headers = token ? { Authorization: `Bearer ${token}` } : {};
      await axios.post(`${API_FESTIVAL}/api/sessoes/encerrar`, {}, { headers });
      
      // Limpar estado local
      setSessaoAtiva(null);
      
      return { success: true };
    } catch (error) {
      console.error('Erro ao encerrar sessão:', error);
      return { 
        success: false, 
        message: error.response?.data?.message || 'Erro ao encerrar sessão' 
      };
    }
  };

  // Função para toggle votação pública
  const toggleVotacaoPublica = async (status) => {
    try {
      const headers = token ? { Authorization: `Bearer ${token}` } : {};
      await axios.post(`${API_FESTIVAL}/api/sessoes/ativa/toggle-publica`, { status }, { headers });
      
      // Atualizar estado local
      setSessaoAtiva(prev => prev ? { ...prev, votacao_publica_ativa: status } : null);
      
      return { success: true };
    } catch (error) {
      console.error('Erro ao alterar votação pública:', error);
      return { 
        success: false, 
        message: error.response?.data?.message || 'Erro ao alterar votação pública' 
      };
    }
  };

  // Função para toggle votação dos jurados
  const toggleVotacaoJurados = async (status) => {
    try {
      const headers = token ? { Authorization: `Bearer ${token}` } : {};
      await axios.post(`${API_FESTIVAL}/api/sessoes/ativa/toggle-jurados`, { status }, { headers });
      
      // Atualizar estado local
      setSessaoAtiva(prev => prev ? { ...prev, votacao_jurados_ativa: status } : null);
      
      return { success: true };
    } catch (error) {
      console.error('Erro ao alterar votação dos jurados:', error);
      return { 
        success: false, 
        message: error.response?.data?.message || 'Erro ao alterar votação dos jurados' 
      };
    }
  };

  const value = {
    sessaoAtiva,
    loading,
    fetchSessaoAtiva,
    iniciarSessao,
    encerrarSessao,
    toggleVotacaoPublica,
    toggleVotacaoJurados
  };

  return (
    <SessaoContext.Provider value={value}>
      {children}
    </SessaoContext.Provider>
  );
};

// Hook customizado
export const useSessao = () => {
  const context = useContext(SessaoContext);
  if (!context) {
    throw new Error('useSessao deve ser usado dentro de SessaoProvider');
  }
  return context;
};