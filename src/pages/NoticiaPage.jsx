import React, { useState, useEffect } from "react";
import { useParams } from "react-router-dom";
import axios from "axios";
import "../styles/NoticiaPage.css";
import Header from '../components/Header';
import Navbar from '../components/Navbar';
import { API_BASE_URL } from '../services/api';
import { propagandas } from "../data/propaganda";
import Propaganda from "../components/Propaganda";

const NoticiaPage = () => {
  const { slug } = useParams();
  const [noticia, setNoticia] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchNoticia = async () => {
      try {
        const response = await axios.get(`${API_BASE_URL}/noticias/slug/${slug}`);
        setNoticia(response.data);

        if (!sessionStorage.getItem(`viewed_${slug}`)) {
          await axios.post(`${API_BASE_URL}/noticias/view/${slug}`);
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

  const titulo =
    noticia.titulo ||
    (noticia.conteudo?.blocks?.[0]?.type === "title"
      ? noticia.conteudo.blocks[0].data.text
      : "Título não disponível");

  const renderContentFromEditorJS = (content) => {
    if (!content || !content.blocks) return "<p>Sem conteúdo disponível</p>";

    const htmlParts = [];
    let blocoCount = 0;
    let propagandaIndex = 1; // começa da SEGUNDA propaganda (evita repetir a primeira do topo)

    content.blocks.forEach((block, i) => {
      if (block.type === "title") return;

      let html = "";

      switch (block.type) {
        case "header":
          html = `<h3>${block.data.text}</h3>`;
          break;
        case "paragraph":
          html = `<p>${block.data.text}</p>`;
          break;
        case "list":
          html =
            block.data.style === "unordered"
              ? `<ul>${block.data.items.map(item => `<li>${item}</li>`).join("")}</ul>`
              : `<ol>${block.data.items.map(item => `<li>${item}</li>`).join("")}</ol>`;
          break;
        case "quote":
          html = `<blockquote><p>${block.data.text}</p><cite>${block.data.caption || ""}</cite></blockquote>`;
          break;
        case "embed":
          html = `<iframe width="560" height="315" src="${block.data.embed}" frameborder="0" allowfullscreen></iframe>`;
          break;
        case "code":
          html = `<pre><code>${block.data.code}</code></pre>`;
          break;
        case "image":
        case "simpleImage":
          html = `<img src="${block.data.file?.url || block.data.url}" alt="${block.data.caption || "Imagem"}" class="conteudo-img"/>`;
          break;
        default:
          html = `<p>${block.data.text || "[Bloco não suportado]"}</p>`;
          break;
      }

      htmlParts.push(html);
      blocoCount++;

      if (blocoCount >= Math.floor(Math.random() * 2) + 3) {
        const currentAd = propagandas.noticia[propagandaIndex % propagandas.noticia.length];

        const adHtml =
          currentAd.tipo === "banner"
            ? `<div class="propaganda-banner"><a href="${currentAd.link}" target="_blank"><img src="${currentAd.imagem}" alt="Propaganda" /></a></div>`
            : `<div class="propaganda-google">
                <ins class="adsbygoogle"
                  style="display:block"
                  data-ad-client="${currentAd.id}"
                  data-ad-slot="${currentAd.slot}"
                  data-ad-format="auto"
                  data-full-width-responsive="true"></ins>
                <script>(adsbygoogle = window.adsbygoogle || []).push({});</script>
              </div>`;

        htmlParts.push(adHtml);
        blocoCount = 0;
        propagandaIndex++; // avança para o próximo anúncio
      }
    });

    return htmlParts.join("");
  };

  return (
    <>
      <Header />
      <Navbar />
      <div className="noticia-page">
        <h1>{titulo}</h1>
        <p className="autor">
          Por {noticia.autor}, publicado em {new Date(noticia.data_hora_publicacao).toLocaleString("pt-BR")}
        </p>

        {/* 🔝 Propaganda fixa no topo */}
        <Propaganda {...propagandas.noticia[0]} />

        <div
          className="conteudo"
          dangerouslySetInnerHTML={{ __html: renderContentFromEditorJS(noticia.conteudo) }}
        />
      </div>
    </>
  );
};

export default NoticiaPage;
