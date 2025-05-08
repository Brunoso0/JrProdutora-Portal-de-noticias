import React, { useState, useEffect } from "react";
import "../styles/ModalCandidato.css";
import { API_FESTIVAL } from "../services/api";
import { toast } from "react-toastify";
import axios from "axios";

const ModalCandidato = ({ candidato, onClose, onUpdate }) => {
  const [zoomImagem, setZoomImagem] = useState(null);
  const [etapas, setEtapas] = useState([]);

  useEffect(() => {
    const fetchEtapas = async () => {
      try {
        const res = await axios.get(`${API_FESTIVAL}/api/etapas/listar`);
        setEtapas(res.data);
      } catch (err) {
        toast.error("Erro ao carregar etapas.");
        console.error(err);
      }
    };
    fetchEtapas();
  }, []);

  if (!candidato) return null;

  const documentos = [
    { campo: "rg_arquivo", nome: "RG" },
    { campo: "cpf_arquivo", nome: "CPF" },
    { campo: "certidao_municipal_arquivo", nome: "Certidão Municipal" },
    { campo: "certidao_federal_arquivo", nome: "Certidão Federal" },
    { campo: "comprovante_residencia_arquivo", nome: "Comprovante de Residência" },
    { campo: "espelho_conta_bancaria_arquivo", nome: "Conta Bancária" },
    { campo: "letra_musica_arquivo", nome: "Letra da Música" },
  ];

  const handleAvancar = async () => {
    try {
      const res = await axios.put(`${API_FESTIVAL}/api/etapas/etapa/avancar/${candidato.id}`);
      toast.success("Candidato avançado para a próxima etapa!");
      if (onUpdate) onUpdate(); // logo após o toast.success
      onClose();
    } catch (err) {
      toast.error(err.response?.data?.erro || "Erro ao avançar etapa.");
    }
  };

  const handleRetroceder = async () => {
    try {
      const res = await axios.put(`${API_FESTIVAL}/api/etapas/etapa/retroceder/${candidato.id}`);
      toast.success("Candidato retornou para a etapa anterior.");
      if (onUpdate) onUpdate(); // logo após o toast.success
      onClose();
    } catch (err) {
      toast.error(err.response?.data?.erro || "Erro ao retroceder etapa.");
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
          <p><strong>Etapa Atual:</strong> {candidato.nome_etapa || "Não definida"}</p>
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

        {/* <div className="botoes-etapas">
          <button className="botao-etapa voltar" onClick={handleRetroceder}>
            ← Retroceder Etapa
          </button>
          <button className="botao-etapa avancar" onClick={handleAvancar}>
            Avançar Etapa →
          </button>
        </div> */}
      </div>

      {zoomImagem && (
        <div className="zoom-overlay" onClick={() => setZoomImagem(null)}>
          <img src={zoomImagem} className="zoom-imagem" alt="Documento ampliado" />
        </div>
      )}
    </div>
  );
};

export default ModalCandidato;
