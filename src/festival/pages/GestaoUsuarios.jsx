import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import axios from 'axios';
import { toast } from 'react-toastify';

const GestaoUsuarios = () => {
  const { user, token } = useAuth();
  const [usuarios, setUsuarios] = useState([]);
  const [loading, setLoading] = useState(false);
  const [modalAberto, setModalAberto] = useState(false);
  const [usuarioEdicao, setUsuarioEdicao] = useState(null);
  const [filtros, setFiltros] = useState({
    role: '',
    status: '',
    busca: ''
  });

  const [formData, setFormData] = useState({
    nome: '',
    email: '',
    password: '',
    confirmPassword: '',
    role: 'publico',
    status: 'ativo',
    telefone: '',
    observacoes: ''
  });

  // Verificar acesso
  useEffect(() => {
    if (!user || user.role !== 'admin') {
      toast.error('Acesso negado');
      return;
    }
    
    carregarUsuarios();
  }, [user]); // eslint-disable-line react-hooks/exhaustive-deps

  // Carregar usuários
  const carregarUsuarios = async () => {
    setLoading(true);
    try {
      const response = await axios.get('/api/usuarios', {
        headers: { Authorization: `Bearer ${token}` },
        params: filtros
      });
      
      if (response.data.success) {
        setUsuarios(response.data.usuarios);
      }
    } catch (error) {
      console.error('Erro ao carregar usuários:', error);
      toast.error('Erro ao carregar usuários');
    } finally {
      setLoading(false);
    }
  };

  // Aplicar filtros
  const aplicarFiltros = () => {
    carregarUsuarios();
  };

  // Limpar filtros
  const limparFiltros = () => {
    setFiltros({
      role: '',
      status: '',
      busca: ''
    });
  };

  // Abrir modal para novo usuário
  const abrirModalNovo = () => {
    setUsuarioEdicao(null);
    setFormData({
      nome: '',
      email: '',
      password: '',
      confirmPassword: '',
      role: 'publico',
      status: 'ativo',
      telefone: '',
      observacoes: ''
    });
    setModalAberto(true);
  };

  // Abrir modal para editar usuário
  const abrirModalEdicao = (usuario) => {
    setUsuarioEdicao(usuario);
    setFormData({
      nome: usuario.nome || '',
      email: usuario.email || '',
      password: '',
      confirmPassword: '',
      role: usuario.role || 'publico',
      status: usuario.status || 'ativo',
      telefone: usuario.telefone || '',
      observacoes: usuario.observacoes || ''
    });
    setModalAberto(true);
  };

  // Fechar modal
  const fecharModal = () => {
    setModalAberto(false);
    setUsuarioEdicao(null);
  };

  // Handle form change
  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  // Validar formulário
  const validarFormulario = () => {
    if (!formData.nome.trim()) {
      toast.error('Nome é obrigatório');
      return false;
    }
    
    if (!formData.email.trim()) {
      toast.error('Email é obrigatório');
      return false;
    }

    // Validar senha apenas para novos usuários ou se preenchida
    if (!usuarioEdicao && !formData.password) {
      toast.error('Senha é obrigatória para novos usuários');
      return false;
    }

    if (formData.password && formData.password !== formData.confirmPassword) {
      toast.error('Senhas não coincidem');
      return false;
    }

    if (formData.password && formData.password.length < 6) {
      toast.error('Senha deve ter pelo menos 6 caracteres');
      return false;
    }

    return true;
  };

  // Salvar usuário
  const salvarUsuario = async (e) => {
    e.preventDefault();
    
    if (!validarFormulario()) {
      return;
    }

    setLoading(true);
    try {
      const dadosEnvio = { ...formData };
      
      // Remover confirmação de senha
      delete dadosEnvio.confirmPassword;
      
      // Remover senha vazia em edições
      if (usuarioEdicao && !dadosEnvio.password) {
        delete dadosEnvio.password;
      }

      let response;
      
      if (usuarioEdicao) {
        // Editar usuário existente
        response = await axios.put(`/api/usuarios/${usuarioEdicao.id}`, dadosEnvio, {
          headers: { Authorization: `Bearer ${token}` }
        });
      } else {
        // Criar novo usuário
        response = await axios.post('/api/usuarios', dadosEnvio, {
          headers: { Authorization: `Bearer ${token}` }
        });
      }
      
      if (response.data.success) {
        toast.success(`Usuário ${usuarioEdicao ? 'atualizado' : 'criado'} com sucesso!`);
        fecharModal();
        carregarUsuarios();
      } else {
        toast.error(response.data.message);
      }
      
    } catch (error) {
      console.error('Erro ao salvar usuário:', error);
      toast.error('Erro ao salvar usuário');
    } finally {
      setLoading(false);
    }
  };

  // Excluir usuário
  const excluirUsuario = async (usuario) => {
    if (usuario.id === user.id) {
      toast.error('Você não pode excluir a si mesmo');
      return;
    }

    if (!window.confirm(`Tem certeza que deseja excluir ${usuario.nome}?`)) {
      return;
    }

    try {
      const response = await axios.delete(`/api/usuarios/${usuario.id}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      if (response.data.success) {
        toast.success('Usuário excluído com sucesso!');
        carregarUsuarios();
      } else {
        toast.error(response.data.message);
      }
      
    } catch (error) {
      console.error('Erro ao excluir usuário:', error);
      toast.error('Erro ao excluir usuário');
    }
  };

  // Alterar status do usuário
  const alterarStatus = async (usuario, novoStatus) => {
    if (usuario.id === user.id && novoStatus === 'inativo') {
      toast.error('Você não pode desativar a si mesmo');
      return;
    }

    try {
      const response = await axios.patch(`/api/usuarios/${usuario.id}/status`, {
        status: novoStatus
      }, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      if (response.data.success) {
        toast.success(`Status alterado para ${novoStatus}`);
        carregarUsuarios();
      } else {
        toast.error(response.data.message);
      }
      
    } catch (error) {
      console.error('Erro ao alterar status:', error);
      toast.error('Erro ao alterar status');
    }
  };

  // Alterar role do usuário
  const alterarRole = async (usuario, novaRole) => {
    if (usuario.id === user.id && novaRole !== 'admin') {
      toast.error('Você não pode alterar seu próprio nível de acesso');
      return;
    }

    try {
      const response = await axios.patch(`/api/usuarios/${usuario.id}/role`, {
        role: novaRole
      }, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      if (response.data.success) {
        toast.success(`Nível alterado para ${novaRole}`);
        carregarUsuarios();
      } else {
        toast.error(response.data.message);
      }
      
    } catch (error) {
      console.error('Erro ao alterar role:', error);
      toast.error('Erro ao alterar nível de acesso');
    }
  };

  // Resetar senha
  const resetarSenha = async (usuario) => {
    if (!window.confirm(`Resetar senha de ${usuario.nome}? Uma nova senha será enviada por email.`)) {
      return;
    }

    try {
      const response = await axios.post(`/api/usuarios/${usuario.id}/reset-password`, {}, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      if (response.data.success) {
        toast.success('Senha resetada! Nova senha enviada por email.');
      } else {
        toast.error(response.data.message);
      }
      
    } catch (error) {
      console.error('Erro ao resetar senha:', error);
      toast.error('Erro ao resetar senha');
    }
  };

  // Helpers não utilizados removidos para evitar warnings de lint

  // Verificação de acesso
  if (!user || user.role !== 'admin') {
    return (
      <div className="access-denied">
        <h2>Acesso Negado</h2>
        <p>Apenas administradores podem gerenciar usuários.</p>
      </div>
    );
  }

  return (
    <div className="gestao-usuarios">
      <div className="page-header">
        <h1>👥 Gestão de Usuários</h1>
        <button className="btn btn-primary" onClick={abrirModalNovo}>
          ➕ Novo Usuário
        </button>
      </div>

      {/* Filtros */}
      <div className="filtros-usuarios">
        <div className="filtro-grupo">
          <label>Buscar:</label>
          <input
            type="text"
            placeholder="Nome ou email..."
            value={filtros.busca}
            onChange={(e) => setFiltros(prev => ({ ...prev, busca: e.target.value }))}
          />
        </div>

        <div className="filtro-grupo">
          <label>Nível de Acesso:</label>
          <select 
            value={filtros.role}
            onChange={(e) => setFiltros(prev => ({ ...prev, role: e.target.value }))}
          >
            <option value="">Todos os níveis</option>
            <option value="admin">Administrador</option>
            <option value="moderador">Moderador</option>
            <option value="jurado">Jurado</option>
            <option value="publico">Público</option>
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
            <option value="inativo">Inativo</option>
            <option value="bloqueado">Bloqueado</option>
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

      {/* Lista de Usuários */}
      <div className="usuarios-lista">
        {loading ? (
          <div className="loading">Carregando usuários...</div>
        ) : usuarios.length === 0 ? (
          <div className="empty-state">
            <p>Nenhum usuário encontrado</p>
          </div>
        ) : (
          <div className="usuarios-table">
            <div className="table-header">
              <span>Usuário</span>
              <span>Email</span>
              <span>Nível</span>
              <span>Status</span>
              <span>Último Acesso</span>
              <span>Ações</span>
            </div>

            {usuarios.map(usuario => (
              <div key={usuario.id} className="table-row">
                <div className="usuario-info">
                  <strong>{usuario.nome}</strong>
                  {usuario.id === user.id && <span className="badge-self">Você</span>}
                </div>

                <div className="usuario-email">
                  {usuario.email}
                  {usuario.telefone && (
                    <small>{usuario.telefone}</small>
                  )}
                </div>

                <div className="usuario-role">
                  <select 
                    value={usuario.role}
                    onChange={(e) => alterarRole(usuario, e.target.value)}
                    disabled={usuario.id === user.id}
                  >
                    <option value="admin">👑 Admin</option>
                    <option value="moderador">🛡️ Moderador</option>
                    <option value="jurado">👨‍⚖️ Jurado</option>
                    <option value="publico">👤 Público</option>
                  </select>
                </div>

                <div className="usuario-status">
                  <select 
                    value={usuario.status}
                    onChange={(e) => alterarStatus(usuario, e.target.value)}
                    disabled={usuario.id === user.id}
                  >
                    <option value="ativo">✅ Ativo</option>
                    <option value="inativo">❌ Inativo</option>
                    <option value="bloqueado">🚫 Bloqueado</option>
                  </select>
                </div>

                <div className="usuario-acesso">
                  {usuario.ultimo_acesso ? (
                    new Date(usuario.ultimo_acesso).toLocaleDateString()
                  ) : (
                    'Nunca'
                  )}
                </div>

                <div className="usuario-acoes">
                  <button 
                    onClick={() => abrirModalEdicao(usuario)}
                    className="btn btn-sm btn-secondary"
                    title="Editar"
                  >
                    ✏️
                  </button>

                  <button 
                    onClick={() => resetarSenha(usuario)}
                    className="btn btn-sm btn-warning"
                    title="Resetar Senha"
                  >
                    🔑
                  </button>

                  {usuario.id !== user.id && (
                    <button 
                      onClick={() => excluirUsuario(usuario)}
                      className="btn btn-sm btn-danger"
                      title="Excluir"
                    >
                      🗑️
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Modal de Criação/Edição */}
      {modalAberto && (
        <div className="modal-overlay">
          <div className="modal-content modal-medium">
            <div className="modal-header">
              <h2>{usuarioEdicao ? 'Editar Usuário' : 'Novo Usuário'}</h2>
              <button className="modal-close" onClick={fecharModal}>×</button>
            </div>

            <form onSubmit={salvarUsuario} className="modal-body">
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
                  <label>Nível de Acesso</label>
                  <select
                    name="role"
                    value={formData.role}
                    onChange={handleChange}
                  >
                    <option value="publico">👤 Público</option>
                    <option value="jurado">👨‍⚖️ Jurado</option>
                    <option value="moderador">🛡️ Moderador</option>
                    <option value="admin">👑 Administrador</option>
                  </select>
                </div>

                <div className="form-group">
                  <label>Status</label>
                  <select
                    name="status"
                    value={formData.status}
                    onChange={handleChange}
                  >
                    <option value="ativo">✅ Ativo</option>
                    <option value="inativo">❌ Inativo</option>
                    <option value="bloqueado">🚫 Bloqueado</option>
                  </select>
                </div>

                <div className="form-group">
                  <label>
                    {usuarioEdicao ? 'Nova Senha (deixe vazio para manter)' : 'Senha *'}
                  </label>
                  <input
                    type="password"
                    name="password"
                    value={formData.password}
                    onChange={handleChange}
                    required={!usuarioEdicao}
                  />
                </div>

                <div className="form-group">
                  <label>Confirmar Senha</label>
                  <input
                    type="password"
                    name="confirmPassword"
                    value={formData.confirmPassword}
                    onChange={handleChange}
                  />
                </div>

                <div className="form-group full-width">
                  <label>Observações</label>
                  <textarea
                    name="observacoes"
                    value={formData.observacoes}
                    onChange={handleChange}
                    rows="3"
                    placeholder="Observações internas sobre o usuário..."
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
                onClick={salvarUsuario}
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

export default GestaoUsuarios;