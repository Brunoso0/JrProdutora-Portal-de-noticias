import React, { useEffect, useMemo, useRef, useState } from "react";
import { useSearchParams } from "react-router-dom";
import axios from "axios";
import { API_FESTIVAL } from "../services/api";
import "../styles/PopupCriterios.css"; // <— novo CSS

const PopupCriterios = () => {
  const [searchParams] = useSearchParams();
  const candidatoId = searchParams.get("id");
  const etapaId = searchParams.get("etapa_id");

  const [dadosVotacao, setDadosVotacao] = useState(null);
  const [candidatoInfo, setCandidatoInfo] = useState(null);
  const [loading, setLoading] = useState(true);
  const intervalRef = useRef(null);
  const headerRef = React.useRef(null);
  const [headerH, setHeaderH] = React.useState(0);

  // Carrega info básica do candidato (opcional, cabeçalho)
  useEffect(() => {
    if (!candidatoId) return;
    let cancel = false;
    axios
      .get(`${API_FESTIVAL}/api/inscricoes/${candidatoId}`)
      .then((r) => !cancel && setCandidatoInfo(r.data))
      .catch(() => {});
    return () => { cancel = true; };
  }, [candidatoId]);

  // Tempo real (polling 3s)
  useEffect(() => {
    if (!candidatoId || !etapaId) return;
    let cancel = false;

    const fetchDados = async () => {
      try {
        const res = await axios.get(
          `${API_FESTIVAL}/api/dashboard/notas/${candidatoId}/${etapaId}`
        );
        if (!cancel) setDadosVotacao(res.data);
      } finally {
        if (!cancel) setLoading(false);
      }
    };

    fetchDados();
    intervalRef.current = setInterval(fetchDados, 3000);
    return () => {
      cancel = true;
      clearInterval(intervalRef.current);
    };
  }, [candidatoId, etapaId]);

  const formatNota = (v) =>
    Number.isFinite(v) ? v.toFixed(1).replace(".", ",") : "--";

  // Cálculo igual ao Dashboard
  const { juradosComMedia, mediaGeral } = useMemo(() => {
    if (!dadosVotacao || dadosVotacao.tipo !== "criterios")
      return { juradosComMedia: [], mediaGeral: 0 };

    const juradosComMedia = dadosVotacao.jurados.map((j) => {
      const soma = j.criterios.reduce(
        (acc, c) => acc + (Number(c.nota) || 0),
        0
      );
      const media = soma / j.criterios.length;
      return { ...j, media };
    });

    const geral =
      juradosComMedia.reduce((acc, j) => acc + j.media, 0) /
        (juradosComMedia.length || 1);

    return { juradosComMedia, mediaGeral: geral };
  }, [dadosVotacao]);

  useEffect(() => {
    const medir = () => setHeaderH(headerRef.current ? headerRef.current.offsetHeight : 0);
    medir();
    window.addEventListener("resize", medir);
    return () => window.removeEventListener("resize", medir);
  }, []);

  if (loading) {
    return (
      <div className="pc-popup">
        <div className="pc-center">Carregando…</div>
      </div>
    );
  }

  if (!dadosVotacao || !dadosVotacao.jurados) {
    return (
      <div className="pc-popup">
        <div className="pc-center">Sem dados para exibir.</div>
      </div>
    );
  }

  return (
    <div className="pc-popup" style={{ "--headerH": `${headerH}px` }}>
      <div ref={headerRef} className="pc-header">
        {candidatoInfo ? (candidatoInfo.nome_artistico || candidatoInfo.nome) : "Candidato"}
      </div>

      <div className="pc-media-geral">
        <span>Média Geral</span>
        <strong>{formatNota(mediaGeral)}</strong>
      </div>

      <div className="pc-grid">
        {juradosComMedia.map((j, idx) => (
          <div className="pc-card gradient-anim" key={idx}>
            <div className="pc-card-top">
              <div className="pc-jurado-nome">
                {j.nome_jurado || "Nome Jurado"}
              </div>
            </div>

            <div className="pc-jurado-foto">
              {j.foto_jurado ? (
                <img src={`${API_FESTIVAL}/${j.foto_jurado}`} alt="Jurado" />
              ) : (
                <div className="pc-foto-placeholder">foto jurado</div>
              )}
            </div>

            <div className="pc-media">
              <span>Média:</span>
              <b>{formatNota(j.media)}</b>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default PopupCriterios;
