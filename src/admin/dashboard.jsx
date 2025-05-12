import React, { useState, useEffect, useRef } from "react";
import { Bar, Line, Pie, Doughnut, PolarArea } from "react-chartjs-2";
import axios from "axios";
import { Chart, CategoryScale, LinearScale, LineElement, BarElement, Title, Tooltip, Legend, PointElement, ArcElement, RadialLinearScale  } from "chart.js";
import { ComposableMap, Geographies, Geography } from "react-simple-maps";
import { scaleLinear } from "d3-scale";
import Loader from "../components/Loader.jsx"; // Componente de Loader
import "../styles/Dashboard.css";

import { API_BASE_URL } from "../services/api"; // Importando o arquivo de configuração do Axios


// Registrar os componentes necessários do Chart.js
Chart.register(CategoryScale,
    LinearScale,
    BarElement,
    LineElement,
    PointElement,
    ArcElement, 
    Title, Tooltip, 
    Legend,
    RadialLinearScale);


// Mapeamento dos dias da semana para português
const diasSemanaPT = {
  Sunday: "Domingo",
  Monday: "Segunda-feira",
  Tuesday: "Terça-feira",
  Wednesday: "Quarta-feira",
  Thursday: "Quinta-feira",
  Friday: "Sexta-feira",
  Saturday: "Sábado",
};

