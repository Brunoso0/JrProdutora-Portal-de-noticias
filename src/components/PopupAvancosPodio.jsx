import React, { useEffect, useMemo, useState } from "react";
import { useSearchParams } from "react-router-dom";
import axios from "axios";
import { API_FESTIVAL } from "../services/api";
import "../styles/PopupAvancosPodio.css";

const buildFotoUrl = (raw) => {
  if (!raw) return null;
  let p = String(raw).trim().replace(/\\/g, "/").replace(/^\.\/+/, "");
  if (/^https?:\/\//i.test(p)) return p;
  if (p.startsWith("/uploads")) return `${API_FESTIVAL}${p}`;
  if (p.startsWith("uploads/")) return `${API_FESTIVAL}/${p}`;
  return `${API_FESTIVAL}/${p}`;
};

const fmt = (v, d = 1) =>
  v == null || isNaN(Number(v)) ? "—" : Number(v).toFixed(d).replace(".", ",");

export default function PopupAvancosPodio() {
  const [searchParams] = useSearchParams();
  const etapaId = searchParams.get("etapa_id");
  const dataISO = searchParams.get("data");

  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [erro, setErro] = useState("");

  useEffect(() => {
    let cancel = false;
    const fetchData = async () => {
      if (!etapaId || !dataISO) return;
      setLoading(true);
      setErro("");
      try {
        const { data } = await axios.get(`${API_FESTIVAL}/api/dashboard/avancos-dia`, {
          params: { etapa_id: etapaId, data: dataISO },
        });

        let arr = Array.isArray(data) ? data : [];

        // Calcule posições manualmente para júri, se não vierem da API
        const arrJuri = arr
          .filter(x => x.origem !== "popular" && x.tipo !== "popular")
          .sort((a, b) => Number(b.media ?? -1) - Number(a.media ?? -1));
        arrJuri.forEach((item, idx) => {
          if (idx < 3) item.posicao = idx + 1;
        });

        // Se vierem mais que 4, mantemos 1º, 2º, 3º e 1 Popular (sem duplicar candidato)
        // Caso a sua API já devolva só os 4 certos, isso aqui apenas garante a ordem visual.
        const podium = [];
        const jaUsados = new Set();

        // 1°, 2°, 3° lugar por média/notas
        [1, 2, 3].forEach((pos) => {
          const found = arr.find(
            (x) =>
              Number(x.posicao || x.rank) === pos &&
              !jaUsados.has(String(x.candidato_id || x.id))
          );
          if (found) {
            podium.push(found);
            jaUsados.add(String(found.candidato_id || found.id));
          }
        });

        // Voto popular (maior %), evitando duplicar alguém que já entrou pelo júri
        const populares = arr
          .filter((x) => x.origem === "popular" || x.tipo === "popular")
          .sort((a, b) => Number(b.porcentagem ?? 0) - Number(a.porcentagem ?? 0));
        const pop = populares.find(
          (x) => !jaUsados.has(String(x.candidato_id || x.id))
        );
        if (pop) podium.push(pop);

        // Caso falte alguém (ex.: não teve popular), completa com os próximos por média
        if (podium.length < 4) {
          const restantes = arr
            .filter((x) => !jaUsados.has(String(x.candidato_id || x.id)))
            .sort((a, b) => Number(b.media ?? -1) - Number(a.media ?? -1));
          for (const r of restantes) {
            if (podium.length >= 4) break;
            podium.push(r);
          }
        }

        setItems(podium.slice(0, 4));
      } catch (e) {
        setErro("Não foi possível carregar os avanços do dia.");
      } finally {
        if (!cancel) setLoading(false);
      }
    };

    fetchData();
    return () => { cancel = true; };
  }, [etapaId, dataISO]);

  const cards = useMemo(() => {
    return items.map((c, i) => {
      const foto = buildFotoUrl(c.foto);
      const nome = c.nome_artistico || c.nome || "Candidato";
      const pos = Number(c.posicao || c.rank || 0);
      const isPopular = c.origem === "popular" || c.tipo === "popular";

      // subtítulo e valor de destaque (nota final ou % popular)
      let subtitle = "";
      let valueTitle = "";
      let value = "";
      if (isPopular) {
        subtitle = "❤️ Voto Popular";
        valueTitle = "Votos do Público";
        value = `${fmt(c.porcentagem, 0)}%`;
      } else if (pos >= 1 && pos <= 3) {
        const medal =
          pos === 1 ? "🏆 1º Lugar" : pos === 2 ? "🥈 2º Lugar" : "🥉 3º Lugar";
        subtitle = medal;
        valueTitle = "Nota Final";
        value = fmt(c.media, 1);
      } else {
        // fallback
        valueTitle = "Nota Final";
        value = fmt(c.media, 1);
      }

      // classe da borda do avatar conforme posição/origem
      let ringClass = "ring-neutral";
      if (pos === 1) ringClass = "ring-gold";
      else if (pos === 2) ringClass = "ring-silver";
      else if (pos === 3) ringClass = "ring-bronze";
      else if (isPopular) ringClass = "ring-popular";

      return { foto, nome, subtitle, valueTitle, value, ringClass };
    });
  }, [items]);

  return (
    <div className="podioV2">
      <header className="podioV2__header">
        <h1>Painel de Classificados</h1>
        <div className="badges">
          {etapaId && <span className="badge">Etapa #{etapaId}</span>}
          {dataISO && <span className="badge data">{dataISO}</span>}
        </div>
        <button className="btn-close" onClick={() => window.close()}>✕</button>
      </header>

      {erro && <div className="msg erro">{erro}</div>}
      {loading && <div className="msg">Carregando…</div>}

      {!loading && !erro && (
        <section className="podioV2__grid">
          {cards.map((c, i) => (
            <article className="glassCard" key={i}>
              <div className="avatar">
                {c.foto ? (
                  <img className={`avatar__img ${c.ringClass}`} src={c.foto} alt={c.nome}
                       onError={(e) => (e.currentTarget.style.display = "none")} />
                ) : (
                  <div className={`avatar__ph ${c.ringClass}`}>Foto</div>
                )}
              </div>

              <h2 className="nome">{c.nome}</h2>
              <p className={`subtitle ${c.ringClass}`}>{c.subtitle}</p>

              <div className="metric">
                <span className="metric__label">{c.valueTitle}</span>
                <div className="metric__value">{c.value}</div>
              </div>
            </article>
          ))}

          {/* placeholders caso venham < 4 */}
          {cards.length < 4 &&
            Array.from({ length: 4 - cards.length }).map((_, k) => (
              <article className="glassCard placeholder" key={`ph-${k}`}>
                <div className="avatar"><div className="avatar__ph">Foto</div></div>
                <h2 className="nome">Nome do Candidato</h2>
                <p className="subtitle">—</p>
                <div className="metric">
                  <span className="metric__label">Nota Final</span>
                  <div className="metric__value">—</div>
                </div>
              </article>
            ))}
        </section>
      )}
    </div>
  );
}
