import React, { useState, useEffect, useMemo } from "react";
import axios from "axios";
import "../styles/Classificatoria.css";
import { API_FESTIVAL } from "../services/api";

const Classificatoria = () => {
  const [candidatos, setCandidatos] = useState([]);
  const [etapaClassificatoria, setEtapaClassificatoria] = useState(null);
  const [busca, setBusca] = useState("");

  // 1) Busca a etapa "Classificatória"
  useEffect(() => {
    const loadEtapa = async () => {
      try {
        const res = await axios.get(`${API_FESTIVAL}/api/etapas/listar`);
        // tenta por id/nome; se já tiver "classificatória" salva
        const classificatoria =
          res.data.find((e) =>
            (e.nome || "").toLowerCase().includes("classificat")
          ) || null;

        setEtapaClassificatoria(classificatoria);
      } catch (e) {
        console.error("Erro ao buscar etapas:", e);
      }
    };
    loadEtapa();
  }, []);

  // 2) Busca TODOS candidatos (mesma rota do Admin) e filtra pela etapa
  useEffect(() => {
    const loadCandidatos = async () => {
      try {
        const res = await axios.get(`${API_FESTIVAL}/api/inscricoes/listar`);
        let lista = res.data || [];

        if (etapaClassificatoria?.id) {
          // filtra por etapa_id OU por fase_atual contendo "classificat"
          lista = lista.filter(
            (c) =>
              Number(c.etapa_id) === Number(etapaClassificatoria.id) ||
              ((c.fase_atual || "").toLowerCase().includes("classificat"))
          );
        } else {
          // fallback: mantém todos caso ainda não tenha identificado a etapa
        }

        setCandidatos(lista);
      } catch (e) {
        console.error("Erro ao buscar candidatos:", e);
        setCandidatos([]);
      }
    };

    loadCandidatos();
  }, [etapaClassificatoria]);

  // 3) Filtro por texto (nome ou nome artístico)
  const candidatosFiltrados = useMemo(() => {
    const termo = busca.trim().toLowerCase();
    if (!termo) return candidatos;
    return candidatos.filter((c) => {
      const n1 = (c.nome || "").toLowerCase();
      const n2 = (c.nome_artistico || "").toLowerCase();
      return n1.includes(termo) || n2.includes(termo);
    });
  }, [candidatos, busca]);

  // 4) Monta a URL da foto exatamente como no Admin
  const fotoUrl = (c) => {
    const f = c?.foto;
    if (!f) return null;
    if (String(f).startsWith("http")) return f;
    const base = API_FESTIVAL.replace(/\/+$/, "");
    const path = String(f).replace(/\\/g, "/").replace(/^\/+/, "");
    return `${base}/${path}`;
  };

  // 5) Abre popup com a tela de votos em tempo real (o /popup-classificatoria que você já criou)
  const abrirPopupVotos = (candidatoId) => {
    if (!etapaClassificatoria?.id) return;
    const url = `${window.location.origin}/popup-classificatoria?id=${encodeURIComponent(
      candidatoId
    )}&etapa_id=${encodeURIComponent(etapaClassificatoria.id)}`;
    window.open(
      url,
      "_blank",
      "noopener,noreferrer,width=900,height=650,menubar=no,toolbar=no,location=no,status=no"
    );
  };

  return (
    <div className="classificatoria-container">
      <h1>Classificatória — Candidatos</h1>

      <div className="filtros-classificatoria">
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
              onClick={() => abrirPopupVotos(c.id)}
              title="Ver votos em tempo real"
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
                <div className="etapa-badge">Classificatória</div>
              </div>
            </button>
          );
        })}

        {candidatosFiltrados.length === 0 && (
          <div className="mensagem-vazia">Nenhum candidato encontrado.</div>
        )}
      </div>
    </div>
  );
};

export default Classificatoria;
