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

        const camposObrigatorios = [
          "telefone", "rg", "cpf", "musica", "video",
          "rg_arquivo", "cpf_arquivo", "certidao_municipal_arquivo",
          "certidao_federal_arquivo", "comprovante_residencia_arquivo",
          "espelho_conta_bancaria_arquivo", "letra_musica_arquivo"
        ];
        const pend = camposObrigatorios.filter(c => !res.data[c]);
        setPendencias(pend);
      })
      .catch(() => setCandidato(null));

    axios.get(`${API_FESTIVAL}/api/inscricoes/etapas`)
      .then(res => setEtapas(res.data))
      .catch(() => setEtapas([]));
  }, [candidatoId]);

  const etapasExibidas = useMemo(() => {
    if (!candidato || !etapas.length) return [];
    if (candidato.fase_atual === "classificado") return [];
    const indexAtual = etapas.findIndex(e => e.nome === candidato.fase_atual);
    return etapas.slice(0, indexAtual + 1);
  }, [etapas, candidato]);

  useEffect(() => {
    if (etapasExibidas.length > 0 && !etapaSelecionada) {
      setEtapaSelecionada(etapasExibidas[0].id);
    }
  }, [etapasExibidas, etapaSelecionada]);

  useEffect(() => {
    if (!etapaSelecionada || !candidatoId) return;

    axios.get(`${API_FESTIVAL}/api/inscricoes/notas/${candidatoId}/${etapaSelecionada}`)
      .then(res => setNotas(res.data))
      .catch(() => setNotas(null));

    axios.get(`${API_FESTIVAL}/api/jurados/votos-binarios/${candidatoId}/${etapaSelecionada}`)
      .then(res => setVotosBinarios(res.data))
      .catch(() => setVotosBinarios([]));
  }, [etapaSelecionada, candidatoId]);

  const abrirModal = () => setModalAberto(true);
  const fecharModal = () => {
    setModalAberto(false);
    setMostrarPendencias(false);
  };

  const etapaSelecionadaNome = etapas.find(e => e.id == etapaSelecionada)?.nome;

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleFileChange = (e) => {
    setFormData(prev => ({ ...prev, [e.target.name]: e.target.files[0] }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const data = new FormData();
    for (let campo in formData) {
      data.append(campo, formData[campo]);
    }

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
    <div className="area-candidato-container">
      <header className="area-candidato-header">
        <div className="perfil">
          <img
            src={candidato?.foto ? `${API_FESTIVAL}/${candidato.foto.replace(/^\/?uploads/, "uploads")}` : "/img/exemplo-perfil.jpg"}
            alt="Foto perfil"
            className="foto-perfil"
            onError={(e) => (e.target.src = "/img/exemplo-perfil.jpg")}
          />
          <div>
            <h2>{candidato?.nome || "Nome do Candidato"}</h2>
            <p>{candidato?.eliminado ? "❌ Eliminado" : (candidato?.fase_atual || "Fase atual")}</p>
          </div>
        </div>
        <button
          className={`botao-atualizar ${pendencias.length > 0 ? "alerta-pendencia" : ""}`}
          onClick={abrirModal}
        >
          {pendencias.length > 0 ? "⚠ Atualizar meus dados" : "Atualizar meus dados"}
        </button>
      </header>

      <main className="area-candidato-main">
        <h3>Tabela de Notas</h3>

        {candidato?.fase_atual === "classificado" ? (
          <div className="mensagem-avaliacao">
            ✅ Sua inscrição foi classificada! Agora, aguarde o resultado da sua avaliação.
          </div>
        ) : (
          <>
            <p>Escolha a etapa para visualizar:</p>
            <select
              className="select-etapa"
              value={etapaSelecionada || ""}
              onChange={(e) => setEtapaSelecionada(e.target.value)}
            >
              {etapasExibidas
                .filter(etapa => etapa.nome.toLowerCase() !== "classificado")
                .map((etapa) => (
                  <option key={etapa.id} value={etapa.id}>{etapa.nome}</option>
                ))}
            </select>

            {etapaSelecionadaNome === "classificado" ? null : (
              <>
                {(votosBinarios.length === 0 && (!notas?.jurados || notas.jurados.length === 0)) ? (
                  candidato?.eliminado ? (
                    <div className="tabela-notas" style={{ marginTop: "2rem", backgroundColor: "#ffe0e0" }}>
                      <div className="cabecalho-tabela">
                        <span>Jurado</span>
                        <span>Status</span>
                        <span>Justificativa</span>
                      </div>
                      {votosBinarios.map((voto, index) => (
                        <div key={index} className="linha-criterio">
                          <div className="bloco-jurado">
                            <img src={`${API_FESTIVAL}/${voto.foto_jurado}`} alt="jurado" />
                            <strong>{voto.nome_jurado}</strong>
                          </div>
                          <div className="notas-linha" style={{ justifyContent: "center" }}>
                            <span>{voto.aprovado === "sim" ? "✅ Aprovado" : "❌ Reprovado"}</span>
                          </div>
                          <div className="notas-linha" style={{ justifyContent: "center" }}>
                            <span style={{ fontStyle: "italic" }}>
                              {voto.aprovado === "nao" ? voto.justificativa || "Sem justificativa" : "-"}
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p style={{ marginTop: "2rem", fontWeight: "bold", color: "#7d27db" }}>
                      Você ainda está sendo avaliado, aguarde...
                    </p>
                  )
                ) : (
                  <div className="tabela-notas">
                    <div className="cabecalho-tabela">
                      <span>Afinação</span>
                      <span>Presença de Palco</span>
                      <span>Melodia e Harmonia</span>
                      <span>Ritmo</span>
                      <span>Autenticidade</span>
                      <span>Dição/Pronúncia</span>
                      <span>Nota Total</span>
                    </div>

                    {etapaSelecionadaNome === "classificatória" ? (
                      votosBinarios.map((voto, index) => (
                        <div key={index} className="linha-criterio binario">
                          <div className="bloco-jurado binario">
                            <img src={`${API_FESTIVAL}/${voto.foto_jurado}`} alt="jurado" />
                            <strong>{voto.nome_jurado}</strong>
                          </div>
                          <div className="bloco-binario-texto">
                            <p>{voto.aprovado === "sim" ? "✅ Aprovado" : "❌ Reprovado"}</p>
                            {voto.aprovado === "nao" && voto.justificativa && (
                              <small><em>{voto.justificativa}</em></small>
                            )}
                          </div>
                        </div>
                      ))
                    ) : (
                      <>
                        {notas?.jurados?.map((nota, index) => (
                          <div key={index} className={`linha-criterio jurado${index + 1}`}>
                            <div className="bloco-jurado">
                              <img src={`${API_FESTIVAL}/${nota.foto_jurado}`} alt="jurado" />
                              <strong>{nota.nome_jurado}</strong>
                            </div>
                            <div className="notas-linha">
                              {nota.criterios.map((c, i) => (
                                <span key={i}>{c.criterio}: {c.nota}</span>
                              ))}
                              <strong>{nota.total}</strong>
                            </div>
                          </div>
                        ))}
                        {notas?.popular !== undefined && (
                          <div className="linha-criterio popular">
                            <div className="bloco-jurado"><strong>Voto Popular</strong></div>
                            <div className="notas-linha"><span>{notas?.popular || 0} votos</span></div>
                          </div>
                        )}
                      </>
                    )}
                  </div>
                )}
              </>

            )}





          </>
        )}
      </main>

      {modalAberto && (
        <div className="modal-overlay" onClick={fecharModal}>
        <div className="modal-content-usuario" onClick={(e) => e.stopPropagation()}>

            <h3>Atualizar Meus Dados</h3>

            <form onSubmit={handleSubmit} encType="multipart/form-data">
              <input name="nome" value={formData.nome} onChange={handleInputChange} placeholder="Nome" required />
              <input name="telefone" value={formData.telefone} onChange={handleInputChange} placeholder="Telefone" />
              <input name="nome_artistico" value={formData.nome_artistico} onChange={handleInputChange} placeholder="Nome Artístico" />
              <input name="endereco" value={formData.endereco} onChange={handleInputChange} placeholder="Endereço" />
               <input
                  name="email"
                  value={candidato?.email || ""}
                  placeholder="E-mail"
                  readOnly
                  style={{ cursor: "not-allowed", backgroundColor: "#f3f3f3", color: "#888" }}
                />
                <input
                  name="rg"
                  value={formData.rg}
                  placeholder="RG"
                  readOnly={!!formData.rg}
                  onChange={handleInputChange}
                  style={formData.rg ? { cursor: "not-allowed", backgroundColor: "#f3f3f3", color: "#888" } : {}}
                />
                <input
                  name="cpf"
                  value={formData.cpf}
                  placeholder="CPF"
                  readOnly={!!formData.cpf}
                  onChange={handleInputChange}
                  style={formData.cpf ? { cursor: "not-allowed", backgroundColor: "#f3f3f3", color: "#888" } : {}}
                />
               
              <input name="musica" value={formData.musica} onChange={handleInputChange} placeholder="Música" />
              <input name="tempo_atividade" value={formData.tempo_atividade} onChange={handleInputChange} placeholder="Tempo de Atividade" />
              

              {mostrarPendencias && (
                <>
                  {pendencias.length === 0 ? (
                    <p style={{ color: "green", fontWeight: "bold", display: "flex", alignItems: "center", gap: "8px" }}>
                      <span></span>
                    </p>
                  ) : (
                    <>
                      {pendencias.includes("foto") && (
                        <label>Nova Foto: <input type="file" name="foto" onChange={handleFileChange} /></label>
                      )}
                      {pendencias.includes("video") && (
                        <label>Vídeo: <input type="file" name="video" onChange={handleFileChange} /></label>
                      )}
                      {pendencias.includes("rg_arquivo") && (
                        <label>RG: <input type="file" name="rg_arquivo" onChange={handleFileChange} /></label>
                      )}
                      {pendencias.includes("cpf_arquivo") && (
                        <label>CPF: <input type="file" name="cpf_arquivo" onChange={handleFileChange} /></label>
                      )}
                      {pendencias.includes("certidao_municipal_arquivo") && (
                        <label>Certidão Municipal: <input type="file" name="certidao_municipal_arquivo" onChange={handleFileChange} /></label>
                      )}
                      {pendencias.includes("certidao_federal_arquivo") && (
                        <label>Certidão Federal: <input type="file" name="certidao_federal_arquivo" onChange={handleFileChange} /></label>
                      )}
                      {pendencias.includes("comprovante_residencia_arquivo") && (
                        <label>Comprovante de Residência: <input type="file" name="comprovante_residencia_arquivo" onChange={handleFileChange} /></label>
                      )}
                      {pendencias.includes("espelho_conta_bancaria_arquivo") && (
                        <label>Espelho da Conta Bancária: <input type="file" name="espelho_conta_bancaria_arquivo" onChange={handleFileChange} /></label>
                      )}
                      {pendencias.includes("letra_musica_arquivo") && (
                        <label>Letra da Música: <input type="file" name="letra_musica_arquivo" onChange={handleFileChange} /></label>
                      )}
                    </>
                  )}
                </>
              )}

              <button type="submit">Salvar</button>
            </form>


            <button onClick={(  ) => setMostrarPendencias(p => !p)} style={{ marginTop: "1rem" }}>
              {mostrarPendencias ? "Ocultar Pendências" : "Ver Pendências"}
            </button>

            {mostrarPendencias && (
              <ul style={{ textAlign: "left", marginTop: "0.5rem" }}>
                {pendencias.length === 0
                  ? <li>✅ Você não possui pendências.</li>
                  : pendencias.map((p, i) => <li key={i}>⚠ Documento faltando: {p.replace(/_/g, " ")}</li>)}
              </ul>
            )}
          </div>
        </div>
      )}

      <ToastContainer position="top-center" autoClose={3000} />
  <FooterFestival />
    </div>
  );
};

export default AreaDoCandidato;
