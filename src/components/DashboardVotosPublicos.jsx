import React, { useState, useEffect } from "react";
import axios from "axios";
import "../styles/DashboardVotosPublicos.css";
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

ChartJS.register(CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend);

const DashboardVotosPublicos = () => {
  const [dataSelecionada, setDataSelecionada] = useState(format(new Date(), "yyyy-MM-dd"));
  const [votos, setVotos] = useState([]);
  const [loading, setLoading] = useState(false);

  const carregarVotos = async () => {
    setLoading(true);
    try {
      const res = await axios.get(`${API_FESTIVAL}/api/dashboard/votos-publicos?data=${dataSelecionada}`);
      setVotos(res.data);
    } catch (err) {
      console.error("Erro ao carregar votos públicos", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    carregarVotos();
  }, [dataSelecionada]);

  const dataChart = {
    labels: votos.map(v => v.nome_artistico || v.nome),
    datasets: [
      {
        label: "Votos",
        data: votos.map(v => v.total_votos),
        backgroundColor: "rgba(75, 192, 192, 0.6)",
        borderRadius: 4,
      }
    ]
  };

  const options = {
    responsive: true,
    plugins: {
      legend: { display: false },
      tooltip: { mode: "index", intersect: false },
    },
    scales: {
      x: {
        ticks: { autoSkip: false, maxRotation: 45, minRotation: 45 }
      },
      y: {
        beginAtZero: true
      }
    }
  };

  return (
    <div className="dashboard-votos-publicos">
      <h2>📊 Votação Popular - {format(new Date(dataSelecionada), "dd/MM/yyyy")}</h2>

      <div className="filtro-data">
        <label>Data da votação: </label>
        <input
          type="date"
          value={dataSelecionada}
          onChange={(e) => setDataSelecionada(e.target.value)}
        />
      </div>

      {loading ? (
        <p>Carregando votos...</p>
      ) : (
        <div className="grafico-container">
          <Bar data={dataChart} options={options} />
        </div>
      )}
    </div>
  );
};

export default DashboardVotosPublicos;
