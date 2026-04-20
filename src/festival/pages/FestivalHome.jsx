import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import '../styles/FestivalHome.css';

const FestivalHome = () => {
  const navigate = useNavigate();
  const [quickSignupData, setQuickSignupData] = useState({
    name: '',
    email: ''
  });

  const handleQuickSignupChange = (event) => {
    const { name, value } = event.target;
    setQuickSignupData((current) => ({
      ...current,
      [name]: value
    }));
  };

  const handleQuickSignupSubmit = (event) => {
    event.preventDefault();

    navigate('/festival-forro/inscricao', {
      state: {
        prefillName: quickSignupData.name.trim(),
        prefillEmail: quickSignupData.email.trim()
      }
    });
  };

  return (
    <div className="festival-home-container">
      {/* Ribbons */}
      <div className="festival-home-ribbons">
        <div className="ribbon ribbon-1"></div>
        <div className="ribbon ribbon-2"></div>
        <div className="ribbon ribbon-3"></div>
        <div className="ribbon ribbon-4"></div>
        <div className="ribbon ribbon-5"></div>
      </div>

      {/* Header */}
      <header className="festival-home-header">
        <div className="logo-container">
          {/* Logo escondido caso exista imagem futuramente, por enquanto só texto */}
          <h1 className="festival-logo-text">Festival de Forró</h1>
        </div>
        <nav className="festival-home-nav">
          <Link to="/festival-forro" className="nav-link active">Início</Link>
          <Link to="/festival-forro/inscricao" className="nav-link">Inscrição</Link>
          {/* <a href="/festival-forro#contato" className="nav-link">Contato</a> */}
        </nav>
        <Link to="/login-candidato" className="btn-entrar">
          Entrar
        </Link>
      </header>

      {/* Hero Section */}
      <section className="festival-home-hero">
        <div className="hero-text-content">
          <span className="hero-tag">1ª EDIÇÃO • 2026</span>
          <h2 className="hero-title">
            <span className="text-green-dark">O Coração<br/>do </span>
            <span className="text-gold">Nordeste</span><br/>
            <span className="text-green-dark">Pulsando.</span>
          </h2>
          <p className="hero-description">
            Sinta a vibração da zabumba e o lamento da sanfona no maior encontro de tradição e alegria. Uma experiência única de imersão na cultura nordestina.
          </p>
          <div className="hero-buttons">
            <Link to="/festival-forro/inscricao" className="btn-inscreva">
              Inscreva-se Agora
            </Link>
            {/* <a href="#programacao" className="btn-programacao">
              Ver Programação
            </a> */}
          </div>
        </div>
      </section>

      {/* Nossa Essência Section */}
      <section className="festival-home-essencia">
        <div className="essencia-title-section">
          <h2>Nossa Essência</h2>
          <div className="title-underline"></div>
        </div>

        <div className="essencia-cards-container">
          {/* Card Esquerda */}
          <div className="essencia-card-main">
            <div className="card-main-decor"></div>
            
            <div className="card-main-content">
              <div className="icon-wrapper">
                {/* Music Note SVG */}
                <svg fill="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path d="M12 3v10.55c-.59-.34-1.27-.55-2-.55-2.21 0-4 1.79-4 4s1.79 4 4 4 4-1.79 4-4V7h4V3h-6z"/></svg>
              </div>
              <h3>Celebrando a Música Nordestina</h3>
              <p>
                O Festival de Forró nasceu para ser o guardião das nossas raízes. Do autêntico pé-de-serra às novas vertentes, celebramos o ritmo que é o DNA do povo brasileiro. Queremos conectar gerações através do abraço apertado e do passo sincronizado.
              </p>
            </div>
          </div>

          {/* Cards Direita */}
          <div className="essencia-cards-right">
            <div className="card-aulas">
              <h3>Aulas Gratuitas</h3>
              <p>
                Aprenda os primeiros passos do xote ao baião com mestres da dança.
              </p>
            </div>
            <div className="card-gastronomia">
              <h3>Gastronomia Regional</h3>
              <p>
                O sabor do Nordeste em cada detalhe, da tapioca ao mungunzá.
              </p>
            </div>
          </div>
        </div>
      </section>


      {/* Como Participar Section */}
      <section className="festival-home-participar">
        <div className="participar-container">
          
          {/* Esquerda: Steps */}
          <div className="participar-steps-col">
            <h2 className="participar-title">Como Participar</h2>
            <p className="participar-subtitle">
              A inscrição é simples e rápida. Garanta sua vaga no arraial mais esperado do ano.
            </p>

            <div className="participar-steps">
              {/* Step 1 */}
              <div className="step-item">
                <div className="step-number step-bg-green">1</div>
                <div className="step-content">
                  <h3>Verifique se você tem os requisitos necessários</h3>
                  <p>
                    Trabalhar diretamente com musica por um periodo acima de 2 anos.
                  </p>
                </div>
              </div>

              {/* Step 2 */}
              <div className="step-item">
                <div className="step-number step-bg-gold">2</div>
                <div className="step-content">
                  <h3>Preencha seus Dados</h3>
                  <p>
                    Informe seus dados básicos para realizar a sua inscrição.
                  </p>
                </div>
              </div>

              {/* Step 3 */}
              <div className="step-item">
                <div className="step-number step-bg-blue">3</div>
                <div className="step-content">
                  <h3>Confirme e Dance!</h3>
                  <p>
                    Após a inscrição, você receberá o acesso a area do candidato onde poderá saber tudo sobre a sua apresentação.
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Direita: Form */}
          <div className="participar-form-col">
            <div className="form-shadow-bg"></div>
            <div className="participar-form-container">
              <h3>Ficha de Inscrição</h3>
              
              <form className="inscricao-form" onSubmit={handleQuickSignupSubmit}>
                <div className="form-group">
                  <label>Nome Completo</label>
                  <input
                    type="text"
                    name="name"
                    value={quickSignupData.name}
                    onChange={handleQuickSignupChange}
                    placeholder="Seu nome aqui"
                    required
                  />
                </div>
                
                <div className="form-group">
                  <label>E-mail</label>
                  <input
                    type="email"
                    name="email"
                    value={quickSignupData.email}
                    onChange={handleQuickSignupChange}
                    placeholder="email@exemplo.com"
                    required
                  />
                </div>
                
                <div className="form-actions">
                  <button type="submit" className="btn-confirmar">
                    Confirmar Inscrição
                  </button>
                </div>
                
                <p className="form-terms">
                  Ao se inscrever, você concorda com nossos termos e políticas de privacidade.
                </p>
              </form>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="festival-home-footer">
        <div className="footer-content">
          <div className="footer-brand">
            <h3>Festival de Forró 2026</h3>
            <p>© 2026 JR Produtora - O CORAÇÃO DO NORDESTE BATE AQUI.</p>
          </div>
          
          <div className="footer-links">
            <a href="#">Termos de Uso</a>
            <a href="#">Privacidade</a>
            <a href="#">FAQ</a>
            <a href="#">Imprensa</a>
          </div>
          
          <div className="footer-social">
            {/* Share Icon */}
            <a href="#" className="social-icon">
              <svg fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z" /></svg>
            </a>
            {/* Calendar Icon */}
            <a href="#" className="social-icon">
              <svg fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
            </a>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default FestivalHome;
