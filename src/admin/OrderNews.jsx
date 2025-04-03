import React, { useState, useEffect } from "react";
import axios from "axios";
import { DndContext, closestCenter } from "@dnd-kit/core";
import { SortableContext, arrayMove } from "@dnd-kit/sortable";
import SortableItem from "./SortableItem";
import Loader from "../components/Loader.jsx"; // Componente de Loader
import "../styles/OrderNews.css";
import { useDroppable } from "@dnd-kit/core";


import  { API_BASE_URL } from '../services/api'; // Importando o arquivo de configuração do Axios

const OrderNews = () => {
  const [newsLayout, setNewsLayout] = useState([]);
  const [availableNews, setAvailableNews] = useState([]);
  const [loading, setLoading] = useState(true);
  
  const { setNodeRef: setDestaquesRef } = useDroppable({ id: "destaques" });
  const { setNodeRef: setDisponiveisRef } = useDroppable({ id: "disponiveis" });

  
  useEffect(() => {
    const fetchLayout = async () => {
      try {
        setLoading(true); // 🔹 Ativa o loader antes do carregamento
  
        console.log("Buscando layout salvo no banco...");
        const layoutResponse = await axios.get(`${API_BASE_URL}/layout/news-layout`);
        const newsResponse = await axios.get(`${API_BASE_URL}/noticias`);
  
        console.log("Layout recebido:", layoutResponse.data);
        console.log("Notícias recebidas:", newsResponse.data);
  
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
  
        const orderedNews = layoutResponse.data
          .map((layoutItem) => {
            const foundNews = formattedNews.find((news) => news.id === layoutItem.noticia_id);
            return foundNews ? { ...foundNews, slug: layoutItem.slug } : null;
          })
          .filter(Boolean);
  
        console.log("Notícias organizadas com base no banco:", orderedNews);
  
        const [filledLayout, updatedAvailable] = fillNewsLayout(
          orderedNews.slice(0, 5),
          formattedNews.filter((news) => !orderedNews.some((ordered) => ordered.id === news.id))
        );
        
        setNewsLayout(filledLayout);
        setAvailableNews(updatedAvailable);
        
  
        setTimeout(() => setLoading(false), 1000); // 🔹 Mantém o loader por 1 segundo extra
      } catch (error) {
        console.error("❌ Erro ao buscar layout e notícias:", error);
        setLoading(false); // 🔹 Mesmo em caso de erro, desativa o loader
      }
    };
  
    fetchLayout(); // 🔹 Mantém a chamada do layout ao carregar o componente
  }, []); // 🔹 Garante que o layout seja buscado apenas na montagem do componente
  
  

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

  /** 🔹 Garante que sempre existam 5 destaques preenchendo com notícias disponíveis **/
  const fillNewsLayout = (layout, available) => {
  const filledLayout = [...layout];
  const updatedAvailable = [...available];

  while (filledLayout.length < 5 && updatedAvailable.length > 0) {
    const next = updatedAvailable.shift();
    filledLayout.push(next);
  }

  return [filledLayout, updatedAvailable];
};


  /** 🔹 Lida com o Drag and Drop **/
  const handleDragEnd = (event) => {
    const { active, over } = event;
    if (!over || active.id === over.id) return;
  
    const activeId = active.id;
    const overId = over.id;
  
    const isInLayout = newsLayout.find((item) => item.id === activeId);
    const isInAvailable = availableNews.find((item) => item.id === activeId);
  
    // 🔁 Troca entre listas
    if (isInAvailable && overId === "destaques") {
      const newHighlight = isInAvailable;
      const newLayout = [newHighlight, ...newsLayout.filter(n => n.id !== newHighlight.id)].slice(0, 5);
      const [filledLayout, updatedAvailable] = fillNewsLayout(newLayout, availableNews.filter(n => n.id !== newHighlight.id));
      setNewsLayout(filledLayout);
      setAvailableNews(updatedAvailable);
      return;
    }
  
    if (isInLayout && overId === "disponiveis") {
      const movedItem = isInLayout;
      const newLayout = newsLayout.filter(n => n.id !== movedItem.id);
      const [filledLayout, updatedAvailable] = fillNewsLayout(newLayout, [...availableNews, movedItem]);
      setNewsLayout(filledLayout);
      setAvailableNews(updatedAvailable);
      return;
    }
  
    // 🔃 Reordenação interna
    const oldIndex = newsLayout.findIndex((item) => item.id === activeId);
    const newIndex = newsLayout.findIndex((item) => item.id === overId);
  
    if (oldIndex !== -1 && newIndex !== -1) {
      const newLayout = arrayMove(newsLayout, oldIndex, newIndex);
      setNewsLayout(newLayout);
    }
  };
  

  /** 🔹 Salva a nova organização no banco **/
  const saveLayout = async () => {
    try {
      const updatedLayout = newsLayout.map((item, index) => ({ id: item.id, posicao: index + 1 }));
      const token = localStorage.getItem("authToken"); // Assuming the token is stored in localStorage
      await axios.post(`${API_BASE_URL}/layout/update-news-layout`, { layout: updatedLayout }, {
        headers: {
          Authorization: `Bearer ${token}`
        }
      });
      alert("Layout atualizado com sucesso!");
    } catch (error) {
      console.error("❌ Erro ao salvar o layout:", error);
    }
  };

  /** 🔹 Define uma notícia como destaque **/
  const setAsHighlight = (news) => {
    const newLayout = [news, ...newsLayout.filter((item) => item.id !== news.id)].slice(0, 5);
    const updatedAvailableNews = availableNews.filter((item) => item.id !== news.id);
    const [filledLayout, finalAvailable] = fillNewsLayout(newLayout, updatedAvailableNews);
    setNewsLayout(filledLayout);
    setAvailableNews(finalAvailable);
  };
  

  return (
    <>
    {loading ? <Loader /> : <div className="order-container">
      <DndContext collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
        <SortableContext items={newsLayout.map((item) => item.id)}>
        <div className="order-news-grid" ref={setDestaquesRef}>
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
        <div className="news-list" ref={setDisponiveisRef}>
          {availableNews.map((news) => (
            <SortableItem
              key={news.id}
              id={news.id}
              title={news.titulo}
              image={news.imageUrl}
              category={news.categoria}
              isAvailable
            />
          ))}
        </div>

      </div>
    </div>}
    </>
  );
};

export default OrderNews;
