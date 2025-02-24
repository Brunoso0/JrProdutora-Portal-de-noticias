import React, { useState, useEffect } from "react";
import { useParams } from "react-router-dom";
import axios from "axios";
import "../styles/NoticiaPage.css";

const NoticiaPage = () => {
    const { slug } = useParams();
    const [noticia, setNoticia] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
      const fetchNoticia = async () => {
          try {
              console.log(`🔹 Buscando notícia com slug: ${slug}`);
              const response = await axios.get(`http://localhost:5000/noticias/slug/${slug}`);

              console.log("✅ Notícia recebida:", response.data);
              setNoticia(response.data);

              // 🔹 Se ainda não foi visualizada nesta sessão, incrementa
              if (!sessionStorage.getItem(`viewed_${slug}`)) {
                  await axios.post(`http://localhost:5000/noticias/view/${slug}`);
                  sessionStorage.setItem(`viewed_${slug}`, "true");
              }
          } catch (error) {
              console.error("❌ Erro ao buscar a notícia:", error);
              setNoticia(null);
          } finally {
              setLoading(false);
          }
      };

      fetchNoticia();
  }, [slug]);

    if (loading) return <p>Carregando notícia...</p>;
    if (!noticia) return <p>Notícia não encontrada.</p>;

    /** 🔹 Converte o conteúdo do Editor.js para HTML */
    const renderContentFromEditorJS = (content) => {
      if (!content || !content.blocks) return "<p>Sem conteúdo disponível</p>";
  
      return content.blocks.map((block, index) => {
          switch (block.type) {
              case "title":
                  return `<h1 key=${index}>${block.data.text}</h1>`;
              case "header":
                  return `<h3 key=${index}>${block.data.text}</h3>`;
  
              case "paragraph":
                  return `<p key=${index}>${block.data.text}</p>`;
  
              case "list":
                  if (!Array.isArray(block.data.items)) return "<ul><li>Erro ao carregar lista</li></ul>";
  
                  return block.data.style === "unordered"
                      ? `<ul key=${index}>${block.data.items
                          .map(item => `<li>${typeof item === "object" ? (item.content ? item.content : JSON.stringify(item)) : item}</li>`)
                          .join("")}</ul>`
                      : `<ol key=${index}>${block.data.items
                          .map(item => `<li>${typeof item === "object" ? (item.content ? item.content : JSON.stringify(item)) : item}</li>`)
                          .join("")}</ol>`;
  
              case "quote":
                  return `<blockquote key=${index}><p>${block.data.text}</p><cite>${block.data.caption || ""}</cite></blockquote>`;
  
              case "embed":
                  return `<iframe key=${index} width="560" height="315" src="${block.data.embed}" frameborder="0" allowfullscreen></iframe>`;
  
              case "code":
                  return `<pre key=${index}><code>${block.data.code}</code></pre>`;
  
              case "image":
              case "simpleImage":
                  return `<img key=${index} src="${block.data.file?.url || block.data.url}" alt="${block.data.caption || "Imagem"}" />`;
  
              default:
                  return `<p key=${index}>${block.data.text || "[Bloco não suportado]"}</p>`;
          }
      }).join(""); // 🔹 Junta tudo em uma string HTML
  };
  

    return (
        <div className="noticia-page">
            <h1>{noticia.titulo}</h1>
            <p className="autor">
                Por {noticia.autor}, publicado em {new Date(noticia.data_hora_publicacao).toLocaleString("pt-BR")}
            </p>
            <div
                className="conteudo"
                dangerouslySetInnerHTML={{ __html: renderContentFromEditorJS(noticia.conteudo) }}
            />
        </div>
    );
};

export default NoticiaPage;
