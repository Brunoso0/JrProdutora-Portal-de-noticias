import React, { useEffect, useMemo, useRef, useState } from "react";
import { useSearchParams } from "react-router-dom";
import axios from "axios";
import io from "socket.io-client";
import { API_FESTIVAL } from "../services/api";
import "../styles/PopupClassificatoria.css";

// IDs fixos dos jurados e ordem desejada
const JURADOS_FIXOS = [18, 19, 24];

// Mapeamento: jurado_id => imagem PNG do nome
const JURADO_NOME_IMG = {
  18: "/img/jurados/joão.png",
  19: "/img/jurados/raquele.png",
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

const PopupClassificatoria = () => {
  const [searchParams] = useSearchParams();
  const candidatoId = searchParams.get("id");
  const etapaId = searchParams.get("etapa_id");

  const [votos, setVotos] = useState([]);
  const [juradosInfo, setJuradosInfo] = useState({});
  const [loading, setLoading] = useState(true); // <-- evita “Sem votos” no carregamento

  // socket memoizado
  const socket = useMemo(
    () =>
      io(API_FESTIVAL, {
        transports: ["websocket"], // força websocket (evita long-polling lento)
      }),
    []
  );

  // Busca infos dos jurados (nome/foto) para exibir mesmo sem voto
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
      } finally {
        // nada
      }
    };
    fetchJurados();
    return () => {
      cancel = true;
    };
  }, []);

  // Primeira carga de votos + polling leve (backup) + listener de socket
  useEffect(() => {
    if (!candidatoId || !etapaId) return;
    let cancel = false;

    const fetchVotos = async () => {
      try {
        const res = await axios.get(
          `${API_FESTIVAL}/api/jurados/votos-binarios/${candidatoId}/${etapaId}`
        );
        if (!cancel) setVotos(res.data || []);
      } finally {
        if (!cancel) setLoading(false);
      }
    };

    // 1ª carga imediata
    fetchVotos();

    // Socket: aplica atualização instantânea
    const onNovoVoto = (payload) => {
      const { inscricao_id, etapa_id } = payload || {};
      if (
        String(inscricao_id) === String(candidatoId) &&
        String(etapa_id) === String(etapaId)
      ) {
        // substitui/insere o voto desse jurado localmente
        setVotos((prev) => {
          const semEsse = prev.filter(
            (v) => Number(v.jurado_id) !== Number(payload.jurado_id)
          );
          return [...semEsse, payload];
        });
      }
    };
    socket.on("novo-voto-binario", onNovoVoto);

    // Polling leve (fallback) a cada 5s — opcional, mas bom pra “garantir”
    const id = setInterval(fetchVotos, 5000);

    return () => {
      cancel = true;
      clearInterval(id);
      socket.off("novo-voto-binario", onNovoVoto);
    };
  }, [candidatoId, etapaId, socket]);

  // Monta as 4 colunas fixas
  const colunas = useMemo(() => {
    return JURADOS_FIXOS.map((jid) => {
      const voto = votos.find((v) => Number(v.jurado_id) === Number(jid));
      const base = juradosInfo[jid] || {};
      const nome = voto?.nome_jurado || base.nome || `Jurado ${jid}`;
      const fotoPath = voto?.foto_jurado || base.foto || null;
      const fotoUrl = buildFotoUrl(fotoPath);
      const estado = voto
        ? voto.aprovado === "sim"
          ? "sim"
          : voto.aprovado === "nao"
            ? "nao"
            : "pendente"
        : "pendente";
      const nomeImg = JURADO_NOME_IMG[jid];
      return { jid, nome, fotoUrl, estado, nomeImg };
    });
  }, [votos, juradosInfo]);

  const handleImgError = (e) => {
    e.currentTarget.onerror = null;
    e.currentTarget.src = "";
    e.currentTarget.style.display = "none";
  };

  const hasAlgumVoto = votos && votos.length > 0;

  return (
    <div className="popup-classificatoria">
      <div className="colunas-votos">
        {colunas.map(({ jid, nome, fotoUrl, estado, nomeImg }) => (
          <div className={`coluna-voto ${estado}`} key={jid}>
            <div className="jurado-nome">
              {nomeImg ? (
                <img
                  src={nomeImg}
                  alt={`Nome do jurado ${jid}`}
                  style={{ maxWidth: "140px", width: "100%", height: "auto", display: "block", margin: "0 auto" }}
                />
              ) : (
                nome
              )}
            </div>
            <div className="jurado-foto">
              {fotoUrl ? (
                <img
                  src={fotoUrl}
                  alt={nome}
                  onError={handleImgError}
                  className={estado === "pendente" ? "foto-pendente" : ""}
                />
              ) : (
                <div className="jurado-foto--placeholder">Jurado {jid}</div>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* Só mostra a mensagem se já terminou o loading E realmente não tem nenhum voto */}
      {/* {!loading && !hasAlgumVoto && (
        <div className="mensagem-vazia">Sem votos até o momento.</div>
      )} */}
    </div>
  );
};

export default PopupClassificatoria;
