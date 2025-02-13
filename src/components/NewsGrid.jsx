import React from 'react';
import { Link } from 'react-router-dom';
import '../styles/NewsGrid.css';

const NewsGrid = () => {
    const mainArticle = {
        title: 'Robôs domésticos começam a ser adotados para tarefas diárias...',
        category: 'Robótica',
        image: '/img/image.png',
        slug: 'robos-domesticos',
    };

    const sideArticles = [
        {
            title: 'Novo Smartphone Projetor 3D...',
            category: 'Hologramas',
            image: '/img/holograma.png',
            slug: 'smartphone-projetor-3d',
        },
        {
            title: 'Tecnologia 6G chega às metrópoles...',
            category: 'Internet',
            image: '/img/6g.png',
            slug: 'tecnologia-6g',
        },
        {
            title: 'Empresa lança relógio inteligente...',
            category: 'Vestíveis',
            image: '/img/femea.png',
            slug: 'relogio-inteligente',
        },
        {
            title: 'Escolas adotam a tecnologia VR...',
            category: 'Realidade Virtual',
            image: '/img/oculos.png',
            slug: 'tecnologia-vr',
        },
    ];

    return (
        <section className="news-grid">
            <Link to={`/noticia/${mainArticle.slug}`} className="main-article">
                <img src={mainArticle.image} alt={mainArticle.title} />
                <div className="tag">{mainArticle.category}</div>
                <h2 className="title">{mainArticle.title}</h2>
            </Link>
            <div className="side-articles">
                {sideArticles.map((article, index) => (
                    <Link
                        to={`/noticia/${article.slug}`}
                        className="article"
                        key={index}
                    >
                        <img src={article.image} alt={article.title} />
                        <div className="tag">{article.category}</div>
                        <h3 className="title">{article.title}</h3>
                    </Link>
                ))}
            </div>
        </section>
    );
};

export default NewsGrid;
