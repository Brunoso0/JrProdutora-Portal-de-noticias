import React, { useState, useEffect } from "react";
import axios from "axios";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import MaskedInput from "react-text-mask";
import PrivacidadeModal from "../components/PrivacidadeModal.jsx";
import "../styles/CandidaturaVagasNew.css";

// Importando a URL do RH que você configurou no service/api.js
import { API_VAGAS } from "../../services/api.js";

// ID da JR Produtora = 1
const COMPANY_ID = 1; 

const MAX_FILE_SIZE = 20 * 1024 * 1024; // 20MB

const CandidaturaVagas = () => {
  const [selectedJob, setSelectedJob] = useState("");
  const [aceitouPrivacidade, setAceitouPrivacidade] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [vagas, setVagas] = useState([]);
  const [curriculo, setCurriculo] = useState(null);
  const [imagem, setImagem] = useState(null);
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);

  const [formData, setFormData] = useState({
    nome: "",
    email: "",
    telefone: "",
  });

  // --- BUSCA VAGAS DO BACKEND RH ---
  useEffect(() => {
    const fetchVagas = async () => {
      try {
        // Usa a nova rota pública filtrando pelo ID da Produtora (1)
        // Se API_VAGAS já vier com barra no final, ajuste aqui. Assumindo que vem sem barra.
        const response = await axios.get(`${API_VAGAS}/api/public/vacancies?companyId=${COMPANY_ID}`);
        setVagas(response.data);
      } catch (error) {
        console.error("Erro ao buscar vagas:", error);
        // Opcional: Não mostrar toast de erro se for apenas lista vazia, mas aqui mantemos para debug
        toast.error("Não foi possível carregar as vagas no momento.");
      }
    };
    fetchVagas();
  }, []);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const validateFile = (file) => {
    if (!file) return false;
    if (file.size > MAX_FILE_SIZE) {
      toast.error("O arquivo deve ter no máximo 20MB!", { position: "top-right", autoClose: 3000 });
      return false;
    }
    return true;
  };

  const handleFileChange = (e, setFile) => {
    if (!e.target.files || e.target.files.length === 0) return;
    const file = e.target.files[0];
    if (validateFile(file)) setFile(file);
  };

  const validateEmail = (email) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);

  const validatePhone = (phone) => {
    const numeroLimpo = phone.replace(/\D/g, "");
    return numeroLimpo.length >= 10;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const newErrors = {};

    if (!formData.nome.trim()) newErrors.nome = true;
    if (!formData.email || !validateEmail(formData.email)) newErrors.email = true;
    if (!validatePhone(formData.telefone)) newErrors.telefone = true;
    if (!selectedJob) newErrors.vaga = true;
    if (!curriculo) {
      newErrors.curriculo = true;
      toast.error("Por favor, envie seu currículo!", { position: "top-right" });
    }
    // Mantendo a lógica de foto obrigatória que estava no seu código original
    if (!imagem) newErrors.imagem = true; 
    
    if (!aceitouPrivacidade) {
      newErrors.privacidade = true;
      toast.error("Aceite os termos de privacidade.", { position: "top-right" });
    }

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    setErrors({});
    setLoading(true);

    const data = new FormData();
    data.append("nome", formData.nome);
    data.append("email", formData.email);
    data.append("telefone", formData.telefone);
    data.append("vaga_id", selectedJob);
    data.append("curriculo_pdf", curriculo);
    if (imagem) data.append("foto", imagem);

    try {
      // Envia para a rota pública de aplicação
      const response = await axios.post(`${API_VAGAS}/api/public/apply`, data, {
        headers: { "Content-Type": "multipart/form-data" },
      });

      if (response.status === 200 || response.status === 201) {
        toast.success("Cadastro enviado com sucesso!", { position: "top-right" });
        
        // Reset do formulário
        setFormData({ nome: "", email: "", telefone: "" });
        setSelectedJob("");
        setCurriculo(null);
        setImagem(null);
        setAceitouPrivacidade(false);
        
        // Limpa inputs de arquivo (opcional, mas recomendado)
        const curriculoInput = document.getElementById("curriculo-input");
        const fotoInput = document.getElementById("foto-input");
        if(curriculoInput) curriculoInput.value = "";
        if(fotoInput) fotoInput.value = "";
      }
    } catch (error) {
        if (error.response?.status === 409) {
            toast.warning(error.response.data.message || "Seus dados já constam em nosso banco.", { position: "top-right" });
        } else {
            console.error(error);
            toast.error("Erro ao processar sua candidatura. Tente novamente.", { position: "top-right" });
        }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="candidatura-container">
      <ToastContainer theme="dark" />
      
      <header className="candidatura-header">
        <div className="container-header">
          <div className="logo">
            JR<span>Produtora</span>
          </div>
        </div>
      </header>

      <main className="candidatura-main">
        <div className="candidatura-left-content">
          <div className="badge-contratando">Estamos Contratando</div>
          <h1 className="main-title">
            Construa o futuro<br />
            <span className="gradient-text">com a gente.</span>
          </h1>
          <p className="main-description">
            Estamos em busca de talentos que não têm medo de se desafiar. 
            Se você busca inovação e crescimento, seu lugar é aqui.
          </p>

          <div className="benefits-grid">
            <div className="benefit-card">
              <i className="fas fa-rocket"></i>
              <h3>Crescimento Rápido</h3>
              <p>Plano de carreira acelerado.</p>
            </div>
            <div className="benefit-card">
              <i className="fas fa-laptop-code"></i>
              <h3>Tecnologia de Ponta</h3>
              <p>Ferramentas mais modernas.</p>
            </div>
          </div>
        </div>

        <div className="candidatura-right-content">
          <div className="form-card">
            <div className="glow-effect"></div>
            
            <h2 className="form-title">
              <i className="far fa-paper-plane"></i> Envie seu Currículo
            </h2>

            <form className="candidatura-form" onSubmit={handleSubmit}>
              <div className="form-group">
                <label htmlFor="nome">Nome Completo</label>
                <div className="input-wrapper">
                  <i className="fas fa-user"></i>
                  <input
                    type="text"
                    id="nome"
                    name="nome"
                    value={formData.nome}
                    onChange={handleChange}
                    placeholder="João Silva"
                    className={errors.nome ? "input-error" : ""}
                    disabled={loading}
                  />
                </div>
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label htmlFor="email">Email</label>
                  <div className="input-wrapper">
                    <i className="fas fa-envelope"></i>
                    <input
                      type="email"
                      id="email"
                      name="email"
                      value={formData.email}
                      onChange={handleChange}
                      placeholder="voce@email.com"
                      className={errors.email ? "input-error" : ""}
                      disabled={loading}
                    />
                  </div>
                </div>

                <div className="form-group">
                  <label htmlFor="telefone">Telefone</label>
                  <div className="input-wrapper">
                    <i className="fas fa-phone"></i>
                    <MaskedInput
                      mask={["(", /[1-9]/, /\d/, ")", " ", /\d/, " ", /\d/, /\d/, /\d/, /\d/, "-", /\d/, /\d/, /\d/, /\d/]}
                      value={formData.telefone}
                      onChange={handleChange}
                      render={(ref, props) => (
                        <input
                          ref={ref}
                          {...props}
                          type="text"
                          name="telefone"
                          placeholder="(11) 91234-5678"
                          className={errors.telefone ? "input-error" : ""}
                          disabled={loading}
                        />
                      )}
                    />
                  </div>
                </div>
              </div>

              <div className="form-group">
                <label htmlFor="vaga">Vaga Desejada</label>
                <div className="input-wrapper">
                  <i className="fas fa-briefcase"></i>
                  <select
                    id="vaga"
                    value={selectedJob}
                    onChange={(e) => setSelectedJob(e.target.value)}
                    className={errors.vaga ? "input-error" : ""}
                    disabled={loading}
                  >
                    <option value="">Selecione uma Vaga...</option>
                    {vagas.length > 0 ? (
                      vagas.map((vaga) => (
                        // Importante: Backend novo retorna 'title', não 'titulo'
                        <option key={vaga.id} value={vaga.id}>{vaga.title}</option> 
                      ))
                    ) : (
                      <option disabled>Nenhuma vaga aberta no momento</option>
                    )}
                  </select>
                  <i className="fas fa-chevron-down select-arrow"></i>
                </div>
              </div>

              <div className="uploads-container">
                <div className="upload-group">
                  <label>Currículo (PDF ou DOCX)</label>
                  <label className={`upload-area ${errors.curriculo ? "error-border" : ""}`} htmlFor="curriculo-input">
                    <i className={curriculo ? "fas fa-check-circle icon-success" : "fas fa-file-pdf"}></i>
                    <span>{curriculo ? curriculo.name : "Clique para enviar currículo"}</span>
                    <input
                      type="file"
                      id="curriculo-input"
                      accept=".pdf,.doc,.docx"
                      onChange={(e) => handleFileChange(e, setCurriculo)}
                      disabled={loading}
                      style={{ display: "none" }}
                    />
                  </label>
                </div>

                <div className="upload-group">
                  <label>Foto de Perfil</label>
                  <label className={`upload-area ${errors.imagem ? "error-border" : ""}`} htmlFor="foto-input">
                    <i className={imagem ? "fas fa-check-circle icon-success" : "fas fa-camera"}></i>
                    <span>{imagem ? imagem.name : "Clique para enviar foto"}</span>
                    <input
                      type="file"
                      id="foto-input"
                      accept="image/*"
                      onChange={(e) => handleFileChange(e, setImagem)}
                      disabled={loading}
                      style={{ display: "none" }}
                    />
                  </label>
                </div>
              </div>

              <div className="terms-group">
                <input
                  type="checkbox"
                  id="termos"
                  checked={aceitouPrivacidade}
                  onChange={() => setAceitouPrivacidade(!aceitouPrivacidade)}
                  disabled={loading}
                />
                <label htmlFor="termos">
                  Li e aceito os{" "}
                  <span onClick={() => !loading && setShowModal(true)} className="terms-link">
                    termos de privacidade
                  </span>.
                </label>
              </div>

              <button type="submit" className="submit-button" disabled={loading}>
                <span>{loading ? "ENVIANDO..." : "ENVIAR CANDIDATURA"}</span>
                {!loading && <i className="fas fa-arrow-right"></i>}
              </button>
            </form>
          </div>
        </div>
      </main>

      {showModal && (
        <PrivacidadeModal
          onAccept={() => { setAceitouPrivacidade(true); setShowModal(false); }}
          onDecline={() => setShowModal(false)}
        />
      )}
    </div>
  );
};

export default CandidaturaVagas;