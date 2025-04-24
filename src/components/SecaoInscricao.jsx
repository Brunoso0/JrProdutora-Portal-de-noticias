import FormularioInscricao from "./FormularioInscricao";

const SecaoInscricao = () => (
  <section className="secao-inscricao">
    <img src="/img/fundo-amarelo.png" alt="Fundo amarelo" className="fundo-costura" />
    
    <div className="conteudo-inscricao">
        <div className="titulo-inscricao">
          <img src="/img/inscrevase.png" alt="Título Inscreva-se" />
        </div>

        <div className="decoracao-direita">
          <img src="/img/balao.png" alt="Balão decorativo" />
        </div>

        <div className="decoracao-direita-baixo">
          <img src="/img/balao.png" alt="Balão decorativo" />
        </div>

        <div className="decoracao-esquerda">
          <img src="/img/balao.png" alt="Balão decorativo" />
        </div>

        <div className="decoracao-esquerda-baixo">
          <img src="/img/balao.png" alt="Balão decorativo" />
        </div>

        <FormularioInscricao />
    </div>
  </section>
);
export default SecaoInscricao;
