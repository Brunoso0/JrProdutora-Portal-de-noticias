import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import axios from 'axios';
import '../styles/NewsGrid.css';

const NewsGrid = () => {
    const [destaques, setDestaques] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchDestaques = async () => {
            try {
                console.log("🔹 Buscando destaques...");
                const layoutResponse = await axios.get("http://localhost:5000/layout/news-layout");

                console.log("✅ Layout recebido:", layoutResponse.data);

                if (!layoutResponse.data || layoutResponse.data.length === 0) {
                    console.warn("⚠️ Nenhuma notícia foi encontrada no layout.");
                    setDestaques([]);
                    return;
                }

                const formattedNews = layoutResponse.data.map(item => {
                    let conteudo = item.conteudo ? JSON.parse(item.conteudo) : { blocks: [] };

                    return {
                        id: item.noticia_id,
                        slug: item.slug, // ✅ Usa diretamente o slug
                        titulo: getTitleFromContent(conteudo),
                        imageUrl: getFirstImageFromContent(conteudo),
                        categoria: item.categoria || "Sem categoria"
                    };
                });

                console.log("📝 Notícias formatadas:", formattedNews);

                setDestaques(formattedNews.slice(0, 5));
            } catch (error) {
                console.error("❌ Erro ao buscar destaques:", error);
            } finally {
                setLoading(false);
            }
        };

        fetchDestaques();
    }, []);

    const getTitleFromContent = (content) => {
        if (!content || !content.blocks) return "Sem título";
        const titleBlock = content.blocks.find((block) => block.type === "title" || block.type === "header");
        return titleBlock ? titleBlock.data.text : "Sem título";
    };

    const getFirstImageFromContent = (content) => {
        if (!content || !content.blocks) return "/img/placeholder.png";
        const imageBlock = content.blocks.find((block) => block.type === "image" && block.data && (block.data.file?.url || block.data.url));
        return imageBlock ? (imageBlock.data.file?.url || imageBlock.data.url) : "/img/placeholder.png";
    };

    return (
        <section className="news-grid">
            {loading ? (
                <>
                    <SkeletonMainArticle />
                    <div className="side-articles">
                        <SkeletonSideArticle />
                        <SkeletonSideArticle />
                        <SkeletonSideArticle />
                        <SkeletonSideArticle />
                    </div>
                </>
            ) : (
                <>
                    {destaques.length > 0 ? (
                        <>
                            <Link to={`/noticia/${destaques[0].slug}`} className="main-article">
                                <img src={destaques[0].imageUrl} alt={destaques[0].titulo} />
                                <div className="tag">{destaques[0].categoria}</div>
                                <h2 className="title">{destaques[0].titulo}</h2>
                            </Link>
                            <div className="side-articles">
                                {destaques.slice(1, 5).map((article, index) => (
                                    <Link to={`/noticia/${article.slug}`} className="article" key={index}>
                                        <img src={article.imageUrl} alt={article.titulo} />
                                        <div className="tag">{article.categoria}</div>
                                        <h3 className="title">{article.titulo}</h3>
                                    </Link>
                                ))}
                            </div>
                        </>
                    ) : (
                        <p>Nenhuma notícia encontrada.</p>
                    )}
                </>
            )}
        </section>
    );
};

// 🔹 Skeleton para a notícia principal
const SkeletonMainArticle = () => (
    <div className="skeleton-main-article">
        <div className="skeleton-image"></div>
        <div className="skeleton-tag"></div>
        <div className="skeleton-title"></div>
    </div>
);

// 🔹 Skeleton para as notícias laterais
const SkeletonSideArticle = () => (
    <div className="skeleton-article">
        <div className="skeleton-image"></div>
        <div className="skeleton-tag"></div>
        <div className="skeleton-title"></div>
    </div>
);

export default NewsGrid;
