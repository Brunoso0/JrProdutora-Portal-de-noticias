import FormularioInscricao from "./FormularioInscricao";

const SecaoInscricao = () => {
  const imagens = [
    { src: "/img/fundo-amarelo.png", alt: "Fundo amarelo", className: "fundo-costura desktop-amarelo" },
    { src: "/img/fundo-amarelo-gigante.png", alt: "Fundo amarelo", className: "fundo-costura mobile-amarelo" },
    { src: "/img/fundo-amarelo-grande.png", alt: "Fundo amarelo", className: "fundo-costura tablet-amarelo" },
  ];

  const decoracoes = [
    { src: "/img/balao.png", alt: "Balão decorativo", className: "decoracao-direita" },
    { src: "/img/balao.png", alt: "Balão decorativo", className: "decoracao-direita-baixo" },
    { src: "/img/balao.png", alt: "Balão decorativo", className: "decoracao-esquerda" },
    { src: "/img/balao.png", alt: "Balão decorativo", className: "decoracao-esquerda-baixo" },
  ];

  return (
    <section className="secao-inscricao">
      {imagens.map((imagem, index) => (
        <img key={index} src={imagem.src} alt={imagem.alt} className={imagem.className} />
      ))}

      <div className="conteudo-inscricao">
        <div className="titulo-inscricao">
          <img src="/img/inscrevase.png" alt="Título Inscreva-se" />
        </div>

        {decoracoes.map((decoracao, index) => (
          <div key={index} className={decoracao.className}>
            <img src={decoracao.src} alt={decoracao.alt} />
          </div>
        ))}

        <FormularioInscricao />
      </div>
    </section>
  );
};
export default SecaoInscricao;
