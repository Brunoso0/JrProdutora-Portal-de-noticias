import React, { useState, useEffect } from "react";
import axios from "axios";
import { DndContext, closestCenter } from "@dnd-kit/core";
import { SortableContext, arrayMove } from "@dnd-kit/sortable";
import SortableItem from "./SortableItem";
import "../styles/OrderNews.css";

const OrderNews = () => {
  const [newsLayout, setNewsLayout] = useState([]);
  const [availableNews, setAvailableNews] = useState([]);

  useEffect(() => {
    fetchLayout();
  }, []);

  /** 🔹 Busca o layout salvo no banco de dados **/
  const fetchLayout = async () => {
    try {
      console.log("Buscando layout salvo no banco...");
      const layoutResponse = await axios.get("http://localhost:5000/layout/news-layout");
      const newsResponse = await axios.get("http://localhost:5000/noticias");

      console.log("Layout recebido:", layoutResponse.data);
      console.log("Notícias recebidas:", newsResponse.data);

      // Formata as notícias
      const formattedNews = newsResponse.data.map((news) => {
        let parsedContent = news.conteudo;

        if (typeof parsedContent === "string") {
          try {
            parsedContent = JSON.parse(parsedContent);
          } catch (error) {
            console.error("Erro ao parsear o conteúdo da notícia:", error);
            parsedContent = { blocks: [] };
          }
        }

        return {
          id: news.id,
          titulo: getTitleFromContent(parsedContent),
          imageUrl: getFirstImageFromContent(parsedContent),
          categoria: news.categoria || "Sem categoria",
          autor: news.autor || "Desconhecido",
        };
      });

      // Ordena as notícias com base no layout salvo no banco
      const orderedNews = layoutResponse.data.map((layoutItem) => {
        const foundNews = formattedNews.find((news) => news.id === layoutItem.noticia_id);
        
        if (foundNews) {
          return { ...foundNews, slug: layoutItem.slug }; // 🔹 Garante que o slug seja mantido
        }
        
        return null;
      }).filter(Boolean);
      

      console.log("Notícias organizadas com base no banco:", orderedNews);

      // Define as notícias no layout principal
      setNewsLayout(orderedNews.slice(0, 5)); // Apenas 5 destaques
      setAvailableNews(formattedNews.filter((news) => !orderedNews.some((ordered) => ordered.id === news.id)));
      
    } catch (error) {
      console.error("❌ Erro ao buscar layout e notícias:", error);
    }
  };

  /** 🔹 Obtém o título da notícia **/
  const getTitleFromContent = (content) => {
    if (!content || !content.blocks) return "Sem título";
    const titleBlock = content.blocks.find((block) => block.type === "title" || block.type === "header");
    return titleBlock ? titleBlock.data.text : "Sem título";
  };

  /** 🔹 Obtém a primeira imagem da notícia **/
  const getFirstImageFromContent = (content) => {
    if (!content || !content.blocks) return null;
    const imageBlock = content.blocks.find((block) => block.type === "image" && block.data && (block.data.file?.url || block.data.url));
    return imageBlock ? (imageBlock.data.file?.url || imageBlock.data.url) : null;
  };

  /** 🔹 Lida com o Drag and Drop **/
  const handleDragEnd = (event) => {
    const { active, over } = event;
    if (!over || active.id === over.id) return;

    const oldIndex = newsLayout.findIndex((item) => item.id === active.id);
    const newIndex = newsLayout.findIndex((item) => item.id === over.id);

    const newLayout = arrayMove(newsLayout, oldIndex, newIndex);
    setNewsLayout(newLayout);
  };

  /** 🔹 Salva a nova organização no banco **/
  const saveLayout = async () => {
    try {
      const updatedLayout = newsLayout.map((item, index) => ({ id: item.id, posicao: index + 1 }));
      await axios.post("http://localhost:5000/layout/update-news-layout", { layout: updatedLayout });
      alert("Layout atualizado com sucesso!");
    } catch (error) {
      console.error("❌ Erro ao salvar o layout:", error);
    }
  };

  /** 🔹 Define uma notícia como destaque **/
  const setAsHighlight = (news) => {
    const newLayout = [news, ...newsLayout.slice(1)];
    const updatedAvailableNews = availableNews.filter((item) => item.id !== news.id);
    setNewsLayout(newLayout);
    setAvailableNews([...updatedAvailableNews, newsLayout[0]]);
  };

  return (
    <div className="order-container">
      <DndContext collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
        <SortableContext items={newsLayout.map((item) => item.id)}>
          <div className="order-news-grid">
            {newsLayout.length > 0 && (
              <SortableItem
                key={newsLayout[0].id}
                id={newsLayout[0].id}
                title={newsLayout[0].titulo}
                image={newsLayout[0].imageUrl}
                category={newsLayout[0].categoria}
                isMain
              />
            )}

            <div className="order-side-articles">
              {newsLayout.slice(1, 5).map((news) => (
                <SortableItem
                  key={news.id}
                  id={news.id}
                  title={news.titulo}
                  image={news.imageUrl}
                  category={news.categoria}
                />
              ))}
            </div>
          </div>
        </SortableContext>
      </DndContext>

      <button onClick={saveLayout} className="order-save-button">Salvar Alterações</button>

      {/* 🔹 SEÇÃO DE ESCOLHA DE NOTÍCIAS PARA DESTAQUE */}
      <div className="news-selection">
        <h3>Escolha uma notícia para destacar</h3>
        <div className="news-list">
          {availableNews.map((news) => (
            <div key={news.id} className="news-item-order">
              <img src={news.imageUrl} alt={news.titulo} className="news-image" />
              <div className="news-info">
                <h4>{news.titulo}</h4>
                <p>{news.categoria}</p>
                <button onClick={() => setAsHighlight(news)} className="highlight-button">
                  Definir como destaque
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default OrderNews;
