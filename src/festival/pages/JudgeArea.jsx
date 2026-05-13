import React, { useState, useEffect, useMemo, useRef } from 'react';
import { io } from 'socket.io-client';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { 
  LogOut, 
  MapPin, 
  Music, 
  AlertTriangle, 
  CheckCircle, 
  Calculator, 
  User,
  Clock,
  ChevronRight
} from 'lucide-react';
import '../styles/JudgeArea.css';

const API_FESTIVAL = process.env.API_FESTIVAL || 'http://localhost:3015';
const LOGO_PATH = '/img/LOGO_FESTIVAL_DE_FORRO.png';

const CRITERIA = [
  { id: 'tuning', label: 'Afinação' },
  { id: 'stage_presence', label: 'Presença de Palco' },
  { id: 'harmony', label: 'Melodia & Harmonia' },
  { id: 'rhythm', label: 'Ritmo' },
  { id: 'interpretation', label: 'Interpretação' },
  { id: 'authenticity', label: 'Autenticidade' },
  { id: 'diction', label: 'Dicção & Pronúncia' }
];

const JudgeArea = () => {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [session, setSession] = useState(null);
  const [candidate, setCandidate] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [hasVoted, setHasVoted] = useState(false);
  const [scores, setScores] = useState({
    tuning: 5.0,
    stage_presence: 5.0,
    harmony: 5.0,
    rhythm: 5.0,
    interpretation: 5.0,
    authenticity: 5.0,
    diction: 5.0
  });
  const [observations, setObservations] = useState('');
  const [timeRemaining, setTimeRemaining] = useState('00:00');
  const [isAlertModalOpen, setIsAlertModalOpen] = useState(false);
  const [alertForm, setAlertForm] = useState({ category: 'vote_error', message: '' });
  const [isAssigned, setIsAssigned] = useState(true); // Começa como true para não piscar erro
  const socketRef = useRef(null);

  // Mount: load stored user, fetch initial data and initialize socket (no polling)
  useEffect(() => {
    const storedUser = localStorage.getItem('user') || localStorage.getItem('festivalAdminUser');
    if (storedUser) {
      setUser(JSON.parse(storedUser));
    }

    fetchActiveData();

    const socketUrl = API_FESTIVAL && API_FESTIVAL.startsWith('http')
      ? API_FESTIVAL.replace(/\/api\/?$/i, '')
      : window.location.origin;

    socketRef.current = io(socketUrl, {
      transports: ['polling', 'websocket'],
      auth: { token: null },
      reconnectionAttempts: 5,
      reconnectionDelay: 1000,
    });

    socketRef.current.on('connect', () => {
      console.log('Socket conectado (JudgeArea):', socketRef.current.id);
    });

    socketRef.current.on('connect_error', (err) => {
      console.error('Socket connect_error (JudgeArea):', err?.message || err);
    });

    socketRef.current.on('session:updated', () => fetchActiveData());
    socketRef.current.on('session:candidates:updated', () => fetchActiveData());
    socketRef.current.on('session:candidate:removed', () => fetchActiveData());
    socketRef.current.on('session:active_candidate:updated', () => fetchActiveData());
    socketRef.current.on('session:active_candidate:released', () => fetchActiveData());
    socketRef.current.on('vote:judge:deleted', () => fetchActiveData());
    socketRef.current.on('vote:judge:updated', () => fetchActiveData());

    return () => {
      socketRef.current?.removeAllListeners();
      socketRef.current?.disconnect();
    };
  }, []);

  // When session or candidate changes, check existing judge vote
  useEffect(() => {
    if (session?.id && candidate?.id) {
      checkExistingVote(session.id, candidate.id);
    }
  }, [session?.id, candidate?.id]);

  // Emit join to room when session becomes available
  useEffect(() => {
    if (socketRef.current && session?.id) {
      console.log('Entrando na sala da sessão (JudgeArea):', session.id);
      socketRef.current.emit('session:join', session.id);
    }
  }, [session?.id]);

  const checkExistingVote = async (sessionId, candidateId) => {
    try {
      const token = localStorage.getItem('token') || localStorage.getItem('festivalAdminToken');
      const headers = { Authorization: `Bearer ${token}` };
      const res = await axios.get(`${API_FESTIVAL}/api/votes/judge/check`, { 
        params: { session_id: sessionId, candidate_id: candidateId },
        headers 
      });
      
      if (res.data.hasVoted) {
        setHasVoted(true);
        // Load the scores from the existing vote
        const v = res.data.vote;
        setScores({
          tuning: Number(v.tuning),
          stage_presence: Number(v.stage_presence),
          harmony: Number(v.harmony),
          rhythm: Number(v.rhythm),
          interpretation: Number(v.interpretation),
          authenticity: Number(v.authenticity),
          diction: Number(v.diction)
        });
      } else {
        setHasVoted(false);
        // Reset to defaults if not voted
        setScores({
          tuning: 5.0,
          stage_presence: 5.0,
          harmony: 5.0,
          rhythm: 5.0,
          interpretation: 5.0,
          authenticity: 5.0,
          diction: 5.0
        });
      }
    } catch (error) {
      console.error('Error checking vote:', error);
    }
  };

  const fetchActiveData = async () => {
    try {
      const token = localStorage.getItem('token') || localStorage.getItem('festivalAdminToken');
      const headers = { Authorization: `Bearer ${token}` };

      // 1. Pega as sessões
      const sessionsRes = await axios.get(`${API_FESTIVAL}/api/sessions`, { headers });
      const activeSession = sessionsRes.data.sessions?.find(s => s.status === 'judge_voting');
      console.debug('JudgeArea: /api/sessions response', sessionsRes.data.sessions?.length || 0, 'sessions');
      console.debug('JudgeArea: activeSession candidate/status', activeSession?.id, activeSession?.status, activeSession?.active_candidate_id);

      if (activeSession) {
        setSession(activeSession);

        // 2. NOVA VALIDAÇÃO: O jurado logado está escalado para esta sessão?
        // Vamos buscar os jurados daquela sessão específica
        const judgesRes = await axios.get(`${API_FESTIVAL}/api/sessions/${activeSession.id}/judges`, { headers });
        const sessionJudges = judgesRes.data.judges || [];
        
        // Verifica se o ID do usuário atual está no array de jurados da sessão
        const assigned = sessionJudges.some(j => Number(j.id) === Number(user?.id));
        console.debug('JudgeArea: session judges count', sessionJudges.length, 'assigned?', assigned, 'userId', user?.id);
        setIsAssigned(assigned);

        if (assigned && activeSession.active_candidate_id) {
          const candidateRes = await axios.get(`${API_FESTIVAL}/api/admin/candidates/${activeSession.active_candidate_id}`, { headers });
          const nextCandidate = candidateRes.data.candidate || candidateRes.data;
          setCandidate(nextCandidate);
          checkExistingVote(activeSession.id, nextCandidate.id);
        } else {
          setCandidate(null);
        }
      } else {
        setSession(null);
        setCandidate(null);
        setIsAssigned(true); // Reseta para não mostrar erro se não houver sessão ativa
      }
    } catch (error) {
      console.error('Error fetching judge data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleScoreChange = (id, value) => {
    setScores(prev => ({
      ...prev,
      [id]: parseFloat(value)
    }));
  };

  const partialAverage = useMemo(() => {
    const values = Object.values(scores);
    const sum = values.reduce((acc, val) => acc + val, 0);
    return (sum / values.length).toFixed(2);
  }, [scores]);

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('festivalAdminToken');
    localStorage.removeItem('user');
    localStorage.removeItem('festivalAdminUser');
    navigate('/festival-forro/admin/login');
  };

  const handleConfirmVote = async () => {
    if (!candidate || !session) return;
    
    setIsSubmitting(true);
    try {
      const token = localStorage.getItem('token') || localStorage.getItem('festivalAdminToken');
      const headers = { Authorization: `Bearer ${token}` };

      const payload = {
        session_id: session.id,
        candidate_id: candidate.id,
        ...scores,
        observations
      };

      await axios.post(`${API_FESTIVAL}/api/votes/judge`, payload, { headers });
      setHasVoted(true);
      alert('Voto confirmado com sucesso!');
    } catch (error) {
      console.error('Error submitting vote:', error);
      alert('Erro ao confirmar voto. Tente novamente.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const resolvePhotoUrl = (url) => {
    if (!url) return LOGO_PATH;
    if (url.startsWith('http')) return url;
    const serverRoot = API_FESTIVAL.replace(/\/api\/?$/i, '').replace(/\/$/, '');
    return `${serverRoot}/${url.replace(/^\//, '')}`;
  };

  if (isLoading) {
    return (
      <div className="judge-area-container">
        <div className="loading-state">
          <div className="loader-spinner"></div>
          <p>Carregando Área do Jurado...</p>
        </div>
      </div>
    );
  }

  const handleSendAlert = async () => {
    if (!alertForm.message.trim() || !session || !candidate) return;

    setIsSubmitting(true);
    try {
      const token = localStorage.getItem('token') || localStorage.getItem('festivalAdminToken');
      await axios.post(`${API_FESTIVAL}/api/alerts`, {
        session_id: session.id,
        candidate_id: candidate.id,
        category: alertForm.category, // Enviando a nova categoria
        message: alertForm.message
      }, { headers: { Authorization: `Bearer ${token}` } });

      setIsAlertModalOpen(false);
      setAlertForm({ category: 'vote_error', message: '' });
      alert('Alerta enviado para a administração.');
    } catch (err) {
      alert('Erro ao enviar alerta. Verifique sua conexão.');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Se não houver sessão em modo de votação dos jurados OU não houver candidato ativo
  if (!session || !candidate) {
    return (
      <div className="judge-area-container">
        <header className="judge-header">
          <div className="judge-brand">
            <img src={LOGO_PATH} alt="Logo" className="judge-logo-img" />
            <div className="judge-brand-info">
              <h1>FESTIVAL DE FORRÓ</h1>
              <p>ÁREA DO JURADO • {user?.name || 'MESA #01'}</p>
            </div>
          </div>
          <div className="judge-header-actions">
            <button className="btn-logout" onClick={handleLogout}>
              <LogOut size={18} /> SAIR
            </button>
          </div>
        </header>

        <div className="judge-waiting-container">
          <div className="waiting-icon-wrapper">
            <Clock size={48} />
          </div>
          <h2 className="waiting-title">SISTEMA EM ESPERA</h2>
          <p className="waiting-msg">Aguardando Administração liberar a votação do candidato.</p>
          <div className="waiting-badge">
            {session ? `STATUS: ${String(session.status).toUpperCase()}${session.active_candidate_id ? ` • CANDIDATO_ATIVO ${session.active_candidate_id}` : ''}` : 'NENHUMA SESSÃO ATIVA'}
          </div>
        </div>

        <footer className="judge-footer-links">
          <p className="footer-copy">© 2024 FESTIVAL DE FORRÓ - O CORAÇÃO DO NORDESTE BATE AQUI.</p>
        </footer>
      </div>
    );
  }


  // Caso o jurado NÃO esteja escalado para a sessão ativa
if (session && !isAssigned) {
  return (
    <div className="judge-area-container">
      <header className="judge-header">
        <div className="judge-brand">
          <img src={LOGO_PATH} alt="Logo" className="judge-logo-img" />
          <div className="judge-brand-info">
            <h1>FESTIVAL DE FORRÓ</h1>
            <p>ÁREA DO JURADO • {user?.name}</p>
          </div>
        </div>
        <div className="judge-header-actions">
          <button className="btn-logout" onClick={handleLogout}>
            <LogOut size={18} /> SAIR
          </button>
        </div>
      </header>

      <div className="judge-waiting-container blocked">
        <div className="waiting-icon-wrapper alert">
          <User size={48} color="#ef4444" />
        </div>
        <h2 className="waiting-title">ACESSO NÃO AUTORIZADO</h2>
        <p className="waiting-msg">
          Você não está escalado como jurado para a sessão: <br/>
          <strong>{session.title}</strong>.
        </p>
        <p className="waiting-submsg" style={{ fontSize: '14px', marginTop: '10px', color: '#6b7280' }}>
          Aguarde a administração realizar a sua escala ou selecione a sessão correta no painel administrativo.
        </p>
        <div className="waiting-badge danger">
          MESA ATUAL NÃO VINCULADA
        </div>
      </div>

      <footer className="judge-footer-links">
        <p className="footer-copy">© 2026 FESTIVAL DE FORRÓ - JR PRODUTORA.</p>
      </footer>
    </div>
  );
}

  return (
    <div className="judge-area-container">
      <header className="judge-header">
        <div className="judge-brand">
          <img src={LOGO_PATH} alt="Logo" className="judge-logo-img" />
          <div className="judge-brand-info">
            <h1>FESTIVAL DE FORRÓ</h1>
            <p>ÁREA DO JURADO • {user?.name || 'MESA #01'}</p>
          </div>
        </div>

        <div className="judge-header-actions">
          <div className="timer-box">
            <span className="timer-label">TEMPO RESTANTE</span>
            <span className="timer-value">{timeRemaining}</span>
          </div>
          <button className="btn-logout" onClick={handleLogout}>
            <LogOut size={18} /> SAIR
          </button>
        </div>
      </header>

      <main className="judge-main">
        {/* Left Column */}
        <section className="judge-left-col">
          <div className="candidate-card">
            <div className="candidate-photo-wrapper">
              <img 
                src={resolvePhotoUrl(candidate?.profile_photo_url || candidate?.photo_url)} 
                alt={candidate?.artistic_name} 
                className="candidate-photo" 
              />
              <div className="star-badge">★</div>
              <div className="candidate-photo-overlay">
                <span className="current-label">CANDIDATO ATUAL</span>
                <h2 className="candidate-name">{candidate?.artistic_name || 'Aguardando...'}</h2>
              </div>
            </div>
            
            <div className="candidate-details">
              <div className="candidate-location">
                <MapPin size={18} />
                <span>{candidate?.city || '---'} - {candidate?.state || '--'}</span>
              </div>

              <div className="song-info-card">
                <span className="info-label">MÚSICA EM APRESENTAÇÃO</span>
                <h3 className="song-title">"{candidate?.song_title || 'Não informada'}"</h3>
                <p className="song-composer">Compositor: {candidate?.song_composer || 'Desconhecido'}</p>
              </div>
            </div>
          </div>

          <div className="observations-card">
            <div className="obs-header">
              <Calculator size={18} />
              <span>Observações do Jurado</span>
            </div>
            <textarea 
              className="obs-textarea" 
              placeholder="Anote suas impressões técnicas aqui..."
              value={observations}
              onChange={(e) => setObservations(e.target.value)}
            ></textarea>
          </div>

          <button 
            className="btn-alert" 
            onClick={() => setIsAlertModalOpen(true)}
          >
            <AlertTriangle size={20} /> ALERTA
          </button>
        </section>

        {/* Right Column */}
        <section className="voting-ballot">
          <div className="ballot-header">
            <h2>BOLETIM DE VOTAÇÃO</h2>
            <p>{session?.title || 'Festival de Forró'} - Edição 2026</p>
          </div>

          <div className="divider-dots"></div>

          <div className="criteria-list">
            {CRITERIA.map((criterion) => (
              <div key={criterion.id} className="criterion-item">
                <div className="criterion-header">
                  <span className="criterion-name">{criterion.label}</span>
                  <div className="criterion-score-badge">
                    Nota: {scores[criterion.id].toFixed(1)}
                  </div>
                </div>
                <div className="slider-container">
                  <input 
                    type="range" 
                    min="0" 
                    max="10" 
                    step="0.1" 
                    className="score-slider"
                    value={scores[criterion.id]}
                    onChange={(e) => handleScoreChange(criterion.id, e.target.value)}
                    disabled={hasVoted}
                  />
                  <div className="slider-labels">
                    <span>Mínimo</span>
                    <span>Médio</span>
                    <span>Máximo</span>
                  </div>
                </div>
              </div>
            ))}
          </div>

          <footer className="ballot-footer">
            <div className="average-box">
              <div className="average-icon">
                <Calculator size={28} />
              </div>
              <div className="average-info">
                <span className="average-label">MÉDIA GERAL PARCIAL</span>
                <span className="average-value">{partialAverage}</span>
              </div>
            </div>

            <button 
              className="btn-confirm-vote" 
              onClick={handleConfirmVote}
              disabled={isSubmitting || !candidate || hasVoted}
            >
              {isSubmitting ? 'Enviando...' : (
                hasVoted ? (
                  <>Voto Já Registrado <CheckCircle size={24} /></>
                ) : (
                  <>Confirmar Voto <CheckCircle size={24} /></>
                )
              )}
            </button>
          </footer>
        </section>
      </main>

      <footer className="judge-footer-links">
        <p className="footer-copy">© 6 FESTIVAL DE FORRÓ - O CORAÇÃO DO NORDESTE BATE AQUI.</p>
        <nav className="footer-nav">
          <a href="#">Privacidade</a>
          <a href="#">Termos de Uso</a>
          <a href="#">Suporte Técnico</a>
        </nav>
      </footer>


      {isAlertModalOpen && (
        <div className="judge-modal-overlay">
          <div className="judge-modal-content">
            <div className="modal-header-alert">
              <AlertTriangle size={24} color="#ef4444" />
              <h3>Emitir Alerta Urgente</h3>
            </div>
            
            <p className="modal-description">
              Informe o tipo de problema para que a administração possa agir rápido.
            </p>

            <div className="modal-field">
              <label>Tipo de Ocorrência</label>
              <select 
                value={alertForm.category} 
                onChange={(e) => setAlertForm({...alertForm, category: e.target.value})}
                className="modal-select"
              >
                <option value="vote_error">Erro na minha nota (Voto)</option>
                <option value="system_error">Problema no Sistema/Tablet</option>
                <option value="general">Outro (Som, Iluminação, etc)</option>
              </select>
            </div>

            <div className="modal-field">
              <label>Descrição do Problema</label>
              <textarea 
                placeholder="Ex: Votei 8.0 mas era 9.0 ou O tablet está travando..."
                value={alertForm.message}
                onChange={(e) => setAlertForm({...alertForm, message: e.target.value})}
                className="modal-textarea"
                rows="4"
              />
            </div>

            <div className="modal-actions">
              <button 
                className="btn-cancel" 
                onClick={() => setIsAlertModalOpen(false)}
                disabled={isSubmitting}
              >
                CANCELAR
              </button>
              <button 
                className="btn-send-alert" 
                onClick={handleSendAlert}
                disabled={isSubmitting || !alertForm.message.trim()}
              >
                {isSubmitting ? 'ENVIANDO...' : 'ENVIAR ALERTA'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default JudgeArea;
