import React from "react";
import "../styles/Header.css";

const Header = () => {
  return (
    <header className="header">
      <div className="menu">
        <button className="hamburger-menu">☰</button>
      </div>
      <div className="logo">
        <img src="/img/LOGO.png" alt="Logo" />
      </div>
      <div className="search-bar">
        <input type="text" placeholder="Buscar..." />
      </div>
    </header>
  );
};

export default Header;
