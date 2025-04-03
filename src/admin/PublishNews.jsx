import React, { useState, useEffect, useRef } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import EditorJS from "@editorjs/editorjs";
import Header from "@editorjs/header";
import List from "@editorjs/list";
import Paragraph from "@editorjs/paragraph";

import { API_BASE_URL } from "../services/api"; // Importando o arquivo de configuração do Axios

// import AIText from '@alkhipce/editorjs-aitext';   QUEM SABE NO FUTURO
import ImageTool from "@editorjs/image";
import SimpleImage from "@editorjs/simple-image";
import Marker from "@editorjs/marker";
import Table from "@editorjs/table";
import Embed from '@editorjs/embed';
import Quote from "@editorjs/quote";
import CodeTool from "@editorjs/code";
import InlineCode from "@editorjs/inline-code";
import Warning from "@editorjs/warning";
import Underline from "@editorjs/underline";
import DragDrop from "editorjs-drag-drop";
import ColorPicker from "editorjs-color-picker";
import Title from "title-editorjs";
import AudioTool from '@furison-tech/editorjs-audio';
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import "../styles/PublishNews.css";
import moment from "moment";

const PublishNews = () => {
  const [newsData, setNewsData] = useState({
    author: "",
    program_id: "",
    category_id: "",
    content: null,
    publicationDate: "",
  });
  const [programs, setPrograms] = useState([]);
  const [categories, setCategories] = useState([]);
  const editorContainerRef = useRef(null);
  const editorInstance = useRef(null);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchData = async () => {
      try {
        const token = localStorage.getItem("authToken");
        if (!token) {
          navigate("/login");
          return;
        }

        const headers = { Authorization: `Bearer ${token}` };
        const [userRes, programsRes, categoriesRes] = await Promise.all([
          axios.get(`${API_BASE_URL}/auth/user`, { headers }),
          axios.get(`${API_BASE_URL}/noticias/programas`, { headers }),
          axios.get(`${API_BASE_URL}/noticias/categorias`, { headers }),
        ]);

        const userData = userRes.data;

        console.log("✅ Dados do usuário carregados:", userData);

        setNewsData((prev) => ({
          ...prev,
          author: userData.name || "Usuário",
          autor_id: userData.id,
          publicationDate: new Date().toLocaleString(),
        }));

        setPrograms(programsRes.data || []);
        setCategories(categoriesRes.data || []);
      } catch (err) {
        console.error("❌ Erro ao carregar dados:", err);
        toast.error("Erro ao carregar dados. Tente novamente mais tarde.", {
          position: "top-right",
        });

        if (err.response?.status === 401) {
          localStorage.removeItem("authToken");
          navigate("/login");
        }
      }
    };

    fetchData();

    if (!editorInstance.current && editorContainerRef.current) {
      initializeEditor();
    }

    return () => {
      if (editorInstance.current) {
        try {
          if (typeof editorInstance.current.destroy === "function") {
            editorInstance.current.destroy();
            editorInstance.current = null;
            console.log("🗑️ EditorJS destroyed successfully.");
          }
        } catch (error) {
          console.error("⚠️ Error while destroying EditorJS:", error);
        }
      }
    };
  }, [navigate]);

  const initializeEditor = () => {
    if (!editorInstance.current) {
      editorInstance.current = new EditorJS({
        holder: "editor-container",
        placeholder: "Digite o conteúdo da notícia aqui...",
        tools: {
          title: { class: Title, inlineToolbar: true },
          header: { class: Header, inlineToolbar: true },
          paragraph: { class: Paragraph, inlineToolbar: true },
          list: { class: List, inlineToolbar: true },
          marker: Marker,
          table: { class: Table, inlineToolbar: true },
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
  
                        const response = await fetch(`${API_BASE_URL}/noticias/audio`, {
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
          // aitext: {
          //   class: AIText,
          //   config: {
          //     callback: async (text) => {
          //       try {
          //         const response = await fetch("${API_BASE_URL}/noticias/aitext", {
          //           method: "POST",
          //           headers: {
          //             "Content-Type": "application/json",
          //           },
          //           body: JSON.stringify({ prompt: text }),
          //         });
          
          //         if (!response.ok) {
          //           throw new Error(`Erro na API: ${response.status}`);
          //         }
          
          //         const data = await response.json();
          
          //         if (data.success) {
          //           return data.response; // ✅ Retorna a resposta correta
          //         } else {
          //           return "Erro ao processar IA"; // Retorna um texto padrão em caso de erro
          //         }
          //       } catch (error) {
          //         console.error("Erro na IA:", error);
          //         return "Erro ao acessar a API de IA"; // Retorna um texto de erro para evitar falhas
          //       }
          //     },
          //   },
          // },
          embed: {
            class: Embed,
            inlineToolbar: true,
            config: {
              services: { youtube: true, twitter: true, instagram: true },
            },
          },
          quote: { class: Quote, inlineToolbar: true },
          code: CodeTool,
          inlineCode: InlineCode,
          warning: Warning,
          underline: Underline,
          colorPicker: {
            class: ColorPicker,
            config: {
              colors: ["#FF1300", "#FFEB00", "#005CFF", "#24D330", "#000000"],
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
          dragDrop: DragDrop,
        },
        data: {
          blocks: [{ type: "paragraph", data: { text: "" } }],
        },
        onReady: () => {
          console.log("✅ EditorJS inicializado com AI Text.");
        },
        onChange: async () => {
          const content = await editorInstance.current.save();
          setNewsData((prev) => ({ ...prev, content }));
        },
      });
    }
  };
  


  const handleSubmit = async () => {
    try {
        const token = localStorage.getItem("authToken");
        console.log("🔑 Token armazenado no localStorage:", token); // ADICIONADO PARA DEPURAÇÃO
        
        if (!token) throw new Error("Usuário não autenticado!");

        const content = await editorInstance.current.save();
        const titleBlock = content.blocks.find((block) => block.type === "title");
        const title = titleBlock ? titleBlock.data.text : "";

        if (!title) {
            console.error("❌ Erro: O título da notícia é obrigatório!");
            toast.error("O título da notícia é obrigatório!", { position: "top-right" });
            return;
        }

        if (!content.blocks || content.blocks.length === 0) {
            console.error("❌ Erro: O conteúdo da notícia está vazio!");
            toast.error("O conteúdo da notícia não pode estar vazio!", { position: "top-right" });
            return;
        }

        if (!newsData.autor_id) {
            console.error("❌ Erro: O ID do autor não foi encontrado!");
            toast.error("Erro ao identificar o autor. Refaça o login.", { position: "top-right" });
            return;
        }

        if (!newsData.category_id || !newsData.program_id) {
            console.error("❌ Erro: Programa ou categoria não selecionados!");
            toast.error("Selecione um programa e uma categoria para a notícia!", { position: "top-right" });
            return;
        }

        const payload = {
            autor_id: newsData.autor_id,
            autor: newsData.author,
            categoria_id: newsData.category_id,
            programa_id: newsData.program_id,
            conteudo: content,
            publicationDate: moment().format("DD/MM/YYYY, HH:mm:ss"),
            titulo: title,
        };

        console.log("🚀 Payload enviado para o backend:", payload);

        const response = await axios.post(`${API_BASE_URL}/noticias/salvar`, payload, {
            headers: {
                Authorization: `Bearer ${token}`, // Certifique-se de que esse cabeçalho está presente
                "Content-Type": "application/json",
            },
        });

        console.log("✅ Resposta do servidor:", response.data);

        toast.success("Notícia publicada com sucesso!", { position: "top-right" });
        editorInstance.current.clear();
        setNewsData((prev) => ({
            ...prev,
            program_id: "",
            category_id: "",
            content: null,
            title: "",
        }));
    } catch (error) {
        console.error("❌ Erro ao publicar notícia:", error.response?.data || error.message);
        toast.error(`Erro ao publicar a notícia: ${error.response?.data?.error || error.message}`, {
            position: "top-right",
        });
    }
};


  return (
    <div className="publish-news-container">
      <ToastContainer />
      <div className="news-editor">
        <div className="news-details">
          <h2>Publicar Notícia</h2>
          <div className="autor-fields">
            <div className="title-field">
              <label>
                Autor:
                <input type="text" value={newsData.author} readOnly />
              </label>
              <label>
                Data de Publicação:
                <input type="text" value={newsData.publicationDate} readOnly />
              </label>
            </div>
          </div>

          <div className="row-fields">
            <label>
              Programa:
              <select
                value={newsData.program_id}
                onChange={(e) =>
                  setNewsData((prev) => ({ ...prev, program_id: e.target.value }))
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
            <label>
              Categoria:
              <select
                value={newsData.category_id}
                onChange={(e) =>
                  setNewsData((prev) => ({ ...prev, category_id: e.target.value }))
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
          </div>
        </div>

        <div className="Container-editor">
          <div
            id="editor-container"
            ref={editorContainerRef}
            style={{
              border: "1px solid #ddd",
              padding: "10px",
              borderRadius: "5px",
              marginTop: "20px",
              height: "50rem",
              overflow: "scroll",
            }}
          ></div>

          <button className="publish-button" onClick={handleSubmit}>
            <div className="svg-wrapper-1">
              <div className="svg-wrapper">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  viewBox="0 0 24 24"
                  width="24"
                  height="24"
                >
                  <path fill="none" d="M0 0h24v24H0z"></path>
                  <path
                    fill="currentColor"
                    d="M1.946 9.315c-.522-.174-.527-.455.01-.634l19.087-6.362c.529-.176.832.12.684.638l-5.454 19.086c-.15.529-.455.547-.679.045L12 14l6-8-8 6-8.054-2.685z"
                  ></path>
                </svg>
              </div>
            </div>
            <span>Send</span>
          </button>
        </div>
      </div>
    </div>
  );
};

export default PublishNews;
