import React, { useCallback, useEffect, useMemo, useState } from 'react';
import axios from 'axios';
import { Plus, MoreVertical, ArrowRight, RefreshCw, Trash2, Edit2, Eye, GripVertical } from 'lucide-react';
import { DndContext, PointerSensor, closestCenter, useSensor, useSensors } from '@dnd-kit/core';
import { SortableContext, arrayMove, useSortable, verticalListSortingStrategy } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
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

const getApiOrigin = (apiBase) => {
  const normalizedBase = String(apiBase || '').trim();
  if (!normalizedBase) return '';
  try {
    return new URL(normalizedBase).origin;
  } catch (error) {
    return normalizedBase.replace(/\/api\/?$/, '').replace(/\/$/, '');
  }
};

const buildCandidatePhotoSrc = (rawValue, apiBase) => {
  const value = String(rawValue || '').trim();
  if (!value) return '';
  if (/^https?:\/\//i.test(value)) return value;
  if (value.startsWith('/uploads/') || value.startsWith('uploads/')) {
    const origin = getApiOrigin(apiBase);
    const normalizedPath = value.startsWith('/') ? value : `/${value}`;
    return origin ? `${origin}${normalizedPath}` : normalizedPath;
  }
  return value;
};

const collectCandidateEntries = (source, bucket = []) => {
  if (!source) return bucket;
  if (Array.isArray(source)) {
    source.forEach((item) => collectCandidateEntries(item, bucket));
    return bucket;
  }
  if (typeof source !== 'object') return bucket;
  const candidateName = source.artistic_name || source.name || source.candidate_name || source.label;
  const candidateId = source.candidate_id ?? source.candidateId ?? source.id ?? source.user_id;
  const photo = source.profile_photo_url || source.profile_photo || source.photo_url || source.avatar || source.image;
  const presentationOrder = source.presentation_order ?? source.order ?? source.position;
  const presentationTime = source.presentation_time ?? source.time ?? source.horario;
  const estimatedTime = source.estimated_time ?? source.estimatedTime;
  if (candidateName || candidateId) {
    bucket.push({
      id: Number(candidateId),
      name: String(candidateName || '').trim(),
      photo: String(photo || '').trim(),
      presentationOrder: Number(presentationOrder),
      presentationTime: String(presentationTime || '').trim(),
      estimatedTime: String(estimatedTime || '').trim()
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

const getTransmissionLabel = (mode) => {
  if (mode === 'total_public_votes') return 'Total de votos públicos';
  if (mode === 'ranking_public') return 'Ranking dos votos públicos';
  if (mode === 'ranking_judges') return 'Ranking dos votos dos jurados';
  if (mode === 'winners') return 'Vencedores';
  if (mode === 'current_candidate_score') return 'Pontuação do candidato';
  if (mode === 'idle') return 'Tela em branco';
  return 'Tela da transmissão';
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

const SortableCandidateRow = ({ candidate, onTimeChange }) => {
  const { attributes, listeners, setNodeRef, transform, transition } = useSortable({ id: String(candidate.id) });
  const style = {
    transform: CSS.Transform.toString(transform),
    transition
  };

  return (
    <tr ref={setNodeRef} style={style} className="candidate-table-row sortable-row">
      <td className="drag-cell">
        <button type="button" className="drag-handle" aria-label={`Mover ${candidate.name}`} {...attributes} {...listeners}>
          <GripVertical size={16} />
        </button>
      </td>
      <td>
        <div className="candidate-cell-content">
          {candidate.photo ? <img src={candidate.photo} alt={candidate.name} className="candidate-avatar" /> : <div className="candidate-avatar placeholder">{String(candidate.name || '?').slice(0, 1).toUpperCase()}</div>}
          <span>{candidate.name}</span>
        </div>
      </td>
      <td className="order-cell">{candidate.order}</td>
      <td>
        <input
          type="time"
          value={candidate.time}
          onChange={(event) => onTimeChange(candidate.id, event.target.value)}
          className="time-input"
        />
      </td>
    </tr>
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
  const [allCandidates, setAllCandidates] = useState([]);
  const [auditData, setAuditData] = useState([]);
  const [auditModalData, setAuditModalData] = useState(null);
  const [editingVoteId, setEditingVoteId] = useState(null);
  const [editVoteForm, setEditVoteForm] = useState({});

  const [createForm, setCreateForm] = useState({
    title: '', session_date: '', session_time: '', location: '', status: 'waiting', winners_count_judges: '3', winners_count_public: '1', candidates_limit: '12', is_public_voting_open: false
  });

  const [sessionForm, setSessionForm] = useState({
    title: '', session_date: '', session_time: '', location: '', status: 'waiting', winners_count_judges: '3', winners_count_public: '1', candidates_limit: '12', is_public_voting_open: false
  });

  const [activeCandidateName, setActiveCandidateName] = useState('');
  const [scoreCorrection, setScoreCorrection] = useState({ candidateName: '', adjustment: '' });

  const [sortableCandidates, setSortableCandidates] = useState([]);
  const [deleteConfirmModalId, setDeleteConfirmModalId] = useState(null);
  const [broadcastMode, setBroadcastMode] = useState('idle');
  const [isBroadcastLoading, setIsBroadcastLoading] = useState(false);

  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 5 } }));

  const apiBase = process.env.API_FESTIVAL || 'http://localhost:3015';

  const getToken = useCallback(() => {
    return localStorage.getItem('festivalAdminToken') || localStorage.getItem('token') || localStorage.getItem('authToken') || '';
  }, []);

  const apiRequest = useCallback(async (method, path, data, params) => {
    const token = getToken();
    if (!token) throw new Error('Token de admin nao encontrado. Faca login novamente.');
    return axios({
      method,
      url: `${apiBase}${path}`,
      data,
      params,
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

  const loadSessionBroadcast = useCallback(async (sessionId) => {
    if (!sessionId) return;

    setIsBroadcastLoading(true);
    try {
      const response = await apiRequest('get', `/api/sessions/${sessionId}/broadcast`);
      const nextBroadcast = response?.data?.broadcast || { display_mode: 'idle', show_names: true };
      setBroadcastMode(nextBroadcast.display_mode || 'idle');
    } catch (error) {
      setBroadcastMode('none');
    } finally {
      setIsBroadcastLoading(false);
    }
  }, [apiRequest]);

  const loadAuditData = useCallback(async (sessionId) => {
    if (!sessionId) return;
    try {
      const response = await apiRequest('get', `/api/sessions/${sessionId}/audit`);
      setAuditData(response?.data?.auditData || []);
    } catch (error) {
      setAuditData([]);
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

  const loadAllCandidates = useCallback(async () => {
    try {
      let page = 1;
      const limit = 100;
      let keepLoading = true;
      let merged = [];

      while (keepLoading) {
        const response = await apiRequest('get', '/api/admin/candidates', undefined, { page, limit });
        const pageCandidates = Array.isArray(response?.data?.candidates) ? response.data.candidates : [];
        const total = Number(response?.data?.pagination?.total || 0);
        merged = merged.concat(pageCandidates);

        const reachedTotal = total > 0 && merged.length >= total;
        keepLoading = pageCandidates.length === limit && !reachedTotal;
        page += 1;
        if (page > 50) keepLoading = false;
      }

      setAllCandidates(merged);
    } catch (error) {
      setAllCandidates([]);
    }
  }, [apiRequest]);

  useEffect(() => {
    loadSessions();
    loadAllJudges();
    loadAllCandidates();
  }, [loadSessions, loadAllJudges, loadAllCandidates]);

  useEffect(() => {
    if (!selectedSessionId) {
      setResultsData(null);
      setSessionJudges([]);
      setAuditData([]);
      setBroadcastMode('idle');
      setActiveCandidateName('');
      setScoreCorrection({ candidateName: '', adjustment: '' });
      setSortableCandidates([]);
      return;
    }
    loadSelectedSessionResults(selectedSessionId);
    loadSessionJudges(selectedSessionId);
    loadAuditData(selectedSessionId);
    loadSessionBroadcast(selectedSessionId);
  }, [loadSelectedSessionResults, loadSessionJudges, loadAuditData, loadSessionBroadcast, selectedSessionId]);

  const selectedSession = useMemo(() => sessions.find((item) => Number(item.id) === Number(selectedSessionId)) || null, [sessions, selectedSessionId]);

  const allCandidatesCatalog = useMemo(() => {
    const map = new Map();
    allCandidates.forEach((candidate) => {
      const id = Number(candidate.id);
      if (!Number.isFinite(id) || id <= 0) return;
      const name = String(candidate.artistic_name || candidate.name || '').trim();
      map.set(id, {
        id,
        name,
        photo: buildCandidatePhotoSrc(candidate.profile_photo_url || candidate.profile_photo || '', apiBase)
      });
    });
    return Array.from(map.values()).sort((left, right) => left.name.localeCompare(right.name, 'pt-BR'));
  }, [allCandidates, apiBase]);

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
        uniqueCandidates.set(key, {
          id: Number.isFinite(candidateId) && candidateId > 0 ? candidateId : null,
          name,
          photo: buildCandidatePhotoSrc(candidate.photo || '', apiBase),
          presentationOrder: Number(candidate.presentationOrder),
          presentationTime: String(candidate.presentationTime || '').trim(),
          estimatedTime: String(candidate.estimatedTime || '').trim()
        });
      }
    });
    return Array.from(uniqueCandidates.values()).sort((left, right) => left.name.localeCompare(right.name, 'pt-BR'));
  }, [apiBase, resultsData, selectedSession]);

  useEffect(() => {
    if (!selectedSessionId) {
      setSortableCandidates([]);
      return;
    }

    const fromSession = candidateOptions.filter((candidate) => Number.isFinite(Number(candidate.id)) && Number(candidate.id) > 0);
    const mergedById = new Map();

    fromSession.forEach((candidate, index) => {
      const id = Number(candidate.id);
      if (!Number.isFinite(id) || id <= 0) return;
      const catalogCandidate = allCandidatesCatalog.find((item) => item.id === id);
      mergedById.set(id, {
        id,
        name: catalogCandidate?.name || candidate.name,
        photo: catalogCandidate?.photo || candidate.photo || '',
        order: Number.isFinite(candidate.presentationOrder) && candidate.presentationOrder > 0 ? Number(candidate.presentationOrder) : index + 1,
        time: candidate.presentationTime || '',
        estimatedTime: candidate.estimatedTime || ''
      });
    });

    setSortableCandidates((previous) => {
      if (!mergedById.size) return [];
      const previousById = new Map(previous.map((item) => [item.id, item]));
      const next = Array.from(mergedById.values()).map((item) => {
        const prev = previousById.get(item.id);
        if (!prev) return item;
        return {
          ...item,
          order: Number(prev.order) > 0 ? Number(prev.order) : item.order,
          time: prev.time || item.time,
          estimatedTime: prev.estimatedTime || item.estimatedTime
        };
      });
      return next
        .sort((left, right) => Number(left.order || 9999) - Number(right.order || 9999))
        .map((item, index) => ({ ...item, order: index + 1 }));
    });
  }, [allCandidatesCatalog, candidateOptions, selectedSessionId]);

  const sessionCandidateIds = useMemo(() => new Set(sortableCandidates.map((candidate) => Number(candidate.id))), [sortableCandidates]);

  const sessionCandidatesLimit = useMemo(() => {
    const rawLimit = sessionForm.candidates_limit ?? selectedSession?.candidates_limit ?? selectedSession?.participants_limit ?? selectedSession?.max_candidates;
    const normalized = Number(rawLimit);
    if (!Number.isFinite(normalized) || normalized <= 0) return 0;
    return Math.floor(normalized);
  }, [sessionForm.candidates_limit, selectedSession]);

  const hasReachedSessionLimit = sessionCandidatesLimit > 0 && sortableCandidates.length >= sessionCandidatesLimit;

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
      candidates_limit: String(selectedSession.candidates_limit ?? selectedSession.participants_limit ?? selectedSession.max_candidates ?? 12),
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
        await loadAuditData(selectedSessionId);
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
        winners_count_public: Number(createForm.winners_count_public), is_public_voting_open: Boolean(createForm.is_public_voting_open),
        candidates_limit: Number(createForm.candidates_limit), participants_limit: Number(createForm.candidates_limit), max_candidates: Number(createForm.candidates_limit)
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
      candidates_limit: Number(sessionForm.candidates_limit), participants_limit: Number(sessionForm.candidates_limit), max_candidates: Number(sessionForm.candidates_limit),
      is_public_voting_open: Boolean(sessionForm.is_public_voting_open)
    }), 'Dados gerais da sessão atualizados.');
  };

  const handleUpdateStatus = async (nextStatus) => {
    if (!selectedSessionId) return;
    await runAction(() => apiRequest('patch', `/api/sessions/${selectedSessionId}/status`, { status: nextStatus }),
      `Status alterado para ${STATUS_LABELS[nextStatus] || nextStatus}.`);
  };

  const handleUpdatePublicVoting = async (isOpen) => {
    if (!selectedSessionId) return;
    await runAction(() => apiRequest('patch', `/api/sessions/${selectedSessionId}`, { is_public_voting_open: isOpen }),
      `Votação popular ${isOpen ? 'aberta' : 'fechada'}.`);
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

  const handleSetActiveCandidateById = async (candidateId) => {
    if (!selectedSessionId) return;
    
    // Atualização otimista para resposta imediata da interface
    setSessions(prev => prev.map(s => 
      s.id === selectedSessionId ? { ...s, active_candidate_id: candidateId } : s
    ));

    await runAction(async () => {
      await apiRequest('patch', `/api/sessions/${selectedSessionId}/active-candidate`, { active_candidate_id: candidateId === null ? null : Number(candidateId) });
    }, `Candidato ativo atualizado.`);
  };

  const handleAddCandidateById = async (candidateId) => {
    if (!selectedSessionId || !candidateId) return;
    if (hasReachedSessionLimit) {
      setErrorMsg(`A sessão atingiu o limite de ${sessionCandidatesLimit} candidato(s). Aumente a quantidade em Dados Gerais para adicionar mais.`);
      return;
    }
    await runAction(() => apiRequest('post', `/api/sessions/${selectedSessionId}/candidates`, { candidate_ids: [Number(candidateId)] }), 'Candidato vinculado à sessão.');
  };

  const handleRemoveCandidateById = async (candidateId) => {
    if (!selectedSessionId || !candidateId) return;
    await runAction(() => apiRequest('delete', `/api/sessions/${selectedSessionId}/candidates/${Number(candidateId)}`), 'Candidato removido da sessão.');
  };

  const handleSortableCandidatesChange = useCallback((candidateId, field, value) => {
    setSortableCandidates((current) => current.map((candidate) => (
      Number(candidate.id) === Number(candidateId) ? { ...candidate, [field]: value } : candidate
    )));
  }, []);

  const handleDragEnd = useCallback((event) => {
    const { active, over } = event;
    if (!over || active.id === over.id) return;
    setSortableCandidates((current) => {
      const oldIndex = current.findIndex((candidate) => String(candidate.id) === String(active.id));
      const newIndex = current.findIndex((candidate) => String(candidate.id) === String(over.id));
      if (oldIndex === -1 || newIndex === -1) return current;
      return arrayMove(current, oldIndex, newIndex).map((candidate, index) => ({ ...candidate, order: index + 1 }));
    });
  }, []);

  const handleSaveOrderAndSchedule = async () => {
    if (!selectedSessionId || !sortableCandidates.length) return;
    const payload = sortableCandidates.map((candidate, index) => ({
      candidateId: Number(candidate.id),
      presentation_order: index + 1,
      presentation_time: candidate.time || null,
      estimated_time: candidate.estimatedTime || null
    }));

    await runAction(async () => {
      await Promise.all(payload.map((item) => apiRequest('patch', `/api/sessions/${selectedSessionId}/candidates/${item.candidateId}/details`, {
        presentation_order: item.presentation_order,
        presentation_time: item.presentation_time,
        estimated_time: item.estimated_time
      })));
    }, 'Ordem e horários salvos com sucesso.');
  };

  const openSessionDetails = useCallback((sessionId) => {
    setSelectedSessionId(sessionId);
    setActiveSessionTab('dados');
    setDropdownOpenId(null);
    window.requestAnimationFrame(() => {
      const panel = document.querySelector('.sessoes-control-panel');
      if (panel) panel.scrollIntoView({ behavior: 'smooth', block: 'start' });
    });
  }, []);

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

  const handleAddJudgeById = async (judgeId) => {
    if (!selectedSessionId || !judgeId) return;
    await runAction(() => apiRequest('post', `/api/sessions/${selectedSessionId}/judges`, { judge_id: Number(judgeId) }), 'Juiz vinculado à sessão.');
  };

  const handleRemoveJudge = async (judgeId) => {
    if (!selectedSessionId) return;
    await runAction(() => apiRequest('delete', `/api/sessions/${selectedSessionId}/judges/${judgeId}`), 'Juiz removido da sessão.');
  };

  const handleSaveVoteEdit = async (judgeId, candidateId) => {
    if (!selectedSessionId) return;
    await runAction(async () => {
      await apiRequest('put', `/api/sessions/${selectedSessionId}/votes/${judgeId}/${candidateId}`, {
        tuning: Number(editVoteForm.tuning),
        stage_presence: Number(editVoteForm.stage_presence),
        harmony: Number(editVoteForm.harmony),
        rhythm: Number(editVoteForm.rhythm),
        interpretation: Number(editVoteForm.interpretation),
        authenticity: Number(editVoteForm.authenticity),
        diction: Number(editVoteForm.diction)
      });
      setEditingVoteId(null);
    }, 'Voto atualizado com sucesso.');
    
    // Atualizar o modal com novos dados
    setAuditModalData(prev => {
      if (!prev) return null;
      const updatedAudit = auditData.find(a => a.candidate_id === prev.candidate_id);
      return updatedAudit ? updatedAudit : prev;
    });
  };

  const handleDeleteVote = async (judgeId, candidateId) => {
    if (!selectedSessionId) return;
    if (!window.confirm('Tem certeza que deseja apagar o voto deste jurado? Ele terá que votar novamente.')) return;
    await runAction(async () => {
      await apiRequest('delete', `/api/sessions/${selectedSessionId}/votes/${judgeId}/${candidateId}`);
    }, 'Voto excluído com sucesso.');
    
    setAuditModalData(prev => {
      if (!prev) return null;
      const updatedAudit = auditData.find(a => a.candidate_id === prev.candidate_id);
      return updatedAudit ? updatedAudit : prev;
    });
  };

  const handleDeleteSession = async (sessionId) => {
    setDeleteConfirmModalId(null);
    setIsSaving(true);
    setErrorMsg('');
    setSuccessMsg('');

    try {
      await apiRequest('delete', `/api/sessions/${Number(sessionId)}`);
      setSuccessMsg('Sessão excluída com sucesso.');
      setSelectedSessionId(null);
      setActiveSessionTab('dados');
      await loadSessions();
    } catch (error) {
      setErrorMsg(formatErrorMessage(error));
    } finally {
      setIsSaving(false);
    }
  };

  const handleBroadcastModeChange = async (mode) => {
    if (!selectedSessionId) return;

    setBroadcastMode(mode);
    try {
      await apiRequest('patch', `/api/sessions/${selectedSessionId}/broadcast`, { display_mode: mode });
      localStorage.setItem(
        `festival-transmission-update-${selectedSessionId}`,
        JSON.stringify({ sessionId: selectedSessionId, display_mode: mode, updatedAt: Date.now() })
      );
    } catch (error) {
      setErrorMsg(formatErrorMessage(error));
    }
  };

  const openBroadcastScreen = async () => {
    if (!selectedSessionId) return;
    const sessionRoute = `${window.location.origin}/festival-forro/admin/transmissao/${selectedSessionId}`;
    window.open(sessionRoute, '_blank', 'noopener,noreferrer');
    // não recarregar aqui — a guia de transmissão será notificada via storage event
  };

  useEffect(() => {
    // Atualiza os dados do modal se os dados de auditoria mudarem no fundo
    if (auditModalData && auditData) {
      const updated = auditData.find(a => a.candidate_id === auditModalData.candidate_id);
      if (updated) setAuditModalData(updated);
    }
  }, [auditData, auditModalData]);

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
            <input type="number" min="1" placeholder="Qtd. candidatos" value={createForm.candidates_limit} onChange={(e) => setCreateForm(c => ({ ...c, candidates_limit: e.target.value }))} />
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
                  <div className="action-menu" onClick={(e) => e.stopPropagation()}>
                    <button className="action-menu-item" onClick={() => openSessionDetails(session.id)}><Eye size={14} style={{ marginRight: 6, display:'inline', verticalAlign:'middle' }}/> Ver</button>
                    <button className="action-menu-item" onClick={() => { setSelectedSessionId(session.id); setDropdownOpenId(null); }}><Edit2 size={14} style={{ marginRight: 6, display:'inline', verticalAlign:'middle' }}/> Editar</button>
                    <button className="action-menu-item delete" onClick={() => setDeleteConfirmModalId(session.id)}><Trash2 size={14} style={{ marginRight: 6, display:'inline', verticalAlign:'middle' }}/> Excluir</button>
                  </div>
                )}
              </div>
            </div>
          ))}
          {!isLoading && filteredSessions.length === 0 && <div className="sessoes-empty">Nenhuma sessão encontrada para este filtro.</div>}
        </div>
      </div>

      {selectedSession && (
        <div 
          className="sessoes-control-modal-overlay" 
          onClick={(e) => {
            if (e.target === e.currentTarget) {
              setSelectedSessionId(null);
              setActiveSessionTab('dados');
            }
          }}
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: 'rgba(0, 0, 0, 0.5)',
            zIndex: 1000,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '20px'
          }}
        >
          <div 
            className="sessoes-control-modal"
            onClick={(e) => e.stopPropagation()}
            style={{
              backgroundColor: 'white',
              borderRadius: '8px',
              boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1)',
              width: '100%',
              maxWidth: '1200px',
              maxHeight: '90vh',
              overflowY: 'auto',
              display: 'flex',
              flexDirection: 'column'
            }}
          >
            <div className="sessoes-control-header" style={{ padding: '24px', borderBottom: '1px solid #e5e7eb', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexShrink: 0 }}>
              <div>
                <h3 style={{ margin: '0 0 4px 0' }}>Gerenciar: {selectedSession.title || `Sessao ${selectedSession.id}`}</h3>
                <p style={{ margin: 0, fontSize: '14px', color: '#6b7280' }}>ID #{selectedSession.id} • Status: {STATUS_LABELS[selectedSession.status] || selectedSession.status}</p>
              </div>
              <button 
                type="button" 
                onClick={() => {
                  setSelectedSessionId(null);
                  setActiveSessionTab('dados');
                }}
                style={{
                  background: 'none',
                  border: 'none',
                  fontSize: '24px',
                  cursor: 'pointer',
                  color: '#6b7280',
                  padding: '0',
                  width: '32px',
                  height: '32px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}
              >
                ×
              </button>
            </div>

            <div className="sessoes-tabs" style={{ padding: '0 24px', borderBottom: '1px solid #e5e7eb', display: 'flex', gap: '0', flexShrink: 0 }}>
              <button 
                className={`sessoes-tab-btn ${activeSessionTab === 'dados' ? 'active' : ''}`} 
                onClick={() => setActiveSessionTab('dados')}
                style={{
                  padding: '12px 16px',
                  border: 'none',
                  background: 'none',
                  cursor: 'pointer',
                  fontSize: '14px',
                  fontWeight: activeSessionTab === 'dados' ? '600' : '500',
                  color: activeSessionTab === 'dados' ? '#1f2937' : '#6b7280',
                  borderBottom: activeSessionTab === 'dados' ? '2px solid #059669' : '2px solid transparent',
                  marginBottom: '-1px'
                }}
              >
                Dados Gerais
              </button>
              <button 
                className={`sessoes-tab-btn ${activeSessionTab === 'candidatos' ? 'active' : ''}`} 
                onClick={() => setActiveSessionTab('candidatos')}
                style={{
                  padding: '12px 16px',
                  border: 'none',
                  background: 'none',
                  cursor: 'pointer',
                  fontSize: '14px',
                  fontWeight: activeSessionTab === 'candidatos' ? '600' : '500',
                  color: activeSessionTab === 'candidatos' ? '#1f2937' : '#6b7280',
                  borderBottom: activeSessionTab === 'candidatos' ? '2px solid #059669' : '2px solid transparent',
                  marginBottom: '-1px'
                }}
              >
                Candidatos
              </button>
              <button 
                className={`sessoes-tab-btn ${activeSessionTab === 'votacao' ? 'active' : ''}`} 
                onClick={() => setActiveSessionTab('votacao')}
                style={{
                  padding: '12px 16px',
                  border: 'none',
                  background: 'none',
                  cursor: 'pointer',
                  fontSize: '14px',
                  fontWeight: activeSessionTab === 'votacao' ? '600' : '500',
                  color: activeSessionTab === 'votacao' ? '#1f2937' : '#6b7280',
                  borderBottom: activeSessionTab === 'votacao' ? '2px solid #059669' : '2px solid transparent',
                  marginBottom: '-1px'
                }}
              >
                Votação
              </button>
              <button 
                className={`sessoes-tab-btn ${activeSessionTab === 'juizes' ? 'active' : ''}`} 
                onClick={() => setActiveSessionTab('juizes')}
                style={{
                  padding: '12px 16px',
                  border: 'none',
                  background: 'none',
                  cursor: 'pointer',
                  fontSize: '14px',
                  fontWeight: activeSessionTab === 'juizes' ? '600' : '500',
                  color: activeSessionTab === 'juizes' ? '#1f2937' : '#6b7280',
                  borderBottom: activeSessionTab === 'juizes' ? '2px solid #059669' : '2px solid transparent',
                  marginBottom: '-1px'
                }}
              >
                Juízes
              </button>
              <button 
                className={`sessoes-tab-btn ${activeSessionTab === 'transmissao' ? 'active' : ''}`} 
                onClick={() => setActiveSessionTab('transmissao')}
                style={{
                  padding: '12px 16px',
                  border: 'none',
                  background: 'none',
                  cursor: 'pointer',
                  fontSize: '14px',
                  fontWeight: activeSessionTab === 'transmissao' ? '600' : '500',
                  color: activeSessionTab === 'transmissao' ? '#1f2937' : '#6b7280',
                  borderBottom: activeSessionTab === 'transmissao' ? '2px solid #059669' : '2px solid transparent',
                  marginBottom: '-1px'
                }}
              >
                Transmissão
              </button>
            </div>

            <div className="sessoes-tab-content" style={{ padding: '24px', flexGrow: 1, overflowY: 'auto' }}>
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
                  <label>Quantidade de Candidatos na Sessão</label>
                  <input type="number" min="1" value={sessionForm.candidates_limit} onChange={(e) => setSessionForm(c => ({ ...c, candidates_limit: e.target.value }))} />
                  <label><input type="checkbox" checked={sessionForm.is_public_voting_open} onChange={(e) => setSessionForm(c => ({ ...c, is_public_voting_open: e.target.checked }))} /> Votação Popular Aberta</label>
                  <button type="submit" disabled={isSaving} style={{ marginTop: 'auto' }}>Salvar Dados Gerais</button>
                </div>
              </form>
            )}

            {activeSessionTab === 'candidatos' && (
              <div className="control-grid">
                <div className="control-card">
                  <h4>
                    Candidatos da Sessão ({sortableCandidates.length}{sessionCandidatesLimit > 0 ? `/${sessionCandidatesLimit}` : ''})
                  </h4>
                  {hasReachedSessionLimit && (
                    <div className="sessoes-alert erro" style={{ marginBottom: 8 }}>
                      Limite da sessão atingido. Ajuste a quantidade de candidatos em Dados Gerais.
                    </div>
                  )}
                  <div className="candidate-table-wrapper">
                    <table className="candidate-table">
                      <thead>
                        <tr>
                          <th>Foto</th>
                          <th>Nome Artístico</th>
                          <th>Ação</th>
                        </tr>
                      </thead>
                    </table>
                    <div className="candidate-table-scroll">
                      <table className="candidate-table">
                        <tbody>
                          {allCandidatesCatalog.map((candidate) => {
                            const isInSession = sessionCandidateIds.has(Number(candidate.id));
                            return (
                              <tr key={candidate.id} className="candidate-table-row">
                                <td>
                                  <div className="candidate-cell-content">
                                    {candidate.photo ? <img src={candidate.photo} alt={candidate.name} className="candidate-avatar" /> : <div className="candidate-avatar placeholder">{String(candidate.name || '?').slice(0, 1).toUpperCase()}</div>}
                                  </div>
                                </td>
                                <td>{candidate.name}</td>
                                <td>
                                  {isInSession ? (
                                    <button type="button" className="danger candidate-action-btn" onClick={() => handleRemoveCandidateById(candidate.id)} disabled={isSaving}>Remover</button>
                                  ) : (
                                    <button type="button" className="candidate-action-btn" onClick={() => handleAddCandidateById(candidate.id)} disabled={isSaving || hasReachedSessionLimit}>Adicionar</button>
                                  )}
                                </td>
                              </tr>
                            );
                          })}
                          {allCandidatesCatalog.length === 0 && (
                            <tr className="candidate-table-row">
                              <td colSpan={3}>Nenhum candidato encontrado.</td>
                            </tr>
                          )}
                        </tbody>
                      </table>
                    </div>
                  </div>
                </div>
                <div className="control-card">
                  <h4>Ordem e Horário ({sortableCandidates.length})</h4>
                  <div className="sortable-help">Arraste para definir a ordem e preencha o horário de apresentação de cada candidato.</div>
                  <div className="candidate-table-wrapper">
                    <table className="candidate-table order-table-header">
                      <thead>
                        <tr>
                          <th className="drag-col">Ordem</th>
                          <th>Candidato</th>
                          <th className="order-col">Posição</th>
                          <th>Horário</th>
                        </tr>
                      </thead>
                    </table>
                    <div className="candidate-table-scroll">
                      <table className="candidate-table">
                        <tbody>
                          <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
                            <SortableContext items={sortableCandidates.map((candidate) => String(candidate.id))} strategy={verticalListSortingStrategy}>
                              {sortableCandidates.map((candidate, index) => (
                                <SortableCandidateRow
                                  key={candidate.id}
                                  candidate={{ ...candidate, order: index + 1 }}
                                  onTimeChange={(candidateId, value) => handleSortableCandidatesChange(candidateId, 'time', value)}
                                />
                              ))}
                            </SortableContext>
                          </DndContext>
                        </tbody>
                      </table>
                    </div>
                  </div>
                  <button type="button" disabled={isSaving || sortableCandidates.length === 0} style={{ marginTop: 8 }} onClick={handleSaveOrderAndSchedule}>Salvar Ordem/Horário</button>
                </div>
              </div>
            )}

            {activeSessionTab === 'votacao' && (
              <div className="control-grid">
                <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
                  <div className="control-card">
                    <h4>Voto Popular (Público)</h4>
                    <p style={{ marginBottom: 16, fontSize: 13, color: '#6b7280' }}>
                      A votação popular exibe todos os candidatos desta sessão simultaneamente para que o público escolha seu favorito.
                    </p>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', backgroundColor: selectedSession.is_public_voting_open ? '#f0fdf4' : '#f3f4f6', padding: 16, borderRadius: 8, border: `1px solid ${selectedSession.is_public_voting_open ? '#bbf7d0' : '#e5e7eb'}` }}>
                      <div>
                        <span style={{ fontWeight: 'bold', display: 'block', color: selectedSession.is_public_voting_open ? '#166534' : '#374151' }}>
                          {selectedSession.is_public_voting_open ? 'Votação Aberta' : 'Votação Fechada'}
                        </span>
                        <span style={{ fontSize: 12, color: selectedSession.is_public_voting_open ? '#15803d' : '#6b7280' }}>
                          {selectedSession.is_public_voting_open ? 'O público pode votar agora.' : 'Acesso bloqueado para o público.'}
                        </span>
                      </div>
                      <button 
                        type="button" 
                        onClick={() => handleUpdatePublicVoting(!selectedSession.is_public_voting_open)}
                        disabled={isSaving}
                        style={{
                          backgroundColor: selectedSession.is_public_voting_open ? '#ef4444' : '#10b981',
                          color: 'white',
                          border: 'none',
                          padding: '8px 16px',
                          borderRadius: 6,
                          fontWeight: 'bold',
                          cursor: 'pointer'
                        }}
                      >
                        {selectedSession.is_public_voting_open ? 'Desligar' : 'Ligar Votação'}
                      </button>
                    </div>
                  </div>

                  <div className="control-card">
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <h4>Voto Técnico (Jurados)</h4>
                      {selectedSession?.active_candidate_id && (
                        <button 
                          type="button" 
                          onClick={() => handleSetActiveCandidateById(null)} 
                          style={{ padding: '4px 8px', fontSize: 12, backgroundColor: '#fef2f2', color: '#ef4444', border: '1px solid #fecaca', borderRadius: 4, cursor: 'pointer' }}
                        >
                          Pausar Avaliação
                        </button>
                      )}
                    </div>
                    <p style={{ marginBottom: 16, fontSize: 13, color: '#6b7280', marginTop: 4 }}>
                      Os jurados avaliam um candidato por vez. Selecione quem está no palco agora.
                    </p>
                    
                    <div className="candidate-table-wrapper">
                    <table className="candidate-table">
                      <thead>
                        <tr>
                          <th style={{ width: 60 }}>Ordem</th>
                          <th>Candidato</th>
                          <th>Ação</th>
                        </tr>
                      </thead>
                    </table>
                    <div className="candidate-table-scroll" style={{ maxHeight: 250 }}>
                      <table className="candidate-table">
                        <tbody>
                          {sortableCandidates.map((candidate) => {
                            const isActive = String(candidate.id) === String(selectedSession?.active_candidate_id);
                            return (
                              <tr key={candidate.id} className={`candidate-table-row ${isActive ? 'active-row' : ''}`} style={isActive ? { backgroundColor: '#e0f2fe' } : {}}>
                                <td style={{ width: 60 }}>{candidate.order}</td>
                                <td>
                                  <div className="candidate-cell-content">
                                    {candidate.photo ? <img src={candidate.photo} alt={candidate.name} className="candidate-avatar" /> : <div className="candidate-avatar placeholder">{String(candidate.name || '?').slice(0, 1).toUpperCase()}</div>}
                                    <span style={isActive ? { fontWeight: 'bold' } : {}}>{candidate.name} {isActive && '(Ativo)'}</span>
                                  </div>
                                </td>
                                <td>
                                  {!isActive ? (
                                    <button type="button" className="candidate-action-btn" onClick={() => handleSetActiveCandidateById(candidate.id)} disabled={isSaving}>Definir Ativo</button>
                                  ) : (
                                    <span style={{ color: '#0284c7', fontWeight: 'bold', fontSize: 13 }}>Atualmente Ativo</span>
                                  )}
                                </td>
                              </tr>
                            );
                          })}
                          {sortableCandidates.length === 0 && (
                            <tr className="candidate-table-row">
                              <td colSpan={3}>Nenhum candidato na sessão.</td>
                            </tr>
                          )}
                        </tbody>
                      </table>
                    </div>
                  </div>
                </div>

                <div className="control-card">
                  <h4>Status Geral da Sessão</h4>
                  <p style={{ marginBottom: 12, fontSize: 13, color: '#6b7280' }}>Define o estado global desta sessão. Use "Finalizada" para encerrar definitivamente.</p>
                  <div className="status-buttons" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 8 }}>
                    <button type="button" style={{ backgroundColor: selectedSession.status === 'waiting' ? '#eab308' : '', color: selectedSession.status === 'waiting' ? 'white' : '' }} className={selectedSession.status === 'waiting' ? '' : 'secondary'} onClick={() => handleUpdateStatus('waiting')} disabled={isSaving}>⏳ Aguardando Início</button>
                    <button type="button" style={{ backgroundColor: (selectedSession.status === 'judge_voting' || selectedSession.status === 'public_voting') ? '#10b981' : '', color: (selectedSession.status === 'judge_voting' || selectedSession.status === 'public_voting') ? 'white' : '' }} className={(selectedSession.status === 'judge_voting' || selectedSession.status === 'public_voting') ? '' : 'secondary'} onClick={() => handleUpdateStatus('judge_voting')} disabled={isSaving}>▶️ Em Andamento</button>
                    <button type="button" style={{ backgroundColor: selectedSession.status === 'finished' ? '#ef4444' : '', color: selectedSession.status === 'finished' ? 'white' : '' }} className={selectedSession.status === 'finished' ? '' : 'secondary'} onClick={() => handleUpdateStatus('finished')} disabled={isSaving}>🛑 Finalizada</button>
                  </div>
                </div>
              </div>
                
              <div className="control-card">
                  <h4>Auditoria de Notas e Alertas</h4>
                  <p style={{ marginBottom: 16, fontSize: 13, color: '#6b7280' }}>Acompanhe os votos recebidos, veja notas detalhadas e alertas dos jurados.</p>
                  
                  <div className="candidate-table-wrapper">
                    <table className="candidate-table">
                      <thead>
                        <tr>
                          <th>Candidato</th>
                          <th>Votos</th>
                          <th>Alertas</th>
                          <th>Ações</th>
                        </tr>
                      </thead>
                    </table>
                    <div className="candidate-table-scroll" style={{ maxHeight: 250 }}>
                      <table className="candidate-table">
                        <tbody>
                          {auditData.map((item) => {
                            const hasAlerts = item.alerts && item.alerts.length > 0;
                            return (
                              <tr key={item.candidate_id} className="candidate-table-row">
                                <td>
                                  <div className="candidate-cell-content">
                                    <span style={{ fontWeight: hasAlerts ? 'bold' : 'normal' }}>{item.artistic_name || item.name}</span>
                                  </div>
                                </td>
                                <td>{item.votes ? item.votes.length : 0}</td>
                                <td>
                                  <div style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', width: 24, height: 24, borderRadius: '50%', backgroundColor: hasAlerts ? '#ef4444' : '#e5e7eb', color: hasAlerts ? 'white' : '#9ca3af' }} title={hasAlerts ? 'Possui Alertas' : 'Sem alertas'}>
                                    <span style={{ fontSize: 14, fontWeight: 'bold' }}>!</span>
                                  </div>
                                </td>
                                <td>
                                  <button type="button" className="candidate-action-btn" onClick={() => setAuditModalData(item)} disabled={isSaving}>Ver Notas</button>
                                </td>
                              </tr>
                            );
                          })}
                          {auditData.length === 0 && (
                            <tr className="candidate-table-row">
                              <td colSpan={4}>Nenhuma auditoria disponível.</td>
                            </tr>
                          )}
                        </tbody>
                      </table>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {activeSessionTab === 'juizes' && (
              <div className="control-grid">
                <div className="control-card">
                  <h4>
                    Juízes da Sessão ({sessionJudges.length})
                  </h4>
                  <div className="candidate-table-wrapper">
                    <table className="candidate-table">
                      <thead>
                        <tr>
                          <th>Nome</th>
                          <th>Email</th>
                          <th>Ação</th>
                        </tr>
                      </thead>
                    </table>
                    <div className="candidate-table-scroll">
                      <table className="candidate-table">
                        <tbody>
                          {allJudges.map((judge) => {
                            const isInSession = sessionJudges.some(j => Number(j.id) === Number(judge.id));
                            return (
                              <tr key={judge.id} className="candidate-table-row">
                                <td>{judge.name}</td>
                                <td style={{ fontSize: 12, color: '#6B7280' }}>{judge.email}</td>
                                <td>
                                  {isInSession ? (
                                    <button type="button" className="danger candidate-action-btn" onClick={() => handleRemoveJudge(judge.id)} disabled={isSaving}>Remover</button>
                                  ) : (
                                    <button type="button" className="candidate-action-btn" onClick={() => handleAddJudgeById(judge.id)} disabled={isSaving}>Adicionar</button>
                                  )}
                                </td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {activeSessionTab === 'transmissao' && (
              <div className="control-grid">
                <div className="control-card">
                  <h4>Painel da Transmissão</h4>
                  <p style={{ marginBottom: 12, fontSize: 13, color: '#6b7280' }}>
                    Controle a tela exibida no painel ao vivo. Os botões abaixo enviam o conteúdo para a nova guia da transmissão.
                  </p>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: 10, marginBottom: 12 }}>
                    <button type="button" className={`candidate-action-btn ${broadcastMode === 'idle' ? 'active' : ''}`} onClick={() => handleBroadcastModeChange('idle')} disabled={isBroadcastLoading || isSaving}>Tela em branco</button>
                    <button type="button" className={`candidate-action-btn ${broadcastMode === 'total_public_votes' ? 'active' : ''}`} onClick={() => handleBroadcastModeChange('total_public_votes')} disabled={isBroadcastLoading || isSaving}>Total de votos públicos</button>
                    <button type="button" className={`candidate-action-btn ${broadcastMode === 'ranking_public' ? 'active' : ''}`} onClick={() => handleBroadcastModeChange('ranking_public')} disabled={isBroadcastLoading || isSaving}>Ranking dos votos públicos</button>
                    <button type="button" className={`candidate-action-btn ${broadcastMode === 'ranking_judges' ? 'active' : ''}`} onClick={() => handleBroadcastModeChange('ranking_judges')} disabled={isBroadcastLoading || isSaving}>Ranking dos votos dos jurados</button>
                    <button type="button" className={`candidate-action-btn ${broadcastMode === 'winners' ? 'active' : ''}`} onClick={() => handleBroadcastModeChange('winners')} disabled={isBroadcastLoading || isSaving}>Vencedores</button>
                    <button type="button" className={`candidate-action-btn ${broadcastMode === 'current_candidate_score' ? 'active' : ''}`} onClick={() => handleBroadcastModeChange('current_candidate_score')} disabled={isBroadcastLoading || isSaving}>Pontuação do candidato</button>
                  </div>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: 12, alignItems: 'center' }}>
                    <button type="button" className="candidate-action-btn" onClick={openBroadcastScreen} disabled={isBroadcastLoading || isSaving}>
                      Tela da transmissão
                    </button>
                    <span style={{ fontSize: 12, color: '#6b7280' }}>
                      Modo atual: {getTransmissionLabel(broadcastMode)}
                    </span>
                  </div>
                </div>
              </div>
            )}

            </div>
          </div>
        </div>
      )}

      {deleteConfirmModalId && (
        <div 
          className="sessoes-delete-confirm-modal-overlay"
          onClick={() => setDeleteConfirmModalId(null)}
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: 'rgba(0, 0, 0, 0.5)',
            zIndex: 1100,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '20px'
          }}
        >
          <div 
            className="sessoes-delete-confirm-modal"
            onClick={(e) => e.stopPropagation()}
            style={{
              backgroundColor: 'white',
              borderRadius: '8px',
              boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1)',
              width: '100%',
              maxWidth: '400px',
              padding: '24px'
            }}
          >
            <h3 style={{ margin: '0 0 12px 0', color: '#ef4444' }}>Excluir Sessão</h3>
            <p style={{ margin: '0 0 20px 0', color: '#6b7280', fontSize: '14px' }}>
              Tem certeza que deseja excluir esta sessão? Todos os candidatos, jurados, votos e dados associados serão removidos permanentemente. Esta ação não pode ser desfeita.
            </p>
            <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end' }}>
              <button 
                type="button"
                onClick={() => setDeleteConfirmModalId(null)}
                disabled={isSaving}
                style={{
                  padding: '8px 16px',
                  border: '1px solid #d1d5db',
                  borderRadius: '4px',
                  backgroundColor: 'white',
                  color: '#374151',
                  cursor: isSaving ? 'not-allowed' : 'pointer',
                  fontSize: '14px',
                  fontWeight: '500'
                }}
              >
                Cancelar
              </button>
              <button 
                type="button"
                onClick={() => handleDeleteSession(deleteConfirmModalId)}
                disabled={isSaving}
                style={{
                  padding: '8px 16px',
                  border: 'none',
                  borderRadius: '4px',
                  backgroundColor: '#ef4444',
                  color: 'white',
                  cursor: isSaving ? 'not-allowed' : 'pointer',
                  fontSize: '14px',
                  fontWeight: '500',
                  opacity: isSaving ? 0.7 : 1
                }}
              >
                {isSaving ? 'Excluindo...' : 'Confirmar Exclusão'}
              </button>
            </div>
          </div>
        </div>
      )}

      {auditModalData && (
        <div className="sessoes-modal-overlay" onClick={() => { if(!editingVoteId) setAuditModalData(null); }} style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.5)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <div className="sessoes-modal-content" onClick={(e) => e.stopPropagation()} style={{ backgroundColor: 'white', padding: 24, borderRadius: 8, width: '90%', maxWidth: 850, maxHeight: '90vh', overflowY: 'auto' }}>
            <div className="sessoes-modal-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
              <h3 style={{ margin: 0 }}>Notas de: {auditModalData.artistic_name || auditModalData.name}</h3>
              <button className="close-btn" onClick={() => { setAuditModalData(null); setEditingVoteId(null); }} style={{ background: 'none', border: 'none', fontSize: 24, cursor: 'pointer', color: '#6b7280' }}>&times;</button>
            </div>
            <div className="sessoes-modal-body">
              {auditModalData.alerts && auditModalData.alerts.length > 0 && (
                <div className="sessoes-alert erro" style={{ marginBottom: 16 }}>
                  <strong>Alertas pendentes:</strong>
                  <ul style={{ margin: '8px 0 0 16px', padding: 0 }}>
                    {auditModalData.alerts.map(a => <li key={a.id}>{a.message}</li>)}
                  </ul>
                </div>
              )}
              
              <div className="candidate-table-wrapper" style={{ border: '1px solid #e5e7eb', borderRadius: 8, overflow: 'hidden' }}>
                <table className="candidate-table" style={{ fontSize: 12, width: '100%', textAlign: 'left', borderCollapse: 'collapse' }}>
                  <thead style={{ backgroundColor: '#f9fafb', borderBottom: '1px solid #e5e7eb' }}>
                    <tr>
                      <th style={{ padding: '8px 12px' }}>Jurado</th>
                      <th style={{ padding: '8px 4px' }}>Afin.</th>
                      <th style={{ padding: '8px 4px' }}>Presen.</th>
                      <th style={{ padding: '8px 4px' }}>Harm.</th>
                      <th style={{ padding: '8px 4px' }}>Ritmo</th>
                      <th style={{ padding: '8px 4px' }}>Interp.</th>
                      <th style={{ padding: '8px 4px' }}>Autent.</th>
                      <th style={{ padding: '8px 4px' }}>Dicção</th>
                      <th style={{ padding: '8px 12px' }}>Total</th>
                      <th style={{ padding: '8px 12px' }}>Ações</th>
                    </tr>
                  </thead>
                  <tbody>
                    {auditModalData.votes.map(vote => {
                      const isEditing = editingVoteId === vote.id;
                      if (isEditing) {
                        return (
                          <tr key={vote.id} style={{ borderBottom: '1px solid #e5e7eb' }}>
                            <td style={{ padding: '8px 12px', fontWeight: 'bold' }}>{vote.judge_name}</td>
                            <td style={{ padding: '8px 4px' }}><input type="number" step="0.1" min="0" max="10" value={editVoteForm.tuning} onChange={(e) => setEditVoteForm(c => ({...c, tuning: e.target.value}))} style={{ width: 45, padding: 2, fontSize: 12 }}/></td>
                            <td style={{ padding: '8px 4px' }}><input type="number" step="0.1" min="0" max="10" value={editVoteForm.stage_presence} onChange={(e) => setEditVoteForm(c => ({...c, stage_presence: e.target.value}))} style={{ width: 45, padding: 2, fontSize: 12 }}/></td>
                            <td style={{ padding: '8px 4px' }}><input type="number" step="0.1" min="0" max="10" value={editVoteForm.harmony} onChange={(e) => setEditVoteForm(c => ({...c, harmony: e.target.value}))} style={{ width: 45, padding: 2, fontSize: 12 }}/></td>
                            <td style={{ padding: '8px 4px' }}><input type="number" step="0.1" min="0" max="10" value={editVoteForm.rhythm} onChange={(e) => setEditVoteForm(c => ({...c, rhythm: e.target.value}))} style={{ width: 45, padding: 2, fontSize: 12 }}/></td>
                            <td style={{ padding: '8px 4px' }}><input type="number" step="0.1" min="0" max="10" value={editVoteForm.interpretation} onChange={(e) => setEditVoteForm(c => ({...c, interpretation: e.target.value}))} style={{ width: 45, padding: 2, fontSize: 12 }}/></td>
                            <td style={{ padding: '8px 4px' }}><input type="number" step="0.1" min="0" max="10" value={editVoteForm.authenticity} onChange={(e) => setEditVoteForm(c => ({...c, authenticity: e.target.value}))} style={{ width: 45, padding: 2, fontSize: 12 }}/></td>
                            <td style={{ padding: '8px 4px' }}><input type="number" step="0.1" min="0" max="10" value={editVoteForm.diction} onChange={(e) => setEditVoteForm(c => ({...c, diction: e.target.value}))} style={{ width: 45, padding: 2, fontSize: 12 }}/></td>
                            <td style={{ padding: '8px 12px' }}>-</td>
                            <td style={{ padding: '8px 12px', display: 'flex', gap: 4 }}>
                              <button type="button" onClick={() => handleSaveVoteEdit(vote.judge_id, auditModalData.candidate_id)} style={{ padding: '4px 8px', fontSize: 11, backgroundColor: '#10b981', color: 'white', border: 'none', borderRadius: 4, cursor: 'pointer' }}>Salvar</button>
                              <button type="button" onClick={() => setEditingVoteId(null)} style={{ padding: '4px 8px', fontSize: 11, backgroundColor: '#6b7280', color: 'white', border: 'none', borderRadius: 4, cursor: 'pointer' }}>Cancelar</button>
                            </td>
                          </tr>
                        );
                      }
                      return (
                        <tr key={vote.id} style={{ borderBottom: '1px solid #e5e7eb' }}>
                          <td style={{ padding: '8px 12px', fontWeight: 'bold' }}>{vote.judge_name}</td>
                          <td style={{ padding: '8px 4px' }}>{Number(vote.tuning).toFixed(1)}</td>
                          <td style={{ padding: '8px 4px' }}>{Number(vote.stage_presence).toFixed(1)}</td>
                          <td style={{ padding: '8px 4px' }}>{Number(vote.harmony).toFixed(1)}</td>
                          <td style={{ padding: '8px 4px' }}>{Number(vote.rhythm).toFixed(1)}</td>
                          <td style={{ padding: '8px 4px' }}>{Number(vote.interpretation).toFixed(1)}</td>
                          <td style={{ padding: '8px 4px' }}>{Number(vote.authenticity).toFixed(1)}</td>
                          <td style={{ padding: '8px 4px' }}>{Number(vote.diction).toFixed(1)}</td>
                          <td style={{ padding: '8px 12px', fontWeight: 'bold', color: '#0284c7' }}>{Number(vote.total_score).toFixed(2)}</td>
                          <td style={{ padding: '8px 12px', display: 'flex', gap: 4 }}>
                            <button type="button" onClick={() => {
                              setEditingVoteId(vote.id);
                              setEditVoteForm({
                                tuning: vote.tuning, stage_presence: vote.stage_presence, harmony: vote.harmony, rhythm: vote.rhythm, interpretation: vote.interpretation, authenticity: vote.authenticity, diction: vote.diction
                              });
                            }} title="Editar" style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 4, color: '#3b82f6' }}><Edit2 size={16} /></button>
                            <button type="button" onClick={() => handleDeleteVote(vote.judge_id, auditModalData.candidate_id)} title="Excluir" style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 4, color: '#ef4444' }}><Trash2 size={16} /></button>
                          </td>
                        </tr>
                      );
                    })}
                    {auditModalData.votes.length === 0 && (
                      <tr><td colSpan={10} style={{ textAlign: 'center', padding: 16 }}>Nenhum voto recebido.</td></tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>
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
