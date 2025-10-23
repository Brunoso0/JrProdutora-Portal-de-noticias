import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import axios from 'axios';
import { toast } from 'react-toastify';
import { API_FESTIVAL } from '../../services/api';

const GestaoCandidatos = () => {
  const { user, token } = useAuth();
  const [candidatos, setCandidatos] = useState([]);
  const [etapas, setEtapas] = useState([]);
  const [loading, setLoading] = useState(false);
  const [modalAberto, setModalAberto] = useState(false);
  const [candidatoEdicao, setCandidatoEdicao] = useState(null);
  const [filtros, setFiltros] = useState({
    etapa_id: '',
    status: '',
    busca: ''
  });

  const [formData, setFormData] = useState({
    nome: '',
    email: '',
    telefone: '',
    cidade: '',
    estado: '',
    idade: '',
    categoria: '',
    biografia: '',
    link_video: '',
    link_instagram: '',
    link_youtube: '',
    etapa_id: '',
    status: 'ativo'
  });

  // Verificar acesso
  useEffect(() => {
    if (!user || user.role !== 'admin') {
      toast.error('Acesso negado');
      return;
    }
    
    carregarDados();
  }, [user]); // eslint-disable-line react-hooks/exhaustive-deps

  // Carregar dados iniciais
  const carregarDados = async () => {
    await Promise.all([
      carregarCandidatos(),
      carregarEtapas()
    ]);
  };

  // Carregar candidatos
  const carregarCandidatos = async () => {
    setLoading(true);
    try {
      const response = await axios.get('/api/candidatos', {
        headers: { Authorization: `Bearer ${token}` },
        params: filtros
      });
      
      if (response.data.success) {
        setCandidatos(response.data.candidatos);
      }
    } catch (error) {
      console.error('Erro ao carregar candidatos:', error);
      toast.error('Erro ao carregar candidatos');
    } finally {
      setLoading(false);
    }
  };

  // Carregar etapas
  const carregarEtapas = async () => {
    try {
      const response = await axios.get(`${API_FESTIVAL}/api/etapas/listar`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      if (response.data.success) {
        setEtapas(response.data.etapas);
      }
    } catch (error) {
      console.error('Erro ao carregar etapas:', error);
    }
  };

  // Aplicar filtros
  const aplicarFiltros = () => {
    carregarCandidatos();
  };

  // Limpar filtros
  const limparFiltros = () => {
    setFiltros({
      etapa_id: '',
      status: '',
      busca: ''
    });
  };

  // Abrir modal para novo candidato
  const abrirModalNovo = () => {
    setCandidatoEdicao(null);
    setFormData({
      nome: '',
      email: '',
      telefone: '',
      cidade: '',
      estado: '',
      idade: '',
      categoria: '',
      biografia: '',
      link_video: '',
      link_instagram: '',
      link_youtube: '',
      etapa_id: '',
      status: 'ativo'
    });
    setModalAberto(true);
  };

  // Abrir modal para editar candidato
  const abrirModalEdicao = (candidato) => {
    setCandidatoEdicao(candidato);
    setFormData({
      nome: candidato.nome || '',
      email: candidato.email || '',
      telefone: candidato.telefone || '',
      cidade: candidato.cidade || '',
      estado: candidato.estado || '',
      idade: candidato.idade || '',
      categoria: candidato.categoria || '',
      biografia: candidato.biografia || '',
      link_video: candidato.link_video || '',
      link_instagram: candidato.link_instagram || '',
      link_youtube: candidato.link_youtube || '',
      etapa_id: candidato.etapa_atual || '',
      status: candidato.status || 'ativo'
    });
    setModalAberto(true);
  };

  // Fechar modal
  const fecharModal = () => {
    setModalAberto(false);
    setCandidatoEdicao(null);
  };

  // Handle form change
  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  // Salvar candidato
  const salvarCandidato = async (e) => {
    e.preventDefault();
    
    // Validações básicas
    if (!formData.nome.trim()) {
      toast.error('Nome é obrigatório');
      return;
    }
    
    if (!formData.email.trim()) {
      toast.error('Email é obrigatório');
      return;
    }

    setLoading(true);
    try {
      let response;
      
      if (candidatoEdicao) {
        // Editar candidato existente
        response = await axios.put(`/api/candidatos/${candidatoEdicao.id}`, formData, {
          headers: { Authorization: `Bearer ${token}` }
        });
      } else {
        // Criar novo candidato
        response = await axios.post('/api/candidatos', formData, {
          headers: { Authorization: `Bearer ${token}` }
        });
      }
      
      if (response.data.success) {
        toast.success(`Candidato ${candidatoEdicao ? 'atualizado' : 'criado'} com sucesso!`);
        fecharModal();
        carregarCandidatos();
      } else {
        toast.error(response.data.message);
      }
      
    } catch (error) {
      console.error('Erro ao salvar candidato:', error);
      toast.error('Erro ao salvar candidato');
    } finally {
      setLoading(false);
    }
  };

  // Excluir candidato
  const excluirCandidato = async (candidato) => {
    if (!window.confirm(`Tem certeza que deseja excluir ${candidato.nome}?`)) {
      return;
    }

    try {
      const response = await axios.delete(`/api/candidatos/${candidato.id}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      if (response.data.success) {
        toast.success('Candidato excluído com sucesso!');
        carregarCandidatos();
      } else {
        toast.error(response.data.message);
      }
      
    } catch (error) {
      console.error('Erro ao excluir candidato:', error);
      toast.error('Erro ao excluir candidato');
    }
  };

  // Alterar status do candidato
  const alterarStatus = async (candidato, novoStatus) => {
    try {
      const response = await axios.patch(`/api/candidatos/${candidato.id}/status`, {
        status: novoStatus
      }, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      if (response.data.success) {
        toast.success(`Status alterado para ${novoStatus}`);
        carregarCandidatos();
      } else {
        toast.error(response.data.message);
      }
      
    } catch (error) {
      console.error('Erro ao alterar status:', error);
      toast.error('Erro ao alterar status');
    }
  };

  // Verificação de acesso
  if (!user || user.role !== 'admin') {
    return (
      <div className="access-denied">
        <h2>Acesso Negado</h2>
        <p>Apenas administradores podem gerenciar candidatos.</p>
      </div>
    );
  }

  return (
    <div className="gestao-candidatos">
      <div className="page-header">
        <h1>👤 Gestão de Candidatos</h1>
        <button className="btn btn-primary" onClick={abrirModalNovo}>
          ➕ Novo Candidato
        </button>
      </div>

      {/* Filtros */}
      <div className="filtros-candidatos">
        <div className="filtro-grupo">
          <label>Buscar:</label>
          <input
            type="text"
            placeholder="Nome, email ou cidade..."
            value={filtros.busca}
            onChange={(e) => setFiltros(prev => ({ ...prev, busca: e.target.value }))}
          />
        </div>

        <div className="filtro-grupo">
          <label>Etapa:</label>
          <select 
            value={filtros.etapa_id}
            onChange={(e) => setFiltros(prev => ({ ...prev, etapa_id: e.target.value }))}
          >
            <option value="">Todas as etapas</option>
            {etapas.map(etapa => (
              <option key={etapa.id} value={etapa.id}>{etapa.nome}</option>
            ))}
          </select>
        </div>

        <div className="filtro-grupo">
          <label>Status:</label>
          <select 
            value={filtros.status}
            onChange={(e) => setFiltros(prev => ({ ...prev, status: e.target.value }))}
          >
            <option value="">Todos os status</option>
            <option value="ativo">Ativo</option>
            <option value="eliminado">Eliminado</option>
            <option value="desclassificado">Desclassificado</option>
          </select>
        </div>

        <div className="filtros-acoes">
          <button onClick={aplicarFiltros} className="btn btn-primary btn-sm">
            🔍 Filtrar
          </button>
          <button onClick={limparFiltros} className="btn btn-secondary btn-sm">
            🗑️ Limpar
          </button>
        </div>
      </div>

      {/* Lista de Candidatos */}
      <div className="candidatos-lista">
        {loading ? (
          <div className="loading">Carregando candidatos...</div>
        ) : candidatos.length === 0 ? (
          <div className="empty-state">
            <p>Nenhum candidato encontrado</p>
          </div>
        ) : (
          <div className="candidatos-grid">
            {candidatos.map(candidato => (
              <div key={candidato.id} className="candidato-card">
                <div className="candidato-header">
                  <h3>{candidato.nome}</h3>
                  <span className={`status status-${candidato.status}`}>
                    {candidato.status}
                  </span>
                </div>

                <div className="candidato-info">
                  <p><strong>Email:</strong> {candidato.email}</p>
                  <p><strong>Cidade:</strong> {candidato.cidade}, {candidato.estado}</p>
                  <p><strong>Categoria:</strong> {candidato.categoria}</p>
                  <p><strong>Etapa Atual:</strong> {candidato.etapa_nome}</p>
                  {candidato.telefone && (
                    <p><strong>Telefone:</strong> {candidato.telefone}</p>
                  )}
                </div>

                <div className="candidato-links">
                  {candidato.link_video && (
                    <a href={candidato.link_video} target="_blank" rel="noopener noreferrer">
                      🎥 Vídeo
                    </a>
                  )}
                  {candidato.link_instagram && (
                    <a href={candidato.link_instagram} target="_blank" rel="noopener noreferrer">
                      📷 Instagram
                    </a>
                  )}
                  {candidato.link_youtube && (
                    <a href={candidato.link_youtube} target="_blank" rel="noopener noreferrer">
                      ▶️ YouTube
                    </a>
                  )}
                </div>

                <div className="candidato-acoes">
                  <button 
                    onClick={() => abrirModalEdicao(candidato)}
                    className="btn btn-sm btn-secondary"
                  >
                    ✏️ Editar
                  </button>

                  <div className="status-dropdown">
                    <select 
                      value={candidato.status}
                      onChange={(e) => alterarStatus(candidato, e.target.value)}
                    >
                      <option value="ativo">Ativo</option>
                      <option value="eliminado">Eliminado</option>
                      <option value="desclassificado">Desclassificado</option>
                    </select>
                  </div>

                  <button 
                    onClick={() => excluirCandidato(candidato)}
                    className="btn btn-sm btn-danger"
                  >
                    🗑️ Excluir
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Modal de Criação/Edição */}
      {modalAberto && (
        <div className="modal-overlay">
          <div className="modal-content modal-large">
            <div className="modal-header">
              <h2>{candidatoEdicao ? 'Editar Candidato' : 'Novo Candidato'}</h2>
              <button className="modal-close" onClick={fecharModal}>×</button>
            </div>

            <form onSubmit={salvarCandidato} className="modal-body">
              <div className="form-grid">
                <div className="form-group">
                  <label>Nome *</label>
                  <input
                    type="text"
                    name="nome"
                    value={formData.nome}
                    onChange={handleChange}
                    required
                  />
                </div>

                <div className="form-group">
                  <label>Email *</label>
                  <input
                    type="email"
                    name="email"
                    value={formData.email}
                    onChange={handleChange}
                    required
                  />
                </div>

                <div className="form-group">
                  <label>Telefone</label>
                  <input
                    type="text"
                    name="telefone"
                    value={formData.telefone}
                    onChange={handleChange}
                  />
                </div>

                <div className="form-group">
                  <label>Idade</label>
                  <input
                    type="number"
                    name="idade"
                    value={formData.idade}
                    onChange={handleChange}
                  />
                </div>

                <div className="form-group">
                  <label>Cidade</label>
                  <input
                    type="text"
                    name="cidade"
                    value={formData.cidade}
                    onChange={handleChange}
                  />
                </div>

                <div className="form-group">
                  <label>Estado</label>
                  <input
                    type="text"
                    name="estado"
                    value={formData.estado}
                    onChange={handleChange}
                  />
                </div>

                <div className="form-group">
                  <label>Categoria</label>
                  <select
                    name="categoria"
                    value={formData.categoria}
                    onChange={handleChange}
                  >
                    <option value="">Selecione...</option>
                    <option value="vocal">Vocal</option>
                    <option value="instrumental">Instrumental</option>
                    <option value="grupo">Grupo</option>
                    <option value="danca">Dança</option>
                  </select>
                </div>

                <div className="form-group">
                  <label>Etapa Atual</label>
                  <select
                    name="etapa_id"
                    value={formData.etapa_id}
                    onChange={handleChange}
                  >
                    <option value="">Selecione...</option>
                    {etapas.map(etapa => (
                      <option key={etapa.id} value={etapa.id}>{etapa.nome}</option>
                    ))}
                  </select>
                </div>

                <div className="form-group">
                  <label>Status</label>
                  <select
                    name="status"
                    value={formData.status}
                    onChange={handleChange}
                  >
                    <option value="ativo">Ativo</option>
                    <option value="eliminado">Eliminado</option>
                    <option value="desclassificado">Desclassificado</option>
                  </select>
                </div>

                <div className="form-group full-width">
                  <label>Biografia</label>
                  <textarea
                    name="biografia"
                    value={formData.biografia}
                    onChange={handleChange}
                    rows="4"
                  />
                </div>

                <div className="form-group">
                  <label>Link do Vídeo</label>
                  <input
                    type="url"
                    name="link_video"
                    value={formData.link_video}
                    onChange={handleChange}
                  />
                </div>

                <div className="form-group">
                  <label>Instagram</label>
                  <input
                    type="url"
                    name="link_instagram"
                    value={formData.link_instagram}
                    onChange={handleChange}
                  />
                </div>

                <div className="form-group">
                  <label>YouTube</label>
                  <input
                    type="url"
                    name="link_youtube"
                    value={formData.link_youtube}
                    onChange={handleChange}
                  />
                </div>
              </div>
            </form>

            <div className="modal-footer">
              <button 
                type="button" 
                className="btn btn-secondary"
                onClick={fecharModal}
                disabled={loading}
              >
                Cancelar
              </button>
              <button 
                type="submit" 
                className="btn btn-primary"
                onClick={salvarCandidato}
                disabled={loading}
              >
                {loading ? 'Salvando...' : 'Salvar'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default GestaoCandidatos;