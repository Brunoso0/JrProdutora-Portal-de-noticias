import React from "react";

const FormularioInscricao = () => (
  <div className="formulario-inscricao">
    {/* Upload de foto */}
    <div className="foto-upload">
      <label htmlFor="foto" className="foto-upload-box">
        <img src="/img/icones/adicionar-foto.png" alt="Adicionar Foto" />
        <span>ADICIONAR FOTO</span>
      </label>
      <input type="file" id="foto" hidden />
    </div>

    {/* Formulário */}
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

      {/* Uploads de arquivos */}
      <div className="linha-dupla-inscricao upload-inscricao">
        <label className="label-inscricao">
          CÓPIA DE RG E CPF
          <span className="upload-botao">
            <img src="/img/icones/upload.png" alt="upload" />
            ADICIONAR ARQUIVO
          </span>
          <input type="file" hidden />
        </label>
        <label className="label-inscricao">
          CERTIDÃO MUNICIPAL
          <span className="upload-botao">
            <img src="/img/icones/upload.png" alt="upload" />
            ADICIONAR ARQUIVO
          </span>
          <input type="file" hidden />
        </label>
      </div>

      <div className="linha-dupla-inscricao upload-inscricao">
        <label className="label-inscricao">
          CERTIDÃO FEDERAL
          <span className="upload-botao">
            <img src="/img/icones/upload.png" alt="upload" />
            ADICIONAR ARQUIVO
          </span>
          <input type="file" hidden />
        </label>
        <label className="label-inscricao">
          COMPROVANTE DE RESIDÊNCIA
          <span className="upload-botao">
            <img src="/img/icones/upload.png" alt="upload" />
            ADICIONAR ARQUIVO
          </span>
          <input type="file" hidden />
        </label>
      </div>

      {/* Envio de vídeo */}
      <div className="upload-final-inscricao">
        <label htmlFor="video-upload" className="label-envio-video">
          <img src="/img/icones/upload.png" alt="Ícone de vídeo" />
          <span>ENVIAR VÍDEO DE APRESENTAÇÃO</span>
          <input type="file" id="video-upload" accept="video/*" hidden />
        </label>
      </div>
    </form>
  </div>
);

export default FormularioInscricao;
