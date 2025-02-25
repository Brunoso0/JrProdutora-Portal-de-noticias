import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import LoginLayout from "../layouts/LoginLayout"; // Importing LoginLayout
import "../styles/LoginPage.css";

const LoginPage = () => {
  const [isRightPanelActive, setIsRightPanelActive] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [error, setError] = useState("");

  const navigate = useNavigate();

  const handleSignUpClick = () => {
    setIsRightPanelActive(true);
  };

  const handleSignInClick = () => {
    setIsRightPanelActive(false);
  };

  const handleLogin = async (e) => {
    e.preventDefault();
    try {
        const response = await axios.post("http://localhost:5000/auth/login", {
            email,
            password,
        });

        const { token } = response.data;

        console.log("🔑 Token recebido:", token); // Deve mostrar um token válido
        localStorage.setItem("authToken", token);
        console.log("📝 Token armazenado:", localStorage.getItem("authToken")); // Deve mostrar o mesmo token

        navigate("/admin"); // Redireciona para a página de admin
    } catch (err) {
        setError(err.response?.data || "Erro ao fazer login");
    }
};


  

  const handleRegister = async (e) => {
    e.preventDefault();
    try {
      await axios.post("http://localhost:5000/auth/register", {
        name,
        email,
        password,
      });
      alert("Conta criada com sucesso! Faça login.");
      setIsRightPanelActive(false);
    } catch (err) {
      setError(err.response?.data || "Erro ao registrar");
    }
  };

  return (
    <LoginLayout>
      <div className="Login-body">

      
      <div
        className={`Login-container ${isRightPanelActive ? "Login-right-panel-active" : ""}`}
        id="container"
      >
        <div className="Login-form-container Login-sign-up-container">
          <form onSubmit={handleRegister}>
            <h1>Criar Conta</h1>
            <span>Insira seus Dados para Criar uma conta</span>
            <input
              type="text"
              placeholder="Name"
              value={name}
              onChange={(e) => setName(e.target.value)}
            />
            <input
              type="email"
              placeholder="Email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
            <input
              type="password"
              placeholder="Password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
            <button type="submit">Criar Conta</button>
          </form>
        </div>
        <div className="Login-form-container Login-sign-in-container">
          <form onSubmit={handleLogin}>
            <h1>Login</h1>
            <span>Insira seus dados para entrar na sua conta</span>
            <input
              type="email"
              placeholder="Email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
            <input
              type="password"
              placeholder="Password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
            <a href="http://localhost:3000/login">Esqueceu sua senha?</a>
            <button type="submit">Login</button>
            {error && <p className="Login-error">{error}</p>}
          </form>
        </div>
        <div className="Login-overlay-container">
          <div className="Login-overlay">
            <div className="Login-overlay-panel Login-overlay-left">
              <h1>Bem vindo de Volta!</h1>
              <p>Já possui uma conta? Clique abaixo e faça login agora mesmo!!</p>
              <button
                className="Login-ghost"
                onClick={handleSignInClick}
                id="signIn"
              >
                Login
              </button>
            </div>
            <div className="Login-overlay-panel Login-overlay-right">
              <h1>Bem Vindo!</h1>
              <p>Ainda não tem uma conta? Crie uma agora mesmo!!</p>
              <button
                className="Login-ghost"
                onClick={handleSignUpClick}
                id="signUp"
              >
                Criar conta
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
    </LoginLayout>
  );
};

export default LoginPage;
