import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { API_FESTIVAL } from '../../services/api';
import { useAuth } from '../context/AuthContext';
import { toast } from 'react-toastify';

const ProgressoCandidatos = () => {
  const { role } = useAuth();
  const [etapas, setEtapas] = useState([]);
  const [candidatos, setCandidatos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [draggedCandidato, setDraggedCandidato] = useState(null);

  // Carregar dados
  const carregarDados = async () => {
    try {
      setLoading(true);
      
      // Carregar etapas e candidatos em paralelo
      const [etapasResponse, candidatosResponse] = await Promise.all([
        axios.get(`${API_FESTIVAL}/api/etapas/listar`),
        axios.get(`${API_FESTIVAL}/api/candidatos`)
      ]);
      
      setEtapas(etapasResponse.data.sort((a, b) => a.id - b.id));
      setCandidatos(candidatosResponse.data);
      
    } catch (error) {
      console.error('Erro ao carregar dados:', error);
      toast.error('Erro ao carregar dados');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    carregarDados();
  }, []);

  // Filtrar candidatos por etapa
  const getCandidatosPorEtapa = (etapaId) => {
    return candidatos.filter(candidato => 
      candidato.etapa_atual_id === etapaId && !candidato.eliminado
    );
  };

  // Candidatos eliminados
  const getCandidatosEliminados = () => {
    return candidatos.filter(candidato => candidato.eliminado);
  };

  // Iniciar drag
  const handleDragStart = (e, candidato) => {
    setDraggedCandidato(candidato);
    e.dataTransfer.effectAllowed = 'move';
  };

  // Permitir drop
  const handleDragOver = (e) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
  };

  // Fazer drop - mover candidato
  const handleDrop = async (e, novaEtapaId, eliminado = false) => {
    e.preventDefault();
    
    if (!draggedCandidato) return;

    // Se não mudou nada, não fazer nada
    if (
      draggedCandidato.etapa_atual_id === novaEtapaId && 
      draggedCandidato.eliminado === eliminado
    ) {
      setDraggedCandidato(null);
      return;
    }

    try {
      const payload = eliminado 
        ? { eliminado: true }
        : { nova_etapa_id: novaEtapaId, eliminado: false };

      await axios.put(
        `${API_FESTIVAL}/api/candidatos/${draggedCandidato.id}/progresso`,
        payload
      );

      // Atualizar estado local
      setCandidatos(prev => prev.map(candidato => {
        if (candidato.id === draggedCandidato.id) {
          return {
            ...candidato,
            etapa_atual_id: eliminado ? candidato.etapa_atual_id : novaEtapaId,
            eliminado: eliminado
          };
        }
        return candidato;
      }));

      const acao = eliminado 
        ? 'eliminado' 
        : `movido para ${etapas.find(e => e.id === novaEtapaId)?.nome}`;
      
      toast.success(`${draggedCandidato.nome} foi ${acao}!`);
      
    } catch (error) {
      console.error('Erro ao mover candidato:', error);
      toast.error(error.response?.data?.message || 'Erro ao mover candidato');
    }

    setDraggedCandidato(null);
  };

  // Restaurar candidato eliminado
  const restaurarCandidato = async (candidato) => {
    if (!window.confirm(`Restaurar ${candidato.nome}?`)) return;

    try {
      // Restaurar para a primeira etapa
      const primeiraEtapa = etapas.find(e => e.ordem === 1);
      if (!primeiraEtapa) {
        toast.error('Nenhuma etapa disponível para restaurar candidato');
        return;
      }

      await axios.put(
        `${API_FESTIVAL}/api/candidatos/${candidato.id}/progresso`,
        { nova_etapa_id: primeiraEtapa.id, eliminado: false }
      );

      // Atualizar estado local
      setCandidatos(prev => prev.map(c => {
        if (c.id === candidato.id) {
          return { ...c, etapa_atual_id: primeiraEtapa.id, eliminado: false };
        }
        return c;
      }));

      toast.success(`${candidato.nome} foi restaurado!`);
      
    } catch (error) {
      console.error('Erro ao restaurar candidato:', error);
      toast.error('Erro ao restaurar candidato');
    }
  };

  // Verificar se é admin
  if (role !== 'admin') {
    return (
      <div className="acesso-negado">
        <h2>Acesso Negado</h2>
        <p>Apenas administradores podem acessar esta página.</p>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="loading-container">
        <p>Carregando candidatos...</p>
      </div>
    );
  }

  return (
    <div className="progresso-candidatos">
      <div className="header">
        <h1>Progresso dos Candidatos</h1>
        <p>Arraste os candidatos entre as etapas para atualizar seu progresso</p>
      </div>

      <div className="etapas-board">
        {/* Colunas das etapas */}
        {etapas.map((etapa) => {
          const candidatosEtapa = getCandidatosPorEtapa(etapa.id);
          
          return (
            <div 
              key={etapa.id} 
              className="etapa-coluna"
              onDragOver={handleDragOver}
              onDrop={(e) => handleDrop(e, etapa.id)}
            >
              <div className="etapa-header">
                <h3>{etapa.nome}</h3>
                <span className="contador">{candidatosEtapa.length} candidato(s)</span>
              </div>
              
              <div className="candidatos-lista">
                {candidatosEtapa.map((candidato) => (
                  <div 
                    key={candidato.id}
                    className={`candidato-card ${draggedCandidato?.id === candidato.id ? 'dragging' : ''}`}
                    draggable
                    onDragStart={(e) => handleDragStart(e, candidato)}
                  >
                    <div className="candidato-avatar">
                      {candidato.foto ? (
                        <img 
                          src={`${API_FESTIVAL}${candidato.foto}`} 
                          alt={candidato.nome}
                        />
                      ) : (
                        <div className="avatar-placeholder">
                          {candidato.nome.charAt(0).toUpperCase()}
                        </div>
                      )}
                    </div>
                    
                    <div className="candidato-info">
                      <h4>{candidato.nome}</h4>
                      <p>{candidato.cidade_origem || 'Cidade não informada'}</p>
                      {candidato.categoria && (
                        <span className="categoria">{candidato.categoria}</span>
                      )}
                    </div>
                  </div>
                ))}
                
                {candidatosEtapa.length === 0 && (
                  <div className="etapa-vazia">
                    <p>Nenhum candidato nesta etapa</p>
                  </div>
                )}
              </div>
            </div>
          );
        })}

        {/* Coluna dos eliminados */}
        <div 
          className="etapa-coluna eliminados"
          onDragOver={handleDragOver}
          onDrop={(e) => handleDrop(e, null, true)}
        >
          <div className="etapa-header">
            <h3>Eliminados</h3>
            <span className="contador">{getCandidatosEliminados().length} candidato(s)</span>
          </div>
          
          <div className="candidatos-lista">
            {getCandidatosEliminados().map((candidato) => (
              <div 
                key={candidato.id}
                className="candidato-card eliminado"
              >
                <div className="candidato-avatar">
                  {candidato.foto ? (
                    <img 
                      src={`${API_FESTIVAL}${candidato.foto}`} 
                      alt={candidato.nome}
                    />
                  ) : (
                    <div className="avatar-placeholder">
                      {candidato.nome.charAt(0).toUpperCase()}
                    </div>
                  )}
                </div>
                
                <div className="candidato-info">
                  <h4>{candidato.nome}</h4>
                  <p>{candidato.cidade_origem || 'Cidade não informada'}</p>
                  <button 
                    className="btn-restaurar"
                    onClick={() => restaurarCandidato(candidato)}
                    title="Restaurar candidato"
                  >
                    ↶ Restaurar
                  </button>
                </div>
              </div>
            ))}
            
            {getCandidatosEliminados().length === 0 && (
              <div className="etapa-vazia">
                <p>Nenhum candidato eliminado</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProgressoCandidatos;