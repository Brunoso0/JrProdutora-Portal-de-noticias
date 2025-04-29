import React from "react";
import "../styles/LoginFestival.css";

const LoginFestival = () => {
  return (
    <div className="login-festival-container">
      <div className="login-festival-content">
        <div className="left-column2">
          <img src="/img/festival-inscricoes.png" alt="Imagem Festival Inscrições" />
        </div>
        <div className="right-column2">
          <div className="right-column-content">
            <h1>Login</h1>
            <form
              action="https://www.jrprodutora.com.br/festival/login"
              method="POST"
              className="login-form"
            >
              <input
                type="text"
                name="email"
                placeholder="E-mail"
                required
              />
              <input
                type="password"
                name="senha"
                placeholder="Senha"
                required
              />
              <button type="submit">Entrar</button>
            </form>
            <p className="signup-text">
              Não tem uma conta? <a href="/festival/cadastro">Cadastre-se</a>
            </p>
          </div>
        </div>
      </div>

      <footer className="footer-festival">
        <div className="cactus-img">
          <img
            src="/img/cacto-direita.png"
            className="cacto-direita"
            alt="Cacto à direita"
          />
          <img
            src="/img/cacto-esquerda.png"
            className="cacto-esquerda"
            alt="Cacto à esquerda"
          />
        </div>
        <div className="footer-festival-logo">
          <img
            src="/img/fundo-festival.png"
            alt="Decoração de corda no rodapé"
          />
        </div>
      </footer>
    </div>
  );
};

export default LoginFestival;
