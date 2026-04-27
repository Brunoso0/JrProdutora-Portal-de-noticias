import React, { useCallback, useEffect, useMemo, useState } from 'react';
import axios from 'axios';
import { Plus, MoreVertical, ArrowRight, RefreshCw } from 'lucide-react';
import '../styles/SessoesAdmin.css';

const STATUS_OPTIONS = ['waiting', 'public_voting', 'judge_voting', 'finished'];

const STATUS_LABELS = {
  waiting: 'Aguardando',
  public_voting: 'Voto Popular',
  judge_voting: 'Voto Jurados',
  finished: 'Finalizada'
};

const getStatusType = (status) => {
  if (status === 'public_voting' || status === 'judge_voting') return 'active';
  if (status === 'waiting') return 'draft';
  return 'inactive';
};

const formatDate = (dateString) => {
  if (!dateString) return '--';
  const parsed = new Date(dateString);
  if (Number.isNaN(parsed.getTime())) return dateString;
  return parsed.toLocaleDateString('pt-BR');
};

const normalizeText = (value) => String(value || '').trim().toLowerCase();

const parseCandidateNames = (raw) =>
  String(raw || '')
    .split(/[\n,;]/)
    .map((item) => item.trim())
    .filter(Boolean);

const collectCandidateEntries = (source, bucket = []) => {
  if (!source) return bucket;

  if (Array.isArray(source)) {
    source.forEach((item) => collectCandidateEntries(item, bucket));
    return bucket;
  }

  if (typeof source !== 'object') return bucket;

  const candidateName = source.artistic_name || source.name || source.candidate_name || source.label;
  const candidateId = source.candidate_id ?? source.candidateId ?? source.id ?? source.user_id;

  if (candidateName || candidateId) {
    bucket.push({
      id: Number(candidateId),
      name: String(candidateName || '').trim()
    });
  }

  Object.values(source).forEach((value) => {
    if (Array.isArray(value) || (value && typeof value === 'object')) {
      collectCandidateEntries(value, bucket);
    }
  });

  return bucket;
};

const findCandidateMatch = (rawName, candidateOptions) => {
  const query = normalizeText(rawName);
  if (!query) return null;

  const exactMatch = candidateOptions.find((candidate) => normalizeText(candidate.name) === query);
  if (exactMatch) return exactMatch;

  const partialMatches = candidateOptions.filter((candidate) => normalizeText(candidate.name).includes(query));
  if (partialMatches.length === 1) return partialMatches[0];

  return null;
};

const CandidateLookupField = ({
  label,
  value,
  onChange,
  options,
  placeholder,
  helperText,
  onSelect,
  rows = 3
}) => {
  const optionCount = options.length;

  return (
    <div className="candidate-lookup-field">
      <label>{label}</label>
      <textarea
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        rows={rows}
      />
      <div className="candidate-lookup-meta">
        <span>{helperText}</span>
        <span>{optionCount ? `${optionCount} sugestão(ões)` : 'Nenhum nome encontrado'}</span>
      </div>
      <select
        size={Math.min(6, Math.max(optionCount, 2))}
        value=""
        onChange={(event) => {
          if (event.target.value) {
            onSelect(event.target.value);
          }
        }}
        disabled={optionCount === 0}
      >
        <option value="">Selecione um nome sugerido</option>
        {options.map((candidate) => (
          <option key={`${candidate.id || candidate.name}`} value={candidate.name}>
            {candidate.name}{candidate.id ? ` • #${candidate.id}` : ''}
          </option>
        ))}
      </select>
    </div>
  );
};

