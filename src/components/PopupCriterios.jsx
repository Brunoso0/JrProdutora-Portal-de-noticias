import React, { useEffect, useMemo, useRef, useState } from "react";
import { useSearchParams } from "react-router-dom";
import axios from "axios";
import { API_FESTIVAL } from "../services/api";
import "../styles/PopupCriterios.css";

/** IDs fixos e imagens do nome (igual à Classificatória) */
const JURADOS_FIXOS = [18, 19, 20, 24];
const JURADO_NOME_IMG = {
  18: "/img/jurados/joão.png",
  19: "/img/jurados/raquele.png",
  20: "/img/jurados/alex.png",
  24: "/img/jurados/Rubecleiton.png",
};

const buildFotoUrl = (raw) => {
  if (!raw) return null;
  let p = String(raw).trim().replace(/\\/g, "/").replace(/^\.\/+/, "");
  if (/^https?:\/\//i.test(p)) return p;
  if (p.startsWith("/uploads")) return `${API_FESTIVAL}${p}`;
  if (p.startsWith("uploads/")) return `${API_FESTIVAL}/${p}`;
  return `${API_FESTIVAL}/${p}`;
};

const isNotaValida = (nota) =>
  nota !== "" && nota !== null && nota !== undefined && nota !== "null" && !Number.isNaN(Number(nota)); // 0 é válido
const formatNota = (v) => (Number.isFinite(v) ? v.toFixed(2).replace(".", ",") : "--");

// normaliza texto pra comparar nomes (fallback quando API não manda id)
const norm = (s) =>
  String(s || "")
    .toLowerCase()
    .normalize("NFD")
    .replace(/\p{Diacritic}/gu, "")
    .trim();

// acha o jurado no array retornado pela API, tolerando campos diferentes e, se preciso, casando por nome
const pickJurado = (arr, jid, baseNome) => {
  if (!Array.isArray(arr)) return undefined;
  const J = Number(jid);
  let found = arr.find((x) => [x?.jurado_id, x?.id_jurado, x?.id].some((v) => Number(v) === J));
  if (found) return found;
  if (baseNome) {
    const alvo = norm(baseNome);
    found = arr.find((x) => norm(x?.nome_jurado) === alvo);
  }
  return found;
};

const PopupCriterios = () => {
  const [searchParams] = useSearchParams();
  const candidatoId = searchParams.get("id");
  const etapaId = searchParams.get("etapa_id");

  const [dadosVotacao, setDadosVotacao] = useState(null);
  const [juradosInfo, setJuradosInfo] = useState({});
  const [candidatoInfo, setCandidatoInfo] = useState(null);
  const [loading, setLoading] = useState(true);
  const intervalRef = useRef(null);

  // Info do candidato (cabeçalho)
  useEffect(() => {
    if (!candidatoId) return;
    let cancel = false;
    axios
      .get(`${API_FESTIVAL}/api/inscricoes/${candidatoId}`)
      .then((r) => !cancel && setCandidatoInfo(r.data))
      .catch(() => {});
    return () => {
      cancel = true;
    };
  }, [candidatoId]);

  // Infos dos jurados para mostrar nome/foto mesmo sem voto
  useEffect(() => {
    let cancel = false;
    const fetchJurados = async () => {
      try {
        const pairs = await Promise.all(
          JURADOS_FIXOS.map((id) =>
            axios
              .get(`${API_FESTIVAL}/api/jurados/listar/${id}`)
              .then((r) => [id, r.data])
              .catch(() => [id, null])
          )
        );
        if (cancel) return;
        const map = {};
        pairs.forEach(([id, data]) => {
          if (data) map[id] = data; // { id, nome, foto }
        });
        setJuradosInfo(map);
      } catch {
        // noop
      }
    };
    fetchJurados();
    return () => {
      cancel = true;
    };
  }, []);

  // Tempo real (polling 3s) das notas por critérios
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

  // Monta colunas fixas e calcula média geral
  const { colunas, mediaGeral } = useMemo(() => {
    let mediaGeral = 0;

    const colunas = JURADOS_FIXOS.map((jid) => {
      const base = juradosInfo[jid] || {}; // { id, nome, foto }
      const j = pickJurado(dadosVotacao?.jurados, jid, base.nome);

      // cálculo idêntico ao dashboard: soma(nota || 0) / qtd_criterios
      let media = null;
      let temAlgumVoto = false;

      if (j && Array.isArray(j.criterios) && j.criterios.length) {
        const soma = j.criterios.reduce((acc, c) => acc + (Number(c.nota) || 0), 0);
        media = soma / j.criterios.length;

        // "Tem voto" = há pelo menos UMA nota válida desse jurado (0 é válido)
        temAlgumVoto = j.criterios.some((c) => isNotaValida(c?.nota));
      }

      // Classe visual por faixa OU pendente (sem voto desse jurado)
      let classe = "pendente";
      if (temAlgumVoto && Number.isFinite(media)) {
        if (media < 4) classe = "nota-baixa";
        else if (media < 7) classe = "nota-media";
        else classe = "nota-alta";
      }

      return {
        jid,
        nome: base.nome || `Jurado ${jid}`,
        nomeImg: JURADO_NOME_IMG[jid] || null,
        fotoUrl: buildFotoUrl(j?.foto_jurado || base.foto),
        media,
        temAlgumVoto,
        classe,
      };
    });

    // média geral do candidato: média das médias dos jurados (somente quando API trouxe criterios)
    if (dadosVotacao?.tipo === "criterios" && Array.isArray(dadosVotacao?.jurados) && dadosVotacao.jurados.length) {
      const mediasJurados =
        dadosVotacao.jurados.map(
          (j) => j.criterios.reduce((s, c) => s + (Number(c.nota) || 0), 0) / (j.criterios.length || 1)
        ) || [];
      mediaGeral =
        (mediasJurados.reduce((acc, m) => acc + m, 0) / (mediasJurados.length || 1)) || 0;
    }

    return { colunas, mediaGeral };
  }, [dadosVotacao, juradosInfo]);

  if (loading) {
    return (
      <div className="pc-popup">
        <div className="pc-center">Carregando…</div>
      </div>
    );
  }

  // Divide jurados em 2 da esquerda e 2 da direita
  const colunasEsq = colunas.slice(0, 2);
  const colunasDir = colunas.slice(2);

  return (
    <div className="pc-popup">
      

      <div className="pc-grid pc-grid-media-central">
        {colunasEsq.map(({ jid, nome, nomeImg, fotoUrl, media, temAlgumVoto, classe }) => (
          <div
            key={jid}
            className={`pc-card ${temAlgumVoto ? "gradient-anim" : ""} ${classe}`}
          >
            <div className="pc-card-top">
              <div className="pc-jurado-nome">
                {nomeImg ? (
                  <img
                    src={nomeImg}
                    alt={`Nome do jurado ${jid}`}
                    style={{ maxWidth: 140, width: "100%", height: "auto", display: "block", margin: "0 auto" }}
                  />
                ) : (
                  nome
                )}
              </div>
            </div>
            <div className="pc-jurado-foto-criterios">
              {fotoUrl ? (
                <img src={fotoUrl} alt={nome} />
              ) : (
                <div className="pc-foto-placeholder">foto jurado</div>
              )}
            </div>
            <div className="pc-media">
              <b>{temAlgumVoto ? formatNota(media) : ""}</b>
            </div>
          </div>
        ))}

        {/* Coluna central: Média Geral */}
        <div className="pc-card pc-media-card">
          <div className="pc-media-central-label">Média Geral</div>
          <div className="pc-media-central-value">{formatNota(mediaGeral)}</div>
        </div>

        {colunasDir.map(({ jid, nome, nomeImg, fotoUrl, media, temAlgumVoto, classe }) => (
          <div
            key={jid}
            className={`pc-card ${temAlgumVoto ? "gradient-anim" : ""} ${classe}`}
          >
            <div className="pc-card-top">
              <div className="pc-jurado-nome">
                {nomeImg ? (
                  <img
                    src={nomeImg}
                    alt={`Nome do jurado ${jid}`}
                    style={{ maxWidth: 140, width: "100%", height: "auto", display: "block", margin: "0 auto" }}
                  />
                ) : (
                  nome
                )}
              </div>
            </div>
            <div className="pc-jurado-foto-criterios">
              {fotoUrl ? (
                <img src={fotoUrl} alt={nome} />
              ) : (
                <div className="pc-foto-placeholder">foto jurado</div>
              )}
            </div>
            <div className="pc-media">
              <b>{temAlgumVoto ? formatNota(media) : ""}</b>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default PopupCriterios;
