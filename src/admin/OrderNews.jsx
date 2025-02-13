import React, { useState, useEffect } from "react";
import axios from "axios";
import { DndContext, closestCenter } from "@dnd-kit/core";
import { SortableContext, verticalListSortingStrategy, arrayMove } from "@dnd-kit/sortable";
import SortableItem from "./SortableItem";
import "../styles/OrderNews.css";

const OrderNews = () => {
  const [newsLayout, setNewsLayout] = useState([]);

  useEffect(() => {
    fetchLayout();
  }, []);

  const fetchLayout = async () => {
    try {
      const response = await axios.get("http://localhost:5000/layout");
      setNewsLayout(response.data);
    } catch (error) {
      console.error("Erro ao buscar layout das notícias:", error);
    }
  };

  const handleDragEnd = (event) => {
    const { active, over } = event;
    if (!over || active.id === over.id) return;

    const oldIndex = newsLayout.findIndex((item) => item.noticia_id === active.id);
    const newIndex = newsLayout.findIndex((item) => item.noticia_id === over.id);

    const newLayout = arrayMove(newsLayout, oldIndex, newIndex);
    setNewsLayout(newLayout);
  };

  const saveLayout = async () => {
    try {
      const updatedLayout = newsLayout.map((item, index) => ({ id: item.noticia_id, posicao: index + 1 }));
      await axios.post("http://localhost:5000/layout", { layout: updatedLayout });
      alert("Layout atualizado com sucesso!");
    } catch (error) {
      console.error("Erro ao salvar o layout:", error);
    }
  };

  return (
    <div className="order-news-container">
      <h2>Organizar Notícias</h2>
      <DndContext collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
        <SortableContext items={newsLayout.map((item) => item.noticia_id)} strategy={verticalListSortingStrategy}>
          {newsLayout.map((news) => (
            <SortableItem key={news.noticia_id} id={news.noticia_id} title={news.titulo} />
          ))}
        </SortableContext>
      </DndContext>
      <button onClick={saveLayout} className="save-button">Salvar Alterações</button>
    </div>
  );
};

export default OrderNews;
