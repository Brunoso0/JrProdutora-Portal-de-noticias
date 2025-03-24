import React, { useState, useEffect, useRef } from "react";
import axios from "axios";
import Modal from "react-modal";
import EditorJS from "@editorjs/editorjs";
import Header from "@editorjs/header";
import List from "@editorjs/list";
import Paragraph from "@editorjs/paragraph";
import ImageTool from "@editorjs/image";
import SimpleImage from "@editorjs/simple-image";
import AudioTool from '@furison-tech/editorjs-audio';
import Marker from "@editorjs/marker";
import Table from "@editorjs/table";
import Embed from "@editorjs/embed";
import Quote from "@editorjs/quote";
import CodeTool from "@editorjs/code";
import InlineCode from "@editorjs/inline-code";
import Warning from "@editorjs/warning";
import Checklist from "@editorjs/checklist";
import Underline from "@editorjs/underline";
import ColorPicker from "editorjs-color-picker";
import Title from "title-editorjs";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import Loader from "../components/Loader.jsx"; // Componente de Loader
import "../styles/EditNews.css";

Modal.setAppElement("#root");

const EditNews = () => {
  const [newsList, setNewsList] = useState([]);
  const [programs, setPrograms] = useState([]);
  const [categories, setCategories] = useState([]);
  const [selectedNews, setSelectedNews] = useState(null);
  const [modalIsOpen, setModalIsOpen] = useState(false);
  const [deleteModalIsOpen, setDeleteModalIsOpen] = useState(false);
  const [newsToDelete, setNewsToDelete] = useState(null);
  const [loading, setLoading] = useState(true);


  const editorRef = useRef(null);

  // Função para obter a primeira imagem do conteúdo da notícia
  const getFirstImageFromContent = (content) => {
    if (!content || !content.blocks) {
      console.log("Conteúdo inválido ou sem blocos:", content);
      return null;
    }
  
    // Exibir os blocos para depuração
    // console.log("Estrutura dos blocos:", content.blocks);
  
    // Verificar se existe um bloco de imagem e extrair corretamente a URL
    const imageBlock = content.blocks.find(
      (block) =>
        block.type === "image" &&
        block.data &&
        (block.data.file?.url || block.data.url) // Verifica ambas possibilidades
    );
  
    if (imageBlock) {
      const imageUrl = imageBlock.data.file?.url || imageBlock.data.url; // Obtém a URL correta
      // console.log("Imagem encontrada:", imageUrl);
      return imageUrl;
    } else {
      // console.log("Nenhuma imagem encontrada.");
      return null;
    }
  };

  
  

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true); // 🔹 Ativa o loader antes do carregamento
        const newsResponse = await axios.get("http://localhost:5000/noticias");
        const programsResponse = await axios.get(
          "http://localhost:5000/noticias/programas"
        );
        const categoriesResponse = await axios.get(
          "http://localhost:5000/noticias/categorias"
        );

        setNewsList(newsResponse.data);
        setPrograms(programsResponse.data);
        setCategories(categoriesResponse.data);
        setTimeout(() => setLoading(false), 1000); // 🔹 Mantém o loader por 1 segundo extra
      } catch (error) {
        toast.error("Erro ao buscar dados. Tente novamente.", {
          position: "top-right",
        });
      }
    };

    fetchData();
  }, []);

  const openModal = (news) => {
    setSelectedNews({
        ...news,
        autor_id: news.autor_id, // Garante que está pegando o autor_id
    });
    setModalIsOpen(true);
    setTimeout(() => initializeEditor(news.conteudo), 0);
};


  const closeModal = async () => {
    if (editorRef.current) {
      try {
        await editorRef.current.isReady;
        editorRef.current.destroy();
        editorRef.current = null;
      } catch (err) {
        console.error("Erro ao destruir o editor:", err);
      }
    }

    try {
      const newsResponse = await axios.get("http://localhost:5000/noticias");
      setNewsList(newsResponse.data);
    } catch (error) {
      toast.error("Erro ao atualizar a lista de notícias.", {
        position: "top-right",
      });
    }

    setModalIsOpen(false);
    setSelectedNews(null);
  };

  const initializeEditor = (content) => {
    if (editorRef.current) {
      editorRef.current
        .isReady
        .then(() => editorRef.current.destroy())
        .catch((err) =>
          console.error("Erro ao destruir o editor antes de recriar:", err)
        );
    }

    editorRef.current = new EditorJS({
      holder: "editorjs",
      placeholder: "Edite o conteúdo da notícia aqui...",
      tools: {
        title: {
          class: Title,
          config: {
            defaultLevel: 1,
            levels: [1, 2, 3],
            defaultType: "H3",
            defaultColor: "Red",
            defaultAlignment: "Text-Align-Center",
          },
        },
        header: { class: Header, inlineToolbar: true },
        list: { class: List, inlineToolbar: true },
        paragraph: { class: Paragraph, inlineToolbar: true },
        marker: Marker,
        table: { class: Table, inlineToolbar: true },
        embed: Embed,
        quote: { class: Quote, inlineToolbar: true },
        code: CodeTool,
        inlineCode: InlineCode,
        warning: Warning,
        checklist: Checklist,
        underline: Underline,
        colorPicker: {
          class: ColorPicker,
          config: {
            colors: ["#FF1300", "#FFEB00", "#005CFF", "#24D330", "#000000"],
          },
        },
        audio: {
                    class: AudioTool,
                    config: {
                      uploader: {
                        uploadByFile: async (file) => {
                          return new Promise((resolve, reject) => {
                            const reader = new FileReader();
                            reader.onload = async (e) => {
                              try {
                                const base64Audio = e.target.result.split(",")[1];
                                const fileName = file.name;
          
                                const response = await fetch("http://localhost:5000/noticias/audio", {
                                  method: "POST",
                                  headers: {
                                    "Content-Type": "application/json",
                                  },
                                  body: JSON.stringify({
                                    audioBase64: base64Audio,
                                    fileName: fileName,
                                  }),
                                });
          
                                const result = await response.json();
          
                                if (result.success) {
                                  resolve({ success: 1, file: { url: result.file.url } });
                                } else {
                                  reject(new Error("Erro ao enviar áudio"));
                                }
                              } catch (error) {
                                console.error("Erro ao enviar áudio:", error);
                                reject(error);
                              }
                            };
                            reader.readAsDataURL(file);
                          });
                        },
                      },
                    },
                  },
        image: {
          class: ImageTool,
          config: {
            uploader: {
              uploadByFile: async (file) => {
                return new Promise((resolve) => {
                  const reader = new FileReader();
                  reader.onload = (e) => {
                    resolve({ success: 1, file: { url: e.target.result } });
                  };
                  reader.readAsDataURL(file);
                });
              },
            },
          },
        },
        simpleImage: SimpleImage, // Adicionando o SimpleImage
      },
      data: content || { blocks: [] },
      onReady: () => console.log("EditorJS está pronto."),
      onChange: async () => {
        const savedData = await editorRef.current.save();
        setSelectedNews((prev) => ({
          ...prev,
          conteudo: savedData,
        }));
      },
    });
  };

  const handleSave = async () => {
    try {
        const content = await editorRef.current.save();
        const updatedNews = {
            ...selectedNews,
            conteudo: content,
            autor_id: selectedNews.autor_id, // Envia o autor_id
        };

        const authToken = localStorage.getItem("authToken");
        console.log("🔑 Token enviado na requisição:", authToken); // ✅ Verifica o token antes do envio

        await axios.put(
            `http://localhost:5000/noticias/${selectedNews.id}`,
            updatedNews,
            {
                headers: {
                    "Content-Type": "application/json",
                    "Authorization": `Bearer ${authToken}`
                }
            }
        );

        toast.success("Notícia atualizada com sucesso!", { position: "top-right" });
        closeModal();
    } catch (error) {
        console.error("❌ Erro ao salvar a notícia:", error);
        toast.error("Erro ao salvar a notícia. Verifique os dados.", { position: "top-right" });
    }
};


    


