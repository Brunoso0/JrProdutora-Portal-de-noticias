import React, { useCallback, useEffect, useMemo, useState } from 'react';
import axios from 'axios';
import { Search, RefreshCw, Save, Trash2, Eye, Pencil, X } from 'lucide-react';
import '../styles/ArtistasAdmin.css';

const STATUS_OPTIONS = [
  { value: '', label: 'Todos os status' },
  { value: 'ativo', label: 'Ativo' },
  { value: 'eliminado', label: 'Eliminado' },
  { value: 'desistente', label: 'Desistente' }
];

const PHASE_OPTIONS = [
  { value: '', label: 'Todas as fases' },
  { value: 'inscrito', label: 'Inscrito' },
  { value: 'audicao', label: 'Audição' },
  { value: 'final', label: 'Final' },
  { value: 'vencedor', label: 'Vencedor' }
];

const normalizePortfolioEntry = (rawEntry) => {
  const trimmed = String(rawEntry || '').trim();
  if (!trimmed) return '';

  if (trimmed.toLowerCase().startsWith('arquivo:')) {
    return trimmed.slice(8).trim();
  }

  if (trimmed.toLowerCase().startsWith('link:')) {
    return trimmed.slice(5).trim();
  }

  return trimmed;
};

const splitPortfolioEntries = (rawValue) =>
  String(rawValue || '')
    .split(',')
    .map((item) => normalizePortfolioEntry(item))
    .filter(Boolean);

const isLikelyUrl = (value) => /^https?:\/\//i.test(String(value || '').trim());

const isLikelyUploadFile = (value) => {
  const normalized = String(value || '').trim();
  return normalized.startsWith('uploads/') || normalized.startsWith('/uploads/');
};

const buildImageSrc = (value, apiBase) => {
  const val = String(value || '').trim();
  if (!val) return '';
  if (isLikelyUrl(val)) return val;
  if (isLikelyUploadFile(val)) {
    const origin = getApiOrigin(apiBase);
    const normalizedPath = val.startsWith('/') ? val : `/${val}`;
    return origin ? `${origin}${normalizedPath}` : normalizedPath;
  }
  return val;
};

const getPortfolioFileLabel = (pathValue) => {
  const normalized = String(pathValue || '').trim();
  const fileName = normalized.split('/').pop();
  return fileName || normalized;
};

const getApiOrigin = (apiBase) => {
  const normalizedBase = String(apiBase || '').trim();
  if (!normalizedBase) return '';

  try {
    return new URL(normalizedBase).origin;
  } catch (error) {
    return normalizedBase.replace(/\/api\/?$/, '').replace(/\/$/, '');
  }
};

const buildPortfolioHref = (entry, apiBase) => {
  if (!entry) return '#';
  if (isLikelyUrl(entry)) return entry;

  if (isLikelyUploadFile(entry)) {
    const origin = getApiOrigin(apiBase);
    const normalizedPath = String(entry).startsWith('/') ? String(entry) : `/${entry}`;
    return origin ? `${origin}${normalizedPath}` : normalizedPath;
  }

  return entry;
};

const EMPTY_FORM = {
  name: '',
  email: '',
  artistic_name: '',
  birth_date: '',
  address: '',
  rg: '',
  cpf: '',
  phone: '',
  song_name: '',
  experience_years: '',
  is_group: false,
  portfolio_url: '',
  profile_photo_url: '',
  status: 'ativo',
  current_phase: 'inscrito',
  bio: ''
};

