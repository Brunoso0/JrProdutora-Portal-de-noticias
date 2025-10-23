import React, { useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import { API_FESTIVAL } from '../../services/api';
import { useConnectionStatus } from '../hooks/useConnection';
import ModoOffline from './ModoOffline';
import '../styles/ControleSessao.css';

export default function ControleSessao() {
    const { isOnline, isRetrying, lastSuccessfulCheck, consecutiveFailures, checkConnection } = useConnectionStatus();
    const [etapas, setEtapas] = useState([]);
    const [selectedEtapa, setSelectedEtapa] = useState('');
    const [descricao, setDescricao] = useState('');
    const [sessaoAtiva, setSessaoAtiva] = useState(null);
    const [isLoading, setIsLoading] = useState(true);
    const [isProcessing, setIsProcessing] = useState(false);
    const [debugExpanded, setDebugExpanded] = useState(false);

    const verificarSessaoAtiva = useCallback(async () => {
        try {
            console.log("=== INICIANDO VERIFICAÇÃO DE SESSÃO ===");
            const response = await axios.get(`${API_FESTIVAL}/api/etapas/sessoes/ativa`);
            console.log("✅ Sessão verificada com sucesso");
            
            // Verificar diferentes formatos possíveis de resposta
            let novaSessao = null;
            
            if (response.data) {
                // Caso 1: Resposta direta com ID
                if (response.data.id) {
                    console.log("✅ Formato 1: Sessão encontrada diretamente");
                    novaSessao = response.data;
                } 
                // Caso 2: Resposta aninhada em 'sessao'
                else if (response.data.sessao && response.data.sessao.id) {
                    console.log("✅ Formato 2: Sessão encontrada em 'sessao'");
                    novaSessao = response.data.sessao;
                } 
                // Caso 3: Resposta aninhada em 'data'
                else if (response.data.data && response.data.data.id) {
                    console.log("✅ Formato 3: Sessão encontrada em 'data'");
                    novaSessao = response.data.data;
                } 
                // Caso 4: Resposta é um array com dados
                else if (Array.isArray(response.data) && response.data.length > 0 && response.data[0].id) {
                    console.log("✅ Formato 4: Sessão encontrada em array");
                    novaSessao = response.data[0];
                }
                // Caso 5: Resposta vazia ou null (sem sessão ativa)
                else {
                    console.log("❌ Nenhuma sessão ativa encontrada");
                    novaSessao = null;
                }
            } else {
                console.log("❌ Resposta vazia ou inválida");
                novaSessao = null;
            }
            
            console.log("Sessão processada:", novaSessao);
            console.log("Sessão atual no estado:", sessaoAtiva);
            console.log("=== FIM DA VERIFICAÇÃO ===");
            
            setSessaoAtiva(novaSessao);
        } catch (error) {
            console.error("❌ ERRO ao verificar sessão ativa:", error);
            
            // Tratamento específico para 502 Bad Gateway
            if (error.response?.status === 502) {
                console.warn("🚨 Servidor temporariamente indisponível (502 Bad Gateway)");
                setSessaoAtiva(null);
            } else if (error.response) {
                console.error("Status do erro:", error.response.status);
                console.error("Dados do erro:", error.response.data);
            } else {
                console.error("Erro de rede ou conexão:", error.message);
            }
        } finally {
            setIsLoading(false);
        }
    }, [sessaoAtiva]);

    useEffect(() => {

        const fetchEtapas = async () => {
            try {
                console.log("📡 Carregando etapas...");
                const response = await axios.get(`${API_FESTIVAL}/api/etapas/listar`);
                console.log("✅ Etapas carregadas:", response.data?.length || 0);
                setEtapas(response.data || []);
            } catch (error) {
                console.error("❌ Erro ao buscar etapas:", error);
                if (error.response?.status === 502) {
                    console.warn("🚨 Servidor temporariamente indisponível para carregar etapas");
                }
                setEtapas([]);
            }
        };

        verificarSessaoAtiva();
        fetchEtapas();

        // Intervalo mais longo para verificação automática (30 segundos)
        const intervalId = setInterval(verificarSessaoAtiva, 30000);
        return () => clearInterval(intervalId);
    }, [verificarSessaoAtiva]);

    const calcularDuracao = (dataInicio) => {
        const inicio = new Date(dataInicio);
        const agora = new Date();
        const diferenca = agora - inicio;
        
        const horas = Math.floor(diferenca / (1000 * 60 * 60));
        const minutos = Math.floor((diferenca % (1000 * 60 * 60)) / (1000 * 60));
        
        if (horas > 0) {
            return `${horas}h ${minutos}min`;
        }
        return `${minutos}min`;
    };

    const handleIniciarSessao = async () => {
        if (!selectedEtapa || !descricao.trim()) {
            alert("Por favor, selecione uma etapa e digite uma descrição.");
            return;
        }

        if (!window.confirm("Tem certeza que deseja iniciar uma nova sessão de votação?")) {
            return;
        }

        setIsProcessing(true);
        try {
            console.log("Iniciando sessão com dados:", { etapa_id: selectedEtapa, descricao: descricao.trim() });
            
            const response = await axios.post(`${API_FESTIVAL}/api/etapas/sessoes/iniciar`, {
                etapa_id: selectedEtapa,
                descricao: descricao.trim()
            });

            console.log("Resposta do iniciar sessão:", response.data);

            if (response.data && response.data.id) {
                setSessaoAtiva(response.data);
                setSelectedEtapa('');
                setDescricao('');
                alert('Sessão iniciada com sucesso!');
                
                // Verificar novamente após 2 segundos para confirmar
                setTimeout(() => {
                    verificarSessaoAtiva();
                }, 2000);
            } else {
                console.warn("Resposta inesperada do servidor:", response.data);
                alert('Sessão pode ter sido iniciada, mas houve um problema na resposta do servidor.');
            }
        } catch (error) {
            console.error("Falha ao iniciar sessão:", error);
            const errorMessage = error.response?.data?.error || "Erro ao iniciar sessão. Tente novamente.";
            alert(errorMessage);
        } finally {
            setIsProcessing(false);
        }
    };

    const handleEncerrarSessao = async () => {
        if (!window.confirm("Tem certeza que deseja encerrar a votação atual? Esta ação não pode ser desfeita.")) {
            return;
        }

        setIsProcessing(true);
        try {
            const response = await axios.post(`${API_FESTIVAL}/api/etapas/sessoes/encerrar`);
            
            if (response.status === 200) {
                setSessaoAtiva(null);
                alert('Sessão encerrada com sucesso!');
            }
        } catch (error) {
            console.error("Falha ao encerrar sessão:", error);
            const errorMessage = error.response?.data?.error || "Erro ao encerrar sessão. Tente novamente.";
            alert(errorMessage);
        } finally {
            setIsProcessing(false);
        }
    };

    if (isLoading) {
        return (
            <div className="painel-section">
                <div className="loading-container">
                    <div className="loading-spinner"></div>
                    <p>Carregando status da votação...</p>
                </div>
            </div>
        );
    }

    console.log("Estado atual - sessaoAtiva:", sessaoAtiva, "isLoading:", isLoading);

    return (
        <div className="painel-section">
            <div className="section-header-sessao">
                <h2>🎛️ Controle de Votação</h2>
                <div style={{display: 'flex', alignItems: 'center', gap: '10px'}}>
                    <div className={`status-indicator ${sessaoAtiva ? 'ativo' : 'inativo'}`}>
                        {sessaoAtiva ? '🟢 Votação Ativa' : '🔴 Nenhuma Votação Ativa'}
                    </div>
                    <button 
                        className="btn btn-secondary"
                        onClick={verificarSessaoAtiva}
                        style={{padding: '5px 10px', fontSize: '12px'}}
                    >
                        🔄 Verificar Agora
                    </button>
                </div>
            </div>

            {/* Debug temporário expansível */}
            <div style={{
                background: '#f8f9fa', 
                border: '1px solid #dee2e6',
                borderRadius: '8px',
                margin: '10px 0',
                overflow: 'hidden'
            }}>
                <div 
                    onClick={() => setDebugExpanded(!debugExpanded)}
                    style={{
                        padding: '10px 15px',
                        background: '#e9ecef',
                        cursor: 'pointer',
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        fontSize: '14px',
                        fontWeight: 'bold',
                        color: '#495057'
                    }}
                >
                    <span>🔍 Debug Information</span>
                    <div style={{display: 'flex', alignItems: 'center', gap: '10px'}}>
                        <span style={{
                            fontSize: '12px',
                            padding: '2px 8px',
                            borderRadius: '12px',
                            background: sessaoAtiva ? '#d4edda' : '#f8d7da',
                            color: sessaoAtiva ? '#155724' : '#721c24'
                        }}>
                            {sessaoAtiva ? 'Ativa' : 'Inativa'}
                        </span>
                        <span>{debugExpanded ? '🔽' : '▶️'}</span>
                    </div>
                </div>
                
                {debugExpanded && (
                    <div style={{padding: '15px', fontSize: '13px', fontFamily: 'monospace'}}>
                        <div style={{marginBottom: '10px'}}>
                            <strong style={{color: '#007bff'}}>Loading State:</strong> 
                            <span style={{marginLeft: '10px', color: isLoading ? '#dc3545' : '#28a745'}}>
                                {isLoading ? '⏳ Carregando...' : '✅ Pronto'}
                            </span>
                        </div>
                        
                        <div style={{marginBottom: '10px'}}>
                            <strong style={{color: '#007bff'}}>Render Mode:</strong> 
                            <span style={{marginLeft: '10px', color: sessaoAtiva ? '#28a745' : '#dc3545'}}>
                                {sessaoAtiva ? '🟢 SESSÃO ATIVA' : '🔴 NOVA SESSÃO'}
                            </span>
                        </div>
                        
                        <div>
                            <strong style={{color: '#007bff'}}>Sessão Ativa:</strong>
                            {sessaoAtiva ? (
                                <div style={{
                                    marginTop: '8px',
                                    padding: '10px',
                                    background: '#f1f3f4',
                                    borderRadius: '4px',
                                    borderLeft: '4px solid #28a745'
                                }}>
                                    {Object.entries(sessaoAtiva).map(([key, value]) => (
                                        <div key={key} style={{marginBottom: '4px'}}>
                                            <span style={{color: '#6f42c1', fontWeight: 'bold'}}>{key}:</span>{' '}
                                            <span style={{color: '#495057'}}>
                                                {key.includes('data_hora') ? 
                                                    new Date(value).toLocaleString('pt-BR') : 
                                                    String(value)
                                                }
                                            </span>
                                        </div>
                                    ))}
                                </div>
                            ) : (
                                <div style={{
                                    marginTop: '8px',
                                    padding: '10px',
                                    background: '#f8f9fa',
                                    borderRadius: '4px',
                                    borderLeft: '4px solid #6c757d',
                                    color: '#6c757d',
                                    fontStyle: 'italic'
                                }}>
                                    null (nenhuma sessão ativa encontrada)
                                </div>
                            )}
                        </div>
                    </div>
                )}
            </div>

            {sessaoAtiva ? (
                <div className="sessao-ativa-card">
                    <div className="card-header">
                        <h3>🗳️ Sessão em Andamento</h3>
                        <span className="sessao-id">Sessão #{sessaoAtiva.id}</span>
                    </div>
                    
                    <div className="sessao-info">
                        <div className="info-item">
                            <label>Descrição:</label>
                            <span>{sessaoAtiva.descricao}</span>
                        </div>
                        <div className="info-item">
                            <label>Iniciada em:</label>
                            <span>{new Date(sessaoAtiva.data_hora_inicio).toLocaleString('pt-BR')}</span>
                        </div>
                        <div className="info-item">
                            <label>Duração:</label>
                            <span>{calcularDuracao(sessaoAtiva.data_hora_inicio)}</span>
                        </div>
                        {sessaoAtiva.etapa_nome && (
                            <div className="info-item">
                                <label>Etapa:</label>
                                <span>{sessaoAtiva.etapa_nome}</span>
                            </div>
                        )}
                    </div>

                    <div className="action-buttons">
                        <button 
                            className="btn btn-danger"
                            onClick={handleEncerrarSessao}
                            disabled={isProcessing}
                        >
                            {isProcessing ? '⏳ Encerrando...' : '🛑 Encerrar Votação Agora'}
                        </button>
                        
                        <button 
                            className="btn btn-secondary"
                            onClick={verificarSessaoAtiva}
                            disabled={isProcessing}
                        >
                            🔄 Atualizar Status
                        </button>
                    </div>
                </div>
            ) : (
                <div className="nova-sessao-card">
                    <div className="card-header">
                        <h3>🚀 Iniciar Nova Votação</h3>
                        <p>Configure uma nova sessão de votação para o festival</p>
                    </div>

                    <div className="form-group">
                        <label htmlFor="etapa-select">Etapa do Festival:</label>
                        <select 
                            id="etapa-select"
                            value={selectedEtapa} 
                            onChange={(e) => setSelectedEtapa(e.target.value)}
                            className="form-control"
                            disabled={isProcessing}
                        >
                            <option value="">Selecione uma etapa...</option>
                            {etapas.map(etapa => (
                                <option key={etapa.id} value={etapa.id}>
                                    {etapa.nome || `Etapa ${etapa.id}`}
                                </option>
                            ))}
                        </select>
                    </div>

                    <div className="form-group">
                        <label htmlFor="descricao-input">Descrição da Sessão:</label>
                        <input
                            id="descricao-input"
                            type="text"
                            value={descricao}
                            onChange={(e) => setDescricao(e.target.value)}
                            placeholder="Ex: Final Gospel Talent 2025"
                            className="form-control"
                            maxLength={100}
                            disabled={isProcessing}
                        />
                        <small className="form-text">
                            Esta descrição aparecerá nos resultados da votação ({descricao.length}/100)
                        </small>
                    </div>

                    <div className="action-buttons">
                        <button 
                            className="btn btn-primary"
                            onClick={handleIniciarSessao}
                            disabled={isProcessing || !selectedEtapa || !descricao.trim()}
                        >
                            {isProcessing ? '⏳ Iniciando...' : '▶️ Iniciar Nova Sessão'}
                        </button>
                    </div>
                </div>
            )}

            {/* Modo offline - apenas se realmente problemático */}
            {!isOnline && consecutiveFailures > 2 && (
                <ModoOffline 
                    onTentarNovamente={checkConnection}
                    ultimaVerificacao={lastSuccessfulCheck}
                    tentativasFalharam={consecutiveFailures}
                    isRetrying={isRetrying}
                />
            )}
        </div>
    );
}
