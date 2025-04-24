import React, { useState } from "react";
import { apiFestival } from "../services/api"; // ou ajuste o caminho conforme sua estrutura


const FormularioInscricao = () => {
  const [arquivos, setArquivos] = useState({});

  const handleFileChange = (e) => {
    setArquivos((prev) => ({
      ...prev,
      [e.target.name]: e.target.files[0],
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const form = e.target;
    const data = new FormData();
  
    data.append("nome", form[0].value);
    data.append("nome_artistico", form[1].value);
    data.append("telefone", form[2].value);
    data.append("rg", form[4].value);
    data.append("cpf", form[5].value);
    data.append("musica", form[6].value);
    data.append("atividade_profissional_musica", form[3].value.toUpperCase() === "SIM");
    data.append("tempo_atividade", ""); // Se quiser adicionar depois
    data.append("faz_parte_grupo", form[7].value.toUpperCase() === "SIM");
    data.append("experiencia", form[8].value);
  
    Object.entries(arquivos).forEach(([key, file]) => {
      if (file) data.append(key, file);
    });
  
    try {
      await apiFestival.post("/api/inscricoes/inscrever", data);
      alert("Inscrição enviada com sucesso!");
    } catch (err) {
      alert("Erro ao enviar inscrição.");
      console.error(err);
    }
  };
  
  return (
    <div className="formulario-inscricao">
      {/* Upload de foto */}
      <div className="foto-upload">
        <label htmlFor="foto" className="foto-upload-box">
          <img src="/img/icones/adicionar-foto.png" alt="Adicionar Foto" />
          <span>ADICIONAR FOTO</span>
        </label>
        <input type="file" id="foto" name="foto" hidden onChange={handleFileChange} />
      </div>

      <form className="form-inscricao-bonfim" onSubmit={handleSubmit}>
        <input type="text" placeholder="NOME COMPLETO" className="input-inscricao nome-completo" />
        <input type="text" placeholder="NOME ARTÍSTICO" className="input-inscricao nome-artistico" />
        <input type="text" placeholder="CONTATO (WHATSAPP)" className="input-inscricao contato-whatsapp" />
        <input type="text" placeholder="DESENVOLVE ATIVIDADE PROFISSIONAL COM A MÚSICA?" className="input-inscricao atividade-musical" />

        <div className="linha-dupla-inscricao">
          <input type="text" placeholder="RG" className="input-inscricao rg" />
          <input type="text" placeholder="CPF" className="input-inscricao cpf" />
        </div>

        <div className="linha-dupla-inscricao">
          <input type="text" placeholder="MÚSICA QUE PRETENDE CANTAR" className="input-inscricao musica-interesse" />
          <input type="text" placeholder="FAZ PARTE DE ALGUM GRUPO/BANDA?" className="input-inscricao grupo-banda" />
        </div>

        <div className="linha-dupla-inscricao">
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
            <input type="file" name="rg_cpf_arquivo" hidden onChange={handleFileChange} />
          </label>
          <label className="label-inscricao">
            CERTIDÃO MUNICIPAL
            <span className="upload-botao">
              <img src="/img/icones/upload.png" alt="upload" />
              ADICIONAR ARQUIVO
            </span>
            <input type="file" name="certidao_municipal_arquivo" hidden onChange={handleFileChange} />
          </label>
        </div>

        <div className="linha-dupla-inscricao upload-inscricao">
          <label className="label-inscricao">
            CERTIDÃO FEDERAL
            <span className="upload-botao">
              <img src="/img/icones/upload.png" alt="upload" />
              ADICIONAR ARQUIVO
            </span>
            <input type="file" name="certidao_federal_arquivo" hidden onChange={handleFileChange} />
          </label>
          <label className="label-inscricao">
            COMPROVANTE DE RESIDÊNCIA
            <span className="upload-botao">
              <img src="/img/icones/upload.png" alt="upload" />
              ADICIONAR ARQUIVO
            </span>
            <input type="file" name="comprovante_residencia_arquivo" hidden onChange={handleFileChange} />
          </label>
        </div>

        <div className="linha-dupla-inscricao upload-inscricao">
          <label className="label-inscricao">
            ESPELHO DA CONTA BANCÁRIA
            <span className="upload-botao">
              <img src="/img/icones/upload.png" alt="upload" />
              ADICIONAR ARQUIVO
            </span>
            <input type="file" name="espelho_conta_bancaria_arquivo" hidden onChange={handleFileChange} />
          </label>
          <label className="label-inscricao">
            ARQUIVO COM A LETRA DA MÚSICA
            <span className="upload-botao">
              <img src="/img/icones/upload.png" alt="upload" />
              ADICIONAR ARQUIVO
            </span>
            <input type="file" name="letra_musica_arquivo" hidden onChange={handleFileChange} />
          </label>
        </div>

        {/* Envio de vídeo */}
        <div className="upload-final-inscricao">
          <label htmlFor="video-upload" className="label-envio-video">
            <img src="/img/icones/upload.png" alt="Ícone de vídeo" />
            <span>ENVIAR VÍDEO DE APRESENTAÇÃO</span>
            <input type="file" id="video-upload" name="video" accept="video/*" hidden onChange={handleFileChange} />
          </label>
        </div>

        {/* Botão de envio */}
        <div className="botao-enviar-inscricao">
          <button type="submit" className="botao-enviar Btn">
          </button>
        </div>
      </form>
    </div>
  );
};

export default FormularioInscricao;
