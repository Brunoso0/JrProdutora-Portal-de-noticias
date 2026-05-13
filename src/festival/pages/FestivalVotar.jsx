import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import FingerprintJS from '@fingerprintjs/fingerprintjs';
import { io } from 'socket.io-client';
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

  // ... restante do seu handleVote e sendBatchVotes ...
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

  if (loading) return <div className="loading-container"><div className="loader"></div><p>Carregando...</p></div>;

  if (!session) {
    return (
      <div className="festival-votar-container empty-container">
        <img src="/img/LOGO_FESTIVAL_DE_FORRO.png" alt="Logo" className="votar-logo" />
        <p>Aguarde a votação iniciar</p>
      </div>
    );
  }

  return (
    <div className="festival-votar-container">
      <div style={{ opacity: 0, position: 'absolute', zIndex: -1 }}>
        <input type="text" value={honeypot} onChange={(e) => setHoneypot(e.target.value)} />
      </div>
      {error && <div className="toast-message error-toast">{error}</div>}
      {voteSuccess && <div className="toast-message success-toast">{voteSuccess}</div>}

      <header className="votar-header">
        <img src="/img/LOGO_FESTIVAL_DE_FORRO.png" alt="Logo" className="votar-logo" />
        <h1 className="votar-title">Votação Popular</h1>
      </header>

      <main className="votar-main">
        <div className="candidates-grid">
          {candidates.map(candidate => (
            <div key={candidate.id} className="candidate-card">
              <div className="candidate-image-wrapper">
                <img 
                  src={candidate.profile_photo_url?.startsWith('http') ? candidate.profile_photo_url : `${API_URL}/${candidate.profile_photo_url?.replace(/^\//, '')}`} 
                  alt={candidate.artistic_name} 
                  className="candidate-image" 
                />
              </div>
              <div className="candidate-info">
                <h3 className="candidate-name">{candidate.artistic_name}</h3>
                <button className="btn-votar" onClick={() => handleVote(candidate.id)}>Votar</button>
              </div>
            </div>
          ))}
        </div>
      </main>
    </div>
  );
};

export default FestivalVotar;