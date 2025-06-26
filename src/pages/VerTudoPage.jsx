import { useParams, Link } from "react-router-dom";
import { useEffect, useState } from "react";
import axios from "axios";
import { API_BASE_URL } from "../services/api";
import "../styles/VerTodos.css";

import Propaganda from "../components/Propaganda";
import { propagandas } from "../data/propaganda";

import Navbar from "../components/Navbar";
import Header from "../components/Header";

const VerTodos = () => {
  const { tipo } = useParams();
  const [noticias, setNoticias] = useState([]);
  const [tituloPagina, setTituloPagina] = useState([]);

  // Função para sortear uma propaganda do array
  const getRandomPropaganda = () => {
    const lista = propagandas.noticia;
    return lista[Math.floor(Math.random() * lista.length)];
  };

  useEffect(() => {
    setNoticias([]);
    const fetchNoticias = async () => {
      try {
        if (tipo === "busca") {
          setTituloPagina("Resultados da busca");
          const resultadoBusca = localStorage.getItem("resultadoBusca");

          if (resultadoBusca) {
            const dados = JSON.parse(resultadoBusca);

            if (dados.length > 0) {
              const noticiaPrincipal = dados[0];

              const palavraChave = noticiaPrincipal.titulo.split(" ")[0] || "";
              const resRelacionadas = await axios.get(`${API_BASE_URL}/noticias/search/${palavraChave}`);

              const relacionadasFiltradas = resRelacionadas.data
                .filter((n) => n.id !== noticiaPrincipal.id)
                .map((n) => ({
                  id: n.id,
                  slug: n.slug,
                  categoria: n.categoria,
                  titulo: n.titulo || "Sem título",
                  subtitulo: n.subtitulo || "",
                  imagem: n.imagem || "/img/placeholder.png",
                  data: new Date().toISOString()
                }));

              const formatadaPrincipal = {
                id: noticiaPrincipal.id,
                slug: noticiaPrincipal.slug,
                categoria: noticiaPrincipal.categoria,
                titulo: noticiaPrincipal.titulo || "Sem título",
                subtitulo: noticiaPrincipal.subtitulo || "",
                imagem: noticiaPrincipal.imagem || "/img/placeholder.png",
                data: new Date().toISOString()
              };

              setNoticias([formatadaPrincipal, ...relacionadasFiltradas]);
            } else {
              setNoticias([]);
            }
          }
          return;
        }

        // Lógica padrão
        let res;
        if (tipo === "ultimas") {
          setTituloPagina("Últimas Notícias do Brasil e do Mundo");
          res = await axios.get(`${API_BASE_URL}/noticias/resumo`);
        } else if (tipo === "regiao") {
          setTituloPagina("Notícias da Região");
          res = await axios.get(`${API_BASE_URL}/noticias/regiao/resumo`);
        } else if (tipo === "semana") {
          setTituloPagina("Notícias da Semana");
          res = await axios.get(`${API_BASE_URL}/noticias/semana/resumo`);
        } else {
          setTituloPagina(`Notícias de ${tipo.charAt(0).toUpperCase() + tipo.slice(1)}`);
          res = await axios.get(`${API_BASE_URL}/noticias/categoria/${tipo}`);
        }

        const formatadas = res.data.map((n) => ({
          id: n.id,
          slug: n.slug,
          categoria: n.categoria,
          titulo: n.titulo || "Sem título",
          subtitulo: n.subtitulo || "",
          imagem: n.imagem || "/img/placeholder.png",
          data: n.data_hora_publicacao || new Date().toISOString()
        }));

        setNoticias(formatadas);
      } catch (err) {
        console.error("Erro ao buscar notícias:", err);
      }
    };

    fetchNoticias();
  }, [tipo]);

  // Remove tags HTML
const stripHtml = (html) => {
  const div = document.createElement("div");
  div.innerHTML = html;
  return div.textContent || div.innerText || "";
};

// Decodifica entidades HTML (&nbsp; -> espaço, etc)
const decodeHtml = (html) => {
  const txt = document.createElement("textarea");
  txt.innerHTML = html;
  return txt.value;
};


  return (
    <>
      <Header />
      <Navbar />

      <div className="ver-todos-container">
        <h2 className="ver-todos-titulo">{tituloPagina}</h2>

        {noticias.length === 0 ? (
          <p>Nenhuma notícia encontrada.</p>
        ) : (
          <>
            {/* Notícia principal */}
            <Link to={`/noticia/${noticias[0].slug}`} className="ultima-postada">
              <img src={noticias[0].imagem} alt={noticias[0].titulo} />
                <h3>{noticias[0].titulo}</h3>
                <p>{decodeHtml(stripHtml(noticias[0].subtitulo))}</p>
            </Link>

            {/* Propaganda fixa abaixo da principal */}
            <div className="propaganda-horizontal">
              <Propaganda {...getRandomPropaganda()} />
            </div>

            <div className="noticias-lista">
              {noticias.slice(1).map((n, i) => (
                <div className="noticia-linha" key={i}>
                  <Link to={`/noticia/${n.slug}`} className="noticia-linha-esquerda">
                    <div className="linha-esquerda-img">
                      <img src={n.imagem} alt={n.titulo} />
                    </div>
                    <div className="info">
                      <h3>{n.titulo}</h3>
                      <p>{decodeHtml(stripHtml(n.subtitulo))}</p>
                      <span>{new Date(n.data).toLocaleDateString("pt-BR")} - {n.categoria}</span>
                    </div>
                  </Link>

                  {/* Propaganda vertical em pontos específicos */}
                  {(i === 3 || i === 6) && (
                    <Propaganda {...getRandomPropaganda()} />
                  )}

                  {/* Propaganda horizontal a cada 6 notícias */}
                  {(i + 2) % 6 === 0 && (
                    <Propaganda {...getRandomPropaganda()} />
                  )}
                </div>
              ))}
            </div>
          </>
        )}
      </div>
    </>
  );
};

export default VerTodos;
