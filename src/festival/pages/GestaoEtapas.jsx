import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { API_FESTIVAL } from '../../services/api';
import { useAuth } from '../context/AuthContext';
import { toast } from 'react-toastify';

const GestaoEtapas = () => {
  const { role } = useAuth();
  const [etapas, setEtapas] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modalAberto, setModalAberto] = useState(false);
  const [etapaEditando, setEtapaEditando] = useState(null);
  const [formData, setFormData] = useState({
    nome: '',
    descricao: '',
    ordem: '',
    ativa: true
  });

  // Carregar etapas
  const carregarEtapas = async () => {
    try {
      setLoading(true);
      const response = await axios.get(`${API_FESTIVAL}/api/etapas/listar`);
      setEtapas(response.data.sort((a, b) => a.id - b.id));
    } catch (error) {
      console.error('Erro ao carregar etapas:', error);
      toast.error('Erro ao carregar etapas');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    carregarEtapas();
  }, []);

  // Abrir modal para criar nova etapa
  const abrirModalCriar = () => {
    setEtapaEditando(null);
    setFormData({
      nome: '',
      descricao: '',
      ordem: etapas.length + 1,
      ativa: true
    });
    setModalAberto(true);
  };

  // Abrir modal para editar etapa
  const abrirModalEditar = (etapa) => {
    setEtapaEditando(etapa);
    setFormData({
      nome: etapa.nome,
      descricao: etapa.descricao || '',
      ordem: etapa.ordem,
      ativa: etapa.ativa
    });
    setModalAberto(true);
  };

  // Fechar modal
  const fecharModal = () => {
    setModalAberto(false);
    setEtapaEditando(null);
    setFormData({
      nome: '',
      descricao: '',
      ordem: '',
      ativa: true
    });
  };

  // Salvar etapa (criar ou editar)
  const salvarEtapa = async (e) => {
    e.preventDefault();
    
    if (!formData.nome.trim()) {
      toast.error('Nome da etapa é obrigatório');
      return;
    }

    try {
      if (etapaEditando) {
        // Editar etapa existente
        await axios.put(`${API_FESTIVAL}/api/etapas/${etapaEditando.id}/atualizar`, formData);
        toast.success('Etapa atualizada com sucesso!');
      } else {
        // Criar nova etapa
        await axios.post(`${API_FESTIVAL}/api/etapas/criar`, formData);
        toast.success('Etapa criada com sucesso!');
      }
      
      fecharModal();
      carregarEtapas();
    } catch (error) {
      console.error('Erro ao salvar etapa:', error);
      toast.error(error.response?.data?.message || 'Erro ao salvar etapa');
    }
  };

  // Excluir etapa
  const excluirEtapa = async (etapa) => {
    if (!window.confirm(`Tem certeza que deseja excluir a etapa "${etapa.nome}"?`)) {
      return;
    }

    try {
      await axios.delete(`${API_FESTIVAL}/api/etapas/${etapa.id}`);
      toast.success('Etapa excluída com sucesso!');
      carregarEtapas();
    } catch (error) {
      console.error('Erro ao excluir etapa:', error);
      toast.error(error.response?.data?.message || 'Erro ao excluir etapa');
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
        <p>Carregando etapas...</p>
      </div>
    );
  }

  return (
    <div className="gestao-etapas">
      <div className="header">
        <h1>Gestão de Etapas</h1>
        <button 
          className="btn btn-primary"
          onClick={abrirModalCriar}
        >
          + Nova Etapa
        </button>
      </div>

      <div className="etapas-lista">
        {etapas.length === 0 ? (
          <div className="empty-state">
            <p>Nenhuma etapa encontrada</p>
            <button 
              className="btn btn-primary"
              onClick={abrirModalCriar}
            >
              Criar primeira etapa
            </button>
          </div>
        ) : (
          <div className="cards-grid">
            {etapas.map((etapa) => (
              <div key={etapa.id} className="etapa-card">
                <div className="card-header">
                  <h3>{etapa.nome}</h3>
                  <div className="status">
                    <span className={`status-badge ${etapa.ativa ? 'ativa' : 'inativa'}`}>
                      {etapa.ativa ? 'Ativa' : 'Inativa'}
                    </span>
                  </div>
                </div>
                
                <div className="card-body">
                  <p className="descricao">{etapa.descricao || 'Sem descrição'}</p>
                  <p className="ordem">Ordem: {etapa.ordem}</p>
                  
                  {etapa.total_candidatos && (
                    <p className="candidatos">
                      {etapa.total_candidatos} candidato(s)
                    </p>
                  )}
                </div>
                
                <div className="card-actions">
                  <button 
                    className="btn btn-secondary"
                    onClick={() => abrirModalEditar(etapa)}
                  >
                    Editar
                  </button>
                  <button 
                    className="btn btn-danger"
                    onClick={() => excluirEtapa(etapa)}
                  >
                    Excluir
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Modal */}
      {modalAberto && (
        <div className="modal-overlay">
          <div className="modal-content">
            <div className="modal-header">
              <h2>{etapaEditando ? 'Editar Etapa' : 'Nova Etapa'}</h2>
              <button 
                className="modal-close"
                onClick={fecharModal}
              >
                ×
              </button>
            </div>
            
            <form onSubmit={salvarEtapa}>
              <div className="modal-body">
                <div className="form-group">
                  <label htmlFor="nome">Nome da Etapa:</label>
                  <input
                    type="text"
                    id="nome"
                    value={formData.nome}
                    onChange={(e) => setFormData({...formData, nome: e.target.value})}
                    placeholder="Ex: Classificatória, Semifinal, Final"
                    required
                  />
                </div>
                
                <div className="form-group">
                  <label htmlFor="descricao">Descrição:</label>
                  <textarea
                    id="descricao"
                    value={formData.descricao}
                    onChange={(e) => setFormData({...formData, descricao: e.target.value})}
                    placeholder="Descrição opcional da etapa"
                    rows="3"
                  />
                </div>
                
                <div className="form-row">
                  <div className="form-group">
                    <label htmlFor="ordem">Ordem:</label>
                    <input
                      type="number"
                      id="ordem"
                      value={formData.ordem}
                      onChange={(e) => setFormData({...formData, ordem: parseInt(e.target.value)})}
                      min="1"
                      required
                    />
                  </div>
                  
                  <div className="form-group">
                    <label className="checkbox-label">
                      <input
                        type="checkbox"
                        checked={formData.ativa}
                        onChange={(e) => setFormData({...formData, ativa: e.target.checked})}
                      />
                      Etapa ativa
                    </label>
                  </div>
                </div>
              </div>
              
              <div className="modal-footer">
                <button 
                  type="button" 
                  className="btn btn-secondary"
                  onClick={fecharModal}
                >
                  Cancelar
                </button>
                <button 
                  type="submit" 
                  className="btn btn-primary"
                >
                  {etapaEditando ? 'Salvar Alterações' : 'Criar Etapa'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default GestaoEtapas;