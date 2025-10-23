import React, { useEffect, useState } from "react";
import axios from "axios";
import Modal from "react-modal";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import "../styles/FestivalMusicas.css";
import { API_FESTIVAL } from "../../services/api";

Modal.setAppElement("#root");

const FestivalMusica = () => {
  const [candidatos, setCandidatos] = useState([]);
  const [etapaAtual, setEtapaAtual] = useState(null);
  const [modalAberto, setModalAberto] = useState(false);
  const [candidatoSelecionado, setCandidatoSelecionado] = useState(null);
  const [cpf, setCpf] = useState("");
  const [ultimoVoto, setUltimoVoto] = useState(() => {
    const salvo = localStorage.getItem("ultimoVotoFestival");
    return salvo ? Number(salvo) : null;
  });
  const [votacaoLiberada, setVotacaoLiberada] = useState(true);

  useEffect(() => {
    const carregarDados = async () => {
      try {
        const etapaRes = await axios.get(`${API_FESTIVAL}/api/etapas/listar`);
        const etapaLiberada = etapaRes.data.find((e) => e.votacao_liberada === 1);
        if (!etapaLiberada) {
          setVotacaoLiberada(false);
          setEtapaAtual(null);
          setCandidatos([]);
          toast.error("Aguarde a votação ser liberada.");
          return;
        }
        setVotacaoLiberada(true);
        setEtapaAtual(etapaLiberada.id);

        const candidatosRes = await axios.get(`${API_FESTIVAL}/api/dashboard/aptos-votacao`);
        const candidatosOrdenados = candidatosRes.data.sort((a, b) => {
          const nomeA = (a.nome_artistico || a.nome || "").toLowerCase();
          const nomeB = (b.nome_artistico || b.nome || "").toLowerCase();
          return nomeA.localeCompare(nomeB);   
        });
        setCandidatos(candidatosOrdenados);
      } catch (err) {
        setVotacaoLiberada(false);
        toast.error("Erro ao carregar dados.");
      }
    };

    carregarDados();
  }, []);

  const validarCPF = (cpf) => {
    cpf = cpf.replace(/[^\d]+/g, "");
    if (cpf.length !== 11 || /^(\d)\1+$/.test(cpf)) return false;
    let soma = 0;
    for (let i = 0; i < 9; i++) soma += parseInt(cpf.charAt(i)) * (10 - i);
    let resto = (soma * 10) % 11;
    if (resto === 10 || resto === 11) resto = 0;
    if (resto !== parseInt(cpf.charAt(9))) return false;
    soma = 0;
    for (let i = 0; i < 10; i++) soma += parseInt(cpf.charAt(i)) * (11 - i);
    resto = (soma * 10) % 11;
    if (resto === 10 || resto === 11) resto = 0;
    return resto === parseInt(cpf.charAt(10));
  };

  const abrirModal = (candidato) => {
    setCandidatoSelecionado(candidato);
    setCpf("");
    setModalAberto(true);
  };

  const confirmarVoto = async () => {
    if (!cpf || !validarCPF(cpf)) {
      toast.warning("Informe um CPF válido.");
      return;
    }

    const agora = Date.now();
    if (ultimoVoto && agora - ultimoVoto < 30 * 1000) {
      const restante = Math.ceil((30 * 1000 - (agora - ultimoVoto)) / 1000);
      toast.info(`Aguarde ${restante}s para votar novamente.`);
      return;
    }

    try {
      await axios.post(`${API_FESTIVAL}/api/jurados/votos-populares`, {
        candidato_id: candidatoSelecionado.id,
        etapa_id: etapaAtual,
        cpf_votante: cpf.replace(/\D/g, ""),
      });

      localStorage.setItem("ultimoVotoFestival", agora.toString());
      setUltimoVoto(agora);
      setModalAberto(false);
      toast.success("✅ Voto registrado com sucesso!");
    } catch (err) {
      toast.error("Erro ao registrar voto.");
    }
  };

  return (
    <div className="fm-wrap">
      <ToastContainer position="top-center" autoClose={3000} hideProgressBar />
      <div className="fm-container">
        {/* Cabeçalho */}
        <header className="fm-header">
          <h1 className="fm-title"><img className="logo-gospel" src="/img/GospelTalent.png" alt="" /></h1>
          <p className="fm-subtitle">Escolha o artista que você quer ver na Grande Final!</p>
        </header>

        {!votacaoLiberada ? (
          <div className="fm-closed">A votação se encontra fechada no momento, tente novamente mais tarde.</div>
        ) : (
          <main className="fm-grid">
            {candidatos.map((candidato) => (
              <article className="fm-card" key={candidato.id}>
                <div className="fm-avatar">
                  {candidato.foto ? (
                    <img
                      src={`${API_FESTIVAL}/${candidato.foto}`}
                      alt={candidato.nome_artistico || candidato.nome}
                      onError={(e) => (e.currentTarget.style.display = "none")}
                    />
                  ) : (
                    <div className="fm-avatar-ph">
                      {(candidato.nome_artistico || "Artista").split(" ")[0]}
                    </div>
                  )}
                </div>

                <h2 className="fm-name">{candidato.nome_artistico || candidato.nome}</h2>
                <p className="fm-muted">{candidato.cidade || "—"}</p>

                <button className="fm-vote-btn" onClick={() => abrirModal(candidato)}>
                  Votar
                </button>
              </article>
            ))}
          </main>
        )}
      </div>

      {/* Modal de voto – mantém sua lógica, troca só o visual */}
      <Modal
        isOpen={modalAberto}
        onRequestClose={() => setModalAberto(false)}
        className="fm-modal"
        overlayClassName="fm-overlay"
      >
        <div className="fm-modal-head">
          <h2>Confirmar Voto</h2>
          <button className="fm-close" onClick={() => setModalAberto(false)}>✕</button>
        </div>

        <p className="fm-modal-caption">Você está votando em:</p>
        <p className="fm-candidate-chip">{candidatoSelecionado?.nome_artistico || candidatoSelecionado?.nome}</p>

        <label className="fm-label">Digite seu CPF para confirmar:</label>
        <input
          className="fm-input"
          type="text"
          value={cpf}
          placeholder="000.000.000-00"
          maxLength={14}
          onChange={(e) =>
            setCpf(
              e.target.value
                .replace(/\D/g, "")
                .replace(/(\d{3})(\d)/, "$1.$2")
                .replace(/(\d{3})(\d)/, "$1.$2")
                .replace(/(\d{3})(\d{1,2})$/, "$1-$2")
            )
          }
        />
        {/* <small className="fm-help">Seu CPF é usado apenas para garantir um voto por pessoa.</small> */}

        <button className="fm-confirm" onClick={confirmarVoto}>
          Confirmar Meu Voto
        </button>
      </Modal>

    </div>
  );
};

export default FestivalMusica;
