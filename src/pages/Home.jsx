import React from 'react';
import '../styles/Home.css';

const Home = () => {
    return (
        <div className="home">
            {/* Header */}
            <header className="header">
                <div className="menu-container">
                    <button className="menu-button">Menu</button>
                    <div className="logo">Logo</div>
                    <nav className="navigation">
                        <a href="#">Inteligência Artificial</a>
                        <a href="#">Blockchain</a>
                        <a href="#">Hologramas</a>
                        <a href="#">Internet</a>
                        <a href="#">Vestíveis</a>
                        <a href="#">Realidade Aumentada</a>
                        <a href="#">Realidade Virtual</a>
                    </nav>
                    <div className="search-container">
                        <input type="text" placeholder="Buscar" />
                    </div>
                </div>
            </header>

            {/* Destaque Principal */}
            <section className="highlight">
                <article className="main-article">
                    <img src="/images/robot.jpg" alt="Robot" />
                    <div className="article-content">
                        <span className="category">Robótica</span>
                        <h2>Robôs domésticos começam a ser adotados para tarefas diárias...</h2>
                    </div>
                </article>
                <div className="side-articles">
                    <article>
                        <img src="/images/hologram.jpg" alt="Hologram" />
                        <span className="category">Hologramas</span>
                        <h3>Novo Smartphone Projetor 3D chega ao mercado...</h3>
                    </article>
                    <article>
                        <img src="/images/internet.jpg" alt="6G Internet" />
                        <span className="category">Internet</span>
                        <h3>Tecnologia 6G chega às metrópoles brasileiras...</h3>
                    </article>
                    <article>
                        <img src="/images/wearable.jpg" alt="Wearable" />
                        <span className="category">Vestíveis</span>
                        <h3>Empresa lança relógio inteligente capaz de monitorar...</h3>
                    </article>
                    <article>
                        <img src="/images/vr.jpg" alt="Virtual Reality" />
                        <span className="category">Realidade Virtual</span>
                        <h3>Escolas adotam a tecnologia VR para proporcionar...</h3>
                    </article>
                </div>
            </section>

            {/* Mais lidas da semana */}
            <section className="weekly-highlights">
                <h2>Mais lidas da semana</h2>
                <div className="grid">
                    <article>
                        <img src="/images/car.jpg" alt="Flying Car" />
                        <span className="category">Veículos</span>
                        <h3>Protótipo de veículo voador é apresentado...</h3>
                    </article>
                    <article>
                        <img src="/images/hologram2.jpg" alt="Hologram" />
                        <span className="category">Hologramas</span>
                        <h3>Plataforma de videoconferência apresenta nova função...</h3>
                    </article>
                    <article>
                        <img src="/images/vr2.jpg" alt="Virtual Reality" />
                        <span className="category">Realidade Virtual</span>
                        <h3>Nova geração de consoles de videogame é lançada...</h3>
                    </article>
                    <article>
                        <img src="/images/satellite.jpg" alt="Satellite Internet" />
                        <span className="category">Internet</span>
                        <h3>Projeto busca oferecer internet de alta velocidade...</h3>
                    </article>
                </div>
            </section>

            {/* Destaques de Inteligência Artificial e Sidebar */}
            <section className="content">
                <div className="highlights">
                    <h2>Destaques de Inteligência Artificial</h2>
                    <article>
                        <h3>Empresa surpreende o mundo ao anunciar um algoritmo capaz de prever eventos futuros com alta precisão.</h3>
                        <p>
                            Em um avanço surpreendente da inteligência artificial, uma empresa anuncia o desenvolvimento de um algoritmo capaz de prever eventos futuros com notável precisão.
                        </p>
                    </article>
                    <article>
                        <h3>Dispositivo portátil promete traduzir instantaneamente diferentes idiomas, facilitando a comunicação global.</h3>
                        <p>
                            Em um mundo cada vez mais conectado, a comunicação sem fronteiras é essencial.
                        </p>
                    </article>
                </div>
                <aside className="sidebar">
                    <div className="ad-banner">
                        <img src="/images/ads.jpg" alt="Ad Banner" />
                    </div>
                    <div className="sidebar-news">
                        <h3>Mais populares</h3>
                        <ul>
                            <li><a href="#">Aplicativo de monitoramento ambiental ganha destaque...</a></li>
                            <li><a href="#">Óculos de realidade virtual com feedback tátil...</a></li>
                            <li><a href="#">Surge uma nova moeda digital baseada em tecnologias...</a></li>
                        </ul>
                    </div>
                </aside>
            </section>
        </div>
    );
};

export default Home;
