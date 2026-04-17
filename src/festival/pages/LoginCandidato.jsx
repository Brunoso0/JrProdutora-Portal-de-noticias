import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { Mail, Contact, ArrowRight, Music } from 'lucide-react';
import '../styles/LoginCandidato.css';

const LoginCandidato = () => {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    email: '',
    cpf: ''
  });
  const [errorMsg, setErrorMsg] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const API_FESTIVAL_BASE_URL = process.env.REACT_APP_API_FESTIVAL || 'http://localhost:3015';

  const handleChange = (e) => {
    let value = e.target.value;
    if (e.target.name === 'cpf') {
      value = value.replace(/\D/g, '').slice(0, 11);
      if (value.length > 3) value = `${value.slice(0, 3)}.${value.slice(3)}`;
      if (value.length > 7) value = `${value.slice(0, 7)}.${value.slice(7)}`;
      if (value.length > 11) value = `${value.slice(0, 11)}-${value.slice(11)}`;
    }
    setFormData({ ...formData, [e.target.name]: value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorMsg('');
    setIsLoading(true);

    try {
      const payload = {
        email: formData.email,
        password: formData.cpf
      };

      const response = await axios.post(`${API_FESTIVAL_BASE_URL}/api/auth/login`, payload);

      console.log('✅ Login Response:', response.data);
      if (response.data.token) {
        localStorage.setItem('token', response.data.token);
        localStorage.setItem('user', JSON.stringify(response.data.user));
        navigate('/area-candidato');
      }
    } catch (err) {
      setErrorMsg(err.response?.data?.message || 'Credenciais inválidas ou erro ao realizar login.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="login-candidato-page">
      {/* Background Shapes */}
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
          <p>Área do Candidato</p>
        </div>

        <div className="login-card">
          <form onSubmit={handleSubmit}>
            {errorMsg && (
              <div style={{ color: '#D93025', fontSize: '13px', textAlign: 'center', marginBottom: '16px', fontWeight: '500' }}>
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
              <label>CPF (Senha)</label>
              <div className="input-wrapper">
                <Contact size={18} className="input-icon" />
                <input 
                  type="text" 
                  name="cpf"
                  placeholder="000.000.000-00" 
                  value={formData.cpf}
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
              Ainda não se inscreveu para o festival?<br/>
              <Link to="/festival-forro/inscricao" className="link-signup">Faça sua inscrição aqui.</Link>
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

export default LoginCandidato;
