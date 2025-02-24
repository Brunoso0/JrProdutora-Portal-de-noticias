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

    const getTitle = (content) => {
        return content.blocks.find(block => block.type === "title" || block.type === "header")?.data.text || "Sem título";
    };

    const getSubtitle = (content) => {
        if (!content || !content.blocks) return "Sem descrição";

        let textBlock = content.blocks.find(block => 
            block.type === "paragraph" || block.type === "quote" || block.type === "list"
        );

        if (!textBlock) {
            textBlock = content.blocks.find(block => block.data?.text);
        }

        return textBlock ? textBlock.data.text : "Sem descrição";
    };

    const getImageUrl = (content) => {
        return content.blocks.find(block => block.type === "image")?.data.file.url || "/img/placeholder.png";
    };

    const renderNoticias = (noticias) => {
        return noticias.map((article, index) => (
            <React.Fragment key={index}>
                <Link 
                    to={`/noticia/${article.slug}`} 
                    className="grid-item2"
                    onClick={() => handleView(article.slug)}
                >
                    <div className="content">
                        <div className="tagdiv">
                            <span className="tag">{article.categoria}</span>
                        </div>
                        <h3 className="title">{truncateText(getTitle(article.conteudo), 90)}</h3>
                        <p className="subtitle" dangerouslySetInnerHTML={{ __html: truncateText(getSubtitle(article.conteudo), 190) }} />
                    </div>
                    <div className="image-wrapper left-image">
                        <img src={getImageUrl(article.conteudo)} alt={article.title} />
                    </div>
                </Link>

                {/* 🔹 INSERE UMA PROPAGANDA A CADA 5 NOTÍCIAS */}
                {(index + 1) % 5 === 0 && (
                    <div className="ad-container">
                        <Link to="/anuncio" className="ad-link">
                            <img src="/img/propaganda-3.jpg" alt="Anúncio" />
                        </Link>
                    </div>
                )}
            </React.Fragment>
        ));
    };

    return (
        <section className="third-grid">
            <div className="left-column">
                <div className="section-header2">
                    <h2>Últimas Notícias do Brasil e do Mundo</h2>
                    <a href="http://localhost:3000/admin">{link}</a>
                </div>
                {loading ? <p>Carregando notícias...</p> : renderNoticias(ultimasNoticias)}
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
                {loading ? <p>Carregando notícias...</p> : renderNoticias(noticiasRegiao)}
            </div>
        </section>
    );
};

export default ThirdGrid;
