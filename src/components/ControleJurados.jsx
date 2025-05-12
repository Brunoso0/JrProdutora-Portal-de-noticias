import React, { useEffect, useState } from "react";
import axios from "axios";
import { API_FESTIVAL } from "../services/api";
import "../styles/ModalEditarJurado.css";



const ControleJurados = () => {
  const [jurados, setJurados] = useState([]);
  const [juradoEditando, setJuradoEditando] = useState(null);
  const [formData, setFormData] = useState({
    nome: "",
    telefone: "",
    endereco: "",
    descricao: "",
    foto: null,
  });

  const formatarTelefoneBonito = (valor) => {
  return valor
    .replace(/\D/g, "")                      // Remove tudo que não for número
    .slice(0, 11)                            // Limita a 11 dígitos
    .replace(/^(\d{2})(\d)/, "($1) $2")      // (76) 9...
    .replace(/(\d{1})(\d{4})(\d{4})$/, "$1 $2-$3"); // 9 9122-6010
};


  useEffect(() => {
    carregarJurados();
  }, []);

  const carregarJurados = () => {
    axios.get(`${API_FESTIVAL}/api/jurados/listar`)
      .then((res) => setJurados(res.data))
      .catch((err) => console.error("Erro ao buscar jurados:", err));
  };

  const abrirModal = (jurado) => {
    setJuradoEditando(jurado);
    setFormData({
      nome: jurado.nome || "",
      telefone: jurado.telefone || "",
      endereco: jurado.endereco || "",
      descricao: jurado.descricao || "",
      foto: null,
    });
  };

  const fecharModal = () => {
    setJuradoEditando(null);
    setFormData({
      nome: "",
      telefone: "",
      endereco: "",
      descricao: "",
      foto: null,
    });
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleFileChange = (e) => {
    setFormData(prev => ({ ...prev, foto: e.target.files[0] }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const data = new FormData();
    data.append("nome", formData.nome);
    data.append("telefone", formData.telefone);
    data.append("endereco", formData.endereco);
    data.append("descricao", formData.descricao);
    if (formData.foto) data.append("foto", formData.foto);

    try {
      await axios.put(`${API_FESTIVAL}/api/jurados/${juradoEditando.id}`, data);
      carregarJurados();
      fecharModal();
    } catch (err) {
      console.error("Erro ao atualizar jurado:", err);
      alert("Erro ao atualizar jurado.");
    }
  };

  return (
    <div className="controle-jurados">
      <h2>Controle de Jurados</h2>
      <ul className="lista-jurados">
        {jurados.map(j => (
          <li key={j.id}>
            <strong>{j.nome}</strong> — {j.email}
            <button className="btn-editar" onClick={() => abrirModal(j)}>Editar</button>
          </li>
        ))}
      </ul>

      {juradoEditando && (
        <div className="modal-overlay" onClick={fecharModal}>
          <div className="modal-editar-jurado" onClick={e => e.stopPropagation()}>
            <h3>Editar Jurado</h3>
            <form onSubmit={handleSubmit} encType="multipart/form-data">
              <input
                type="text"
                name="nome"
                placeholder="Nome"
                value={formData.nome}
                onChange={handleInputChange}
                required
              />
              <input
                type="text"
                name="telefone"
                placeholder="Telefone"
                value={formData.telefone}
                onChange={handleInputChange}
              />
              <input
                type="text"
                name="endereco"
                placeholder="Endereço"
                value={formData.endereco}
                onChange={handleInputChange}
              />
              <textarea
                name="descricao"
                placeholder="Descrição"
                value={formData.descricao}
                onChange={handleInputChange}
              />
              <label>Nova Foto (opcional)</label>
              <input
                type="file"
                name="foto"
                accept="image/*"
                onChange={handleFileChange}
              />
              <div className="botoes-modal">
                <button type="submit">Salvar</button>
                <button type="button" onClick={fecharModal}>Cancelar</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default ControleJurados;