const SessoesAdmin = () => {
  const [sessions, setSessions] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [activeTab, setActiveTab] = useState('all');
  const [selectedSessionId, setSelectedSessionId] = useState(null);
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');
  const [resultsData, setResultsData] = useState(null);

  const [createForm, setCreateForm] = useState({
    title: '',
    session_date: '',
    session_time: '',
    location: '',
    status: 'waiting',
    winners_count: '3'
  });

  const [sessionForm, setSessionForm] = useState({
    title: '',
    session_date: '',
    session_time: '',
    location: '',
    status: 'waiting',
    winners_count: '3'
  });

  const [activeCandidateName, setActiveCandidateName] = useState('');
  const [candidateNamesCsv, setCandidateNamesCsv] = useState('');
  const [candidateNameToRemove, setCandidateNameToRemove] = useState('');
  const [scoreCorrection, setScoreCorrection] = useState({
    candidateName: '',
    adjustment: ''
  });

  const apiBase = process.env.API_FESTIVAL;

  const getToken = useCallback(() => {
    return (
      localStorage.getItem('festivalAdminToken') ||
      localStorage.getItem('token') ||
      localStorage.getItem('authToken') ||
      ''
    );
  }, []);

  const apiRequest = useCallback(async (method, path, data) => {
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
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });
  }, [apiBase, getToken]);

  const loadSessions = useCallback(async () => {
    setIsLoading(true);
    setErrorMsg('');
    try {
      const response = await apiRequest('get', '/api/sessions');
      const nextSessions = response?.data?.sessions || [];
      setSessions(nextSessions);

      if (!selectedSessionId && nextSessions.length > 0) {
        setSelectedSessionId(nextSessions[0].id);
      }
    } catch (error) {
      setErrorMsg(error?.response?.data?.message || error.message || 'Erro ao carregar sessoes.');
    } finally {
      setIsLoading(false);
    }
  }, [apiRequest, selectedSessionId]);

  const loadSelectedSessionResults = useCallback(async (sessionId) => {
    if (!sessionId) return;

    try {
      const response = await apiRequest('get', `/api/sessions/${sessionId}/results`);
      setResultsData(response?.data || null);
    } catch (error) {
      setResultsData(null);
    }
  }, [apiRequest]);

  useEffect(() => {
    loadSessions();
  }, [loadSessions]);

  useEffect(() => {
    if (!selectedSessionId) {
      setResultsData(null);
      setActiveCandidateName('');
      setCandidateNameToRemove('');
      setCandidateNamesCsv('');
      setScoreCorrection((current) => ({ ...current, candidateName: '' }));
      return;
    }

    loadSelectedSessionResults(selectedSessionId);
  }, [loadSelectedSessionResults, selectedSessionId]);

  const selectedSession = useMemo(
    () => sessions.find((item) => Number(item.id) === Number(selectedSessionId)) || null,
    [sessions, selectedSessionId]
  );

  const candidateOptions = useMemo(() => {
    const collected = [];
    collectCandidateEntries(selectedSession, collected);
    collectCandidateEntries(resultsData, collected);

    const uniqueCandidates = new Map();

    collected.forEach((candidate) => {
      const name = String(candidate.name || '').trim();
      if (!name) return;

      const candidateId = Number(candidate.id);
      const key = Number.isFinite(candidateId) && candidateId > 0
        ? `id:${candidateId}`
        : `name:${normalizeText(name)}`;

      if (!uniqueCandidates.has(key)) {
        uniqueCandidates.set(key, {
          id: Number.isFinite(candidateId) && candidateId > 0 ? candidateId : null,
          name
        });
      }
    });

    return Array.from(uniqueCandidates.values()).sort((left, right) => left.name.localeCompare(right.name, 'pt-BR'));
  }, [resultsData, selectedSession]);

  const filterCandidateOptions = useCallback((query) => {
    const normalizedQuery = normalizeText(query);
    if (!normalizedQuery) return candidateOptions;

    return candidateOptions.filter((candidate) => {
      const normalizedName = normalizeText(candidate.name);
      return normalizedName.includes(normalizedQuery) || String(candidate.id || '').includes(normalizedQuery);
    });
  }, [candidateOptions]);

  useEffect(() => {
    if (!selectedSession) return;

    const activeCandidateId =
      selectedSession.active_candidate_id ??
      selectedSession.activeCandidateId ??
      selectedSession.active_candidate?.candidate_id ??
      selectedSession.active_candidate?.id ??
      selectedSession.activeCandidate?.candidate_id ??
      selectedSession.activeCandidate?.id;

    const activeCandidateNameFromSession =
      selectedSession.active_candidate?.artistic_name ??
      selectedSession.active_candidate?.name ??
      selectedSession.activeCandidate?.artistic_name ??
      selectedSession.activeCandidate?.name ??
      selectedSession.active_candidate_name ??
      selectedSession.activeCandidateName ??
      '';

    const activeCandidateById = candidateOptions.find((candidate) => String(candidate.id) === String(activeCandidateId));

    setActiveCandidateName(activeCandidateById?.name || activeCandidateNameFromSession || '');
  }, [candidateOptions, selectedSession]);

  const filteredSessions = useMemo(() => {
    if (activeTab === 'all') return sessions;
    if (activeTab === 'running') {
      return sessions.filter((item) => item.status === 'public_voting' || item.status === 'judge_voting');
    }
    return sessions.filter((item) => item.status === 'waiting');
  }, [activeTab, sessions]);

  const counters = useMemo(() => {
    const today = new Date().toISOString().slice(0, 10);
    const todayCount = sessions.filter((item) => item.session_date && item.session_date.slice(0, 10) === today).length;
    const scheduled = sessions.filter((item) => item.status === 'waiting').length;
    return { todayCount, scheduled };
  }, [sessions]);

  useEffect(() => {
    if (!selectedSession) return;
    setSessionForm({
      title: selectedSession.title || '',
      session_date: selectedSession.session_date || '',
      session_time: selectedSession.session_time || '',
      location: selectedSession.location || '',
      status: selectedSession.status || 'waiting',
      winners_count: String(selectedSession.winners_count || 3)
    });
  }, [selectedSession]);

  const runAction = async (fn, successMessage) => {
    setIsSaving(true);
    setErrorMsg('');
    setSuccessMsg('');

    try {
      await fn();
      if (successMessage) {
        setSuccessMsg(successMessage);
      }
      await loadSessions();
    } catch (error) {
      setErrorMsg(error?.response?.data?.message || error.message || 'Nao foi possivel concluir a operacao.');
    } finally {
      setIsSaving(false);
    }
  };

  const handleCreateSession = async (event) => {
    event.preventDefault();
    await runAction(async () => {
      const payload = {
        title: createForm.title,
        session_date: createForm.session_date || undefined,
        session_time: createForm.session_time || undefined,
        location: createForm.location || undefined,
        status: createForm.status,
        winners_count: Number(createForm.winners_count)
      };

      const response = await apiRequest('post', '/api/sessions', payload);
      const created = response?.data?.session;
      if (created?.id) {
        setSelectedSessionId(created.id);
      }

      setCreateForm((current) => ({ ...current, title: '', location: '' }));
    }, 'Sessao criada com sucesso.');
  };

  const handleUpdateSessionDetails = async (event) => {
    event.preventDefault();
    if (!selectedSessionId) return;

    await runAction(
      () =>
        apiRequest('patch', `/api/sessions/${selectedSessionId}`, {
          title: sessionForm.title,
          session_date: sessionForm.session_date || null,
          session_time: sessionForm.session_time || null,
          location: sessionForm.location || null,
          status: sessionForm.status,
          winners_count: Number(sessionForm.winners_count)
        }),
      'Dados da sessao atualizados.'
    );
  };

  const handleUpdateStatus = async (nextStatus) => {
    if (!selectedSessionId) return;

    await runAction(
      () =>
        apiRequest('patch', `/api/sessions/${selectedSessionId}/status`, {
          status: nextStatus,
          winners_count: Number(sessionForm.winners_count)
        }),
      `Status alterado para ${STATUS_LABELS[nextStatus] || nextStatus}.`
    );
  };

  const handleSetActiveCandidate = async (event) => {
    event.preventDefault();
    if (!selectedSessionId) return;

    const match = findCandidateMatch(activeCandidateName, candidateOptions);
    if (!match?.id) {
      setErrorMsg('Selecione um nome artístico válido para definir o candidato ativo.');
      return;
    }

    await runAction(
      () =>
        apiRequest('patch', `/api/sessions/${selectedSessionId}/active-candidate`, {
          active_candidate_id: Number(match.id)
        }),
      `Candidato ativo atualizado para ${match.name}.`
    );

    setActiveCandidateName(match.name);
  };

  const handleAddCandidates = async (event) => {
    event.preventDefault();
    if (!selectedSessionId) return;

    const candidateNames = parseCandidateNames(candidateNamesCsv);
    if (!candidateNames.length) {
      setErrorMsg('Informe ao menos um nome artístico válido.');
      return;
    }

    const resolvedCandidates = candidateNames.map((candidateName) => ({
      candidateName,
      match: findCandidateMatch(candidateName, candidateOptions)
    }));

    const unresolvedCandidate = resolvedCandidates.find((item) => !item.match?.id);
    if (unresolvedCandidate) {
      setErrorMsg(`Nao encontrei correspondencia para "${unresolvedCandidate.candidateName}".`);
      return;
    }

    await runAction(
      () =>
        apiRequest('post', `/api/sessions/${selectedSessionId}/candidates`, {
          candidate_ids: resolvedCandidates.map((item) => Number(item.match.id))
        }),
      'Candidatos vinculados a sessao.'
    );

    setCandidateNamesCsv('');
  };

  const handleRemoveCandidate = async (event) => {
    event.preventDefault();
    if (!selectedSessionId) return;

    const match = findCandidateMatch(candidateNameToRemove, candidateOptions);
    if (!match?.id) {
      setErrorMsg('Selecione um nome artístico válido para remoção.');
      return;
    }

    await runAction(
      () => apiRequest('delete', `/api/sessions/${selectedSessionId}/candidates/${Number(match.id)}`),
      'Candidato removido da sessao.'
    );

    setCandidateNameToRemove('');
  };

  const handleScoreCorrection = async (event) => {
    event.preventDefault();
    if (!selectedSessionId) return;

    const match = findCandidateMatch(scoreCorrection.candidateName, candidateOptions);
    const adjustment = Number(scoreCorrection.adjustment);
    if (!match?.id || !Number.isFinite(adjustment)) {
      setErrorMsg('Preencha nome artístico e ajuste (float) válidos.');
      return;
    }

    await runAction(
      () =>
        apiRequest('patch', `/api/sessions/${selectedSessionId}/candidates/${Number(match.id)}/score-correction`, {
          adjustment
        }),
      'Correcao de pontuacao aplicada.'
    );

    setScoreCorrection((current) => ({ ...current, candidateName: match.name }));
  };

  const handleLoadResults = async () => {
    if (!selectedSessionId) return;

    await runAction(async () => {
      const response = await apiRequest('get', `/api/sessions/${selectedSessionId}/results`);
      setResultsData(response?.data || null);
    }, 'Resultados carregados com sucesso.');
  };

  return (
    <div className="sessoes-admin-container">
      {/* Top Banner */}
      <div className="sessoes-banner">
        <div className="sessoes-banner-content">
          <p className="sessoes-banner-kicker">MÓDULO DE SESSÕES</p>
          <h2 className="sessoes-banner-title">Prepare o palco para as<br/>próximas apresentações.</h2>
          <form className="sessoes-create-form" onSubmit={handleCreateSession}>
            <input
              type="text"
              placeholder="Titulo da sessao"
              value={createForm.title}
              onChange={(event) => setCreateForm((current) => ({ ...current, title: event.target.value }))}
              required
            />
            <input
              type="date"
              value={createForm.session_date}
              onChange={(event) => setCreateForm((current) => ({ ...current, session_date: event.target.value }))}
            />
            <input
              type="time"
              value={createForm.session_time}
              onChange={(event) => setCreateForm((current) => ({ ...current, session_time: event.target.value }))}
            />
            <button className="sessoes-banner-btn" type="submit" disabled={isSaving}>
              <Plus size={18} /> Criar Nova Sessão
            </button>
          </form>
        </div>
        <div className="sessoes-banner-stats">
          <div className="stat-circle">
            <span className="stat-value">{String(counters.todayCount).padStart(2, '0')}</span>
            <span className="stat-label">HOJE</span>
          </div>
          <div className="stat-circle dark">
            <span className="stat-value">{String(counters.scheduled).padStart(2, '0')}</span>
            <span className="stat-label">AGENDADAS</span>
          </div>
        </div>
        <div className="sessoes-banner-bg-shape"></div>
      </div>

      {/* Recentes Section */}
      <div className="sessoes-recentes-header">
        <div className="sessoes-recentes-title">
          <h3>Sessões Recentes</h3>
          <div className="title-line"></div>
        </div>
        <div className="sessoes-recentes-tabs">
          <button className={`tab-btn ${activeTab === 'all' ? 'active' : ''}`} onClick={() => setActiveTab('all')}>TODAS</button>
          <button className={`tab-btn ${activeTab === 'running' ? 'active' : ''}`} onClick={() => setActiveTab('running')}>EM ANDAMENTO</button>
          <button className={`tab-btn ${activeTab === 'drafts' ? 'active' : ''}`} onClick={() => setActiveTab('drafts')}>RASCUNHOS</button>
          <button className="tab-btn" onClick={loadSessions} disabled={isLoading}>
            <RefreshCw size={14} /> Atualizar
          </button>
        </div>
      </div>

      {errorMsg && <div className="sessoes-alert erro">{errorMsg}</div>}
      {successMsg && <div className="sessoes-alert sucesso">{successMsg}</div>}

      <div className="sessoes-list-card">
        <div className="sessoes-list-header">
          <div className="col-session">SESSÃO</div>
          <div className="col-date">DATA E HORA</div>
          <div className="col-status">STATUS</div>
          <div className="col-candidates">CANDIDATOS</div>
          <div className="col-actions">AÇÕES</div>
        </div>

        <div className="sessoes-list-body">
          {filteredSessions.map((session) => (
            <div className="sessoes-list-item" key={session.id}>
              <div className="col-session item-session">
                <div className={`session-icon session-icon-${getStatusType(session.status) === 'active' ? 'blue' : getStatusType(session.status) === 'draft' ? 'yellow' : 'grey'}`}>
                  <div className="session-icon-inner">S{session.id}</div>
                </div>
                <div className="session-info">
                  <h4>{session.title || `Sessao ${session.id}`}</h4>
                  <p>{session.location || 'Sem local informado'}</p>
                </div>
              </div>
              <div className="col-date item-date">
                <p className="date-text">{formatDate(session.session_date)}</p>
                <p className="time-text">{session.session_time || '--:--'}</p>
              </div>
              <div className="col-status item-status">
                <span className={`status-pill status-${getStatusType(session.status)}`}>
                  <span className="status-dot"></span>
                  {STATUS_LABELS[session.status] || session.status}
                </span>
              </div>
              <div className="col-candidates item-candidates">
                <span>{session.participants_count || 0}</span>
              </div>
              <div className="col-actions item-actions">
                <button className="action-btn" onClick={() => setSelectedSessionId(session.id)} title="Selecionar sessão">
                  <MoreVertical size={20} />
                </button>
              </div>
            </div>
          ))}
          {!isLoading && filteredSessions.length === 0 && (
            <div className="sessoes-empty">Nenhuma sessão encontrada para este filtro.</div>
          )}
        </div>
      </div>

      {selectedSession && (
        <section className="sessoes-control-panel">
          <h3>Sessão selecionada: {selectedSession.title || `Sessao ${selectedSession.id}`}</h3>
          <p>ID #{selectedSession.id} • Status atual: {STATUS_LABELS[selectedSession.status] || selectedSession.status}</p>

          <div className="control-grid">
            <form className="control-card" onSubmit={handleUpdateSessionDetails}>
              <h4>Atualizar dados gerais</h4>
              <input type="text" value={sessionForm.title} placeholder="Titulo" onChange={(e) => setSessionForm((c) => ({ ...c, title: e.target.value }))} required />
              <input type="date" value={sessionForm.session_date || ''} onChange={(e) => setSessionForm((c) => ({ ...c, session_date: e.target.value }))} />
              <input type="time" value={sessionForm.session_time || ''} onChange={(e) => setSessionForm((c) => ({ ...c, session_time: e.target.value }))} />
              <input type="text" value={sessionForm.location || ''} placeholder="Local" onChange={(e) => setSessionForm((c) => ({ ...c, location: e.target.value }))} />
              <div className="inline-fields">
                <select value={sessionForm.status} onChange={(e) => setSessionForm((c) => ({ ...c, status: e.target.value }))}>
                  {STATUS_OPTIONS.map((status) => (
                    <option value={status} key={status}>{STATUS_LABELS[status]}</option>
                  ))}
                </select>
                <input
                  type="number"
                  min="1"
                  value={sessionForm.winners_count}
                  onChange={(e) => setSessionForm((c) => ({ ...c, winners_count: e.target.value }))}
                  placeholder="Vencedores"
                />
              </div>
              <button type="submit" disabled={isSaving}>Salvar sessão</button>
            </form>

            <div className="control-card">
              <h4>Status e palco</h4>
              <div className="status-buttons">
                {STATUS_OPTIONS.map((status) => (
                  <button type="button" key={status} onClick={() => handleUpdateStatus(status)} disabled={isSaving}>
                    {STATUS_LABELS[status]}
                  </button>
                ))}
              </div>

              <form onSubmit={handleSetActiveCandidate}>
                <CandidateLookupField
                  label="Candidato ativo (nome artístico)"
                  value={activeCandidateName}
                  onChange={(event) => setActiveCandidateName(event.target.value)}
                  options={filterCandidateOptions(activeCandidateName)}
                  placeholder="Digite o nome artístico do candidato"
                  helperText="Escreva o nome e escolha a sugestão correspondente antes de confirmar."
                  onSelect={setActiveCandidateName}
                  rows={2}
                />
                <button type="submit" disabled={isSaving}>Definir</button>
              </form>
            </div>

            <div className="control-card">
              <h4>Candidatos da sessão</h4>
              <form onSubmit={handleAddCandidates}>
                <CandidateLookupField
                  label="Adicionar candidatos por nome artístico"
                  value={candidateNamesCsv}
                  onChange={(event) => setCandidateNamesCsv(event.target.value)}
                  options={filterCandidateOptions(candidateNamesCsv)}
                  placeholder="Maria do Forro, João da Sanfona"
                  helperText="Separe os nomes por vírgula, ponto e vírgula ou quebra de linha."
                  onSelect={setCandidateNamesCsv}
                  rows={4}
                />
                <button type="submit" disabled={isSaving}>Vincular</button>
              </form>

              <form onSubmit={handleRemoveCandidate}>
                <CandidateLookupField
                  label="Remover candidato (nome artístico)"
                  value={candidateNameToRemove}
                  onChange={(event) => setCandidateNameToRemove(event.target.value)}
                  options={filterCandidateOptions(candidateNameToRemove)}
                  placeholder="Digite o nome artístico"
                  helperText="Use o nome artístico para localizar o candidato correto antes de remover."
                  onSelect={setCandidateNameToRemove}
                  rows={2}
                />
                <button type="submit" disabled={isSaving}>Remover</button>
              </form>
            </div>

            <div className="control-card">
              <h4>Correção de pontuação e ranking</h4>
              <form onSubmit={handleScoreCorrection}>
                <CandidateLookupField
                  label="Correção manual (nome artístico)"
                  value={scoreCorrection.candidateName}
                  onChange={(event) => setScoreCorrection((c) => ({ ...c, candidateName: event.target.value }))}
                  options={filterCandidateOptions(scoreCorrection.candidateName)}
                  placeholder="Digite o nome artístico"
                  helperText="Localize o candidato pelo nome antes de aplicar o ajuste."
                  onSelect={(selectedName) => setScoreCorrection((c) => ({ ...c, candidateName: selectedName }))}
                  rows={2}
                />
                <input
                  type="number"
                  step="0.01"
                  value={scoreCorrection.adjustment}
                  onChange={(e) => setScoreCorrection((c) => ({ ...c, adjustment: e.target.value }))}
                  placeholder="Ajuste"
                  required
                />
                <button type="submit" disabled={isSaving}>Aplicar correção</button>
              </form>

              <button type="button" onClick={handleLoadResults} disabled={isSaving}>Carregar resultados</button>

              {resultsData?.final_ranking?.length > 0 && (
                <div className="ranking-box">
                  <h5>Top 5 final</h5>
                  <ol>
                    {resultsData.final_ranking.slice(0, 5).map((row) => (
                      <li key={row.candidate_id}>
                        <span>{row.artistic_name || row.name || `Candidato ${row.candidate_id}`}</span>
                        <strong>{Number(row.effective_score || 0).toFixed(4)}</strong>
                      </li>
                    ))}
                  </ol>
                </div>
              )}
            </div>
          </div>
        </section>
      )}

      {/* Info Cards Row */}
      <div className="sessoes-info-cards">
        <div className="info-card highlight">
          <p className="card-kicker">DESTAQUE DO DIA</p>
          <p className="card-text">Sessão "Noite de São João" está com 95% de ocupação técnica.</p>
          <button type="button" className="card-link as-btn" onClick={handleLoadResults}>Ver Detalhes <ArrowRight size={14} /></button>
          <div className="card-bg-shape highlight-shape"></div>
        </div>
        <div className="info-card alert">
          <p className="card-kicker alert-color">AVISO JURADOS</p>
          <p className="card-text">3 jurados ainda não confirmaram presença para a final.</p>
          <button type="button" className="card-link alert-color as-btn">Gerenciar Jurados <ArrowRight size={14} /></button>
          <div className="card-bg-shape alert-shape"></div>
        </div>
        <div className="info-card logistics">
          <p className="card-kicker logistics-color">LOGÍSTICA</p>
          <p className="card-text">Distribuição de credenciais para candidatos começa amanhã.</p>
          <button type="button" className="card-link logistics-color as-btn">Imprimir Lista <ArrowRight size={14} /></button>
          <div className="card-bg-shape logistics-shape"></div>
        </div>
      </div>

      {/* Footer */}
      <footer className="sessoes-footer">
        <div className="footer-left">
          <strong>Festival de Forró Admin</strong>
          <span className="footer-divider">|</span>
          <span className="footer-version">Painel de Controle v2.4.0</span>
        </div>
        <div className="footer-right">
          <button type="button">Termos</button>
          <button type="button">Privacidade</button>
          <button type="button">Relatórios</button>
        </div>
      </footer>

      {/* Floating Action Button */}
      <button className="fab-button">
        <Plus size={28} />
      </button>
    </div>
  );
};

export default SessoesAdmin;
