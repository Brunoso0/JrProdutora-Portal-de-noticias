import React, { useEffect, useState } from "react";
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
  Legend
} from "chart.js";
import "../styles/DashboardTotalVotos.css";

ChartJS.register(CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend);

const DashboardTotalVotos = () => {
  const [etapas, setEtapas] = useState([]);
  const [etapaSelecionada, setEtapaSelecionada] = useState("");
  const [dataSelecionada, setDataSelecionada] = useState(format(new Date(), "yyyy-MM-dd"));
  const [totalVotos, setTotalVotos] = useState(0);
  const [votosPorMinuto, setVotosPorMinuto] = useState([]);
  const [maisVotadoPorMinuto, setMaisVotadoPorMinuto] = useState(null);
  const [loading, setLoading] = useState(false);

  // Carrega as etapas
  useEffect(() => {
    axios.get(`${API_FESTIVAL}/api/dashboard/etapas`)
      .then(res => setEtapas(res.data))
      .catch(err => console.error("Erro ao carregar etapas:", err));
  }, []);

  const fetchData = async () => {
    if (!etapaSelecionada || !dataSelecionada) return;

    try {
      setLoading(true);
      const [resTotal, resPorMinuto, resTop] = await Promise.all([
        axios.get(`${API_FESTIVAL}/api/dashboardvotos/total`, {
          params: { etapa_id: etapaSelecionada, data: dataSelecionada }
        }),
        axios.get(`${API_FESTIVAL}/api/dashboardvotos/por-minuto`, {
          params: { etapa_id: etapaSelecionada, data: dataSelecionada }
        }),
        axios.get(`${API_FESTIVAL}/api/dashboardvotos/top-minuto`, {
          params: { etapa_id: etapaSelecionada, data: dataSelecionada }
        })
      ]);

      setTotalVotos(resTotal.data.total || 0);
      setVotosPorMinuto(resPorMinuto.data || []);
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

  // Calcula o valor máximo para o eixo Y
  const maxY = Math.max(...votosPorMinuto.map(item => item.total), 0);

  const chartData = {
    labels: votosPorMinuto.map(item => item.hora_minuto),
    datasets: [
      {
        label: "Votos por Minuto",
        data: votosPorMinuto.map(item => item.total),
        backgroundColor: "rgba(54, 162, 235, 0.7)",
      },
    ],
  };

  const chartOptions = {
    responsive: true,
    plugins: {
      legend: { display: false },
      title: { display: false },
      tooltip: { mode: "index", intersect: false },
    },
    scales: {
      y: {
        beginAtZero: true,
        min: 0,
        max: maxY < 5 ? 5 : undefined,
        ticks: {
          stepSize: maxY > 10 ? Math.ceil(maxY / 10) : 1,
          color: "#222", // <-- cor dos números do eixo Y
        },
        title: {
          display: true,
          text: "Votos",
          color: "#222", // cor do título do eixo Y
        },
      },
      x: {
        title: {
          display: true,
          text: "Horário (minuto)",
          color: "#222", // cor do título do eixo X
        },
        ticks: {
          color: "#222", // cor dos números do eixo X
        },
      },
    },
  };

  return (
    <div className="dashboard-total-votos">
      <h2>📊 Total de Votos em Tempo Real</h2>

      <div className="filtros-votacao">
        <label>📌 Etapa:</label>
        <select value={etapaSelecionada} onChange={(e) => setEtapaSelecionada(e.target.value)}>
          <option value="">Selecione uma etapa</option>
          {etapas.map(etapa => (
            <option key={etapa.id} value={etapa.id}>
              {etapa.nome}
            </option>
          ))}
        </select>

        <label>📅 Data da votação:</label>
        <input
          type="date"
          value={dataSelecionada}
          onChange={(e) => {
            const dataISO = new Date(e.target.value).toISOString().split("T")[0];
            setDataSelecionada(dataISO);
          }}
        />
      </div>

      {loading ? (
        <p>Carregando dados...</p>
      ) : (
        <>
          <div className="box-total">
            <h3>🔢 Total de votos no dia</h3>
            <p className="total-votos-numero">{totalVotos}</p>
          </div>

          <div className="grafico-votos-minuto">
            <h3>⏱️ Votos por Minuto</h3>
            {votosPorMinuto.length > 0 ? (
              <Bar data={chartData} options={chartOptions} />
            ) : (
              <p>Nenhum voto registrado no intervalo.</p>
            )}
          </div>

          {maisVotadoPorMinuto && (
            <div className="mais-votado-minuto">
              <h3>🚀 Candidato com mais votos em 1 minuto</h3>
              <div className="card-candidato">
                <img
                  src={
                    maisVotadoPorMinuto.foto
                      ? `${API_FESTIVAL}${maisVotadoPorMinuto.foto.startsWith("/") ? "" : "/"}${maisVotadoPorMinuto.foto}`
                      : "/default-user.png"
                  }
                  alt={maisVotadoPorMinuto.nome_artistico || maisVotadoPorMinuto.nome}
                />
                <div>
                  <strong>{maisVotadoPorMinuto.nome_artistico || maisVotadoPorMinuto.nome}</strong>
                  <p>{maisVotadoPorMinuto.total} votos no minuto de pico</p>
                </div>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default DashboardTotalVotos;
