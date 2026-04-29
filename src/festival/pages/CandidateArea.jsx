import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { Bell, Menu, User, Star, Trophy, Mic2, FileText, Settings, LogOut, Edit3, Calendar, Clock, Check, X, TrendingUp, Download, CheckCircle, Activity, Music, Shirt, Map, Users, Gift } from 'lucide-react';
import '../styles/CandidateArea.css';

const CandidateArea = () => {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [profile, setProfile] = useState(null);
  const [sessions, setSessions] = useState([]);
  const [sessionResults, setSessionResults] = useState([]);
  const [isLoadingProfile, setIsLoadingProfile] = useState(true);
  const [isLoadingResults, setIsLoadingResults] = useState(false);
  const [profileError, setProfileError] = useState('');
  const [resultsError, setResultsError] = useState('');
  const [profileSuccess, setProfileSuccess] = useState('');
  const [activeMenu, setActiveMenu] = useState('perfil');
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isSavingProfile, setIsSavingProfile] = useState(false);
  const [editError, setEditError] = useState('');
  const [selectedPhotoFile, setSelectedPhotoFile] = useState(null);
  const [photoPreviewUrl, setPhotoPreviewUrl] = useState('');
  const [editForm, setEditForm] = useState({
    name: '',
    artistic_name: '',
    birth_date: '',
    address: '',
    phone: '',
    song_name: ''
  });
  const API_FESTIVAL_BASE_URL = process.env.API_FESTIVAL;
  const DEFAULT_USER_IMAGE = '/img/user.jpg';

  const PHASE_LABELS = {
    inscrito: 'Inscrito',
    audicao: 'Audição',
    final: 'Final',
    vencedor: 'Vencedor'
  };

  const SCORE_CRITERIA = [
    { key: 'afinacao', label: 'Afinação' },
    { key: 'presenca_palco', label: 'Presença de palco' },
    { key: 'melodia_harmonia', label: 'Melodia e harmonia' },
    { key: 'ritmo', label: 'Ritmo' },
    { key: 'interpretacao', label: 'Interpretação' },
    { key: 'autenticidade', label: 'Autenticidade / música autoral' },
    { key: 'diccao', label: 'Dicção / pronúncia' }
  ];

  const readCriterionFromResult = (result, key) => {
    if (!result) return null;

    // common shapes: result.criteria = { key: value }
    if (result.criteria && typeof result.criteria === 'object' && key in result.criteria) return Number(result.criteria[key]);
    // alternative shapes
    if (result.scores && typeof result.scores === 'object' && key in result.scores) return Number(result.scores[key]);
    if (result.breakdown && typeof result.breakdown === 'object' && key in result.breakdown) return Number(result.breakdown[key]);
    if (key in result && (typeof result[key] === 'number' || typeof result[key] === 'string')) return Number(result[key]);

    // try snake/other variants
    const altKeys = [key, key.replace(/_/g, ''), key.replace(/_/g, '-'), key.replace(/_/g, ' '), `${key}_score`];
    for (const k of altKeys) {
      if (result[k] !== undefined) return Number(result[k]);
    }

    return null;
  };

  const extractJudgeVotes = (result) => {
    if (!result) return [];

    // 1) result.judges: array of judge objects with scores
    if (Array.isArray(result.judges) && result.judges.length) {
      return result.judges.map((j) => ({
        id: j.id ?? j.judge_id ?? j.user_id ?? null,
        name: j.name || j.full_name || j.display_name || j.label || `Jurado ${j.id || ''}`,
        avatar: j.profile_photo_url || j.avatar || j.avatarUrl || '',
        scores: j.scores || j.criteria || j.breakdown || {}
      }));
    }

    // 2) result.votes: array of vote objects { judge, scores }
    if (Array.isArray(result.votes) && result.votes.length) {
      return result.votes.map((v) => ({
        id: v.judge?.id ?? v.judge_id ?? v.user_id ?? null,
        name: v.judge?.name || v.judge_name || v.judge?.full_name || v.name || `Jurado ${v.judge_id || ''}`,
        avatar: v.judge?.profile_photo_url || v.judge?.avatar || '',
        scores: v.scores || v.criteria || v.breakdown || {}
      }));
    }

    // 3) result.judge_scores as object mapping judgeId -> scores
    if (result.judge_scores && typeof result.judge_scores === 'object') {
      return Object.keys(result.judge_scores).map((judgeKey) => {
        const entry = result.judge_scores[judgeKey] || {};
        return {
          id: entry.judge_id ?? entry.id ?? judgeKey,
          name: entry.judge_name || entry.name || `Jurado ${judgeKey}`,
          avatar: entry.profile_photo_url || entry.avatar || '',
          scores: entry.scores || entry.criteria || entry.breakdown || (typeof entry === 'object' ? entry : {})
        };
      });
    }

    // 4) result.judges_scores or other variants
    const altKeys = ['judges_scores', 'judgeScores', 'judge_votes', 'judges_votes'];
    for (const k of altKeys) {
      if (result[k] && typeof result[k] === 'object') {
        if (Array.isArray(result[k])) {
          return result[k].map((entry) => ({
            id: entry.judge_id ?? entry.id ?? null,
            name: entry.judge_name || entry.name || `Jurado ${entry.judge_id || ''}`,
            avatar: entry.profile_photo_url || entry.avatar || '',
            scores: entry.scores || entry.criteria || entry.breakdown || {}
          }));
        }

        return Object.keys(result[k]).map((judgeKey) => {
          const entry = result[k][judgeKey] || {};
          return {
            id: entry.judge_id ?? entry.id ?? judgeKey,
            name: entry.judge_name || entry.name || `Jurado ${judgeKey}`,
            avatar: entry.profile_photo_url || entry.avatar || '',
            scores: entry.scores || entry.criteria || entry.breakdown || (typeof entry === 'object' ? entry : {})
          };
        });
      }
    }

    // 5) fallback: if result.per_judge or result.perJudge
    if (Array.isArray(result.per_judge)) {
      return result.per_judge.map((entry) => ({
        id: entry.judge_id ?? entry.id ?? null,
        name: entry.judge_name || entry.name || `Jurado ${entry.judge_id || ''}`,
        avatar: entry.profile_photo_url || entry.avatar || '',
        scores: entry.scores || entry.criteria || entry.breakdown || {}
      }));
    }

    return [];
  };

  const STATUS_LABELS = {
    ativo: 'ATIVO',
    eliminado: 'ELIMINADO',
    desistente: 'DESISTENTE'
  };

  const formatSessionDate = (dateValue) => {
    if (!dateValue) return 'Data não definida';
    const parsed = new Date(dateValue);
    if (Number.isNaN(parsed.getTime())) return 'Data não definida';
    return parsed.toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: 'long',
      year: 'numeric'
    });
  };

  const formatSessionTime = (timeValue) => {
    if (!timeValue) return 'Horário não definido';
    if (typeof timeValue === 'string') return timeValue.slice(0, 5);
    return 'Horário não definido';
  };

  const getCandidateCode = (id) => {
    if (!id) return '#FORRO-----';
    return `#FORRO-${String(id).padStart(4, '0')}`;
  };

  const resolveProfilePhotoUrl = (photoUrl) => {
    if (!photoUrl) return DEFAULT_USER_IMAGE;

    if (
      photoUrl.startsWith('http://') ||
      photoUrl.startsWith('https://') ||
      photoUrl.startsWith('data:') ||
      photoUrl.startsWith('blob:') ||
      photoUrl.startsWith('/img/')
    ) {
      return photoUrl;
    }

    const normalizedPath = photoUrl.startsWith('/') ? photoUrl : `/${photoUrl}`;
    return `${API_FESTIVAL_BASE_URL}${normalizedPath}`;
  };

  useEffect(() => {
    const bootstrapCandidateArea = async () => {
      setIsLoadingProfile(true);
      setIsLoadingResults(false);
      setProfileError('');
      setResultsError('');
      setProfileSuccess('');

      const token = localStorage.getItem('token');
      const userData = localStorage.getItem('user');
      let parsedUser = null;

      if (userData) {
        try {
          parsedUser = JSON.parse(userData);
          setUser(parsedUser);
        } catch (error) {
          localStorage.removeItem('user');
        }
      }

      if (!token) {
        navigate('/login-candidato');
        return;
      }

      try {
        const [profileResponse, sessionsResponse] = await Promise.all([
          axios.get(`${API_FESTIVAL_BASE_URL}/api/candidate/me`, {
            headers: { Authorization: `Bearer ${token}` }
          }),
          axios.get(`${API_FESTIVAL_BASE_URL}/api/candidate/sessions`, {
            headers: { Authorization: `Bearer ${token}` }
          })
        ]);

        if (profileResponse?.data?.user) {
          setUser(profileResponse.data.user);
          localStorage.setItem('user', JSON.stringify(profileResponse.data.user));
        } else if (parsedUser) {
          setUser(parsedUser);
        }

        const normalizedSessions = Array.isArray(sessionsResponse?.data?.sessions) ? sessionsResponse.data.sessions : [];

        setProfile(profileResponse?.data?.profile || null);
        setSessions(normalizedSessions);

        const finishedSessions = normalizedSessions.filter((session) => session.session_status === 'finished');
        if (!finishedSessions.length) {
          setSessionResults([]);
        } else {
          setIsLoadingResults(true);

          try {
            const resultResponses = await Promise.all(
              finishedSessions.map(async (session) => {
                try {
                  const response = await axios.get(`${API_FESTIVAL_BASE_URL}/api/candidate/results/${session.id}`, {
                    headers: { Authorization: `Bearer ${token}` }
                  });

                  return response?.data || null;
                } catch (error) {
                  return null;
                }
              })
            );

            setSessionResults(resultResponses.filter(Boolean));
          } catch (error) {
            setResultsError('Não foi possível carregar os resultados das sessões finalizadas.');
            setSessionResults([]);
          } finally {
            setIsLoadingResults(false);
          }
        }
      } catch (error) {
        const status = error?.response?.status;
        if (status === 401 || status === 403) {
          localStorage.removeItem('token');
          localStorage.removeItem('user');
          navigate('/login-candidato');
          return;
        }

        setProfileError(error?.response?.data?.message || 'Não foi possível carregar os dados do candidato.');
      } finally {
        setIsLoadingProfile(false);
      }
    };

    bootstrapCandidateArea();
  }, [API_FESTIVAL_BASE_URL, navigate]);

  const nextSession = sessions.find((session) => session.session_status !== 'finished') || sessions[0] || null;
  const finishedSessionsCount = sessions.filter((session) => session.session_status === 'finished').length;
  const upcomingSessionsCount = sessions.filter((session) => session.session_status !== 'finished').length;
  const hasScheduleInfo = Boolean(nextSession && (nextSession.session_date || nextSession.session_time || nextSession.location));
  const hasNotesInfo = sessions.some((session) => {
    const totalScore = Number(session?.total_score || 0);
    const manualAdjustment = Number(session?.manual_adjustment || 0);
    const effectiveScore = Number(session?.effective_score || 0);
    return totalScore !== 0 || manualAdjustment !== 0 || effectiveScore !== 0;
  });
  const latestScoredSession = [...sessions]
    .filter((session) => {
      const totalScore = Number(session?.total_score || 0);
      const manualAdjustment = Number(session?.manual_adjustment || 0);
      const effectiveScore = Number(session?.effective_score || 0);
      return totalScore !== 0 || manualAdjustment !== 0 || effectiveScore !== 0;
    })
    .sort((a, b) => Number(b.id || 0) - Number(a.id || 0))[0] || null;
  const profilePhoto = resolveProfilePhotoUrl(profile?.profile_photo_url || user?.profile_photo_url || user?.avatar || DEFAULT_USER_IMAGE);
  const modalPhotoPreview = photoPreviewUrl || profilePhoto;
  const sortedResults = [...sessionResults].sort((a, b) => Number(b?.session?.id || 0) - Number(a?.session?.id || 0));
  const latestResult = sortedResults[0] || null;
  const hasRealNotes = sortedResults.length > 0;
  const averageEffectiveScore = hasRealNotes
    ? sortedResults.reduce((acc, result) => acc + Number(result?.effective_score || 0), 0) / sortedResults.length
    : 0;
  const latestEffectiveScore = Number(latestResult?.effective_score || 0);
  const latestTechnicalScore = Number(latestResult?.total_score || 0);
  const latestAdjustmentScore = Number(latestResult?.manual_adjustment || 0);
  const latestPosition = Number(latestResult?.position || 0);
  const latestTotalCandidates = Number(latestResult?.total_candidates || 0);
  const latestWinnerMessage = latestResult?.winner_message || '';
  const bestResult = hasRealNotes
    ? [...sortedResults].sort((a, b) => Number(b?.effective_score || 0) - Number(a?.effective_score || 0))[0]
    : null;
  const competitionStateLabel = profile?.status === 'eliminado'
    ? 'ELIMINADO'
    : profile?.status === 'desistente'
      ? 'DESISTENTE'
      : latestResult?.is_winner
        ? 'CLASSIFICADO'
        : 'ATIVO';
  const statusLabel = STATUS_LABELS[profile?.status] || 'ATIVO';
  const phaseLabel = PHASE_LABELS[profile?.current_phase] || 'Audição';
  const canEditProfile = Boolean(profile?.can_edit ?? true);
  const canEditSongName = !profile?.song_name;

  const openEditModal = () => {
    if (profile?.status === 'eliminado') {
      return;
    }

    if (!user && !profile) {
      return;
    }

    setEditError('');
    setSelectedPhotoFile(null);
    setPhotoPreviewUrl('');
    setEditForm({
      name: user?.name || '',
      artistic_name: profile?.artistic_name || '',
      birth_date: profile?.birth_date ? String(profile.birth_date).slice(0, 10) : '',
      address: profile?.address || '',
      phone: profile?.phone || '',
      song_name: profile?.song_name || ''
    });
    setIsEditModalOpen(true);
  };

  const closeEditModal = () => {
    if (isSavingProfile) return;
    setIsEditModalOpen(false);
    setEditError('');
    setSelectedPhotoFile(null);
    if (photoPreviewUrl.startsWith('blob:')) {
      URL.revokeObjectURL(photoPreviewUrl);
    }
    setPhotoPreviewUrl('');
  };

  const handleEditInputChange = (event) => {
    const { name, value } = event.target;
    setEditForm((current) => ({ ...current, [name]: value }));
  };

  const handlePhotoChange = (event) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const allowedTypes = ['image/jpeg', 'image/png', 'image/webp'];
    if (!allowedTypes.includes(file.type)) {
      setEditError('Envie uma imagem JPG, PNG ou WEBP.');
      return;
    }

    if (file.size > 10 * 1024 * 1024) {
      setEditError('A imagem deve ter no máximo 10MB.');
      return;
    }

    if (photoPreviewUrl.startsWith('blob:')) {
      URL.revokeObjectURL(photoPreviewUrl);
    }

    setEditError('');
    setSelectedPhotoFile(file);
    setPhotoPreviewUrl(URL.createObjectURL(file));
  };

  const handleSaveProfile = async (event) => {
    event.preventDefault();

    if (profile?.status === 'eliminado') {
      setEditError('Seu perfil está bloqueado. Candidatos eliminados não podem fazer alterações.');
      return;
    }

    if (!canEditProfile) {
      setEditError('Seu perfil está bloqueado para edição.');
      return;
    }

    const token = localStorage.getItem('token');
    if (!token) {
      navigate('/login-candidato');
      return;
    }

    const payload = {
      name: editForm.name.trim(),
      artistic_name: editForm.artistic_name.trim(),
      birth_date: editForm.birth_date || '',
      address: editForm.address.trim(),
      phone: editForm.phone.trim()
    };

    if (canEditSongName) {
      payload.song_name = editForm.song_name.trim();
    }

    if (!payload.name || !payload.artistic_name) {
      setEditError('Nome e nome artístico são obrigatórios.');
      return;
    }

    if (canEditSongName && !payload.song_name) {
      setEditError('Informe a música para concluir a atualização.');
      return;
    }

    setIsSavingProfile(true);
    setEditError('');
    setProfileSuccess('');

    try {
      if (selectedPhotoFile) {
        const uploadData = new FormData();
        uploadData.append('file', selectedPhotoFile);

        const uploadResponse = await axios.post(`${API_FESTIVAL_BASE_URL}/api/uploads/imagens`, uploadData, {
          headers: { Authorization: `Bearer ${token}` }
        });

        const uploadedReference = uploadResponse?.data?.fileReference;
        if (!uploadedReference) {
          throw new Error('Falha ao obter referência da imagem enviada.');
        }

        payload.profile_photo_url = uploadedReference;
      }

      const response = await axios.patch(`${API_FESTIVAL_BASE_URL}/api/candidate/me`, payload, {
        headers: { Authorization: `Bearer ${token}` }
      });

      if (response?.data?.user) {
        setUser(response.data.user);
        localStorage.setItem('user', JSON.stringify(response.data.user));
      }

      if (response?.data?.profile) {
        setProfile(response.data.profile);
      }

      setSelectedPhotoFile(null);
      if (photoPreviewUrl.startsWith('blob:')) {
        URL.revokeObjectURL(photoPreviewUrl);
      }
      setPhotoPreviewUrl('');

      setProfileSuccess(response?.data?.message || 'Perfil atualizado com sucesso.');
      setIsEditModalOpen(false);
    } catch (error) {
      setEditError(error?.response?.data?.message || 'Não foi possível salvar o perfil.');
    } finally {
      setIsSavingProfile(false);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    navigate('/login-candidato');
  };

  const handleMenuClick = (menu) => {
    setActiveMenu(menu);
    setIsMobileMenuOpen(false);
  };

  const openMobileMenu = () => {
    setIsMobileMenuOpen(true);
  };

  const closeMobileMenu = () => {
    setIsMobileMenuOpen(false);
  };

  return (
    <div className="candidate-area-page">
      <div className="candidate-layout">
        {isMobileMenuOpen && <button type="button" className="candidate-sidebar-backdrop" aria-label="Fechar menu" onClick={closeMobileMenu}></button>}
        
        {/* SIDEBAR */}
        <aside className={`candidate-sidebar ${isMobileMenuOpen ? 'mobile-open' : ''}`}>
          <div className="sidebar-logo">
            <h1>FESTIVAL DE<br/>FORRÓ</h1>
            <p>EDIÇÃO DIGITAL ARRAIAL</p>
          </div>
          
          <div className="sidebar-divider"></div>
          
          <div className="sidebar-user-mini">
            <img 
              src={profilePhoto}
              alt="Avatar" 
              className="mini-avatar"
              onError={(event) => {
                event.currentTarget.onerror = null;
                event.currentTarget.src = DEFAULT_USER_IMAGE;
              }}
            />
            <div className="mini-info">
              <h4>Área do Candidato</h4>
              <span>ID: {getCandidateCode(user?.id)}</span>
            </div>
          </div>

          <nav className="sidebar-nav">
            <button className={`nav-item ${activeMenu === 'perfil' ? 'active' : ''}`} onClick={() => handleMenuClick('perfil')}>
              <User size={18} /> Meu Perfil
            </button>
            <button className={`nav-item ${activeMenu === 'notas' ? 'active' : ''}`} onClick={() => handleMenuClick('notas')}>
              <Star size={18} /> Minhas Notas
            </button>
            <button className={`nav-item ${activeMenu === 'status' ? 'active' : ''}`} onClick={() => handleMenuClick('status')}>
              <Trophy size={18} /> Status Competição
            </button>
            <button className={`nav-item ${activeMenu === 'apresentacao' ? 'active' : ''}`} onClick={() => handleMenuClick('apresentacao')}>
              <Mic2 size={18} /> Apresentação
            </button>
          </nav>

          <div className="sidebar-bottom">
            <button className="btn-yellow" disabled={profile?.status === 'eliminado'} title={profile?.status === 'eliminado' ? 'Bloqueado para candidatos eliminados' : ''}>VER INSCRIÇÃO</button>
            <button className="bottom-link" disabled={profile?.status === 'eliminado'} title={profile?.status === 'eliminado' ? 'Bloqueado para candidatos eliminados' : ''}>
              <Settings size={15} /> CONFIGURAÇÕES
            </button>
            <button className="bottom-link red" onClick={handleLogout}>
              <LogOut size={15} /> SAIR
            </button>
          </div>
        </aside>

        {/* MAIN CONTENT */}
        <main className="candidate-main">
          
          {/* HEADER */}
          <header className="main-header">
            <div className="header-top">
              <div className="header-title-area">
                <h2>ÁREA DO CANDIDATO</h2>
                <p>Gerencie sua jornada no coração do Nordeste.</p>
              </div>
              <div className="header-actions">
                <button type="button" className="mobile-menu-btn" onClick={openMobileMenu} aria-label="Abrir menu de navegação">
                  <Menu size={22} />
                </button>
                <div className="status-badge-container">
                  <div className={`status-badge ${profile?.status === 'eliminado' ? 'red' : ''}`}>{statusLabel}</div>
                  <div className="fase-text">Fase: {phaseLabel}</div>
                </div>
                <button className="bell-btn">
                  <Bell size={20} />
                </button>
              </div>
            </div>
          </header>
          
          <div className="main-divider"></div>

          {profile?.status === 'eliminado' && (
            <div style={{ backgroundColor: '#fee2e2', borderLeft: '4px solid #b91c1c', padding: '16px', marginBottom: '16px', color: '#991b1b', fontWeight: 600 }}>
              ⚠️ Seu perfil foi eliminado da competição. Você pode visualizar suas informações, mas não é permitido fazer alterações.
            </div>
          )}

                    {isLoadingProfile && (
                      <div style={{ marginBottom: '16px', color: '#0f172a', fontWeight: 600 }}>
                        Carregando informações do candidato...
                      </div>
                    )}

                    {profileError && (
                      <div style={{ marginBottom: '16px', color: '#b91c1c', fontWeight: 600 }}>
                        {profileError}
                      </div>
                    )}

                    {profileSuccess && (
                      <div style={{ marginBottom: '16px', color: '#166534', fontWeight: 600 }}>
                        {profileSuccess}
                      </div>
                    )}

                    {isLoadingResults && (
                      <div style={{ marginBottom: '16px', color: '#0f172a', fontWeight: 600 }}>
                        Carregando resultados das sessões finalizadas...
                      </div>
                    )}

                    {resultsError && (
                      <div style={{ marginBottom: '16px', color: '#b91c1c', fontWeight: 600 }}>
                        {resultsError}
                      </div>
                    )}

          {activeMenu === 'perfil' && (
          <div className="content-grid">
            
            {/* LEFT COLUMN */}
            <div className="left-column">
              
              {/* Meu Perfil Card */}
              <div className="card perfil-card">
                <div className="card-decor-tr"></div>
                <div className="perfil-header">
                  <User size={20} color="#1a6b32" />
                  <h3>Meu Perfil</h3>
                </div>
                
                <div className="perfil-avatar-container">
                  <div className="perfil-avatar-wrapper">
                    <img
                      src={profilePhoto}
                      alt="Perfil"
                      onError={(event) => {
                        event.currentTarget.onerror = null;
                        event.currentTarget.src = DEFAULT_USER_IMAGE;
                      }}
                    />
                    <button className="edit-btn" onClick={openEditModal} type="button" disabled={!canEditProfile || profile?.status === 'eliminado'} title={profile?.status === 'eliminado' ? 'Perfil bloqueado para candidatos eliminados' : ''}>
                      <Edit3 size={24} strokeWidth={2.6} />
                    </button>
                  </div>
                </div>

                <div className="form-group">
                  <label>NOME ARTÍSTICO</label>
                  <input type="text" className="form-input" disabled value={profile?.artistic_name || 'Não informado'} />
                </div>
                <div className="form-group">
                  <label>MÚSICA QUE IRÁ CANTAR</label>
                  <input type="text" className="form-input" disabled value={profile?.song_name || 'Não informada'} />
                </div>

                <button className="btn-green-full" type="button" onClick={openEditModal} disabled={!canEditProfile || profile?.status === 'eliminado'}>
                  {profile?.status === 'eliminado' ? 'Perfil bloqueado (eliminado)' : canEditProfile ? 'Editar Perfil' : 'Perfil bloqueado'}
                </button>
              </div>

              {/* Sua Apresentacao Card */}
              <div className="card apresentacao-card">
                <div style={{ position: 'absolute', top: 15, right: 15, opacity: 0.2 }}>
                  <Calendar size={40} />
                </div>
                <h4>SUA APRESENTAÇÃO</h4>
                {hasScheduleInfo ? (
                  <>
                    <div className="apresentacao-icon-row">
                      <Calendar size={18} />
                      <span>{formatSessionDate(nextSession?.session_date)}</span>
                    </div>
                    <div className="apresentacao-icon-row">
                      <Clock size={18} />
                      <span>{formatSessionTime(nextSession?.session_time)}</span>
                    </div>
                    <div className="palco-info">
                      <span>PALCO PRINCIPAL</span>
                      <strong>{nextSession?.location || 'Local não definido'}</strong>
                    </div>
                  </>
                ) : (
                  <div style={{ marginTop: '14px', fontWeight: 600, lineHeight: 1.5 }}>
                    Você ainda não possui informações de data.
                    <br />
                    Aguarde ser agendado.
                  </div>
                )}
              </div>

            </div>

            {/* RIGHT COLUMN */}
            <div className="right-column">
              
              {/* Desempenho Geral Card */}
              <div className="card desempenho-card">
                {hasNotesInfo ? (
                  <>
                    <div className="voto-popular-badge">
                      <span>PONTUAÇÃO FINAL</span>
                      <strong>{Number(latestScoredSession?.effective_score || 0).toFixed(2)}</strong>
                    </div>

                    <div className="desempenho-header">
                      <h3>DESEMPENHO GERAL</h3>
                      <p>Resultado consolidado da última avaliação disponível.</p>
                    </div>

                    <div className="score-list">
                      <div className="score-item">
                        <div className="score-info">
                          <h4>Média dos Jurados</h4>
                          <p>Pontuação consolidada dos jurados na sessão.</p>
                        </div>
                        <div className="score-value">
                          <strong>{Number(latestScoredSession?.total_score || 0).toFixed(2)}</strong>
                          <span>/ 10</span>
                        </div>
                      </div>

                      <div className="score-item">
                        <div className="score-info">
                          <h4>Votos Públicos</h4>
                          <p>Pontuação agregada dos votos do público.</p>
                        </div>
                        <div className="score-value">
                          <strong>{Number(latestScoredSession?.manual_adjustment || 0).toFixed(2)}</strong>
                          <span>pts</span>
                        </div>
                      </div>
                    </div>

                    <div className="desempenho-divider"></div>

                    <div className="media-final-area">
                      <span>RESULTADO EFETIVO</span>
                      <div className="media-bar-container">
                        <div className="media-bar-fill" style={{ width: `${Math.min(100, Math.max(0, Number(latestScoredSession?.effective_score || 0) * 10))}%` }}></div>
                      </div>
                      <div className="media-final-score">{Number(latestScoredSession?.effective_score || 0).toFixed(2)}</div>
                    </div>
                  </>
                ) : (
                  <div style={{ padding: '28px 0', lineHeight: 1.6, fontWeight: 600 }}>
                    Você ainda não possui notas.
                    <br />
                    Aguarde ser avaliado para ver as notas.
                  </div>
                )}
              </div>

              {/* Status Cards */}
              <div className="status-cards-row">
                <div className={`status-card active-status ${profile?.status === 'eliminado' ? 'red' : ''}`}>
                  <div className="status-icon-circle">
                    {profile?.status === 'eliminado' ? <X size={24} strokeWidth={3} /> : <Check size={24} strokeWidth={3} />}
                  </div>
                  <div className="status-info">
                    <h5>SITUAÇÃO ATUAL</h5>
                    <h4>{profile?.status === 'eliminado' ? 'PERFIL BLOQUEADO' : 'VOCÊ ESTÁ ATIVO'}</h4>
                    <p>{profile?.status === 'eliminado' ? 'Edição desativada para candidato eliminado.' : 'Continue ensaiando para a próxima fase!'}</p>
                  </div>
                </div>

                <div className={`status-card eliminated-status ${profile?.status === 'eliminado' ? 'red' : ''}`}>
                  <div className="status-icon-circle">
                    <X size={24} strokeWidth={3} />
                  </div>
                  <div className="status-info">
                    <h5>STATUS DE ELIMINAÇÃO</h5>
                    <h4>{profile?.status === 'eliminado' ? 'ELIMINADO' : 'NÃO ELIMINADO'}</h4>
                    <p>{profile?.status === 'eliminado' ? 'Campos bloqueados para edição.' : 'Seu cadastro segue ativo no festival.'}</p>
                  </div>
                </div>
              </div>

              {/* Duvidas Card */}
              <div className="duvidas-card">
                <div className="duvidas-text">
                  <h3>Dúvidas sobre sua avaliação?</h3>
                  <p>Nossa equipe técnica está pronta para dar o feedback detalhado por video-chamada.</p>
                </div>
                <button className="btn-white">TIRE SUA DÚVIDA</button>
              </div>

            </div>

          </div>
          )}

          {activeMenu === 'notas' && (
            <div className="notas-container">
              <div className="notas-header-section">
                <div className="notas-title-box">
                  <h3>MINHAS NOTAS</h3>
                  <p>
                    {hasRealNotes
                      ? `Resultados reais da última sessão finalizada: ${latestResult?.session?.title || 'Sessão'}.`
                      : 'Seus resultados aparecerão aqui quando uma sessão for finalizada e liberada.'}
                  </p>
                </div>
                <div className="notas-status-card">
                  <div className="status-icon"><TrendingUp size={24} /></div>
                  <div className="status-text">
                    <span>STATUS GERAL</span>
                    <strong>{competitionStateLabel}</strong>
                  </div>
                </div>
              </div>
              
              <div className="notas-kpi-row">
                <div className="media-geral-card">
                  <div className="media-geral-header">MÉDIA GERAL</div>
                  <div className="media-geral-value">
                    <strong>{hasRealNotes ? averageEffectiveScore.toFixed(2) : '--'}</strong>
                    <span>/ 10</span>
                  </div>
                  <div className="media-geral-stars">
                    {[1, 2, 3, 4, 5].map((starIndex) => {
                      const starLimit = hasRealNotes ? Math.round((averageEffectiveScore / 10) * 5) : 0;
                      const isFilled = starIndex <= starLimit;

                      return (
                        <Star
                          key={starIndex}
                          size={18}
                          fill={isFilled ? '#FFDE00' : 'transparent'}
                          color={isFilled ? '#FFDE00' : '#B7A96A'}
                        />
                      );
                    })}
                  </div>
                  <div className="media-geral-desc">
                    {hasRealNotes
                      ? `Sessões avaliadas: ${sortedResults.length}`
                      : 'Aguarde ser avaliado para ver suas notas.'}
                  </div>
                  <div className="media-geral-decor">♩</div>
                </div>
                
                <div className="criterios-card">
                  <h4>{hasRealNotes ? 'Último Resultado Consolidado' : 'Resultado Pendente'}</h4>
                  <div className="criterio-bar-item">
                    <div className="criterio-bar-label">
                      <span>Média dos Jurados</span>
                      <strong>{hasRealNotes ? latestTechnicalScore.toFixed(2) : '--'}</strong>
                    </div>
                    <div className="criterio-bar-bg"><div className="criterio-bar-fill green" style={{ width: `${Math.min(100, Math.max(0, latestTechnicalScore * 10))}%` }}></div></div>
                  </div>
                  <div className="criterio-bar-item">
                    <div className="criterio-bar-label">
                      <span>Votos Públicos</span>
                      <strong>{hasRealNotes ? latestAdjustmentScore.toFixed(2) : '--'}</strong>
                    </div>
                    <div className="criterio-bar-bg"><div className="criterio-bar-fill olive" style={{ width: `${Math.min(100, Math.max(0, latestAdjustmentScore * 10))}%` }}></div></div>
                  </div>
                  <div className="criterio-bar-item">
                    <div className="criterio-bar-label">
                      <span>Resultado Efetivo</span>
                      <strong>{hasRealNotes ? latestEffectiveScore.toFixed(2) : '--'}</strong>
                    </div>
                    <div className="criterio-bar-bg"><div className="criterio-bar-fill blue" style={{ width: `${Math.min(100, Math.max(0, latestEffectiveScore * 10))}%` }}></div></div>
                  </div>
                </div>
              </div>

              <div className="evolucao-section">
                <h4>EVOLUÇÃO POR SESSÃO</h4>
                <div className="evolucao-cards">
                  {hasRealNotes ? (
                    sortedResults.map((result, index) => (
                      <div key={result?.session?.id || index} className={`evolucao-card ${index === 0 ? 'green' : 'grey'}`}>
                        <div className="evolucao-icon">{index === 0 ? <Check size={20} /> : <Clock size={20} />}</div>
                        <div className="evolucao-info">
                          <h5>{result?.session?.title || `Sessão #${result?.session?.id || '-'}`}</h5>
                          <p>
                            Posição {result?.position || '-'} de {result?.total_candidates || '-'}
                            {result?.session?.session_date ? ` • ${formatSessionDate(result.session.session_date)}` : ''}
                          </p>
                        </div>
                        <div className="evolucao-score">{Number(result?.effective_score || 0).toFixed(2)}</div>
                      </div>
                    ))
                  ) : (
                    <div className="evolucao-card grey">
                      <div className="evolucao-icon"><Clock size={20} /></div>
                      <div className="evolucao-info">
                        <h5>Sem avaliações finalizadas</h5>
                        <p>Quando a sessão terminar, seu histórico aparecerá aqui.</p>
                      </div>
                      <div className="evolucao-score">--</div>
                    </div>
                  )}
                </div>
              </div>

              <div className="comentarios-section">
                <h4>RESUMO DA ÚLTIMA AVALIAÇÃO</h4>
                <div className="comentarios-list">
                  <div className="comentario-card">
                    <div className="comentario-badge olive">RESULTADO</div>
                    <img src={profilePhoto} alt="Candidato" className="jurado-avatar" />
                    <div className="comentario-body">
                      <p>
                        {hasRealNotes
                          ? `Você obteve ${latestEffectiveScore.toFixed(2)} pontos na sessão ${latestResult?.session?.title || ''}. ${latestWinnerMessage || 'Resultado registrado com sucesso.'}`
                          : 'Você ainda não possui notas. Aguarde ser avaliado para visualizar o resumo da avaliação.'}
                      </p>
                      <div className="comentario-author olive">─────── PAINEL OFICIAL DO FESTIVAL</div>
                    </div>
                  </div>
                </div>
              </div>

              <div className="jurados-table-section">
                <h4>Notas dos Jurados</h4>
                {!hasRealNotes ? (
                  <div style={{ padding: '12px 0' }}>Aguardando avaliações dos jurados.</div>
                ) : (
                  (() => {
                    const judgeEntries = extractJudgeVotes(latestResult) || [];
                    // count how many judges submitted at least one score
                    const judgesWithVotes = judgeEntries.filter((j) => {
                      if (!j || !j.scores) return false;
                      return Object.values(j.scores).some((v) => v !== null && v !== undefined && v !== '');
                    });

                    const judgesCount = judgeEntries.length;
                    const votesCount = judgesWithVotes.length;

                    return (
                      <>
                        <div className="jurados-meta" style={{ marginBottom: 8 }}>
                          <span style={{ marginRight: 12 }}>Jurados registrados: <strong>{judgesCount}</strong></span>
                          <span>Jurados que já votaram: <strong>{votesCount}</strong></span>
                        </div>

                        <div className="jurados-table-wrap">
                          <table className="jurados-table">
                            <thead>
                              <tr>
                                <th>Critério</th>
                                {judgeEntries.map((j) => (
                                  <th key={j.id || j.name} style={{ textAlign: 'center' }}>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, justifyContent: 'center' }}>
                                      {j.avatar ? <img src={j.avatar} alt={j.name} style={{ width: 28, height: 28, borderRadius: 14 }} /> : <div className="jurado-initials" style={{ width: 28, height: 28, borderRadius: 14, background: '#ddd', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>{(j.name || 'J').slice(0,2).toUpperCase()}</div>}
                                    </div>
                                    <div style={{ fontSize: 12, marginTop: 6 }}>{j.name ? (j.name.length > 12 ? `${j.name.slice(0,12)}...` : j.name) : 'Jurado'}</div>
                                  </th>
                                ))}
                              </tr>
                            </thead>
                            <tbody>
                              {SCORE_CRITERIA.map((crit) => (
                                <tr key={crit.key}>
                                  <td>{crit.label}</td>
                                  {judgeEntries.map((j) => {
                                    const raw = readCriterionFromResult({ criteria: j.scores }, crit.key);
                                    const display = raw == null || Number.isNaN(Number(raw)) ? '--' : Number(raw).toFixed(2);
                                    return (
                                      <td key={`${crit.key}-${j.id || j.name}`} style={{ textAlign: 'center' }}>{display}</td>
                                    );
                                  })}
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      </>
                    );
                  })()
                )}
              </div>

              <div className="notas-actions">
                <p>
                  {hasRealNotes
                    ? `Melhor resultado até agora: ${Number(bestResult?.effective_score || 0).toFixed(2)} pontos.`
                    : 'Assim que os jurados concluírem sua avaliação, os resultados aparecerão aqui automaticamente.'}
                </p>
                <div className="notas-buttons">
                  <button className="btn-download-notas" type="button"><Download size={18} /> BAIXAR EXTRATO DE RESULTADOS</button>
                  <button className="btn-recorrer" type="button">ATUALIZAR DADOS</button>
                </div>
              </div>
            </div>
          )}

          {activeMenu === 'status' && (
            <div className="status-comp-container">
              <div className="status-comp-header">
                <div className="status-comp-title">
                  <h2>Sua Jornada no Arraial</h2>
                  <p>Acompanhe seu progresso rumo ao título de melhor sanfoneiro do Nordeste.</p>
                </div>
                <div className="status-comp-badge-card">
                  <div className={`badge-icon ${profile?.status === 'eliminado' ? 'red' : 'green'}`}>
                    {profile?.status === 'eliminado' ? <X size={28} strokeWidth={2.5} /> : <CheckCircle size={28} strokeWidth={2.5} />}
                  </div>
                  <div className="badge-info">
                    <span>STATUS ATUAL</span>
                    <strong>{competitionStateLabel}</strong>
                  </div>
                </div>
              </div>

              <div className="status-comp-body">
                {/* Timeline Column */}
                <div className="status-timeline-card">
                  <div className="timeline-header">
                    <Activity size={24} color="#7B692A" />
                    <h3>Fases da Competição</h3>
                  </div>
                  
                  <div className="timeline-container">
                    <div className="timeline-item">
                      <div className={`timeline-marker ${hasRealNotes ? 'concluded' : 'next'}`}>
                        {hasRealNotes ? <Check size={16} /> : <Clock size={16} />}
                      </div>
                      <div className={`timeline-content ${hasRealNotes ? 'concluded-card' : 'next-card'}`}>
                        <span className={`step-status ${hasRealNotes ? '' : 'next-status'}`}>
                          {hasRealNotes ? 'CONCLUÍDO' : 'AGUARDANDO'}
                        </span>
                        <h4>{hasRealNotes ? (latestResult?.session?.title || 'Sessão finalizada mais recente') : 'Nenhuma sessão finalizada'}</h4>
                        <p>
                          {hasRealNotes
                            ? `Pontuação ${latestEffectiveScore.toFixed(2)} • posição ${latestPosition || '-'} de ${latestTotalCandidates || '-'}.`
                            : sessions.length === 0
                            ? 'Aguardando os dados...'
                            : 'Nenhuma sessão finalizada com resultado liberado até o momento.'}
                        </p>
                        <div className={`step-date ${hasRealNotes ? '' : 'next-date'}`}><Calendar size={12} /> {latestResult?.session?.session_date ? formatSessionDate(latestResult.session.session_date) : 'Data não definida'}</div>
                      </div>
                    </div>
                    
                    <div className="timeline-line"></div>
                    
                    <div className="timeline-item">
                      <div className="timeline-marker next">
                        <Star size={16} />
                      </div>
                      <div className="timeline-content next-card">
                        <span className="step-status next-status">PRÓXIMA ETAPA</span>
                        <h4>{nextSession?.title || 'Aguardando nova etapa'}</h4>
                        <p>
                          {nextSession
                            ? `Prepare-se para a sessão ${nextSession.title}.`
                            : 'Ainda não há nova sessão agendada para o seu perfil.'}
                        </p>
                        <div className="step-date next-date"><Clock size={12} /> {nextSession?.session_date ? formatSessionDate(nextSession.session_date) : 'Em breve'}</div>
                      </div>
                    </div>
                    <div className="timeline-line-bottom"></div>
                  </div>
                </div>

                {/* Right Area Column */}
                <div className="status-right-column">
                  <div className="prep-hero-standalone" style={{ backgroundImage: "url('/img/theater_curtain.png')" }}>
                    <div className="prep-hero-overlay"></div>
                    <h3>O que Preparar para a apresentação</h3>
                  </div>
                  
                  <div className="prep-items-grid">
                    <div className="prep-item-card">
                      <div className="prep-item-card-icon olive">
                        <Music size={28} />
                      </div>
                      <div className="prep-item-card-body">
                        <h4>Música cadastrada</h4>
                        <p>{profile?.song_name || 'Você ainda não cadastrou a música da apresentação.'}</p>
                      </div>
                    </div>

                    <div className="prep-item-card">
                      <div className="prep-item-card-icon green">
                        <Shirt size={28} />
                      </div>
                      <div className="prep-item-card-body">
                        <h4>Figurino</h4>
                        <p>Escolha um figurino que combine com o seu estilo artístico e represente a cultura nordestina.</p>
                      </div>
                    </div>

                    <div className="prep-item-card">
                      <div className="prep-item-card-icon olive">
                        <Mic2 size={28} />
                      </div>
                      <div className="prep-item-card-body">
                        <h4>Afinação de voz</h4>
                        <p>Trabalhe a afinação vocal para garantir uma apresentação impecável no palco.</p>
                      </div>
                    </div>

                    <div className="prep-item-card">
                      <div className="prep-item-card-icon green">
                        <Users size={28} />
                      </div>
                      <div className="prep-item-card-body">
                        <h4>Coreografia</h4>
                        <p>Desenvolva movimentos e coreografia para complementar sua performance musical.</p>
                      </div>
                    </div>

                    <div className="prep-item-card">
                      <div className="prep-item-card-icon olive">
                        <FileText size={28} />
                      </div>
                      <div className="prep-item-card-body">
                        <h4>Músicas autorais</h4>
                        <p>Se tiver composições próprias, considere incluir no seu repertório de apresentação.</p>
                      </div>
                    </div>

                    <div className="prep-item-card">
                      <div className="prep-item-card-icon green">
                        <Star size={28} />
                      </div>
                      <div className="prep-item-card-body">
                        <h4>Interpretações diferentes</h4>
                        <p>Pratique interpretações variadas da música para surpreender e emocionar o público.</p>
                      </div>
                    </div>
                  </div>

                  <div className="prep-session-info">
                    <div className="prep-info-header">
                      <Calendar size={20} />
                      <span>Data e Horário da Apresentação</span>
                    </div>
                    <p className="prep-info-datetime">
                      {nextSession
                        ? `${formatSessionDate(nextSession.session_date)} às ${formatSessionTime(nextSession.session_time)}`
                        : 'Aguardando agendamento da próxima apresentação'}
                    </p>
                    <p className="prep-info-status">
                      {profile?.status === 'eliminado' ? '⚠️ Seu perfil está bloqueado para edição.' : '✓ Seu perfil está ativo para as próximas etapas.'}
                    </p>
                  </div>
                </div>
              </div>

              {/* Bottom Cards Row */}
              <div className="status-bottom-cards">
                <div className="info-card blue-card">
                  <Map size={24} />
                  <div className="card-lbl">LOCAL</div>
                  <div className="card-val">{nextSession?.location || latestResult?.session?.location || 'A definir'}</div>
                </div>
                
                <div className="info-card yellow-card">
                  <Users size={24} />
                  <div className="card-lbl">SESSÕES</div>
                  <div className="card-val">{finishedSessionsCount} finalizadas<br />{upcomingSessionsCount} pendentes</div>
                </div>

                <div className="info-card beige-card">
                  <Gift size={24} />
                  <div className="card-lbl">POSIÇÃO ATUAL</div>
                  <div className="card-val">{hasRealNotes ? `${latestPosition || '-'}º de ${latestTotalCandidates || '-'}` : 'Sem ranking'}</div>
                </div>
              </div>
            </div>
          )}

          {activeMenu === 'apresentacao' && (
            <div className="apresentacao-container">
              <div className="apresentacao-header">
                <h2>Minha Apresentação</h2>
                <p>Acompanhe informações sobre sua apresentação no festival.</p>
              </div>

              <div className="apresentacao-content">
                <div className="apresentacao-empty-state">
                  <div className="empty-state-icon">
                    <Calendar size={64} />
                  </div>
                  <h3>Aguardando agendamento</h3>
                  <p>Ainda não há uma data agendada para sua apresentação.</p>
                  <p className="empty-state-info">Assim que a produção confirmar o horário e local, você receberá uma notificação e as informações aparecerão aqui.</p>
                </div>

                <div className="apresentacao-checklist">
                  <h4>Prepare-se enquanto isso:</h4>
                  <div className="checklist-items">
                    <div className="checklist-item">
                      <div className="checklist-checkbox">
                        <Check size={20} />
                      </div>
                      <div className="checklist-text">
                        <span>Música selecionada</span>
                        <p>{profile?.song_name || 'Não informada'}</p>
                      </div>
                    </div>

                    <div className="checklist-item">
                      <div className="checklist-checkbox">
                        <Shirt size={20} />
                      </div>
                      <div className="checklist-text">
                        <span>Escolher figurino apropriado</span>
                        <p>Que combine com a cultura nordestina</p>
                      </div>
                    </div>

                    <div className="checklist-item">
                      <div className="checklist-checkbox">
                        <Mic2 size={20} />
                      </div>
                      <div className="checklist-text">
                        <span>Treinar afinação vocal</span>
                        <p>Garantir melhor desempenho no palco</p>
                      </div>
                    </div>

                    <div className="checklist-item">
                      <div className="checklist-checkbox">
                        <Users size={20} />
                      </div>
                      <div className="checklist-text">
                        <span>Desenvolver coreografia</span>
                        <p>Movimentos que complementem a performance</p>
                      </div>
                    </div>

                    <div className="checklist-item">
                      <div className="checklist-checkbox">
                        <Music size={20} />
                      </div>
                      <div className="checklist-text">
                        <span>Variar interpretações</span>
                        <p>Pratique diferentes formas de interpretar a música</p>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="apresentacao-info-card">
                  <div className="info-card-icon">
                    <Bell size={24} />
                  </div>
                  <div className="info-card-content">
                    <h5>Fique atento às notificações</h5>
                    <p>Você receberá uma notificação assim que sua data de apresentação for confirmada. Não esqueça de verificar seu perfil regularmente.</p>
                  </div>
                </div>
              </div>
            </div>
          )}

          {isEditModalOpen && (
            <div className="candidate-modal-overlay" onClick={closeEditModal}>
              <div className="candidate-modal" onClick={(event) => event.stopPropagation()}>
                <div className="candidate-modal-header">
                  <h3>Editar Perfil</h3>
                  <button type="button" className="candidate-modal-close" onClick={closeEditModal}>
                    <X size={18} />
                  </button>
                </div>

                <div className="candidate-photo-preview-row">
                  <img
                    src={modalPhotoPreview}
                    alt="Foto de perfil"
                    className="candidate-photo-preview"
                    onError={(event) => {
                      event.currentTarget.onerror = null;
                      event.currentTarget.src = DEFAULT_USER_IMAGE;
                    }}
                  />
                  <div>
                    <strong>Foto de perfil</strong>
                    <p>Selecione uma imagem JPG, PNG ou WEBP (até 10MB) para atualizar sua foto.</p>
                    <label className="candidate-photo-upload-button" htmlFor="candidate-photo-input">
                      {selectedPhotoFile ? 'Trocar imagem' : 'Selecionar imagem'}
                    </label>
                    <input
                      id="candidate-photo-input"
                      type="file"
                      accept="image/png,image/jpeg,image/webp"
                      onChange={handlePhotoChange}
                      disabled={!canEditProfile || isSavingProfile}
                      className="candidate-photo-upload-input"
                    />
                  </div>
                </div>

                <form className="candidate-modal-form" onSubmit={handleSaveProfile}>
                  <div className="candidate-modal-grid">
                    <div className="candidate-modal-field">
                      <label htmlFor="name">Nome completo</label>
                      <input id="name" name="name" value={editForm.name} onChange={handleEditInputChange} disabled={!canEditProfile || isSavingProfile} required />
                    </div>

                    <div className="candidate-modal-field">
                      <label htmlFor="artistic_name">Nome artístico</label>
                      <input id="artistic_name" name="artistic_name" value={editForm.artistic_name} onChange={handleEditInputChange} disabled={!canEditProfile || isSavingProfile} required />
                    </div>

                    <div className="candidate-modal-field">
                      <label htmlFor="birth_date">Data de nascimento</label>
                      <input id="birth_date" type="date" name="birth_date" value={editForm.birth_date} onChange={handleEditInputChange} disabled={!canEditProfile || isSavingProfile} />
                    </div>

                    <div className="candidate-modal-field">
                      <label htmlFor="phone">Telefone</label>
                      <input id="phone" name="phone" value={editForm.phone} onChange={handleEditInputChange} disabled={!canEditProfile || isSavingProfile} />
                    </div>

                    <div className="candidate-modal-field candidate-modal-field-full">
                      <label htmlFor="address">Endereço</label>
                      <input id="address" name="address" value={editForm.address} onChange={handleEditInputChange} disabled={!canEditProfile || isSavingProfile} />
                    </div>

                    <div className="candidate-modal-field candidate-modal-field-full">
                      <label htmlFor="song_name">Música da apresentação</label>
                      <input
                        id="song_name"
                        name="song_name"
                        value={editForm.song_name}
                        onChange={handleEditInputChange}
                        disabled={!canEditProfile || isSavingProfile || !canEditSongName}
                        placeholder={canEditSongName ? 'Informe sua música' : 'Música já definida'}
                      />
                      {!canEditSongName && (
                        <small className="candidate-modal-help">Música já definida. A troca só pode ser feita na próxima fase.</small>
                      )}
                    </div>
                  </div>

                  {editError && <div className="candidate-modal-error">{editError}</div>}

                  <div className="candidate-modal-actions">
                    <button type="button" className="candidate-modal-cancel" onClick={closeEditModal} disabled={isSavingProfile}>
                      Cancelar
                    </button>
                    <button type="submit" className="candidate-modal-save" disabled={isSavingProfile || !canEditProfile}>
                      {isSavingProfile ? 'Salvando...' : 'Salvar alterações'}
                    </button>
                  </div>
                </form>
              </div>
            </div>
          )}

          <footer className="site-footer">
            <div className="footer-diamonds">
              <div className="diamond green"></div>
              <div className="diamond yellow"></div>
              <div className="diamond blue"></div>
              <div className="diamond red"></div>
            </div>
            <h3>FESTIVAL DE FORRÓ 2026</h3>
            <p>© 2026 JR Produtora - O CORAÇÃO DO NORDESTE BATE AQUI.</p>
            <div className="footer-links">
              <button type="button">PRIVACIDADE</button>
              <button type="button">TERMOS DE USO</button>
              {/* <button type="button">CONTATO</button> */}
              <button type="button">EDITAL</button>
            </div>
          </footer>

        </main>
      </div>
    </div>
  );
};

export default CandidateArea;
