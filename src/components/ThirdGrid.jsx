import React from "react";
import { Link } from "react-router-dom";
import "../styles/ThirdGrid.css";

const truncateText = (text, maxLength) => {
  return text.length > maxLength ? text.substring(0, maxLength) + "..." : text;
};

const ThirdGrid = ({ link }) => {
  const leftArticles = [
    {
      title: 'Empresa surpreende o mundo ao anunciar um algoritmo capaz de prever eventos futuros com alta precisão.',
      subtitle: 'Em um avanço surpreendente da inteligência artificial, uma empresa anuncia o desenvolvimento de um algoritmo capaz de prever eventos futuros com notável precisão. Descubra como essa tecnologia está desafiando as fronteiras da previsão e quais são as implicações para diversas áreas, desde finanças até planejamento estratégico.',
      slug: 'algoritmo-previsor',
      category: 'Inteligência Artificial',
      image: '/img/pretadeoculos.png',
    },
    {
      title: 'Dispositivo portátil promete traduzir instantaneamente diferentes idiomas, facilitando a comunicação global.',
      subtitle: 'Em um mundo cada vez mais conectado, a comunicação sem fronteiras é essencial. Nesse contexto, um dispositivo portátil surge como um verdadeiro herói linguístico, prometendo quebrar as barreiras idiomáticas instantaneamente. Imagine poder se comunicar fluentemente em qualquer lugar do mundo, independentemente do idioma local.',
      slug: 'dispositivo-tradutor',
      category: 'Inteligência Artificial',
      image: '/img/pretoebranca.png',
    },
    {
      title: 'Criados para auxiliar idosos, robôs de companhia ganham popularidade, oferecendo suporte emocional e físico aos usuários.',
      subtitle: 'A tecnologia não só avança, mas também busca tornar a vida mais significativa para todas as gerações. No cenário atual, os robôs sociais, projetados especialmente para oferecer apoio e companhia aos idosos, estão ganhando destaque. Mais do que meros assistentes, esses robôs são programados para fornecer suporte emocional e físico, preenchendo lacunas nas necessidades de cuidado.',
      slug: 'robos-companhia',
      category: 'Inteligência Artificial',
      image: '/img/coto.png',
    },
    {
      title: 'Aplicativo utiliza inteligência artificial para ajudar usuários a manterem o foco e aumentarem a produtividade no dia a dia.',
      subtitle: 'No turbilhão da vida moderna, onde distrações são abundantes, um aplicativo inovador surge como um aliado indispensável para quem busca maior concentração e eficiência no cotidiano. Utilizando avançados algoritmos de inteligência artificial, este aplicativo promete mais do que simplesmente gerenciar tarefas; ele está programado para compreender os padrões de trabalho de cada usuário.',
      slug: 'app-produtividade',
      category: 'Inteligência Artificial',
      image: '/img/zara.png',
    },
  ];

  const rightArticles = [
    {
      title: 'Aplicativo de monitoramento ambiental ganha destaque, incentivando práticas ecológicas e promovendo a conscientização.',
      slug: 'monitoramento-ambiental',
      category: 'Software',
      image: '/img/celular.png',
    },
    {
      title: 'Óculos de realidade virtual com feedback tátil proporcionam uma experiência sensorial completa, imergindo usuários em ambientes digitais.',
      slug: 'oculos-vr',
      category: 'Realidade Virtual',
      image: '/img/vr.png',
    },
    {
      title: 'Surge uma nova moeda digital baseada em tecnologias sustentáveis, buscando minimizar o impacto ambiental associado à mineração de criptomoedas.',
      slug: 'moeda-digital',
      category: 'Criptomoedas',
      image: '/img/bitcoin.png',
    },
    {
      title: 'Empresas de e-commerce implementam frota de drones para entregas rápidas, transformando o cenário do comércio online.',
      slug: 'drones-comercio',
      category: 'Drones',
      image: '/img/drone.png',
    },
    {
      title: 'Tecnologia inovadora permite a impressão 3D de órgãos humanos, revolucionando a medicina e a lista de espera por transplantes.',
      slug: 'impressao-3d',
      category: 'Impressão 3D',
      image: '/img/pulmao.png',
    },
  ];

  return (
    <section className="third-grid">
      <div className="left-column">
      <div className="section-header2">
            <h2>Noticias do Mundo</h2>
            <a href="http://localhost:3000/admin">{link}</a>
        </div>
        {leftArticles.map((article, index) => (
          <Link to={`/noticia/${article.slug}`} key={index} className="grid-item2">
            <div className="content">
              <div className="tagdiv">
                <span className="tag">{article.category}</span>
              </div>
              <h3 className="title">{truncateText(article.title, 90)}</h3>
              <p className="subtitle">{truncateText(article.subtitle, 190)}</p>
            </div>
            <div className="image-wrapper left-image">
              <img src={article.image} alt={article.title} />
            </div>
          </Link>
        ))}
      </div>
      <div className="right-column">
        <div className="ad">
          <Link to="/anuncio" className="ad-link">
            <img src="/img/propaganda-2.jpg" alt="Ad" />
          </Link>
        </div>
        <div className="section-header3">
            <h2>Outras Noticias</h2>
            <a href="http://localhost:3000/admin">{link}</a>
        </div>
        {rightArticles.map((article, index) => (
          <Link to={`/noticia/${article.slug}`} key={index} className="grid-item2">
            <div className="image-wrapper right-image">
              <img src={article.image} alt={article.title} />
            </div>
            <div className="content">
            <div className="tagdiv">
                <span className="tag">{article.category}</span>
              </div>
              <h3 className="title">{truncateText(article.title, 60)}</h3>
            </div>
          </Link>
        ))}
      </div>
    </section>
  );
};

export default ThirdGrid;
