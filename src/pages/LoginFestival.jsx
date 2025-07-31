import React, { useState } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import "../styles/LoginFestival.css";
import { API_FESTIVAL } from "../services/api";
import { toast, ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

const LoginFestival = () => {
  const navigate = useNavigate();
  const [isLogin, setIsLogin] = useState(true);
  const [formData, setFormData] = useState({
    nome: "",
    email: "",
    cpf: "",
    confirmarCpf: "",
  });

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const toggleForm = () => {
    setIsLogin((prev) => !prev);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    try {
      if (isLogin) {
        const res = await axios.post(`${API_FESTIVAL}/api/inscricoes/login`, {
          email: formData.email,
          cpf: formData.cpf,
        });

        const id = res.data?.candidato?.id;
        if (!id) {
          return toast.error("ID do candidato não recebido.");
        }

        toast.success("Login realizado com sucesso!");
        localStorage.setItem("candidatoLogado", "true");
        localStorage.setItem("candidatoId", id);
        setTimeout(() => navigate("/areadocandidato"), 1000);

      } else {
        if (formData.cpf !== formData.confirmarCpf) {
          return toast.error("Os CPFs não coincidem.");
        }

        await axios.post(`${API_FESTIVAL}/api/inscricoes/cadastrar`, {
          nome: formData.nome,
          email: formData.email,
          cpf: formData.cpf,
        });

        toast.success("Cadastro realizado com sucesso!");
        setIsLogin(true);
      }
    } catch (error) {
      console.error("Erro ao fazer login:", error);
      toast.error(error.response?.data?.erro || "Erro na requisição.");
    }
  };

  return (
    <div className="login-festival-container">
      <div className="login-festival-content">
        <div className="left-column2">
          <img src="/img/loginjurados.png" alt="Imagem Festival Inscrições" />
        </div>
        <div className="right-column2">
          <div className="right-column-content">
            <h1>{isLogin ? "Login de Candidato" : "Cadastro de Candidato"}</h1>

            <form onSubmit={handleSubmit} className="login-form">
              {!isLogin && (
                <input
                  type="text"
                  name="nome"
                  placeholder="Nome completo"
                  required
                  value={formData.nome}
                  onChange={handleChange}
                />
              )}

              <input
                type="email"
                name="email"
                placeholder="E-mail"
                required
                value={formData.email}
                onChange={handleChange}
              />
              <input
                type="password"
                name="cpf"
                placeholder="CPF (será sua senha)"
                required
                value={formData.cpf}
                onChange={handleChange}
              />

              {!isLogin && (
                <input
                  type="password"
                  name="confirmarCpf"
                  placeholder="Confirmar CPF"
                  required
                  value={formData.confirmarCpf}
                  onChange={handleChange}
                />
              )}

              <button type="submit">{isLogin ? "Entrar" : "Registrar"}</button>
            </form>
          </div>
        </div>
      </div>

      

      <ToastContainer
        position="top-right"
        autoClose={3000}
        hideProgressBar={false}
        closeOnClick
        pauseOnHover
        theme="colored"
      />
    </div>
  );
};

export default LoginFestival;
