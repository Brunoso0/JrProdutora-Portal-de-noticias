import React, { useState } from "react";
import axios from "axios";
import { API_FESTIVAL } from "../services/api"; // ajuste conforme sua estrutura

const FormularioInscricao = () => {
  const [arquivos, setArquivos] = useState({});
  const [arquivosSelecionados, setArquivosSelecionados] = useState({});

    const handleFileChange = (e) => {
    const file = e.target.files[0];
    const name = e.target.name;
  
    if (file && file.size > 5 * 1024 * 1024) { // Limite de 5MB
      alert("O arquivo deve ter no máximo 5MB.");
      return;
    }
  
    setArquivos((prev) => ({
      ...prev,
      [name]: file,
    }));
  
    setArquivosSelecionados((prev) => ({
      ...prev,
      [name]: file?.name || "",
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
    data.append("tempo_atividade", "");
    data.append("faz_parte_grupo", form[7].value.toUpperCase() === "SIM");
    data.append("experiencia", form[8].value);
  
    Object.entries(arquivos).forEach(([key, file]) => {
      if (file) data.append(key, file);
    });
  
    // Log dos dados enviados
    for (let pair of data.entries()) {
      console.log(pair[0], pair[1]);
    }
  
    try {
      const response = await axios.post(`${API_FESTIVAL}/api/inscricoes/inscrever`, data, {
        headers: {
          "Content-Type": "multipart/form-data",
        },
      });
      console.log("Resposta do servidor:", response.data);
      alert("Inscrição enviada com sucesso!");
    } catch (err) {
      console.error("Erro ao enviar inscrição:", err.response?.data || err.message);
      alert("Erro ao enviar inscrição.");
    }
  };

  const renderPreview = (name) => {
    return arquivosSelecionados[name] ? (
      <span className="nome-arquivo">{arquivosSelecionados[name]}</span>
    ) : null;
  };

  return (
    <div className="formulario-inscricao">
      <div className="foto-upload">
        <label htmlFor="foto" className="foto-upload-box">
          {arquivos.foto ? (
            <img
              src={URL.createObjectURL(arquivos.foto)}
              alt="Prévia da foto"
              className="preview-foto-inscricao"
            />
          ) : (
            <>
              <img src="/img/icones/adicionar-foto.png" alt="Adicionar Foto" />
              <span>ADICIONAR FOTO</span>
            </>
          )}
        </label>
        <input
          type="file"
          id="foto"
          name="foto"
          accept="image/*"
          hidden
          onChange={handleFileChange}
        />
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

        {/* Uploads com preview */}
        <div className="linha-dupla-inscricao upload-inscricao">
        <label className="label-inscricao">
          <span style={{ display: "flex", alignItems: "center", gap: "5px" }}>
            CÓPIA DO RG
            <span className="tooltip-container">
              <span className="tooltip-icon">?</span>
              <span className="tooltip-text">Frente e verso do RG em uma única foto</span>
            </span>
          </span>

          <span className="upload-botao">
            <img src="/img/icones/upload.png" alt="upload" />
            ADICIONAR ARQUIVO
          </span>

          <input type="file" name="rg_arquivo" hidden onChange={handleFileChange} />
          {renderPreview("rg_arquivo")}
        </label>

          <label className="label-inscricao">
            CÓPIA DO CPF
            <span className="upload-botao">
              <img src="/img/icones/upload.png" alt="upload" />
              ADICIONAR ARQUIVO
            </span>
            <input type="file" name="cpf_arquivo" hidden onChange={handleFileChange} />
            {renderPreview("cpf_arquivo")}
          </label>

          <label className="label-inscricao">
            CERTIDÃO MUNICIPAL
            <span className="upload-botao">
              <img src="/img/icones/upload.png" alt="upload" />
              ADICIONAR ARQUIVO
            </span>
            <input type="file" name="certidao_municipal_arquivo" hidden onChange={handleFileChange} />
            {renderPreview("certidao_municipal_arquivo")}
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
            {renderPreview("certidao_federal_arquivo")}
          </label>
          <label className="label-inscricao">
            COMPROVANTE DE RESIDÊNCIA
            <span className="upload-botao">
              <img src="/img/icones/upload.png" alt="upload" />
              ADICIONAR ARQUIVO
            </span>
            <input type="file" name="comprovante_residencia_arquivo" hidden onChange={handleFileChange} />
            {renderPreview("comprovante_residencia_arquivo")}
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
            {renderPreview("espelho_conta_bancaria_arquivo")}
          </label>
          <label className="label-inscricao">
            ARQUIVO COM A LETRA DA MÚSICA
            <span className="upload-botao">
              <img src="/img/icones/upload.png" alt="upload" />
              ADICIONAR ARQUIVO
            </span>
            <input type="file" name="letra_musica_arquivo" hidden onChange={handleFileChange} />
            {renderPreview("letra_musica_arquivo")}
          </label>
        </div>

        {/* Upload do vídeo com preview */}
        <div className="upload-final-inscricao">
          <label htmlFor="video-upload" className="label-envio-video">
            <img src="/img/icones/upload.png" alt="Ícone de vídeo" />
            <span>ENVIAR VÍDEO DE APRESENTAÇÃO</span>
            <input type="file" id="video-upload" name="video" accept="video/*" hidden onChange={handleFileChange} />
          </label>
          {renderPreview("video")}
        </div>

        {/* Botão de envio */}
        <div className="botao-enviar-inscricao">
          <button type="submit" className="botao-enviar Btn">
            Enviar
          </button>
        </div>
      </form>
    </div>
  );
};

export default FormularioInscricao;
