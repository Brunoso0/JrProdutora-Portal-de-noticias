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
  const [isLoading, setIsLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState('');

  const selectedMode = broadcast?.display_mode || 'idle';

  const lastLocalUpdateRef = useRef(null);
  const socketRef = useRef(null);

  const resolvePhotoUrl = (url) => {
    if (!url) return LOGO_PATH;
    if (url.startsWith('http://') || url.startsWith('https://') || url.startsWith('data:') || url.startsWith('/img/')) {
      return url;
    }
    const normalizedPath = url.startsWith('/') ? url : `/${url}`;
    return `${apiBase}${normalizedPath}`;
  };

  const loadTransmissionData = useCallback(async () => {
    if (!sessionId) return;

    const token = getToken();
    const headers = token ? { Authorization: `Bearer ${token}` } : {};

    try {
      const [sessionsResponse, broadcastResponse, resultsResponse] = await Promise.all([
        axios.get(`${apiBase}/api/sessions`, { headers }),
        axios.get(`${apiBase}/api/sessions/${sessionId}/broadcast`, { headers }),
        axios.get(`${apiBase}/api/sessions/${sessionId}/results`, { headers })
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
    const intervalId = window.setInterval(loadTransmissionData, 3000);

    return () => {
      window.clearInterval(intervalId);
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
        const socket = io(origin, { auth: { token } });
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
      return (
        <div className="jury-ranking-fidelity">
          <header className="jury-header-fidelity">
            <div className="header-label-line">
              <div className="line"></div>
              <span>CLASSIFICAÇÃO TÉCNICA</span>
              <div className="line"></div>
            </div>
            <h2>{session?.title || 'JURADOS'}</h2>
            <p>Médias baseadas em ritmo, harmonia e performance.</p>
          </header>

          <div className="jury-list-fidelity">
            {rows.slice(0, 5).map((item, index) => {
              if (index === 0) {
                return (
                  <div key={item.candidate_id} className="jury-leader-card-fidelity">
                    <div className="jury-icon-box-gold">
                      <Award size={48} />
                    </div>
                    <div className="jury-photo-fidelity">
                      <img src={resolvePhotoUrl(item.profile_photo_url || item.photo_url)} alt="Logo" />
                    </div>
                    <div className="jury-info-fidelity">
                      <div className="jury-label-fidelity">PRIMEIRO LUGAR</div>
                      <div className="jury-name-fidelity">{item.artistic_name || item.name}</div>
                    </div>
                    <div className="jury-score-fidelity">
                      <div className="score-val-large">{Number(item.judge_average || 0).toFixed(1)}</div>
                      <div className="score-lbl-small">PONTUAÇÃO TÉCNICA</div>
                    </div>
                  </div>
                );
              }

              return (
                <div key={item.candidate_id} className="jury-item-fidelity">
                  <div className="jury-icon-box-grey">
                    {index === 1 ? <Trophy size={32} /> : <Award size={32} />}
                  </div>
                  <div className="jury-rank-tag-fidelity">
                    {index + 1}º
                  </div>
                  <div className="item-jury-name">{item.artistic_name || item.name}</div>
                  <div className="item-jury-score">{Number(item.judge_average || 0).toFixed(1)}</div>
                </div>
              );
            })}
          </div>

          <footer className="jury-footer-fidelity">
            <div className="status-realtime">
              <div className="status-dot-red"></div>
              APURAÇÃO EM TEMPO REAL
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
      
      return (
        <div className="public-ranking-screen">
          <header className="public-header-fidelity">
            <span className="label">RANKING POPULAR</span>
            <h2>VOTO DO POVO: <span>{session?.title || 'FESTIVAL'}</span></h2>
            <div className="underline"></div>
          </header>

          {leader && (
            <div className="leader-card-fidelity">
              <div className="rank-diamond-badge">
                <span>1º</span>
              </div>
              <div className="leader-photo-side">
                <img src={resolvePhotoUrl(leader.profile_photo_url || leader.photo_url)} alt="Líder" />
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
                     <img src={resolvePhotoUrl(item.profile_photo_url || item.photo_url)} alt="Foto" />
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
      const rows = results?.final_ranking || [];
      const judgesCount = Number(session?.winners_count_judges || 3);
      const publicCount = Number(session?.winners_count_public || 1);
      
      const podiumRaw = rows.slice(0, judgesCount);
      // Map to specific positions: [2nd, 1st, 3rd] if exists
      const podium = [];
      if (podiumRaw.length >= 2) podium[0] = podiumRaw[1]; // 2nd
      if (podiumRaw.length >= 1) podium[1] = podiumRaw[0]; // 1st
      if (podiumRaw.length >= 3) podium[2] = podiumRaw[2]; // 3rd

      const popularWinner = publicCount > 0 ? results?.popular_ranking?.[0] : null;
      const isGrandeFinal = session?.title?.toLowerCase().includes('grande final');

      return (
        <div className="winners-screen-fidelity">
          <header className="winners-header-fidelity">
            <div className="header-label-line">
              <div className="line"></div>
              <span>{isGrandeFinal ? 'GRANDE FINAL' : 'EDIÇÃO ESPECIAL 2026'}</span>
              <div className="line"></div>
            </div>
            <h2 className="realtime-title-sub" style={{ fontSize: '92px' }}>RESULTADO: {session?.title || 'SESSÃO'}</h2>
            <p style={{ color: '#8df7a8', fontWeight: 800, marginTop: '10px' }}>{isGrandeFinal ? 'O CAMPEÃO DOS CAMPEÕES' : 'FESTIVAL DE FORRÓ'}</p>
          </header>

          <div className="winners-podium-grid-fidelity">
            {/* Second Place */}
            {podium[0] && (
              <div className="winner-podium-column-fidelity pos-2">
                <div className="winner-card-fidelity second">
                  <div className="floating-rank-badge blue">2º</div>
                  <div className="winner-photo-wrap">
                    <img src={resolvePhotoUrl(podium[0]?.profile_photo_url || podium[0]?.photo_url)} alt="2nd" />
                  </div>
                  <div className="winner-name-fidelity">{podium[0]?.artistic_name || podium[0]?.name || '---'}</div>
                  <div className="winner-score-pill-fidelity blue">
                    <Star size={20} fill="currentColor" />
                    {Number(podium[0]?.effective_score || 0).toFixed(2)}
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
                <div className="winner-card-fidelity first">
                  <div className="star-top-decoration">
                    <Star size={48} fill="currentColor" />
                  </div>
                  <div className="floating-rank-badge gold">1º LUGAR</div>
                  <div className="winner-photo-wrap" style={{ padding: '10px', background: 'rgba(255,255,255,0.05)', borderRadius: '15px' }}>
                    <img src={resolvePhotoUrl(podium[1]?.profile_photo_url || podium[1]?.photo_url)} alt="1st" />
                  </div>
                  <div className="winner-name-fidelity">{podium[1]?.artistic_name || podium[1]?.name || '---'}</div>
                  <div className="winner-score-pill-fidelity gold">
                    <Trophy size={28} />
                    {Number(podium[1]?.effective_score || 0).toFixed(2)}
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
                    <img src={resolvePhotoUrl(podium[2]?.profile_photo_url || podium[2]?.photo_url)} alt="3rd" />
                  </div>
                  <div className="winner-name-fidelity">{podium[2]?.artistic_name || podium[2]?.name || '---'}</div>
                  <div className="winner-score-pill-fidelity orange">
                    <Star size={20} fill="currentColor" />
                    {Number(podium[2]?.effective_score || 0).toFixed(2)}
                  </div>
                </div>
                <div className="winner-base-fidelity bronze">
                  <div className="winner-base-text">BRONZE</div>
                </div>
              </div>
            )}

            {/* Popular Choice */}
            {popularWinner && (
              <div className="winner-podium-column-fidelity pos-pop">
                <div className="winner-card-fidelity popular">
                  <div className="floating-rank-badge red">FAVORITO DO PÚBLICO</div>
                  <div className="winner-photo-wrap" style={{ filter: 'grayscale(0.5)' }}>
                    <img src={resolvePhotoUrl(popularWinner?.profile_photo_url || popularWinner?.photo_url)} alt="Popular" />
                  </div>
                  <div className="winner-name-fidelity">{popularWinner?.artistic_name || popularWinner?.name || '---'}</div>
                  <div className="winner-score-pill-fidelity red">
                    <Heart size={18} fill="currentColor" />
                    {Number(popularWinner?.public_votes || 0).toLocaleString('pt-BR')} Votos
                  </div>
                </div>
                <div className="winner-base-fidelity red">
                  <div className="winner-base-text">POPULAR</div>
                </div>
              </div>
            )}
          </div>
        </div>
      );
    }

    if (selectedMode === 'total_public_votes') {
      const rows = results?.popular_ranking || [];
      const totalVotes = rows.reduce((acc, r) => acc + Number(r.public_votes || 0), 0);
      
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
