import React, { useCallback, useEffect, useMemo, useState, useRef } from 'react';
import axios from 'axios';
import { Plus, MoreVertical, ArrowRight, RefreshCw, Trash2, Edit2, Eye } from 'lucide-react';
import { formatErrorMessage } from '../utils/errorFormatter';
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

const CandidateLookupField = ({ label, value, onChange, options, placeholder, helperText, onSelect, rows = 3 }) => {
  const optionCount = options.length;
  return (
    <div className="candidate-lookup-field">
      <label>{label}</label>
      <textarea value={value} onChange={onChange} placeholder={placeholder} rows={rows} />
      <div className="candidate-lookup-meta">
        <span>{helperText}</span>
        <span>{optionCount ? `${optionCount} sugestão(ões)` : 'Nenhum nome encontrado'}</span>
      </div>
      <select
        size={Math.min(6, Math.max(optionCount, 2))}
        value=""
        onChange={(event) => {
          if (event.target.value) onSelect(event.target.value);
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
  const [activeSessionTab, setActiveSessionTab] = useState('dados');
  const [dropdownOpenId, setDropdownOpenId] = useState(null);

  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');
  const [resultsData, setResultsData] = useState(null);
  const [sessionJudges, setSessionJudges] = useState([]);
  const [allJudges, setAllJudges] = useState([]);

  const [createForm, setCreateForm] = useState({
    title: '', session_date: '', session_time: '', location: '', status: 'waiting', winners_count_judges: '3', winners_count_public: '1', is_public_voting_open: false
  });

  const [sessionForm, setSessionForm] = useState({
    title: '', session_date: '', session_time: '', location: '', status: 'waiting', winners_count_judges: '3', winners_count_public: '1', is_public_voting_open: false
  });

  const [activeCandidateName, setActiveCandidateName] = useState('');
  const [candidateNamesCsv, setCandidateNamesCsv] = useState('');
  const [candidateNameToRemove, setCandidateNameToRemove] = useState('');
  const [scoreCorrection, setScoreCorrection] = useState({ candidateName: '', adjustment: '' });
  const [judgeIdToAdd, setJudgeIdToAdd] = useState('');

  const [candidateDetailsForm, setCandidateDetailsForm] = useState({ candidateId: '', order: '', time: '', estimatedTime: '' });

  const apiBase = process.env.API_FESTIVAL || 'http://localhost:3015';

  const getToken = useCallback(() => {
    return localStorage.getItem('festivalAdminToken') || localStorage.getItem('token') || localStorage.getItem('authToken') || '';
  }, []);

  const apiRequest = useCallback(async (method, path, data) => {
    const token = getToken();
    if (!token) throw new Error('Token de admin nao encontrado. Faca login novamente.');
    return axios({
      method,
      url: `${apiBase}${path}`,
      data,
      headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' }
    });
  }, [apiBase, getToken]);

  const loadSessions = useCallback(async () => {
    setIsLoading(true);
    setErrorMsg('');
    try {
      const response = await apiRequest('get', '/api/sessions');
      const nextSessions = response?.data?.sessions || [];
      setSessions(nextSessions);
    } catch (error) {
      setErrorMsg(formatErrorMessage(error));
    } finally {
      setIsLoading(false);
    }
  }, [apiRequest]);

  const loadSelectedSessionResults = useCallback(async (sessionId) => {
    if (!sessionId) return;
    try {
      const response = await apiRequest('get', `/api/sessions/${sessionId}/results`);
      setResultsData(response?.data || null);
    } catch (error) {
      setResultsData(null);
    }
  }, [apiRequest]);

  const loadSessionJudges = useCallback(async (sessionId) => {
    if (!sessionId) return;
    try {
      const response = await apiRequest('get', `/api/sessions/${sessionId}/judges`);
      setSessionJudges(response?.data?.judges || []);
    } catch (error) {
      setSessionJudges([]);
    }
  }, [apiRequest]);

  const loadAllJudges = useCallback(async () => {
    try {
      const response = await apiRequest('get', '/api/admin/judges');
      setAllJudges(response?.data?.judges || []);
    } catch (error) {
      setAllJudges([]);
    }
  }, [apiRequest]);

  useEffect(() => {
    loadSessions();
    loadAllJudges();
  }, [loadSessions, loadAllJudges]);

  useEffect(() => {
    if (!selectedSessionId) {
      setResultsData(null);
      setSessionJudges([]);
      setActiveCandidateName('');
      setCandidateNameToRemove('');
      setCandidateNamesCsv('');
      setScoreCorrection({ candidateName: '', adjustment: '' });
      return;
    }
    loadSelectedSessionResults(selectedSessionId);
    loadSessionJudges(selectedSessionId);
  }, [loadSelectedSessionResults, loadSessionJudges, selectedSessionId]);

  const selectedSession = useMemo(() => sessions.find((item) => Number(item.id) === Number(selectedSessionId)) || null, [sessions, selectedSessionId]);

  const candidateOptions = useMemo(() => {
    const collected = [];
    collectCandidateEntries(selectedSession, collected);
    collectCandidateEntries(resultsData, collected);
    const uniqueCandidates = new Map();
    collected.forEach((candidate) => {
      const name = String(candidate.name || '').trim();
      if (!name) return;
      const candidateId = Number(candidate.id);
      const key = Number.isFinite(candidateId) && candidateId > 0 ? `id:${candidateId}` : `name:${normalizeText(name)}`;
      if (!uniqueCandidates.has(key)) {
        uniqueCandidates.set(key, { id: Number.isFinite(candidateId) && candidateId > 0 ? candidateId : null, name });
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
    setSessionForm({
      title: selectedSession.title || '',
      session_date: selectedSession.session_date || '',
      session_time: selectedSession.session_time || '',
      location: selectedSession.location || '',
      status: selectedSession.status || 'waiting',
      winners_count_judges: String(selectedSession.winners_count_judges || 3),
      winners_count_public: String(selectedSession.winners_count_public || 1),
      is_public_voting_open: Boolean(selectedSession.is_public_voting_open)
    });

    const activeCandidateId = selectedSession.active_candidate_id;
    const activeCandidateById = candidateOptions.find((candidate) => String(candidate.id) === String(activeCandidateId));
    setActiveCandidateName(activeCandidateById?.name || '');
  }, [selectedSession, candidateOptions]);

  const filteredSessions = useMemo(() => {
    if (activeTab === 'all') return sessions;
    if (activeTab === 'running') return sessions.filter((item) => item.status === 'public_voting' || item.status === 'judge_voting');
    return sessions.filter((item) => item.status === 'waiting');
  }, [activeTab, sessions]);

  const counters = useMemo(() => {
    const today = new Date().toISOString().slice(0, 10);
    const todayCount = sessions.filter((item) => item.session_date && item.session_date.slice(0, 10) === today).length;
    const scheduled = sessions.filter((item) => item.status === 'waiting').length;
    return { todayCount, scheduled };
  }, [sessions]);

  const runAction = async (fn, successMessage) => {
    setIsSaving(true);
    setErrorMsg('');
    setSuccessMsg('');
    try {
      await fn();
      if (successMessage) setSuccessMsg(successMessage);
      await loadSessions();
      if (selectedSessionId) {
        await loadSelectedSessionResults(selectedSessionId);
        await loadSessionJudges(selectedSessionId);
      }
    } catch (error) {
      setErrorMsg(formatErrorMessage(error));
    } finally {
      setIsSaving(false);
    }
  };

  const handleCreateSession = async (event) => {
    event.preventDefault();
    await runAction(async () => {
      const payload = {
        title: createForm.title, session_date: createForm.session_date || undefined, session_time: createForm.session_time || undefined,
        location: createForm.location || undefined, status: createForm.status, winners_count_judges: Number(createForm.winners_count_judges),
        winners_count_public: Number(createForm.winners_count_public), is_public_voting_open: Boolean(createForm.is_public_voting_open)
      };
      const response = await apiRequest('post', '/api/sessions', payload);
      const created = response?.data?.session;
      if (created?.id) setSelectedSessionId(created.id);
      setCreateForm((current) => ({ ...current, title: '', location: '' }));
    }, 'Sessão criada com sucesso.');
  };

  const handleUpdateSessionDetails = async (event) => {
    event.preventDefault();
    if (!selectedSessionId) return;
    await runAction(() => apiRequest('patch', `/api/sessions/${selectedSessionId}`, {
      title: sessionForm.title, session_date: sessionForm.session_date || null, session_time: sessionForm.session_time || null,
      location: sessionForm.location || null, status: sessionForm.status,
      winners_count_judges: Number(sessionForm.winners_count_judges), winners_count_public: Number(sessionForm.winners_count_public),
      is_public_voting_open: Boolean(sessionForm.is_public_voting_open)
    }), 'Dados gerais da sessão atualizados.');
  };

  const handleUpdateStatus = async (nextStatus) => {
    if (!selectedSessionId) return;
    await runAction(() => apiRequest('patch', `/api/sessions/${selectedSessionId}/status`, { status: nextStatus }),
      `Status alterado para ${STATUS_LABELS[nextStatus] || nextStatus}.`);
  };

  const handleSetActiveCandidate = async (event) => {
    event.preventDefault();
    if (!selectedSessionId) return;
    const match = findCandidateMatch(activeCandidateName, candidateOptions);
    if (!match?.id) {
      setErrorMsg('Selecione um nome artístico válido para definir o candidato ativo.');
      return;
    }
    await runAction(() => apiRequest('patch', `/api/sessions/${selectedSessionId}/active-candidate`, { active_candidate_id: Number(match.id) }),
      `Candidato ativo atualizado para ${match.name}.`);
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
    const resolvedCandidates = candidateNames.map((candidateName) => ({ candidateName, match: findCandidateMatch(candidateName, candidateOptions) }));
    const unresolvedCandidate = resolvedCandidates.find((item) => !item.match?.id);
    if (unresolvedCandidate) {
      setErrorMsg(`Não encontrei correspondência para "${unresolvedCandidate.candidateName}".`);
      return;
    }
    await runAction(() => apiRequest('post', `/api/sessions/${selectedSessionId}/candidates`, { candidate_ids: resolvedCandidates.map((item) => Number(item.match.id)) }),
      'Candidatos vinculados a sessão.');
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
    await runAction(() => apiRequest('delete', `/api/sessions/${selectedSessionId}/candidates/${Number(match.id)}`), 'Candidato removido da sessão.');
    setCandidateNameToRemove('');
  };

  const handleUpdateCandidateDetails = async (event) => {
    event.preventDefault();
    if (!selectedSessionId) return;
    if (!candidateDetailsForm.candidateId) {
      setErrorMsg('Selecione um candidato na lista para atualizar.');
      return;
    }
    await runAction(() => apiRequest('patch', `/api/sessions/${selectedSessionId}/candidates/${candidateDetailsForm.candidateId}/details`, {
      presentation_order: candidateDetailsForm.order, presentation_time: candidateDetailsForm.time, estimated_time: candidateDetailsForm.estimatedTime
    }), 'Detalhes de apresentação salvos.');
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
    await runAction(() => apiRequest('patch', `/api/sessions/${selectedSessionId}/candidates/${Number(match.id)}/score-correction`, { adjustment }),
      'Correção de pontuação aplicada.');
    setScoreCorrection((current) => ({ ...current, candidateName: match.name }));
  };

  const handleAddJudge = async (event) => {
    event.preventDefault();
    if (!selectedSessionId || !judgeIdToAdd) return;
    await runAction(() => apiRequest('post', `/api/sessions/${selectedSessionId}/judges`, { judge_id: Number(judgeIdToAdd) }), 'Juiz vinculado à sessão.');
    setJudgeIdToAdd('');
  };

  const handleRemoveJudge = async (judgeId) => {
    if (!selectedSessionId) return;
    await runAction(() => apiRequest('delete', `/api/sessions/${selectedSessionId}/judges/${judgeId}`), 'Juiz removido da sessão.');
  };

  return (
    <div className="sessoes-admin-container" onClick={() => setDropdownOpenId(null)}>
      {/* Top Banner */}
      <div className="sessoes-banner">
        <div className="sessoes-banner-content">
          <p className="sessoes-banner-kicker">MÓDULO DE SESSÕES</p>
          <h2 className="sessoes-banner-title">Prepare o palco para as<br/>próximas apresentações.</h2>
          <form className="sessoes-create-form" onSubmit={handleCreateSession}>
            <input type="text" placeholder="Titulo da sessao" value={createForm.title} onChange={(e) => setCreateForm(c => ({ ...c, title: e.target.value }))} required />
            <input type="date" value={createForm.session_date} onChange={(e) => setCreateForm(c => ({ ...c, session_date: e.target.value }))} />
            <input type="time" value={createForm.session_time} onChange={(e) => setCreateForm(c => ({ ...c, session_time: e.target.value }))} />
            <button className="sessoes-banner-btn" type="submit" disabled={isSaving}><Plus size={18} /> Criar Nova Sessão</button>
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

      <div className="sessoes-recentes-header">
        <div className="sessoes-recentes-title">
          <h3>Sessões Recentes</h3>
          <div className="title-line"></div>
        </div>
        <div className="sessoes-recentes-tabs">
          <button className={`tab-btn ${activeTab === 'all' ? 'active' : ''}`} onClick={() => setActiveTab('all')}>TODAS</button>
          <button className={`tab-btn ${activeTab === 'running' ? 'active' : ''}`} onClick={() => setActiveTab('running')}>EM ANDAMENTO</button>
          <button className={`tab-btn ${activeTab === 'drafts' ? 'active' : ''}`} onClick={() => setActiveTab('drafts')}>RASCUNHOS</button>
          <button className="tab-btn" onClick={loadSessions} disabled={isLoading}><RefreshCw size={14} /> Atualizar</button>
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
                <button className="action-btn" onClick={(e) => { e.stopPropagation(); setDropdownOpenId(dropdownOpenId === session.id ? null : session.id); }}>
                  <MoreVertical size={20} />
                </button>
                {dropdownOpenId === session.id && (
                  <div className="action-menu">
                    <button className="action-menu-item" onClick={() => console.log('View session public page:', session.id)}><Eye size={14} style={{ marginRight: 6, display:'inline', verticalAlign:'middle' }}/> Ver</button>
                    <button className="action-menu-item" onClick={() => setSelectedSessionId(session.id)}><Edit2 size={14} style={{ marginRight: 6, display:'inline', verticalAlign:'middle' }}/> Editar</button>
                    <button className="action-menu-item delete" onClick={() => alert('Excluir sessão ainda não implementado')}><Trash2 size={14} style={{ marginRight: 6, display:'inline', verticalAlign:'middle' }}/> Excluir</button>
                  </div>
                )}
              </div>
            </div>
          ))}
          {!isLoading && filteredSessions.length === 0 && <div className="sessoes-empty">Nenhuma sessão encontrada para este filtro.</div>}
        </div>
      </div>

      {selectedSession && (
        <section className="sessoes-control-panel">
          <div className="sessoes-control-header">
            <h3>Gerenciar: {selectedSession.title || `Sessao ${selectedSession.id}`}</h3>
            <p>ID #{selectedSession.id} • Status: {STATUS_LABELS[selectedSession.status] || selectedSession.status}</p>
            <div className="sessoes-tabs">
              <button className={`sessoes-tab-btn ${activeSessionTab === 'dados' ? 'active' : ''}`} onClick={() => setActiveSessionTab('dados')}>Dados Gerais</button>
              <button className={`sessoes-tab-btn ${activeSessionTab === 'candidatos' ? 'active' : ''}`} onClick={() => setActiveSessionTab('candidatos')}>Candidatos</button>
              <button className={`sessoes-tab-btn ${activeSessionTab === 'votacao' ? 'active' : ''}`} onClick={() => setActiveSessionTab('votacao')}>Votação</button>
              <button className={`sessoes-tab-btn ${activeSessionTab === 'juizes' ? 'active' : ''}`} onClick={() => setActiveSessionTab('juizes')}>Juízes</button>
            </div>
          </div>

          <div className="sessoes-tab-content">
            {activeSessionTab === 'dados' && (
              <form className="control-grid" onSubmit={handleUpdateSessionDetails}>
                <div className="control-card">
                  <h4>Informações Básicas</h4>
                  <label>Título da Sessão</label>
                  <input type="text" value={sessionForm.title} onChange={(e) => setSessionForm(c => ({ ...c, title: e.target.value }))} required />
                  <label>Local</label>
                  <input type="text" value={sessionForm.location} onChange={(e) => setSessionForm(c => ({ ...c, location: e.target.value }))} />
                  <div className="inline-fields">
                    <div><label>Data</label><input type="date" value={sessionForm.session_date} onChange={(e) => setSessionForm(c => ({ ...c, session_date: e.target.value }))} /></div>
                    <div><label>Hora</label><input type="time" value={sessionForm.session_time} onChange={(e) => setSessionForm(c => ({ ...c, session_time: e.target.value }))} /></div>
                  </div>
                </div>
                <div className="control-card">
                  <h4>Premiação e Status</h4>
                  <label>Status</label>
                  <select value={sessionForm.status} onChange={(e) => setSessionForm(c => ({ ...c, status: e.target.value }))}>
                    {STATUS_OPTIONS.map((st) => <option key={st} value={st}>{STATUS_LABELS[st]}</option>)}
                  </select>
                  <label>Vencedores (Júri Técnico)</label>
                  <input type="number" min="0" value={sessionForm.winners_count_judges} onChange={(e) => setSessionForm(c => ({ ...c, winners_count_judges: e.target.value }))} />
                  <label>Vencedores (Voto Público)</label>
                  <input type="number" min="0" value={sessionForm.winners_count_public} onChange={(e) => setSessionForm(c => ({ ...c, winners_count_public: e.target.value }))} />
                  <label><input type="checkbox" checked={sessionForm.is_public_voting_open} onChange={(e) => setSessionForm(c => ({ ...c, is_public_voting_open: e.target.checked }))} /> Votação Popular Aberta</label>
                  <button type="submit" disabled={isSaving} style={{ marginTop: 'auto' }}>Salvar Dados Gerais</button>
                </div>
              </form>
            )}

            {activeSessionTab === 'candidatos' && (
              <div className="control-grid">
                <div className="control-card">
                  <h4>Adicionar Candidatos</h4>
                  <form onSubmit={handleAddCandidates}>
                    <CandidateLookupField
                      label="Nomes Artísticos"
                      value={candidateNamesCsv}
                      onChange={(e) => setCandidateNamesCsv(e.target.value)}
                      options={filterCandidateOptions(candidateNamesCsv)}
                      placeholder="Maria do Forró, João da Sanfona"
                      helperText="Separe por vírgula ou quebra de linha."
                      onSelect={setCandidateNamesCsv}
                      rows={3}
                    />
                    <button type="submit" disabled={isSaving}>Vincular à Sessão</button>
                  </form>
                  <form onSubmit={handleRemoveCandidate} style={{ marginTop: 24 }}>
                    <CandidateLookupField
                      label="Remover Candidato"
                      value={candidateNameToRemove}
                      onChange={(e) => setCandidateNameToRemove(e.target.value)}
                      options={filterCandidateOptions(candidateNameToRemove)}
                      placeholder="Nome do candidato"
                      helperText="Localize para remover da sessão."
                      onSelect={setCandidateNameToRemove}
                      rows={1}
                    />
                    <button type="submit" className="danger" disabled={isSaving}>Remover</button>
                  </form>
                </div>
                <div className="control-card">
                  <h4>Ordem e Horário ({resultsData?.final_ranking?.length || 0})</h4>
                  <div className="ranking-box" style={{ flex: 1, overflowY: 'auto', marginBottom: 12 }}>
                    <ul>
                      {resultsData?.final_ranking?.map((row) => (
                        <li key={row.candidate_id} style={{ cursor: 'pointer' }} onClick={() => setCandidateDetailsForm({ candidateId: row.candidate_id, order: '', time: '' })}>
                          <span>#{row.candidate_id} - {row.artistic_name || row.name}</span>
                          <span style={{ fontSize: 11, color: '#6B7280' }}>Selecionar</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                  <form onSubmit={handleUpdateCandidateDetails}>
                    <div className="inline-fields">
                      <div><label>ID Candidato</label><input type="text" readOnly value={candidateDetailsForm.candidateId} placeholder="Clique na lista" required /></div>
                      <div><label>Ordem</label><input type="number" min="0" value={candidateDetailsForm.order} onChange={(e) => setCandidateDetailsForm(c => ({...c, order: e.target.value}))} /></div>
                      <div><label>Horário</label><input type="time" value={candidateDetailsForm.time} onChange={(e) => setCandidateDetailsForm(c => ({...c, time: e.target.value}))} /></div>
                    </div>
                    <button type="submit" disabled={!candidateDetailsForm.candidateId || isSaving} style={{ marginTop: 8 }}>Salvar Ordem/Horário</button>
                  </form>
                </div>
              </div>
            )}

            {activeSessionTab === 'votacao' && (
              <div className="control-grid">
                <div className="control-card">
                  <h4>Status da Votação</h4>
                  <div className="status-buttons">
                    {STATUS_OPTIONS.map((st) => (
                      <button type="button" className={selectedSession.status === st ? '' : 'secondary'} key={st} onClick={() => handleUpdateStatus(st)} disabled={isSaving}>
                        {STATUS_LABELS[st]}
                      </button>
                    ))}
                  </div>
                  <form onSubmit={handleSetActiveCandidate} style={{ marginTop: 24 }}>
                    <CandidateLookupField
                      label="Candidato Ativo (Para avaliação dos juízes)"
                      value={activeCandidateName}
                      onChange={(e) => setActiveCandidateName(e.target.value)}
                      options={filterCandidateOptions(activeCandidateName)}
                      placeholder="Nome do candidato no palco"
                      helperText="O júri só poderá votar neste candidato."
                      onSelect={setActiveCandidateName}
                      rows={2}
                    />
                    <button type="submit" disabled={isSaving}>Definir Candidato Ativo</button>
                  </form>
                </div>
                <div className="control-card">
                  <h4>Correção de Pontuação e Auditoria</h4>
                  <form onSubmit={handleScoreCorrection}>
                    <CandidateLookupField
                      label="Candidato"
                      value={scoreCorrection.candidateName}
                      onChange={(e) => setScoreCorrection(c => ({ ...c, candidateName: e.target.value }))}
                      options={filterCandidateOptions(scoreCorrection.candidateName)}
                      placeholder="Nome artístico"
                      helperText="Erro relatado pelos jurados? Corrija aqui."
                      onSelect={(val) => setScoreCorrection(c => ({ ...c, candidateName: val }))}
                      rows={2}
                    />
                    <label>Ajuste na nota final (ex: -1.5, 2.0)</label>
                    <input type="number" step="0.01" value={scoreCorrection.adjustment} onChange={(e) => setScoreCorrection(c => ({ ...c, adjustment: e.target.value }))} required />
                    <button type="submit" disabled={isSaving}>Aplicar Correção</button>
                  </form>
                </div>
              </div>
            )}

            {activeSessionTab === 'juizes' && (
              <div className="control-grid">
                <div className="control-card">
                  <h4>Vincular Juiz à Sessão</h4>
                  <form onSubmit={handleAddJudge}>
                    <label>Selecione o Juiz</label>
                    <select value={judgeIdToAdd} onChange={(e) => setJudgeIdToAdd(e.target.value)} required>
                      <option value="">Selecione um juiz...</option>
                      {allJudges.map(j => (
                        <option key={j.id} value={j.id}>{j.name} ({j.email})</option>
                      ))}
                    </select>
                    <button type="submit" disabled={isSaving} style={{ marginTop: 12 }}>Adicionar Juiz</button>
                  </form>
                </div>
                <div className="control-card">
                  <h4>Juízes Escalados ({sessionJudges.length})</h4>
                  <div className="ranking-box">
                    {sessionJudges.length === 0 ? <p style={{ fontSize: 13 }}>Nenhum juiz vinculado.</p> : (
                      <ul>
                        {sessionJudges.map(j => (
                          <li key={j.id}>
                            <span>{j.name}</span>
                            <button type="button" className="action-btn" style={{ background: 'none', border: 'none', color: '#DC2626', cursor: 'pointer' }} onClick={() => handleRemoveJudge(j.id)}><Trash2 size={14}/></button>
                          </li>
                        ))}
                      </ul>
                    )}
                  </div>
                </div>
              </div>
            )}

          </div>
        </section>
      )}

      {/* Info Cards Row */}
      <div className="sessoes-info-cards">
        <div className="info-card highlight">
          <p className="card-kicker">DESTAQUE DO DIA</p>
          <p className="card-text">Sessão "Noite de São João" está com 95% de ocupação técnica.</p>
          <button type="button" className="card-link as-btn"><ArrowRight size={14} /></button>
          <div className="card-bg-shape highlight-shape"></div>
        </div>
        <div className="info-card alert">
          <p className="card-kicker alert-color">AVISO JURADOS</p>
          <p className="card-text">Verifique se todos os jurados estão vinculados nas sessões de hoje.</p>
          <div className="card-bg-shape alert-shape"></div>
        </div>
        <div className="info-card logistics">
          <p className="card-kicker logistics-color">LOGÍSTICA</p>
          <p className="card-text">A ordem dos candidatos deve ser preenchida antes do início.</p>
          <div className="card-bg-shape logistics-shape"></div>
        </div>
      </div>
    </div>
  );
};

export default SessoesAdmin;
