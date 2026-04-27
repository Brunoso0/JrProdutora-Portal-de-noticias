import React, { useCallback, useEffect, useMemo, useState } from 'react';
import axios from 'axios';
import { Search, RefreshCw, Trash2, Eye, Pencil, X } from 'lucide-react';
import { API_FESTIVAL } from '../../services/api';
import '../styles/JuradosAdmin.css';

const EMPTY_FORM = {
  name: '',
  email: '',
  profile_photo_url: '',
  password: ''
};

const JuradosAdmin = () => {
  const [judges, setJudges] = useState([]);
  const [selectedJudgeId, setSelectedJudgeId] = useState(null);
  const [detailMode, setDetailMode] = useState(null); // view | edit | delete | null
  const [form, setForm] = useState(EMPTY_FORM);

  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [pagination, setPagination] = useState({ page: 1, limit: 20, total: 0 });

  const [isLoadingList, setIsLoadingList] = useState(false);
  const [isLoadingDetail, setIsLoadingDetail] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isUploadingPhoto, setIsUploadingPhoto] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');
  const [isCreating, setIsCreating] = useState(false);

  const apiBase = API_FESTIVAL || process.env.API_FESTIVAL || '';

  const getToken = useCallback(() => {
    return (
      localStorage.getItem('festivalAdminToken') ||
      localStorage.getItem('token') ||
      localStorage.getItem('authToken') ||
      ''
    );
  }, []);

  const apiRequest = useCallback(
    async (method, path, data, params) => {
      const token = getToken();
      if (!token) {
        throw new Error('Token de admin não encontrado. Faça login novamente.');
      }
      if (!apiBase) {
        throw new Error('A variável de ambiente API_FESTIVAL não está configurada.');
      }

      return axios({
        method,
        url: `${apiBase}${path}`,
        data,
        params,
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });
    },
    [apiBase, getToken]
  );

  const listQuery = useMemo(
    () => ({
      page,
      limit: 20,
      q: search || undefined,
    }),
    [page, search]
  );

  const loadJudges = useCallback(async () => {
    setIsLoadingList(true);
    setErrorMsg('');

    try {
      const response = await apiRequest('get', '/api/admin/judges', undefined, listQuery);
      const nextJudges = response?.data?.judges || response?.data?.data || [];
      const nextPagination = response?.data?.pagination || { page: 1, limit: 20, total: 0 };

      setJudges(nextJudges);
      setPagination(nextPagination);

      if (selectedJudgeId && !nextJudges.some((item) => Number(item.id) === Number(selectedJudgeId))) {
        setSelectedJudgeId(null);
        setDetailMode(null);
        setForm(EMPTY_FORM);
      }
    } catch (error) {
      const errorMessage = error?.response?.data?.message || error.message || 'Erro ao carregar jurados.';
      setErrorMsg(errorMessage);
    } finally {
      setIsLoadingList(false);
    }
  }, [apiRequest, listQuery, selectedJudgeId]);

  const loadJudgeDetail = useCallback(
    async (judgeId) => {
      if (!judgeId) {
        setForm(EMPTY_FORM);
        return;
      }

      setIsLoadingDetail(true);
      setErrorMsg('');

      try {
        const response = await apiRequest('get', `/api/admin/judges/${judgeId}`);
        const judge = response?.data?.judge || null;

        setForm({
          name: judge?.name || '',
          email: judge?.email || '',
          profile_photo_url: judge?.profile_photo_url || '',
          password: '',
        });
      } catch (error) {
        setForm(EMPTY_FORM);
        const errorMessage = error?.response?.data?.message || error.message || 'Erro ao carregar detalhes do jurado.';
        setErrorMsg(errorMessage);
      } finally {
        setIsLoadingDetail(false);
      }
    },
    [apiRequest]
  );

  const handleSave = useCallback(async () => {
    if (!selectedJudgeId) {
      setErrorMsg('Nenhum jurado selecionado');
      return;
    }

    if (!form.name || !form.email) {
      setErrorMsg('Nome e email são obrigatórios');
      return;
    }

    setIsSaving(true);
    setErrorMsg('');
    setSuccessMsg('');

    try {
      const payload = {
        name: form.name.trim(),
        email: form.email.trim(),
        profile_photo_url: form.profile_photo_url.trim() || null,
        password: form.password || undefined,
      };

      await apiRequest('patch', `/api/admin/judges/${selectedJudgeId}`, payload);
      setSuccessMsg('Jurado atualizado com sucesso!');
      setDetailMode(null);
      setSelectedJudgeId(null);
      setForm(EMPTY_FORM);
      
      setTimeout(() => {
        loadJudges();
        setSuccessMsg('');
      }, 500);
    } catch (error) {
      const errorMessage = error?.response?.data?.message || error.message || 'Erro ao salvar jurado.';
      setErrorMsg(errorMessage);
    } finally {
      setIsSaving(false);
    }
  }, [selectedJudgeId, form, apiRequest, loadJudges]);

  const handleDeleteById = useCallback(async () => {
    if (!selectedJudgeId) {
      setErrorMsg('Nenhum jurado selecionado');
      return;
    }

    setIsDeleting(true);
    setErrorMsg('');
    setSuccessMsg('');

    try {
      await apiRequest('delete', `/api/admin/judges/${selectedJudgeId}`);
      setSuccessMsg('Jurado deletado com sucesso!');
      setDetailMode(null);
      setSelectedJudgeId(null);
      setForm(EMPTY_FORM);
      
      setTimeout(() => {
        loadJudges();
        setSuccessMsg('');
      }, 500);
    } catch (error) {
      const errorMessage = error?.response?.data?.message || error.message || 'Erro ao deletar jurado.';
      setErrorMsg(errorMessage);
    } finally {
      setIsDeleting(false);
    }
  }, [selectedJudgeId, apiRequest, loadJudges]);

  const handlePhotoUpload = useCallback(
    async (event) => {
      const file = event.target.files?.[0];
      if (!file) return;

      if (!apiBase) {
        setErrorMsg('A variável de ambiente API_FESTIVAL não está configurada.');
        return;
      }

      const formData = new FormData();
      formData.append('file', file);

      setIsUploadingPhoto(true);
      setErrorMsg('');

      try {
        const token = getToken();
        const response = await axios.post(`${apiBase}/api/uploads/imagens`, formData, {
          headers: {
            Authorization: token ? `Bearer ${token}` : undefined,
            'Content-Type': 'multipart/form-data',
          },
        });

        const uploadedRef =
          response?.data?.fileReference ||
          response?.data?.references?.[0] ||
          '';

        if (!uploadedRef) {
          throw new Error('Nao foi possivel obter a URL da imagem enviada.');
        }

        const normalized = String(uploadedRef).startsWith('http')
          ? uploadedRef
          : `${apiBase}${String(uploadedRef).startsWith('/') ? '' : '/'}${uploadedRef}`;

        setForm((prev) => ({ ...prev, profile_photo_url: normalized }));
        setSuccessMsg('Foto enviada com sucesso!');
      } catch (error) {
        const errorMessage = error?.response?.data?.message || error.message || 'Erro ao enviar imagem.';
        setErrorMsg(errorMessage);
      } finally {
        setIsUploadingPhoto(false);
        event.target.value = '';
      }
    },
    [apiBase, getToken]
  );

  useEffect(() => {
    loadJudges();
  }, [loadJudges]);

  const openViewModal = (judgeId) => {
    setSelectedJudgeId(judgeId);
    setDetailMode('view');
    loadJudgeDetail(judgeId);
  };

  const openCreateModal = () => {
    setSelectedJudgeId(null);
    setForm({ ...EMPTY_FORM });
    setDetailMode('create');
  };

  const openEditModal = (judgeId) => {
    setSelectedJudgeId(judgeId);
    setDetailMode('edit');
    loadJudgeDetail(judgeId);
  };

  const openDeleteModal = (judgeId) => {
    setSelectedJudgeId(judgeId);
    setDetailMode('delete');
  };

  const closeModal = () => {
    setDetailMode(null);
    setSelectedJudgeId(null);
    setForm(EMPTY_FORM);
    setErrorMsg('');
  };

  if (isLoadingList) {
    return (
      <div className="jurados-container">
        <div className="jurados-loading">Carregando jurados...</div>
      </div>
    );
  }

  return (
    <div className="jurados-container">
      {errorMsg && (
        <div className="jurados-alert alert-error">
          {errorMsg}
          <button onClick={() => setErrorMsg('')} className="close-alert">×</button>
        </div>
      )}

      {successMsg && (
        <div className="jurados-alert alert-success">
          {successMsg}
        </div>
      )}

      {/* Header */}
      <div className="jurados-header">
        <h1>Gerenciamento de Jurados</h1>
        <div style={{ display: 'flex', gap: '0.75rem' }}>
          <button className="jurados-add-btn" onClick={openCreateModal}>
            Adicionar Jurado
          </button>
          <button className="jurados-refresh-btn" onClick={loadJudges}>
            <RefreshCw size={18} />
            Atualizar
          </button>
        </div>
      </div>

      {/* Filters */}
      <div className="jurados-filters">
        <div className="filter-group">
          <input
            type="text"
            placeholder="Buscar por nome ou email..."
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setPage(1);
            }}
            className="filter-input"
          />
          <Search size={18} className="filter-icon" />
        </div>
      </div>

      {/* Table */}
      <div className="jurados-table-wrapper">
        <table className="jurados-table">
          <thead>
            <tr>
              <th>Foto</th>
              <th>Nome</th>
              <th>Email</th>
              <th>Ações</th>
            </tr>
          </thead>
          <tbody>
            {judges.length > 0 ? (
              judges.map((judge) => (
                <tr key={judge.id}>
                  <td className="photo-cell">
                    {judge.profile_photo_url ? (
                      <img src={judge.profile_photo_url} alt={judge.name} className="judge-photo" />
                    ) : (
                      <div className="judge-photo-placeholder">-</div>
                    )}
                  </td>
                  <td>{judge.name}</td>
                  <td>{judge.email}</td>
                  <td className="acoes-cell">
                    <button
                      className="acao-btn acao-ver"
                      onClick={() => openViewModal(judge.id)}
                      title="Ver"
                    >
                      <Eye size={16} />
                    </button>
                    <button
                      className="acao-btn acao-editar"
                      onClick={() => openEditModal(judge.id)}
                      title="Editar"
                    >
                      <Pencil size={16} />
                    </button>
                    <button
                      className="acao-btn acao-excluir"
                      onClick={() => openDeleteModal(judge.id)}
                      title="Excluir"
                    >
                      <Trash2 size={16} />
                    </button>
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan="4" className="empty-message">
                  Nenhum jurado encontrado
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      <div className="jurados-pagination">
        <button
          onClick={() => setPage(Math.max(1, page - 1))}
          disabled={page <= 1}
          className="pagination-btn"
        >
          Anterior
        </button>
        <span className="pagination-info">
          Página {pagination.page} de {Math.ceil(pagination.total / pagination.limit) || 1}
        </span>
        <button
          onClick={() => setPage(page + 1)}
          disabled={pagination.page * pagination.limit >= pagination.total}
          className="pagination-btn"
        >
          Próxima
        </button>
      </div>

      {/* Modal - Ver */}
      {detailMode === 'view' && (
        <div className="jurados-modal-overlay" onClick={closeModal}>
          <div className="jurados-modal-card jurados-modal-card-delete" onClick={(e) => e.stopPropagation()}>
            <div className="jurados-modal-header">
              <h2>Detalhes do Jurado</h2>
              <button className="jurados-modal-close" onClick={closeModal}>
                <X size={24} />
              </button>
            </div>

            {isLoadingDetail ? (
              <div className="jurados-modal-loading">Carregando...</div>
            ) : (
              <div className="jurados-modal-content">
                <div className="jurados-form">
                  <div className="form-group">
                    <label>Nome</label>
                    <p className="form-value">{form.name}</p>
                  </div>
                  <div className="form-group">
                    <label>Email</label>
                    <p className="form-value">{form.email}</p>
                  </div>
                  <div className="form-group form-group-full">
                    <label>Senha</label>
                    <p className="form-value">********</p>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Modal - Editar */}
      {detailMode === 'edit' && (
        <div className="jurados-modal-overlay" onClick={closeModal}>
          <div className="jurados-modal-card" onClick={(e) => e.stopPropagation()}>
            <div className="jurados-modal-header">
              <h2>Editar Jurado</h2>
              <button className="jurados-modal-close" onClick={closeModal}>
                <X size={24} />
              </button>
            </div>

            {isLoadingDetail ? (
              <div className="jurados-modal-loading">Carregando...</div>
            ) : (
              <div className="jurados-modal-content">
                <div className="jurados-form">
                  <div className="form-group">
                    <label>Nome *</label>
                    <input
                      type="text"
                      value={form.name}
                      onChange={(e) => setForm({ ...form, name: e.target.value })}
                      className="form-input"
                      placeholder="Nome completo"
                    />
                  </div>
                  <div className="form-group">
                    <label>Email *</label>
                    <input
                      type="email"
                      value={form.email}
                      onChange={(e) => setForm({ ...form, email: e.target.value })}
                      className="form-input"
                      placeholder="email@example.com"
                    />
                  </div>
                  <div className="form-group form-group-full">
                    <label>Foto do perfil</label>
                    <input
                      type="text"
                      value={form.profile_photo_url}
                      onChange={(e) => setForm({ ...form, profile_photo_url: e.target.value })}
                      className="form-input"
                      placeholder="URL da imagem do perfil"
                    />
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handlePhotoUpload}
                      className="form-input"
                    />
                    {isUploadingPhoto && <p className="form-value">Enviando imagem...</p>}
                    {form.profile_photo_url ? (
                      <img src={form.profile_photo_url} alt="Preview" className="judge-photo-preview" />
                    ) : null}
                  </div>
                  <div className="form-group form-group-full">
                    <label>Nova senha</label>
                    <input
                      type="password"
                      value={form.password}
                      onChange={(e) => setForm({ ...form, password: e.target.value })}
                      className="form-input"
                      placeholder="Deixe em branco para manter a atual"
                    />
                  </div>
                </div>

                <div className="jurados-modal-footer">
                  <button className="jurados-btn jurados-btn-secondary" onClick={closeModal}>
                    Cancelar
                  </button>
                  <button
                    className="jurados-btn jurados-btn-primary"
                    onClick={handleSave}
                    disabled={isSaving}
                  >
                    {isSaving ? 'Salvando...' : 'Salvar'}
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Modal - Criar */}
      {detailMode === 'create' && (
        <div className="jurados-modal-overlay" onClick={closeModal}>
          <div className="jurados-modal-card" onClick={(e) => e.stopPropagation()}>
            <div className="jurados-modal-header">
              <h2>Cadastrar Jurado</h2>
              <button className="jurados-modal-close" onClick={closeModal}>
                <X size={24} />
              </button>
            </div>

            <div className="jurados-modal-content">
              <div className="jurados-form">
                <div className="form-group">
                  <label>Nome *</label>
                  <input
                    type="text"
                    value={form.name}
                    onChange={(e) => setForm({ ...form, name: e.target.value })}
                    className="form-input"
                    placeholder="Nome completo"
                  />
                </div>
                <div className="form-group">
                  <label>Email *</label>
                  <input
                    type="email"
                    value={form.email}
                    onChange={(e) => setForm({ ...form, email: e.target.value })}
                    className="form-input"
                    placeholder="email@example.com"
                  />
                </div>
                <div className="form-group form-group-full">
                  <label>Senha *</label>
                  <input
                    type="password"
                    value={form.password}
                    onChange={(e) => setForm({ ...form, password: e.target.value })}
                    className="form-input"
                    placeholder="Senha de acesso"
                  />
                </div>
              </div>

              <div className="jurados-modal-footer">
                <button className="jurados-btn jurados-btn-secondary" onClick={closeModal}>
                  Cancelar
                </button>
                <button
                  className="jurados-btn jurados-btn-primary"
                  onClick={async () => {
                    setIsCreating(true);
                    setErrorMsg('');
                    try {
                      if (!form.name || !form.email || !form.password) {
                        setErrorMsg('Nome, email e senha são obrigatórios');
                        setIsCreating(false);
                        return;
                      }

                      const payload = {
                        name: form.name.trim(),
                        email: form.email.trim(),
                        password: form.password,
                      };

                      await apiRequest('post', '/api/admin/judges', payload);
                      setSuccessMsg('Jurado criado com sucesso!');
                      closeModal();
                      setTimeout(() => {
                        loadJudges();
                        setSuccessMsg('');
                      }, 500);
                    } catch (error) {
                      const errorMessage = error?.response?.data?.message || error.message || 'Erro ao criar jurado.';
                      setErrorMsg(errorMessage);
                    } finally {
                      setIsCreating(false);
                    }
                  }}
                  disabled={isCreating}
                >
                  {isCreating ? 'Criando...' : 'Criar Jurado'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Modal - Deletar */}
      {detailMode === 'delete' && (
        <div className="jurados-modal-overlay" onClick={closeModal}>
          <div className="jurados-modal-card jurados-modal-card-delete" onClick={(e) => e.stopPropagation()}>
            <div className="jurados-modal-header">
              <h2>Confirmar Exclusão</h2>
              <button className="jurados-modal-close" onClick={closeModal}>
                <X size={24} />
              </button>
            </div>

            <div className="jurados-modal-content">
              <p className="delete-message">
                Tem certeza que deseja deletar este jurado?<br />
                <strong>{form.name}</strong>
              </p>
              <p className="delete-warning">Esta ação não pode ser desfeita.</p>
            </div>

            <div className="jurados-modal-footer">
              <button className="jurados-btn jurados-btn-secondary" onClick={closeModal}>
                Cancelar
              </button>
              <button
                className="jurados-btn jurados-btn-danger"
                onClick={handleDeleteById}
                disabled={isDeleting}
              >
                {isDeleting ? 'Deletando...' : 'Deletar'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default JuradosAdmin;
