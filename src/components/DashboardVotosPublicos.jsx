import React, { useState, useEffect, useRef } from "react";
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
  const intervalRef = useRef(null);
  const imagensPreCarregadas = useRef([]);

  const carregarVotos = async () => {
    setLoading(true);
    try {
      const res = await axios.get(`${API_FESTIVAL}/api/dashboard/votos-publicos?data=${dataSelecionada}`);
      setVotos(res.data);

      // Pré-carrega imagens
      imagensPreCarregadas.current = res.data.map((v) => {
        const img = new Image();
        const caminho = v.foto ? `${API_FESTIVAL}${v.foto.startsWith("/") ? "" : "/"}${v.foto}` : "/default-user.png";
        img.src = caminho;
        return img;
      });
    } catch (err) {
      console.error("Erro ao carregar votos públicos", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    carregarVotos();
    if (intervalRef.current) clearInterval(intervalRef.current);
    intervalRef.current = setInterval(() => {
      carregarVotos();
    }, 10000);
    return () => clearInterval(intervalRef.current);
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

  const imagePlugin = {
    id: "customImageLabels",
    afterDatasetsDraw(chart, args, options) {
      const {
        ctx,
        chartArea: { bottom },
        scales: { x },
      } = chart;

      votos.forEach((v, index) => {
        const xPos = x.getPixelForTick(index);
        const img = imagensPreCarregadas.current[index];
        const imgSize = 40;

        if (img?.complete && img.naturalWidth > 0) {
          ctx.drawImage(img, xPos - imgSize / 2, bottom + 10, imgSize, imgSize);

          ctx.font = "12px sans-serif";
          ctx.textAlign = "center";
          ctx.fillStyle = "#000";
          ctx.fillText(v.nome_artistico || v.nome, xPos, bottom + imgSize + 25);
        }
      });
    },
  };



  const options = {
    responsive: true,
    plugins: {
      legend: { display: false },
      tooltip: { mode: "index", intersect: false },
      customImageLabels: true
    },
    scales: {
      x: {
        ticks: { display: false }
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
          <Bar data={dataChart} options={options} plugins={[imagePlugin]} />
        </div>
      )}
    </div>
  );
};

export default DashboardVotosPublicos;
