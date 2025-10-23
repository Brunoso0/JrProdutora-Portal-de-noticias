import React, { useState, useEffect } from 'react';
import { toast } from 'react-toastify';
import candidatosService from '../../services/CandidatosService';
import sessionService from '../../services/SessionServiceV2';

const ModalIniciarSessao = ({ etapa, onClose, onSuccess }) => {
  const [descricao, setDescricao] = useState('');
  const [candidatos, setCandidatos] = useState([]);
  const [candidatosSelecionados, setCandidatosSelecionados] = useState([]);
  const [loading, setLoading] = useState(true);
  const [iniciando, setIniciando] = useState(false);

  // Carregar candidatos da etapa
  const carregarCandidatos = async () => {
    try {
      setLoading(true);
      console.log(`📡 Carregando candidatos da etapa ${etapa?.id}...`);

      const resultado = await candidatosService.listarCandidatos({
        etapa_id: etapa?.id,
        incluir_eliminados: false
      });

      console.log('DEBUG resultado listarCandidatos:', resultado);

      // Normaliza possíveis formatos: resultado.data ou resultado.candidatos
      const candidatosEtapa = Array.isArray(resultado?.data)
        ? resultado.data
        : Array.isArray(resultado?.candidatos)
        ? resultado.candidatos
        : [];

      // Garante tipo array antes de usar .length
      if (candidatosEtapa.length > 0) {
        setCandidatos(candidatosEtapa);

        // Se tem poucos candidatos, selecionar todos por padrão
        if (candidatosEtapa.length <= 5) {
          setCandidatosSelecionados(candidatosEtapa.map(c => c.id));
        }

        console.log(`✅ ${candidatosEtapa.length} candidatos carregados`);
        toast.success(`${candidatosEtapa.length} candidatos encontrados para ${etapa?.nome || 'esta etapa'}`);
      } else {
        setCandidatos([]);
        setCandidatosSelecionados([]);
        console.warn('⚠️ Nenhum candidato retornado ou formato inesperado:', resultado);
        toast.warn(`Nenhum candidato encontrado para ${etapa?.nome || 'esta etapa'}`);
      }
    } catch (error) {
      console.error('💥 Erro ao carregar candidatos:', error);
      setCandidatos([]);
      setCandidatosSelecionados([]);
      toast.error('Erro ao carregar candidatos da etapa');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (etapa) {
      carregarCandidatos();
      setDescricao(`Votação - ${etapa.nome}`);
    }
  }, [etapa?.id]); // eslint-disable-line react-hooks/exhaustive-deps

  // Toggle seleção de candidato
  const toggleCandidato = (candidatoId) => {
    setCandidatosSelecionados(prev => {
      if (prev.includes(candidatoId)) {
        return prev.filter(id => id !== candidatoId);
      } else {
        return [...prev, candidatoId];
      }
    });
  };

  // Selecionar/Deselecionar todos
  const toggleTodos = () => {
    if (candidatosSelecionados.length === candidatos.length) {
      setCandidatosSelecionados([]);
    } else {
      setCandidatosSelecionados(candidatos.map(c => c.id));
    }
  };

  // Confirmar e iniciar sessão
  const handleConfirmar = async () => {
    if (!descricao.trim()) {
      toast.error('Descrição da sessão é obrigatória');
      return;
    }

    if (candidatosSelecionados.length === 0) {
      toast.error('Selecione pelo menos um candidato para participar da sessão');
      return;
    }

    try {
      setIniciando(true);
      console.log(`🚀 Iniciando sessão "${descricao}" para etapa ${etapa.id}...`);
      
      // Usar nosso SessionServiceV2
      const resultado = await sessionService.iniciarSessao({
        etapa_id: etapa.id,
        descricao: descricao.trim(),
        candidato_ids: candidatosSelecionados
      });

      if (resultado.success) {
        console.log('✅ Sessão iniciada com sucesso:', resultado.data);
        toast.success(`Sessão "${descricao}" iniciada com ${candidatosSelecionados.length} candidatos!`);
        onSuccess();
      } else {
        console.error('❌ Erro ao iniciar sessão:', resultado.message);
        toast.error(resultado.message || 'Erro ao iniciar sessão');
      }
      
    } catch (error) {
      console.error('💥 Erro inesperado ao iniciar sessão:', error);
      toast.error('Erro inesperado ao iniciar sessão');
    } finally {
      setIniciando(false);
    }
  };

  return (
    <div className="modal-overlay">
      <div className="modal-content modal-large">
        <div className="modal-header">
          <h2>Iniciar Sessão - {etapa?.nome}</h2>
          <button className="modal-close" onClick={onClose}>×</button>
        </div>

        <div className="modal-body">
          <div className="form-group">
            <label htmlFor="descricao">Descrição da Sessão:</label>
            <input
              type="text"
              id="descricao"
              value={descricao}
              onChange={(e) => setDescricao(e.target.value)}
              placeholder="Ex: Semifinal 1, Final, Votação Especial"
              className="form-input"
            />
          </div>

          <div className="candidatos-section">
            <div className="section-header">
              <h3>Candidatos Participantes ({candidatos.length} disponíveis)</h3>
              {candidatos.length > 0 && (
                <button 
                  type="button"
                  className="btn btn-secondary btn-small"
                  onClick={toggleTodos}
                >
                  {candidatosSelecionados.length === candidatos.length ? 'Desmarcar Todos' : 'Selecionar Todos'}
                </button>
              )}
            </div>

            {loading ? (
              <div className="loading-candidatos">
                <p>Carregando candidatos...</p>
              </div>
            ) : candidatos.length === 0 ? (
              <div className="empty-candidatos">
                <p>Nenhum candidato encontrado nesta etapa.</p>
                <p>Verifique se há candidatos cadastrados e se estão na etapa correta.</p>
              </div>
            ) : (
              <div className="candidatos-grid">
                {candidatos.map((candidato) => (
                  <div 
                    key={candidato.id} 
                    className={`candidato-item ${candidatosSelecionados.includes(candidato.id) ? 'selecionado' : ''}`}
                    onClick={() => toggleCandidato(candidato.id)}
                  >
                    <div className="candidato-checkbox">
                      <input
                        type="checkbox"
                        checked={candidatosSelecionados.includes(candidato.id)}
                        onChange={() => toggleCandidato(candidato.id)}
                      />
                    </div>
                    
                    <div className="candidato-avatar">
                      {candidato.fotoUrl ? (
                        <img 
                          src={candidato.fotoUrl} 
                          alt={candidato.nome}
                        />
                      ) : (
                        <div className="avatar-placeholder">
                          {candidato.nome.charAt(0).toUpperCase()}
                        </div>
                      )}
                    </div>
                    
                    <div className="candidato-info">
                      <h4>{candidato.nome}</h4>
                      <p>{candidato.cidade_origem || 'Cidade não informada'}</p>
                      {candidato.categoria && (
                        <span className="categoria-badge">{candidato.categoria}</span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {candidatosSelecionados.length > 0 && (
            <div className="selecao-summary">
              <p>
                ✅ <strong>{candidatosSelecionados.length}</strong> candidato(s) selecionado(s) para participar da sessão
              </p>
            </div>
          )}
        </div>

        <div className="modal-footer">
          <button 
            type="button" 
            className="btn btn-secondary"
            onClick={onClose}
            disabled={iniciando}
          >
            Cancelar
          </button>
          <button 
            type="button" 
            className="btn btn-primary"
            onClick={handleConfirmar}
            disabled={iniciando || candidatosSelecionados.length === 0}
          >
            {iniciando ? 'Iniciando...' : 'Iniciar Sessão'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default ModalIniciarSessao;