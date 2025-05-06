import React, { useState } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import "../styles/LoginFestival.css";
import { API_FESTIVAL } from "../services/api";

const LoginFestival = () => {
  const navigate = useNavigate();
  const [isLogin, setIsLogin] = useState(true);
  const [formData, setFormData] = useState({
    nome: "",
    email: "",
    senha: "",
    confirmarSenha: "",
    tipoUsuario: "", // candidato ou jurado
  });

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const toggleForm = () => {
    setIsLogin((prev) => !prev);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!formData.tipoUsuario) {
      alert("Por favor, selecione se você é candidato ou jurado.");
      return;
    }

    try {
      if (isLogin) {
        const rota =
          formData.tipoUsuario === "jurado"
            ? "/api/jurados/login"
            : "/api/inscricoes/login";

        const payload =
          formData.tipoUsuario === "jurado"
            ? {
                email: formData.email,
                senha: formData.senha,
              }
            : {
                email: formData.email,
                cpf: formData.senha,
              };

        const res = await axios.post(`${API_FESTIVAL}${rota}`, payload);

        alert("Login realizado com sucesso!");

        if (formData.tipoUsuario === "jurado") {
          localStorage.setItem("juradoLogado", "true");
          navigate("/candidatosfestivaldemusica");
        } else {
          const id = res.data?.candidato?.id;
          if (!id) {
            return alert("ID do candidato não recebido.");
          }
          localStorage.setItem("candidatoLogado", "true");
          localStorage.setItem("candidatoId", id);
          navigate("/areadocandidato");
        }
      } else {
        if (formData.senha !== formData.confirmarSenha) {
          return alert("As senhas não coincidem.");
        }

        const res = await axios.post(`${API_FESTIVAL}/api/jurados/cadastrar`, {
          nome: formData.nome,
          email: formData.email,
          senha: formData.senha,
        });

        alert("Cadastro realizado com sucesso!");
        setIsLogin(true);
      }
    } catch (error) {
      console.error("Erro ao fazer login:", error);
      alert(error.response?.data?.erro || "Erro na requisição.");
    }
  };

  return (
    <div className="login-festival-container">
      <div className="login-festival-content">
        <div className="left-column2">
          <img src="/img/festival-inscricoes.png" alt="Imagem Festival Inscrições" />
        </div>
        <div className="right-column2">
          <div className="right-column-content">
            <h1>{isLogin ? "Login" : "Cadastro"}</h1>

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
                name="senha"
                placeholder="Senha"
                required
                value={formData.senha}
                onChange={handleChange}
              />

              {!isLogin && (
                <input
                  type="password"
                  name="confirmarSenha"
                  placeholder="Confirmar senha"
                  required
                  value={formData.confirmarSenha}
                  onChange={handleChange}
                />
              )}

              <select
                name="tipoUsuario"
                value={formData.tipoUsuario}
                onChange={handleChange}
                required
              >
                <option value="">Selecione seu tipo de acesso</option>
                <option value="candidato">Candidato</option>
                <option value="jurado">Jurado</option>
              </select>

              <button type="submit">{isLogin ? "Entrar" : "Registrar"}</button>
            </form>

            <p className="signup-text">
              {isLogin ? (
                <>
                  Não tem uma conta?{" "}
                  <button type="button" onClick={toggleForm} className="link-button">
                    Cadastre-se
                  </button>
                </>
              ) : (
                <>
                  Já tem uma conta?{" "}
                  <button type="button" onClick={toggleForm} className="link-button">
                    Fazer login
                  </button>
                </>
              )}
            </p>
          </div>
        </div>
      </div>

      <footer className="footer-festival">
        <div className="cactus-img">
          <img src="/img/cacto-direita.png" className="cacto-direita cacto-direita2" alt="Cacto à direita" />
          <img src="/img/cacto-esquerda.png" className="cacto-esquerda cacto-esquerda2" alt="Cacto à esquerda" />
        </div>
        <div className="footer-festival-logo">
          <img src="/img/fundo-festival.png" alt="Decoração de corda no rodapé" />
        </div>
      </footer>
    </div>
  );
};

export default LoginFestival;
