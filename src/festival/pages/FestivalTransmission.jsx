import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { useParams } from 'react-router-dom';
import axios from 'axios';
import { Heart } from 'lucide-react';
import '../styles/FestivalTransmission.css';

const TRANSMISSION_LABELS = {
  idle: 'Tela em branco',
  ranking_public: 'Ranking dos votos públicos',
  ranking_judges: 'Ranking dos votos dos jurados',
  winners: 'Vencedores',
  current_candidate_score: 'Pontuação do candidato'
};

const apiBase = process.env.API_FESTIVAL || 'http://localhost:3015';

const getToken = () => localStorage.getItem('festivalAdminToken') || localStorage.getItem('token') || localStorage.getItem('authToken') || '';

const FestivalTransmission = () => {
  const { sessionId } = useParams();
  const [session, setSession] = useState(null);
  const [broadcast, setBroadcast] = useState({ display_mode: 'idle', show_names: true });
  const [results, setResults] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState('');

  const selectedMode = broadcast?.display_mode || 'idle';

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
      setBroadcast(broadcastResponse?.data?.broadcast || { display_mode: 'idle', show_names: true });
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
        loadTransmissionData();
      }
    };

    const handleVisibilityChange = () => {
      if (!document.hidden) {
        loadTransmissionData();
      }
    };

    window.addEventListener('storage', handleStorageUpdate);
    document.addEventListener('visibilitychange', handleVisibilityChange);

    const intervalId = window.setInterval(loadTransmissionData, 3000);

    return () => {
      window.clearInterval(intervalId);
      window.removeEventListener('storage', handleStorageUpdate);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [loadTransmissionData]);

  const title = useMemo(() => session?.title || `Sessão ${sessionId}`, [session, sessionId]);

  const renderModeContent = () => {
    if (selectedMode === 'ranking_public') {
      const rows = results?.popular_ranking || [];
      const totalVotes = rows.reduce((acc, item) => acc + Number(item.public_votes || 0), 0);
      const formattedVotes = totalVotes.toLocaleString('pt-BR');

      return (
        <div className="transmission-popular-view">
          {/* Decorative Diamonds */}
          <div className="transmission-diamonds">
            <div className="diamond-shape green"></div>
            <div className="diamond-shape yellow"></div>
            <div className="diamond-shape blue"></div>
            <div className="diamond-shape light-green"></div>
            <div className="diamond-shape olive"></div>
          </div>

          <div className="popular-view-header">
            <h2 className="votation-popular-title">VOTAÇÃO<br />POPULAR</h2>
            <h3 className="real-time-title">EM TEMPO REAL</h3>
          </div>

          <div className="popular-votes-container card-surface">
            <div className="festival-sticker">
              <img src="/img/logo-festival.png" alt="Festival Logo" />
            </div>
            
            <div className="votes-number-display">
              {formattedVotes}
            </div>

            <div className="votes-footer">
              <Heart size={20} fill="#0d5c19" color="#0d5c19" />
              <span>VOTOS CONFIRMADOS</span>
            </div>
          </div>
        </div>
      );
    }

    if (selectedMode === 'ranking_public') {
      const rows = results?.popular_ranking || [];
      return (
        <div className="transmission-panel card-surface">
          <h2>Ranking dos votos públicos</h2>
          <div className="transmission-table-wrap">
            <table>
              <thead>
                <tr>
                  <th>Posição</th>
                  <th>Candidato</th>
                  <th>Votos</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((item, index) => (
                  <tr key={item.candidate_id}>
                    <td>{index + 1}</td>
                    <td>{item.artistic_name || item.name}</td>
                    <td>{Number(item.public_votes || 0)}</td>
                  </tr>
                ))}
                {!rows.length && (
                  <tr>
                    <td colSpan="3">Nenhum resultado disponível.</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      );
    }

    if (selectedMode === 'ranking_judges') {
      const rows = results?.technical_ranking || [];
      return (
        <div className="transmission-panel card-surface">
          <h2>Ranking dos votos dos jurados</h2>
          <div className="transmission-table-wrap">
            <table>
              <thead>
                <tr>
                  <th>Posição</th>
                  <th>Candidato</th>
                  <th>Média</th>
                  <th>Votos</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((item, index) => (
                  <tr key={item.candidate_id}>
                    <td>{index + 1}</td>
                    <td>{item.artistic_name || item.name}</td>
                    <td>{Number(item.judge_average || 0).toFixed(2)}</td>
                    <td>{Number(item.judge_votes_count || 0)}</td>
                  </tr>
                ))}
                {!rows.length && (
                  <tr>
                    <td colSpan="4">Nenhum resultado disponível.</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      );
    }

    if (selectedMode === 'winners') {
      const rows = results?.final_ranking || [];
      return (
        <div className="transmission-panel card-surface">
          <h2>Vencedores</h2>
          <div className="transmission-table-wrap">
            <table>
              <thead>
                <tr>
                  <th>Posição</th>
                  <th>Candidato</th>
                  <th>Pontuação</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((item, index) => (
                  <tr key={item.candidate_id}>
                    <td>{index + 1}</td>
                    <td>{item.artistic_name || item.name}</td>
                    <td>{Number(item.effective_score || 0).toFixed(2)}</td>
                    <td>{item.is_winner ? 'Vencedor' : 'Participante'}</td>
                  </tr>
                ))}
                {!rows.length && (
                  <tr>
                    <td colSpan="4">Nenhum resultado disponível.</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      );
    }

    return (
      <div className="transmission-panel card-surface transmission-hero">
        <div>
          <p className="eyebrow">Painel ao vivo</p>
          <h2>{title}</h2>
          <p>Escolha um modo para exibir o conteúdo na guia de transmissão.</p>
        </div>
      </div>
    );
  };

  return (
    <div className="transmission-page">
      <header className="transmission-header card-surface">
        <div>
          <p className="eyebrow">Transmissão ao vivo</p>
          <h1>{title}</h1>
          <p>ID #{sessionId} • {TRANSMISSION_LABELS[selectedMode] || TRANSMISSION_LABELS.idle}</p>
        </div>
        <div className="transmission-status">
          <span>{broadcast?.show_names ? 'Nomes visíveis' : 'Nomes ocultos'}</span>
          <button type="button" onClick={loadTransmissionData} disabled={isLoading}>Atualizar</button>
        </div>
      </header>

      {errorMsg && <div className="transmission-alert">{errorMsg}</div>}
      {isLoading ? (
        <div className="transmission-loading card-surface">Carregando transmissão...</div>
      ) : (
        renderModeContent()
      )}
    </div>
  );
};

export default FestivalTransmission;
