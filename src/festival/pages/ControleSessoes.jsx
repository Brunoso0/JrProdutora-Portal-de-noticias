import React, { useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import { API_FESTIVAL } from '../../services/api';
import { useAuth } from '../context/AuthContext';
import { useSessao } from '../context/SessaoContext';
import ModalIniciarSessao from '../components/ModalIniciarSessao';
import ModalGerenciarSessao from '../components/ModalGerenciarSessao';
import StatusConexao from '../components/StatusConexao';
import ModoOffline from '../components/ModoOffline';
import { useConnectionStatus } from '../hooks/useConnection';
import { toast } from 'react-toastify';

const ControleSessoes = () => {
  const { role } = useAuth();
  const { sessaoAtiva, loading: sessaoLoading } = useSessao();
  const { isOnline, isRetrying, lastSuccessfulCheck, consecutiveFailures, checkConnection, lastError } = useConnectionStatus();
  const [etapas, setEtapas] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modalIniciarAberto, setModalIniciarAberto] = useState(false);
  const [modalGerenciarAberto, setModalGerenciarAberto] = useState(false);
  const [etapaSelecionada, setEtapaSelecionada] = useState(null);
  const [forceOfflineMode, setForceOfflineMode] = useState(false); // Para debug

  // Carregar etapas
  const carregarEtapas = useCallback(async () => {
    // Se forçadamente offline ou realmente offline com muitas falhas
    if (forceOfflineMode || (!isOnline && consecutiveFailures > 2)) {
      console.warn("⚠️ Sistema offline, não tentando carregar etapas");
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      console.log("📡 Carregando etapas no ControleSessoes...");
      const response = await axios.get(`${API_FESTIVAL}/api/etapas/listar`);
      setEtapas(response.data.sort((a, b) => a.id - b.id));
      console.log("✅ Etapas carregadas:", response.data.length);
    } catch (error) {
      console.error('💥 Erro ao carregar etapas:', error);
      // Não mostrar toast para erros menores
      if (error.response?.status >= 500) {
        toast.error('Servidor temporariamente indisponível');
      }
    } finally {
      setLoading(false);
    }
  }, [isOnline, consecutiveFailures, forceOfflineMode]);

  useEffect(() => {
    carregarEtapas();
  }, [carregarEtapas]); // Recarregar quando voltar online

  // Verificar se usuário tem acesso (admin ou moderador)
  if (role !== 'admin' && role !== 'moderador') {
    return (
      <div className="acesso-negado">
        <h2>Acesso Negado</h2>
        <p>Apenas administradores e moderadores podem acessar esta página.</p>
      </div>
    );
  }

  // Abrir modal para iniciar sessão
  const iniciarSessao = (etapa) => {
    setEtapaSelecionada(etapa);
    setModalIniciarAberto(true);
  };

  // Abrir modal para gerenciar sessão ativa
  const gerenciarSessao = () => {
    setModalGerenciarAberto(true);
  };

  // Fechar modais
  const fecharModais = () => {
    setModalIniciarAberto(false);
    setModalGerenciarAberto(false);
    setEtapaSelecionada(null);
  };

  // Renderizar botão da etapa
  const renderizarBotaoEtapa = (etapa) => {
    const isSessaoAtiva = sessaoAtiva && sessaoAtiva.etapa_id === etapa.id;
    const temSessaoOutraEtapa = sessaoAtiva && sessaoAtiva.etapa_id !== etapa.id;

    if (isSessaoAtiva) {
      // Esta etapa tem sessão ativa
      return (
        <button 
          className="btn btn-success btn-large"
          onClick={gerenciarSessao}
        >
          🎯 Gerenciar Sessão Atual
        </button>
      );
    } 
    
    if (temSessaoOutraEtapa) {
      // Outra etapa tem sessão ativa, desabilitar este botão
      return (
        <button 
          className="btn btn-disabled btn-large"
          disabled
          title={`Sessão ativa em: ${etapas.find(e => e.id === sessaoAtiva.etapa_id)?.nome}`}
        >
          ⏸️ Aguardando Finalização
        </button>
      );
    }
    
    // Nenhuma sessão ativa, pode iniciar
    return (
      <button 
        className="btn btn-primary btn-large"
        onClick={() => iniciarSessao(etapa)}
      >
        ▶️ Iniciar Sessão
      </button>
    );
  };

  // Verificar se deve mostrar modo offline (apenas se realmente problemático)
  const shouldShowOfflineMode = !isOnline && consecutiveFailures > 2 && etapas.length === 0;
  
  if (shouldShowOfflineMode) {
    return (
      <div className="controle-sessoes">
        <div className="header">
          <h1>Controle de Sessões - Gospel Talent 2025</h1>
          <StatusConexao 
            onStatusChange={(status) => {
              if (status.status === 'offline') {
                toast.warning('⚠️ Servidor offline. Tentativas de reconexão em andamento...');
              } else if (status.status === 'online') {
                toast.success('✅ Conexão com servidor restaurada!');
              }
            }}
          />
        </div>
        
        <ModoOffline 
          onTentarNovamente={checkConnection}
          ultimaVerificacao={lastSuccessfulCheck}
          tentativasFalharam={consecutiveFailures}
          isRetrying={isRetrying}
        />
      </div>
    );
  }

  if (loading || sessaoLoading) {
    return (
      <div className="loading-container">
        <p>Carregando controle de sessões...</p>
      </div>
    );
  }

  return (
    <div className="controle-sessoes">
      <div className="header">
        <h1>Controle de Sessões - Gospel Talent 2025</h1>
        <StatusConexao 
          onStatusChange={(status) => {
            // Só notificar em mudanças reais de status
            if (status.status === 'offline' && consecutiveFailures > 2) {
              toast.warning('⚠️ Servidor com problemas. Sistema em modo offline...');
            } else if (status.status === 'online' && consecutiveFailures > 0) {
              toast.success('✅ Conexão restaurada!');
            }
          }}
        />
        
        {sessaoAtiva ? (
          <div className="status-sessao-ativa">
            <div className="status-info">
              <span className="status-badge ativa">🔴 SESSÃO ATIVA</span>
              <div className="sessao-detalhes">
                <h3>{sessaoAtiva.descricao}</h3>
                <p>Etapa: {etapas.find(e => e.id === sessaoAtiva.etapa_id)?.nome}</p>
                <p>Iniciada em: {new Date(sessaoAtiva.criado_em).toLocaleString()}</p>
              </div>
            </div>
            <button 
              className="btn btn-secondary"
              onClick={gerenciarSessao}
            >
              Gerenciar Sessão
            </button>
          </div>
        ) : (
          <div className="status-sessao-inativa">
            <span className="status-badge inativa">⚫ NENHUMA SESSÃO ATIVA</span>
            <p>Selecione uma etapa para iniciar uma nova sessão de votação</p>
          </div>
        )}
      </div>

      <div className="etapas-grid">
        {etapas.length === 0 ? (
          <div className="empty-state">
            <h3>⚠️ Servidor Temporariamente Indisponível</h3>
            <p>Não foi possível carregar as etapas do festival.</p>
            <p>O servidor pode estar em manutenção ou sobrecarregado.</p>
            <div className="retry-info">
              <p>🔄 O sistema está tentando reconectar automaticamente.</p>
              <p>📊 Acompanhe o status de conexão acima.</p>
            </div>
            <button 
              className="btn btn-primary"
              onClick={() => window.location.reload()}
            >
              🔄 Recarregar Página
            </button>
          </div>
        ) : (
          etapas.map((etapa) => (
            <div key={etapa.id} className="etapa-card">
              <div className="etapa-info">
                <h2>{etapa.nome}</h2>
                <p className="etapa-descricao">{etapa.descricao || 'Sem descrição'}</p>
                <div className="etapa-meta">
                  <span className="ordem">Ordem: {etapa.ordem}</span>
                  <span className={`status ${etapa.ativa ? 'ativa' : 'inativa'}`}>
                    {etapa.ativa ? 'Ativa' : 'Inativa'}
                  </span>
                </div>
                
                {etapa.total_candidatos && (
                  <p className="candidatos-info">
                    👤 {etapa.total_candidatos} candidato(s)
                  </p>
                )}
              </div>
              
              <div className="etapa-actions">
                {etapa.ativa ? (
                  renderizarBotaoEtapa(etapa)
                ) : (
                  <button className="btn btn-disabled btn-large" disabled>
                    ⏹️ Etapa Inativa
                  </button>
                )}
              </div>
            </div>
          ))
        )}
      </div>

      {/* Modais */}
      {modalIniciarAberto && (
        <ModalIniciarSessao 
          etapa={etapaSelecionada}
          onClose={fecharModais}
          onSuccess={fecharModais}
        />
      )}

      {modalGerenciarAberto && sessaoAtiva && (
        <ModalGerenciarSessao 
          sessao={sessaoAtiva}
          onClose={fecharModais}
          onSuccess={fecharModais}
        />
      )}
    </div>
  );
};

export default ControleSessoes;