const Dashboard = () => {
  // Estados para armazenar dados
  const [loading, setLoading] = useState(true);
  const [weeklyData, setWeeklyData] = useState([]); // Estado para armazenar os dados semanais
  const [monthlyData, setMonthlyData] = useState([]); // Estado para armazenar os dados mensais
  const [totalPageViews] = useState(15000); // Exemplo fictício de total de páginas vistas
  const [uniqueVisitors] = useState(4000); // Exemplo fictício de visitantes únicos
  const [returningVisitors] = useState(11000); // Exemplo fictício de visitantes retornantes
  const [prevWeeklyVisits, setPrevWeeklyVisits] = useState(0); // Estado para armazenar o total de visitas da semana anterior
  const [prevMonthlyVisits, setPrevMonthlyVisits] = useState(0); // Estado para armazenar o total de visitas do mês anterior
  const [newsData, setNewsData] = useState(null); // Dados das notícias do mês
  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth() + 1); // Inicializa com o mês atual
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear()); // Inicializa com o ano atual
  const [noticias, setNoticias] = useState([]); // Notícias mais lidas
  const [openModalId, setOpenModalId] = useState(null); // ⬅️ Novo estado para identificar qual modal está aberto
  const [deviceData, setDeviceData] = useState({ 
    mobile: 0,
    desktop: 0,
    tablet: 0,
    mobilePercent: 0,
    desktopPercent: 0,
    tabletPercent: 0
  }); // Dados de dispositivos
  const [mapData, setMapData] = useState({}); // Dados para o mapa
  const [selectedCountry, setSelectedCountry] = useState(null); // Estado para armazenar o país selecionado
  const [tooltipContent, setTooltipContent] = useState(""); // Estado para exibir o conteúdo do tooltip
  // const [barChartData, setBarChartData] = useState(null); // Dados do gráfico de barras
  const [cityData, setCityData] = useState([]); // Dados das cidades
  const [categoriasData, setCategoriasData] = useState([]); // Dados das categorias
  const [visitasDiarias, setVisitasDiarias] = useState([]);


  // deixando os textos dos graficos brancos
  Chart.defaults.color = "#fff";
  Chart.defaults.borderColor = "#7a7a7a";
  

  useEffect(() => {
    const fetchData = async () => {
      try {
        // Notícias mais visualizadas
        const noticiasResponse = await axios.get(`${API_BASE_URL}/noticias/mais-visualizadas`);
        setNoticias(noticiasResponse.data);
  
        // Categorias mais visualizadas
        const categoriasResponse = await axios.get(`${API_BASE_URL}/noticias/categorias-mais-visualizadas`);
        const categoriasCalculadas = categoriasResponse.data.map(categoria => ({
          ...categoria,
          popularidade: categoria.total_noticias > 0 ? categoria.total_visualizacoes / categoria.total_noticias : 0,
        }));
        const top5Categorias = categoriasCalculadas.sort((a, b) => b.popularidade - a.popularidade).slice(0, 5);
        setCategoriasData(top5Categorias);
  
        // Dados de dispositivos
        const dispositivosResponse = await axios.get(`${API_BASE_URL}/admin/dispositivos`);
        setDeviceData(dispositivosResponse.data);
  
        // Dados de localização
        const locationsResponse = await fetch(`${API_BASE_URL}/admin/locations`);
        const locationsData = await locationsResponse.json();
        if (locationsData.success) {
          const formattedData = locationsData.data.reduce((acc, row) => {
            acc[row.pais] = row.total_visitas;
            return acc;
          }, {});
          setMapData(formattedData);
        }
  
        // Dados de cidades
        const citiesResponse = await fetch(`${API_BASE_URL}/admin/locations/cities`);
        const citiesData = await citiesResponse.json();
        if (citiesData.success) {
          setCityData(citiesData.data);
        }
  
        // Dados de visitas semanais
        const weeklyResponse = await fetch(`${API_BASE_URL}/admin/weekly-visits`);
        const weeklyData = await weeklyResponse.json();
        if (weeklyData.success) {
          setPrevWeeklyVisits(weeklyData.data.reduce((sum, item) => sum + item.visits, 0));
          setWeeklyData(weeklyData.data.map(item => ({
            day: diasSemanaPT[item.day] || item.day,
            visits: Number(item.visits),
          })));
        }
  
        // Dados de visitas mensais
        const monthlyResponse = await fetch(`${API_BASE_URL}/admin/monthly-yearly-visits`);
        const monthlyData = await monthlyResponse.json();
        if (monthlyData.success) {
          setPrevMonthlyVisits(monthlyData.data.reduce((sum, item) => sum + item.visits, 0));
          setMonthlyData(monthlyData.data.map(item => ({
            month: item.month,
            visits: Number(item.visits),
          })));
        }

        // Visitas únicas e recorrentes por dia (últimos 30 dias)
        const visitasResponse = await axios.get(`${API_BASE_URL}/auth/admin/visitas-diarias`);
        if (visitasResponse.data.success) {
          setVisitasDiarias(visitasResponse.data.data);
        }

  
        // Dados de notícias do mês
        const newsResponse = await axios.get(`${API_BASE_URL}/noticias/por-mes/${selectedYear}/${selectedMonth}`);
        setNewsData(newsResponse.data);
  
        // Dados carregados com sucesso
        setTimeout(() => {
          setLoading(false);
        }, 1000); 
        
      } catch (error) {
        console.error("Erro ao buscar dados do dashboard:", error);
      }
    };
  
    // Chama os dados inicialmente
    fetchData();
  
    // Atualiza os dados a cada 30 segundos
    const intervalId = setInterval(fetchData, 5000);
  
    // Limpa o intervalo ao desmontar o componente
    return () => clearInterval(intervalId);
  }, [selectedYear, selectedMonth]);
  

  

  const countryNameMapping = {
    "United States": "US",
    "Brazil": "BR",
    "United Kingdom": "UK",
    "Germany": "DE",
    "Japan": "JP",
    "France": "FR",
    "Portugal": "PT",
    "Argentina": "AR",
    "Canada": "CA",
    "Mexico": "MX",
    "Spain": "ES",
    "Russia": "RU",
    "China": "CN",
    "Australia": "AU",
    "Nigeria": "NG",
    "United Arab Emirates": "AE"
  };
  

  const categoriasChartData = {
    labels: categoriasData.map(categoria => categoria.nome),
    datasets: [
      {
        label: "Visualizações",
        data: categoriasData.map(categoria => categoria.total_visualizacoes),
        backgroundColor: "#3b82f6",
        borderRadius: 6,
        barThickness: 12, // 🔥 Define um tamanho fixo para evitar expansão
        
      },
      {
        label: "Notícias",
        data: categoriasData.map(categoria => categoria.total_noticias),
        backgroundColor: "#22c55e",
        color: "#ffffff",
        borderRadius: 6,
        barThickness: 12, // 🔥 Define um tamanho fixo para evitar expansão
      },
    ],
  };

  const noticiasChartData = {
    labels: ["🥇 TOP 1", "🥈 TOP 2", "🥉 TOP 3", "TOP 4", "TOP 5"], // 🔥 Medalhas embutidas diretamente
    datasets: [
      {
        label: "Visualizações",
        data: noticias.map(noticia => noticia.visualizacoes),
        backgroundColor: [
          "rgba(255, 215, 0, 0.6)",   // Ouro 🥇
          "rgba(192, 192, 192, 0.6)", // Prata 🥈
          "rgba(205, 127, 50, 0.6)",  // Bronze 🥉
          "rgba(54, 162, 235, 0.6)",  // 4ª Notícia (oculta na legenda)
          "rgba(153, 102, 255, 0.6)", // 5ª Notícia (oculta na legenda)
        ],
        borderWidth: 1,
      },
    ],
  };
  
  

  const legendOptions = {
    plugins: {
      legend: {
        position: "bottom",
        labels: {
          color: "#ffffff", // 🔥 Define a cor branca para o texto da legenda
          font: { size: 14 },
          generateLabels: function (chart) {
            const labels = chart.data.labels.map((label, index) => ({
              text: index < 3 ? label : "", // 🔥 Mantém apenas os 3 primeiros, oculta os outros
              fillStyle: chart.data.datasets[0].backgroundColor[index],
              fontColor: "#ffffff", // 🔥 Força a cor branca
              hidden: index >= 3, // Oculta 4 e 5
            }));
            return labels.filter(label => label.text); // Remove legendas vazias
          },
        },
      },
    },
  };


  const generateColor = (name) => {
    let hash = 0;
    for (let i = 0; i < name.length; i++) {
      hash = name.charCodeAt(i) + ((hash << 5) - hash);
    }
    const color = `#${((hash >> 24) & 0xff).toString(16).padStart(2, "0")}${((hash >> 16) & 0xff).toString(16).padStart(2, "0")}${((hash >> 8) & 0xff).toString(16).padStart(2, "0")}`.slice(0, 7);
    return color;
  };

  const colorScale = scaleLinear()
    .domain([0, Math.max(...Object.values(mapData))])
    .range(["#ccc", "#007bff"]);

  
  

  const handleMonthChange = (e) => {
    const [year, month] = e.target.value.split("-");
    setSelectedYear(year);
    setSelectedMonth(month);
  };

  const handleOpenModal = (id) => {
    setOpenModalId(id); // Define qual modal está aberto
  };

  const handleCloseModal = () => {
    setOpenModalId(null); // Fecha todos os modais
  };

  const fetchWeeklyVisits = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/admin/weekly-visits`);
      const data = await response.json();
      if (data.success) {
        // Obtendo o total atual
        const currentTotal = data.data.reduce((sum, item) => sum + Number(item.visits), 0);

        // Definindo o valor anterior como o valor atual antes da atualização
        setPrevWeeklyVisits(weeklyData.reduce((sum, item) => sum + item.visits, 0));

        setWeeklyData(data.data.map((item) => ({
          day: diasSemanaPT[item.day] || item.day,
          visits: Number(item.visits),
        })));
      }
    } catch (error) {
      console.error("Erro ao buscar visitas semanais:", error);
    }
  };

  const fetchMonthlyYearlyVisits = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/admin/monthly-yearly-visits`);
      const data = await response.json();
      if (data.success) {
        // Obtendo o total atual
        // const currentTotal = data.data.reduce((sum, item) => sum + Number(item.visits), 0);

        // Definindo o valor anterior como o valor atual antes da atualização
        setPrevMonthlyVisits(monthlyData.reduce((sum, item) => sum + item.visits, 0));

        setMonthlyData(data.data.map((item) => ({
          month: item.month,
          visits: Number(item.visits),
        })));
      }
    } catch (error) {
      console.error("Erro ao buscar visitas mensais:", error);
    }
  };

  const avgDailyVisits = (weeklyData.reduce((sum, item) => sum + item.visits, 0) / 7).toFixed(2);

  // Dados do gráfico de Visitantes Únicos vs Retornantes (Linha Progressiva)
  const visitasOrdenadas = [...visitasDiarias].sort((a, b) => new Date(a.dia) - new Date(b.dia));

  const progressiveLineChartData = {
    labels: visitasOrdenadas.map(d =>
      new Date(d.dia).toLocaleDateString("pt-BR", { day: "2-digit", month: "2-digit" })
    ),
    datasets: [
      {
        label: "Primeiro Acesso",
        data: visitasOrdenadas.map(d => d.unicos),
        borderColor: "#4f46e5",
        backgroundColor: "rgba(79, 70, 229, 0.2)",
        fill: true,
        tension: 0.3,
        pointRadius: 2,
      },
      {
        label: "Acesso Recorrente",
        data: visitasOrdenadas.map(d => d.recorrentes),
        borderColor: "#22c55e",
        backgroundColor: "rgba(34, 197, 94, 0.2)",
        fill: true,
        tension: 0.3,
        pointRadius: 2,
      },
    ],
  };


  // Dados do gráfico de pizza - Dispositivos mais usados (cores suaves)
  const deviceDoughnutChartData = {
    labels: [
      `Mobile (${deviceData.mobilePercent}%)`, 
      `Desktop (${deviceData.desktopPercent}%)`, 
      `Tablet (${deviceData.tabletPercent}%)`
    ],
    datasets: [
      {
        data: [deviceData.mobile, deviceData.desktop, deviceData.tablet], 
        backgroundColor: ["#3b82f6", "#22c55e", "#9333ea"], // Cores vibrantes para fundo
        hoverBackgroundColor: ["#60a5fa", "#4ade80", "#a855f7"], // Tons mais claros no hover
        borderWidth: 2,
        borderColor: "#2d2d2d", // Borda escura para melhor contraste
      },
    ],
  };

  

  const deviceDoughnutChartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        display: true,
        position: "bottom",
        labels: { color: "#fff", font: { size: 14 } },
      },
    },
  };

  // Dados do gráfico de Notícias Mais Acessadas da ultima semana (Pizza)
  const topNewsChartData = {
    labels: ["Notícia 1", "Notícia 2", "Notícia 3", "Notícia 4", "Notícia 5"], // Exemplo de notícias
    datasets: [
      {
        label: "Acessos",
        data: [300, 250, 200, 150, 100], // Exemplo de dados
        backgroundColor: ["#4f46e5", "#22c55e", "#f97316", "#e11d48", "#14b8a6"],
        hoverOffset: 4,
      },
    ],
  };

  return (
    <>
    {loading ? <Loader /> : <div className="dashboard-container">
      <div className="dashboard-grid">
        {/* Widget de visitas semanais */}
        <div className="dashboard-widget div1">
          <h3>Visitas Semanais</h3>
          {weeklyData.length > 0 ? (
            <Bar
              data={{
                labels: weeklyData.map((item) => item.day),
                datasets: [{ label: "Visitas Semanais", data: weeklyData.map((item) => item.visits), backgroundColor: "#8869E6", borderRadius: 6 }],
              }}
              options={{ responsive: true }}
            />
          ) : (
            <p>Carregando...</p>
          )}
        </div>

        {/* Widget de visitas mensais */}
        <div className="dashboard-widget div2">
          <h3>Visitas Mensais</h3>
          {monthlyData.length > 0 ? (
            <Bar
              data={{
                labels: monthlyData.map((item) => item.month),
                datasets: [{ label: "Visitas Mensais", data: monthlyData.map((item) => item.visits), backgroundColor: "#3A52FA", borderRadius: 6 }],
              }}
              options={{ responsive: true }}
            />
          ) : (
            <p>Carregando...</p>
          )}
        </div>

        {/* Estatísticas gerais - Clicável para abrir o modal */}
        <div className="dashboard-widget div3" 
        // onClick={() => handleOpenModal("dispositivos")}     Desativar quando estiver corrigido
        style={{ cursor: "pointer" }}>
          <h3>📊 Dispositivos Mais Usados</h3>
          <div className="donut-chart-container">
            <Pie data={deviceDoughnutChartData} options={deviceDoughnutChartOptions} />
          </div>
        </div>

        {/* Modal de Estatísticas Gerais */}
        {openModalId === "dispositivos" && (
          <div className="dashboard3-modal">
            <div className="dashboard3-modal-content">
              <h2>📊 Estatísticas Gerais</h2>

              {/* Grid de Informações */}
              <div className="dashboard3-information-grid">
                <div className="dashboard3-info-box">
                  <p>🔹 <b>Total de visitas semanais:</b></p>
                  <span>{weeklyData.reduce((sum, item) => sum + item.visits, 0)}</span>
                </div>

                <div className="dashboard3-info-box">
                  <p>🔹 <b>Total de visitas mensais:</b></p>
                  <span>{monthlyData.reduce((sum, item) => sum + item.visits, 0)}</span>
                </div>

                <div className="dashboard3-info-box">
                  <p>🔹 <b>Média de visitas por dia:</b></p>
                  <span>{avgDailyVisits}</span>
                </div>

                <div className="dashboard3-info-box">
                  <p>🔹 <b>Visitantes únicos na semana:</b></p>
                  <span>{uniqueVisitors}</span>
                </div>

                <div className="dashboard3-info-box">
                  <p>🔹 <b>Taxa de retorno de leitores:</b></p>
                  <span>{((returningVisitors / totalPageViews) * 100).toFixed(1)}%</span>
                </div>

                <div className="dashboard3-info-box">
                  <p>🔹 <b>Número total de páginas vistas:</b></p>
                  <span>{totalPageViews}</span>
                </div>
              </div>

              {/* Gráficos */}
              <div className="dashboard3-charts-grid">
                <div className="dashboard3-chart-box ds3-chart1">
                  <h3>📈 Visitantes Únicos vs Retornantes</h3>
                  <Line
                    data={progressiveLineChartData}
                    options={{
                      responsive: true,
                      animation: { duration: 1500, easing: "easeInOutQuart" },
                    }}
                  />
                </div>

                <div className="dashboard3-chart-box ds3-chart2">
                  <h3>📰 Notícias Mais Acessadas da Semana</h3>
                  <Pie data={topNewsChartData} options={{ responsive: true }} />
                </div>
              </div>

              {/* Botão de Fechar */}
              <button className="dashboard3-close-btn" onClick={handleCloseModal}>
                <span className="X"></span>
                <span className="Y"></span>
                <div className="close">Close</div>
              </button>
            </div>
          </div>
        )}

        {/* Widget de Notícias Mais Lidas */}
        <div className="dashboard-widget div4" style={{ maxHeight: "450px" }}>
          <h3>🏆 Notícias Mais Lidas</h3>
          <div className="ds4-chart">
            {noticias.length > 0 ? (
              <PolarArea
                key={noticias.map(n => n.visualizacoes).join(",")}
                data={{
                  labels: ["🥇 TOP 1", "🥈 TOP 2", "🥉 TOP 3", "TOP 4", "TOP 5"], // 🔥 Medalhas incluídas
                  datasets: [
                    {
                      label: "Visualizações",
                      data: noticias.map(noticia => noticia.visualizacoes),
                      backgroundColor: [
                        "rgba(255, 215, 0, 0.6)",   // Ouro 🥇
                        "rgba(192, 192, 192, 0.6)", // Prata 🥈
                        "rgba(205, 127, 50, 0.6)",  // Bronze 🥉
                        "rgba(54, 162, 235, 0.6)",  // Oculto
                        "rgba(153, 102, 255, 0.6)", // Oculto
                      ],
                      borderWidth: 1,
                    },
                  ],
                }}
                options={{
                  responsive: true,
                  maintainAspectRatio: false,
                  plugins: {
                    legend: legendOptions.plugins.legend, // 🔥 Aplica a configuração de legenda branca
                    tooltip: {
                      enabled: true,
                      callbacks: {
                        label: function (tooltipItem) {
                          return `${noticias[tooltipItem.dataIndex].titulo}: ${noticias[tooltipItem.dataIndex].visualizacoes} visualizações`;
                        },
                      },
                    },
                  },
                  scales: {
                    r: {
                      beginAtZero: true,
                      suggestedMin: 0,
                      suggestedMax: Math.max(...noticias.map(n => n.visualizacoes)) + 5,
                      ticks: {
                        color: "#ffffff", // 🔥 Define a cor do texto dos números como branco
                        backdropColor: "transparent", // 🔥 Remove o fundo dos números
                      },
                    },
                  },
                }}
              />
            ) : (
              <p>Carregando...</p>
            )}
          </div>
        </div>



        {/* Widget de Notícias Publicadas no Mês */}
        <div className="dashboard-widget div5" onClick={() => handleOpenModal("noticias-mes")} style={{ cursor: "pointer" }}>
          <h3>📰 Notícias Publicadas no Mês</h3>
          <p className="month-name">{new Date(selectedYear, selectedMonth - 1).toLocaleString("pt-BR", { month: "long", year: "numeric" })} </p>
          {newsData ? (
            <div className="donut-chart-wrapper">
              <Doughnut
                data={{
                  labels: ["Café com Resenhas", "Jr Esportes", "Jr Notícias"],
                  datasets: [
                    {
                      data: [newsData.programa_1, newsData.programa_2, newsData.programa_3],
                      backgroundColor: ["#ff6384", "#36a2eb", "#ffce56"],
                      borderWidth: 2,
                    },
                  ],
                }}
                options={{
                  cutout: "70%",
                  plugins: {
                    legend: { display: true, position: "bottom" },
                  },
                }}
              />
              <div className="donut-center">
                <p>{newsData.total}</p>
                <span>Total</span>
              </div>
            </div>
          ) : (
            <p>Carregando...</p>
          )}
        </div>

        {/* Modal para visualizar dados detalhados */}
        {openModalId === "noticias-mes" && (
          <div className="modal">
            <div className="dashboard5-modal-content">
              <h2>📊 Estatísticas por Mês</h2>
                <label>Escolha o mês:
                  <input type="month" value={`${selectedYear}-${String(selectedMonth).padStart(2, "0")}`} onChange={handleMonthChange} />
                </label>

                <div className="ds5-modal-grid">
                  <div className="ds5-modal-notice">

                    {newsData ? (
                      <Bar
                        data={{
                          labels: ["Total", "Café com Resenhas", "Jr Esportes", "Jr Notícias"],
                          datasets: [
                            {
                              label: "Notícias Publicadas",
                              data: [newsData.total, newsData.programa_1, newsData.programa_2, newsData.programa_3],
                              backgroundColor: ["#4f46e5", "#ff6384", "#36a2eb", "#ffce56"],
                              borderRadius: 6,
                            },
                          ],
                        }}
                        options={{
                          responsive: true,
                          plugins: {
                            legend: { display: true },
                          },
                        }}
                      />
                    ) : (
                      <p>Carregando...</p>
                    )}
                  </div>
                  <div className="ds5-modal-categories">
                    <h3>📊 Publicações Diárias por Categoria</h3>
                    {newsData && newsData.categoriesPerDay ? (
                                            <Line
                        data={{
                          labels: newsData.categoriesPerDay.map(item =>
                            new Date(item.dia).toLocaleDateString("pt-BR", { day: "2-digit" })
                          ), // Exibe apenas o dia do mês
                          datasets: newsData.categories.map(category => ({
                            label: category.name,
                            data: newsData.categoriesPerDay
                              .filter(item => item.categoria === category.name)
                              .map(item => item.total), // Pegando a contagem correta
                            borderColor: generateColor(category.name), // Cor única baseada no nome da categoria
                            backgroundColor: `${generateColor(category.name)}33`, // Cor com transparência para o fundo
                            fill: false,
                          })),
                        }}
                        options={{
                          responsive: true,
                          scales: {
                            y: {
                              beginAtZero: true,
                              ticks: {
                                stepSize: 1, // Exibir apenas números inteiros
                                precision: 0, // Garantir que não exiba casas decimais
                              },
                            },
                          },
                        }}
                      />
                    ) : (
                      <p>Carregando...</p>
                    )}
                  </div>
                </div>

              <button className="dashboard3-close-btn" onClick={handleCloseModal}>
                <span className="X"></span>
                <span className="Y"></span>
                <div className="close">Close</div>
              </button>
            </div>
          </div>
        )}

        {/* Outros Widgets */}
        <div className="dashboard-widget div6" style={{ maxHeight: "450px" }}>
  <h3>Seções Mais Populares</h3>
  {categoriasData.length > 0 ? (
    <Bar
      data={{
        labels: categoriasData.map(categoria => categoria.nome),
        datasets: [
          {
            label: "Visualizações",
            data: categoriasData.map(categoria => categoria.total_visualizacoes),
            backgroundColor: "#3b82f6",
            borderRadius: 6,
            barThickness: 12, // 🔥 Tamanho fixo da barra
            maxBarThickness: 15, // 🔥 Limita a expansão das barras
          },
          {
            label: "Notícias",
            data: categoriasData.map(categoria => categoria.total_noticias),
            backgroundColor: "#22c55e",
            borderRadius: 6,
            barThickness: 12, // 🔥 Tamanho fixo da barra
            maxBarThickness: 15, // 🔥 Limita a expansão das barras
          },
        ],
      }}
      options={{
        indexAxis: 'y', // Gráfico horizontal
        responsive: true,
        maintainAspectRatio: false,
        scales: {
          x: { beginAtZero: true },
          y: {
            ticks: {
              font: { size: 14 }, // 🔥 Mantém o tamanho fixo da fonte
            },
          },
        },
        plugins: {
          legend: { position: "bottom" },
        },
        categoryPercentage: 0.5, // 🔥 Reduz o espaço vertical entre categorias
        barPercentage: 0.6, // 🔥 Controla a largura da barra sem esticar
        layout: {
          padding: { top: 10, bottom: 45 }, // 🔥 Garante espaçamento interno sem esticar
        },
        hover: { mode: null }, // 🔥 Evita expansão ao passar o mouse
      }}
    />
  ) : (
    <p>Carregando...</p>
  )}
        </div>


        <div className="dashboard-widget div7"><h3>⚠️ EM BREVE!!! </h3></div>
        <div className="dashboard-widget div8"><h3>⚠️ EM BREVE!!! </h3></div>
        <div className="dashboard-widget div9"><h3>⚠️ EM BREVE!!! </h3></div>
        <div className="dashboard-widget div10" onClick={() => handleOpenModal("origem-acessos")} style={{ cursor: "pointer" }} >
          <div className="ds10-map-container">
            <ComposableMap>
              <Geographies geography="/data/countries-110m.json">
                {({ geographies }) =>
                  geographies.map((geo) => {
                    const countryKey = countryNameMapping[geo.properties.name] || geo.properties.name; // Mapeia o nome correto
                    const countryData = mapData[countryKey];

                    return (
                      <Geography
                        key={geo.rsmKey}
                        geography={geo}
                        fill={countryData ? colorScale(countryData) : "#ccc"}
                        onMouseEnter={() => {
                          setTooltipContent(countryData ? `${geo.properties.name}: ${countryData} acessos` : `${geo.properties.name}: 0 acessos`);
                        }}
                        onMouseLeave={() => setTooltipContent("")}
                        style={{
                          default: { outline: "none" },
                          hover: { fill: "#cc331f", outline: "none" },
                          pressed: { fill: "#E42", outline: "none" }
                        }}
                      />
                    );
                  })
                }
              </Geographies>
            </ComposableMap>
            {tooltipContent && <div className="tooltip">{tooltipContent}</div>}
            {selectedCountry && (
              <div className="modal">
                <h2>Acessos em {selectedCountry.country}</h2>
                <ul>
                  {selectedCountry.cidades.map((city, index) => (
                    <li key={index}>{city.nome}: {city.visitas} acessos</li>
                  ))}
                </ul>
                <button onClick={() => setSelectedCountry(null)}>Fechar</button>
              </div>
            )}
          </div>
          <div className="ds10-bar-chart">
            <div className="bar-chart-container country-chart">
              <Bar
                data={{
                  labels: Object.keys(mapData),
                  datasets: [
                    {
                      label: "Acessos por País",
                      data: Object.values(mapData),
                      backgroundColor: "#4f46e5",
                      borderRadius: 6,
                    },
                  ],
                }}
                options={{
                  indexAxis: 'y',
                  responsive: true,
                  scales: {
                    x: {
                      beginAtZero: true,
                    },
                  },
                }}
              />
            </div>
            {cityData.length > 0 && (
            <div className="bar-chart-container city-chart">
              <Bar
                data={{
                  labels: cityData.map(city => city.cidade),
                  datasets: [
                    {
                      label: "Acessos por Cidade",
                      data: cityData.map(city => city.total_visitas),
                      backgroundColor: "#22c55e",
                      borderRadius: 6,
                    },
                  ],
                }}
                options={{
                  indexAxis: 'y',
                  responsive: true,
                  maintainAspectRatio: false,
                  scales: {
                    x: { beginAtZero: true },
                  },
                }}
              />
            </div>
          )}


          </div>

          </div>



          {openModalId === "origem-acessos" && (
  <div className="dashboard3-modal">
    <div className="dashboard3-modal-content">
      <h2>🌍 Origem dos Acessos</h2>

      {/* Container do Mapa e Gráfico de Barras */}
      <div className="map-chart-container">
        <div className="container-bars-chart">
          {/* Gráfico de Barras - Exibe os acessos por cidade */}
          {cityData.length > 0 && (
            <div className="bar-chart-container-modal">
              <Bar
                data={{
                  labels: cityData.map(city => city.cidade),
                  datasets: [
                    {
                      label: "Acessos por Cidade",
                      data: cityData.map(city => city.total_visitas),
                      backgroundColor: "#22c55e",
                      borderRadius: 6,
                    },
                  ],
                }}
                options={{
                  indexAxis: 'y',
                  responsive: true,
                  maintainAspectRatio: false,
                  scales: {
                    x: { beginAtZero: true },
                  },
                }}
              />
            </div>
          )}

          {/* Gráfico de Barras - Exibe os acessos por país */}
          <div className="bar-chart-container-modal">
            <Bar
              data={{
                labels: Object.keys(mapData),
                datasets: [
                  {
                    label: "Acessos por País",
                    data: Object.values(mapData),
                    backgroundColor: "#4f46e5",
                    borderRadius: 6,
                  },
                ],
              }}
              options={{
                indexAxis: 'y',
                responsive: true,
                maintainAspectRatio: false,
                scales: {
                  x: { beginAtZero: true },
                },
              }}
            />
          </div>

        </div>
        


        {/* Mapa - Exibe os acessos por país */}
        <div className="map-container">
          <ComposableMap>
          <Geographies geography="/data/countries-110m.json">
                {({ geographies }) =>
                  geographies.map((geo) => {
                    const countryKey = countryNameMapping[geo.properties.name] || geo.properties.name; // Mapeia o nome correto
                    const countryData = mapData[countryKey];

                    return (
                      <Geography
                        key={geo.rsmKey}
                        geography={geo}
                        fill={countryData ? colorScale(countryData) : "#ccc"}
                        onMouseEnter={() => {
                          setTooltipContent(countryData ? `${geo.properties.name}: ${countryData} acessos` : `${geo.properties.name}: 0 acessos`);
                        }}
                        onMouseLeave={() => setTooltipContent("")}
                        style={{
                          default: { outline: "none" },
                          hover: { fill: "rgb(100, 231, 139)", outline: "none" },
                          pressed: { fill: "#E42", outline: "none" }
                        }}
                      />
                    );
                  })
                }
              </Geographies>
          </ComposableMap>
        </div>

      </div>

      {/* Botão de Fechar */}
      <button className="dashboard3-close-btn" onClick={handleCloseModal}>
        <span className="X"></span>
        <span className="Y"></span>
        <div className="close">Close</div>
      </button>
    </div>
  </div>
)}

      </div>
    </div>}
    </>
  );
};

export default Dashboard;