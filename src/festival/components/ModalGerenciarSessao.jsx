import React, { useState, useEffect } from 'react';
import { useSessao } from '../context/SessaoContext';
import { toast } from 'react-toastify';

const ModalGerenciarSessao = ({ sessao, onClose, onSuccess }) => {
  const { 
    encerrarSessao, 
    toggleVotacaoPublica, 
    toggleVotacaoJurados,
    fetchSessaoAtiva 
  } = useSessao();
  
  const [votacaoPublicaAtiva, setVotacaoPublicaAtiva] = useState(false);
  const [votacaoJuradosAtiva, setVotacaoJuradosAtiva] = useState(false);
  const [encerrando, setEncerrando] = useState(false);
  const [alterandoVotacao, setAlterandoVotacao] = useState({ publica: false, jurados: false });

  // Inicializar estados com os dados da sessão
  useEffect(() => {
    if (sessao) {
      setVotacaoPublicaAtiva(sessao.votacao_publica_ativa || false);
      setVotacaoJuradosAtiva(sessao.votacao_jurados_ativa || false);
    }
  }, [sessao]);

  // Toggle votação pública
  const handleToggleVotacaoPublica = async () => {
    const novoStatus = !votacaoPublicaAtiva;
    
    try {
      setAlterandoVotacao(prev => ({ ...prev, publica: true }));
      
      const resultado = await toggleVotacaoPublica(novoStatus);
      
      if (resultado.success) {
        setVotacaoPublicaAtiva(novoStatus);
        toast.success(`Votação pública ${novoStatus ? 'ativada' : 'desativada'}!`);
      } else {
        toast.error(resultado.message);
      }
      
    } catch (error) {
      console.error('Erro ao alterar votação pública:', error);
      toast.error('Erro ao alterar votação pública');
    } finally {
      setAlterandoVotacao(prev => ({ ...prev, publica: false }));
    }
  };

  // Toggle votação dos jurados
  const handleToggleVotacaoJurados = async () => {
    const novoStatus = !votacaoJuradosAtiva;
    
    try {
      setAlterandoVotacao(prev => ({ ...prev, jurados: true }));
      
      const resultado = await toggleVotacaoJurados(novoStatus);
      
      if (resultado.success) {
        setVotacaoJuradosAtiva(novoStatus);
        toast.success(`Votação dos jurados ${novoStatus ? 'ativada' : 'desativada'}!`);
      } else {
        toast.error(resultado.message);
      }
      
    } catch (error) {
      console.error('Erro ao alterar votação dos jurados:', error);
      toast.error('Erro ao alterar votação dos jurados');
    } finally {
      setAlterandoVotacao(prev => ({ ...prev, jurados: false }));
    }
  };

  // Encerrar sessão
  const handleEncerrarSessao = async () => {
    if (!window.confirm('Tem certeza que deseja encerrar esta sessão? Esta ação não pode ser desfeita.')) {
      return;
    }

    try {
      setEncerrando(true);
      
      const resultado = await encerrarSessao();
      
      if (resultado.success) {
        toast.success('Sessão encerrada com sucesso!');
        await fetchSessaoAtiva(); // Atualizar estado global
        onSuccess();
      } else {
        toast.error(resultado.message);
      }
      
    } catch (error) {
      console.error('Erro ao encerrar sessão:', error);
      toast.error('Erro ao encerrar sessão');
    } finally {
      setEncerrando(false);
    }
  };

  // Calcular tempo de duração da sessão
  const calcularTempoSessao = () => {
    if (!sessao?.criado_em) return 'N/A';
    
    const inicio = new Date(sessao.criado_em);
    const agora = new Date();
    const diff = agora - inicio;
    
    const horas = Math.floor(diff / (1000 * 60 * 60));
    const minutos = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
    
    if (horas > 0) {
      return `${horas}h ${minutos}min`;
    } else {
      return `${minutos}min`;
    }
  };

  return (
    <div className="modal-overlay">
      <div className="modal-content modal-medium">
        <div className="modal-header">
          <h2>Gerenciar Sessão Ativa</h2>
          <button className="modal-close" onClick={onClose}>×</button>
        </div>

        <div className="modal-body">
          {/* Informações da sessão */}
          <div className="sessao-info">
            <div className="info-card">
              <h3>{sessao?.descricao}</h3>
              <div className="info-grid">
                <div className="info-item">
                  <span className="label">Etapa:</span>
                  <span className="value">{sessao?.etapa_nome}</span>
                </div>
                <div className="info-item">
                  <span className="label">Iniciada em:</span>
                  <span className="value">
                    {new Date(sessao?.criado_em).toLocaleString()}
                  </span>
                </div>
                <div className="info-item">
                  <span className="label">Duração:</span>
                  <span className="value">{calcularTempoSessao()}</span>
                </div>
                <div className="info-item">
                  <span className="label">Candidatos:</span>
                  <span className="value">{sessao?.total_candidatos || 0}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Controles de votação */}
          <div className="controles-votacao">
            <h4>Controles de Votação</h4>
            
            <div className="controle-item">
              <div className="controle-info">
                <h5>🗳️ Votação Pública</h5>
                <p>Permite que o público vote nos candidatos desta sessão</p>
              </div>
              <div className="controle-switch">
                <button 
                  className={`toggle-btn ${votacaoPublicaAtiva ? 'ativo' : 'inativo'}`}
                  onClick={handleToggleVotacaoPublica}
                  disabled={alterandoVotacao.publica}
                >
                  {alterandoVotacao.publica ? (
                    '⏳'
                  ) : votacaoPublicaAtiva ? (
                    '✅ ATIVA'
                  ) : (
                    '❌ INATIVA'
                  )}
                </button>
              </div>
            </div>

            <div className="controle-item">
              <div className="controle-info">
                <h5>👨‍⚖️ Votação dos Jurados</h5>
                <p>Permite que os jurados avaliem os candidatos desta sessão</p>
              </div>
              <div className="controle-switch">
                <button 
                  className={`toggle-btn ${votacaoJuradosAtiva ? 'ativo' : 'inativo'}`}
                  onClick={handleToggleVotacaoJurados}
                  disabled={alterandoVotacao.jurados}
                >
                  {alterandoVotacao.jurados ? (
                    '⏳'
                  ) : votacaoJuradosAtiva ? (
                    '✅ ATIVA'
                  ) : (
                    '❌ INATIVA'
                  )}
                </button>
              </div>
            </div>
          </div>

          {/* Estatísticas em tempo real (futuro) */}
          <div className="estatisticas-tempo-real">
            <h4>Estatísticas da Sessão</h4>
            <div className="stats-grid">
              <div className="stat-item">
                <span className="stat-number">{sessao?.total_votos_publicos || 0}</span>
                <span className="stat-label">Votos Públicos</span>
              </div>
              <div className="stat-item">
                <span className="stat-number">{sessao?.total_votos_jurados || 0}</span>
                <span className="stat-label">Votos Jurados</span>
              </div>
              <div className="stat-item">
                <span className="stat-number">{sessao?.total_participantes || 0}</span>
                <span className="stat-label">Participantes</span>
              </div>
            </div>
          </div>

          {/* Avisos */}
          <div className="avisos-sessao">
            {!votacaoPublicaAtiva && !votacaoJuradosAtiva && (
              <div className="aviso warning">
                ⚠️ Nenhuma votação está ativa. Ative pelo menos uma opção para permitir votos.
              </div>
            )}
            
            {(votacaoPublicaAtiva || votacaoJuradosAtiva) && (
              <div className="aviso success">
                ✅ Sessão ativa e funcionando. Os participantes podem votar.
              </div>
            )}
          </div>
        </div>

        <div className="modal-footer">
          <button 
            type="button" 
            className="btn btn-secondary"
            onClick={onClose}
            disabled={encerrando}
          >
            Fechar
          </button>
          <button 
            type="button" 
            className="btn btn-danger"
            onClick={handleEncerrarSessao}
            disabled={encerrando}
          >
            {encerrando ? 'Encerrando...' : '🛑 Encerrar Sessão'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default ModalGerenciarSessao;