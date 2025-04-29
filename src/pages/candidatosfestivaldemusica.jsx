import React, { useEffect, useState, useMemo } from "react";
import "../styles/CandidatosFestival.css";
import FooterFestival from "../components/FooterFestival";
import ModalCandidato from "../components/ModalCandidato"; // 👈 novo import
import axios from "axios";
import { API_FESTIVAL } from "../services/api";

import { ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

const CandidatosFestivalDeMusica = () => {
  const [candidatos, setCandidatos] = useState([]);
  const [busca, setBusca] = useState("");
  const [ordem, setOrdem] = useState("envio");
  const [candidatoSelecionado, setCandidatoSelecionado] = useState(null);
  const [etapas, setEtapas] = useState([]);

  // 📥 Buscar candidatos do backend
  useEffect(() => {
    const fetchCandidatos = async () => {
      try {
        const res = await axios.get(`${API_FESTIVAL}/api/inscricoes/listar`);
        setCandidatos(res.data);
      } catch (error) {
        console.error("Erro ao buscar candidatos:", error);
      }
    };

    fetchCandidatos();
  }, []);


    useEffect(() => {
    const fetchData = async () => {
        try {
        const [candidatosRes, etapasRes] = await Promise.all([
            axios.get(`${API_FESTIVAL}/api/inscricoes/listar`),
            axios.get(`${API_FESTIVAL}/api/etapas/listar`)
        ]);
        setCandidatos(candidatosRes.data);
        setEtapas(etapasRes.data);
        } catch (error) {
        console.error("Erro ao buscar dados:", error);
        }
    };

    fetchData();
    }, []);


  // 🔎 Filtro e ordenação
  const candidatosFiltrados = useMemo(() => {
    let lista = [...candidatos];

    if (busca.trim()) {
      lista = lista.filter((c) =>
        c.nome.toLowerCase().includes(busca.toLowerCase())
      );
    }

    if (ordem === "asc") {
      lista.sort((a, b) => a.nome.localeCompare(b.nome));
    } else if (ordem === "desc") {
      lista.sort((a, b) => b.nome.localeCompare(a.nome));
    } // caso "envio", mantém ordem original do array retornado

    return lista;
  }, [candidatos, busca, ordem]);

  return (
    <div className="candidatos-container">
      <div className="filter-candidatos">
      <div className="input-group-candidatos">
            <input
            type="text"
            name="text"
            autoComplete="off"
            required=""
            value={busca}
            onChange={(e) => setBusca(e.target.value)}
            className="input-candidatos"
            />
            <label className="user-label">Pesquisar pelo Nome</label>
        </div>
        <select
          value={ordem}
          onChange={(e) => setOrdem(e.target.value)}
          className="select-ordem-candidato"
        >
          <option value="envio">Ordem de Envio</option>
          <option value="asc">Nome A → Z</option>
          <option value="desc">Nome Z → A</option>
        </select>
      </div>

      <div className="grid-candidatos">
        {candidatosFiltrados.map((candidato, index) => (
          <div key={index} className="card-candidato">
          {/* Selo da etapa atual */}
          <span className="selo-etapa">
            {etapas.find((etapa) => etapa.id === candidato.etapa_id)?.nome || "Sem etapa"}
          </span>

        
          {/* Imagem do candidato */}
          <div className="imagem-candidato">
            {candidato.foto ? (
              <img src={`${API_FESTIVAL}/${candidato.foto}`} alt={candidato.nome} />
            ) : (
              <div className="sem-foto">Sem foto</div>
            )}
          </div>
        
          {/* Rodapé do card */}
          <div className="rodape-candidato">
            <div className="bolinha-candidato" />
            <span className="nome-candidato">{candidato.nome}</span>
            <button className="botao-perfil" onClick={() => setCandidatoSelecionado(candidato)}>
              Ver Perfil
            </button>
          </div>
        </div>
        
        ))}
      </div>

      <div className="footer-festival-candidatos">
        <FooterFestival />
      </div>
      <ModalCandidato
        candidato={candidatoSelecionado}
        onClose={() => setCandidatoSelecionado(null)}
      />

      <ToastContainer
           position="top-right" 
           autoClose={3000} 
           hideProgressBar 
           pauseOnHover
            draggable
            theme="colored"
           />
    </div>
  );
};

export default CandidatosFestivalDeMusica;
