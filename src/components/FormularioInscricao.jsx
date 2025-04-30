import React, { useState, useRef } from "react";
import axios from "axios";
import { API_FESTIVAL } from "../services/api";
import { toast } from "react-toastify";



// Funções de formatação
const formatarCPF = (valor) => {
  return valor
    .replace(/\D/g, "")
    .slice(0, 11)
    .replace(/(\d{3})(\d)/, "$1.$2")
    .replace(/(\d{3})(\d)/, "$1.$2")
    .replace(/(\d{3})(\d{1,2})$/, "$1-$2");
};

const formatarTelefone = (valor) => {
  return valor
    .replace(/\D/g, "")
    .slice(0, 11)
    .replace(/^(\d{2})(\d)/g, "($1) $2")
    .replace(/(\d{4})(\d)/, "$1-$2");
};

const formatarRG = (valor) => {
  return valor
    .replace(/\D/g, "")
    .slice(0, 9)
    .replace(/^(\d{2})(\d)/g, "$1.$2")
    .replace(/(\d{3})(\d)/g, "$1.$2")
    .replace(/(\d{3})(\d{1})$/, "$1-$2");
};

const FormularioInscricao = () => {
  const [arquivos, setArquivos] = useState({});
  const [arquivosSelecionados, setArquivosSelecionados] = useState({});
  const [cpf, setCPF] = useState("");
  const [telefone, setTelefone] = useState("");
  const [rg, setRG] = useState("");

  const formRef = useRef(null); // AQUI você declara a referência pro formulário


  const handleFileChange = (e) => {
    const file = e.target.files[0];
    const name = e.target.name;
  
    if (!file) return;
  
    // Validação por tipo de campo
    if ((name === "foto" || name.endsWith("_arquivo")) && name !== "letra_musica_arquivo") {
      if (!file.type.startsWith("image/")) {
        toast.error("Apenas imagens são permitidas neste campo.");
        return;
      }
    }
  
    if (name === "letra_musica_arquivo" && file.type !== "application/pdf") {
      toast.error("A letra da música deve estar em formato PDF.");
      return;
    }
  
    if (name === "video" && !file.type.startsWith("video/")) {
      toast.error("O vídeo deve estar em formato de vídeo válido.");
      return;
    }
  
    // Validação de tamanho (100MB máximo)
    if (file.size > 100 * 1024 * 1024) {
      toast.error("O arquivo deve ter no máximo 100MB.");
      return;
    }
  
    // Se passou pelas validações:
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

    data.append("nome", form.nome.value);
    data.append("nome_artistico", form.nome_artistico.value);
    data.append("telefone", telefone);
    data.append("email", form.email.value);
    data.append("endereco", form.endereco.value);
    data.append("rg", rg);
    data.append("cpf", cpf);
    data.append("musica", form.musica.value);
    data.append("atividade_profissional_musica", form.atividade_profissional_musica.value === "true");
    data.append("tempo_atividade", form.tempo_atividade?.value || "");
    data.append("faz_parte_grupo", form.faz_parte_grupo.value === "true");
    data.append("experiencia", form.experiencia.value);

    Object.entries(arquivos).forEach(([key, file]) => {
      if (file) data.append(key, file);
    });

    try {
      await axios.post(`${API_FESTIVAL}/api/inscricoes/inscrever`, data, {
        headers: { "Content-Type": "multipart/form-data" },
      });
    
      toast.success("Inscrição enviada com sucesso!");
    
      // Resetar formulário
      formRef.current.reset();
      setCPF("");
      setRG("");
      setTelefone("");
      setArquivos({});
      setArquivosSelecionados({});
    
    } catch (err) {
      console.error("Erro ao enviar inscrição:", err.response?.data || err.message);
      toast.error("Erro ao enviar inscrição.");
    }
    
  };

  const renderPreview = (name) => {
    return arquivosSelecionados[name] ? (
      <span className="nome-arquivo">
      {arquivosSelecionados[name].length > 10
        ? `${arquivosSelecionados[name].substring(0, 10)}...`
        : arquivosSelecionados[name]}
      </span>
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

      <form ref={formRef} className="form-inscricao-bonfim" onSubmit={handleSubmit}>
      <div className="linha-dupla-inscricao">
        <input type="text" name="nome" placeholder="NOME COMPLETO" className="input-inscricao nome-completo" />
        <input type="text" name="nome_artistico" placeholder="NOME ARTÍSTICO" className="input-inscricao nome-artistico" />
      </div>
        <div className="linha-dupla-inscricao">
          <input
            type="text"
            name="telefone"
            placeholder="CONTATO (WHATSAPP)"
            className="input-inscricao contato-whatsapp"
            value={telefone}
            onChange={(e) => setTelefone(formatarTelefone(e.target.value))}
          />
          <input type="email" name="email" placeholder="E-MAIL" className="input-inscricao email" />
        </div>

        <div className="linha-dupla-inscricao">
          <input
            type="text"
            name="rg"
            placeholder="RG"
            className="input-inscricao rg"
            value={rg}
            onChange={(e) => setRG(formatarRG(e.target.value))}
          />
          <input
            type="text"
            name="cpf"
            placeholder="CPF"
            className="input-inscricao cpf"
            value={cpf}
            onChange={(e) => setCPF(formatarCPF(e.target.value))}
          />
        </div>

        <input type="text" name="endereco" placeholder="ENDEREÇO" className="input-inscricao endereco" />


        <div className="linha-dupla-inscricao inscricao-selects">
          <input type="text" name="musica" placeholder="MÚSICA QUE PRETENDE CANTAR" className="input-inscricao musica-interesse" />
          <select name="atividade_profissional_musica" className="input-inscricao atividade-musical">
            <option value="">ATIVIDADE PROFISSIONAL COM A MÚSICA?</option>
            <option value="true">Sim</option>
            <option value="false">Não</option>
          </select>
        </div>

        <div className="linha-dupla-inscricao ">
          <select name="faz_parte_grupo" className="input-inscricao grupo-banda">
            <option value="">FAZ PARTE DE ALGUM GRUPO/BANDA?</option>
            <option value="true">Sim</option>
            <option value="false">Não</option>
          </select>
          <select name="experiencia" className="input-inscricao experiencia-musical">
            <option value="">QUAL SUA EXPERIÊNCIA COM MÚSICA?</option>
            <option value="0-2 anos">0 - 2 anos</option>
            <option value="2-4 anos">2 - 4 anos</option>
            <option value="5+ anos">5 anos ou mais</option>
          </select>
        </div>

        {/* Uploads */}
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
              ADICIONAR IMAGEM
            </span>
            <input id="foto"
            accept="image/*" type="file" name="rg_arquivo" hidden onChange={handleFileChange} />
            {renderPreview("rg_arquivo")}
          </label>

          <label className="label-inscricao">
            CÓPIA DO CPF
            <span className="upload-botao">
              <img src="/img/icones/upload.png" alt="upload" />
              ADICIONAR IMAGEM
            </span>
            <input id="foto"
            accept="image/*" type="file" name="cpf_arquivo" hidden onChange={handleFileChange} />
            {renderPreview("cpf_arquivo")}
          </label>

          <label className="label-inscricao">
            CERTIDÃO MUNICIPAL
            <span className="upload-botao">
              <img src="/img/icones/upload.png" alt="upload" />
              ADICIONAR IMAGEM
            </span>
            <input id="foto"
            accept="image/*" type="file" name="certidao_municipal_arquivo" hidden onChange={handleFileChange} />
            {renderPreview("certidao_municipal_arquivo")}
          </label>
        </div>

        <div className="linha-dupla-inscricao upload-inscricao">
          <label className="label-inscricao">
            CERTIDÃO FEDERAL
            <span className="upload-botao">
              <img src="/img/icones/upload.png" alt="upload" />
              ADICIONAR IMAGEM
            </span>
            <input id="foto"
            accept="image/*" type="file" name="certidao_federal_arquivo" hidden onChange={handleFileChange} />
            {renderPreview("certidao_federal_arquivo")}
          </label>

          <label className="label-inscricao">
            COMPROVANTE DE RESIDÊNCIA
            <span className="upload-botao">
              <img src="/img/icones/upload.png" alt="upload" />
              ADICIONAR IMAGEM
            </span>
            <input id="foto"
            accept="image/*" type="file" name="comprovante_residencia_arquivo" hidden onChange={handleFileChange} />
            {renderPreview("comprovante_residencia_arquivo")}
          </label>
        </div>

        <div className="linha-dupla-inscricao upload-inscricao">
          <label className="label-inscricao">
            ESPELHO DA CONTA BANCÁRIA
            <span className="upload-botao">
              <img src="/img/icones/upload.png" alt="upload" />
              ADICIONAR IMAGEM
            </span>
            <input type="file"
            id="foto"
            accept="image/*"
            name="espelho_conta_bancaria_arquivo" 
            hidden onChange={handleFileChange} />
            {renderPreview("espelho_conta_bancaria_arquivo")}
          </label>

          <label className="label-inscricao">
            ARQUIVO COM A LETRA DA MÚSICA
            <span className="upload-botao">
              <img src="/img/icones/upload.png" alt="upload" />
              ADICIONAR PDF
            </span>
            <input type="file" id="letra" accept=".pdf" name="letra_musica_arquivo" hidden onChange={handleFileChange} />
            {renderPreview("letra_musica_arquivo")}
          </label>
        </div>


        <div className="upload-final-inscricao">
          <label htmlFor="video-upload" className="label-envio-video">
            <img src="/img/icones/upload.png" alt="Ícone de vídeo" />
            <span>ENVIAR VÍDEO DE APRESENTAÇÃO</span>
            <input
              type="file"
              id="video-upload"
              name="video"
              accept="video/*"
              hidden
              onChange={handleFileChange}
            />

          </label>
          {renderPreview("video")}
        </div>

        <div className="botao-enviar-inscricao">
          <button type="submit" className="botao-enviar Btn">Enviar</button>
        </div>
      </form>
    </div>
  );
};

export default FormularioInscricao;
