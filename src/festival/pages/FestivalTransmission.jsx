import React, { useCallback, useEffect, useMemo, useState, useRef } from 'react';
import { io } from 'socket.io-client';
import { useParams } from 'react-router-dom';
import axios from 'axios';
import { Heart, Trophy, Star, CheckCircle, Music, Award, RefreshCw } from 'lucide-react';
import '../styles/FestivalTransmission.css';

const TRANSMISSION_LABELS = {
  idle: 'Tela em branco',
  total_public_votes: 'Total de votos públicos',
  ranking_public: 'Ranking dos votos públicos',
  ranking_judges: 'Ranking dos votos dos jurados',
  winners: 'Vencedores',
  current_candidate_score: 'Pontuação do candidato'
};

const apiBase = process.env.API_FESTIVAL || 'http://localhost:3015';
const LOGO_PATH = '/img/LOGO_FESTIVAL_DE_FORRO.png';

const getToken = () => localStorage.getItem('festivalAdminToken') || localStorage.getItem('token') || localStorage.getItem('authToken') || '';

const FestivalTransmission = () => {
  const { sessionId } = useParams();
  const [session, setSession] = useState(null);
  const [broadcast, setBroadcast] = useState({ display_mode: 'idle', show_names: true });
  const [results, setResults] = useState(null);
  const [audit, setAudit] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState('');

  const selectedMode = broadcast?.display_mode || 'idle';

  const lastLocalUpdateRef = useRef(null);
  const socketRef = useRef(null);

  const resolvePhotoUrl = (url) => {
    const val = String(url || '').trim();
    if (!val) return LOGO_PATH;
    
    if (val.startsWith('http://') || val.startsWith('https://') || val.startsWith('data:') || val.startsWith('/img/') || val.startsWith('blob:')) {
      return val;
    }

    const isUploadFile = val.startsWith('uploads/') || val.startsWith('/uploads/');
    const normalizedPath = val.startsWith('/') ? val : `/${val}`;

    if (isUploadFile) {
      // Remove /api from end of apiBase to get server root
      const serverRoot = apiBase.replace(/\/api\/?$/i, '').replace(/\/$/, '');
      return `${serverRoot}${normalizedPath}`;
    }

    return `${apiBase}${normalizedPath}`;
  };

  const loadTransmissionData = useCallback(async () => {
    if (!sessionId) return;

    const token = getToken();
    const headers = token ? { Authorization: `Bearer ${token}` } : {};

    try {
      const [sessionsResponse, broadcastResponse, resultsResponse, auditResponse] = await Promise.all([
        axios.get(`${apiBase}/api/sessions`, { headers }),
        axios.get(`${apiBase}/api/sessions/${sessionId}/broadcast`, { headers }),
        axios.get(`${apiBase}/api/sessions/${sessionId}/results`, { headers }),
        axios.get(`${apiBase}/api/sessions/${sessionId}/audit`, { headers }).catch(() => ({ data: { auditData: [] } }))
      ]);

      const currentSession = Array.isArray(sessionsResponse?.data?.sessions)
        ? sessionsResponse.data.sessions.find((item) => Number(item.id) === Number(sessionId))
        : null;

      setSession(currentSession || null);
      const serverBroadcast = broadcastResponse?.data?.broadcast || null;
      const serverUpdatedRaw = serverBroadcast?.updated_at ?? serverBroadcast?.updatedAt ?? null;
      let serverUpdatedMs = 0;
      if (serverUpdatedRaw) {
        serverUpdatedMs = typeof serverUpdatedRaw === 'number' ? serverUpdatedRaw : (Date.parse(String(serverUpdatedRaw)) || 0);
      }

      const lastLocalMs = lastLocalUpdateRef.current || 0;
      if (lastLocalMs && serverUpdatedMs && serverUpdatedMs <= lastLocalMs) {
        // keep optimistic local state
      } else {
        setBroadcast(serverBroadcast || { display_mode: 'idle', show_names: true });
      }
      setResults(resultsResponse?.data || null);
      setAudit(auditResponse?.data?.auditData || []);
      setErrorMsg('');
    } catch (error) {
      setErrorMsg(error?.response?.data?.message || 'Não foi possível carregar a transmissão.');
    } finally {
      setIsLoading(false);
    }
  }, [sessionId]);

  useEffect(() => {
    loadTransmissionData();
    const handleStorageUpdate = (event) => {
      if (event.key === `festival-transmission-update-${sessionId}` && event.newValue) {
        try {
          const parsed = JSON.parse(event.newValue);
          if (parsed && String(parsed.sessionId) === String(sessionId) && parsed.display_mode) {
            lastLocalUpdateRef.current = parsed.updatedAt || parsed.updated_at || Date.now();
            setBroadcast((prev) => ({ ...(prev || {}), display_mode: parsed.display_mode }));
            const needsFetch = ['total_public_votes', 'ranking_public', 'ranking_judges', 'winners', 'current_candidate_score'].includes(parsed.display_mode);
            if (needsFetch) loadTransmissionData();
            return;
          }
        } catch (err) {}
        loadTransmissionData();
      }
    };

    const handleVisibilityChange = () => {
      if (!document.hidden) loadTransmissionData();
    };

    window.addEventListener('storage', handleStorageUpdate);
    document.addEventListener('visibilitychange', handleVisibilityChange);

    return () => {
      window.removeEventListener('storage', handleStorageUpdate);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [loadTransmissionData, sessionId]);

  useEffect(() => {
    if (!sessionId) return;
    const connectSocket = async () => {
      try {
        if (socketRef.current) {
          socketRef.current.emit('session:join', sessionId);
          return;
        }
        const token = getToken();
        const origin = apiBase.replace(/\/api\/?$/i, '').replace(/\/$/, '');
        const socket = io(origin, { 
          transports: ['polling', 'websocket'],
          auth: { token } 
        });
        socketRef.current = socket;
        socket.on('connect', () => socket.emit('session:join', sessionId));
        socket.on('session:broadcast:updated', (payload) => {
          if (payload && Number(payload.sessionId) === Number(sessionId)) {
            const next = payload.broadcast || payload;
            lastLocalUpdateRef.current = Date.now();
            setBroadcast((prev) => ({ ...(prev || {}), ...next }));
            const needsFetch = ['total_public_votes', 'ranking_public', 'ranking_judges', 'winners', 'current_candidate_score'].includes(next.display_mode);
            if (needsFetch) loadTransmissionData();
          }
        });
        
        socket.on('session:updated', () => loadTransmissionData());
        socket.on('session:candidates:updated', () => loadTransmissionData());
        socket.on('session:candidate:removed', () => loadTransmissionData());
        socket.on('session:active_candidate:updated', () => loadTransmissionData());
        socket.on('session:active_candidate:released', () => loadTransmissionData());
        socket.on('vote:public:created', () => loadTransmissionData());
        socket.on('vote:judge:created', () => loadTransmissionData());
        socket.on('vote:judge:deleted', () => loadTransmissionData());
        socket.on('session:manual_adjustment:updated', () => loadTransmissionData());
      } catch (err) {}
    };
    connectSocket();
    return () => {
      if (socketRef.current) {
        socketRef.current.emit('session:leave', sessionId);
        socketRef.current.disconnect();
        socketRef.current = null;
      }
    };
  }, [sessionId, loadTransmissionData, apiBase]);

  const title = useMemo(() => session?.title || `Sessão ${sessionId}`, [session, sessionId]);

  const renderModeContent = () => {
    if (selectedMode === 'ranking_judges') {
      const rows = results?.technical_ranking || [];
      const leader = rows[0];
      

      // TELA DE RANKING TÉCNICO - VOTOS DOS JURADOS
      return (
        <div className="public-ranking-screen jury-version">
          <header className="public-header-fidelity">
            <span className="label">RANKING TÉCNICO</span>
            <h2>AVALIAÇÃO DO JÚRI: <span>{session?.title || 'JURADOS'}</span></h2>
            <div className="underline" style={{ background: 'linear-gradient(90deg, #1355a6, transparent)' }}></div>
          </header>

          {leader && (
            <div className="leader-card-fidelity">
              <div className="rank-diamond-badge" style={{ backgroundColor: '#1355a6' }}>
                <span>1º</span>
              </div>
              <div className="leader-photo-side">
                <img src={resolvePhotoUrl(leader.profile_photo_url || leader.photo_url || leader.candidate_profile_photo_url || leader.user_profile_photo_url)} alt={leader.artistic_name || leader.name} />
              </div>
              <div className="leader-info-side">
                <div className="absolute-leadership" style={{color: '#60a5fa' }}>
                  <Award size={16} fill="currentColor" />
                  DESEMPENHO SUPERIOR
                </div>
                <div className="leader-name-fidelity">{leader.artistic_name || leader.name}</div>
                
                <div className="leader-stats-row">
                  <div className="leader-votos-num">Média: {Number(leader.judge_average || 0).toFixed(2)}</div>
                  <div className="leader-percent-num">
                    {(Number(leader.judge_average || 0) * 10).toFixed(0)}% de Precisão
                  </div>
                </div>
                <div className="leader-progress-fidelity">
                  <div className="leader-progress-fill" style={{ width: `${(Number(leader.judge_average || 0) / 10) * 100}%`, backgroundColor: '#1355a6' }}></div>
                </div>
              </div>
            </div>
          )}

          <div className="secondary-list-fidelity">
            {rows.slice(1, 5).map((item, index) => {
              const average = Number(item.judge_average || 0);
              const percent = (average / 10) * 100;
              const rankColor = (index + 2) === 2 ? 'blue' : (index + 2) === 3 ? 'green' : 'dark';
              return (
                <div key={item.candidate_id} className="ranking-item-fidelity">
                  <div className={`item-rank-diamond ${rankColor}`}>
                    <span>{index + 2}º</span>
                  </div>
                  <div className="item-photo-fidelity">
                     <img src={resolvePhotoUrl(item.profile_photo_url || item.photo_url || item.candidate_profile_photo_url || item.user_profile_photo_url)} alt={item.artistic_name || item.name} />
                  </div>
                  <div className="item-content-fidelity">
                    <div className="item-name-fidelity">{item.artistic_name || item.name}</div>
                    <div className="item-progress-fidelity">
                      <div className="item-progress-fill-fidelity" style={{ 
                        width: `${percent}%`, 
                        backgroundColor: (index + 2) === 2 ? '#1355a6' : (index + 2) === 3 ? '#4ade80' : 'rgba(255,255,255,0.2)' 
                      }}></div>
                    </div>
                  </div>
                  <div className="item-stats-fidelity">
                    Nota: {average.toFixed(2)} <span>({percent.toFixed(0)}%)</span>
                  </div>
                </div>
              );
            })}
          </div>

          <footer className="jury-footer-fidelity" style={{ marginTop: '40px' }}>
            <div className="status-realtime">
              <div className="status-dot-red"></div>
              AVALIAÇÃO TÉCNICA EM TEMPO REAL
            </div>
            <div className="validation-pill">
              <CheckCircle size={20} />
              Júri Técnico Validado
            </div>
          </footer>
        </div>
      );
    }

    if (selectedMode === 'ranking_public') {
      const rows = results?.popular_ranking || [];
      const leader = rows[0];
      const totalVotes = rows.reduce((acc, r) => acc + Number(r.public_votes || 0), 0);
      

      // TELA DE RANKING POPULAR - VOTOS DO PÚBLICO
      return (
        <div className="public-ranking-screen">
          <header className="public-header-fidelity">
            <span className="label">RANKING POPULAR</span>
            <h2>AVALIAÇÃO DO PUBLICO: <span>{session?.title || 'FESTIVAL'}</span></h2>
            <div className="underline"></div>
          </header>

          {leader && (
            <div className="leader-card-fidelity">
              <div className="rank-diamond-badge">
                <span>1º</span>
              </div>
              <div className="leader-photo-side">
                <img src={resolvePhotoUrl(leader.profile_photo_url || leader.photo_url || leader.candidate_profile_photo_url || leader.user_profile_photo_url)} alt={leader.artistic_name || leader.name} />
              </div>
              <div className="leader-info-side">
                <div className="absolute-leadership">
                  <Star size={16} fill="currentColor" />
                  LIDERANÇA ABSOLUTA
                </div>
                <div className="leader-name-fidelity">{leader.artistic_name || leader.name}</div>
                
                <div className="leader-stats-row">
                  <div className="leader-votos-num">{Number(leader.public_votes).toLocaleString('pt-BR')} Votos</div>
                  <div className="leader-percent-num">
                    {totalVotes > 0 ? Math.round((leader.public_votes / totalVotes) * 100) : 0}%
                  </div>
                </div>
                <div className="leader-progress-fidelity">
                  <div className="leader-progress-fill" style={{ width: `${totalVotes > 0 ? (leader.public_votes / totalVotes) * 100 : 0}%` }}></div>
                </div>
              </div>
            </div>
          )}

          <div className="secondary-list-fidelity">
            {rows.slice(1, 5).map((item, index) => {
              const percent = totalVotes > 0 ? Math.round((item.public_votes / totalVotes) * 100) : 0;
              const rankColor = (index + 2) === 2 ? 'blue' : (index + 2) === 3 ? 'green' : 'dark';
              return (
                <div key={item.candidate_id} className="ranking-item-fidelity">
                  <div className={`item-rank-diamond ${rankColor}`}>
                    <span>{index + 2}º</span>
                  </div>
                  <div className="item-photo-fidelity">
                     <img src={resolvePhotoUrl(item.profile_photo_url || item.photo_url || item.candidate_profile_photo_url || item.user_profile_photo_url)} alt={item.artistic_name || item.name} />
                  </div>
                  <div className="item-content-fidelity">
                    <div className="item-name-fidelity">{item.artistic_name || item.name}</div>
                    <div className="item-progress-fidelity">
                      <div className="item-progress-fill-fidelity" style={{ 
                        width: `${percent}%`, 
                        backgroundColor: (index + 2) === 2 ? '#1355a6' : (index + 2) === 3 ? '#4ade80' : 'rgba(255,255,255,0.2)' 
                      }}></div>
                    </div>
                  </div>
                  <div className="item-stats-fidelity">
                    {Number(item.public_votes).toLocaleString('pt-BR')} Votos <span>({percent}%)</span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      );
    }

    if (selectedMode === 'winners') {
      const rows = results?.technical_ranking || [];
      const judgesCount = Number(session?.winners_count_judges || 3);
      const publicCount = Number(session?.winners_count_public || 1);
      
      const podiumRaw = rows.slice(0, judgesCount);
      // Map to specific positions: [2nd, 1st, 3rd] if exists
      const podium = [];
      if (podiumRaw.length >= 2) podium[0] = podiumRaw[1]; // 2nd
      if (podiumRaw.length >= 1) podium[1] = podiumRaw[0]; // 1st
      if (podiumRaw.length >= 3) podium[2] = podiumRaw[2]; // 3rd
      // Additional judge winners beyond the top 3
      const additionalJudgeWinners = podiumRaw.length > 3 ? podiumRaw.slice(3) : [];

      const popularWinners = results?.popular_winners || [];
      const isGrandeFinal = session?.title?.toLowerCase().includes('grande final');

      return (
        <div className="winners-screen-fidelity scale-in-center">
          <header className="winners-header-fidelity">
            <h4 style={{ color: 'var(--transmission-gold)', letterSpacing: '2px', fontSize: '14px', marginBottom: '10px' }}>— EDIÇÃO ESPECIAL 2026 —</h4>
            <h1 style={{ fontSize: '4rem', fontWeight: 900, textTransform: 'uppercase', color: '#fff', textShadow: '0 4px 15px rgba(0,0,0,0.5)' }}>
              RESULTADO: {session?.title || 'FESTIVAL'}
            </h1>
            <p style={{ color: '#a7f3d0', fontSize: '1.2rem', marginTop: '10px' }}>FESTIVAL DE FORRÓ</p>
          </header>

          <div className="winners-podium-grid-fidelity">
            {/* Second Place */}
            {podium[0] && (
              <div className="winner-podium-column-fidelity pos-2">
                <div className="winner-card-fidelity second">
                  <div className="floating-rank-badge blue">2º</div>
                  <div className="winner-photo-wrap">
                    <img src={resolvePhotoUrl(podium[0]?.profile_photo_url || podium[0]?.photo_url || podium[0]?.candidate_profile_photo_url || podium[0]?.user_profile_photo_url)} alt={podium[0]?.artistic_name || podium[0]?.name} />
                  </div>
                  <div className="winner-name-fidelity">{podium[0]?.artistic_name || podium[0]?.name || '---'}</div>
                  <div className="winner-score-pill-fidelity blue">
                    <Star size={20} fill="currentColor" />
                    {Number(podium[0]?.judge_average || 0).toFixed(2)}
                  </div>
                </div>
                <div className="winner-base-fidelity silver">
                  <div className="winner-base-text">PRATA</div>
                </div>
              </div>
            )}

            {/* First Place */}
            {podium[1] && (
              <div className="winner-podium-column-fidelity pos-1">
                <div className="winner-card-fidelity first" style={isGrandeFinal ? { minHeight: '550px' } : {}}>
                  <div className="winner-crown-fidelity"><Star size={48} fill="currentColor" /></div>
                  <div className="floating-rank-badge gold">1º LUGAR</div>
                  <div className="winner-photo-wrap" style={{ padding: '10px', background: 'rgba(255,255,255,0.05)', borderRadius: '15px' }}>
                    <img src={resolvePhotoUrl(podium[1]?.profile_photo_url || podium[1]?.photo_url || podium[1]?.candidate_profile_photo_url || podium[1]?.user_profile_photo_url)} alt={podium[1]?.artistic_name || podium[1]?.name} />
                  </div>
                  <div className="winner-name-fidelity">{podium[1]?.artistic_name || podium[1]?.name || '---'}</div>
                  <div className="winner-score-pill-fidelity gold">
                    <Trophy size={28} />
                    {Number(podium[1]?.judge_average || 0).toFixed(2)}
                  </div>
                </div>
                <div className="winner-base-fidelity gold">
                  <div className="winner-base-text">OURO</div>
                </div>
              </div>
            )}

            {/* Third Place */}
            {podium[2] && (
              <div className="winner-podium-column-fidelity pos-3">
                <div className="winner-card-fidelity third">
                  <div className="floating-rank-badge orange">3º</div>
                  <div className="winner-photo-wrap">
                    <img src={resolvePhotoUrl(podium[2]?.profile_photo_url || podium[2]?.photo_url || podium[2]?.candidate_profile_photo_url || podium[2]?.user_profile_photo_url)} alt={podium[2]?.artistic_name || podium[2]?.name} />
                  </div>
                  <div className="winner-name-fidelity">{podium[2]?.artistic_name || podium[2]?.name || '---'}</div>
                  <div className="winner-score-pill-fidelity orange">
                    <Star size={20} fill="currentColor" />
                    {Number(podium[2]?.judge_average || 0).toFixed(2)}
                  </div>
                </div>
                <div className="winner-base-fidelity bronze">
                  <div className="winner-base-text">BRONZE</div>
                </div>
              </div>
            )}

            {/* Additional judge winners (4th place onwards) */}
            {additionalJudgeWinners.map((item) => (
              <div key={`judge-${item.candidate_id}`} className="winner-podium-column-fidelity pos-pop">
                <div style={{ width: '100%' }}>
                  <div className="winner-card-fidelity third" style={{ minHeight: '380px' }}>
                    <div className="winner-photo-wrap">
                      <img src={resolvePhotoUrl(item.profile_photo_url || item.photo_url || item.candidate_profile_photo_url || item.user_profile_photo_url)} alt={item.artistic_name || item.name} />
                    </div>
                    <div className="winner-name-fidelity">{item.artistic_name || item.name || '---'}</div>
                    <div className="winner-score-pill-fidelity orange">
                      <Star size={20} fill="currentColor" style={{ marginRight: '4px' }} />
                      {Number(item.judge_average || 0).toFixed(2)}
                    </div>
                  </div>
                  <div className="winner-base-fidelity bronze">
                    <div className="winner-base-text">BRONZE</div>
                  </div>
                </div>
              </div>
            ))}

            {/* Popular Choices */}
            {popularWinners.map((pw, idx) => (
              <div key={`pop-${pw.candidate_id || idx}`} className="winner-podium-column-fidelity pos-pop">
                <div style={{ width: '100%' }}>
                  <div className={`winner-card-fidelity popular ${idx === 0 ? 'popular-first' : ''}`} style={{ minHeight: '380px' }}>
                    {idx === 0 && <div className="floating-rank-badge red">FAVORITO DO PÚBLICO</div>}
                    <div className="winner-photo-wrap" style={{ filter: 'grayscale(0.5)' }}>
                      <img src={resolvePhotoUrl(pw?.profile_photo_url || pw?.photo_url || pw?.candidate_profile_photo_url || pw?.user_profile_photo_url)} alt={pw?.artistic_name || pw?.name} />
                    </div>
                    <div className="winner-name-fidelity">{pw?.artistic_name || pw?.name || '---'}</div>
                    <div className="winner-score-pill-fidelity red">
                      <Heart size={18} fill="currentColor" style={{ marginRight: '5px' }} />
                      {Number(pw?.public_votes || 0).toLocaleString('pt-BR')} Votos
                    </div>
                  </div>
                  <div className="winner-base-fidelity red">
                    <div className="winner-base-text">POPULAR</div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      );
    }

    if (selectedMode === 'current_candidate_score') {
      const activeCandidateId = session?.active_candidate_id;
      if (!activeCandidateId) {
        return (
          <div className="transmission-waiting">
            <h2>AGUARDANDO CANDIDATO...</h2>
          </div>
        );
      }

      // Find candidate data in audit
      const candidateAudit = Array.isArray(audit) ? audit.find(a => Number(a.candidate_id) === Number(activeCandidateId)) : null;
      // Check in technical_ranking for averages
      const candidateResult = results?.technical_ranking?.find(r => Number(r.candidate_id) === Number(activeCandidateId));
      
      // Check in session candidates or participants list
      const sessionCandidate = (Array.isArray(session?.candidates) ? session.candidates : [])
        .concat(Array.isArray(session?.participants) ? session.participants : [])
        .find(c => Number(c.id || c.candidate_id || c.userId) === Number(activeCandidateId));

      const candidateName = session?.active_candidate_name ||
                            candidateAudit?.artistic_name || 
                            candidateAudit?.name || 
                            candidateResult?.artistic_name || 
                            sessionCandidate?.artistic_name || 
                            sessionCandidate?.name || 
                            candidateResult?.name || 
                            '---';
      
      const rawPhoto = session?.active_candidate_photo ||
                       candidateAudit?.profile_photo_url || 
                       candidateAudit?.photo_url ||
                       candidateAudit?.photo ||
                       candidateAudit?.avatar ||
                       candidateResult?.profile_photo_url || 
                       candidateResult?.photo_url || 
                       candidateResult?.photo ||
                       sessionCandidate?.profile_photo_url || 
                       sessionCandidate?.photo_url ||
                       sessionCandidate?.photo ||
                       sessionCandidate?.avatar ||
                       sessionCandidate?.profile_photo ||
                       sessionCandidate?.image;
                       
      const photoUrl = resolvePhotoUrl(rawPhoto);

      // We need to map the votes. Audit usually has a 'votes' array.
      const votes = candidateAudit?.votes || [];
      
      // We expect Jurors A, B, C, D. If we have more or less, we map what we have.
      const jurors = ['JURADO A', 'JURADO B', 'JURADO C', 'JURADO D'];
      
      const criteriaList = [
        { key: 'tuning', label: 'AFINAÇÃO' },
        { key: 'stage_presence', label: 'PRESENÇA DE PALCO' },
        { key: 'harmony', label: 'MELODIA / HARMONIA' },
        { key: 'rhythm', label: 'RITMO' },
        { key: 'interpretation', label: 'INTERPRETAÇÃO' },
        { key: 'authenticity', label: 'AUTENTICIDADE' },
        { key: 'diction', label: 'DICÇÃO / PRONÚNCIA' }
      ];

      const getVoteValue = (jurorIndex, criterionKey) => {
        const vote = votes[jurorIndex];
        if (!vote) return '-';
        const val = vote[criterionKey];
        if (val === undefined || val === null) return '-';
        return Number(val).toFixed(1).replace('.0', '');
      };

      const finalAverage = candidateResult?.judge_average || 0;
      const currentRank = results?.technical_ranking?.findIndex(r => Number(r.candidate_id) === Number(activeCandidateId)) + 1 || '-';


      // TELA DE PONTUAÇÃO DO CANDIDATO ATIVO - VOTOS DOS JURADOS EM TEMPO REAL
      return (
        <div className="candidate-score-fidelity">
          <div className="score-left-column">
             <div className="candidate-image-bg">
                <img src={photoUrl} alt={candidateName} />
                <div className="image-overlay-gradient"></div>
             </div>
             
             <div className="live-badge-top">
                <div className="dot"></div>
                AO VIVO
             </div>

             <div className="candidate-name-footer">
                <h1>{candidateName}</h1>
             </div>
          </div>

          <div className="score-right-column">
             <header className="score-panel-header">
                <div className="festival-title-row">
                   <Trophy size={28} className="trophy-icon" />
                   <h2>FESTIVAL DE FORRÓ 2026</h2>
                </div>
                <p className="realtime-kicker">PAINEL DE PONTUAÇÃO EM TEMPO REAL</p>
                <div className="header-divider"></div>
             </header>

             <div className="score-table-container">
                <table className="score-fidelity-table">
                   <thead>
                      <tr>
                         <th className="th-criteria">CRITÉRIOS</th>
                         {jurors.map((j, i) => (
                           <th key={i} className="th-juror">{j}</th>
                         ))}
                      </tr>
                   </thead>
                   <tbody>
                      {criteriaList.map((criterion, idx) => (
                        <tr key={idx}>
                           <td className="td-criteria">{criterion.label}</td>
                           {jurors.map((_, jIdx) => (
                             <td key={jIdx} className="td-score">
                                {getVoteValue(jIdx, criterion.key)}
                             </td>
                           ))}
                        </tr>
                      ))}
                   </tbody>
                </table>
             </div>

             <div className="score-summary-card">
                <div className="summary-left">
                   <h3>MÉDIA FINAL</h3>
                   <div className="rank-badge-fidelity">
                      {currentRank}º LUGAR ATUAL
                   </div>
                </div>
                <div className="summary-center">
                   <div className="final-score-value">
                      {Number(finalAverage).toFixed(1)}
                   </div>
                </div>
                <div className="summary-right">
                   <span className="pts-label">PTS</span>
                   <div className="level-meter-graphic">
                      <div className="bar"></div>
                      <div className="bar"></div>
                      <div className="bar"></div>
                   </div>
                </div>
             </div>
          </div>
        </div>
      );
    }

    if (selectedMode === 'total_public_votes') {
      const rows = results?.popular_ranking || [];
      const totalVotes = rows.reduce((acc, r) => acc + Number(r.public_votes || 0), 0);
      

      // TELA DE TOTAL DE VOTOS POPULARES EM TEMPO REAL
      return (
        <div className="realtime-votes-screen">
          <div className="bg-decorations">
            <div className="float-diamond d1"></div>
            <div className="float-diamond d2"></div>
            <div className="float-diamond d3"></div>
            <div className="float-diamond d4"></div>
          </div>

          <header className="realtime-header-group">
            <h2 className="realtime-title-main">VOTAÇÃO POPULAR</h2>
            <h2 className="realtime-title-sub">EM TEMPO REAL</h2>
          </header>

          <div className="realtime-card-glass">
            <div className="realtime-number-neon">
              {Number(totalVotes).toLocaleString('pt-BR')}
            </div>
            <div className="realtime-divider-dots"></div>
            <div className="realtime-votos-label">
              <Heart size={36} fill="currentColor" />
              VOTOS CONFIRMADOS
            </div>

            <div className="realtime-floating-logo">
              <img src={LOGO_PATH} alt="Logo" />
            </div>
          </div>
        </div>
      );
    }

    // Default: IDLE
    return (
      <div className="idle-screen">
        <div className="idle-diamonds">
          <div className="diamond yellow"></div>
          <div className="diamond blue"></div>
          <div className="diamond red"></div>
          <div className="diamond green"></div>
        </div>
        <div className="idle-logo-wrapper">
          <img src={LOGO_PATH} alt="Festival Logo" />
        </div>
        <h2 className="idle-title-main">TELA DE TRANSMISSÃO E TELÃO</h2>
        <h3 className="idle-subtitle-year">FESTIVAL FORRÓ 2026</h3>
        <div className="idle-tagline-footer">
          O CORAÇÃO DO NORDESTE AO VIVO
        </div>
        <div className="live-badge-pill">
          <div className="dot"></div>
          AO VIVO
        </div>
      </div>
    );
  };


  // RENDERIZAÇÃO PRINCIPAL DA PÁGINA DE TRANSMISSÃO
  return (
    <div className="transmission-page">
      <div className="flags-decoration-css">
        {Array.from({ length: 60 }).map((_, i) => (
          <div key={i} className="flag"></div>
        ))}
      </div>

      <main className="transmission-content">
        {errorMsg && <div className="transmission-alert">{errorMsg}</div>}
        {isLoading && !session ? (
          <div className="transmission-loading">Carregando transmissão...</div>
        ) : (
          renderModeContent()
        )}
      </main>

      <footer style={{ position: 'fixed', bottom: 30, width: '100%', textAlign: 'center', zIndex: 10, opacity: 0.8 }}>
        <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '30px', fontSize: '14px', fontWeight: 800 }}>
          <Music size={20} />
          <span>TRANSMISSÃO AO VIVO • JR PRODUTORA • 2026</span>
          <Award size={20} />
        </div>
      </footer>
    </div>
  );
};

export default FestivalTransmission;
