import React from "react";
import { Link } from "react-router-dom";
import "../styles/SecondGrid.css";

const SecondGrid = () => {
    const articles = [
        {
            title: 'Protótipo de veículo voador é apresentado...',
            category: 'Veículos',
            image: '/img/carrovoador.png',
            slug: 'protótipo-veículo-voador',
        },
        {
            title: 'Plataforma de videoconferência com hologramas...',
            category: 'Hologramas',
            image: '/img/muiesorrino.png',
            slug: 'videoconferencia-hologramas',
        },
        {
            title: 'Nova geração de consoles é lançada...',
            category: 'Realidade Virtual',
            image: '/img/pretodeoculos.png',
            slug: 'nova-geração-consoles',
        },
        {
            title: 'Internet via satélite alcança áreas remotas...',
            category: 'Internet',
            image: '/img/satelite.png',
            slug: 'internet-satelite',
        },
    ];

    return (
        <section className="second-grid">
            {articles.map((article, index) => (
                <Link to={`/noticia/${article.slug}`} className="grid-item" key={index}>
                    <div className="image-container">
                        <span className="tag">{article.category}</span>
                        <img src={article.image} alt={article.title} />
                    </div>
                    <h3 className="title">{article.title}</h3>
                </Link>
            ))}
        </section>
    );
};

export default SecondGrid;
