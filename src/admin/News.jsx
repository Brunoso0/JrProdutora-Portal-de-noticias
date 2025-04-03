import React, { useState, useEffect } from "react";
import "../styles/News.css";
import Loader from "../components/LoaderNewsWorld.jsx"; // 🔹 Importação correta
import { API_BASE_URL } from '../services/api'; // Importando o arquivo de configuração do Axios

const News = () => {
  const [news, setNews] = useState([]);
  const [loading, setLoading] = useState(true); // 🔹 Inicia como true para exibir o loader
  const [error, setError] = useState(null);
  const [selectedSource, setSelectedSource] = useState("all");

  // Função para buscar as notícias da API
  const fetchNews = async () => {
    setLoading(true);
    setError(null);

    try {
      const response = await fetch(`${API_BASE_URL}/news/scrape-news`);
      const data = await response.json();

      if (data.success && data.articles) {
        setNews(data.articles);
      } else {
        throw new Error("Nenhuma notícia encontrada.");
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setTimeout(() => setLoading(false), 1000); // 🔹 Garante o loader por +1s
    }
  };

  // Busca as notícias ao carregar o componente
  useEffect(() => {
    fetchNews();
  }, []);

  // Obtendo todas as fontes disponíveis para exibição no seletor
  const sources = [...new Set(news.map(article => article.source))];

  // Filtrando as notícias conforme a escolha do usuário
  const filteredNews = selectedSource === "all"
    ? news
    : news.filter(article => article.source === selectedSource);

  return (
        <>
         {loading ? <Loader /> :<div className="news-container">
      <h1>Últimas Notícias no Brasil e no Mundo</h1>

      {/* 🔹 Seletor de Sites */}
      <div className="news-filter">
        <label htmlFor="source-select">Filtrar por site:</label>
        <select
          id="source-select"
          value={selectedSource}
          onChange={(e) => setSelectedSource(e.target.value)}
        >
          <option value="all">Todos</option>
          {sources.map((source, index) => (
            <option key={index} value={source}>{source}</option>
          ))}
        </select>
      </div>

      {/* 🔹 Exibe o Loader enquanto carrega */}
          {error && <p className="error-message">Erro: {error}</p>}

          <div className="news-results">
            {filteredNews.length === 0 && !error && <p>Nenhuma notícia encontrada.</p>}
            {filteredNews.map((article, index) => (
              <div key={index} className="news-item">
                {article.image && <img src={article.image} alt={article.title} />}
                <h2>{article.title}</h2>
                <p><strong>Fonte:</strong> {article.source}</p>
                <a href={article.link} target="_blank" rel="noopener noreferrer">
                  Leia mais
                </a>
              </div>
            ))}
          </div>
      
    </div>}
        </>
  );
};

export default News;
