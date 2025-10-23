import React, { useEffect, useMemo, useState } from "react";
import { useSearchParams } from "react-router-dom";
import axios from "axios";
import { API_FESTIVAL } from "../../services/api";
import "../styles/PopupAvancosPodio.css";

const buildFotoUrl = (raw) => {
  if (!raw) return null;
  let p = String(raw).trim().replace(/\\/g, "/").replace(/^\.\/+/, "");
  if (/^https?:\/\//i.test(p)) return p;
  if (p.startsWith("/uploads")) return `${API_FESTIVAL}${p}`;
  if (p.startsWith("uploads/")) return `${API_FESTIVAL}/${p}`;
  return `${API_FESTIVAL}/${p}`;
};

// A função fmt ainda é útil para a porcentagem, então podemos mantê-la.
const fmt = (v, d = 1) =>
  v == null || isNaN(Number(v)) ? "—" : Number(v).toFixed(d).replace(".", ",");

export default function PopupAvancosPodio({ data, sessaoId: propSessaoId, etapaId: propEtapaId, dataISO: propDataISO, isEmbedded = false }) {
  const [searchParams] = useSearchParams();
  
  // Priorizar props sobre searchParams
  const sessaoId = propSessaoId || searchParams.get("sessao_id");
  const etapaId = propEtapaId || searchParams.get("etapa_id");
  const dataISO = propDataISO || searchParams.get("data");

  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [erro, setErro] = useState("");

  useEffect(() => {
    let cancel = false;
    const fetchData = async () => {
      // Prioriza sessao_id se estiver presente (novo sistema)
      // Senão, usa etapa_id + data (sistema antigo)
      if (!sessaoId && (!etapaId || !dataISO)) {
        console.log("Faltam parâmetros - sessaoId:", sessaoId, "etapaId:", etapaId, "dataISO:", dataISO);
        return;
      }
      
      setLoading(true);
      setErro("");
      
      try {
        let response;
        
        if (sessaoId) {
          // Novo sistema: busca por sessão
          console.log("Buscando dados por sessão ID:", sessaoId);
          response = await axios.get(`${API_FESTIVAL}/api/dashboard/avancos-sessao`, {
            params: { sessao_id: sessaoId },
          });
        } else {
          // Sistema antigo: busca por etapa + data
          console.log("Buscando dados por etapa e data - etapaId:", etapaId, "dataISO:", dataISO);
          response = await axios.get(`${API_FESTIVAL}/api/dashboard/avancos-dia`, {
            params: { etapa_id: etapaId, data: dataISO },
          });
        }

        let arr = Array.isArray(response.data) ? response.data : [];
        console.log("Dados recebidos:", arr);

        // ⚠️ CORREÇÃO 1: Usar o campo correto para ordenação
        const arrJuri = arr
          .filter(x => x.origem !== "popular" && x.tipo !== "popular")
          // Usamos o novo campo numérico, já arredondado e confiável
          .sort((a, b) => b.media_final_arredondada - a.media_final_arredondada); // <-- MUDANÇA AQUI

        arrJuri.forEach((item, idx) => {
          if (idx < 3) item.posicao = idx + 1;
        });

        // O resto da sua lógica de seleção do pódio parece correta
        const podium = [];
        const jaUsados = new Set();

        if (Number(etapaId) === 5) {
            const topJurados = arrJuri.slice(0, 2);
            topJurados.forEach(j => {
                podium.push(j);
                jaUsados.add(String(j.candidato_id || j.id));
            });
            const populares = arr
                .filter(x => x.origem === "popular" || x.tipo === "popular")
                .sort((a, b) => Number(b.porcentagem ?? 0) - Number(a.porcentagem ?? 0));
            const pop = populares.find(
                x => !jaUsados.has(String(x.candidato_id || x.id))
            );
            if (pop) podium.push(pop);
            setItems(podium.slice(0, 3));
        } else {
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
            const populares = arr
                .filter((x) => x.origem === "popular" || x.tipo === "popular")
                .sort((a, b) => Number(b.porcentagem ?? 0) - Number(a.porcentagem ?? 0));
            const pop = populares.find(
                (x) => !jaUsados.has(String(x.candidato_id || x.id))
            );
            if (pop) podium.push(pop);
            
            if (podium.length < 4) {
                // CORREÇÃO: A ordenação aqui também precisa usar o campo novo
                const restantes = arr
                    .filter((x) => !jaUsados.has(String(x.candidato_id || x.id)))
                    .sort((a, b) => b.media_final_arredondada - a.media_final_arredondada); // <-- MUDANÇA AQUI TAMBÉM
                for (const r of restantes) {
                    if (podium.length >= 4) break;
                    podium.push(r);
                }
            }
            setItems(podium.slice(0, 4));
        }
      } catch (e) {
        setErro("Não foi possível carregar os avanços do dia.");
      } finally {
        if (!cancel) setLoading(false);
      }
    };

    fetchData();
    return () => { cancel = true; };
  }, [etapaId, dataISO, sessaoId, data]);

  const cards = useMemo(() => {
    return items.map((c, i) => {
      const foto = buildFotoUrl(c.foto);
      const nome = c.nome_artistico || c.nome || "Candidato";
      const pos = Number(c.posicao || c.rank || 0);
      const isPopular = c.origem === "popular" || c.tipo === "popular";

      let subtitle = "";
      let valueTitle = "";
      let value = "";
      if (isPopular) {
        subtitle = "❤️ Voto Popular";
        valueTitle = "Votos do Público";
        value = `${fmt(c.porcentagem, 0)}%`;
      } else {
        // Lógica para todos os vencedores por nota
        if (pos >= 1 && pos <= 3) {
            const medal = pos === 1 ? "🏆 1º Lugar" : pos === 2 ? "🥈 2º Lugar" : "🥉 3º Lugar";
            subtitle = medal;
        }
        valueTitle = "Nota Final";
        // ⚠️ CORREÇÃO 2: Usar o campo de exibição que vem direto do backend
        value = c.media_final_exibicao; // <-- MUDANÇA PRINCIPAL AQUI
      }

      let ringClass = "ring-neutral";
      if (pos === 1) ringClass = "ring-gold";
      else if (pos === 2) ringClass = "ring-silver";
      else if (pos === 3) ringClass = "ring-bronze";
      else if (isPopular) ringClass = "ring-popular";

      return { foto, nome, subtitle, valueTitle, value, ringClass };
    });
  }, [items]);

  return (
    // O seu JSX de renderização continua o mesmo, sem necessidade de alterações aqui.
    <div className="podioV2">
      <header className="podioV2__header">
        <h1>Painel de Classificados</h1>
        <div className="badges">
          {sessaoId && <span className="badge-avancos">Sessão #{sessaoId}</span>}
          {!sessaoId && etapaId && <span className="badge-avancos">Etapa #{etapaId}</span>}
          {!sessaoId && dataISO && <span className="badge-avancos data">{dataISO}</span>}
        </div>
        {/* Só mostrar botão de fechar se não for embedded */}
        {!isEmbedded && <button className="btn-close" onClick={() => window.close()}>✕</button>}
      </header>

      {erro && <div className="msg erro">{erro}</div>}
      {loading && <div className="msg">Carregando…</div>}

      {!loading && !erro && (
        <section className={`podioV2__grid${Number(etapaId) === 5 ? " podio3" : ""}`}>
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

          {cards.length < (Number(etapaId) === 5 ? 3 : 4) &&
            Array.from({ length: (Number(etapaId) === 5 ? 3 : 4) - cards.length }).map((_, k) => (
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
