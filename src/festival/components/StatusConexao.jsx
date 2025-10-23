import React, { useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import { API_FESTIVAL } from '../../services/api';
import '../styles/StatusConexao.css';

const StatusConexao = ({ onStatusChange }) => {
  const [status, setStatus] = useState('online'); // Começar otimista
  const [lastCheck, setLastCheck] = useState(new Date());
  const [retryCount, setRetryCount] = useState(0);
  const [isChecking, setIsChecking] = useState(false);

  const verificarConexao = useCallback(async () => {
    // Evitar verificações muito frequentes
    if (isChecking) return;
    
    try {
      setIsChecking(true);
      const startTime = Date.now();
      
      await axios.get(`${API_FESTIVAL}/api/etapas/listar`, { 
        timeout: 8000,
        headers: { 'Cache-Control': 'no-cache' }
      });
      
      const responseTime = Date.now() - startTime;
      
      // Só mudar status se realmente estava offline
      if (status === 'offline') {
        setStatus('online');
        setRetryCount(0);
        if (onStatusChange) {
          onStatusChange({ status: 'online', responseTime });
        }
      }
      setLastCheck(new Date());
      
    } catch (error) {
      // Só considerar offline em erros reais de rede
      const isRealError = (
        error.code === 'ECONNABORTED' ||
        error.response?.status >= 500 ||
        !error.response
      );
      
      if (isRealError && status === 'online') {
        console.warn('🔌 Detectado problema real de conexão:', error.message);
        setStatus('offline');
        setRetryCount(prev => prev + 1);
        setLastCheck(new Date());
        
        if (onStatusChange) {
          onStatusChange({ 
            status: 'offline', 
            error: error.message, 
            retryCount: retryCount + 1 
          });
        }
      }
    } finally {
      setIsChecking(false);
    }
  }, [onStatusChange, retryCount, status, isChecking]);

  useEffect(() => {
    // Verificação inicial apenas se necessário
    if (status === 'offline') {
      const interval = setInterval(verificarConexao, 15000); // 15s quando offline
      return () => clearInterval(interval);
    }
  }, [verificarConexao, status]);

  // Só mostrar o componente se realmente offline
  if (status === 'online') {
    return null;
  }

  const formatarTempo = (data) => {
    if (!data) return 'Nunca';
    const agora = new Date();
    const diff = Math.floor((agora - data) / 1000);
    
    if (diff < 60) return `${diff} segundos atrás`;
    if (diff < 3600) return `${Math.floor(diff / 60)} minutos atrás`;
    return data.toLocaleTimeString();
  };

  return (
    <div className={`status-conexao ${status}`}>
      <span className="status-icon">🔴</span>
      <span className="status-text">
        Servidor Offline ({retryCount} tentativas)
      </span>
      <span className="last-check">
        Última verificação: {formatarTempo(lastCheck)}
      </span>
      <button 
        className="btn-retry" 
        onClick={verificarConexao}
        disabled={isChecking}
        title="Tentar reconectar"
      >
        {isChecking ? '🔄 Verificando...' : '🔄 Reconectar'}
      </button>
    </div>
  );
};

export default StatusConexao;