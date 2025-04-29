import React, { useState } from "react";
import "../styles/ModalCandidato.css";
import { API_FESTIVAL } from "../services/api";
import { toast } from "react-toastify";
import axios from "axios";

const ModalCandidato = ({ candidato, onClose }) => {
  const [zoomImagem, setZoomImagem] = useState(null);
  const etapas = ["classificatoria", "classificado", "primeira_fase", "segunda_fase"];


  if (!candidato) return null; // ⬅ evita o erro

  const documentos = [
    { campo: "rg_arquivo", nome: "RG" },
    { campo: "cpf_arquivo", nome: "CPF" },
    { campo: "certidao_municipal_arquivo", nome: "Certidão Municipal" },
    { campo: "certidao_federal_arquivo", nome: "Certidão Federal" },
    { campo: "comprovante_residencia_arquivo", nome: "Comprovante de Residência" },
    { campo: "espelho_conta_bancaria_arquivo", nome: "Conta Bancária" },
    { campo: "letra_musica_arquivo", nome: "Letra da Música" },
    
  ];


  const handleSelecionar = async () => {
    try {
      // Encontrar próxima etapa pelo ID
      const etapaAtualIndex = etapas.findIndex((etapa) => etapa.id === candidato.etapa_id);
      const proximaEtapa = etapas[etapaAtualIndex + 1];
  
      if (!proximaEtapa) {
        toast.warn("Este candidato já está na última etapa.");
        return;
      }
  
      await axios.put(`${API_FESTIVAL}/api/inscricoes/atualizar-etapa/${candidato.id}`, {
        novaEtapaId: proximaEtapa.id,
      });
  
      toast.success("Etapa atualizada com sucesso!");
      onClose(); // fecha o modal
    } catch (error) {
      console.error("Erro ao atualizar etapa:", error);
      toast.error("Erro ao atualizar etapa.");
    }
  };
  
  

  return (
    <div className="modal-overlay">
      <div className="modal-candidato">
        <button className="fechar-modal" onClick={onClose}>✕</button>

        <div className="video-preview">
          {candidato.video ? (
            <video controls width="100%">
              <source src={`${API_FESTIVAL}/${candidato.video}`} type="video/mp4" />
              Seu navegador não suporta vídeo.
            </video>
          ) : (
            <p>Sem vídeo enviado.</p>
          )}
        </div>

        <div className="dados-candidato">
          <p><strong>Nome:</strong> {candidato.nome}</p>
          <p><strong>Nome Artístico:</strong> {candidato.nome_artistico}</p>
          <p><strong>CPF:</strong> {candidato.cpf}</p>
          <p><strong>RG:</strong> {candidato.rg}</p>
          <p><strong>Telefone:</strong> {candidato.telefone}</p>
          <p><strong>Música:</strong> {candidato.musica}</p>
          <p><strong>Endereço:</strong> {candidato.endereco}</p>
        </div>

        <h3>Documentos</h3>
        <div className="carrossel-documentos">
        {documentos.map((doc) => {
        const arquivo = candidato[doc.campo];
        if (!arquivo) return null;

        const isPDF = arquivo.endsWith(".pdf");

        return (
            <div className="item-documento" key={doc.campo}>
            {isPDF ? (
                <a
                href={`${API_FESTIVAL}/${arquivo}`}
                target="_blank"
                rel="noopener noreferrer"
                className="pdf-preview-link"
                >
                <img src="/img/icones/pdf-icon.png" alt="PDF" />
                </a>
            ) : (
                <img
                src={`${API_FESTIVAL}/${arquivo}`}
                alt={doc.nome}
                onClick={() => setZoomImagem(`${API_FESTIVAL}/${arquivo}`)}
                />
            )}
            <span>{doc.nome}</span>
            </div>
        );
        })}

        </div>

        <button className="botao-selecionar" onClick={handleSelecionar}>SELECIONAR</button>

      </div>

      {/* Modal de Zoom da Imagem */}
      {zoomImagem && (
        <div className="zoom-overlay" onClick={() => setZoomImagem(null)}>
          <img src={zoomImagem} className="zoom-imagem" alt="Documento ampliado" />
        </div>
      )}
    </div>
  );
};

export default ModalCandidato;
