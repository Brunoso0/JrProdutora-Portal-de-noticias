import React, { useEffect, useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import axios from 'axios';
import { User, Music, FileText, CheckCircle, UploadCloud, ChevronDown, Moon, Gift, Sparkles } from 'lucide-react';
import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import '../styles/FestivalInscricao.css';

const API_FESTIVAL = process.env.REACT_APP_API_FESTIVAL || 'http://localhost:3015';

const INITIAL_FORM = {
  name: '',
  email: '',
  cpf: '',
  artistic_name: '',
  address: '',
  rg: '',
  phone: '',
  song_name: '',
  experience_years: 2,
  is_group: false,
  bio: '',
  portfolio_url: ''
};

const FestivalInscricao = () => {
  const location = useLocation();
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState(INITIAL_FORM);
  const [portfolioFile, setPortfolioFile] = useState(null);

  useEffect(() => {
    window.scrollTo(0, 0);
  }, [location.key]);

  useEffect(() => {
    const prefillName = (location.state?.prefillName || '').trim();
    const prefillEmail = (location.state?.prefillEmail || '').trim();

    if (!prefillName && !prefillEmail) {
      return;
    }

    setFormData((current) => ({
      ...current,
      name: prefillName || current.name,
      email: prefillEmail || current.email
    }));
  }, [location.state]);

  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

  const formatCpf = (value) => {
    const digits = value.replace(/\D/g, '').slice(0, 11);
    if (digits.length <= 3) return digits;
    if (digits.length <= 6) return `${digits.slice(0, 3)}.${digits.slice(3)}`;
    if (digits.length <= 9) return `${digits.slice(0, 3)}.${digits.slice(3, 6)}.${digits.slice(6)}`;
    return `${digits.slice(0, 3)}.${digits.slice(3, 6)}.${digits.slice(6, 9)}-${digits.slice(9)}`;
  };

  const formatRg = (value) => {
    const digits = value.replace(/\D/g, '').slice(0, 10);
    if (digits.length <= 2) return digits;
    if (digits.length <= 5) return `${digits.slice(0, 2)}.${digits.slice(2)}`;
    if (digits.length <= 8) return `${digits.slice(0, 2)}.${digits.slice(2, 5)}-${digits.slice(5)}`;
    return `${digits.slice(0, 2)}.${digits.slice(2, 5)}-${digits.slice(5, 8)}-${digits.slice(8)}`;
  };

  const formatPhone = (value) => {
    const digits = value.replace(/\D/g, '').slice(0, 11);
    if (digits.length === 0) return '';
    if (digits.length <= 2) return `(${digits}`;
    if (digits.length === 3) return `(${digits.slice(0, 2)}) ${digits.slice(2)}`;
    if (digits.length <= 7) return `(${digits.slice(0, 2)}) ${digits.slice(2, 3)} ${digits.slice(3)}`;
    return `(${digits.slice(0, 2)}) ${digits.slice(2, 3)} ${digits.slice(3, 7)}-${digits.slice(7)}`;
  };

  const handleChange = (event) => {
    const { name, value, type, checked } = event.target;

    let nextValue = value;
    if (name === 'cpf') {
      nextValue = formatCpf(value);
    }
    if (name === 'rg') {
      nextValue = formatRg(value);
    }
    if (name === 'phone') {
      nextValue = formatPhone(value);
    }

    setFormData((current) => ({
      ...current,
      [name]: type === 'checkbox' ? checked : nextValue
    }));
  };

  const handlePortfolioFileChange = (event) => {
    const file = event.target.files && event.target.files[0] ? event.target.files[0] : null;
    setPortfolioFile(file);
  };

  const normalizeLinkRef = (link) => {
    const trimmed = (link || '').trim();
    if (!trimmed) return '';
    if (trimmed.startsWith('link:')) return trimmed;
    return `link:${trimmed}`;
  };

  const normalizeFileRef = (uploadData) => {
    const fromApi =
      uploadData?.fileReference ||
      (uploadData?.references && uploadData.references[0]) ||
      uploadData?.portfolio_pdf_ref ||
      uploadData?.file_ref ||
      uploadData?.path ||
      uploadData?.filePath ||
      uploadData?.file_url ||
      uploadData?.url ||
      '';

    if (!fromApi) return '';
    if (fromApi.startsWith('arquivo:')) return fromApi;
    return `arquivo:${fromApi}`;
  };

  const validateForm = () => {
    if (!formData.name.trim()) {
      return 'Nome é obrigatório.';
    }

    if (!emailRegex.test(formData.email.trim())) {
      return 'E-mail inválido.';
    }

    if (!formData.cpf.trim()) {
      return 'CPF é obrigatório.';
    }

    if (!formData.artistic_name.trim()) {
      return 'Nome artístico é obrigatório.';
    }

    const rgDigits = formData.rg.replace(/\D/g, '');
    if (rgDigits.length > 0 && rgDigits.length !== 9 && rgDigits.length !== 10) {
      return 'RG deve ter 9 ou 10 dígitos.';
    }

    if (Number(formData.experience_years) < 2) {
      return 'Tempo de experiência deve ser de no mínimo 2 anos.';
    }

    if (!formData.portfolio_url.trim() && !portfolioFile) {
      return 'Informe um link de portfólio ou envie um arquivo.';
    }

    return '';
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    const validationError = validateForm();
    if (validationError) {
      toast.error(validationError);
      return;
    }

    setIsSubmitting(true);

    try {
      let portfolioPdfRef = '';
      const portfolioUrlRef = normalizeLinkRef(formData.portfolio_url);

      if (portfolioFile) {
        const uploadFormData = new FormData();
        uploadFormData.append('file', portfolioFile);

        const isImage = portfolioFile.type.startsWith('image/') || /\.(jpg|jpeg|png|webp)$/i.test(portfolioFile.name);
        const endpoint = isImage ? '/api/uploads/imagens' : '/api/uploads/pdfs';

        const uploadResponse = await axios.post(
          `${API_FESTIVAL}${endpoint}`,
          uploadFormData,
          {
            headers: {
              'Content-Type': 'multipart/form-data'
            }
          }
        );

        const uploadData = uploadResponse.data;

        portfolioPdfRef = normalizeFileRef(uploadData);

        if (!portfolioPdfRef) {
          throw new Error('Upload realizado, mas a API não retornou a referência do arquivo.');
        }
      }

      const payload = {
        ...formData,
        cpf: formData.cpf.replace(/\D/g, ''),
        rg: formData.rg.replace(/\D/g, ''),
        phone: formData.phone.replace(/\D/g, ''),
        role: 'candidate',
        experience_years: Number(formData.experience_years),
        portfolio_url: portfolioUrlRef || undefined,
        portfolio_pdf_ref: portfolioPdfRef || undefined
      };

      const response = await fetch(`${API_FESTIVAL}/api/auth/register`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(payload)
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Não foi possível cadastrar o candidato.');
      }

      if (data.token) {
        localStorage.setItem('token', data.token);
      }

      if (data.user) {
        localStorage.setItem('user', JSON.stringify(data.user));
      }

      setFormData(INITIAL_FORM);
      setPortfolioFile(null);
      setIsSubmitted(true);
    } catch (error) {
      toast.error(error.message || 'Falha ao cadastrar candidato.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="festival-inscricao-page">
      <ToastContainer position="top-right" autoClose={4000} newestOnTop closeOnClick pauseOnHover theme="light" />

      {/* Elemento decorativo de fundo brilhante no header */}
      {!isSubmitted && <div className="festival-glow-bg"></div>}

      {!isSubmitted && (
        <header className="festival-header">
          <h1 className="festival-logo">Festival de Forró</h1>
          <nav className="festival-nav">
            <Link to="/festival-forro">Início</Link>
            <Link to="/festival-forro/inscricao" className="active">Inscrição</Link>
            {/* <a href="#contato">Contato</a> */}
          </nav>
          <Link to="/login-candidato" className="btn-entrar">Entrar</Link>
        </header>
      )}

      <main className="festival-main">
        {!isSubmitted ? (
          <div>
            <div className="festival-hero">
              <h2>Inscrição de <span className="talentos-text">Talentos</span></h2>
              <p className="hero-subtitle">
                Junte-se à maior celebração do Nordeste. Prepare sua sanfona, zabumba e triângulo. O palco do Festival de Forró espera por você.
              </p>
              <div className="decorative-dashes">
                <span className="dash-yellow"></span>
                <span className="dash-green"></span>
                <span className="dash-blue"></span>
              </div>
            </div>

            <form className="festival-form" onSubmit={handleSubmit}>
              {/* Card 1: Informações Pessoais */}
              <div className="form-section">
                <div className="festival-section-header">
                  <div className="icon-wrapper icon-green">
                    <User size={20} strokeWidth={2.5} />
                  </div>
                  <h3>Informações Pessoais</h3>
                </div>
                
                <div className="inputs-grid">
                  <div className="festival-input-group full-width">
                    <label>Nome completo</label>
                    <input
                      type="text"
                      name="name"
                      value={formData.name}
                      onChange={handleChange}
                      placeholder="Como no documento"
                      required
                    />
                  </div>
                  
                  <div className="festival-input-group full-width">
                    <label>Endereço</label>
                    <input
                      type="text"
                      name="address"
                      value={formData.address}
                      onChange={handleChange}
                      placeholder="Rua, Número, Bairro, Cidade - UF"
                    />
                  </div>
                  
                  <div className="input-pair">
                    <div className="festival-input-group">
                      <label>RG</label>
                      <input
                        type="text"
                        name="rg"
                        value={formData.rg}
                        onChange={handleChange}
                        placeholder="00.000-000-0 ou 00.000-000-00"
                        maxLength={13}
                      />
                    </div>
                    <div className="festival-input-group">
                      <label>CPF</label>
                      <input
                        type="text"
                        name="cpf"
                        value={formData.cpf}
                        onChange={handleChange}
                        placeholder="000.000.000-00"
                        maxLength={14}
                        required
                      />
                    </div>
                  </div>

                  <div className="input-pair">
                    <div className="festival-input-group">
                      <label>Telefone</label>
                      <input
                        type="text"
                        name="phone"
                        value={formData.phone}
                        onChange={handleChange}
                        placeholder="(74) 9 9592-1580"
                        maxLength={16}
                      />
                    </div>
                    <div className="festival-input-group error-state">
                      <label>Email</label>
                      <input
                        type="email"
                        name="email"
                        value={formData.email}
                        onChange={handleChange}
                        placeholder="seuemail@exemplo.com"
                        required
                      />
                    </div>
                  </div>

                </div>
              </div>

              {/* Card 2: Dados Artísticos */}
              <div className="form-section decorative-top">
                <div className="festival-section-header">
                  <div className="icon-wrapper icon-yellow">
                    <Music size={20} strokeWidth={2.5} />
                  </div>
                  <h3>Dados Artísticos</h3>
                </div>
                
                <div className="inputs-grid">
                  <div className="input-pair">
                    <div className="festival-input-group">
                      <label>Nome artístico</label>
                      <input
                        type="text"
                        name="artistic_name"
                        value={formData.artistic_name}
                        onChange={handleChange}
                        placeholder="Como você é conhecido(a)"
                        required
                      />
                    </div>
                    <div className="festival-input-group">
                      <label>Música que irá cantar</label>
                      <input
                        type="text"
                        name="song_name"
                        value={formData.song_name}
                        onChange={handleChange}
                        placeholder="Título da canção"
                      />
                    </div>
                  </div>
                  
                  <div className="input-pair align-end">
                    <div className="festival-input-group select-wrapper">
                      <label>Tempo de experiência</label>
                      <div className="select-container">
                        <select
                          required
                          name="experience_years"
                          value={String(formData.experience_years)}
                          onChange={handleChange}
                        >
                          <option value="2">2 anos</option>
                          <option value="3">3 anos</option>
                          <option value="4">4 anos</option>
                          <option value="5">5 anos</option>
                          <option value="6">6+ anos</option>
                        </select>
                        <ChevronDown size={16} className="select-icon"/>
                      </div>
                      <span className="hint-text">Requisito mínimo de 2 anos de atuação.</span>
                    </div>

                    <div className="festival-input-group radio-group-container">
                      <label>Faz parte de grupo ou banda?</label>
                      <div className="radio-group">
                        <label className="radio-label">
                          <input
                            type="radio"
                            name="is_group"
                            checked={formData.is_group === true}
                            onChange={() => setFormData((current) => ({ ...current, is_group: true }))}
                          />
                          <span className="radio-custom"></span> Sim
                        </label>
                        <label className="radio-label">
                          <input
                            type="radio"
                            name="is_group"
                            checked={formData.is_group === false}
                            onChange={() => setFormData((current) => ({ ...current, is_group: false }))}
                          />
                          <span className="radio-custom"></span> Não
                        </label>
                      </div>
                    </div>
                  </div>

                  <div className="festival-input-group full-width">
                    <label>Conte mais da sua experiência com a música</label>
                    <textarea
                      rows="4"
                      name="bio"
                      value={formData.bio}
                      onChange={handleChange}
                      placeholder="Fale sobre sua trajetória, influências e palcos por onde passou..."
                    ></textarea>
                  </div>
                </div>
              </div>

              {/* Card 3: Portfólio & Materiais */}
              <div className="form-section form-section-dashed">
                <div className="festival-section-header">
                  <div className="icon-wrapper icon-blue">
                    <FileText size={20} strokeWidth={2.5} />
                  </div>
                  <h3>Portfólio & Materiais</h3>
                </div>
                
                <div className="upload-box">
                  <UploadCloud size={44} className="upload-icon" />
                  <h4>Portfólio</h4>
                  <p>Obrigatório: envie um arquivo ou informe um link público com seu material.</p>
                  <div className="festival-input-group full-width">
                    <input
                      type="text"
                      name="portfolio_url"
                      value={formData.portfolio_url}
                      onChange={handleChange}
                      placeholder="https://..."
                    />
                  </div>
                  <label className="btn-upload">
                    Selecionar Arquivo
                    <input
                      type="file"
                      name="file"
                      accept=".pdf,.doc,.docx,.jpg,.jpeg,.png"
                      onChange={handlePortfolioFileChange}
                    />
                  </label>
                  {portfolioFile ? (
                    <span className="portfolio-file-name">Arquivo selecionado: {portfolioFile.name}</span>
                  ) : null}
                </div>
              </div>

              <div className="form-footer">
                <label className="checkbox-agreement">
                  <CheckCircle size={18} className="check-icon" />
                  Ao enviar, você concorda com o regulamento do festival.
                </label>
                <button type="submit" className="btn-submit" disabled={isSubmitting}>
                  {isSubmitting ? 'Enviando...' : 'Enviar Inscrição'}
                </button>
                <span className="hint-text">As inscrições encerram em 05 de Maio.</span>
              </div>
            </form>

            <div className="image-gallery">
              <div className="gallery-item">
                <img src="/img/cantora.png" alt="Cantora de forró" />
              </div>
              <div className="gallery-item">
                <img src="/img/vencedora.png" alt="Vencedora do festival" />
              </div>
              <div className="gallery-item">
                <img src="/img/cantor-forro.png" alt="Cantor de forró" />
              </div>
            </div>
          </div>
        ) : (
          <div className="success-state">
            {/* Background elements */}
            <div className="success-bg-elements">
              <div className="shape-diamond"></div>
              <Music className="shape-music-top" size={48} strokeWidth={1} />
              <Moon className="shape-moon" size={48} strokeWidth={1} />
              <Gift className="shape-gift" size={48} strokeWidth={1} />
              <div className="shape-floating-square-sm"></div>
              <div className="shape-floating-square-lg"></div>
              <Music className="shape-music-blue" size={24} />
            </div>

            <div className="success-content-wrapper">
              <div className="success-icon-wrapper">
                <div className="success-icon-box">
                  <CheckCircle size={40} className="success-icon-check" strokeWidth={3} />
                </div>
                <Sparkles className="success-sparkles" size={28} />
              </div>
              <h2 className="success-title">Inscrição Recebida!</h2>
              
              <div className="success-card">
                <p className="success-message">
                  Obrigado por se inscrever no <span className="text-green-bold">1º Festival de Forró</span>. Nossa equipe analisará seu portfólio e entrará em contato em breve.
                </p>

                <div className="info-box">
                  <div className="info-box-icon">
                    <User size={20} />
                  </div>
                  <div className="info-box-text">
                    <h4>Mantenha-se informado</h4>
                    <p>Acompanhe seu status através da <span className="highlight-text">Área do Candidato</span>.</p>
                  </div>
                </div>
              </div>

              <div className="success-actions">
                <Link to="/festival-forro" className="btn-home-action">
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m15 18-6-6 6-6"/></svg>
                  Voltar para Home
                </Link>
                <Link to="/login-candidato" className="btn-candidato-action">
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect width="7" height="9" x="3" y="3" rx="1"/><rect width="7" height="5" x="14" y="3" rx="1"/><rect width="7" height="9" x="14" y="12" rx="1"/><rect width="7" height="5" x="3" y="16" rx="1"/></svg>
                  Área do Candidato
                </Link>
              </div>
            </div>

            <div className="success-banner-bottom">
               <div className="banner-image-container">
                 <img src="https://images.unsplash.com/photo-1549429443-4dcfea2d9a60?w=400&q=80" alt="Luzes Decorativas" className="banner-image-lights" />
               </div>
               <div className="banner-content">
                  <div className="banner-icons">
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M4 5v14M8 5v14M12 5v14M16 5v14M20 5v14M4 12h16"/></svg>
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M3 12h3l3 -9l6 18l3 -9h3"/></svg>
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 2C9.5 2 8 4 8 6.5C8 8.8 11.5 11 12 11C12.5 11 16 8.8 16 6.5C16 4 14.5 2 12 2z" /><path d="M12 11V22" /><path d="M8 15h8" /></svg>
                  </div>
                  <div className="banner-text">
                    PREPARE SUA ZABUMBA • PREPARE SUA SANFONA • O FORRÓ TE ESPERA
                  </div>
               </div>
            </div>
          </div>
        )}
      </main>

      {!isSubmitted && (
        <footer className="festival-site-footer">
          <div className="footer-content">
            <div className="footer-left">
              <h3>Festival de Forró 2026</h3>
              <p>© 2026 JR Produtora - O CORAÇÃO DO NORDESTE BATE AQUI.</p>
            </div>
            <div className="footer-links">
              <a href="#termos">Termos de Uso</a>
              <a href="#privacidade">Privacidade</a>
              <a href="#faq">FAQ</a>
              <a href="#imprensa">Imprensa</a>
            </div>
            <div className="footer-socials">
              <button className="social-btn">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="18" cy="5" r="3"/><circle cx="6" cy="12" r="3"/><circle cx="18" cy="19" r="3"/><line x1="8.59" x2="15.42" y1="13.51" y2="17.49"/><line x1="15.41" x2="8.59" y1="6.51" y2="10.49"/></svg>
              </button>
              <button className="social-btn">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect width="18" height="18" x="3" y="3" rx="2" ry="2"/><circle cx="12" cy="13" r="4"/><path d="M16.5 7.5h.01"/></svg>
              </button>
            </div>
          </div>
        </footer>
      )}
    </div>
  );
};

export default FestivalInscricao;