const ArtistasAdmin = () => {
  const [candidates, setCandidates] = useState([]);
  const [selectedCandidateId, setSelectedCandidateId] = useState(null);
  const [detailMode, setDetailMode] = useState(null); // view | edit | delete | null
  const [form, setForm] = useState(EMPTY_FORM);

  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [phaseFilter, setPhaseFilter] = useState('');

  const [page, setPage] = useState(1);
  const [pagination, setPagination] = useState({ page: 1, limit: 20, total: 0 });

  const [isLoadingList, setIsLoadingList] = useState(false);
  const [isLoadingDetail, setIsLoadingDetail] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  const apiBase = process.env.API_FESTIVAL;

  const getToken = useCallback(() => {
    return (
      localStorage.getItem('festivalAdminToken') ||
      localStorage.getItem('token') ||
      localStorage.getItem('authToken') ||
      ''
    );
  }, []);

  const apiRequest = useCallback(async (method, path, data, params) => {
    const token = getToken();
    if (!token) {
      throw new Error('Token de admin nao encontrado. Faca login novamente.');
    }
    if (!apiBase) {
      throw new Error('A variavel de ambiente API_FESTIVAL nao esta configurada.');
    }

    return axios({
      method,
      url: `${apiBase}${path}`,
      data,
      params,
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });
  }, [apiBase, getToken]);

  const listQuery = useMemo(() => ({
    page,
    limit: 20,
    q: search || undefined,
    status: statusFilter || undefined,
    current_phase: phaseFilter || undefined
  }), [page, phaseFilter, search, statusFilter]);

  const loadCandidates = useCallback(async () => {
    setIsLoadingList(true);
    setErrorMsg('');

    try {
      const response = await apiRequest('get', '/api/admin/candidates', undefined, listQuery);
      const nextCandidates = response?.data?.candidates || [];
      const nextPagination = response?.data?.pagination || { page: 1, limit: 20, total: 0 };

      setCandidates(nextCandidates);
      setPagination(nextPagination);

      if (selectedCandidateId && !nextCandidates.some((item) => Number(item.id) === Number(selectedCandidateId))) {
        setSelectedCandidateId(null);
        setDetailMode(null);
        setForm(EMPTY_FORM);
      }
    } catch (error) {
      setErrorMsg(error?.response?.data?.message || error.message || 'Erro ao carregar artistas.');
    } finally {
      setIsLoadingList(false);
    }
  }, [apiRequest, listQuery, selectedCandidateId]);

  const loadCandidateDetail = useCallback(async (candidateId) => {
    if (!candidateId) {
      setForm(EMPTY_FORM);
      return;
    }

    setIsLoadingDetail(true);
    setErrorMsg('');

    try {
      const response = await apiRequest('get', `/api/admin/candidates/${candidateId}`);
      const candidate = response?.data?.candidate || null;

      setForm({
        name: candidate?.name || '',
        email: candidate?.email || '',
        artistic_name: candidate?.artistic_name || '',
        birth_date: candidate?.birth_date ? String(candidate.birth_date).slice(0, 10) : '',
        address: candidate?.address || '',
        rg: candidate?.rg || '',
        cpf: candidate?.cpf || '',
        phone: candidate?.phone || '',
        song_name: candidate?.song_name || '',
        experience_years: String(candidate?.experience_years ?? ''),
        is_group: Boolean(candidate?.is_group),
        portfolio_url: candidate?.portfolio_url || '',
        profile_photo_url: candidate?.profile_photo_url || '',
        status: candidate?.status || 'ativo',
        current_phase: candidate?.current_phase || 'inscrito',
        bio: candidate?.bio || ''
      });
    } catch (error) {
      setForm(EMPTY_FORM);
      setErrorMsg(error?.response?.data?.message || error.message || 'Erro ao carregar detalhes do artista.');
    } finally {
      setIsLoadingDetail(false);
    }
  }, [apiRequest]);

  useEffect(() => {
    loadCandidates();
  }, [loadCandidates]);

  useEffect(() => {
    if (!selectedCandidateId || !detailMode || detailMode === 'delete') {
      return;
    }

    loadCandidateDetail(selectedCandidateId);
  }, [detailMode, loadCandidateDetail, selectedCandidateId]);

  useEffect(() => {
    setPage(1);
  }, [search, statusFilter, phaseFilter]);

  const totalPages = Math.max(Math.ceil(Number(pagination.total || 0) / Number(pagination.limit || 20)), 1);

  const handleRefresh = async () => {
    await loadCandidates();
    if (selectedCandidateId && detailMode) {
      await loadCandidateDetail(selectedCandidateId);
    }
  };

  const openDetail = (mode, candidateId) => {
    setSuccessMsg('');
    setErrorMsg('');
    setDetailMode(mode);
    setSelectedCandidateId(candidateId);
  };

  const openDeleteModal = (candidateId) => {
    setSuccessMsg('');
    setErrorMsg('');
    setDetailMode('delete');
    setSelectedCandidateId(candidateId);
  };

  const closeDetail = () => {
    setDetailMode(null);
    setSelectedCandidateId(null);
    setForm(EMPTY_FORM);
  };

  const handleSave = async (event) => {
    event.preventDefault();

    if (!selectedCandidateId) {
      setErrorMsg('Selecione um artista para editar.');
      return;
    }

    setIsSaving(true);
    setErrorMsg('');
    setSuccessMsg('');

    try {
      const payload = {
        name: form.name,
        email: form.email,
        artistic_name: form.artistic_name,
        birth_date: form.birth_date || null,
        address: form.address || null,
        rg: form.rg || null,
        cpf: form.cpf,
        phone: form.phone || null,
        song_name: form.song_name || null,
        experience_years: form.experience_years === '' ? 0 : Number(form.experience_years),
        is_group: Boolean(form.is_group),
        portfolio_url: form.portfolio_url || null,
        profile_photo_url: form.profile_photo_url || null,
        status: form.status,
        current_phase: form.current_phase,
        bio: form.bio || null
      };

      await apiRequest('patch', `/api/admin/candidates/${selectedCandidateId}`, payload);

      setSuccessMsg('Artista atualizado com sucesso.');
      await loadCandidates();
      await loadCandidateDetail(selectedCandidateId);
    } catch (error) {
      setErrorMsg(error?.response?.data?.message || error.message || 'Erro ao atualizar artista.');
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!selectedCandidateId) {
      setErrorMsg('Selecione um artista para excluir.');
      return;
    }

    setIsDeleting(true);
    setErrorMsg('');
    setSuccessMsg('');

    try {
      await apiRequest('delete', `/api/admin/candidates/${selectedCandidateId}`);
      setSuccessMsg('Artista excluído com sucesso.');
      closeDetail();
      await loadCandidates();
    } catch (error) {
      setErrorMsg(error?.response?.data?.message || error.message || 'Erro ao excluir artista.');
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <div className="artistas-admin-container">
      <section className="artistas-banner">
        <div>
          <p className="artistas-banner-kicker">GESTAO DE CANDIDATOS</p>
          <h2>Controle completo dos artistas inscritos</h2>
          <p>Visualize, edite e exclua candidatos da base do festival.</p>
        </div>
        <button type="button" className="artistas-refresh-btn" onClick={handleRefresh} disabled={isLoadingList || isLoadingDetail}>
          <RefreshCw size={16} /> Atualizar
        </button>
      </section>

      <section className="artistas-filters">
        <div className="artistas-filter-search">
          <Search size={16} />
          <input
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Buscar por nome, email, nome artistico ou CPF"
          />
        </div>

        <select value={statusFilter} onChange={(event) => setStatusFilter(event.target.value)}>
          {STATUS_OPTIONS.map((opt) => (
            <option key={opt.value} value={opt.value}>{opt.label}</option>
          ))}
        </select>

        <select value={phaseFilter} onChange={(event) => setPhaseFilter(event.target.value)}>
          {PHASE_OPTIONS.map((opt) => (
            <option key={opt.value} value={opt.value}>{opt.label}</option>
          ))}
        </select>
      </section>

      {errorMsg ? <div className="artistas-alert erro">{errorMsg}</div> : null}
      {successMsg ? <div className="artistas-alert sucesso">{successMsg}</div> : null}

      <section className="artistas-grid">
        <div className="artistas-list-card">
          <header>
            <h3>Artistas ({pagination.total || 0})</h3>
          </header>

          <div className="artistas-table-wrap">
            {isLoadingList ? <p className="artistas-empty">Carregando artistas...</p> : null}

            {!isLoadingList && candidates.length === 0 ? (
              <p className="artistas-empty">Nenhum artista encontrado com os filtros atuais.</p>
            ) : null}

            {!isLoadingList && candidates.length > 0 ? (
              <table className="artistas-table">
                <thead>
                  <tr>
                    <th>Foto</th>
                    <th>Nome artistico</th>
                    <th>Email</th>
                    <th>CPF</th>
                    <th>Musica</th>
                    <th>Acoes</th>
                  </tr>
                </thead>
                <tbody>
                  {candidates.map((candidate) => (
                    <tr key={candidate.id}>
                      <td>
                        <div className="artista-foto-cell">
                          {candidate.profile_photo_url ? (
                            <img src={buildImageSrc(candidate.profile_photo_url, apiBase)} alt={candidate.artistic_name || candidate.name} />
                          ) : (
                            <div className="artista-foto-placeholder">Sem foto</div>
                          )}
                        </div>
                      </td>
                      <td>{candidate.artistic_name || '-'}</td>
                      <td>{candidate.email || '-'}</td>
                      <td>{candidate.cpf || '-'}</td>
                      <td>{candidate.song_name || '-'}</td>
                      <td>
                        <div className="acoes-cell">
                          <button type="button" className="acao-btn ver" onClick={() => openDetail('view', candidate.id)}>
                            <Eye size={14} /> Ver
                          </button>
                          <button type="button" className="acao-btn editar" onClick={() => openDetail('edit', candidate.id)}>
                            <Pencil size={14} /> Editar
                          </button>
                          <button
                            type="button"
                            className="acao-btn excluir"
                            onClick={() => openDeleteModal(candidate.id)}
                          >
                            <Trash2 size={14} /> Excluir
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            ) : null}
          </div>

          <footer className="artistas-pagination">
            <button type="button" onClick={() => setPage((current) => Math.max(current - 1, 1))} disabled={page <= 1}>
              Anterior
            </button>
            <span>Página {page} de {totalPages}</span>
            <button type="button" onClick={() => setPage((current) => Math.min(current + 1, totalPages))} disabled={page >= totalPages}>
              Próxima
            </button>
          </footer>
        </div>

        {detailMode ? (
          <div className="artistas-modal-overlay" onClick={closeDetail}>
            <div className="artistas-modal" onClick={(event) => event.stopPropagation()}>
              <div className="artistas-modal-header">
                <h3>
                  {detailMode === 'edit' ? 'Editar artista' : detailMode === 'view' ? 'Visualizar artista' : 'Excluir artista'}
                </h3>
                <button type="button" className="close-detail-btn" onClick={closeDetail}>
                  <X size={16} /> Fechar
                </button>
              </div>

              {detailMode === 'delete' ? (
                <div className="artistas-delete-modal-body">
                  <p>Tem certeza que deseja excluir este artista?</p>
                  <p>Esta ação remove definitivamente o candidato e não pode ser desfeita.</p>
                  <div className="artistas-actions">
                    <button type="button" className="save-btn" onClick={closeDetail} disabled={isDeleting}>
                      Cancelar
                    </button>
                    <button type="button" className="delete-btn" onClick={handleDelete} disabled={isDeleting}>
                      <Trash2 size={16} /> {isDeleting ? 'Excluindo...' : 'Confirmar exclusão'}
                    </button>
                  </div>
                </div>
              ) : isLoadingDetail ? (
                <p className="artistas-empty">Carregando detalhes...</p>
              ) : (
                <form onSubmit={handleSave} className="artistas-form">
                <label>
                  Nome civil
                  <input
                    value={form.name}
                    disabled={detailMode === 'view'}
                    onChange={(event) => setForm((cur) => ({ ...cur, name: event.target.value }))}
                  />
                </label>

                <label>
                  Nome artistico
                  <input
                    value={form.artistic_name}
                    disabled={detailMode === 'view'}
                    onChange={(event) => setForm((cur) => ({ ...cur, artistic_name: event.target.value }))}
                  />
                </label>

                <label>
                  E-mail
                  <input
                    type="email"
                    value={form.email}
                    disabled={detailMode === 'view'}
                    onChange={(event) => setForm((cur) => ({ ...cur, email: event.target.value }))}
                  />
                </label>

                <div className="artistas-form-row">
                  <label>
                    Data de nascimento
                    <input
                      type="date"
                      value={form.birth_date}
                      disabled={detailMode === 'view'}
                      onChange={(event) => setForm((cur) => ({ ...cur, birth_date: event.target.value }))}
                    />
                  </label>

                  <label>
                    RG
                    <input
                      value={form.rg}
                      disabled={detailMode === 'view'}
                      onChange={(event) => setForm((cur) => ({ ...cur, rg: event.target.value }))}
                    />
                  </label>
                </div>

                <div className="artistas-form-row">
                  <label>
                    CPF
                    <input
                      value={form.cpf}
                      disabled={detailMode === 'view'}
                      onChange={(event) => setForm((cur) => ({ ...cur, cpf: event.target.value }))}
                    />
                  </label>

                  <label>
                    Telefone
                    <input
                      value={form.phone}
                      disabled={detailMode === 'view'}
                      onChange={(event) => setForm((cur) => ({ ...cur, phone: event.target.value }))}
                    />
                  </label>
                </div>

                <label>
                  Endereco
                  <input
                    value={form.address}
                    disabled={detailMode === 'view'}
                    onChange={(event) => setForm((cur) => ({ ...cur, address: event.target.value }))}
                  />
                </label>

                <div className="artistas-form-row">
                  <label>
                    Musica
                    <input
                      value={form.song_name}
                      disabled={detailMode === 'view'}
                      onChange={(event) => setForm((cur) => ({ ...cur, song_name: event.target.value }))}
                    />
                  </label>

                  <label>
                    Experiencia (anos)
                    <input
                      type="number"
                      min="0"
                      value={form.experience_years}
                      disabled={detailMode === 'view'}
                      onChange={(event) => setForm((cur) => ({ ...cur, experience_years: event.target.value }))}
                    />
                  </label>
                </div>

                <div className="artistas-form-row">
                  <label>
                    Status
                    <select
                      value={form.status}
                      disabled={detailMode === 'view'}
                      onChange={(event) => setForm((cur) => ({ ...cur, status: event.target.value }))}
                    >
                      <option value="ativo">Ativo</option>
                      <option value="eliminado">Eliminado</option>
                      <option value="desistente">Desistente</option>
                    </select>
                  </label>

                  <label>
                    Fase
                    <select
                      value={form.current_phase}
                      disabled={detailMode === 'view'}
                      onChange={(event) => setForm((cur) => ({ ...cur, current_phase: event.target.value }))}
                    >
                      <option value="inscrito">Inscrito</option>
                      <option value="audicao">Audicao</option>
                      <option value="final">Final</option>
                      <option value="vencedor">Vencedor</option>
                    </select>
                  </label>
                </div>

                <div className="artistas-form-row">
                  <label>
                    Grupo?
                    <select
                      value={String(form.is_group)}
                      disabled={detailMode === 'view'}
                      onChange={(event) => setForm((cur) => ({ ...cur, is_group: event.target.value === 'true' }))}
                    >
                      <option value="false">Nao</option>
                      <option value="true">Sim</option>
                    </select>
                  </label>

                  <label>
                    URL da foto
                    <input
                      value={form.profile_photo_url}
                      disabled={detailMode === 'view'}
                      onChange={(event) => setForm((cur) => ({ ...cur, profile_photo_url: event.target.value }))}
                    />
                  </label>
                </div>

                <label>
                  Portfolio (URL)
                  {detailMode === 'view' ? (
                    <div className="portfolio-readonly-list">
                      {splitPortfolioEntries(form.portfolio_url).length === 0 ? (
                        <span className="portfolio-empty">Nenhum portfolio informado.</span>
                      ) : (
                        splitPortfolioEntries(form.portfolio_url).map((entry) => {
                          const href = buildPortfolioHref(entry, apiBase);
                          const isLink = isLikelyUrl(entry);
                          const isFile = isLikelyUploadFile(entry);

                          return (
                            <a
                              key={`${entry}-${href}`}
                              className="portfolio-item-link"
                              href={href}
                              target="_blank"
                              rel="noreferrer"
                            >
                              {isFile ? `Arquivo: ${getPortfolioFileLabel(entry)}` : isLink ? `Link: ${entry}` : entry}
                            </a>
                          );
                        })
                      )}
                    </div>
                  ) : (
                    <input
                      value={form.portfolio_url}
                      disabled={detailMode === 'view'}
                      onChange={(event) => setForm((cur) => ({ ...cur, portfolio_url: event.target.value }))}
                    />
                  )}
                </label>

                <label>
                  Biografia
                  <textarea
                    rows={4}
                    value={form.bio}
                    disabled={detailMode === 'view'}
                    onChange={(event) => setForm((cur) => ({ ...cur, bio: event.target.value }))}
                  />
                </label>

                <div className="artistas-actions">
                  {detailMode === 'edit' ? (
                    <button type="submit" className="save-btn" disabled={isSaving || isDeleting}>
                      <Save size={16} /> {isSaving ? 'Salvando...' : 'Salvar alterações'}
                    </button>
                  ) : null}
                  <button type="button" className="delete-btn" onClick={handleDelete} disabled={isSaving || isDeleting}>
                    <Trash2 size={16} /> {isDeleting ? 'Excluindo...' : 'Excluir artista'}
                  </button>
                </div>
                </form>
              )}
            </div>
          </div>
        ) : null}
      </section>
    </div>
  );
};

export default ArtistasAdmin;
