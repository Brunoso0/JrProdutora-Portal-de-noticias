import React, { useState } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import "../styles/LoginFestival.css";
import { API_FESTIVAL } from "../services/api";
import { toast, ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

const LoginJurados = () => {
  const navigate = useNavigate();
  const [isLogin, setIsLogin] = useState(true);
  const [formData, setFormData] = useState({
    nome: "",
    email: "",
    senha: "",
    confirmarSenha: "",
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
        const res = await axios.post(`${API_FESTIVAL}/api/jurados/login`, {
          email: formData.email,
          senha: formData.senha,
        });

        const { token, tipo, jurado } = res.data;

        if (!tipo || !jurado?.id) {
          toast.error("Informações do jurado não retornadas corretamente.");
          return;
        }

        localStorage.setItem("juradoLogado", "true");
        localStorage.setItem("tipoUsuario", tipo);
        localStorage.setItem("token", token);
        localStorage.setItem("jurado_id", jurado.id);

        toast.success("Login realizado com sucesso!");

        setTimeout(() => {
          if (tipo === "jurado") {
            navigate("/candidatosfestivaldemusica");
          } else if (tipo === "admin") {
            navigate("/painelcandidatos");
          } else {
            toast.error("Tipo de usuário inválido.");
          }
        }, 1000);

      } else {
        if (formData.senha !== formData.confirmarSenha) {
          return toast.error("As senhas não coincidem.");
        }

        await axios.post(`${API_FESTIVAL}/api/jurados/cadastrar`, {
          nome: formData.nome,
          email: formData.email,
          senha: formData.senha,
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
          <img src="/img/festival-inscricoes.png" alt="Imagem Festival Inscrições" />
        </div>
        <div className="right-column2">
          <div className="right-column-content">
            <h1>{isLogin ? "Login de Jurado/Admin" : "Cadastro de Jurado"}</h1>

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

      <ToastContainer position="top-center" autoClose={3000} />
    </div>
  );
};

export default LoginJurados;