const confirmDelete = (id) => {
  setNewsToDelete(id);
  setDeleteModalIsOpen(true);
};

const handleDelete = async () => {
  if (!newsToDelete) return;

  try {
    const token = localStorage.getItem("authToken"); // Pegando o token salvo no login
    const response = await axios.delete(`http://localhost:5000/noticias/${newsToDelete}`, {
      headers: {
        "Authorization": `Bearer ${token}` // Enviando o token no cabeçalho
      }
    });

    if (response.status === 200) {
      setNewsList((prev) => prev.filter((news) => news.id !== newsToDelete));
      toast.success("Notícia removida com sucesso!", { position: "top-right" });
    } else if (response.status === 404) {
      toast.error("Notícia não encontrada.", { position: "top-right" });
    } else {
      toast.error("Erro ao remover a notícia.", { position: "top-right" });
    }
  } catch (error) {
    console.error("Erro ao remover a notícia:", error);
    toast.error("Erro ao remover a notícia. Tente novamente.", { position: "top-right" });
  }

  setDeleteModalIsOpen(false);
  setNewsToDelete(null);
};




  return (
    <>
    {loading ? <Loader /> :<div className="news-container-custom">
      <h2 className="news-title">Notícias</h2>
      <p className="news-description">Gerencie todas as notícias publicadas no site.</p>

      <div className="news-grid-custom">
      {newsList.map((news) => {
        // console.log("Conteúdo da notícia:", news.conteudo);

        const content = typeof news.conteudo === "string" ? JSON.parse(news.conteudo) : news.conteudo;
        // console.log("Conteúdo parseado:", content);
      
        const firstImage = getFirstImageFromContent(content);
        // console.log("Imagem final para exibição:", firstImage);

        return (
          <div key={news.id} className="news-item-custom">

          <button className="bin-button" onClick={() => confirmDelete(news.id)}>
            <svg
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 39 7"
              className="bin-top"
              >
              <line stroke-width="4" stroke="white" y2="5" x2="39" y1="5"></line>
              <line
                stroke-width="3"
                stroke="white"
                y2="1.5"
                x2="26.0357"
                y1="1.5"
                x1="12"
              ></line>
            </svg>
            <svg
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 33 39"
              className="bin-bottom"
            >
            <mask fill="white" id="path-1-inside-1_8_19">
              <path
                d="M0 0H33V35C33 37.2091 31.2091 39 29 39H4C1.79086 39 0 37.2091 0 35V0Z"
              ></path>
            </mask>
            <path
              mask="url(#path-1-inside-1_8_19)"
              fill="white"
              d="M0 0H33H0ZM37 35C37 39.4183 33.4183 43 29 43H4C-0.418278 43 -4 39.4183 -4 35H4H29H37ZM4 43C-0.418278 43 -4 39.4183 -4 35V0H4V35V43ZM37 0V35C37 39.4183 33.4183 43 29 43V35V0H37Z"
            ></path>
            <path stroke-width="4" stroke="white" d="M12 6L12 29"></path>
            <path stroke-width="4" stroke="white" d="M21 6V29"></path>
          </svg>
          <svg
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 89 80"
            className="garbage"
          >
            <path
              fill="white"
              d="M20.5 10.5L37.5 15.5L42.5 11.5L51.5 12.5L68.75 0L72 11.5L79.5 12.5H88.5L87 22L68.75 31.5L75.5066 25L86 26L87 35.5L77.5 48L70.5 49.5L80 50L77.5 71.5L63.5 58.5L53.5 68.5L65.5 70.5L45.5 73L35.5 79.5L28 67L16 63L12 51.5L0 48L16 25L22.5 17L20.5 10.5Z"
            ></path>
          </svg>
            </button>
            <div className="Edit-img">
              {firstImage && (
               <img
                 src={firstImage}
                 alt="Imagem da notícia"
                 className="news-thumbnail"
               />
             )}
            </div>
            <h3 className="news-item-title">
              {news.conteudo?.blocks?.find((block) => block.type === "title")?.data?.text || "Sem título"}
            </h3>
            <p className="news-item-author">
                <strong>Autor:</strong> {news.autor || "Desconhecido"}
            </p>

            <p className="news-item-category">
              <strong>Categoria:</strong> {news.categoria || "Sem categoria"}
            </p>
            <p className="news-item-date">
              <strong>Data:</strong>{" "}
              {new Date(news.data_hora_publicacao).toLocaleString("pt-BR", {
                day: "2-digit",
                month: "2-digit",
                year: "numeric",
                hour: "2-digit",
                minute: "2-digit",
              })}
            </p>
            <button className="edit-button" onClick={() => openModal(news)}>
              Editar
            </button>
          </div>
        );
      })}
      </div>

      <Modal isOpen={modalIsOpen} onRequestClose={closeModal} contentLabel="Editar Notícia">
        <h2 className="modal-title">Editar Notícia</h2>
        <p className="modal-program">
          <strong>Programa Atual:</strong>{" "}
          {programs.find((program) => program.id === selectedNews?.programa_id)?.nome || "N/A"}
        </p>
        <p className="modal-category">
          <strong>Categoria Atual:</strong>{" "}
          {categories.find((category) => category.id === selectedNews?.categoria_id)?.nome || "N/A"}
        </p>
        <label className="modal-label">
          Programa:
          <select
            className="modal-select"
            value={selectedNews?.programa_id || ""}
            onChange={(e) =>
              setSelectedNews((prev) => ({
                ...prev,
                programa_id: e.target.value,
              }))
            }
          >
            <option value="">Selecione um programa</option>
            {programs.map((program) => (
              <option key={program.id} value={program.id}>
                {program.nome}
              </option>
            ))}
          </select>
        </label>
        <label className="modal-label">
          Categoria:
          <select
            className="modal-select"
            value={selectedNews?.categoria_id || ""}
            onChange={(e) =>
              setSelectedNews((prev) => ({
                ...prev,
                categoria_id: e.target.value,
              }))
            }
          >
            <option value="">Selecione uma categoria</option>
            {categories.map((category) => (
              <option key={category.id} value={category.id}>
                {category.nome}
              </option>
            ))}
          </select>
        </label>
        <div
          id="editorjs"
          className="editor-container"
          style={{
            border: "1px solid #ddd",
            padding: "10px",
            borderRadius: "5px",
            marginTop: "20px",
            height: "50rem",
            overflow: "scroll",
          }}
        ></div>
        <button className="save-button" onClick={handleSave}>Salvar</button>
        <button className="cancel-button" onClick={closeModal}>Cancelar</button>
      </Modal>

      <Modal
        isOpen={deleteModalIsOpen}
        onRequestClose={() => setDeleteModalIsOpen(false)}
        contentLabel="Confirmar Exclusão"
        className="modal-delete"
        overlayClassName="overlay-delete"
      >
        <h2 className="modal-delete-title">Confirmar Exclusão</h2>
        <p className="modal-delete-text">Tem certeza que deseja remover esta notícia?</p>
        <div className="modal-delete-buttons">
          <button className="delete-confirm-button" onClick={handleDelete}>Sim, excluir</button>
          <button className="delete-cancel-button" onClick={() => setDeleteModalIsOpen(false)}>Cancelar</button>
        </div>
      </Modal>


      <ToastContainer style={{ zIndex: 9999 }} />
    </div>}
    </>
  );
};

export default EditNews;
