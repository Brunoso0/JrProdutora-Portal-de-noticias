import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { Mail, Lock, ArrowRight, Music } from 'lucide-react';
import '../styles/LoginJuradoAdmin.css';

const readTokenFromResponse = (response) => {
  const data = response?.data || {};
  const authHeader = response?.headers?.authorization || response?.headers?.Authorization;

  if (typeof data.token === 'string' && data.token.trim()) return data.token;
  if (typeof data.authToken === 'string' && data.authToken.trim()) return data.authToken;
  if (typeof data.accessToken === 'string' && data.accessToken.trim()) return data.accessToken;

  if (typeof authHeader === 'string' && authHeader.trim()) {
    return authHeader.replace(/^Bearer\s+/i, '').trim();
  }

  return '';
};

const LoginJuradoAdmin = () => {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    email: '',
    password: ''
  });
  const [errorMsg, setErrorMsg] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const API_FESTIVAL = process.env.API_FESTIVAL;

  const handleChange = (event) => {
    const { name, value } = event.target;
    setFormData((current) => ({
      ...current,
      [name]: value
    }));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setErrorMsg('');
    setIsLoading(true);

    try {
      const payload = {
        email: formData.email,
        password: formData.password
      };

      const response = await axios.post(`${API_FESTIVAL}/api/auth/login`, payload);
      const user = response?.data?.user || response?.data?.data?.user || null;
      const role = (user?.role || response?.data?.role || '').toString().toLowerCase();
      const token = readTokenFromResponse(response);

      if (role && role !== 'admin') {
        setErrorMsg('Acesso permitido apenas para administradores.');
        return;
      }

      if (!token) {
        setErrorMsg('Login confirmado no backend, mas o token não foi retornado para o frontend.');
        return;
      }

      localStorage.setItem('token', token);
      localStorage.setItem('festivalAdminToken', token);
      if (user) {
        localStorage.setItem('festivalAdminUser', JSON.stringify(user));
        localStorage.setItem('user', JSON.stringify(user));
      }
      navigate('/festival-forro/admin');
    } catch (error) {
      setErrorMsg(error.response?.data?.message || 'Credenciais inválidas ou erro ao realizar login.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="login-jurado-page">
      <div className="bg-shapes">
        <div className="shape shape-top-left-bg"></div>
        <div className="shape shape-top-left"></div>
        <div className="shape shape-bottom-right"></div>
      </div>

      <div className="login-container">
        <div className="login-header">
          <div className="icon-wrapper">
            <Music size={24} className="music-icon" fill="currentColor" />
          </div>
          <h1>Festival de Forró</h1>
          <p>Área Administrativa</p>
        </div>

        <div className="login-card">
          <form onSubmit={handleSubmit}>
            {errorMsg && (
              <div className="login-error-msg">
                {errorMsg}
              </div>
            )}

            <div className="input-group">
              <label>E-mail</label>
              <div className="input-wrapper">
                <Mail size={18} className="input-icon" />
                <input
                  type="email"
                  name="email"
                  placeholder="exemplo@email.com"
                  value={formData.email}
                  onChange={handleChange}
                  required
                />
              </div>
            </div>

            <div className="input-group">
              <label>Senha</label>
              <div className="input-wrapper">
                <Lock size={18} className="input-icon" />
                <input
                  type="password"
                  name="password"
                  placeholder="Digite sua senha"
                  value={formData.password}
                  onChange={handleChange}
                  required
                />
              </div>
            </div>

            <button type="submit" className="btn-entrar" disabled={isLoading}>
              {isLoading ? 'Entrando...' : (
                <>Entrar <ArrowRight size={18} /></>
              )}
            </button>

            <Link to="#" className="link-forgot-password">
              Esqueci minha senha
            </Link>

            <div className="divider"></div>

            <p className="signup-text">
              Você é candidato?<br />
              <Link to="/login-candidato" className="link-signup">Entrar na área do candidato.</Link>
            </p>
          </form>
        </div>

        <div className="pagination-dots">
          <span className="dot dot-yellow"></span>
          <span className="dot dot-green"></span>
          <span className="dot dot-blue"></span>
        </div>
      </div>

      <footer className="login-footer">
        © 2024 FESTIVAL DE FORRÓ - O CORAÇÃO DO NORDESTE
      </footer>
    </div>
  );
};

export default LoginJuradoAdmin;
