import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import axios from "axios";
import "../styles/ThirdGrid.css";

const truncateText = (text, maxLength) => {
  return text.length > maxLength ? text.substring(0, maxLength) + "..." : text;
};

const ThirdGrid = ({ link }) => {
    const [ultimasNoticias, setUltimasNoticias] = useState([]);
    const [noticiasRegiao, setNoticiasRegiao] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchNoticias = async () => {
            try {
                const ultimasRes = await axios.get("http://localhost:5000/noticias/ultimas");
                const regiaoRes = await axios.get("http://localhost:5000/noticias/regiao");

                setUltimasNoticias(ultimasRes.data);
                setNoticiasRegiao(regiaoRes.data);
            } catch (error) {
                console.error("Erro ao buscar notícias:", error);
            } finally {
                setLoading(false);
            }
        };

        fetchNoticias();
    }, []);

    const handleView = async (slug) => {
        try {
            await axios.post(`http://localhost:5000/noticias/view/${slug}`);
        } catch (error) {
            console.error("Erro ao contabilizar visualização:", error);
        }
    };

    return (
        <section className="third-grid">
            <div className="left-column">
                <div className="section-header2">
                    <h2>Últimas Notícias do Brasil e do Mundo</h2>
                    <a href="http://localhost:3000/admin">{link}</a>
                </div>
                {loading ? (
                    <p>Carregando notícias...</p>
                ) : (
                    ultimasNoticias.map((article, index) => (
                        <Link 
                            to={`/noticia/${article.slug}`} 
                            key={index} 
                            className="grid-item2"
                            onClick={() => handleView(article.slug)}
                        >
                            <div className="content">
                                <div className="tagdiv">
                                    <span className="tag">{article.categoria}</span>
                                </div>
                                <h3 className="title">{truncateText(article.conteudo.blocks.find(block => block.type === "title")?.data.text || "Sem título", 90)}</h3>
                                <p className="subtitle">{truncateText(article.conteudo.blocks.find(block => block.type === "paragraph")?.data.text || "Sem descrição", 190)}</p>
                            </div>
                            <div className="image-wrapper left-image">
                                <img src={article.conteudo.blocks.find(block => block.type === "image")?.data.file.url || "/img/placeholder.png"} alt={article.title} />
                            </div>
                        </Link>
                    ))
                )}
            </div>

            <div className="right-column">
                <div className="ad">
                    <Link to="/anuncio" className="ad-link">
                        <img src="/img/propaganda-2.jpg" alt="Ad" />
                    </Link>
                </div>
                <div className="section-header3">
                    <h2>Notícias da Região</h2>
                    <a href="http://localhost:3000/admin">{link}</a>
                </div>
                {loading ? (
                    <p>Carregando notícias...</p>
                ) : (
                    noticiasRegiao.map((article, index) => (
                        <Link 
                            to={`/noticia/${article.slug}`} 
                            key={index} 
                            className="grid-item2"
                            onClick={() => handleView(article.slug)}
                        >
                            <div className="image-wrapper right-image">
                                <img src={article.conteudo.blocks.find(block => block.type === "image")?.data.file.url || "/img/placeholder.png"} alt={article.title} />
                            </div>
                            <div className="content">
                                <div className="tagdiv">
                                    <span className="tag">{article.categoria}</span>
                                </div>
                                <h3 className="title">{truncateText(article.conteudo.blocks.find(block => block.type === "title")?.data.text || "Sem título", 60)}</h3>
                            </div>
                        </Link>
                    ))
                )}
            </div>
        </section>
    );
};

export default ThirdGrid;
