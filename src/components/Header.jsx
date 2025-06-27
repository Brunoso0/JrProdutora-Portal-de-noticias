import React, { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom"; // adiciona useNavigate
import axios from "axios";
import { API_BASE_URL } from "../services/api";
import "../styles/Header.css";


const Header = () => {
  const [menuOpen, setMenuOpen] = useState(false);
  const [categorias, setCategorias] = useState([]);
  const [submenu, setSubmenu] = useState("");
  const [searchTerm, setSearchTerm] = useState("");
  const navigate = useNavigate();


  useEffect(() => {
    const fetchCategorias = async () => {
      try {
        const res = await axios.get(`${API_BASE_URL}/noticias/categorias`);
        setCategorias(res.data);
      } catch (err) {
        console.error("Erro ao buscar categorias:", err);
      }
    };
    fetchCategorias();
  }, []);

  const handleClose = () => {
    setMenuOpen(false);
    setSubmenu("");
  };

  const handleSearch = async (e) => {
    e.preventDefault();
    try {
      const res = await axios.get(`${API_BASE_URL}/noticias/search/${searchTerm}`);
      localStorage.setItem("resultadoBusca", JSON.stringify(res.data));
      navigate("/ver-todos/busca");
    } catch (error) {
      console.error("Erro ao buscar notícias:", error);
    }
  };
  

  return (
    <div className="header-body">
    <header className="header">
      <div className="menu">
        <div className="menu-container">
          <div
            className={`hamburger ${menuOpen ? "active" : ""}`}
            onClick={() => {
              setMenuOpen(!menuOpen);
              setSubmenu("");
            }}
          >
            <span></span>
            <span></span>
            <span></span>
          </div>

          {menuOpen && (
            <div className="dropdown-menu-niveis">
              <ul className="menu-principal">
                <li onMouseEnter={() => setSubmenu("noticias")}>Notícias ▸</li>
                <li onMouseEnter={() => setSubmenu("categorias")}>Categorias ▸</li>
                <li onMouseEnter={() => setSubmenu("programas")}>Programas ▸</li>
              </ul>

              <ul className={`submenu ${submenu === "noticias" ? "show" : ""}`}>
                <li><Link to="/ver-todos/ultimas" onClick={handleClose}>Últimas Notícias</Link></li>
                <li><Link to="/ver-todos/semana" onClick={handleClose}>Notícias da Semana</Link></li>
                <li><Link to="/ver-todos/regiao" onClick={handleClose}>Notícias da Região</Link></li>
              </ul>

              <ul className={`submenu ${submenu === "categorias" ? "show" : ""}`}>
                {categorias.map((cat, i) => (
                  <li key={i}>
                    <Link to={`/ver-todos/${cat.nome}`} onClick={handleClose}>
                      {cat.nome}
                    </Link>
                  </li>
                ))}
              </ul>

              <ul className={`submenu ${submenu === "programas" ? "show" : ""}`}>
                <li>
                  <a
                    href="https://www.youtube.com/@jrprodutora"
                    target="_blank"
                    rel="noreferrer"
                    onClick={handleClose}
                  >
                    Café com Resenha
                  </a>
                </li>
                <li>
                  <a
                    href="https://www.youtube.com/@jrprodutora"
                    target="_blank"
                    rel="noreferrer"
                    onClick={handleClose}
                  >
                    JR Esportes
                  </a>
                </li>
                <li>
                  <a
                    href="https://www.youtube.com/@jrprodutora"
                    target="_blank"
                    rel="noreferrer"
                    onClick={handleClose}
                  >
                    JR Notícias
                  </a>
                </li>
              </ul>
            </div>
          )}
        </div>
      </div>

      <div className="logo">
        <Link to="/">
          <img src="/img/LOGO.png" alt="Logo" />
        </Link>
      </div>

      <div className="search-bar">
      <form className="form" onSubmit={handleSearch}>
  <button type="submit">
    <svg width={17} height={16} fill="none" xmlns="http://www.w3.org/2000/svg">
      <path
        d="M7.667 12.667A5.333 5.333 0 107.667 2a5.333 5.333 0 000 10.667zM14.334 14l-2.9-2.9"
        stroke="currentColor"
        strokeWidth="1.333"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  </button>
  <input
    className="input"
    placeholder="Buscar..."
    required
    type="text"
    value={searchTerm}
    onChange={(e) => setSearchTerm(e.target.value)}
  />
  <button className="reset" type="reset" onClick={() => setSearchTerm("")}>
    <svg
      xmlns="http://www.w3.org/2000/svg"
      className="h-6 w-6"
      fill="none"
      viewBox="0 0 24 24"
      stroke="currentColor"
      strokeWidth={2}
    >
      <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
    </svg>
  </button>
</form>

      </div>
    </header>
    </div>
  );
};

export default Header;
