import React, { useEffect, useState, useMemo } from "react";
import "../styles/CandidatosFestival.css";
import FooterFestival from "../components/FooterFestival";
import axios from "axios";
import { API_FESTIVAL } from "../services/api";

const CandidatosFestivalDeMusica = () => {
  const [candidatos, setCandidatos] = useState([]);
  const [busca, setBusca] = useState("");
  const [ordem, setOrdem] = useState("envio");

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
            <label class="user-label">Pesquisar pelo Nome</label>
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
              <button className="botao-perfil">Ver Perfil</button>
            </div>
          </div>
        ))}
      </div>

      <div className="footer-festival-candidatos">
        <FooterFestival />
      </div>
    </div>
  );
};

export default CandidatosFestivalDeMusica;
