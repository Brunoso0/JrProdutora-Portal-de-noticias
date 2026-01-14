import React, { useState, useEffect } from "react";
import axios from "axios";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import MaskedInput from "react-text-mask";
import Button from "../../shared/components/buttonCadastro";
import UploadField from "../components/UploadField.jsx";
import VagasSelect from "../components/VagasSelect.jsx";
import PrivacidadeModal from "../components/PrivacidadeModal.jsx";
import "../styles/CandidaturaVagas.css";

const API_VAGAS = "https://api.jrcoffee.com.br:5002/api";
const MAX_FILE_SIZE = 20 * 1024 * 1024; // 20MB em bytes

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

  // Busca as vagas ao montar o componente
  useEffect(() => {
    const fetchVagas = async () => {
      try {
        const response = await axios.get(`${API_VAGAS}/jrprodutora/vagas`);
        setVagas(response.data);
      } catch (error) {
        console.error("Erro ao buscar vagas:", error);
        toast.error("Erro ao carregar as vagas disponíveis", {
          position: "top-right",
          autoClose: 3000,
        });
      }
    };

    fetchVagas();
  }, []);

  // Atualiza o estado ao digitar nos campos
  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  // Valida o arquivo
  const validateFile = (file) => {
    if (!file) return false;
    if (file.size > MAX_FILE_SIZE) {
      toast.error("O arquivo deve ter no máximo 20MB!", {
        position: "top-right",
        autoClose: 3000,
      });
      return false;
    }
    return true;
  };

  // Atualiza os arquivos selecionados
  const handleFileChange = (e, setFile) => {
    if (!e.target.files || e.target.files.length === 0) {
      return;
    }

    const file = e.target.files[0];
    if (validateFile(file)) {
      setFile(file);
    }
  };

  // Manipula o arrastar e soltar arquivos
  const handleDrop = (e, setFile) => {
    e.preventDefault();
    const file = e.dataTransfer.files[0];

    if (validateFile(file)) {
      setFile(file);
    }
  };

  // Valida o email
  const validateEmail = (email) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };

  // Valida o telefone
  const validatePhone = (phone) => {
    const numeroLimpo = phone.replace(/\D/g, "");
    return numeroLimpo.length === 11;
  };

  // Envio do formulário
  const handleSubmit = async (e) => {
    e.preventDefault();

    const newErrors = {};

    // Validação de nome
    if (!formData.nome.trim()) {
      newErrors.nome = true;
    }

    // Validação de e-mail
    if (!formData.email) {
      newErrors.email = true;
    } else if (!validateEmail(formData.email)) {
      newErrors.email = true;
      toast.error("E-mail inválido! Certifique-se de que contém '@' e '.com'", {
        position: "top-right",
        autoClose: 3000,
      });
    }

    // Validação de telefone
    if (!validatePhone(formData.telefone)) {
      newErrors.telefone = true;
      toast.error("Número de telefone incorreto!", {
        position: "top-right",
        autoClose: 3000,
      });
    }

    // Validação da vaga
    if (!selectedJob) {
      newErrors.vaga = true;
    }

    // Validação do currículo
    if (!curriculo) {
      newErrors.curriculo = true;
      toast.error("Por favor, envie seu currículo em PDF!", {
        position: "top-right",
        autoClose: 3000,
      });
    }

    // Validação da imagem
    if (!imagem) {
      newErrors.imagem = true;
    }

    // Validação do checkbox de privacidade
    if (!aceitouPrivacidade) {
      newErrors.privacidade = true;
    }

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      toast.error("Preencha todos os campos obrigatórios!", {
        position: "top-right",
        autoClose: 3000,
      });
      return;
    }

    // Resetando erros antes do envio
    setErrors({});
    setLoading(true);

    const data = new FormData();
    data.append("nome", formData.nome);
    data.append("email", formData.email);
    data.append("telefone", formData.telefone);
    data.append("vaga_id", selectedJob);
    data.append("curriculo_pdf", curriculo);
    data.append("foto", imagem);

    try {
      const response = await axios.post(
        `${API_VAGAS}/jrprodutora/cadastro`,
        data,
        {
          headers: {
            "Content-Type": "multipart/form-data",
          },
        }
      );

      if (response.status === 200 || response.status === 201) {
        toast.success("Cadastro enviado com sucesso!", {
          position: "top-right",
          autoClose: 3000,
        });

        // Resetar campos após sucesso
        setFormData({ nome: "", email: "", telefone: "" });
        setSelectedJob("");
        setCurriculo(null);
        setImagem(null);
        setAceitouPrivacidade(false);
      }
    } catch (error) {
      if (error.response?.status === 409) {
        const errorData = error.response.data;
        if (errorData.error && errorData.error.includes("Duplicate entry")) {
          newErrors.email = true;
          setErrors(newErrors);
          toast.error("Este e-mail já foi utilizado em outra candidatura!", {
            position: "top-right",
            autoClose: 3000,
          });
          return;
        }
      }

      toast.error(
        error.response?.data?.message ||
          `Erro ao enviar os dados: ${error.message}`,
        {
          position: "top-right",
          autoClose: 3000,
        }
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="candidatura-container">
      <ToastContainer />
      <div className="candidatura-card">
        {/* Formulário */}
        <div className="candidatura-content">
          <h1>
            Trabalhe <b>CONOSCO</b>
          </h1>
          <form className="candidatura-form" onSubmit={handleSubmit}>
            {/* Nome */}
            <label className="candidatura-label">Nome</label>
            <input
              type="text"
              name="nome"
              value={formData.nome}
              onChange={handleChange}
              placeholder="Seu Nome"
              className={`candidatura-input ${
                errors.nome ? "input-error" : ""
              }`}
              required
              disabled={loading}
            />

            {/* E-mail */}
            <label className="candidatura-label">E-Mail</label>
            <input
              type="email"
              name="email"
              value={formData.email}
              onChange={handleChange}
              placeholder="Seu E-Mail"
              className={`candidatura-input ${
                errors.email ? "input-error" : ""
              }`}
              required
              disabled={loading}
            />
            <p className="email-hint">
              Atenção: Apenas um e-mail por pessoa, por favor não repetir
              e-mail.
            </p>

            {/* Número de Contato */}
            <label className="candidatura-label">Contato</label>
            <MaskedInput
              mask={[
                "(",
                /[1-9]/,
                /\d/,
                ")",
                " ",
                "9",
                " ",
                /\d/,
                /\d/,
                /\d/,
                /\d/,
                "-",
                /\d/,
                /\d/,
                /\d/,
                /\d/,
              ]}
              value={formData.telefone}
              onChange={handleChange}
              render={(ref, props) => (
                <input
                  ref={ref}
                  {...props}
                  type="text"
                  name="telefone"
                  placeholder="Seu Número"
                  className={`candidatura-input ${
                    errors.telefone ? "input-error" : ""
                  }`}
                  required
                  disabled={loading}
                />
              )}
            />

            {/* Seleção de Vagas */}
            <VagasSelect
              vagas={vagas}
              selectedJob={selectedJob}
              setSelectedJob={setSelectedJob}
              hasError={errors.vaga}
              disabled={loading}
            />

            {/* Upload de Arquivos */}
            <div className="candidatura-upload-section">
              <UploadField
                title="Envie seu Currículo"
                subtitle="Aceitamos apenas PDF"
                file={curriculo}
                accept=".pdf"
                inputId="curriculo-input"
                onFileChange={(e) => handleFileChange(e, setCurriculo)}
                onDrop={(e) => handleDrop(e, setCurriculo)}
                hasError={errors.curriculo}
                disabled={loading}
              />

              <UploadField
                title="Envie sua Foto"
                subtitle="jpg, webp, png, jpeg"
                file={imagem}
                accept="image/jpeg, image/png, image/webp"
                inputId="imagem-input"
                onFileChange={(e) => handleFileChange(e, setImagem)}
                onDrop={(e) => handleDrop(e, setImagem)}
                hasError={errors.imagem}
                disabled={loading}
              />
            </div>

            {/* Checkbox de Privacidade */}
            <div
              className={`candidatura-privacy-checkbox ${
                errors.privacidade ? "input-error" : ""
              }`}
            >
              <input
                type="checkbox"
                id="candidatura-privacy"
                className="cyberpunk-checkbox"
                checked={aceitouPrivacidade}
                onChange={() => setAceitouPrivacidade(!aceitouPrivacidade)}
                required
                disabled={loading}
              />

              <label htmlFor="candidatura-privacy">
                Declaro que li e aceito os{" "}
                <span
                  onClick={() => !loading && setShowModal(true)}
                  className="candidatura-privacy-link"
                  style={{
                    color: "red",
                    cursor: loading ? "not-allowed" : "pointer",
                    textDecoration: "underline",
                  }}
                >
                  termos de privacidade
                </span>
              </label>
            </div>

            {showModal && (
              <PrivacidadeModal
                onAccept={() => {
                  setAceitouPrivacidade(true);
                  setShowModal(false);
                }}
                onDecline={() => setShowModal(false)}
              />
            )}

            {/* Botão de Envio */}
            <div className="candidatura-button">
              <Button
                type="submit"
                className="candidatura-submit-button"
                disabled={loading}
              >
                {loading ? "Enviando..." : "Enviar"}
              </Button>
            </div>
          </form>
        </div>
      </div>

      {/* Rodapé */}
      <div className="candidatura-footer">
        <p>
          Estaremos aceitando currículos até o dia{" "}
          <b>31 de dezembro de 2024</b>
        </p>
      </div>
    </div>
  );
};

export default CandidaturaVagas;
