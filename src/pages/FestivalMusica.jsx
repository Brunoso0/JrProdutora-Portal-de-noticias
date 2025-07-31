import React, { useEffect, useState } from "react";
import axios from "axios";
import Modal from "react-modal";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import "../styles/FestivalMusicas.css";
import FooterFestival from "../components/FooterFestival";
import { API_FESTIVAL } from "../services/api";

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
        const etapaLiberada = etapaRes.data.find(e => e.votacao_liberada === 1);
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
        setCandidatos(candidatosRes.data);
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
    <div className="festival-musica-container">
      <ToastContainer position="top-center" autoClose={3000} hideProgressBar />
      <div className="festival-musica-content">
        <h1 className="festival-musica-titulo">
          VOTE NO SEU <br /> <span className="festival-musica-favorito">FAVORITO (A)</span>
        </h1>

        {!votacaoLiberada ? (
          <div style={{ textAlign: "center", margin: "2rem 0", fontWeight: "bold", fontSize: "1.2rem", color: "#c0392b" }}>
            A votação se encontra fechada no momento, tente novamente mais tarde.
          </div>
        ) : (
          <div className="festival-musica-grid-candidatos">
            {candidatos.map((candidato) => (
              <div className="festival-musica-card-candidato" key={candidato.id}>
                <img
                  src={
                    candidato.foto
                      ? `${API_FESTIVAL}/${candidato.foto}`
                      : "/img/cantor.png"
                  }
                  alt={candidato.nome_artistico}
                  className="festival-musica-foto"
                />
                <h2>{candidato.nome_artistico}</h2>
                <p>{candidato.cidade}</p>
                <button className="festival-musica-btn-votar" onClick={() => abrirModal(candidato)}>
                  Votar
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      <Modal
        isOpen={modalAberto}
        onRequestClose={() => setModalAberto(false)}
        className="festival-musica-modal-voto"
        overlayClassName="festival-musica-overlay-voto"
      >
        <h2>Confirmar voto em:</h2>
        <p>
          <strong>{candidatoSelecionado?.nome_artistico}</strong>
        </p>

        <label>Informe seu CPF:</label>
        <input
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
        <div className="festival-musica-modal-botoes">
          <button onClick={confirmarVoto}>Confirmar</button>
          <button onClick={() => setModalAberto(false)}>Cancelar</button>
        </div>
      </Modal>
    </div>
  );
};

export default FestivalMusica;
