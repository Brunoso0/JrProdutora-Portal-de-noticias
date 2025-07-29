// src/pages/InscricaoFestival.jsx
import React, { useState } from 'react';
import { useRef } from 'react';
import axios from 'axios';
import { API_FESTIVAL } from "../services/api";
import { toast, ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import '../styles/InscricaoFestival.css';

const InscricaoFestival = () => {
  const [formData, setFormData] = useState({
    nome: '',
    email: '',
    contato: '',
    cpf: '',
    foto: null,
    videoFile: null,
  });



const handleChange = (e) => {
  const { name, value, files } = e.target;

  if (name === 'foto') {
    setFormData({ ...formData, foto: files[0] });
    return;
  }

  if (name === 'video') {
    setFormData({ ...formData, videoFile: files[0] });
    return;
  }

  if (name === 'cpf') {
    const cpf = value
      .replace(/\D/g, '')
      .replace(/(\d{3})(\d)/, '$1.$2')
      .replace(/(\d{3})(\d)/, '$1.$2')
      .replace(/(\d{3})(\d{1,2})$/, '$1-$2')
      .slice (0, 14); // Limita a 14 caracteres (11 dígitos + 3 pontos + 1 traço)
    setFormData({ ...formData, cpf });
    return;
  }

  if (name === 'contato') {
    const telefone = value
      .replace(/\D/g, '')
      .replace(/^(\d{2})(\d)/g, '($1) $2')
      .replace(/(\d{5})(\d)/, '$1-$2')
      .slice(0, 15);
    setFormData({ ...formData, contato: telefone });
    return;
  }

  setFormData({ ...formData, [name]: value });
};


  const handleSubmit = async (e) => {
  e.preventDefault();
  const data = new FormData();
  data.append('nome', formData.nome);
  data.append('email', formData.email);
  data.append('telefone', formData.contato);
  data.append('cpf', formData.cpf);
  data.append('foto', formData.foto);
  data.append('video', formData.videoFile);
  data.append('musica', '');

  try {
    await axios.post(`${API_FESTIVAL}/api/inscricoes/inscrever`, data);

    toast.success('Inscrição enviada com sucesso!', {
      autoClose: 30000,
      position: 'top-center',
    });

    // Resetar formulário
    setFormData({
      nome: '',
      email: '',
      contato: '',
      cpf: '',
      foto: null,
      videoFile: null,
    });

  } catch (error) {
    const mensagemErro = error?.response?.data?.erro || "Erro ao enviar inscrição, revise os campos.";

    toast.error(mensagemErro, {
      autoClose: 30000,
      position: 'top-center',
    });
  }
};

const formularioRef = useRef(null);

const scrollToForm = () => {
  if (formularioRef.current) {
    formularioRef.current.scrollIntoView({ behavior: 'smooth' });
  }
};


  return (
    <div className="inscricao-festival">
      <section className="hero-section">
        <div className="logo-title">
          <img src="/img/GospelTalent.png" alt="" />
          <p>Participe do maior festival de música gospel da região e mostre o talento que Deus te deu. Inscreva-se agora e venha fazer parte desse mover!</p>
          <button className="btn-inscreva" type="button" onClick={scrollToForm}>INSCREVA-SE</button>
        </div>
      </section>

      <section className="mid-section">
        <div className="mid-left">
          <div className="video-thumb pause">
            <img src="/img/cantoras-play.png" alt="" />
          </div>
        </div>
        <div className="mid-right">
          <h2>INSCREVA-SE</h2>
          <p><b>As inscrições já começaram e vão <br /> até  15 de agosto!</b></p>
          <p><i>Não perca a chance de viver esse momento único. Mostre seu talento e faça parte do</i> <b>Gospel Talent 2025!</b> </p>
          <button className="btn-inscreva-mid" type="button" onClick={scrollToForm}>INSCREVA-SE</button>
        </div>
      </section>

      <section className="premiacao-section">
        <div className="smoke-bg">
          <img src="/img/smoke.png" alt="Smoke Background" />
        </div>
        <div className='premiacao-title'>
          <img className='img-title' src="/img/premiacao.png" alt="" />
        </div>
        <div className="trofeus">
          <img className='trofeu2' src="/img/trofeu2.png" alt="2º Lugar" />
          <img className='trofeu1' src="/img/trofeu1.png" alt="1º Lugar" />
          <img className='trofeu2' src="/img/trofeu2.png" alt="3º Lugar" />
        </div>
        <h4>Preencha seus dados com atenção</h4>
        <p>
          Em breve entraremos em contato com mais detalhes sobre o festival. Que seu talento seja instrumento de adoração! 
          </p>
      </section>


      <form className="formulario-section" ref={formularioRef} id="formulario" onSubmit={handleSubmit}>
        <div className="campos-form">
          <div className="form-row">
            <input
              type="text"
              name="nome"
              placeholder="NOME"
              value={formData.nome}
              onChange={handleChange}
              required
            />
            <input
              type="email"
              name="email"
              placeholder="E-MAIL"
              value={formData.email}
              onChange={handleChange}
              required
            />
          </div>

          <div className="form-row">
            <input
              type="text"
              name="cpf"
              placeholder="CPF"
              value={formData.cpf || ''}
              onChange={handleChange}
              required
            />
            <input
              type="text"
              name="contato"
              placeholder="CONTATO"
              value={formData.contato}
              onChange={handleChange}
              required
            />
          </div>

          <div className="form-row">
            <div className="file-card">
              <label htmlFor="fotoUpload" className="file-preview">
                {formData.foto ? (
                  <img src={URL.createObjectURL(formData.foto)} alt="Prévia" className="preview-img" />
                ) : (
                  <img src="/img/icon-img.png" alt="Icone imagem" className="placeholder-icon" />
                )}
              </label>
              <input
                id="fotoUpload"
                type="file"
                name="foto"
                accept="image/*"
                onChange={(e) => setFormData({ ...formData, foto: e.target.files[0] })}
                required
              />
              <p className="preview-nome">{formData.foto?.name || 'Sua Foto'}</p>
            </div>

            <div className="file-card">
              <label htmlFor="videoUpload" className="file-preview">
                <img src="/img/icon-video.png" alt="Icone vídeo" className="placeholder-icon" />
              </label>
              <input
                id="videoUpload"
                type="file"
                name="video"
                accept="video/*"
                onChange={(e) => setFormData({ ...formData, videoFile: e.target.files[0] })}
                required
              />
              <p className="preview-nome">{formData.videoFile?.name || 'Seu Vídeo'}</p>
            </div>
          </div>

        </div>

        <button type="submit">ENVIAR INSCRIÇÃO</button>
      </form>



      <footer>
        <img src="/img/footerfest.png" alt="" />
      </footer>

      <ToastContainer
        position="top-center"
        autoClose={30000}
        hideProgressBar={false}
        newestOnTop={false}
        closeOnClick
        pauseOnFocusLoss
        draggable
        pauseOnHover
        theme="colored" // opcional: para cor de fundo nos toasts
      />
    </div>
  );
};

export default InscricaoFestival;
