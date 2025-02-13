import React from 'react';
import { useParams } from 'react-router-dom';

const NoticiaPage = () => {
  const { slug } = useParams();

  // Substituir isso por uma chamada real ao backend, caso necessário
  const noticias = {
    'robos-domesticos': {
      title: 'Robôs domésticos começam a ser adotados para tarefas diárias...',
      content:
        'Os robôs domésticos estão revolucionando a maneira como realizamos tarefas diárias, trazendo conforto e eficiência.',
      image: '/img/image.png',
    },
    'smartphone-projetor-3d': {
      title: 'Novo Smartphone Projetor 3D...',
      content:
        'A nova tecnologia de projeção em smartphones promete transformar o entretenimento.',
      image: '/img/image.png',
    },
    'tecnologia-6g': {
      title: 'Tecnologia 6G chega às metrópoles...',
      content:
        'A nova geração da internet oferece velocidades ultrarrápidas e baixa latência.',
      image: '/img/image.png',
    },
    'relogio-inteligente': {
      title: 'Empresa lança relógio inteligente...',
      content:
        'Os relógios inteligentes estão ajudando na saúde mental com novos recursos.',
      image: '/img/image.png',
    },
    'tecnologia-vr': {
      title: 'Escolas adotam a tecnologia VR...',
      content:
        'A realidade virtual está revolucionando a maneira como os estudantes aprendem.',
      image: '/img/image.png',
    },
  };

  const noticia = noticias[slug];

  if (!noticia) {
    return <div>Notícia não encontrada</div>;
  }

  return (
    <div className="noticia-page">
      <img src={noticia.image} alt={noticia.title} style={{ width: '100%', borderRadius: '8px' }} />
      <h1>{noticia.title}</h1>
      <p>{noticia.content}</p>
    </div>
  );
};

export default NoticiaPage;
