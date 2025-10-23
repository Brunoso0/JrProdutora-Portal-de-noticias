import React from 'react';
import '../styles/ModoOffline.css';

const ModoOffline = ({ 
  onTentarNovamente, 
  ultimaVerificacao, 
  tentativasFalharam,
  isRetrying = false 
}) => {
  
  const formatarTempo = (data) => {
    if (!data) return 'Nunca';
    const agora = new Date();
    const diff = Math.floor((agora - data) / 1000); // segundos
    
    if (diff < 60) return `${diff} segundos atrás`;
    if (diff < 3600) return `${Math.floor(diff / 60)} minutos atrás`;
    return data.toLocaleTimeString();
  };

  return (
    <div className="modo-offline">
      <div className="offline-header">
        <div className="offline-icon">📡</div>
        <h2>Sistema em Modo Offline</h2>
      </div>

      <div className="offline-content">
        <div className="status-info">
          <p className="problema">
            🚨 <strong>Servidor indisponível</strong> - Não foi possível conectar ao servidor do festival.
          </p>
          
          <div className="detalhes">
            <div className="detalhe-item">
              <span className="label">Última conexão bem-sucedida:</span>
              <span className="valor">{formatarTempo(ultimaVerificacao)}</span>
            </div>
            <div className="detalhe-item">
              <span className="label">Tentativas falharam:</span>
              <span className="valor">{tentativasFalharam}</span>
            </div>
            <div className="detalhe-item">
              <span className="label">Status atual:</span>
              <span className="valor status-offline">
                {isRetrying ? '🔄 Tentando reconectar...' : '❌ Desconectado'}
              </span>
            </div>
          </div>
        </div>

        <div className="possiveis-causas">
          <h3>🤔 Possíveis causas:</h3>
          <ul>
            <li>Manutenção programada do servidor</li>
            <li>Sobrecarga temporária do sistema</li>
            <li>Problemas de conectividade de rede</li>
            <li>Falha técnica no servidor</li>
          </ul>
        </div>

        <div className="acoes-usuario">
          <h3>💡 O que fazer:</h3>
          <div className="acoes-grid">
            <div className="acao-card">
              <div className="acao-icon">⏰</div>
              <div className="acao-content">
                <strong>Aguardar</strong>
                <p>O sistema tenta reconectar automaticamente a cada 5 segundos</p>
              </div>
            </div>
            
            <div className="acao-card">
              <div className="acao-icon">🔄</div>
              <div className="acao-content">
                <strong>Tentar Manualmente</strong>
                <p>Clique no botão abaixo para forçar uma nova tentativa</p>
              </div>
            </div>
            
            <div className="acao-card">
              <div className="acao-icon">🌐</div>
              <div className="acao-content">
                <strong>Verificar Internet</strong>
                <p>Confirme se sua conexão com a internet está funcionando</p>
              </div>
            </div>
          </div>
        </div>

        <div className="acoes-botoes">
          <button 
            className={`btn-reconectar ${isRetrying ? 'loading' : ''}`}
            onClick={onTentarNovamente}
            disabled={isRetrying}
          >
            {isRetrying ? (
              <>
                <span className="spinner"></span>
                Reconectando...
              </>
            ) : (
              <>
                🔄 Tentar Reconectar
              </>
            )}
          </button>
          
          <button 
            className="btn-recarregar"
            onClick={() => window.location.reload()}
          >
            ↻ Recarregar Página
          </button>
        </div>

        <div className="info-tecnica">
          <details>
            <summary>📋 Informações Técnicas</summary>
            <div className="tech-details">
              <p><strong>Endpoint:</strong> {window.location.origin}</p>
              <p><strong>Timestamp:</strong> {new Date().toISOString()}</p>
              <p><strong>User Agent:</strong> {navigator.userAgent.substring(0, 50)}...</p>
            </div>
          </details>
        </div>
      </div>
    </div>
  );
};

export default ModoOffline;