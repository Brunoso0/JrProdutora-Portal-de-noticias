import React, { useEffect, useState } from "react";
import axios from "axios";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css"; // importa estilos
import "../styles/FestivalMusicas.css";
import FooterFestival from "../components/FooterFestival";

import { API_FESTIVAL } from "../services/api";

const FestivalMusica = () => {
  const [candidatos, setCandidatos] = useState([]);
  const [etapaAtual, setEtapaAtual] = useState(null);
  const [votosFeitos, setVotosFeitos] = useState(() => {
    const armazenados = localStorage.getItem("votosFeitos");
    return armazenados ? JSON.parse(armazenados) : [];
  });

  // Carrega etapa liberada e candidatos aptos
  useEffect(() => {
    const carregarDados = async () => {
      try {
        const etapaRes = await axios.get(`${API_FESTIVAL}/api/etapas/listar`);
        const etapaLiberada = etapaRes.data.find(e => e.votacao_liberada === 1);
        if (!etapaLiberada) {
          toast.error("Nenhuma etapa está com votação liberada no momento.");
          return;
        }
        setEtapaAtual(etapaLiberada.id);

        const candidatosRes = await axios.get(`${API_FESTIVAL}/api/dashboard/aptos-votacao`);
        setCandidatos(candidatosRes.data);
      } catch (err) {
        console.error("Erro ao carregar dados da votação:", err);
        toast.error("Erro ao carregar dados. Tente novamente.");
      }
    };

    carregarDados();
  }, []);

  const registrarVoto = async (candidatoId) => {
    if (votosFeitos.includes(candidatoId)) {
      toast.info("Você já votou neste candidato.");
      return;
    }

    if (votosFeitos.length >= 13) {
      toast.warning("Você atingiu o limite de 13 votos por dia.");
      return;
    }

    try {
      await axios.post(`${API_FESTIVAL}/api/jurados/votos-populares`, {
        candidato_id: candidatoId,
        etapa_id: etapaAtual,
      });

      const novosVotos = [...votosFeitos, candidatoId];
      setVotosFeitos(novosVotos);
      localStorage.setItem("votosFeitos", JSON.stringify(novosVotos));
      toast.success("✅ Voto registrado com sucesso!");
    } catch (err) {
      if (err.response?.status === 429) {
        toast.warning("Você já realizou os 3 votos permitidos nesta etapa.");
      } else if (err.response?.status === 403) {
        toast.error("A etapa ainda não está liberada para votação.");
      } else {
        toast.error("Erro ao registrar voto. Tente novamente.");
      }
    }
  };

  return (
    <div className="festival-container">
      <ToastContainer position="top-center" autoClose={2500} hideProgressBar />

      <h1 className="titulo">VOTE NO SEU <br /> <span className="favorito">FAVORITO (A)</span></h1>

      <div className="grid-candidatos">
        {candidatos.map((candidato) => (
          <div className="card-candidato" key={candidato.id}>
            <img
              src={
                candidato.foto
                  ? `${API_FESTIVAL}/${candidato.foto}`
                  : "/img/cantor.png"
              }
              alt={candidato.nome}
              className="foto"
            />
            <h2>{candidato.nome_artistico}</h2>
            <p>{candidato.cidade}</p>
            <button
              className="btn-votar"
              onClick={() => registrarVoto(candidato.id)}
              disabled={votosFeitos.includes(candidato.id)}
            >
              {votosFeitos.includes(candidato.id) ? "✅ Votado" : "Votar"}
            </button>
          </div>
        ))}
      </div>

      <FooterFestival />
    </div>
  );
};

export default FestivalMusica;
