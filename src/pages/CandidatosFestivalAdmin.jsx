import React, { useEffect, useState, useMemo } from "react";
import "../styles/CandidatosFestival.css";
import ModalEditarCandidato from "../components/ModalEditarCandidato";
import axios from "axios";
import { API_FESTIVAL } from "../services/api";
import { ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

const CandidatosFestivalAdmin = () => {
  const [candidatos, setCandidatos] = useState([]);
  const [etapas, setEtapas] = useState([]);
  const [busca, setBusca] = useState("");
  const [ordem, setOrdem] = useState("envio");
  const [candidatoSelecionado, setCandidatoSelecionado] = useState(null);

  const fetchData = async () => {
    try {
      const [candidatosRes, etapasRes] = await Promise.all([
        axios.get(`${API_FESTIVAL}/api/inscricoes/listar`),
        axios.get(`${API_FESTIVAL}/api/etapas/listar`)
      ]);
      setCandidatos(candidatosRes.data);
      setEtapas(etapasRes.data);
    } catch (err) {
      console.error("Erro ao buscar dados:", err);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const candidatosFiltrados = useMemo(() => {
    let lista = [...candidatos];
    if (busca.trim()) {
      lista = lista.filter((c) => c.nome.toLowerCase().includes(busca.toLowerCase()));
    }
    if (ordem === "asc") lista.sort((a, b) => a.nome.localeCompare(b.nome));
    else if (ordem === "desc") lista.sort((a, b) => b.nome.localeCompare(a.nome));
    return lista;
  }, [candidatos, busca, ordem]);

  return (
    <div className="candidatos-container">
      <div className="filter-candidatos">
        <div className="input-group-candidatos">
          <input
            type="text"
            value={busca}
            onChange={(e) => setBusca(e.target.value)}
            className="input-candidatos"
            placeholder="Pesquisar pelo nome"
          />
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
        {candidatosFiltrados.map((candidato) => (
          <div key={candidato.id} className="card-candidato">
            <span className="selo-etapa">
              {etapas.find((etapa) => etapa.id === candidato.etapa_id)?.nome || "Sem etapa"}
            </span>
            <div className="imagem-candidato">
              {candidato.foto ? (
                <img src={`${API_FESTIVAL}/${candidato.foto}`} alt={candidato.nome} />
              ) : (
                <div className="sem-foto">Sem foto</div>
              )}
            </div>
            <div className="rodape-candidato">
              <div className="bolinha-candidato" />
              <span className="nome-candidato">{candidato.nome}</span>
              <button
                className="botao-perfil"
                onClick={() => {
                    console.log("🧩 Candidato selecionado:", candidato); // ✅ Log de depuração
                    setCandidatoSelecionado(candidato);
                }}
                >
                Editar
                </button>

            </div>
          </div>
        ))}
      </div>

      <ModalEditarCandidato
        candidato={candidatoSelecionado}
        onClose={() => setCandidatoSelecionado(null)}
        onUpdate={fetchData}
        etapas={etapas}
      />

      <ToastContainer position="top-right" autoClose={3000} theme="colored" />
    </div>
  );
};

export default CandidatosFestivalAdmin;
