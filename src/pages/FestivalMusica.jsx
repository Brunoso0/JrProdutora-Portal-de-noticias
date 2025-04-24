import React from "react";
import "../styles/FestivalMusica.css";

const FestivalMusica = () => {
  return (
    <div className="festival-container">
        <div className="textura-festival">
        <img src="/img/textura.png" alt="Textura do Festival" />
        </div>
      {/* Bandeirolas superiores */}
      <div className="bandeirolas-topo">
        <img src="/img/bandeirolas-vermelhas.png" alt="Bandeirolas Topo" />
      </div>

      {/* Bordas laterais */}
      <img src="/img/corda-esquerda.png" alt="Borda esquerda" className="borda-esquerda" />
      <img src="/img/corda-direita.png" alt="Borda direita" className="borda-direita" />

      {/* Conteúdo central */}
      <div className="conteudo-central">
        {/* Logo */}
        <div className="logo-festival">
          <img src="/img/logo-festival.png" alt="Logo Festival de Música" />
        </div>

        {/* Texto principal */}
        <div className="texto-arraia">
            <img src="/img/bandeirolas-texto.png" alt="bandeirolas do texto" />
          <h2 className="talento">SEU TALENTO</h2>
          <br /> 
          <h2 className="brilhar">Merece Brilhar</h2>
           <br />
           <h2 className="arraia">NO ARRAIÁ!</h2>
        </div>
      </div>

      {/* Conteudo central 2 */}
      <div  className="conteudo-central-2">
        <div className="datas-festival">
            <img src="/img/data.png" alt="" />
        </div>
        <div className="informativo-festival">
            <img src="/img/informativo.png" alt="" />
        </div>
      </div>

      {/* Bandeirolas inferiores */}
      <div className="bandeirolas-baixo">
        <img src="/img/bandeirolas-azuis.png" alt="Bandeirolas Inferior" />
      </div>

       {/* Inscrição */}

       <div className="inscricao-festival">
        {/* Fundo amarelo */}
        <div className="fundo-inscricao">
            <img src="/img/fundo-amarelo.png" alt="fundo amarelo" />
        </div>

        {/* Título Inscreva-se */}
        <div className="titulo-inscricao">
            <img src="/img/inscreva-se.png" alt="Inscreva-se" />
        </div>

        {/* Balão lateral */}
        <div className="balao-inscricao">
            <img src="/img/balao.png" alt="balão de inscrição" />
        </div>
        <div className="formulario-inscricao">
        <div className="foto-upload">
            <label htmlFor="foto">
            <img src="/img/icones/adicionar-foto.png" alt="Adicionar Foto" />
            <p>ADICIONAR FOTO</p>
            </label>
            <input type="file" id="foto" hidden />
        </div>

        <form className="form-inscricao-bonfim">
            <input type="text" placeholder="NOME COMPLETO" className="input-inscricao nome-completo" />
            <input type="text" placeholder="NOME ARTÍSTICO" className="input-inscricao nome-artistico" />
            <input type="text" placeholder="CONTATO (WHATSAPP)" className="input-inscricao contato-whatsapp" />
            <input type="text" placeholder="CÓPIA DE RG E CPF" className="input-inscricao copia-rg-cpf" />

            <div className="linha-dupla-inscricao">
                <input type="text" placeholder="RG" className="input-inscricao rg" />
                <input type="text" placeholder="CPF" className="input-inscricao cpf" />
            </div>

            <div className="linha-dupla-inscricao">
                <input type="text" placeholder="DESENVOLVE ATIVIDADE PROFISSIONAL COM A MÚSICA?" className="input-inscricao atividade-musical" />
                <input type="text" placeholder="MÚSICA QUE PRETENDE CANTAR" className="input-inscricao musica-interesse" />
            </div>

            <div className="linha-dupla-inscricao">
                <input type="text" placeholder="FAZ PARTE DE ALGUM GRUPO/BANDA?" className="input-inscricao grupo-banda" />
                <input type="text" placeholder="QUAL SUA EXPERIÊNCIA COM MÚSICA? FAVOR, DESCREVER!" className="input-inscricao experiencia-musical" />
            </div>

            <div className="linha-dupla-inscricao upload-inscricao">
                <label className="label-inscricao">
                CÓPIA DE RG E CPF
                <input type="file" className="input-inscricao arquivo-rg-cpf" />
                </label>
                <label className="label-inscricao">
                CERTIDÃO MUNICIPAL
                <input type="file" className="input-inscricao certidao-municipal" />
                </label>
            </div>

            <div className="linha-dupla-inscricao upload-inscricao">
                <label className="label-inscricao">
                CERTIDÃO FEDERAL
                <input type="file" className="input-inscricao certidao-federal" />
                </label>
                <label className="label-inscricao">
                COMPROVANTE DE RESIDÊNCIA
                <input type="file" className="input-inscricao comprovante-residencia" />
                </label>
            </div>

            <div className="upload-final-inscricao">
                <label className="label-inscricao-final">
                <input type="file" className="input-inscricao arquivo-final" />
                ADICIONAR ARQUIVO
                </label>
            </div>
            </form>

        </div>
        
        {/* Faixa inferior com logos */}
            <div className="rodape-inscricao">
                <img src="/img/prefeitura.png" alt="Selo Prefeitura" />
                <img src="/img/coracao.png" alt="Logo São João" />
            </div>

            {/* Cordas decorativas (separadas ou dentro do fundo) */}
            <div className="corda-baixo">
                <img src="/img/corda-baixo.png" alt="corda inferior" />
            </div>

            {/* Cactos nas laterais */}
            <div className="cacto-esquerda">
                <img src="/img/cacto-esquerda.png" alt="Cacto Esquerda" />
            </div>
            <div className="cacto-direita">
                <img src="/img/cacto-direita.png" alt="Cacto Direita" />
            </div>
            </div>

    </div>
  );
};

export default FestivalMusica;
