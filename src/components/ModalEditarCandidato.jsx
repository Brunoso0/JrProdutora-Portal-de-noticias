import React, { useState, useEffect } from "react";
import axios from "axios";
import { API_FESTIVAL } from "../services/api";
import { toast } from "react-toastify";
import "../styles/ModalEditarCandidato.css";

const ModalEditarCandidato = ({ candidato, onClose, onUpdate, etapas }) => {
  const [formData, setFormData] = useState({
    nome: "",
    telefone: "",
    rg: "",
    cpf: "",
    etapa_id: "",
    foto: null,
    video: null,
  });

  useEffect(() => {
    if (candidato) {
      setFormData({
        nome: candidato.nome || "",
        telefone: candidato.telefone || "",
        rg: candidato.rg || "",
        cpf: candidato.cpf || "",
        etapa_id: candidato.etapa_id || "",
        foto: null,
        video: null,
      });
    }
  }, [candidato]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleFileChange = (e) => {
    const { name, files } = e.target;
    setFormData((prev) => ({ ...prev, [name]: files[0] }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
  
    const data = new FormData();
    data.append("nome", formData.nome);
    data.append("telefone", formData.telefone);
    data.append("rg", formData.rg);
    data.append("cpf", formData.cpf);
    data.append("etapa_id", formData.etapa_id);
  
    if (formData.foto) data.append("foto", formData.foto);
    if (formData.video) data.append("video", formData.video);
  
    // ✅ Documentos adicionais
    [
        "rg_arquivo",
        "cpf_arquivo",
        "comprovante_residencia_arquivo",
        "certidao_federal_arquivo",
        "certidao_municipal_arquivo",
        "espelho_conta_bancaria_arquivo",
        "letra_musica_arquivo"
      ].forEach((key) => {
        if (formData[key]) {
          data.append(key, formData[key]);
        }
      });
      
      
  
    try {
      await axios.put(`${API_FESTIVAL}/api/inscricoes/${candidato.id}`, data);
      toast.success("Dados atualizados com sucesso!");
      onClose();
      onUpdate(); // Atualiza a lista
    } catch (error) {
      console.error(error);
      toast.error("Erro ao atualizar candidato.");
    }
  };
  

  if (!candidato) return null;

  return (
    <div className="modal-editar-overlay">
      <div className="modal-editar-content">
        <h2>Editar Candidato</h2>

        {/* Preview da imagem atual ou nova */}
        <div style={{ textAlign: "center" }}>
          {formData.foto ? (
            <img
              src={URL.createObjectURL(formData.foto)}
              alt="Preview nova"
              style={{
                maxWidth: "100%",
                maxHeight: "200px",
                marginBottom: "1rem",
                borderRadius: "8px",
              }}
            />
          ) : candidato.foto ? (
            <img
              src={`${API_FESTIVAL}/${candidato.foto}`}
              alt="Foto atual"
              style={{
                maxWidth: "100%",
                maxHeight: "200px",
                marginBottom: "1rem",
                borderRadius: "8px",
              }}
            />
          ) : (
            <div style={{ marginBottom: "1rem", color: "#777" }}>
              Sem foto enviada
            </div>
          )}
        </div>

        <form onSubmit={handleSubmit} encType="multipart/form-data">
          <input
            type="text"
            name="nome"
            placeholder="Nome"
            value={formData.nome}
            onChange={handleChange}
            required
          />
          <input
            type="text"
            name="telefone"
            placeholder="Telefone"
            value={formData.telefone}
            onChange={handleChange}
          />
          <input
            type="text"
            name="rg"
            placeholder="RG"
            value={formData.rg}
            onChange={handleChange}
          />
          <input
            type="text"
            name="cpf"
            placeholder="CPF"
            value={formData.cpf}
            onChange={handleChange}
          />

          <select
            name="etapa_id"
            value={formData.etapa_id}
            onChange={handleChange}
            required
          >
            <option value="">Selecione a Etapa</option>
            {etapas.map((etapa) => (
              <option key={etapa.id} value={etapa.id}>
                {etapa.nome}
              </option>
            ))}
          </select>

          <label className="upload-label">Nova Foto (opcional)</label>
          <input
            type="file"
            name="foto"
            accept="image/*"
            onChange={handleFileChange}
          />

          <label className="upload-label">Novo Vídeo (opcional)</label>
          <input
            type="file"
            name="video"
            accept="video/*"
            onChange={handleFileChange}
          />

            <h3 style={{ marginTop: "1.5rem", fontSize: "1.1rem" }}>Documentos do Candidato</h3>

            <div className="documentos-grid">
            {[
                { nome: "RG", campo: "rg_arquivo" },
                { nome: "CPF", campo: "cpf_arquivo" },
                { nome: "Comprovante de Residência", campo: "comprovante_residencia_arquivo" },
                { nome: "Certidão Federal", campo: "certidao_federal_arquivo" },
                { nome: "Certidão Municipal", campo: "certidao_municipal_arquivo" },
                { nome: "Espelho Conta Bancária", campo: "espelho_conta_bancaria_arquivo" },
                { nome: "Letra da Música", campo: "letra_musica_arquivo" }
            ].map(({ nome, campo }) => {
                const enviado = !!candidato[campo];
                const caminho = enviado ? `${API_FESTIVAL}/${candidato[campo]}` : null;

                return (
                <div key={campo} className="caixa-documento">
                    <div className={`doc-status ${enviado ? "enviado" : "nao-enviado"}`}>
                    {enviado ? "✔️" : "❌"}
                    </div>
                    <span className="doc-label">{nome}</span>

                    {enviado ? (
                    <a
                        href={caminho}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="botao-ver-documento"
                    >
                        Ver documento
                    </a>
                    ) : (
                    <span className="doc-ausente">Não enviado</span>
                    )}

                    <input
                    type="file"
                    name={campo}
                    accept="image/*,application/pdf"
                    onChange={handleFileChange}
                    />
                </div>
                );
            })}
            </div>





          <div className="modal-buttons">
            <button type="button" className="btn-cancelar" onClick={onClose}>
              Cancelar
            </button>
            <button type="submit" className="btn-salvar">
              Salvar Alterações
            </button>
          </div>
          

        </form>
      </div>
    </div>
  );
};

export default ModalEditarCandidato;
