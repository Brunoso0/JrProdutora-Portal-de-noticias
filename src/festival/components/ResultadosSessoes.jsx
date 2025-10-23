import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { API_FESTIVAL } from '../../services/api';
import PopupAvancosPodio from '../components/PopupAvancosPodio';
import '../styles/ResultadosSessoes.css';

export default function ResultadosSessoes() {
    const [sessoesEncerradas, setSessoesEncerradas] = useState([]);
    const [selectedSessaoId, setSelectedSessaoId] = useState('');
    const [resultados, setResultados] = useState(null);
    const [isLoading, setIsLoading] = useState(false);
    const [isLoadingSessoes, setIsLoadingSessoes] = useState(true);
    const [erro, setErro] = useState('');

    useEffect(() => {
        const fetchSessoesEncerradas = async () => {
            setIsLoadingSessoes(true);
            try {
                const response = await axios.get(`${API_FESTIVAL}/api/etapas/sessoes/encerradas`);
                setSessoesEncerradas(response.data || []);
            } catch (error) {
                console.error("Erro ao buscar sessões encerradas:", error);
                setErro("Erro ao carregar sessões encerradas");
                setSessoesEncerradas([]);
            } finally {
                setIsLoadingSessoes(false);
            }
        };

        fetchSessoesEncerradas();
    }, []);

    const handleApurarResultados = async (sessaoId) => {
        if (!sessaoId) {
            setResultados(null);
            setSelectedSessaoId('');
            setErro('');
            return;
        }

        setSelectedSessaoId(sessaoId);
        setIsLoading(true);
        setErro('');

        try {
            const response = await axios.get(`${API_FESTIVAL}/api/dashboard/avancos-sessao`, {
                params: { sessao_id: sessaoId }
            });
            
            console.log("Resultados da sessão:", response.data);
            setResultados(response.data);
        } catch (error) {
            console.error("Erro ao apurar resultados:", error);
            setErro("Erro ao carregar resultados da sessão selecionada");
            setResultados(null);
        } finally {
            setIsLoading(false);
        }
    };

    const formatarDataSessao = (dataHora) => {
        const date = new Date(dataHora);
        return date.toLocaleString('pt-BR', {
            day: '2-digit',
            month: '2-digit',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
    };

    if (isLoadingSessoes) {
        return (
            <div className="painel-section">
                <div className="loading-container">
                    <div className="loading-spinner"></div>
                    <p>Carregando sessões...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="painel-section">
            <div className="section-header">
                <h2>📊 Apuração de Resultados</h2>
                <p className="section-subtitle">Visualize os resultados de sessões de votação já encerradas</p>
            </div>

            <div className="selecao-sessao-card">
                <div className="form-group">
                    <label htmlFor="sessao-select">Selecione uma Sessão:</label>
                    <select 
                        id="sessao-select"
                        onChange={(e) => handleApurarResultados(e.target.value)} 
                        value={selectedSessaoId}
                        className="form-control"
                        disabled={isLoading}
                    >
                        <option value="">Escolha uma sessão para ver os resultados...</option>
                        {sessoesEncerradas.map(sessao => (
                            <option key={sessao.id} value={sessao.id}>
                                {sessao.descricao} - {formatarDataSessao(sessao.data_hora_inicio)}
                                {sessao.etapa_nome && ` (${sessao.etapa_nome})`}
                            </option>
                        ))}
                    </select>
                </div>

                {sessoesEncerradas.length === 0 && (
                    <div className="empty-state">
                        <p>📭 Nenhuma sessão encerrada encontrada</p>
                        <small>As sessões aparecerão aqui após serem encerradas</small>
                    </div>
                )}
            </div>

            {erro && (
                <div className="error-card">
                    <p>❌ {erro}</p>
                </div>
            )}

            {isLoading && (
                <div className="loading-container">
                    <div className="loading-spinner"></div>
                    <p>Calculando resultados da sessão...</p>
                </div>
            )}

            {resultados && !isLoading && !erro && (
                <div className="resultados-container">
                    <div className="resultados-header">
                        <h3>🏆 Resultados da Sessão</h3>
                        {selectedSessaoId && (
                            <div className="sessao-detalhes">
                                {(() => {
                                    const sessao = sessoesEncerradas.find(s => s.id.toString() === selectedSessaoId);
                                    return sessao ? (
                                        <>
                                            <span className="sessao-nome">{sessao.descricao}</span>
                                            <span className="sessao-data">{formatarDataSessao(sessao.data_hora_inicio)}</span>
                                        </>
                                    ) : null;
                                })()}
                            </div>
                        )}
                    </div>
                    
                    <PopupAvancosPodio 
                        data={resultados}
                        sessaoId={selectedSessaoId}
                        isEmbedded={true}
                    />
                </div>
            )}

            {!resultados && !isLoading && selectedSessaoId && (
                <div className="no-results">
                    <span className="no-results-icon">📊</span>
                    <p>Nenhum resultado encontrado para esta sessão.</p>
                </div>
            )}
        </div>
    );
}
