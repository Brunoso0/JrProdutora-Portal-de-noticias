import React, { useEffect, useState } from "react";
import axios from "axios";
import { API_FESTIVAL } from "../services/api";
import "../styles/ControleEtapas.css";

const ControleEtapas = () => {
  const [etapas, setEtapas] = useState([]);

  useEffect(() => {
    axios.get(`${API_FESTIVAL}/api/inscricoes/etapas`)
      .then((res) => setEtapas(res.data))
      .catch((err) => console.error("Erro ao buscar etapas:", err));
  }, []);

  return (
    <div className="controle-etapas">
      <h2>Controle de Etapas</h2>
      <ul className="lista-etapas">
        {etapas.map(e => (
          <li key={e.id}>
            <strong>{e.nome}</strong> (ID: {e.id})
            {/* Aqui você poderá adicionar botão para "liberar votação" */}
          </li>
        ))}
      </ul>
    </div>
  );
};

export default ControleEtapas;
