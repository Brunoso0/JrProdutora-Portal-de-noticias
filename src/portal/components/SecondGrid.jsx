import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import axios from "axios";
import "../styles/SecondGrid.css";
import { API_BASE_URL } from '../../services/api'; // Importando o arquivo de configuração do Axios

const SecondGrid = () => {
    const [articles, setArticles] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchMostViewed = async () => {
            try {
                console.log("🔹 Buscando as 4 notícias mais vistas da semana...");
                const response = await axios.get(`${API_BASE_URL}/noticias/mais-vistas-semana`);
                
                console.log("✅ Notícias mais vistas recebidas:", response.data);
                setArticles(response.data);
            } catch (error) {
                console.error("❌ Erro ao buscar notícias mais vistas:", error);
            } finally {
                setLoading(false);
            }
        };

        fetchMostViewed();
    }, []);

    const handleClick = async (slug) => {
        try {
            await axios.post(`${API_BASE_URL}/noticias/view/${slug}`);
            console.log(`👁️ Visualização registrada para a notícia: ${slug}`);
        } catch (error) {
            console.error("❌ Erro ao registrar visualização:", error);
        }
    };

    return (
        <section className="second-grid">
            {loading ? (
                <p>Carregando notícias mais vistas...</p>
            ) : articles.length > 0 ? (
                articles.map((article, index) => (
                    <Link 
                        to={`/noticia/${article.slug}`} 
                        className="grid-item" 
                        key={index}
                        onClick={() => handleClick(article.slug)}
                    >
                        <div className="image-container">
                            <span className="tag_category_second">{article.categoria}</span>
                            <img src={article.imageUrl} alt={article.titulo} />
                        </div>
                        <h3 className="title_news_second">{article.titulo}</h3>
                    </Link>
                ))
            ) : (
                <p>Nenhuma notícia popular encontrada nesta semana.</p>
            )}
        </section>
    );
};

export default SecondGrid;
