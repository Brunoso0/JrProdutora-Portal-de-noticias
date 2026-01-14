import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import { API_VAGAS } from "../../services/api";
import "../styles/LoginVagas.css";

const LoginVagas = () => {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [senha, setSenha] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const response = await axios.post(`${API_VAGAS}/auth/login`, {
        email,
        senha,
      });

      const { token } = response.data || {};
      if (!token) {
        toast.error("Token não retornado pela API.");
        return;
      }

      localStorage.setItem("vagas_token", token);
      toast.success("Login realizado com sucesso!", { autoClose: 2000 });
      setTimeout(() => navigate("/jrprodutora/listar/all"), 400);
    } catch (error) {
      toast.error(
        error.response?.data?.message || "Erro ao processar login.",
        { autoClose: 3000 }
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="loginvagas-container">
      <ToastContainer />
      <div className="loginvagas-card">
        <div className="loginvagas-header">
          <h1>
            Acessar <b>Painel</b>
          </h1>
          <p>Informe suas credenciais para ver os candidatos.</p>
        </div>

        <form className="loginvagas-form" onSubmit={handleSubmit}>
          <label className="loginvagas-label">E-mail</label>
          <input
            type="email"
            name="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="exemplo@dominio.com"
            className="loginvagas-input"
            disabled={loading}
            required
          />

          <label className="loginvagas-label">Senha</label>
          <input
            type="password"
            name="senha"
            value={senha}
            onChange={(e) => setSenha(e.target.value)}
            placeholder="********"
            className="loginvagas-input"
            disabled={loading}
            required
          />

          <button
            type="submit"
            className="loginvagas-button"
            disabled={loading}
          >
            {loading ? "Entrando..." : "Entrar"}
          </button>
        </form>
      </div>
    </div>
  );
};

export default LoginVagas;
