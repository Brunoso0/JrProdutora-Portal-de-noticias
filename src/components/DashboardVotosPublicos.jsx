import React, { useState, useEffect, useRef } from "react";
import axios from "axios";
import "../styles/DashboardVotosPublicos.css";
import { API_FESTIVAL } from "../services/api";
import { format } from "date-fns";

const DashboardVotosPublicos = () => {
  const [dataSelecionada, setDataSelecionada] = useState(format(new Date(), "yyyy-MM-dd"));
  const [votos, setVotos] = useState([]);
  const [loading, setLoading] = useState(false);
  const intervalRef = useRef(null);

  const carregarVotos = async () => {
    setLoading(true);
    try {
      const res = await axios.get(`${API_FESTIVAL}/api/dashboard/votos-publicos?data=${dataSelecionada}`);
      setVotos(res.data);
    } catch (err) {
      console.error("Erro ao carregar votos públicos", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    carregarVotos();
    if (intervalRef.current) clearInterval(intervalRef.current);
    intervalRef.current = setInterval(() => {
      carregarVotos();
    }, 10000);
    return () => clearInterval(intervalRef.current);
  }, [dataSelecionada]);

  const totalVotos = votos.reduce((acc, v) => acc + v.total_votos, 0);

  return (
    <div className="dashboard-votos-publicos">
      <h2>📊 Votação Popular</h2>

      <div className="filtro-data">
        <label>Data da votação: </label>
        <input
          type="date"
          value={dataSelecionada}
          onChange={(e) => setDataSelecionada(e.target.value)}
        />
      </div>

      {loading ? (
        <p>Carregando votos...</p>
      ) : (
        <div className="cards-container">
          {votos.map((v, idx) => {
            const caminho = v.foto
              ? `${API_FESTIVAL}${v.foto.startsWith("/") ? "" : "/"}${v.foto}`
              : "/default-user.png";

            const porcentagem = totalVotos > 0 ? ((v.total_votos / totalVotos) * 100).toFixed(1) : "0.0";

            return (
              <div className="card-voto" key={v.id || idx}>
                <img src={caminho} alt={v.nome_artistico || v.nome} className="foto-candidato" />
                <div className="info-candidato">
                  <strong>{v.nome_artistico || v.nome}</strong>
                  <span>{porcentagem}% dos votos</span>
                  <span>{v.total_votos} votos</span>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default DashboardVotosPublicos;
