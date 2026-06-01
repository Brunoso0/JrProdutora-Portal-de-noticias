import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import FingerprintJS from '@fingerprintjs/fingerprintjs';
import { io } from 'socket.io-client';
import { MapPin, ThumbsUp, Share2, Maximize } from 'lucide-react';
import { API_FESTIVAL } from '../../services/api';
import '../styles/FestivalVotar.css';

const API_URL = API_FESTIVAL || 'http://localhost:3015';

const FestivalVotar = () => {
  const [loading, setLoading] = useState(true);
  const [session, setSession] = useState(null);
  const [candidates, setCandidates] = useState([]);
  const [error, setError] = useState(null);
  const [voteLoading, setVoteLoading] = useState(false);
  const [voteSuccess, setVoteSuccess] = useState(null);
  const [honeypot, setHoneypot] = useState('');
  const [confirmCandidate, setConfirmCandidate] = useState(null);

  const voteQueues = useRef({});
  const timers = useRef({});
  const socketRef = useRef(null);

  useEffect(() => {
    fetchActiveSession();

    // AJUSTE 1: Garantir que a URL do socket seja a de PRODUÇÃO e não localhost
    const socketUrl = API_URL.replace(/\/api$/, '');

    socketRef.current = io(socketUrl, {
      transports: ['polling', 'websocket'],
      auth: { token: null }, // O novo auth.js que te mandei vai aceitar isso
      reconnectionAttempts: 5,
    });

    socketRef.current.on('connect', () => {
      console.log('Conectado ao WebSocket de Produção!');
      // AJUSTE 2: Usar o nome que está no seu server.js: 'join:session'
      if (session?.id) {
        socketRef.current.emit('join:session', session.id);
      }
    });

    socketRef.current.on('session:candidates:updated', () => {
      console.log('Novos candidatos detectados via Socket!');
      fetchActiveSession();
    });

    socketRef.current.on('session:updated', () => fetchActiveSession());
    socketRef.current.on('session:candidate:removed', () => fetchActiveSession());
    socketRef.current.on('session:active_candidate:updated', () => fetchActiveSession());
    socketRef.current.on('session:active_candidate:released', () => fetchActiveSession());

    return () => {
      if (socketRef.current) {
        socketRef.current.disconnect();
      }
    };
  }, []);

  // AJUSTE 3: Sincronizar o evento de "entrar na sala" quando a sessão carregar
  useEffect(() => {
    if (socketRef.current?.connected && session?.id) {
      socketRef.current.emit('join:session', session.id);
    }
  }, [session?.id]);

  const fetchActiveSession = async () => {
    try {
      // Nota: Removi o setLoading(true) daqui para evitar o "pisca" da tela no F5 automático do socket
      const response = await axios.get(`${API_URL}/api/votes/public/active`);

      if (response.data && response.data.session) {
        setSession(response.data.session);
        setCandidates(response.data.candidates || []);
      }
      setLoading(false);
    } catch (err) {
      console.error("Erro ao buscar sessão ativa:", err);
      setSession(null);
      setLoading(false);
    }
  };

  // handleVote e sendBatchVotes
  const handleVote = (candidateId) => {
    setVoteSuccess("Processando votos...");
    if (!voteQueues.current[candidateId]) voteQueues.current[candidateId] = 0;
    voteQueues.current[candidateId] += 1;
    if (timers.current[candidateId]) clearTimeout(timers.current[candidateId]);
    timers.current[candidateId] = setTimeout(() => {
      sendBatchVotes(candidateId, voteQueues.current[candidateId]);
      voteQueues.current[candidateId] = 0;
    }, 2000);
  };

  const sendBatchVotes = async (candidateId, quantity) => {
    try {
      setVoteLoading(true);
      const fp = await FingerprintJS.load();
      const visitorId = (await fp.get()).visitorId;
      await axios.post(`${API_URL}/api/votes/public`, {
        session_id: session.id,
        candidate_id: candidateId,
        quantity: quantity,
        fingerprint: visitorId,
        email_confirm: honeypot
      });
      setVoteSuccess(`${quantity} voto(s) enviado(s)!`);
      setTimeout(() => setVoteSuccess(null), 3000);
    } catch (err) {
      setError(err.response?.data?.message || "Erro ao processar votos.");
      setTimeout(() => setError(null), 4000);
    } finally {
      setVoteLoading(false);
    }
  };

  const getCandidateBadge = (candidate, index) => {
    if (candidate.badge_code) return candidate.badge_code;
    if (candidate.badge) return candidate.badge;
    if (candidate.number_code) return candidate.number_code;
    if (candidate.number) return candidate.number;
    if (candidate.code) return candidate.code;

    let prefix = 'C';
    const phase = String(candidate.current_phase || session?.current_phase || 'audicao').toLowerCase();
    if (phase.includes('audicao')) prefix = '#';
    else if (phase.includes('final')) prefix = '#';
    else if (phase.includes('vencedor')) prefix = '#';
    else if (phase.includes('inscrito')) prefix = '#';
    else if (phase.includes('popular')) prefix = '#';
    else if (phase.includes('juri') || phase.includes('jurado')) prefix = 'J';

    const numVal = candidate.presentationOrder || candidate.order || candidate.id || (index + 1);
    const padded = String(numVal).padStart(2, '0');
    return `${prefix}${padded}`;
  };

  if (loading) {
    return (
      <div className="loading-container">
        <div className="loader"></div>
        <p>Carregando...</p>
      </div>
    );
  }

  if (!session) {
    return (
      <div className="empty-container">
        <div className="votar-logo-box">
          <img src="/img/LOGO_FESTIVAL_DE_FORRO.png" alt="Logo" className="votar-logo" />
        </div>
        <p>Aguarde a votação iniciar</p>
      </div>
    );
  }

  return (
    <div className="festival-votar-container">
      {/* Bandeirinhas superiores */}
      <div className="bandeirinhas-container" style={{ margin: '20px 0 0 0' }}>
        <span className="bandeirinha color-1"></span>
        <span className="bandeirinha color-2"></span>
        <span className="bandeirinha color-3"></span>
        <span className="bandeirinha color-4"></span>
        <span className="bandeirinha color-5"></span>
        <span className="bandeirinha color-1"></span>
        <span className="bandeirinha color-2"></span>
        <span className="bandeirinha color-3"></span>
        <span className="bandeirinha color-4"></span>
        <span className="bandeirinha color-5"></span>
      </div>

      <div className="festival-votar-content">
        <div style={{ opacity: 0, position: 'absolute', zIndex: -1 }}>
          <input type="text" value={honeypot} onChange={(e) => setHoneypot(e.target.value)} />
        </div>
        {error && <div className="toast-message error-toast">{error}</div>}
        {voteSuccess && <div className="toast-message success-toast">{voteSuccess}</div>}

        <header className="votar-header">
          <div className="votar-logo-box">
            <img src="/img/LOGO_FESTIVAL_DE_FORRO.png" alt="Logo" className="votar-logo" />
          </div>
          <h1 className="votar-title">Votação Popular</h1>
          <div className="votar-divider">
            <span className="votar-divider-star">★</span>
          </div>
          <p className="votar-subtitle">
            Escolha seu favorito e valorize a nossa cultura. O som do zabumba dita o ritmo do seu voto!
          </p>

          {/* Bandeirinhas inferiores do cabeçalho */}
          <div className="bandeirinhas-container" style={{ margin: '15px 0 10px 0' }}>
            <span className="bandeirinha color-1"></span>
            <span className="bandeirinha color-2"></span>
            <span className="bandeirinha color-3"></span>
            <span className="bandeirinha color-4"></span>
            <span className="bandeirinha color-5"></span>
            <span className="bandeirinha color-1"></span>
            <span className="bandeirinha color-2"></span>
            <span className="bandeirinha color-3"></span>
            <span className="bandeirinha color-4"></span>
            <span className="bandeirinha color-5"></span>
          </div>
        </header>

        <main className="votar-main">
          <div className="candidates-grid">
            {candidates.map((candidate, index) => (
              <div key={candidate.id} className="candidate-card">
                <div className="candidate-image-wrapper">
                  <span className="candidate-badge">{getCandidateBadge(candidate, index)}</span>
                  <img
                    src={candidate.profile_photo_url?.startsWith('http') ? candidate.profile_photo_url : `${API_URL}/${candidate.profile_photo_url?.replace(/^\//, '')}`}
                    alt={candidate.artistic_name}
                    className="candidate-image"
                    onError={(e) => {
                      e.target.onerror = null;
                      e.target.src = '/img/user.jpg';
                    }}
                  />
                </div>
                <div className="candidate-info">
                  <h3 className="candidate-name">{candidate.artistic_name}</h3>
                  <div className="candidate-location">
                    <MapPin size={14} />
                    <span>{candidate.address || 'Senhor do Bonfim - BA'}</span>
                  </div>
                  <button
                    className="btn-votar"
                    onClick={() => setConfirmCandidate(candidate)}
                    disabled={voteLoading}
                  >
                    <ThumbsUp size={16} /> Votar
                  </button>
                </div>
              </div>
            ))}
          </div>
        </main>
      </div>

      <footer className="festival-votar-footer">
        <div className="footer-text">
          FESTIVAL DE FORRÓ * 2026 / A VOZ DO POVO É O SOM DO SERTÃO
        </div>
        <div className="footer-icons">
          <button className="footer-icon-btn" aria-label="Compartilhar">
            <Share2 size={18} />
          </button>
          <button className="footer-icon-btn" aria-label="Expandir">
            <Maximize size={18} />
          </button>
        </div>
      </footer>

      {/* Modal de Confirmação de Voto */}
      {confirmCandidate && (
        <div className="vote-modal-overlay" onClick={() => setConfirmCandidate(null)}>
          <div className="vote-modal-container" onClick={(e) => e.stopPropagation()}>
            <h2 className="vote-modal-title">Confirmar Voto</h2>

            <div className="vote-modal-avatar-wrapper">
              <img
                src={confirmCandidate.profile_photo_url?.startsWith('http') ? confirmCandidate.profile_photo_url : `${API_URL}/${confirmCandidate.profile_photo_url?.replace(/^\//, '')}`}
                alt={confirmCandidate.artistic_name}
                className="vote-modal-avatar"
                onError={(e) => {
                  e.target.onerror = null;
                  e.target.src = '/img/user.jpg';
                }}
              />
            </div>

            <h3 className="vote-modal-candidate-name">{confirmCandidate.artistic_name}</h3>

            <div className="vote-modal-candidate-location">
              <MapPin size={15} />
              <span>{confirmCandidate.address || 'Senhor do Bonfim - BA'}</span>
            </div>

            <p className="vote-modal-text">
              Deseja confirmar o seu voto em <strong>{confirmCandidate.artistic_name}</strong> para a Votação Popular do Festival de Forró?
            </p>

            <div className="vote-modal-actions">
              <button
                className="btn-modal-confirm"
                onClick={() => {
                  handleVote(confirmCandidate.id);
                  setConfirmCandidate(null);
                }}
              >
                Sim, confirmar
              </button>
              <button
                className="btn-modal-cancel"
                onClick={() => setConfirmCandidate(null)}
              >
                Cancelar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default FestivalVotar;