import React, { useEffect, useState, useMemo } from "react";
import axios from "axios";
import FooterFestival from "../components/FooterFestival";
import { API_FESTIVAL } from "../services/api";
import "../styles/AreaDoCandidato.css";
import { toast, ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

const AreaDoCandidato = () => {
  const [candidato, setCandidato] = useState(null);
  const [etapas, setEtapas] = useState([]);
  const [etapaSelecionada, setEtapaSelecionada] = useState(null);
  const [notas, setNotas] = useState(null);
  const [modalAberto, setModalAberto] = useState(false);
  const [votosBinarios, setVotosBinarios] = useState([]);
  const [pendencias, setPendencias] = useState([]);
  const [mostrarPendencias, setMostrarPendencias] = useState(false);
  const [formData, setFormData] = useState({});
  const [previewFoto, setPreviewFoto] = useState(null);
  const [dadosVotacao, setDadosVotacao] = useState(null);
  const [etapa, setEtapa] = useState(null);

  const coresJurados = ["#9B5DE5", "#F15BB5", "#fb493cff", "#00BBF9", "#46BFDB"];
  const candidatoId = localStorage.getItem("candidatoId");

  useEffect(() => {
    if (!candidatoId) return;

    axios.get(`${API_FESTIVAL}/api/inscricoes/${candidatoId}`)
      .then(res => {
        setCandidato(res.data);
        setFormData({
          nome: res.data.nome || "",
          telefone: res.data.telefone || "",
          nome_artistico: res.data.nome_artistico || "",
          endereco: res.data.endereco || "",
          rg: res.data.rg || "",
          cpf: res.data.cpf || "",
          musica: res.data.musica || "",
          tempo_atividade: res.data.tempo_atividade || "",
          atividade_profissional_musica: res.data.atividade_profissional_musica ? "true" : "false",
          faz_parte_grupo: res.data.faz_parte_grupo ? "true" : "false",
          experiencia: res.data.experiencia || "",
        });

        // defina aqui os campos mínimos para liberar o botão normal
        const camposObrigatorios = ["telefone", "cpf", "musica", "video"];
        const pend = camposObrigatorios.filter(c => !res.data[c]);
        setPendencias(pend);
      })
      .catch(() => setCandidato(null));

    axios.get(`${API_FESTIVAL}/api/inscricoes/etapas`)
      .then(res => setEtapas(res.data))
      .catch(() => setEtapas([]));
  }, [candidatoId]);

  useEffect(() => {
    if (!candidato?.id) return;
    const etapaAtual = candidato.fase_atual?.toLowerCase();
    setEtapa(etapaAtual);

    if (etapaAtual === "classificado") {
      setDadosVotacao(null);
      return;
    }

    axios
      .get(`${API_FESTIVAL}/api/dashboard/notas/${candidato.id}/${etapaAtual}`)
      .then((res) => setDadosVotacao(res.data))
      .catch(() => setDadosVotacao(null));
  }, [candidato]);

  const etapasExibidas = useMemo(() => {
    if (!candidato || !etapas.length) return [];
    const etapasOrdenadas = [...etapas].sort((a, b) => a.id - b.id);
    const indexAtual = etapasOrdenadas.findIndex(e => e.nome === candidato.fase_atual);
    return etapasOrdenadas.slice(0, indexAtual + 1);
  }, [etapas, candidato]);

  useEffect(() => {
    if (!etapas.length || !candidato) return;
    const etapasOrdenadas = [...etapas].sort((a, b) => a.id - b.id);
    const etapaFinal = etapasOrdenadas[etapasOrdenadas.length - 1];

    if (etapaFinal && candidato.fase_atual &&
        etapaFinal.nome.toLowerCase() === candidato.fase_atual.toLowerCase()) {
      const segundaEtapa = etapasOrdenadas.find(e => e.nome.toLowerCase().includes("segunda etapa"));
      if (segundaEtapa) { setEtapaSelecionada(String(segundaEtapa.id)); return; }
    }

    const etapaAtual = etapasOrdenadas.find(e => e.nome === candidato.fase_atual);
    if (etapaAtual) setEtapaSelecionada(String(etapaAtual.id));
    else if (etapasOrdenadas.length > 0) setEtapaSelecionada(String(etapasOrdenadas[0].id));
  }, [etapas, candidato]);

  useEffect(() => {
    if (!etapaSelecionada || !candidatoId) return;
    const etapaIdNum = Number(etapaSelecionada);
    const candidatoIdNum = Number(candidatoId);

    axios
      .get(`${API_FESTIVAL}/api/jurados/votos-binarios/${candidatoIdNum}/${etapaIdNum}`)
      .then(res => setVotosBinarios(res.data))
      .catch(() => setVotosBinarios([]));
  }, [etapaSelecionada, candidatoId]);

  useEffect(() => {
    if (!etapaSelecionada || !candidatoId) return;
    const etapaIdNum = Number(etapaSelecionada);
    const candidatoIdNum = Number(candidatoId);

    axios
      .get(`${API_FESTIVAL}/api/dashboard/notas/${candidatoIdNum}/${etapaIdNum}`)
      .then((res) => setNotas(res.data))
      .catch(() => setNotas(null));
  }, [etapaSelecionada, candidatoId]);

  const abrirModal = () => setModalAberto(true);
  const fecharModal = () => { setModalAberto(false); setMostrarPendencias(false); };

  const etapaSelecionadaNome = etapas.find(e => e.id === Number(etapaSelecionada))?.nome;

  const corrigirCriterio = (criterio) => {
    const mapa = {
      afinacao: "Afinação",
      ritmo: "Ritmo",
      interpretacao: "Interpretação",
      autenticidade: "Autenticidade",
      "diccao/pronuncia": "Dicção/Pronúncia",
      "presenca de palco": "Presença de Palco",
    };
    if (!criterio) return "";
    const chave = criterio.toLowerCase();
    return mapa[chave] || criterio.charAt(0).toUpperCase() + criterio.slice(1);
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    const name = e.target.name;
    setFormData(prev => ({ ...prev, [name]: file }));
    if (name === "foto" && file) setPreviewFoto(URL.createObjectURL(file));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const data = new FormData();
    for (let campo in formData) data.append(campo, formData[campo]);

    try {
      await axios.put(`${API_FESTIVAL}/api/inscricoes/${candidatoId}`, data);
      toast.success("Dados atualizados com sucesso!");
      setTimeout(() => window.location.reload(), 2000);
    } catch (err) {
      toast.error("Erro ao atualizar seus dados.");
      console.error(err);
    }
  };

  return (
    <div className="areaC-wrap">
      <ToastContainer position="top-center" autoClose={3000} />

      {/* ===== Header ===== */}
      <header className="areaC-header gradient-anim">
        <div className="areaC-head-left">
          <img
            src={
              candidato?.foto
                ? `${API_FESTIVAL}/${String(candidato.foto).replace(/^\/?uploads/, "uploads")}`
                : "/img/exemplo-perfil.jpg"
            }
            alt="Foto perfil"
            className="areaC-avatar"
            onError={(e) => (e.currentTarget.src = "/img/exemplo-perfil.jpg")}
          />
          <div className="areaC-ident">
            <h2>{candidato?.nome || "Nome do Candidato"}</h2>
            <span className="areaC-pill">{candidato?.eliminado ? "eliminado" : (candidato?.fase_atual || "fase")}</span>
          </div>
        </div>

        <div className="areaC-head-actions">
          <a
            className="btn-regulamento"
            href="/docs/GospelTalentRegulamento.pdf"
            download
            target="_blank"
            rel="noopener noreferrer"
          >
            Regulamento do Festival
          </a>

          <button
            className={`btn-atualizar ${pendencias.length > 0 ? "btn-atualizar--alert" : ""}`}
            onClick={abrirModal}
            title={pendencias.length > 0 ? "Há informações pendentes" : "Atualizar meus dados"}
          >
            {pendencias.length > 0 ? "⚠ Atualizar meus dados" : "Atualizar meus dados"}
          </button>
        </div>
      </header>

      {/* ===== Conteúdo ===== */}
      <main className="areaC-main">
        <div className="areaC-card">
          <div className="areaC-card-head">
            <h3>Tabela de Notas</h3>
            <p>Escolha a etapa para visualizar:</p>

            <div className="areaC-select-wrap">
              <select
                className="areaC-select"
                value={etapaSelecionada || ""}
                onChange={(e) => setEtapaSelecionada(e.target.value)}
              >
                {etapasExibidas
                  .filter(etapa =>
                    !["classificados", "segunda fase"].includes(etapa.nome.toLowerCase())
                  )
                  .map((etapa) => (
                    <option key={etapa.id} value={etapa.id}>{etapa.nome}</option>
                  ))}
              </select>
              <span className="chev">▾</span>
            </div>
          </div>

          {/* AVISO de scroll horizontal apenas no mobile */}
          <p className="areaC-scroll-hint">Arraste a tabela para o lado para ver todas as colunas.</p>

          {/* Classificatória (binário) */}
          {etapaSelecionadaNome?.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase() === "classificatoria" ? (
            <>
              {["1", 1, true, "true"].includes(candidato?.eliminado) && votosBinarios.some(v => v.aprovado === "nao") ? (
                <div className="areaC-alert-eliminado">
                  <p>❌ Você foi eliminado nesta etapa. Veja abaixo o motivo:</p>
                  {votosBinarios
                    .filter(v => v.aprovado === "nao")
                    .map((voto, i) => (
                      <div key={i} className="areaC-elim-item">
                        <img src={`${API_FESTIVAL}/${voto.foto_jurado}`} alt={voto.nome_jurado} />
                        <div>
                          <strong>{voto.nome_jurado}</strong>
                          <p className="rej">Reprovado</p>
                          <p className="justificativa">{voto.justificativa || "Sem justificativa informada"}</p>
                        </div>
                      </div>
                    ))}
                </div>
              ) : votosBinarios.length > 0 ? (
                <div className="areaC-tableBin">
                  <div className="tHead">
                    <span>Jurado</span>
                    <span>Status</span>
                  </div>
                  {votosBinarios
                    .filter((v) => v.aprovado === "sim")
                    .map((voto, i) => (
                      <div key={i} className="tRow">
                        <div className="jurado">
                          <img src={`${API_FESTIVAL}/${voto.foto_jurado}`} alt="jurado" />
                          <strong>{voto.nome_jurado}</strong>
                        </div>
                        <div className="status ok">✅ Aprovado</div>
                      </div>
                    ))}
                </div>
              ) : (
                <p className="areaC-wait">Você ainda será avaliado, aguarde…</p>
              )}
            </>
          ) : (
            // Notas por critérios
            <>
              {notas?.jurados?.length > 0 ? (
                <div className="notaTable-wrap">
                  <div className="notaTable head">
                    <div className="cell jurado">Jurado</div>
                    {notas.jurados[0]?.criterios.map((c, i) => (
                      <div key={i} className="cell">{corrigirCriterio(c.criterio)}</div>
                    ))}
                    <div className="cell media">Média</div>
                  </div>

                  {notas.jurados.map((jurado, i) => {
                    const total = jurado.criterios.reduce((s, c) => s + Number(c.nota || 0), 0);
                    const media = total / jurado.criterios.length;
                    return (
                      <div key={i} className="notaTable row">
                        <div className="cell jurado">
                          <img src={`${API_FESTIVAL}/${jurado.foto_jurado}`} alt="jurado" />
                          <span>{jurado.nome_jurado}</span>
                        </div>
                        {jurado.criterios.map((c, j) => (
                          <div key={j} className="cell cell-note">
                            {c.nota ?? "--"}
                            {c.justificativa?.trim() && (
                              <span className="tt-ico">
                                ⓘ
                                <span className="tt">{c.justificativa}</span>
                              </span>
                            )}
                          </div>
                        ))}
                        <div className="cell media">
                          <span className="badge">{media.toFixed(1)}</span>
                        </div>
                      </div>
                    );
                  })}

                  {/* Voto popular */}
                  <div className="notaTable row popular">
                    <div className="cell jurado"><strong>Voto Popular</strong></div>
                    {[...Array(notas.jurados[0]?.criterios.length || 0)].map((_, i) => (
                      <div className="cell" key={i}>–</div>
                    ))}
                    <div className="cell media">
                      <span className="badge green">{notas?.popular ?? "--"}</span>
                    </div>
                  </div>

                  {/* Média Geral */}
                  <div className="notaTable foot">
                    <div className="cell jurado"><strong>MÉDIA GERAL</strong></div>
                    {[...Array(notas.jurados[0]?.criterios.length || 0)].map((_, i) => (
                      <div className="cell" key={i}>–</div>
                    ))}
                    <div className="cell media">
                      <span className="badge indigo">
                        {(
                          notas.jurados.reduce((soma, jur) =>
                            soma + jur.criterios.reduce((s, c) => s + Number(c.nota || 0), 0) / jur.criterios.length, 0
                          ) / notas.jurados.length
                        ).toFixed(1)}
                      </span>
                    </div>
                  </div>
                </div>
              ) : (
                <p className="areaC-wait">Você ainda será avaliado(a), aguarde…</p>
              )}
            </>
          )}
        </div>
      </main>

      {/* ===== Modal ===== */}
      {modalAberto && (
  <div className="modal-overlay" onClick={fecharModal}>
    <div className="modal-sheet" onClick={(e) => e.stopPropagation()}>
      
      {/* Fechar */}
      <button className="modal-close" onClick={fecharModal} aria-label="Fechar modal">✕</button>

      {/* Título */}
      <h3 className="modal-title">Atualizar Meus Dados</h3>

      {/* Foto atual */}
      <div className="modal-avatar-wrap">
        <p className="modal-subtle">Foto de Perfil Atual:</p>
        <img
          src={
            previewFoto
              ? previewFoto
              : candidato?.foto
              ? `${API_FESTIVAL}/${String(candidato.foto).replace(/^\/?uploads/, "uploads")}`
              : "/img/exemplo-perfil.jpg"
          }
          alt="Foto de perfil"
          className="modal-avatar"
          onError={(e) => (e.currentTarget.src = "/img/exemplo-perfil.jpg")}
        />
      </div>

      <form onSubmit={handleSubmit} encType="multipart/form-data" className="modal-form">

        {/* Input de arquivo com estilo roxo */}
        <div className="modal-field">
          <label className="modal-label">Atualizar Foto de Perfil:</label>
          <input
            type="file"
            name="foto"
            accept="image/*"
            onChange={handleFileChange}
            className="file-input"
          />
        </div>

        <div className="modal-field">
          <label className="modal-label">Nome Completo:</label>
          <input
            className="modal-input"
            name="nome"
            value={formData.nome}
            onChange={handleInputChange}
            placeholder="Nome Completo"
            required
          />
        </div>

        <div className="modal-field">
          <label className="modal-label">Nome Artístico:</label>
          <input
            className="modal-input"
            name="nome_artistico"
            value={formData.nome_artistico}
            onChange={handleInputChange}
            placeholder="Nome Artístico"
          />
        </div>

        <div className="modal-field">
          <label className="modal-label">Telefone:</label>
          <input
            className="modal-input"
            name="telefone"
            value={formData.telefone}
            onChange={handleInputChange}
            placeholder="(00) 00000-0000"
          />
        </div>

        <div className="modal-field">
          <label className="modal-label">E-mail:</label>
          <input
            className="modal-input modal-input--readonly"
            name="email"
            value={candidato?.email || ""}
            placeholder="E-mail"
            readOnly
          />
        </div>

        <div className="modal-field">
          <label className="modal-label">CPF:</label>
          <input
            className="modal-input modal-input--readonly"
            name="cpf"
            value={formData.cpf}
            placeholder="CPF"
            readOnly={!!formData.cpf}
            onChange={handleInputChange}
          />
        </div>

        {/* Troque o campo Endereço por Música */}
        <div className="modal-field">
          <label className="modal-label">Música:</label>
          <input
            className="modal-input"
            name="musica"
            value={formData.musica || ""}
            onChange={handleInputChange}
            placeholder="Nome da Música"
          />
        </div>

        <div className="modal-actions">
          <button type="submit" className="modal-save">Salvar</button>
        </div>
      </form>
    </div>
  </div>
)}


    </div>
  );
};

export default AreaDoCandidato;
