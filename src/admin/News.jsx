import React, { useState, useEffect } from "react";
import "../styles/News.css";

const News = () => {
  const [news, setNews] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // Função para buscar as notícias da nova rota
  const fetchNews = async () => {
    setLoading(true);
    setError(null);

    try {
      const response = await fetch("http://localhost:5000/news/scrape-news");
      const data = await response.json();

      if (data.success && data.articles) {
        setNews(data.articles);
      } else {
        throw new Error("Nenhuma notícia encontrada.");
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  // Busca as notícias ao carregar o componente
  useEffect(() => {
    fetchNews();
  }, []);

  return (
    <div className="news-container">
      <h1>Últimas Notícias no Brasil e no Mundo</h1>
      {loading && <p>Carregando...</p>}
      {error && <p className="error-message">Erro: {error}</p>}
      <div className="news-results">
        {news.length === 0 && !loading && <p>Nenhuma notícia encontrada.</p>}
        {news.map((article, index) => (
          <div key={index} className="news-item">
            <h3>{article.title}</h3>
            <a href={article.link} target="_blank" rel="noopener noreferrer">
              Leia mais
            </a>
          </div>
        ))}

      </div>
    </div>
  );
};

export default News;
