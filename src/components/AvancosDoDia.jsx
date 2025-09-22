import React, { useEffect, useState } from "react";
import axios from "axios";
import { API_FESTIVAL } from "../services/api";
import "../styles/AvancosDoDia.css";
import { format } from "date-fns";

const AvancosDoDia = () => {
  const [etapas, setEtapas] = useState([]);
  const [etapaSelecionada, setEtapaSelecionada] = useState("");
  const [dataSelecionada, setDataSelecionada] = useState(format(new Date(), "yyyy-MM-dd"));
  const [resultados, setResultados] = useState([]);
  const [loading, setLoading] = useState(false);

  // Carregar etapas ao iniciar
  useEffect(() => {
    axios.get(`${API_FESTIVAL}/api/dashboard/etapas`)
      .then((res) => setEtapas(res.data))
      .catch((err) => console.error("Erro ao buscar etapas", err));
  }, []);

  // Buscar candidatos que avançam quando etapa e data estiverem preenchidas
  useEffect(() => {
    if (!etapaSelecionada || !dataSelecionada) return;

    const carregarAvancos = async () => {
      setLoading(true);
      try {
        const { data } = await axios.get(`${API_FESTIVAL}/api/dashboard/avancos-dia`, {
          params: { etapa_id: etapaSelecionada, data: dataSelecionada }
        });
        setResultados(Array.isArray(data) ? data : []);
      } catch (err) {
        console.error("Erro ao buscar avanços do dia", err);
        setResultados([]);
      } finally {
        setLoading(false);
      }
    };

    carregarAvancos();
  }, [etapaSelecionada, dataSelecionada]);

  return (
    <div className="avancos-container">
      <h2>🎤 Candidatos que Avançam de Fase</h2>

      <div className="filtros-avancos">
        <label>
          Etapa:
          <select value={etapaSelecionada} onChange={(e) => setEtapaSelecionada(e.target.value)}>
            <option value="">Selecione a etapa</option>
            {etapas.map((et) => (
              <option key={et.id} value={et.id}>{et.nome}</option>
            ))}
          </select>
        </label>

        <label>
          Data da votação:
          <input
            type="date"
            value={dataSelecionada}
            onChange={(e) => setDataSelecionada(e.target.value)}
          />
        </label>
      </div>

      {loading ? (
        <p>Carregando dados...</p>
      ) : resultados.length === 0 ? (
        <p>Nenhum voto registrado nesta data.</p>
      ) : (
        <div className="grid-candidatos-avancos">
          {resultados.map((c, idx) => (
            <div key={idx} className="card-avanco">
              <img
                src={
                  c.foto
                    ? `${API_FESTIVAL}${c.foto.startsWith("/") ? "" : "/"}${c.foto}`
                    : "/default-user.png"
                }
                alt={c.nome_artistico || c.nome}
                className="foto-candidato"
              />
              <div className="info-candidato">
                <strong>{c.nome_artistico || c.nome}</strong>
                <p>
                  Média:{" "}
                  {Array.isArray(c.jurados) && c.jurados.length > 0
                    ? (() => {
                        // Calcula média das médias dos jurados
                        const mediasJurados = c.jurados.map(
                          (j) =>
                            (Array.isArray(j.criterios) && j.criterios.length > 0
                              ? j.criterios.reduce((soma, crit) => soma + Number(crit.nota || 0), 0) /
                                j.criterios.length
                              : 0)
                        );
                        const mediaGeral =
                          mediasJurados.reduce((acc, m) => acc + m, 0) / (mediasJurados.length || 1);
                        return Number.isFinite(mediaGeral)
                          ? mediaGeral.toFixed(1).replace(".", ",")
                          : "N/A";
                      })()
                    : c.media != null
                    ? Number(c.media).toFixed(1).replace(".", ",")
                    : "N/A"}
                </p>
                {typeof c.total_votos === "number" && (
                  <p>
                    {c.total_votos} votos ({c.porcentagem ?? "0"}%)
                  </p>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default AvancosDoDia;
