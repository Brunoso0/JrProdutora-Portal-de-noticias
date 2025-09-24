import React, { useEffect, useMemo, useState } from "react";
import axios from "axios";
import { API_FESTIVAL } from "../services/api";
import { format } from "date-fns";
import { Bar } from "react-chartjs-2";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
} from "chart.js";
import "../styles/DashboardTotalVotos.css";

ChartJS.register(CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend);

const DashboardTotalVotos = () => {
  const [etapas, setEtapas] = useState([]);
  const [etapaSelecionada, setEtapaSelecionada] = useState("");
  const [dataSelecionada, setDataSelecionada] = useState(
    format(new Date(), "yyyy-MM-dd")
  );
  const [totalVotos, setTotalVotos] = useState(0);
  const [votosPorMinuto, setVotosPorMinuto] = useState([]);
  const [maisVotadoPorMinuto, setMaisVotadoPorMinuto] = useState(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    axios
      .get(`${API_FESTIVAL}/api/dashboard/etapas`)
      .then((res) => setEtapas(res.data))
      .catch((err) => console.error("Erro ao carregar etapas:", err));
  }, []);

  const fetchData = async () => {
    if (!etapaSelecionada || !dataSelecionada) return;
    try {
      setLoading(true);
      const [resTotal, resPorMinuto, resTop] = await Promise.all([
        axios.get(`${API_FESTIVAL}/api/dashboardvotos/total`, {
          params: { etapa_id: etapaSelecionada, data: dataSelecionada },
        }),
        axios.get(`${API_FESTIVAL}/api/dashboardvotos/por-minuto`, {
          params: { etapa_id: etapaSelecionada, data: dataSelecionada },
        }),
        axios.get(`${API_FESTIVAL}/api/dashboardvotos/top-minuto`, {
          params: { etapa_id: etapaSelecionada, data: dataSelecionada },
        }),
      ]);
      setTotalVotos(resTotal.data.total || 0);
      setVotosPorMinuto(Array.isArray(resPorMinuto.data) ? resPorMinuto.data : []);
      setMaisVotadoPorMinuto(resTop.data || null);
    } catch (err) {
      console.error("Erro ao buscar dados do dashboard de votos:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [etapaSelecionada, dataSelecionada]);

  const maxY = Math.max(...votosPorMinuto.map((i) => Number(i.total) || 0), 0);

  // Dataset com roxo e bordas arredondadas
  const chartData = useMemo(
    () => ({
      labels: votosPorMinuto.map((i) => i.hora_minuto),
      datasets: [
        {
          label: "Votos",
          data: votosPorMinuto.map((i) => i.total),
          backgroundColor: "rgba(168, 85, 247, 0.8)", // #a855f7
          borderColor: "rgba(168, 85, 247, 1)",
          borderWidth: 1,
          borderRadius: 6,
          barPercentage: 0.7,
          categoryPercentage: 0.8,
          hoverBackgroundColor: "rgba(168, 85, 247, 1)",
        },
      ],
    }),
    [votosPorMinuto]
  );

  const chartOptions = useMemo(
    () => ({
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: { display: false },
        tooltip: {
          backgroundColor: "#111827",
          displayColors: false,
          callbacks: {
            label: (ctx) => `Votos: ${ctx.raw}`,
          },
        },
      },
      scales: {
        y: {
          beginAtZero: true,
          suggestedMax: maxY < 5 ? 5 : undefined,
          grid: { color: "rgba(255,255,255,.1)" },
          ticks: { color: "#d1c9ff" },
          title: { display: false },
        },
        x: {
          grid: { display: false },
          ticks: { color: "#d1c9ff", maxRotation: 45, minRotation: 45 },
        },
      },
    }),
    [maxY]
  );

  const fotoUrl = (f) => {
    if (!f) return null;
    if (String(f).startsWith("http")) return f;
    const base = API_FESTIVAL.replace(/\/+$/, "");
    const path = String(f).replace(/\\/g, "/").replace(/^\/+/, "");
    return `${base}/${path}`;
  };

  return (
    <div className="tv-wrap">
      <div className="tv-container">
        {/* Header */}
        <header className="tv-header">
          <div className="tv-title-row">
            <span className="tv-icon-ll">ll</span>
            <h1>Total de Votos em Tempo Real</h1>
          </div>
        </header>

        {/* Filtros */}
        <section className="tv-filtros card">
          <div className="tv-f-grid">
            <div className="tv-field">
              <label>Etapa</label>
              <select
                value={etapaSelecionada}
                onChange={(e) => setEtapaSelecionada(e.target.value)}
              >
                <option value="">Selecione</option>
                {etapas.map((et) => (
                  <option key={et.id} value={et.id}>
                    {et.nome}
                  </option>
                ))}
              </select>
            </div>

            <div className="tv-field">
              <label>Data da Votação</label>
              <input
                type="date"
                value={dataSelecionada}
                onChange={(e) => setDataSelecionada(e.target.value)}
              />
            </div>

            <button
              type="button"
              className="tv-btn"
              onClick={fetchData}
              disabled={loading || !etapaSelecionada || !dataSelecionada}
            >
              <span className="tv-btn-dot" /> Atualizar
            </button>
          </div>
        </section>

        {/* Métricas */}
        <section className="tv-metric-row">
          <div className="tv-card metric-one card">
            <div className="metric-label">
              <span className="metric-ico people" />
              Total de Votos no Dia
            </div>
            <div className="metric-value">
              {totalVotos.toLocaleString("pt-BR")}
            </div>
          </div>

          <div className="tv-card metric-two card">
            <div className="metric-two-left">
              <div className="metric-avatar">
                {maisVotadoPorMinuto?.foto ? (
                  <img
                    src={fotoUrl(maisVotadoPorMinuto.foto)}
                    alt={maisVotadoPorMinuto.nome_artistico || maisVotadoPorMinuto.nome}
                    onError={(e) => (e.currentTarget.style.display = "none")}
                  />
                ) : (
                  <div className="metric-avatar-ph">★</div>
                )}
              </div>
              <div className="metric-two-label">
                « Candidato com Mais Votos em 1 Minuto
              </div>
            </div>
            <div className="metric-two-right">
              <div className="metric-two-name">
                {maisVotadoPorMinuto
                  ? maisVotadoPorMinuto.nome_artistico || maisVotadoPorMinuto.nome
                  : "—"}
              </div>
              <div className="metric-two-sub">
                <strong>
                  {maisVotadoPorMinuto ? maisVotadoPorMinuto.total : 0}
                </strong>{" "}
                votos no minuto de pico
              </div>
            </div>
          </div>
        </section>

        {/* Gráfico */}
        <section className="tv-chart card">
          <h3>Votos por Minuto</h3>
          <div className="tv-chart-box">
            {votosPorMinuto.length ? (
              <Bar data={chartData} options={chartOptions} />
            ) : (
              <p className="tv-empty">Sem dados para o período selecionado.</p>
            )}
          </div>
        </section>
      </div>
    </div>
  );
};

export default DashboardTotalVotos;
