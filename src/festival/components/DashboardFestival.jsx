import React, { useEffect, useMemo, useState } from "react";
import axios from "axios";
import "../styles/DashboardFestival.css";
import { API_FESTIVAL } from "../../services/api";

const DashboardFestival = () => {
  const [etapas, setEtapas] = useState([]);
  const [etapaSelecionada, setEtapaSelecionada] = useState("");
  const [candidatos, setCandidatos] = useState([]);
  const [busca, setBusca] = useState("");

  useEffect(() => {
    axios.get(`${API_FESTIVAL}/api/dashboard/etapas`).then((res) => setEtapas(res.data));
  }, []);

  useEffect(() => {
    if (!etapaSelecionada) return setCandidatos([]);
    axios
      .get(`${API_FESTIVAL}/api/dashboard/candidatos/${etapaSelecionada}`)
      .then((res) => setCandidatos(res.data || []));
  }, [etapaSelecionada]);

  const fotoUrl = (c) => {
    const f = c?.foto;
    if (!f) return null;
    if (String(f).startsWith("http")) return f;
    const base = API_FESTIVAL.replace(/\/+$/, "");
    const path = String(f).replace(/\\/g, "/").replace(/^\/+/, "");
    return `${base}/${path}`;
  };

  const abrirPopupNotas = (candidatoId) => {
    if (!etapaSelecionada) return;
    const url = `${window.location.origin}/popup-criterios?id=${encodeURIComponent(
      candidatoId
    )}&etapa_id=${encodeURIComponent(etapaSelecionada)}`;
    window.open(
      url,
      "_blank",
      "noopener,noreferrer,width=980,height=720,menubar=no,toolbar=no,location=no,status=no"
    );
  };

  const candidatosFiltrados = useMemo(() => {
    const t = busca.trim().toLowerCase();
    if (!t) return candidatos;
    return candidatos.filter((c) => {
      const n1 = (c.nome || "").toLowerCase();
      const n2 = (c.nome_artistico || "").toLowerCase();
      return n1.includes(t) || n2.includes(t);
    });
  }, [candidatos, busca]);

  return (
    <div className="dashboard-festival-container">
      <h1>Notas por Critérios — Candidatos</h1>

      <div className="filtros-dashboard">
        <label>
          Etapa:
          <select
            value={etapaSelecionada}
            onChange={(e) => setEtapaSelecionada(e.target.value)}
          >
            <option value="">Selecione uma etapa</option>
            {etapas.map((etapa) => (
              <option key={etapa.id} value={etapa.id}>
                {etapa.nome}
              </option>
            ))}
          </select>
        </label>

        <div className="busca-classificatoria">
          <input
            type="text"
            placeholder="Pesquisar candidato por nome..."
            value={busca}
            onChange={(e) => setBusca(e.target.value)}
          />
        </div>
      </div>

      <div className="grid-candidatos-classificatoria">
        {candidatosFiltrados.map((c) => {
          const src = fotoUrl(c);
          return (
            <button
              key={c.id}
              className="card-candidato-classificatoria"
              onClick={() => abrirPopupNotas(c.id)}
              title="Ver notas em tempo real"
            >
              <div className="thumb">
                {src ? (
                  <img
                    src={src}
                    alt={c.nome_artistico || c.nome}
                    onError={(e) => {
                      e.currentTarget.style.display = "none";
                      e.currentTarget.parentElement.innerHTML =
                        '<div class="sem-foto">Sem foto</div>';
                    }}
                  />
                ) : (
                  <div className="sem-foto">Sem foto</div>
                )}
              </div>
              <div className="info">
                <div className="nome">{c.nome_artistico || c.nome || "Sem nome"}</div>
                <div className="etapa-badge">Clique para ver notas</div>
              </div>
            </button>
          );
        })}
        {etapaSelecionada && candidatosFiltrados.length === 0 && (
          <div className="mensagem-vazia">Nenhum candidato encontrado.</div>
        )}
      </div>
    </div>
  );
};

export default DashboardFestival;
