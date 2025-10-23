import { useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import { API_FESTIVAL } from '../../services/api';

// Hook customizado para gerenciar estado de conexão
export const useConnectionStatus = () => {
  const [isOnline, setIsOnline] = useState(true); // Começar como online
  const [lastSuccessfulCheck, setLastSuccessfulCheck] = useState(new Date());
  const [consecutiveFailures, setConsecutiveFailures] = useState(0);
  const [isRetrying, setIsRetrying] = useState(false);
  const [lastError, setLastError] = useState(null);

  const checkConnection = useCallback(async () => {
    // Se já estamos online e não há muitas falhas, não verificar muito frequentemente
    if (isOnline && consecutiveFailures < 2) {
      return;
    }

    try {
      setIsRetrying(true);
      setLastError(null);
      
      // Usar uma requisição mais leve e com timeout menor
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 5000);
      
      await axios.get(`${API_FESTIVAL}/api/etapas/listar`, { 
        signal: controller.signal,
        headers: {
          'Cache-Control': 'no-cache',
          'Pragma': 'no-cache'
        }
      });
      
      clearTimeout(timeoutId);
      
      // Sucesso
      if (!isOnline || consecutiveFailures > 0) {
        console.log('🟢 Conexão confirmada/restaurada');
      }
      
      setIsOnline(true);
      setConsecutiveFailures(0);
      setLastSuccessfulCheck(new Date());
      
    } catch (error) {
      setLastError(error.message);
      
      // Só considerar erro real se for um erro de rede ou 5xx
      const isRealConnectionError = (
        error.code === 'ECONNABORTED' ||
        error.code === 'ERR_NETWORK' ||
        error.message.includes('abort') ||
        error.response?.status >= 500
      );
      
      if (isRealConnectionError) {
        console.warn('🔴 Problema de conexão detectado:', error.message);
        setConsecutiveFailures(prev => prev + 1);
        
        // Só marcar como offline após 3 falhas consecutivas reais
        if (consecutiveFailures >= 2) {
          setIsOnline(false);
          console.error('❌ Sistema offline após múltiplas falhas');
        }
      } else {
        // Erro que não indica problema de conexão (4xx, etc)
        // Não fazer nada, sistema continua online
        setConsecutiveFailures(0); // Reset contador
      }
    } finally {
      setIsRetrying(false);
    }
  }, [consecutiveFailures, isOnline]);

  // Verificação mais conservadora
  useEffect(() => {
    // Verificação inicial após 2 segundos (dar tempo para app carregar)
    const initialCheck = setTimeout(checkConnection, 2000);
    
    // Verificação periódica baseada no status
    const interval = setInterval(() => {
      if (!isOnline) {
        // Se offline, verificar a cada 10 segundos
        checkConnection();
      } else if (consecutiveFailures > 0) {
        // Se online mas com falhas recentes, verificar a cada 30 segundos
        checkConnection();
      }
      // Se tudo OK, não verificar automaticamente (apenas quando necessário)
    }, isOnline ? 30000 : 10000);
    
    return () => {
      clearTimeout(initialCheck);
      clearInterval(interval);
    };
  }, [checkConnection, isOnline, consecutiveFailures]);

  return {
    isOnline,
    isRetrying,
    lastSuccessfulCheck,
    consecutiveFailures,
    lastError,
    checkConnection: () => {
      // Força uma verificação manual
      setConsecutiveFailures(0);
      checkConnection();
    }
  };
};

// Hook para requisições com fallback
export const useApiWithFallback = () => {
  const { isOnline } = useConnectionStatus();

  const makeRequest = useCallback(async (config) => {
    if (!isOnline) {
      throw new Error('OFFLINE_MODE: Sistema em modo offline');
    }

    try {
      const response = await axios({
        ...config,
        timeout: 8000,
        headers: {
          ...config.headers,
          'Cache-Control': 'no-cache'
        }
      });
      return response;
    } catch (error) {
      if (error.response?.status >= 500) {
        throw new Error(`SERVER_ERROR: ${error.response.status} - ${error.message}`);
      }
      throw error;
    }
  }, [isOnline]);

  return { makeRequest, isOnline };
};