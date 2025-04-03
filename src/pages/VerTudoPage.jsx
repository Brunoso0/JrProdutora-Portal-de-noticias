import { useParams, Link } from "react-router-dom";
import { useEffect, useState } from "react";
import axios from "axios";
import { API_BASE_URL } from "../services/api";
import "../styles/VerTodos.css";

import Navbar from "../components/Navbar";
import Header from "../components/Header";

const VerTodos = () => {
  const { tipo } = useParams();
  const [noticias, setNoticias] = useState([]);
  const [tituloPagina, setTituloPagina] = useState("");

  useEffect(() => {
    // Limpa as notícias antes de carregar novas
    setNoticias([]);  // <- 🧹 LIMPA
  
    const fetchNoticias = async () => {
      try {
        let res;
  
        if (tipo === "ultimas") {
          setTituloPagina("Últimas Notícias do Brasil e do Mundo");
          res = await axios.get(`${API_BASE_URL}/noticias/resumo`);
        } else if (tipo === "regiao") {
          setTituloPagina("Notícias da Região");
          res = await axios.get(`${API_BASE_URL}/noticias/regiao/resumo`);
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
  }, [tipo]); // <- Escutando mudanças na rota
  

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
            <Link to={`/noticia/${noticias[0].slug}`} className="ultima-postada">
              <img src={noticias[0].imagem} alt={noticias[0].titulo} />
              <h3>{noticias[0].titulo}</h3>
              <p>{noticias[0].subtitulo}</p>
            </Link>

            <div className="propaganda-horizontal">
              <img src="/img/propaganda-1.jpg" alt="Publicidade" />
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
                      <p>{n.subtitulo}</p>
                      <span>{new Date(n.data).toLocaleDateString("pt-BR")} - {n.categoria}</span>
                    </div>
                  </Link>

                  {i === 1 || i === 3 ? (
                    <div className="propaganda-vertical">
                      <img src="/img/propaganda-2.jpg" alt="Propaganda lateral" />
                    </div>
                  ) : null}

                  {(i + 2) % 6 === 0 && (
                    <div className="propaganda-horizontal-full">
                      <img src="/img/propaganda-3.jpg" alt="Publicidade" />
                    </div>
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
